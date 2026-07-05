<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $branch1 = \App\Models\Branch::firstOrCreate(
            ['code' => 'CBG-01'],
            ['name' => 'Cabang 1', 'address' => 'Alamat Cabang 1', 'phone' => '0800000001']
        );

        $branch2 = \App\Models\Branch::firstOrCreate(
            ['code' => 'CBG-02'],
            ['name' => 'Cabang 2', 'address' => 'Alamat Cabang 2', 'phone' => '0800000002']
        );

        User::updateOrCreate(
            ['username' => 'owner'],
            [
                'name' => 'Owner Nikky Frozen',
                'email' => 'owner@nikkyfrozen.test',
                'password' => Hash::make('owner123'),
                'role' => 'owner',
                'branch_id' => null,
                'shift_name' => 'Monitoring Owner',
                'phone' => '080000000001',
                'status' => 'Aktif',
            ]
        );

        User::updateOrCreate(
            ['username' => 'admin1'],
            [
                'name' => 'Admin Cabang 1',
                'email' => 'admin1@nikkyfrozen.test',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'branch_id' => $branch1->id,
                'shift_name' => null,
                'phone' => '080000000004',
                'status' => 'Aktif',
            ]
        );

        User::updateOrCreate(
            ['username' => 'admin2'],
            [
                'name' => 'Admin Cabang 2',
                'email' => 'admin2@nikkyfrozen.test',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'branch_id' => $branch2->id,
                'shift_name' => null,
                'phone' => '080000000005',
                'status' => 'Aktif',
            ]
        );

        User::updateOrCreate(
            ['username' => 'kasir1'],
            [
                'name' => 'Kasir Cabang 1',
                'email' => 'kasir1@nikkyfrozen.test',
                'password' => Hash::make('kasir123'),
                'role' => 'kasir',
                'branch_id' => $branch1->id,
                'shift_name' => 'Shift Pagi',
                'phone' => '080000000002',
                'status' => 'Aktif',
            ]
        );

        User::updateOrCreate(
            ['username' => 'kasir2'],
            [
                'name' => 'Kasir Cabang 2',
                'email' => 'kasir2@nikkyfrozen.test',
                'password' => Hash::make('kasir123'),
                'role' => 'kasir',
                'branch_id' => $branch2->id,
                'shift_name' => 'Shift Sore',
                'phone' => '080000000003',
                'status' => 'Aktif',
            ]
        );

        $this->call([
            ProductSeeder::class,
            RolePermissionSeeder::class,
        ]);
    }
}
