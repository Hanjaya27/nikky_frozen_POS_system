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
        Schema::create('products', function (Blueprint $table) {
            $table->id();

            $table->foreignId('branch_id')
                ->constrained('branches')
                ->cascadeOnDelete();

            $table->string('code')->unique();
            $table->string('name');
            $table->string('category');
            $table->integer('stock')->default(0);
            $table->integer('min_stock')->default(0);
            $table->integer('price')->default(0);
            $table->date('expired_date')->nullable();
            $table->string('storage_location')->nullable();
            $table->string('image')->nullable();
            $table->string('status')->default('Aktif');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
