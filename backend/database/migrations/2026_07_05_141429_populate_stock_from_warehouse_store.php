<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        \Illuminate\Support\Facades\DB::statement('
            UPDATE products
            SET stock = COALESCE(warehouse_stock, 0) + COALESCE(store_stock, 0)
            WHERE stock = 0
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
    }
};
