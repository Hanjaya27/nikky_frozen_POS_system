<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RolePermission;
use Illuminate\Http\Request;

class RolePermissionController extends Controller
{
    private function defaultPermissions()
    {
        return [
            [
                'permission_id' => 'pos',
                'menu_name' => 'Kasir',
                'menu_group' => 'kasir',
                'path' => '/',
                'icon' => '🧾',
                'kasir_access' => true,
                'sort_order' => 1,
                'status' => 'Aktif',
            ],
            [
                'permission_id' => 'shift',
                'menu_name' => 'Shift Saya',
                'menu_group' => 'kasir',
                'path' => '/shift',
                'icon' => '🕒',
                'kasir_access' => true,
                'sort_order' => 2,
                'status' => 'Aktif',
            ],
            [
                'permission_id' => 'barang',
                'menu_name' => 'Barang & Stok',
                'menu_group' => 'kasir',
                'path' => '/barang',
                'icon' => '📦',
                'kasir_access' => true,
                'sort_order' => 3,
                'status' => 'Aktif',
            ],
            [
                'permission_id' => 'transaksi',
                'menu_name' => 'Riwayat Transaksi',
                'menu_group' => 'kasir',
                'path' => '/transaksi',
                'icon' => '🕘',
                'kasir_access' => true,
                'sort_order' => 4,
                'status' => 'Aktif',
            ],
            [
                'permission_id' => 'laporan',
                'menu_name' => 'Laporan',
                'menu_group' => 'kasir',
                'path' => '/laporan',
                'icon' => '📊',
                'kasir_access' => false,
                'sort_order' => 5,
                'status' => 'Aktif',
            ],
            [
                'permission_id' => 'pengeluaran',
                'menu_name' => 'Pengeluaran',
                'menu_group' => 'kasir',
                'path' => '/pengeluaran',
                'icon' => '💸',
                'kasir_access' => false,
                'sort_order' => 6,
                'status' => 'Aktif',
            ],
            [
                'permission_id' => 'data_kasir',
                'menu_name' => 'Data Kasir',
                'menu_group' => 'owner',
                'path' => '/owner/data-kasir',
                'icon' => '👥',
                'kasir_access' => false,
                'sort_order' => 7,
                'status' => 'Aktif',
            ],
            [
                'permission_id' => 'aktivitas_login',
                'menu_name' => 'Aktivitas Login',
                'menu_group' => 'owner',
                'path' => '/owner/aktivitas-login',
                'icon' => '🟢',
                'kasir_access' => false,
                'sort_order' => 8,
                'status' => 'Aktif',
            ],
            [
                'permission_id' => 'role_permission',
                'menu_name' => 'Role & Permission',
                'menu_group' => 'owner',
                'path' => '/owner/role-permission',
                'icon' => '🔐',
                'kasir_access' => false,
                'sort_order' => 9,
                'status' => 'Aktif',
            ],
            [
                'permission_id' => 'pengaturan',
                'menu_name' => 'Pengaturan',
                'menu_group' => 'kasir',
                'path' => '/pengaturan',
                'icon' => '⚙️',
                'kasir_access' => false,
                'sort_order' => 10,
                'status' => 'Aktif',
            ],
        ];
    }

    private function syncDefaultPermissions()
    {
        foreach ($this->defaultPermissions() as $permission) {
            RolePermission::updateOrCreate(
                [
                    'permission_id' => $permission['permission_id'],
                ],
                [
                    'menu_name' => $permission['menu_name'],
                    'menu_group' => $permission['menu_group'],
                    'path' => $permission['path'],
                    'icon' => $permission['icon'],
                    'sort_order' => $permission['sort_order'],
                    'status' => $permission['status'],
                ]
            );
        }
    }

    public function index()
    {
        $this->syncDefaultPermissions();

        $permissions = RolePermission::orderBy('sort_order', 'asc')->get();

        return response()->json([
            'success' => true,
            'message' => 'Data permission berhasil diambil.',
            'data' => $permissions,
        ]);
    }

    public function updateAll(Request $request)
    {
        $validatedData = $request->validate([
            'permissions' => ['required', 'array'],
            'permissions.*.permission_id' => ['required', 'string'],
            'permissions.*.kasir_access' => ['required', 'boolean'],
        ]);

        $this->syncDefaultPermissions();

        foreach ($validatedData['permissions'] as $permissionData) {
            RolePermission::where(
                'permission_id',
                $permissionData['permission_id']
            )->update([
                'kasir_access' => $permissionData['kasir_access'],
            ]);
        }

        $permissions = RolePermission::orderBy('sort_order', 'asc')->get();

        return response()->json([
            'success' => true,
            'message' => 'Permission berhasil diperbarui.',
            'data' => $permissions,
        ]);
    }

    public function updateSingle(Request $request, $permissionId)
    {
        $validatedData = $request->validate([
            'kasir_access' => ['required', 'boolean'],
        ]);

        $this->syncDefaultPermissions();

        $permission = RolePermission::where(
            'permission_id',
            $permissionId
        )->first();

        if (!$permission) {
            return response()->json([
                'success' => false,
                'message' => 'Permission tidak ditemukan.',
            ], 404);
        }

        $permission->update([
            'kasir_access' => $validatedData['kasir_access'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Permission berhasil diperbarui.',
            'data' => $permission,
        ]);
    }

    public function reset()
    {
        RolePermission::truncate();

        foreach ($this->defaultPermissions() as $permission) {
            RolePermission::create($permission);
        }

        $permissions = RolePermission::orderBy('sort_order', 'asc')->get();

        return response()->json([
            'success' => true,
            'message' => 'Permission berhasil direset ke default.',
            'data' => $permissions,
        ]);
    }
}
