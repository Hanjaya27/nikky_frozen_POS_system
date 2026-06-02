<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
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
            ['username' => 'kasir1'],
            [
                'name' => 'Kasir Cabang 1',
                'email' => 'kasir1@nikkyfrozen.test',
                'password' => Hash::make('kasir123'),
                'role' => 'kasir',
                'branch_id' => 1,
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
                'branch_id' => 2,
                'shift_name' => 'Shift Sore',
                'phone' => '080000000003',
                'status' => 'Aktif',
            ]
        );
    }
}
