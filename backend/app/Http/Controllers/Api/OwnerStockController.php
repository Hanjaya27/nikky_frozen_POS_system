<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Http\Request;

class OwnerStockController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $isOwner = !$user || $user->role === 'owner';
            $isAdmin = $user && $user->role === 'admin';

            $validated = $request->validate([
                'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
                'search' => ['nullable', 'string', 'max:255'],
                'status' => ['nullable', 'in:all,safe,low,empty,expiring,expired'],
                'category' => ['nullable', 'string', 'max:100'],
                'page' => ['nullable', 'integer', 'min:1'],
                'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            ]);

            $branchId = $validated['branch_id'] ?? null;
            $search = $validated['search'] ?? null;
            $status = $validated['status'] ?? 'all';
            $category = $validated['category'] ?? null;
            $perPage = $validated['per_page'] ?? 10;
            $currentPage = $validated['page'] ?? 1;

            if ($isAdmin && $user && $user->branch_id && !$branchId) {
                $branchId = $user->branch_id;
            }

            $today = Carbon::today();
            $soonUntil = Carbon::today()->addDays(30);

            $query = Product::query()->with('branch:id,name,code')
                ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
                ->when($search, function ($q) use ($search) {
                    $q->where(function ($item) use ($search) {
                        $item->where('name', 'like', "%{$search}%")
                            ->orWhere('code', 'like', "%{$search}%")
                            ->orWhere('category', 'like', "%{$search}%");
                    });
                });

            $allProducts = $query->get()->map(function ($product) use ($today, $soonUntil) {
                $minimumStock = (int) ($product->min_stock ?? 5);
                $stock = (int) ($product->stock ?? 0);
                $expiredDate = $product->expired_date ? Carbon::parse($product->expired_date) : null;

                if ($expiredDate && $expiredDate->lt($today)) {
                    $computedStatus = 'expired';
                } elseif ($expiredDate && $expiredDate->betweenIncluded($today, $soonUntil)) {
                    $computedStatus = 'expiring';
                } elseif ($stock <= 0) {
                    $computedStatus = 'empty';
                } elseif ($stock <= $minimumStock) {
                    $computedStatus = 'low';
                } else {
                    $computedStatus = 'safe';
                }

                return [
                    'id' => $product->id,
                    'branch_id' => $product->branch_id,
                    'branch_name' => $product->branch?->name,
                    'code' => $product->code,
                    'name' => $product->name,
                    'category' => $product->category,
                    'price' => (int) $product->price,
                    'stock' => $stock,
                    'minimum_stock' => $minimumStock,
                    'expired_date' => $product->expired_date,
                    'status' => $computedStatus,
                    'image' => $product->image,
                ];
            });

            $filteredProducts = $allProducts;
            if ($category) {
                $filteredProducts = $filteredProducts->filter(fn ($item) => $item['category'] === $category);
            }

            $summary = [
                'total_products' => $filteredProducts->count(),
                'safe_stock_count' => $filteredProducts->where('status', 'safe')->count(),
                'low_stock_count' => $filteredProducts->where('status', 'low')->count(),
                'empty_stock_count' => $filteredProducts->where('status', 'empty')->count(),
                'expiring_soon_count' => $filteredProducts->where('status', 'expiring')->count(),
                'expired_count' => $filteredProducts->where('status', 'expired')->count(),
                'total_stock' => (int) $filteredProducts->sum('stock'),
            ];

            if ($status !== 'all') {
                $filteredProducts = $filteredProducts->filter(fn ($item) => $item['status'] === $status);
            }

            $branches = Branch::query()->orderBy('name')->get(['id', 'name']);
            $allCategories = $allProducts->pluck('category')->filter()->unique()->values();

            $paginatedProducts = new \Illuminate\Pagination\LengthAwarePaginator(
                $filteredProducts->forPage($currentPage, $perPage),
                $filteredProducts->count(),
                $perPage,
                $currentPage,
                ['path' => \Illuminate\Pagination\LengthAwarePaginator::resolveCurrentPath()]
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'summary' => $summary,
                    'products' => $paginatedProducts->values(),
                    'branches' => $isOwner ? $branches : $branches->where('id', $user?->branch_id)->values(),
                    'categories' => $allCategories,
                    'meta' => [
                        'branch_id' => $branchId,
                        'search' => $search ?? '',
                        'status' => $status,
                        'category' => $category ?? '',
                        'current_page' => $paginatedProducts->currentPage(),
                        'last_page' => $paginatedProducts->lastPage(),
                        'per_page' => $perPage,
                        'total' => $paginatedProducts->total(),
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data barang dan stok.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
