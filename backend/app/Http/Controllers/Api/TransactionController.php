<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockHistory;
use App\Models\Transaction;
use App\Models\Shift;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $query = Transaction::with([
            'branch:id,name,code',
            'items',
        ])->orderBy('id', 'desc');

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->filled('username')) {
            $query->where('username', $request->username);
        }

        if ($request->filled('date')) {
            $query->whereDate('transaction_date', $request->date);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $perPage = $request->query('per_page', 10);
        $transactions = $query->get();

        $summaryQuery = clone $query;

        $totalReceipts = (clone $summaryQuery)->count();
        $totalSales = (clone $summaryQuery)->sum('grand_total');
        $cashTotal = (clone $summaryQuery)->where('payment_method', 'Tunai')->sum('grand_total');
        $qrisTotal = (clone $summaryQuery)->where('payment_method', 'QRIS')->sum('grand_total');
        $transferTotal = (clone $summaryQuery)->where('payment_method', 'Transfer')->sum('grand_total');
        $cashCount = (clone $summaryQuery)->where('payment_method', 'Tunai')->count();
        $qrisCount = (clone $summaryQuery)->where('payment_method', 'QRIS')->count();
        $transferCount = (clone $summaryQuery)->where('payment_method', 'Transfer')->count();

        return response()->json([
            'success' => true,
            'message' => 'Data transaksi berhasil diambil.',
            'data' => [
                'summary' => [
                    'total_receipts' => $totalReceipts,
                    'total_sales' => $totalSales,
                    'cash_total' => $cashTotal,
                    'qris_total' => $qrisTotal,
                    'transfer_total' => $transferTotal,
                    'cash_count' => $cashCount,
                    'qris_count' => $qrisCount,
                    'transfer_count' => $transferCount,
                ],
                'transactions' => $transactions,
            ],
        ]);
    }

    public function checkout(Request $request)
    {
        $validatedData = $request->validate([
            'branch_id' => ['required', 'exists:branches,id'],
            'cashier_name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:100'],
            'shift_name' => ['nullable', 'string', 'max:100'],
            'discount' => ['nullable', 'integer', 'min:0'],
            'tax_rate' => ['nullable', 'integer', 'min:0'],
            'payment_method' => ['required', 'string', 'max:50'],
            'paid_amount' => ['required', 'integer', 'min:0'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ]);

        try {
            $activeShift = Shift::where('username', $validatedData['username'])
                ->where('branch_id', $validatedData['branch_id'])
                ->where('status', 'Berjalan')
                ->latest('id')
                ->first();

            if (!$activeShift) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda belum membuka shift. Silakan buka shift terlebih dahulu sebelum melakukan transaksi.',
                ], 422);
            }

            $transaction = DB::transaction(function () use ($validatedData) {
                $subtotal = 0;
                $totalItem = 0;
                $itemsPayload = [];

                foreach ($validatedData['items'] as $item) {
                    $product = Product::where('id', $item['product_id'])
                        ->where('branch_id', $validatedData['branch_id'])
                        ->lockForUpdate()
                        ->first();

                    if (!$product) {
                        throw new \Exception('Produk tidak ditemukan pada cabang ini.');
                    }

                    if ($product->stock < $item['quantity']) {
                        throw new \Exception("Stok produk '{$product->name}' tidak cukup.");
                    }

                    $itemSubtotal = $product->price * $item['quantity'];

                    $subtotal += $itemSubtotal;
                    $totalItem += $item['quantity'];

                    $itemsPayload[] = [
                        'product' => $product,
                        'quantity' => $item['quantity'],
                        'subtotal' => $itemSubtotal,
                    ];
                }

                $discount = $validatedData['discount'] ?? 0;

                if ($discount > $subtotal) {
                    throw new \Exception('Diskon tidak boleh lebih besar dari subtotal.');
                }

                $taxRate = $validatedData['tax_rate'] ?? 11;
                $taxableAmount = $subtotal - $discount;
                $tax = round($taxableAmount * ($taxRate / 100));
                $grandTotal = $taxableAmount + $tax;

                if (
                    $validatedData['payment_method'] === 'Tunai' &&
                    $validatedData['paid_amount'] < $grandTotal
                ) {
                    throw new \Exception('Nominal pembayaran belum mencukupi.');
                }

                $invoiceNumber = $this->generateInvoiceNumber();

                $transaction = Transaction::create([
                    'branch_id' => $validatedData['branch_id'],
                    'invoice_number' => $invoiceNumber,
                    'cashier_name' => $validatedData['cashier_name'],
                    'username' => $validatedData['username'],
                    'shift_name' => $validatedData['shift_name'] ?? '-',
                    'total_item' => $totalItem,
                    'subtotal' => $subtotal,
                    'discount' => $discount,
                    'tax' => $tax,
                    'tax_rate' => $taxRate,
                    'grand_total' => $grandTotal,
                    'payment_method' => $validatedData['payment_method'],
                    'paid_amount' => $validatedData['paid_amount'],
                    'change_amount' => $validatedData['payment_method'] === 'Tunai'
                        ? $validatedData['paid_amount'] - $grandTotal
                        : 0,
                    'status' => 'Berhasil',
                    'transaction_date' => now(),
                ]);

                foreach ($itemsPayload as $itemPayload) {
                    $product = $itemPayload['product'];
                    $quantity = $itemPayload['quantity'];

                    $transaction->items()->create([
                        'product_id' => $product->id,
                        'product_code' => $product->code,
                        'product_name' => $product->name,
                        'category' => $product->category,
                        'price' => $product->price,
                        'quantity' => $quantity,
                        'subtotal' => $itemPayload['subtotal'],
                    ]);

                    $product->decrement('stock', $quantity);

                    StockHistory::create([
                        'product_id' => $product->id,
                        'branch_id' => $product->branch_id,
                        'user_id' => null,
                        'type' => 'sale',
                        'quantity' => $quantity,
                        'before_store_stock' => $product->stock + $quantity,
                        'after_store_stock' => $product->stock,
                        'before_warehouse_stock' => $product->warehouse_stock,
                        'after_warehouse_stock' => $product->warehouse_stock,
                        'note' => 'Penjualan kasir',
                    ]);
                }

                return $transaction->load([
                    'branch:id,name,code',
                    'items',
                ]);
            });

            return response()->json([
                'success' => true,
                'message' => 'Transaksi berhasil disimpan.',
                'data' => $transaction,
            ], 201);
        } catch (\Exception $error) {
            return response()->json([
                'success' => false,
                'message' => $error->getMessage(),
            ], 422);
        }
    }

    private function generateInvoiceNumber()
    {
        $date = now()->format('Ymd');
        $lastTransaction = Transaction::whereDate('created_at', now()->toDateString())
            ->latest('id')
            ->first();

        $nextNumber = $lastTransaction ? $lastTransaction->id + 1 : 1;

        return 'INV-' . $date . '-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }
}


