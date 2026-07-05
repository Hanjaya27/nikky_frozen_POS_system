<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Expense;
use App\Models\Product;
use App\Models\StockHistory;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\Request;

class OwnerDashboardController extends Controller
{
    public function index(Request $request)
    {
        try {
            $validated = $request->validate([
                'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
            ]);

            $branchId = $validated['branch_id'] ?? null;
            $today = Carbon::today();
            $soonUntil = Carbon::today()->addDays(14);
            $lowStockLimit = 5;

            $productQuery = Product::with('branch:id,name,code')
                ->where(function ($query) {
                    $query->whereNull('status')
                        ->orWhereRaw('LOWER(status) = ?', ['active'])
                        ->orWhereRaw('LOWER(status) = ?', ['aktif']);
                });

            if ($branchId) {
                $productQuery->where('branch_id', $branchId);
            }

            $products = $productQuery->get();

            $emptyStockProducts = $products->filter(fn ($product) => (int) $product->stock <= 0)->values();
            $lowStockProducts = $products->filter(fn ($product) => (int) $product->stock > 0 && (int) $product->stock <= $lowStockLimit)->values();
            $expiredProducts = $products->filter(function ($product) use ($today) {
                return $product->expired_date && Carbon::parse($product->expired_date)->lt($today);
            })->values();
            $expiringSoonProducts = $products->filter(function ($product) use ($today, $soonUntil) {
                return $product->expired_date && Carbon::parse($product->expired_date)->betweenIncluded($today, $soonUntil);
            })->values();

            $transactionQuery = Transaction::with('branch:id,name,code')
                ->whereDate('transaction_date', $today)
                ->whereIn('status', ['Berhasil', 'Lunas', 'Selesai']);

            if ($branchId) {
                $transactionQuery->where('branch_id', $branchId);
            }

            $todayTransactions = $transactionQuery->get();
            $todaySales = (int) $todayTransactions->sum('grand_total');

            $expenseQuery = Expense::query()
                ->whereDate('expense_date', $today)
                ->whereIn('status', ['Aktif']);

            if ($branchId) {
                $expenseQuery->where('branch_id', $branchId);
            }

            $todayExpenses = (int) $expenseQuery->sum('amount');

            $salesTrend = collect(range(6, 0))->map(function ($daysAgo) use ($branchId) {
                $date = Carbon::today()->subDays($daysAgo);
                $query = Transaction::query()
                    ->whereDate('transaction_date', $date)
                    ->whereIn('status', ['Berhasil', 'Lunas', 'Selesai']);

                if ($branchId) {
                    $query->where('branch_id', $branchId);
                }

                return [
                    'date' => $date->toDateString(),
                    'label' => $date->translatedFormat('d M'),
                    'total_sales' => (int) $query->sum('grand_total'),
                    'total_transactions' => (int) $query->count(),
                ];
            })->values();

            $priorities = [];

            if ($expiredProducts->count() > 0) {
                $priorities[] = [
                    'type' => 'expired',
                    'title' => $expiredProducts->count() . ' produk sudah expired',
                    'description' => 'Segera pisahkan dan evaluasi produk expired.',
                    'severity' => 'danger',
                ];
            }

            if ($emptyStockProducts->count() > 0) {
                $priorities[] = [
                    'type' => 'empty_stock',
                    'title' => $emptyStockProducts->count() . ' produk stok habis',
                    'description' => 'Segera cek ketersediaan barang di cabang terkait.',
                    'severity' => 'danger',
                ];
            }

            if ($lowStockProducts->count() > 0) {
                $priorities[] = [
                    'type' => 'low_stock',
                    'title' => $lowStockProducts->count() . ' produk stok menipis',
                    'description' => 'Prioritaskan restock sebelum penjualan terganggu.',
                    'severity' => 'warning',
                ];
            }

            if ($expiringSoonProducts->count() > 0) {
                $priorities[] = [
                    'type' => 'expiring_soon',
                    'title' => $expiringSoonProducts->count() . ' produk hampir expired',
                    'description' => 'Evaluasi promo atau prioritas penjualan produk tersebut.',
                    'severity' => 'warning',
                ];
            }

            if ($todayExpenses > 0 && $todaySales > 0 && $todayExpenses / $todaySales > 0.5) {
                $priorities[] = [
                    'type' => 'high_expense',
                    'title' => 'Pengeluaran hari ini cukup tinggi',
                    'description' => 'Bandingkan pengeluaran dengan penjualan hari ini.',
                    'severity' => 'warning',
                ];
            }

            $branchPerformance = Branch::query()
                ->when($branchId, fn ($query) => $query->where('id', $branchId))
                ->get()
                ->map(function ($branch) use ($today, $lowStockLimit, $soonUntil) {
                    $transactionsQuery = Transaction::where('branch_id', $branch->id)
                        ->whereDate('transaction_date', $today)
                        ->whereIn('status', ['Berhasil', 'Lunas', 'Selesai']);

                    $productsQuery = Product::where('branch_id', $branch->id)
                        ->where(function ($query) {
                            $query->whereNull('status')
                                ->orWhereRaw('LOWER(status) = ?', ['active'])
                                ->orWhereRaw('LOWER(status) = ?', ['aktif']);
                        });

                    $lowStockCount = (clone $productsQuery)
                        ->where('stock', '>', 0)
                        ->where('stock', '<=', $lowStockLimit)
                        ->count();

                    $emptyStockCount = (clone $productsQuery)
                        ->where('stock', '<=', 0)
                        ->count();

                    $expiringSoonCount = (clone $productsQuery)
                        ->whereNotNull('expired_date')
                        ->whereDate('expired_date', '>=', $today->toDateString())
                        ->whereDate('expired_date', '<=', $soonUntil->toDateString())
                        ->count();

                    return [
                        'branch_id' => $branch->id,
                        'branch_name' => $branch->name,
                        'today_sales' => (int) $transactionsQuery->sum('grand_total'),
                        'today_transactions' => (int) $transactionsQuery->count(),
                        'low_stock_count' => $lowStockCount,
                        'empty_stock_count' => $emptyStockCount,
                        'expiring_soon_count' => $expiringSoonCount,
                    ];
                })
                ->values();

            $recentTransactions = Transaction::with('branch:id,name,code')
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->orderBy('transaction_date', 'desc')
                ->orderBy('id', 'desc')
                ->take(5)
                ->get()
                ->map(fn ($transaction) => [
                    'id' => $transaction->id,
                    'invoice_number' => $transaction->invoice_number,
                    'transaction_date' => $transaction->transaction_date,
                    'branch_name' => $transaction->branch?->name,
                    'cashier_name' => $transaction->cashier_name,
                    'payment_method' => $transaction->payment_method,
                    'grand_total' => (int) $transaction->grand_total,
                    'status' => $transaction->status,
                ])
                ->values();

            $recentStockActivities = StockHistory::with(['product:id,name,code', 'branch:id,name,code', 'user:id,name,username'])
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->orderBy('id', 'desc')
                ->take(5)
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'summary' => [
                        'today_sales' => $todaySales,
                        'today_transactions' => $todayTransactions->count(),
                        'low_stock_count' => $lowStockProducts->count(),
                        'empty_stock_count' => $emptyStockProducts->count(),
                        'expiring_soon_count' => $expiringSoonProducts->count(),
                        'expired_count' => $expiredProducts->count(),
                        'today_expenses' => $todayExpenses,
                        'today_profit_estimate' => $todaySales - $todayExpenses,
                    ],
                    'sales_trend' => $salesTrend,
                    'priorities' => collect($priorities)->take(5)->values(),
                    'low_stock_products' => $lowStockProducts->map(fn ($product) => $this->formatProduct($product))->values(),
                    'empty_stock_products' => $emptyStockProducts->map(fn ($product) => $this->formatProduct($product))->values(),
                    'expiring_soon_products' => $expiringSoonProducts->map(fn ($product) => $this->formatProduct($product))->values(),
                    'expired_products' => $expiredProducts->map(fn ($product) => $this->formatProduct($product))->values(),
                    'branch_performance' => $branchPerformance,
                    'recent_transactions' => $recentTransactions,
                    'recent_stock_activities' => $recentStockActivities,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data dashboard owner.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    private function formatProduct(Product $product): array
    {
        return [
            'id' => $product->id,
            'branch_id' => $product->branch_id,
            'branch_name' => $product->branch?->name,
            'code' => $product->code,
            'name' => $product->name,
            'category' => $product->category,
            'stock' => (int) ($product->stock ?? 0),
            'min_stock' => (int) ($product->min_stock ?? 5),
            'expired_date' => $product->expired_date,
            'status' => $product->status,
        ];
    }
}
