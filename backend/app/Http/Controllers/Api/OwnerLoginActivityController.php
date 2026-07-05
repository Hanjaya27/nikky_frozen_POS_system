<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoginActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OwnerLoginActivityController extends Controller
{
    public function index(Request $request)
    {
        $query = LoginActivity::query()
            ->with(['user.branch', 'branch'])
            ->orderByDesc('login_at')
            ->orderByDesc('id');

        $role = $request->input('role', 'all');
        $branchId = $request->input('branch_id');
        $shift = $request->input('shift', $request->input('shift_name', 'all'));
        $status = $request->input('status', 'all');
        $date = $request->input('date');
        $search = trim((string) $request->input('search', ''));
        $perPage = max(1, min(100, (int) $request->input('per_page', 15)));

        if ($role !== 'all') {
            if (in_array($role, ['cashier', 'kasir'], true)) {
                $query->whereIn('role', ['cashier', 'kasir']);
            } else {
                $query->where('role', $role);
            }
        }

        if ($branchId !== null && $branchId !== '') {
            $query->where(function ($builder) use ($branchId) {
                $builder->where('branch_id', $branchId)
                    ->orWhereHas('user', function ($userQuery) use ($branchId) {
                        $userQuery->where('branch_id', $branchId);
                    });
            });
        }

        if ($shift && $shift !== 'all') {
            $query->where('shift_name', $shift);
        }

        if ($status !== 'all') {
            if (in_array($status, ['login', 'active'], true)) {
                $query->where(function ($builder) {
                    $builder->whereNull('logout_at')->orWhere('status', 'Login')->orWhere('status', 'Active')->orWhere('status', 'active');
                });
            } elseif (in_array($status, ['logout', 'logged_out'], true)) {
                $query->where(function ($builder) {
                    $builder->whereNotNull('logout_at')->orWhere('status', 'Logout')->orWhere('status', 'logged_out');
                });
            }
        }

        if ($date) {
            $query->whereDate('login_at', $date);
        }

        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%")
                    ->orWhere('role', 'like', "%{$search}%")
                    ->orWhere('branch_name', 'like', "%{$search}%")
                    ->orWhere('shift_name', 'like', "%{$search}%")
                    ->orWhere('device', 'like', "%{$search}%")
                    ->orWhere('ip_address', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('username', 'like', "%{$search}%")
                            ->orWhere('role', 'like', "%{$search}%")
                            ->orWhereHas('branch', function ($branchQuery) use ($search) {
                                $branchQuery->where('name', 'like', "%{$search}%");
                            });
                    });
            });
        }

        $activitiesQuery = clone $query;
        $activities = $query->paginate($perPage);

        $allForSummary = clone $activitiesQuery;
        $summary = [
            'total_activities' => (clone $allForSummary)->count(),
            'currently_login' => (clone $allForSummary)->where(function ($builder) {
                $builder->whereNull('logout_at')->orWhereIn('status', ['Login', 'Active', 'active']);
            })->count(),
            'logged_out' => (clone $allForSummary)->where(function ($builder) {
                $builder->whereNotNull('logout_at')->orWhereIn('status', ['Logout', 'logged_out']);
            })->count(),
            'owner_count' => (clone $allForSummary)->where('role', 'owner')->count(),
            'admin_count' => (clone $allForSummary)->where('role', 'admin')->count(),
            'cashier_count' => (clone $allForSummary)->whereIn('role', ['cashier', 'kasir'])->count(),
            'branch_1_count' => (clone $allForSummary)->where(function ($builder) {
                $builder->where('branch_id', 1)->orWhereHas('user', function ($userQuery) {
                    $userQuery->where('branch_id', 1);
                });
            })->count(),
            'branch_2_count' => (clone $allForSummary)->where(function ($builder) {
                $builder->where('branch_id', 2)->orWhereHas('user', function ($userQuery) {
                    $userQuery->where('branch_id', 2);
                });
            })->count(),
        ];

        $rows = collect($activities->items())->map(function ($activity) {
            $user = $activity->user;
            $branch = $activity->branch ?: $user?->branch;
            $role = strtolower((string) ($activity->role ?: $user?->role));
            $branchName = $activity->branch_name ?: ($branch?->name ?: ($role === 'owner' ? 'Semua Cabang' : '-'));
            $shiftValue = $activity->shift_name ?: $user?->shift_name;
            $statusValue = $activity->status ?: ($activity->logout_at ? 'Logout' : 'Login');

            return [
                'id' => $activity->id,
                'user_id' => $activity->user_id,
                'user_name' => $activity->name ?: $user?->name,
                'username' => $activity->username ?: $user?->username,
                'role' => $role,
                'role_label' => $this->roleLabel($role),
                'branch_id' => $activity->branch_id ?: $user?->branch_id,
                'branch_name' => $branchName,
                'shift' => $shiftValue,
                'login_at' => optional($activity->login_at)->format('Y-m-d H:i:s'),
                'logout_at' => optional($activity->logout_at)->format('Y-m-d H:i:s'),
                'device' => $activity->device ?: '-',
                'ip_address' => $activity->ip_address ?: '-',
                'status' => in_array(strtolower($statusValue), ['logout', 'logged_out']) ? 'logout' : 'login',
                'created_at' => optional($activity->created_at)->format('Y-m-d H:i:s'),
            ];
        })->values();

        $branches = DB::table('branches')->orderBy('name')->get(['id', 'name']);
        $shiftValues = LoginActivity::query()
            ->whereNotNull('shift_name')
            ->distinct()
            ->orderBy('shift_name')
            ->pluck('shift_name')
            ->values();

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => $summary,
                'activities' => $rows,
                'branches' => $branches,
                'roles' => ['owner', 'admin', 'cashier'],
                'shifts' => $shiftValues,
                'meta' => [
                    'role' => $role,
                    'branch_id' => $branchId ?: null,
                    'shift' => $shift,
                    'status' => $status,
                    'date' => $date,
                    'search' => $search,
                ],
                'pagination' => [
                    'current_page' => $activities->currentPage(),
                    'last_page' => $activities->lastPage(),
                    'per_page' => $activities->perPage(),
                    'total' => $activities->total(),
                ],
            ],
        ]);
    }

    public function forceLogout(Request $request, $id)
    {
        $activity = LoginActivity::with('user')->find($id);

        if (!$activity) {
            return response()->json(['success' => false, 'message' => 'Data aktivitas login tidak ditemukan.'], 404);
        }

        if ($activity->logout_at || in_array(strtolower((string) $activity->status), ['logout', 'logged_out'], true)) {
            return response()->json(['success' => false, 'message' => 'User sudah logout.'], 422);
        }

        $activity->update([
            'logout_at' => now(),
            'status' => 'Logout',
        ]);

        return response()->json(['success' => true, 'message' => 'User berhasil di-force logout.', 'data' => $activity]);
    }

    public function destroy(Request $request, $id)
    {
        $activity = LoginActivity::find($id);

        if (!$activity) {
            return response()->json(['success' => false, 'message' => 'Data aktivitas login tidak ditemukan.'], 404);
        }

        $activity->delete();

        return response()->json(['success' => true, 'message' => 'Data aktivitas login berhasil dihapus.']);
    }

    private function roleLabel(?string $role): string
    {
        return match (strtolower((string) $role)) {
            'owner' => 'Owner',
            'admin' => 'Admin',
            'cashier', 'kasir' => 'Kasir',
            default => ucfirst((string) $role),
        };
    }
}
