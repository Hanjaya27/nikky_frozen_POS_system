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
                // Default to month if period is invalid or custom dates are missing
                $period = 'month';
                $queryStartDate = Carbon::today()->startOfMonth();
                $queryEndDate = Carbon::today()->endOfMonth();
            }

            // Enforce branch_id for non-owner roles if a specific branch is not requested by owner
            if (!$isOwner && !$branchId) {
                $branchId = $user->branch_id;
            }

            // Base queries for transactions and expenses
            $baseTransactionQuery = Transaction::query()
                ->whereIn('status', ['Berhasil', 'Lunas', 'Selesai'])
                ->whereBetween('transaction_date', [$queryStartDate, $queryEndDate]);

            $baseExpenseQuery = Expense::query()
                ->where('status', 'Aktif')
                ->whereBetween('expense_date', [$queryStartDate, $queryEndDate]);

            // Apply branch filter
            if ($branchId && ($isOwner || ($isAdmin && (int)$branchId === (int)$user->branch_id))) {
                $baseTransactionQuery->where('branch_id', $branchId);
                $baseExpenseQuery->where('branch_id', $branchId);
            } elseif ($isAdmin && !$isOwner) {
                 // Admin can only see their own branch if no branch is specified or if owner is not requesting a specific branch
                $baseTransactionQuery->where('branch_id', $user->branch_id);
                $baseExpenseQuery->where('branch_id', $user->branch_id);
            }

            // Summary Calculations
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

            // Chart Data (Revenue vs Expenses per day)
            $chartData = [];
            $currentDate = clone $queryStartDate;

            while ($currentDate->lte($queryEndDate)) {
                $dateKey = $currentDate->toDateString();
                $transactionsOnDay = (clone $baseTransactionQuery)
                    ->whereDate('transaction_date', $currentDate->toDateString())
                    ->get();
                $expensesOnDay = (clone $baseExpenseQuery)
                    ->whereDate('expense_date', $currentDate->toDateString())
                    ->get();

                $chartData[] = [
                    'date' => $dateKey,
                    'label' => $currentDate->translatedFormat('d M'),
                    'revenue' => (int) $transactionsOnDay->sum('grand_total'),
                    'expenses' => (int) $expensesOnDay->sum('amount'),
                    'transactions' => (int) $transactionsOnDay->count(),
                ];
                $currentDate->addDay();
            }

            // Top Products
            $topProducts = DB::table('transaction_items')
                ->select(
                    'products.id as product_id',
                    'products.name as product_name',
                    'products.code as product_code',
                    DB::raw('SUM(transaction_items.quantity) as quantity_sold'),
                    DB::raw('SUM(transaction_items.subtotal) as total_revenue')
                )
                ->join('transactions', 'transaction_items.transaction_id', '=', 'transactions.id')
                ->join('products', 'transaction_items.product_id', '=', 'products.id')
                ->whereIn('transactions.status', ['Berhasil', 'Lunas', 'Selesai'])
                ->whereBetween('transactions.transaction_date', [$queryStartDate, $queryEndDate])
                ->when($branchId, fn ($query) => $query->where('transactions.branch_id', $branchId))
                ->groupBy('products.id', 'products.name', 'products.code')
                ->orderBy('quantity_sold', 'desc')
                ->take(10)
                ->get()
                ->map(fn ($product) => [
                    'product_id' => $product->product_id,
                    'product_name' => $product->product_name,
                    'product_code' => $product->product_code,
                    'quantity_sold' => (int) $product->quantity_sold,
                    'total_revenue' => (int) $product->total_revenue,
                ])->values();

            // Recent Transactions (for 'transactions' tab)
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

            // Recent Expenses (for 'expenses' tab)
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

            // Branch Summary (for 'all branches' view by owner)
            $branchSummary = collect();
            if ($isOwner && !$branchId) { // Only for owner and 'all branches' selected
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
}
