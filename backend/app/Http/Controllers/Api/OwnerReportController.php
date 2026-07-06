<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Expense;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OwnerReportController extends Controller
{
    private function resolveReportPeriod(Request $request): array
    {
        $period = $request->query('period', 'month');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        if ($period === 'today') {
            return ['today', Carbon::today()->startOfDay(), Carbon::today()->endOfDay()];
        }

        if ($period === '7days') {
            return ['7days', Carbon::today()->subDays(6)->startOfDay(), Carbon::today()->endOfDay()];
        }

        if ($period === 'custom' && $startDate && $endDate) {
            return ['custom', Carbon::parse($startDate)->startOfDay(), Carbon::parse($endDate)->endOfDay()];
        }

        return ['month', Carbon::today()->startOfMonth(), Carbon::today()->endOfMonth()];
    }

    private function resolveBranchLabel(?string $branchId): string
    {
        if (!$branchId) {
            return 'Semua Cabang';
        }

        $branch = Branch::query()->select('id', 'name')->find($branchId);

        return $branch?->name ?? ('Cabang ' . $branchId);
    }

    private function getFilteredQueries(Carbon $queryStartDate, Carbon $queryEndDate, ?string $branchId): array
    {
        $transactionQuery = Transaction::query()
            ->with(['branch:id,name,code', 'items.product:id,code,name'])
            ->whereBetween('transaction_date', [$queryStartDate, $queryEndDate])
            ->whereIn('status', ['Berhasil', 'Lunas', 'Selesai']);

        $expenseQuery = Expense::query()
            ->with(['branch:id,name,code'])
            ->whereBetween('expense_date', [$queryStartDate, $queryEndDate])
            ->where('status', 'Aktif');

        if ($branchId) {
            $transactionQuery->where('branch_id', $branchId);
            $expenseQuery->where('branch_id', $branchId);
        }

        return [$transactionQuery, $expenseQuery];
    }

    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $isAdmin = $user && $user->role === 'admin';
            $isOwner = !$user || $user->role === 'owner';

            $period = $request->query('period', 'month'); // today | 7days | month | custom
            $branchId = $request->query('branch_id');
            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');
            $tab = $request->query('tab', 'summary'); // summary | transactions | expenses

            $queryStartDate = null;
            $queryEndDate = null;

            if ($period === 'today') {
                $queryStartDate = Carbon::today();
                $queryEndDate = Carbon::today()->endOfDay();
            } elseif ($period === '7days') {
                $queryStartDate = Carbon::today()->subDays(6)->startOfDay();
                $queryEndDate = Carbon::today()->endOfDay();
            } elseif ($period === 'month') {
                $queryStartDate = Carbon::today()->startOfMonth();
                $queryEndDate = Carbon::today()->endOfMonth();
            } elseif ($period === 'custom' && $startDate && $endDate) {
                $queryStartDate = Carbon::parse($startDate)->startOfDay();
                $queryEndDate = Carbon::parse($endDate)->endOfDay();
            } else {
                $period = 'month';
                $queryStartDate = Carbon::today()->startOfMonth();
                $queryEndDate = Carbon::today()->endOfMonth();
            }

            if (!$isOwner && !$branchId) {
                $branchId = $user->branch_id;
            }

            [$baseTransactionQuery, $baseExpenseQuery] = $this->getFilteredQueries($queryStartDate, $queryEndDate, $branchId);

            if ($branchId && ($isOwner || ($isAdmin && (int) $branchId === (int) $user->branch_id))) {
                $baseTransactionQuery->where('branch_id', $branchId);
                $baseExpenseQuery->where('branch_id', $branchId);
            } elseif ($isAdmin && !$isOwner) {
                $baseTransactionQuery->where('branch_id', $user->branch_id);
                $baseExpenseQuery->where('branch_id', $user->branch_id);
            }

            $totalRevenue = (clone $baseTransactionQuery)->sum('grand_total');
            $totalTransactions = (clone $baseTransactionQuery)->count();
            $totalExpenses = (clone $baseExpenseQuery)->sum('amount');
            $grossProfit = $totalRevenue - $totalExpenses;
            $averageTransaction = $totalTransactions > 0 ? $totalRevenue / $totalTransactions : 0;

            $summary = [
                'total_revenue' => (int) $totalRevenue,
                'total_expenses' => (int) $totalExpenses,
                'gross_profit' => (int) $grossProfit,
                'total_transactions' => (int) $totalTransactions,
                'average_transaction' => (int) $averageTransaction,
            ];

            $chartData = [];
            $currentDate = clone $queryStartDate;

            while ($currentDate->lte($queryEndDate)) {
                $dateKey = $currentDate->toDateString();
                $transactionsOnDay = (clone $baseTransactionQuery)->whereDate('transaction_date', $dateKey)->get();
                $expensesOnDay = (clone $baseExpenseQuery)->whereDate('expense_date', $dateKey)->get();

                $chartData[] = [
                    'date' => $dateKey,
                    'label' => $currentDate->translatedFormat('d M'),
                    'revenue' => (int) $transactionsOnDay->sum('grand_total'),
                    'expenses' => (int) $expensesOnDay->sum('amount'),
                    'transactions' => (int) $transactionsOnDay->count(),
                ];

                $currentDate->addDay();
            }

            $topProducts = (clone $baseTransactionQuery)
                ->join('transaction_items', 'transactions.id', '=', 'transaction_items.transaction_id')
                ->select(
                    'transaction_items.product_id',
                    'transaction_items.product_name',
                    'transaction_items.product_code',
                    DB::raw('SUM(transaction_items.quantity) as quantity_sold'),
                    DB::raw('SUM(transaction_items.subtotal) as total_revenue')
                )
                ->groupBy('transaction_items.product_id', 'transaction_items.product_name', 'transaction_items.product_code')
                ->orderByDesc('quantity_sold')
                ->take(10)
                ->get()
                ->map(fn ($product) => [
                    'product_id' => $product->product_id,
                    'product_name' => $product->product_name,
                    'product_code' => $product->product_code,
                    'quantity_sold' => (int) $product->quantity_sold,
                    'total_revenue' => (int) $product->total_revenue,
                ])->values();

            $recentTransactions = (clone $baseTransactionQuery)
                ->with('branch:id,name,code')
                ->orderBy('transaction_date', 'desc')
                ->orderBy('id', 'desc')
                ->get()
                ->map(fn ($transaction) => [
                    'id' => $transaction->id,
                    'invoice_number' => $transaction->invoice_number,
                    'branch_id' => $transaction->branch_id,
                    'branch_name' => $transaction->branch?->name,
                    'cashier_name' => $transaction->cashier_name,
                    'total_amount' => (int) $transaction->grand_total,
                    'status' => $transaction->status,
                    'payment_method' => $transaction->payment_method,
                    'created_at' => $transaction->transaction_date->toDateTimeString(),
                ])->values();

            $recentExpenses = (clone $baseExpenseQuery)
                ->with('branch:id,name,code')
                ->orderBy('expense_date', 'desc')
                ->orderBy('id', 'desc')
                ->get()
                ->map(fn ($expense) => [
                    'id' => $expense->id,
                    'branch_id' => $expense->branch_id,
                    'branch_name' => $expense->branch?->name,
                    'category' => $expense->category,
                    'description' => $expense->description,
                    'amount' => (int) $expense->amount,
                    'created_by_name' => $expense->user_name,
                    'created_at' => $expense->expense_date->toDateTimeString(),
                ])->values();

            $branchSummary = collect();
            if ($isOwner && !$branchId) {
                $allBranches = Branch::all();
                $branchSummary = $allBranches->map(function ($branch) use ($queryStartDate, $queryEndDate) {
                    $branchTransactions = Transaction::query()
                        ->whereIn('status', ['Berhasil', 'Lunas', 'Selesai'])
                        ->where('branch_id', $branch->id)
                        ->whereBetween('transaction_date', [$queryStartDate, $queryEndDate]);

                    $branchExpenses = Expense::query()
                        ->where('status', 'Aktif')
                        ->where('branch_id', $branch->id)
                        ->whereBetween('expense_date', [$queryStartDate, $queryEndDate]);

                    $revenue = (int) $branchTransactions->sum('grand_total');
                    $expenses = (int) $branchExpenses->sum('amount');

                    return [
                        'branch_id' => $branch->id,
                        'branch_name' => $branch->name,
                        'total_revenue' => $revenue,
                        'total_expenses' => $expenses,
                        'gross_profit' => $revenue - $expenses,
                        'total_transactions' => (int) $branchTransactions->count(),
                    ];
                })->values();
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'summary' => $summary,
                    'chart' => $chartData,
                    'top_products' => $topProducts,
                    'transactions' => $recentTransactions,
                    'expenses' => $recentExpenses,
                    'branch_summary' => $branchSummary,
                    'meta' => [
                        'period' => $period,
                        'branch_id' => $branchId,
                        'start_date' => $queryStartDate->toDateString(),
                        'end_date' => $queryEndDate->toDateString(),
                        'tab' => $tab,
                    ]
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data laporan.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function export(Request $request)
    {
        try {
            [$period, $queryStartDate, $queryEndDate] = $this->resolveReportPeriod($request);
            $branchId = $request->query('branch_id');
            $format = $request->query('format', 'csv');

            if ($format !== 'csv') {
                return response()->json([
                    'success' => false,
                    'message' => 'Format export tidak didukung.',
                ], 422);
            }

            if ($request->user()?->role !== 'owner' && !$branchId) {
                $branchId = $request->user()?->branch_id;
            }

            [$transactionQuery, $expenseQuery] = $this->getFilteredQueries($queryStartDate, $queryEndDate, $branchId);

            $transactions = (clone $transactionQuery)
                ->with('branch:id,name,code')
                ->orderBy('transaction_date')
                ->orderBy('id')
                ->get();

            $expenses = (clone $expenseQuery)
                ->with('branch:id,name,code')
                ->orderBy('expense_date')
                ->orderBy('id')
                ->get();

            $totalRevenue = (clone $transactionQuery)->sum('grand_total');
            $totalTransactions = (clone $transactionQuery)->count();
            $totalExpenses = (clone $expenseQuery)->sum('amount');
            $grossProfit = $totalRevenue - $totalExpenses;
            $averageTransaction = $totalTransactions > 0 ? $totalRevenue / $totalTransactions : 0;
            $branchLabel = $this->resolveBranchLabel($branchId);

            $topProducts = (clone $transactionQuery)
                ->join('transaction_items', 'transactions.id', '=', 'transaction_items.transaction_id')
                ->select(
                    'transaction_items.product_code',
                    'transaction_items.product_name',
                    DB::raw('SUM(transaction_items.quantity) as quantity_sold'),
                    DB::raw('SUM(transaction_items.subtotal) as total_revenue')
                )
                ->groupBy('transaction_items.product_code', 'transaction_items.product_name')
                ->orderByDesc('quantity_sold')
                ->take(10)
                ->get();

            $filenamePeriod = $period === 'today' ? 'hari-ini' : ($period === '7days' ? '7-hari' : ($period === 'custom' ? 'custom' : 'bulan-ini'));
            $filename = 'laporan-owner-' . $filenamePeriod . '-' . now()->format('Y-m-d') . '.csv';

            return response()->streamDownload(function () use ($transactions, $expenses, $topProducts, $totalRevenue, $totalExpenses, $grossProfit, $totalTransactions, $averageTransaction, $period, $branchLabel, $queryStartDate, $queryEndDate) {
                echo "\xEF\xBB\xBF";
                $handle = fopen('php://output', 'w');

                fputcsv($handle, ['RINGKASAN']);
                fputcsv($handle, ['Keterangan', 'Nilai']);
                fputcsv($handle, ['Total Pendapatan', $totalRevenue]);
                fputcsv($handle, ['Total Pengeluaran', $totalExpenses]);
                fputcsv($handle, ['Laba Kotor', $grossProfit]);
                fputcsv($handle, ['Total Transaksi', $totalTransactions]);
                fputcsv($handle, ['Rata-rata Transaksi', round($averageTransaction)]);
                fputcsv($handle, ['Periode', $period]);
                fputcsv($handle, ['Cabang', $branchLabel]);
                fputcsv($handle, []);

                fputcsv($handle, ['TRANSAKSI']);
                fputcsv($handle, ['Tanggal', 'Invoice', 'Cabang', 'Kasir', 'Metode Pembayaran', 'Status', 'Total']);
                foreach ($transactions as $transaction) {
                    fputcsv($handle, [
                        optional($transaction->transaction_date)->format('Y-m-d H:i:s'),
                        $transaction->invoice_number,
                        $transaction->branch?->name ?? '-',
                        $transaction->cashier_name,
                        $transaction->payment_method,
                        $transaction->status,
                        $transaction->grand_total,
                    ]);
                }
                fputcsv($handle, []);

                fputcsv($handle, ['PENGELUARAN']);
                fputcsv($handle, ['Tanggal', 'Cabang', 'Kategori', 'Deskripsi', 'Pengguna', 'Nominal', 'Status']);
                foreach ($expenses as $expense) {
                    fputcsv($handle, [
                        optional($expense->expense_date)->format('Y-m-d'),
                        $expense->branch?->name ?? '-',
                        $expense->category,
                        $expense->description,
                        $expense->user_name,
                        $expense->amount,
                        $expense->status,
                    ]);
                }
                fputcsv($handle, []);

                fputcsv($handle, ['PRODUK TERLARIS']);
                fputcsv($handle, ['Peringkat', 'Kode Produk', 'Nama Produk', 'Qty Terjual', 'Total Pendapatan']);
                $rank = 1;
                foreach ($topProducts as $product) {
                    fputcsv($handle, [
                        $rank++,
                        $product->product_code,
                        $product->product_name,
                        $product->quantity_sold,
                        $product->total_revenue,
                    ]);
                }

                fclose($handle);
            }, $filename, [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal export laporan. Silakan coba lagi.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
