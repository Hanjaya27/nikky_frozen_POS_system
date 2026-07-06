<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class OwnerUserController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $isOwner = !$user || $user->role === 'owner';
            $isAdmin = $user && $user->role === 'admin';

            $validated = $request->validate([
                'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
                'role' => ['nullable', 'in:all,owner,admin,cashier'],
                'status' => ['nullable', 'in:all,active,inactive'],
                'search' => ['nullable', 'string', 'max:255'],
                'page' => ['nullable', 'integer', 'min:1'],
                'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            ]);

            $branchId = $validated['branch_id'] ?? null;
            $role = $validated['role'] ?? 'all';
            $status = $validated['status'] ?? 'all';
            $search = $validated['search'] ?? null;
            $perPage = $validated['per_page'] ?? 50;
            $currentPage = $validated['page'] ?? 1;

            $baseBranchId = $branchId;
            if ($isAdmin && $user && $user->branch_id && !$branchId) {
                $baseBranchId = $user->branch_id;
            }

            $query = User::query()
                ->with('branch:id,name')
                ->when($baseBranchId, fn ($q) => $q->where('branch_id', $baseBranchId))
                ->when($search, function ($q) use ($search) {
                    $q->where(function ($item) use ($search) {
                        $item->where('name', 'like', "%{$search}%")
                            ->orWhere('username', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%")
                            ->orWhereHas('branch', function ($branchQuery) use ($search) {
                                $branchQuery->where('name', 'like', "%{$search}%");
                            });
                    });
                });

            $allUsers = $query->orderBy('role')->orderBy('name')->get();

            $mappedUsers = $allUsers->map(function ($u) {
                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'username' => $u->username,
                    'email' => $u->email,
                    'role' => $u->role,
                    'role_label' => match ($u->role) {
                        'owner' => 'Owner',
                        'admin' => 'Admin Cabang',
                        'cashier' => 'Kasir',
                        default => ucfirst($u->role),
                    },
                    'branch_id' => $u->branch_id,
                    'branch_name' => $u->branch?->name,
                    'shift_default' => $u->shift_name ?? $u->shift_default,
                    'phone' => $u->phone,
                    'last_login_at' => $u->last_login_at ? $u->last_login_at->format('Y-m-d H:i:s') : null,
                    'status' => in_array(strtolower(trim((string) ($u->status ?? ''))), ['active','aktif','1','true']) ? 'active' : 'inactive',
                    'created_at' => $u->created_at->format('Y-m-d H:i:s'),
                ];
            });

            $filteredUsers = $mappedUsers;
            if ($role !== 'all') {
                $filteredUsers = $filteredUsers->filter(fn ($item) => $item['role'] === $role);
            }
            if ($status !== 'all') {
                $filteredUsers = $filteredUsers->filter(fn ($item) => $item['status'] === $status);
            }

            $summary = [
                'total_users' => $mappedUsers->count(),
                'active_users' => $mappedUsers->where('status', 'active')->count(),
                'inactive_users' => $mappedUsers->where('status', 'inactive')->count(),
                'admin_count' => $mappedUsers->where('role', 'admin')->count(),
                'cashier_count' => $mappedUsers->where('role', 'cashier')->count(),
                'owner_count' => $mappedUsers->where('role', 'owner')->count(),
                'branch_1_count' => $mappedUsers->whereIn('branch_id', [1])->count(),
                'branch_2_count' => $mappedUsers->whereIn('branch_id', [2])->count(),
            ];

            $branches = Branch::query()->orderBy('name')->get(['id', 'name']);
            $roles = ['owner', 'admin', 'cashier'];

            $paginated = new \Illuminate\Pagination\LengthAwarePaginator(
                $filteredUsers->forPage($currentPage, $perPage),
                $filteredUsers->count(),
                $perPage,
                $currentPage,
                ['path' => \Illuminate\Pagination\LengthAwarePaginator::resolveCurrentPath()]
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'summary' => $summary,
                    'users' => $paginated->values(),
                    'branches' => $isOwner ? $branches : $branches->where('id', $user?->branch_id)->values(),
                    'roles' => $roles,
                    'meta' => [
                        'branch_id' => $branchId,
                        'role' => $role,
                        'status' => $status,
                        'search' => $search ?? '',
                        'current_page' => $paginated->currentPage(),
                        'last_page' => $paginated->lastPage(),
                        'per_page' => $perPage,
                        'total' => $paginated->total(),
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data user.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
