<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Branch;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $branch1 = Branch::where('code', 'CBG-01')->first();
        $branch2 = Branch::where('code', 'CBG-02')->first();

        if (!$branch1 || !$branch2) {
            return;
        }

        DB::table('products')->insert([
            // CABANG 1
            [
                'branch_id' => $branch1->id,
                'code' => 'NF-SS-001',
                'name' => 'Sosis Sapi',
                'category' => 'Sosis',
                'stock' => 50,
                'store_stock' => 10,
                'warehouse_stock' => 40,
                'min_stock' => 5,
                'price' => 42000,
                'expired_date' => '2026-12-31',
                'storage_location' => 'Toko Depan',
                'image' => 'products/sosis-sapi.jpg',
                'status' => 'Aktif',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'branch_id' => $branch1->id,
                'code' => 'NF-NA-001',
                'name' => 'Nugget Ayam',
                'category' => 'Nugget',
                'stock' => 42,
                'store_stock' => 12,
                'warehouse_stock' => 30,
                'min_stock' => 5,
                'price' => 35000,
                'expired_date' => '2026-12-31',
                'storage_location' => 'Toko Depan',
                'image' => 'products/kanzler-nugget.jpg',
                'status' => 'Aktif',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'branch_id' => $branch1->id,
                'code' => 'NF-KF-001',
                'name' => 'Kentang Frozen',
                'category' => 'Kentang',
                'stock' => 33,
                'store_stock' => 8,
                'warehouse_stock' => 25,
                'min_stock' => 5,
                'price' => 28000,
                'expired_date' => '2026-12-31',
                'storage_location' => 'Toko Depan',
                'image' => 'products/kentang-frozen.jpg',
                'status' => 'Aktif',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'branch_id' => $branch1->id,
                'code' => 'NF-BS-001',
                'name' => 'Beef Slice',
                'category' => 'Daging',
                'stock' => 26,
                'store_stock' => 6,
                'warehouse_stock' => 20,
                'min_stock' => 5,
                'price' => 75000,
                'expired_date' => '2026-12-31',
                'storage_location' => 'Toko Depan',
                'image' => 'products/beef-slice.jpg',
                'status' => 'Aktif',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // CABANG 2
            [
                'branch_id' => $branch2->id,
                'code' => 'NF-SS-002',
                'name' => 'Sosis Sapi',
                'category' => 'Sosis',
                'stock' => 42,
                'store_stock' => 7,
                'warehouse_stock' => 35,
                'min_stock' => 5,
                'price' => 42000,
                'expired_date' => '2026-12-31',
                'storage_location' => 'Toko Depan',
                'image' => 'products/sosis-sapi.jpg',
                'status' => 'Aktif',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'branch_id' => $branch2->id,
                'code' => 'NF-NA-002',
                'name' => 'Nugget Ayam',
                'category' => 'Nugget',
                'stock' => 37,
                'store_stock' => 9,
                'warehouse_stock' => 28,
                'min_stock' => 5,
                'price' => 35000,
                'expired_date' => '2026-12-31',
                'storage_location' => 'Toko Depan',
                'image' => 'products/kanzler-nugget.jpg',
                'status' => 'Aktif',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'branch_id' => $branch2->id,
                'code' => 'NF-KF-002',
                'name' => 'Kentang Frozen',
                'category' => 'Kentang',
                'stock' => 26,
                'store_stock' => 6,
                'warehouse_stock' => 20,
                'min_stock' => 5,
                'price' => 28000,
                'expired_date' => '2026-12-31',
                'storage_location' => 'Toko Depan',
                'image' => 'products/kentang-frozen.jpg',
                'status' => 'Aktif',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'branch_id' => $branch2->id,
                'code' => 'NF-BS-002',
                'name' => 'Beef Slice',
                'category' => 'Daging',
                'stock' => 20,
                'store_stock' => 5,
                'warehouse_stock' => 15,
                'min_stock' => 5,
                'price' => 75000,
                'expired_date' => '2026-12-31',
                'storage_location' => 'Toko Depan',
                'image' => 'products/beef-slice.jpg',
                'status' => 'Aktif',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
