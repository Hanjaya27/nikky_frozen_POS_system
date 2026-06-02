<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('login_activities', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('branch_id')
                ->nullable()
                ->constrained('branches')
                ->nullOnDelete();

            $table->string('name');
            $table->string('username');
            $table->string('role')->default('kasir');

            $table->string('branch_name')->nullable();
            $table->string('shift_name')->nullable();

            $table->timestamp('login_at')->nullable();
            $table->timestamp('logout_at')->nullable();

            $table->string('status')->default('Login');

            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->string('device')->nullable();

            $table->text('note')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('login_activities');
    }
};
