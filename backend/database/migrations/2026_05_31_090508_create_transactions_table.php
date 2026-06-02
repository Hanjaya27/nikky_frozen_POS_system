<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('branch_id')
                ->constrained('branches')
                ->cascadeOnDelete();

            $table->string('invoice_number')->unique();

            $table->string('cashier_name')->nullable();
            $table->string('username')->nullable();
            $table->string('shift_name')->nullable();

            $table->integer('total_item')->default(0);
            $table->integer('subtotal')->default(0);
            $table->integer('discount')->default(0);
            $table->integer('tax')->default(0);
            $table->integer('tax_rate')->default(11);
            $table->integer('grand_total')->default(0);

            $table->string('payment_method')->default('Tunai');
            $table->integer('paid_amount')->default(0);
            $table->integer('change_amount')->default(0);

            $table->string('status')->default('Berhasil');
            $table->timestamp('transaction_date')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
