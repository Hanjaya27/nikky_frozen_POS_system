<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('products')->insert([
            [
                'branch_id' => 1,
                'code' => 'NF-001-C1',
                'name' => 'Chicken Nugget',
                'category' => 'Frozen Food',
                'stock' => 35,
                'min_stock' => 10,
                'price' => 28000,
                'expired_date' => '2026-08-12',
                'storage_location' => 'A1',
                'image' => null,
                'status' => 'Aktif',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'branch_id' => 1,
                'code' => 'NF-002-C1',
                'name' => 'Sosis Ayam',
                'category' => 'Frozen Food',
                'stock' => 42,
                'min_stock' => 10,
                'price' => 25000,
                'expired_date' => '2026-07-20',
                'storage_location' => 'A2',
                'image' => null,
                'status' => 'Aktif',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'branch_id' => 1,
                'code' => 'NF-003-C1',
                'name' => 'Bakso Sapi',
                'category' => 'Frozen Food',
                'stock' => 20,
                'min_stock' => 10,
                'price' => 32000,
                'expired_date' => '2026-09-05',
                'storage_location' => 'A3',
                'image' => null,
                'status' => 'Aktif',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'branch_id' => 2,
                'code' => 'NF-001-C2',
                'name' => 'Chicken Nugget',
                'category' => 'Frozen Food',
                'stock' => 30,
                'min_stock' => 10,
                'price' => 28000,
                'expired_date' => '2026-08-12',
                'storage_location' => 'B1',
                'image' => null,
                'status' => 'Aktif',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'branch_id' => 2,
                'code' => 'NF-002-C2',
                'name' => 'Sosis Ayam',
                'category' => 'Frozen Food',
                'stock' => 38,
                'min_stock' => 10,
                'price' => 25000,
                'expired_date' => '2026-07-20',
                'storage_location' => 'B2',
                'image' => null,
                'status' => 'Aktif',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'branch_id' => 2,
                'code' => 'NF-003-C2',
                'name' => 'Kentang Frozen',
                'category' => 'Snack',
                'stock' => 25,
                'min_stock' => 8,
                'price' => 22000,
                'expired_date' => '2026-06-30',
                'storage_location' => 'B3',
                'image' => null,
                'status' => 'Aktif',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
