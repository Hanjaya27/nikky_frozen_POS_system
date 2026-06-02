<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BranchSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('branches')->insert([
            [
                'name' => 'Cabang 1',
                'code' => 'CBG-001',
                'address' => 'Alamat Cabang 1 Nikky Frozen',
                'phone' => '081234567001',
                'status' => 'Aktif',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Cabang 2',
                'code' => 'CBG-002',
                'address' => 'Alamat Cabang 2 Nikky Frozen',
                'phone' => '081234567002',
                'status' => 'Aktif',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
