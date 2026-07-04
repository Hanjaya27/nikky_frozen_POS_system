<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockHistory;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with('branch:id,name,code')
            ->orderBy('id', 'desc');

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($item) use ($search) {
                $item->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        $products = $query->get();

        return response()->json([
            'success' => true,
            'message' => 'Data produk berhasil diambil.',
            'data' => $products,
        ]);
    }

    public function show($id)
    {
        $product = Product::with('branch:id,name,code')->find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail produk berhasil diambil.',
            'data' => $product,
        ]);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'branch_id' => ['required', 'exists:branches,id'],
            'code' => ['required', 'string', 'max:50', 'unique:products,code'],
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:100'],
            'store_stock' => ['required', 'integer', 'min:0'],
            'warehouse_stock' => ['required', 'integer', 'min:0'],
            'price' => ['required', 'integer', 'min:0'],
            'expired_date' => ['nullable', 'date'],
            'storage_location' => ['nullable', 'string', 'max:100'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'status' => ['nullable', 'string', 'max:50'],
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $validatedData['image'] = $path;
        }

        $validatedData['status'] = $validatedData['status'] ?? 'Aktif';
        $validatedData['stock'] = $validatedData['store_stock'] + $validatedData['warehouse_stock'];
        $validatedData['min_stock'] = 0; 

        $product = Product::create($validatedData);

        StockHistory::create([
            'product_id' => $product->id,
            'branch_id' => $product->branch_id,
            'user_id' => $request->user_id,
            'type' => 'product_created',
            'quantity' => $product->stock,
            'before_store_stock' => 0,
            'after_store_stock' => $product->store_stock,
            'before_warehouse_stock' => 0,
            'after_warehouse_stock' => $product->warehouse_stock,
            'note' => 'Produk baru ditambahkan',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil ditambahkan.',
            'data' => $product->load('branch:id,name,code'),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        // Pastikan hanya bisa mengedit produk cabangnya sendiri
        if ($request->filled('branch_id') && $product->branch_id != $request->branch_id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk mengubah data cabang lain.',
            ], 403);
        }

        $validatedData = $request->validate([
            'branch_id' => ['required', 'exists:branches,id'],
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('products', 'code')->ignore($product->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:100'],
            'store_stock' => ['required', 'integer', 'min:0'],
            'warehouse_stock' => ['required', 'integer', 'min:0'],
            'price' => ['required', 'integer', 'min:0'],
            'expired_date' => ['nullable', 'date'],
            'storage_location' => ['nullable', 'string', 'max:100'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'status' => ['nullable', 'string', 'max:50'],
        ]);

        if ($request->hasFile('image')) {
            if ($product->image) {
                Storage::disk('public')->delete($product->image);
            }
            $path = $request->file('image')->store('products', 'public');
            $validatedData['image'] = $path;
        }

        $validatedData['status'] = $validatedData['status'] ?? 'Aktif';
        $validatedData['stock'] = $validatedData['store_stock'] + $validatedData['warehouse_stock'];

        $beforeStoreStock = $product->store_stock;
        $beforeWarehouseStock = $product->warehouse_stock;

        $product->update($validatedData);

        if ($beforeStoreStock != $product->store_stock || $beforeWarehouseStock != $product->warehouse_stock) {
            StockHistory::create([
                'product_id' => $product->id,
                'branch_id' => $product->branch_id,
                'user_id' => $request->user_id,
                'type' => 'product_updated',
                'quantity' => ($product->store_stock + $product->warehouse_stock) - ($beforeStoreStock + $beforeWarehouseStock),
                'before_store_stock' => $beforeStoreStock,
                'after_store_stock' => $product->store_stock,
                'before_warehouse_stock' => $beforeWarehouseStock,
                'after_warehouse_stock' => $product->warehouse_stock,
                'note' => 'Update data produk',
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil diperbarui.',
            'data' => $product->load('branch:id,name,code'),
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        if ($request->filled('branch_id') && $product->branch_id != $request->branch_id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk menghapus data cabang lain.',
            ], 403);
        }

        if ($product->image) {
            Storage::disk('public')->delete($product->image);
        }

        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil dihapus.',
        ]);
    }

    public function mutateStock(Request $request, $id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        if ($request->filled('branch_id') && $product->branch_id != $request->branch_id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk memutasi stok cabang lain.',
            ], 403);
        }

        $validatedData = $request->validate([
            'amount' => ['required', 'integer', 'min:1'],
        ]);

        $amount = $validatedData['amount'];

        if ($product->warehouse_stock < $amount) {
            return response()->json([
                'success' => false,
                'message' => 'Stok gudang tidak mencukupi untuk mutasi sejumlah ' . $amount,
            ], 422);
        }

        $beforeStoreStock = $product->store_stock;
        $beforeWarehouseStock = $product->warehouse_stock;

        $product->warehouse_stock -= $amount;
        $product->store_stock += $amount;
        $product->stock = $product->store_stock + $product->warehouse_stock;
        
        $product->save();

        StockHistory::create([
            'product_id' => $product->id,
            'branch_id' => $product->branch_id,
            'user_id' => $request->user_id,
            'type' => 'mutation_to_store',
            'quantity' => $amount,
            'before_store_stock' => $beforeStoreStock,
            'after_store_stock' => $product->store_stock,
            'before_warehouse_stock' => $beforeWarehouseStock,
            'after_warehouse_stock' => $product->warehouse_stock,
            'note' => 'Mutasi dari gudang ke toko',
        ]);

        return response()->json([
            'success' => true,
            'message' => "Mutasi stok sebesar {$amount} berhasil dipindahkan ke toko.",
            'data' => $product,
        ]);
    }

    public function restockWarehouse(Request $request, $id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        if ($request->filled('branch_id') && $product->branch_id != $request->branch_id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk menambah stok cabang lain.',
            ], 403);
        }

        $validatedData = $request->validate([
            'amount' => ['required', 'integer', 'min:1'],
        ]);

        $amount = $validatedData['amount'];
        $beforeStoreStock = $product->store_stock;
        $beforeWarehouseStock = $product->warehouse_stock;

        $product->warehouse_stock += $amount;
        $product->stock = $product->store_stock + $product->warehouse_stock;
        $product->save();

        StockHistory::create([
            'product_id' => $product->id,
            'branch_id' => $product->branch_id,
            'user_id' => $request->user_id,
            'type' => 'restock_warehouse',
            'quantity' => $amount,
            'before_store_stock' => $beforeStoreStock,
            'after_store_stock' => $product->store_stock,
            'before_warehouse_stock' => $beforeWarehouseStock,
            'after_warehouse_stock' => $product->warehouse_stock,
            'note' => 'Restock stok gudang',
        ]);

        return response()->json([
            'success' => true,
            'message' => "Restock sebesar {$amount} berhasil ditambahkan ke gudang.",
            'data' => $product,
        ]);
    }

    public function adjustStock(Request $request, $id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        if ($request->filled('branch_id') && $product->branch_id != $request->branch_id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk mengoreksi stok cabang lain.',
            ], 403);
        }

        $validatedData = $request->validate([
            'store_stock' => ['required', 'integer', 'min:0'],
            'warehouse_stock' => ['required', 'integer', 'min:0'],
            'note' => ['nullable', 'string', 'max:255'],
            'user_id' => ['required']
        ]);

        $beforeStoreStock = $product->store_stock;
        $beforeWarehouseStock = $product->warehouse_stock;
        
        $newStoreStock = $validatedData['store_stock'];
        $newWarehouseStock = $validatedData['warehouse_stock'];

        if ($beforeStoreStock != $newStoreStock || $beforeWarehouseStock != $newWarehouseStock) {
            $product->store_stock = $newStoreStock;
            $product->warehouse_stock = $newWarehouseStock;
            $product->stock = $newStoreStock + $newWarehouseStock;
            $product->save();
            
            $quantityDiff = ($newStoreStock + $newWarehouseStock) - ($beforeStoreStock + $beforeWarehouseStock);

            StockHistory::create([
                'product_id' => $product->id,
                'branch_id' => $product->branch_id,
                'user_id' => $validatedData['user_id'],
                'type' => 'stock_adjustment',
                'quantity' => $quantityDiff,
                'before_store_stock' => $beforeStoreStock,
                'after_store_stock' => $newStoreStock,
                'before_warehouse_stock' => $beforeWarehouseStock,
                'after_warehouse_stock' => $newWarehouseStock,
                'note' => $validatedData['note'] ?? 'Koreksi Stok Fisik',
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Koreksi stok berhasil disimpan.',
            'data' => $product,
        ]);
    }

    public function transferStock(Request $request, $id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Produk asal tidak ditemukan.',
            ], 404);
        }

        if ($request->filled('branch_id') && $product->branch_id != $request->branch_id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk mentransfer stok cabang lain.',
            ], 403);
        }

        $validatedData = $request->validate([
            'target_branch_id' => ['required', 'exists:branches,id'],
            'amount' => ['required', 'integer', 'min:1'],
            'note' => ['nullable', 'string', 'max:255'],
            'user_id' => ['required']
        ]);

        if ($validatedData['target_branch_id'] == $product->branch_id) {
            return response()->json([
                'success' => false,
                'message' => 'Cabang tujuan tidak boleh sama dengan cabang asal.',
            ], 422);
        }

        $amount = $validatedData['amount'];

        if ($product->warehouse_stock < $amount) {
            return response()->json([
                'success' => false,
                'message' => 'Stok gudang tidak mencukupi untuk transfer sejumlah ' . $amount,
            ], 422);
        }

        $targetProduct = Product::where('name', $product->name)
            ->where('category', $product->category)
            ->where('branch_id', $validatedData['target_branch_id'])
            ->first();

        if (!$targetProduct) {
            return response()->json([
                'success' => false,
                'message' => 'Produk belum tersedia di cabang tujuan. Tambahkan produk terlebih dahulu.',
            ], 422);
        }

        $sourceBeforeWarehouseStock = $product->warehouse_stock;
        $targetBeforeWarehouseStock = $targetProduct->warehouse_stock;

        // Update Source Product
        $product->warehouse_stock -= $amount;
        $product->stock = $product->store_stock + $product->warehouse_stock;
        $product->save();

        // Update Target Product
        $targetProduct->warehouse_stock += $amount;
        $targetProduct->stock = $targetProduct->store_stock + $targetProduct->warehouse_stock;
        $targetProduct->save();

        // Record History for Source
        StockHistory::create([
            'product_id' => $product->id,
            'branch_id' => $product->branch_id,
            'user_id' => $validatedData['user_id'],
            'type' => 'transfer_out',
            'quantity' => $amount,
            'before_store_stock' => $product->store_stock,
            'after_store_stock' => $product->store_stock,
            'before_warehouse_stock' => $sourceBeforeWarehouseStock,
            'after_warehouse_stock' => $product->warehouse_stock,
            'note' => $validatedData['note'] ?? 'Transfer keluar ke cabang tujuan',
        ]);

        // Record History for Target
        StockHistory::create([
            'product_id' => $targetProduct->id,
            'branch_id' => $targetProduct->branch_id,
            'user_id' => $validatedData['user_id'],
            'type' => 'transfer_in',
            'quantity' => $amount,
            'before_store_stock' => $targetProduct->store_stock,
            'after_store_stock' => $targetProduct->store_stock,
            'before_warehouse_stock' => $targetBeforeWarehouseStock,
            'after_warehouse_stock' => $targetProduct->warehouse_stock,
            'note' => $validatedData['note'] ?? 'Transfer masuk dari cabang asal',
        ]);

        return response()->json([
            'success' => true,
            'message' => "Transfer sebesar {$amount} berhasil dikirim ke cabang tujuan.",
            'data' => $product,
        ]);
    }

    public function batchStock(Request $request)
    {
        $validatedData = $request->validate([
            'branch_id' => ['required'],
            'user_id' => ['required'],
            'action' => ['required', 'in:batch_restock,batch_mutation_to_store,batch_transfer_branch,batch_stock_adjustment'],
            'target_branch_id' => ['required_if:action,batch_transfer_branch', 'exists:branches,id'],
            'note' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.amount' => ['required_if:action,batch_restock,batch_mutation_to_store,batch_transfer_branch', 'integer', 'min:1'],
            'items.*.store_stock' => ['required_if:action,batch_stock_adjustment', 'integer', 'min:0'],
            'items.*.warehouse_stock' => ['required_if:action,batch_stock_adjustment', 'integer', 'min:0'],
        ]);

        $branchId = $validatedData['branch_id'];
        $action = $validatedData['action'];
        $userId = $validatedData['user_id'];
        $items = $validatedData['items'];
        $targetBranchId = $validatedData['target_branch_id'] ?? null;
        $note = $validatedData['note'] ?? null;

        \Illuminate\Support\Facades\Log::info("BATCH STOCK VALIDATED DATA: ", $validatedData);
        \Illuminate\Support\Facades\Log::info("BATCH STOCK RAW REQUEST: ", $request->all());

        // Manual validation for items based on action
        foreach ($items as $idx => $item) {
            if ($action === 'batch_stock_adjustment') {
                if (!isset($item['store_stock']) || !is_numeric($item['store_stock']) || $item['store_stock'] < 0) {
                    return response()->json(['success' => false, 'message' => "Stok toko fisik tidak valid pada salah satu item."], 422);
                }
                if (!isset($item['warehouse_stock']) || !is_numeric($item['warehouse_stock']) || $item['warehouse_stock'] < 0) {
                    return response()->json(['success' => false, 'message' => "Stok gudang fisik tidak valid pada salah satu item."], 422);
                }
            } else {
                if (!isset($item['amount']) || !is_numeric($item['amount']) || $item['amount'] < 1) {
                    return response()->json(['success' => false, 'message' => "Jumlah (amount) tidak valid pada salah satu item."], 422);
                }
            }
        }

        \Illuminate\Support\Facades\DB::beginTransaction();

        try {
            foreach ($items as $item) {
                $product = Product::lockForUpdate()->find($item['product_id']);

                if (!$product) {
                    throw new \Exception("Produk dengan ID {$item['product_id']} tidak ditemukan.");
                }

                if ($product->branch_id != $branchId) {
                    throw new \Exception("Anda tidak memiliki akses untuk memproses produk '{$product->name}'.");
                }

                $beforeStoreStock = $product->store_stock;
                $beforeWarehouseStock = $product->warehouse_stock;

                if ($action === 'batch_stock_adjustment') {
                    $newStoreStock = $item['store_stock'];
                    $newWarehouseStock = $item['warehouse_stock'];

                    $product->store_stock = $newStoreStock;
                    $product->warehouse_stock = $newWarehouseStock;
                    $product->stock = $newStoreStock + $newWarehouseStock;
                    $product->save();

                    StockHistory::create([
                        'product_id' => $product->id,
                        'branch_id' => $product->branch_id,
                        'user_id' => $userId,
                        'type' => 'stock_adjustment',
                        'quantity' => 0,
                        'before_store_stock' => $beforeStoreStock,
                        'after_store_stock' => $product->store_stock,
                        'before_warehouse_stock' => $beforeWarehouseStock,
                        'after_warehouse_stock' => $product->warehouse_stock,
                        'note' => $note ?? 'Batch Koreksi Stok',
                    ]);

                } elseif ($action === 'batch_mutation_to_store') {
                    $amount = $item['amount'];
                    if ($product->warehouse_stock < $amount) {
                        throw new \Exception("Stok gudang '{$product->name}' tidak mencukupi untuk ditransfer. Tersedia: {$product->warehouse_stock}, Diminta: {$amount}");
                    }

                    $product->warehouse_stock -= $amount;
                    $product->store_stock += $amount;
                    $product->stock = $product->store_stock + $product->warehouse_stock;
                    $product->save();

                    StockHistory::create([
                        'product_id' => $product->id,
                        'branch_id' => $product->branch_id,
                        'user_id' => $userId,
                        'type' => 'mutation_to_store',
                        'quantity' => $amount,
                        'before_store_stock' => $beforeStoreStock,
                        'after_store_stock' => $product->store_stock,
                        'before_warehouse_stock' => $beforeWarehouseStock,
                        'after_warehouse_stock' => $product->warehouse_stock,
                        'note' => $note ?? 'Batch Mutasi Gudang ke Toko',
                    ]);

                } elseif ($action === 'batch_transfer_branch') {
                    $amount = $item['amount'];
                    if ($product->warehouse_stock < $amount) {
                        throw new \Exception("Stok gudang '{$product->name}' tidak mencukupi untuk ditransfer. Tersedia: {$product->warehouse_stock}, Diminta: {$amount}");
                    }

                    $targetProduct = Product::where('name', $product->name)
                        ->where('category', $product->category)
                        ->where('branch_id', $targetBranchId)
                        ->first();

                    if (!$targetProduct) {
                        throw new \Exception("Produk '{$product->name}' belum tersedia di cabang tujuan.");
                    }

                    $targetBeforeWarehouseStock = $targetProduct->warehouse_stock;

                    // Source
                    $product->warehouse_stock -= $amount;
                    $product->stock = $product->store_stock + $product->warehouse_stock;
                    $product->save();

                    // Target
                    $targetProduct->warehouse_stock += $amount;
                    $targetProduct->stock = $targetProduct->store_stock + $targetProduct->warehouse_stock;
                    $targetProduct->save();

                    StockHistory::create([
                        'product_id' => $product->id,
                        'branch_id' => $product->branch_id,
                        'user_id' => $userId,
                        'type' => 'transfer_out',
                        'quantity' => $amount,
                        'before_store_stock' => $product->store_stock,
                        'after_store_stock' => $product->store_stock,
                        'before_warehouse_stock' => $beforeWarehouseStock,
                        'after_warehouse_stock' => $product->warehouse_stock,
                        'note' => $note ?? 'Batch Transfer Keluar',
                    ]);

                    StockHistory::create([
                        'product_id' => $targetProduct->id,
                        'branch_id' => $targetProduct->branch_id,
                        'user_id' => $userId,
                        'type' => 'transfer_in',
                        'quantity' => $amount,
                        'before_store_stock' => $targetProduct->store_stock,
                        'after_store_stock' => $targetProduct->store_stock,
                        'before_warehouse_stock' => $targetBeforeWarehouseStock,
                        'after_warehouse_stock' => $targetProduct->warehouse_stock,
                        'note' => clone $note ? ($note . " (dari cabang asal)") : 'Batch Transfer Masuk',
                    ]);

                } elseif ($action === 'batch_restock') {
                    $amount = $item['amount'];
                    $product->warehouse_stock += $amount;
                    $product->stock = $product->store_stock + $product->warehouse_stock;
                    $product->save();

                    StockHistory::create([
                        'product_id' => $product->id,
                        'branch_id' => $product->branch_id,
                        'user_id' => $userId,
                        'type' => 'restock_warehouse',
                        'quantity' => $amount,
                        'before_store_stock' => $beforeStoreStock,
                        'after_store_stock' => $product->store_stock,
                        'before_warehouse_stock' => $beforeWarehouseStock,
                        'after_warehouse_stock' => $product->warehouse_stock,
                        'note' => $note ?? 'Batch Restock Gudang',
                    ]);
                }
            }

            \Illuminate\Support\Facades\DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Proses batch stok berhasil.',
            ]);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
