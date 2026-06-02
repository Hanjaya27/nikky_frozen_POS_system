<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->unique()->after('name');

            $table->string('role')->default('kasir')->after('password');

            $table->foreignId('branch_id')
                ->nullable()
                ->after('role')
                ->constrained('branches')
                ->nullOnDelete();

            $table->string('shift_name')->nullable()->after('branch_id');
            $table->string('phone')->nullable()->after('shift_name');

            $table->string('status')->default('Aktif')->after('phone');
            $table->timestamp('last_login_at')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropUnique(['username']);

            $table->dropColumn([
                'username',
                'role',
                'branch_id',
                'shift_name',
                'phone',
                'status',
                'last_login_at',
            ]);
        });
    }
};
