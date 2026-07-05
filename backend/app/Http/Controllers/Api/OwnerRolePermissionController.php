<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RolePermission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OwnerRolePermissionController extends Controller
{
    private array $criticalOwnerPermissionIds = [
        'owner_dashboard',
        'owner_users',
        'owner_role_permissions',
        'owner_settings',
    ];

    private array $adminAllowedPermissionIds = [
        'admin_dashboard',
        'admin_products',
        'admin_stock_mutations',
        'admin_stock_histories',
        'admin_expenses',
    ];

    private array $cashierAllowedPermissionIds = [
        'cashier_pos',
        'cashier_shift',
        'cashier_transactions',
    ];

    private function baseQuery()
    {
        return RolePermission::query();
    }

    private function normalizePermissions($permissions)
    {
        return $permissions->map(function ($permission) {
            $ownerAllowed = (bool) ($permission->owner_access ?? true);
            $adminAllowed = (bool) ($permission->admin_access ?? false);
            $cashierAllowed = (bool) ($permission->kasir_access ?? false);

            return [
                'id' => $permission->id,
                'feature_name' => $permission->menu_name,
                'description' => $this->descriptions()[$permission->permission_id] ?? 'Permission menu sistem Nikky Frozen POS.',
                'permission_id' => $permission->permission_id,
                'group' => $permission->menu_group,
                'path' => $permission->path,
                'roles' => [
                    'owner' => true,
                    'admin' => $ownerAllowed ? true : $adminAllowed,
                    'cashier' => $cashierAllowed,
                ],
                'status' => [
                    'owner' => 'Aktif',
                    'admin' => ($ownerAllowed ? true : $adminAllowed) ? 'Aktif' : 'Dibatasi',
                    'cashier' => $cashierAllowed ? 'Aktif' : 'Dibatasi',
                ],
                'raw' => [
                    'owner_access' => true,
                    'admin_access' => $adminAllowed,
                    'cashier_access' => $cashierAllowed,
                ],
            ];
        });
    }

    private function descriptions(): array
    {
        return [
            'owner_dashboard' => 'Akses dashboard owner agregasi semua cabang.',
            'owner_reports' => 'Akses laporan owner.',
            'owner_stocks' => 'Akses stok dan gudang owner.',
            'owner_expenses' => 'Akses pengeluaran owner.',
            'owner_users' => 'Akses data user global.',
            'owner_login_activities' => 'Akses aktivitas login.',
            'owner_role_permissions' => 'Akses pengaturan role dan permission.',
            'owner_settings' => 'Akses pengaturan global owner.',
            'admin_dashboard' => 'Akses dashboard admin cabang.',
            'admin_products' => 'Akses kelola produk cabang.',
            'admin_stock_mutations' => 'Akses mutasi stok cabang.',
            'admin_stock_histories' => 'Akses riwayat stok cabang.',
            'admin_expenses' => 'Akses pengeluaran cabang.',
            'cashier_pos' => 'Akses POS atau transaksi kasir.',
            'cashier_shift' => 'Akses shift saya.',
            'cashier_transactions' => 'Akses riwayat transaksi kasir.',
        ];
    }

    private function syncDefaults(): void
    {
        $defaults = [
            ['permission_id' => 'owner_dashboard', 'menu_name' => 'Dashboard Owner', 'menu_group' => 'owner', 'path' => '/owner/dashboard', 'owner_access' => true, 'admin_access' => false, 'kasir_access' => false, 'sort_order' => 1, 'status' => 'Aktif'],
            ['permission_id' => 'owner_reports', 'menu_name' => 'Laporan Owner', 'menu_group' => 'laporan', 'path' => '/laporan', 'owner_access' => true, 'admin_access' => false, 'kasir_access' => false, 'sort_order' => 2, 'status' => 'Aktif'],
            ['permission_id' => 'owner_stocks', 'menu_name' => 'Barang & Stok Owner', 'menu_group' => 'stok', 'path' => '/barang', 'owner_access' => true, 'admin_access' => false, 'kasir_access' => false, 'sort_order' => 3, 'status' => 'Aktif'],
            ['permission_id' => 'owner_expenses', 'menu_name' => 'Pengeluaran Owner', 'menu_group' => 'pengeluaran', 'path' => '/pengeluaran', 'owner_access' => true, 'admin_access' => false, 'kasir_access' => false, 'sort_order' => 4, 'status' => 'Aktif'],
            ['permission_id' => 'owner_users', 'menu_name' => 'Data User', 'menu_group' => 'owner', 'path' => '/owner/data-kasir', 'owner_access' => true, 'admin_access' => false, 'kasir_access' => false, 'sort_order' => 5, 'status' => 'Aktif'],
            ['permission_id' => 'owner_login_activities', 'menu_name' => 'Aktivitas Login', 'menu_group' => 'owner', 'path' => '/owner/aktivitas-login', 'owner_access' => true, 'admin_access' => false, 'kasir_access' => false, 'sort_order' => 6, 'status' => 'Aktif'],
            ['permission_id' => 'owner_role_permissions', 'menu_name' => 'Role & Permission', 'menu_group' => 'owner', 'path' => '/owner/role-permission', 'owner_access' => true, 'admin_access' => false, 'kasir_access' => false, 'sort_order' => 7, 'status' => 'Aktif'],
            ['permission_id' => 'owner_settings', 'menu_name' => 'Pengaturan', 'menu_group' => 'owner', 'path' => '/pengaturan', 'owner_access' => true, 'admin_access' => false, 'kasir_access' => false, 'sort_order' => 8, 'status' => 'Aktif'],
            ['permission_id' => 'admin_dashboard', 'menu_name' => 'Dashboard Admin', 'menu_group' => 'admin', 'path' => '/admin/dashboard', 'owner_access' => true, 'admin_access' => true, 'kasir_access' => false, 'sort_order' => 9, 'status' => 'Aktif'],
            ['permission_id' => 'admin_products', 'menu_name' => 'Produk', 'menu_group' => 'admin', 'path' => '/admin/produk', 'owner_access' => true, 'admin_access' => true, 'kasir_access' => false, 'sort_order' => 10, 'status' => 'Aktif'],
            ['permission_id' => 'admin_stock_mutations', 'menu_name' => 'Mutasi Stok', 'menu_group' => 'stok', 'path' => '/admin/mutasi', 'owner_access' => true, 'admin_access' => true, 'kasir_access' => false, 'sort_order' => 11, 'status' => 'Aktif'],
            ['permission_id' => 'admin_stock_histories', 'menu_name' => 'Riwayat Stok', 'menu_group' => 'stok', 'path' => '/admin/riwayat', 'owner_access' => true, 'admin_access' => true, 'kasir_access' => false, 'sort_order' => 12, 'status' => 'Aktif'],
            ['permission_id' => 'admin_expenses', 'menu_name' => 'Pengeluaran Cabang', 'menu_group' => 'pengeluaran', 'path' => '/pengeluaran', 'owner_access' => true, 'admin_access' => true, 'kasir_access' => false, 'sort_order' => 13, 'status' => 'Aktif'],
            ['permission_id' => 'cashier_pos', 'menu_name' => 'POS / Transaksi', 'menu_group' => 'kasir', 'path' => '/', 'owner_access' => true, 'admin_access' => false, 'kasir_access' => true, 'sort_order' => 14, 'status' => 'Aktif'],
            ['permission_id' => 'cashier_shift', 'menu_name' => 'Shift Saya', 'menu_group' => 'kasir', 'path' => '/shift', 'owner_access' => true, 'admin_access' => false, 'kasir_access' => true, 'sort_order' => 15, 'status' => 'Aktif'],
            ['permission_id' => 'cashier_transactions', 'menu_name' => 'Riwayat Transaksi', 'menu_group' => 'kasir', 'path' => '/transaksi', 'owner_access' => true, 'admin_access' => false, 'kasir_access' => true, 'sort_order' => 16, 'status' => 'Aktif'],
        ];

        foreach ($defaults as $permission) {
            RolePermission::updateOrCreate(['permission_id' => $permission['permission_id']], $permission);
        }
    }

    public function index(Request $request)
    {
        try {
            $this->syncDefaults();

            $query = $this->baseQuery();

            $search = $request->query('search');
            $group = $request->query('group', 'all');
            $role = strtolower((string) $request->query('role', 'all'));
            $role = $role === 'kasir' ? 'cashier' : $role;

            $query->when($search, function ($builder) use ($search) {
                $builder->where(function ($q) use ($search) {
                    $q->where('menu_name', 'like', '%' . $search . '%')
                      ->orWhere('permission_id', 'like', '%' . $search . '%')
                      ->orWhere('menu_group', 'like', '%' . $search . '%')
                      ->orWhere('path', 'like', '%' . $search . '%');
                });
            });

            $query->when($group && $group !== 'all', function ($builder) use ($group) {
                $builder->where('menu_group', $group);
            });

            $permissions = $query->orderBy('sort_order')->get();
            $normalized = $this->normalizePermissions($permissions)->values();

            if ($role !== 'all') {
                $normalized = $normalized->filter(function ($item) use ($role) {
                    return ($item['roles'][$role] ?? false) === true;
                })->values();
            }

            $summary = [
                'total_features' => RolePermission::count(),
                'owner_enabled_count' => RolePermission::count(),
                'admin_enabled_count' => RolePermission::where('admin_access', true)->count(),
                'admin_disabled_count' => RolePermission::where('admin_access', false)->count(),
                'cashier_enabled_count' => RolePermission::where('kasir_access', true)->count(),
                'cashier_disabled_count' => RolePermission::where('kasir_access', false)->count(),
                'owner_menu_count' => RolePermission::where('menu_group', 'owner')->count(),
                'admin_menu_count' => RolePermission::where('menu_group', 'admin')->count(),
                'cashier_menu_count' => RolePermission::where('menu_group', 'kasir')->count(),
            ];

            return response()->json(['success' => true, 'data' => ['summary' => $summary, 'permissions' => $normalized, 'groups' => ['owner','admin','kasir','laporan','stok','pengeluaran'], 'roles' => ['owner','admin','cashier'], 'meta' => ['search' => $search ?? '', 'group' => $group, 'role' => $role]]]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Gagal mengambil data role permission.', 'error' => config('app.debug') ? $e->getMessage() : null], 500);
        }
    }

    public function update(Request $request, string $permissionId)
    {
        try {
            $data = $request->validate(['role' => ['nullable','string'], 'allowed' => ['nullable','boolean'], 'roles' => ['nullable','array']]);
            $permission = RolePermission::where('permission_id', $permissionId)->firstOrFail();

            if (in_array($permissionId, $this->criticalOwnerPermissionIds, true)) {
                $permission->owner_access = true;
            }

            if (isset($data['roles'])) {
                if (array_key_exists('admin', $data['roles'])) {
                    $permission->admin_access = (bool) $data['roles']['admin'];
                }
                if (array_key_exists('cashier', $data['roles'])) {
                    $permission->kasir_access = (bool) $data['roles']['cashier'];
                }
            } elseif (($data['role'] ?? null) === 'admin') {
                $permission->admin_access = (bool) ($data['allowed'] ?? false);
            } elseif (($data['role'] ?? null) === 'cashier' || ($data['role'] ?? null) === 'kasir') {
                $permission->kasir_access = (bool) ($data['allowed'] ?? false);
            }

            $permission->save();

            return response()->json(['success' => true, 'data' => $this->normalizePermissions(collect([$permission]))->first()]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Gagal mengambil data role permission.', 'error' => config('app.debug') ? $e->getMessage() : null], 500);
        }
    }

    public function enableAllAdmin()
    {
        RolePermission::whereIn('permission_id', $this->adminAllowedPermissionIds)->update(['admin_access' => true]);
        RolePermission::whereNotIn('permission_id', $this->adminAllowedPermissionIds)->update(['admin_access' => false]);
        return $this->index(request());
    }

    public function enableAllCashier()
    {
        RolePermission::whereIn('permission_id', $this->cashierAllowedPermissionIds)->update(['kasir_access' => true]);
        RolePermission::whereNotIn('permission_id', $this->cashierAllowedPermissionIds)->update(['kasir_access' => false]);
        return $this->index(request());
    }

    public function safeDefaults()
    {
        DB::transaction(function () {
            RolePermission::query()->update(['owner_access' => true, 'admin_access' => false, 'kasir_access' => false]);
            RolePermission::whereIn('permission_id', $this->adminAllowedPermissionIds)->update(['admin_access' => true]);
            RolePermission::whereIn('permission_id', $this->cashierAllowedPermissionIds)->update(['kasir_access' => true]);
            RolePermission::whereIn('permission_id', $this->criticalOwnerPermissionIds)->update(['owner_access' => true]);
        });

        return $this->index(request());
    }

    public function reset()
    {
        $this->syncDefaults();
        return $this->index(request());
    }
}
