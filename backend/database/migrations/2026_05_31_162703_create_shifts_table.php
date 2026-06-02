<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shifts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('branch_id')
                ->constrained('branches')
                ->cascadeOnDelete();

            $table->string('cashier_name');
            $table->string('username');

            $table->string('shift_name')->default('Shift Pagi');

            $table->integer('opening_cash')->default(0);
            $table->integer('closing_cash')->nullable();

            $table->timestamp('opened_at')->nullable();
            $table->timestamp('closed_at')->nullable();

            $table->integer('total_sales')->default(0);
            $table->integer('total_transactions')->default(0);
            $table->integer('expected_cash')->default(0);
            $table->integer('cash_difference')->default(0);

            $table->text('note')->nullable();

            $table->string('status')->default('Berjalan');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shifts');
    }
};
