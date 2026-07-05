<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Expense;
use Carbon\Carbon;
use Illuminate\Http\Request;

class OwnerExpenseController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $isOwner = !$user || $user->role === 'owner';
            $isAdmin = $user && $user->role === 'admin';

            $validated = $request->validate([
                'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
                'category' => ['nullable', 'string', 'max:100'],
                'search' => ['nullable', 'string', 'max:255'],
                'period' => ['nullable', 'in:all,today,7days,month,custom'],
                'start_date' => ['nullable', 'date'],
                'end_date' => ['nullable', 'date'],
                'page' => ['nullable', 'integer', 'min:1'],
                'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            ]);

            $branchId = $validated['branch_id'] ?? null;
            $category = $validated['category'] ?? null;
            $search = $validated['search'] ?? null;
            $period = $validated['period'] ?? 'all';
            $startDate = $validated['start_date'] ?? null;
            $endDate = $validated['end_date'] ?? null;
            $perPage = $validated['per_page'] ?? 50;
            $currentPage = $validated['page'] ?? 1;

            if ($isAdmin && $user && $user->branch_id) {
                $branchId = $user->branch_id;
            }

            $query = Expense::with('branch:id,name,code')
                ->where('status', 'Aktif')
                ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
                ->when($category, fn ($q) => $q->where('category', $category))
                ->when($search, function ($q) use ($search) {
                    $q->where(function ($item) use ($search) {
                        $item->where('category', 'like', "%{$search}%")
                            ->orWhere('description', 'like', "%{$search}%")
                            ->orWhere('user_name', 'like', "%{$search}%")
                            ->orWhere('username', 'like', "%{$search}%")
                            ->orWhereHas('branch', function ($branchQuery) use ($search) {
                                $branchQuery->where('name', 'like', "%{$search}%");
                            });
                    });
                });

            if ($period === 'today') {
                $query->whereDate('expense_date', Carbon::today());
            } elseif ($period === '7days') {
                $query->whereBetween('expense_date', [Carbon::today()->subDays(6), Carbon::today()]);
            } elseif ($period === 'month') {
                $query->whereBetween('expense_date', [Carbon::today()->startOfMonth(), Carbon::today()->endOfMonth()]);
            } elseif ($period === 'custom' && $startDate && $endDate) {
                $query->whereBetween('expense_date', [Carbon::parse($startDate), Carbon::parse($endDate)]);
            }

            $filteredExpenses = $query
                ->orderBy('expense_date', 'desc')
                ->orderBy('id', 'desc')
                ->get();

            $todayQuery = Expense::query()
                ->where('status', 'Aktif')
                ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
                ->whereDate('expense_date', Carbon::today());

            $summary = [
                'total_expenses' => (int) $filteredExpenses->sum('amount'),
                'active_expenses_count' => $filteredExpenses->count(),
                'today_expenses' => (int) $todayQuery->sum('amount'),
                'largest_expense' => (int) ($filteredExpenses->max('amount') ?? 0),
            ];

            $categorySummary = $filteredExpenses
                ->groupBy('category')
                ->map(fn ($group, $categoryName) => [
                    'category' => $categoryName,
                    'total_amount' => (int) $group->sum('amount'),
                    'count' => $group->count(),
                ])
                ->sortByDesc('total_amount')
                ->values();

            $branches = Branch::query()->orderBy('name')->get(['id', 'name']);
            $categories = Expense::query()
                ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
                ->whereNotNull('category')
                ->distinct()
                ->orderBy('category')
                ->pluck('category')
                ->values();

            $paginatedExpenses = new \Illuminate\Pagination\LengthAwarePaginator(
                $filteredExpenses->forPage($currentPage, $perPage),
                $filteredExpenses->count(),
                $perPage,
                $currentPage,
                ['path' => \Illuminate\Pagination\LengthAwarePaginator::resolveCurrentPath()]
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'summary' => $summary,
                    'expenses' => $paginatedExpenses->values()->map(fn ($expense) => [
                        'id' => $expense->id,
                        'branch_id' => $expense->branch_id,
                        'branch_name' => $expense->branch?->name,
                        'category' => $expense->category,
                        'description' => $expense->description,
                        'amount' => (int) $expense->amount,
                        'date' => optional($expense->expense_date)->toDateString(),
                        'status' => $expense->status,
                        'created_by' => null,
                        'created_by_name' => $expense->user_name ?: $expense->username,
                        'created_at' => optional($expense->created_at)->toDateTimeString(),
                    ]),
                    'category_summary' => $categorySummary,
                    'branches' => $isOwner ? $branches : $branches->where('id', $user?->branch_id)->values(),
                    'categories' => $categories,
                    'meta' => [
                        'branch_id' => $branchId,
                        'category' => $category,
                        'search' => $search ?? '',
                        'period' => $period,
                        'current_page' => $paginatedExpenses->currentPage(),
                        'last_page' => $paginatedExpenses->lastPage(),
                        'per_page' => $perPage,
                        'total' => $paginatedExpenses->total(),
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data pengeluaran.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
