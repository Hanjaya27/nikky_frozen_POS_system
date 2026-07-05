<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('role_permissions', function (Blueprint $table) {
            if (!Schema::hasColumn('role_permissions', 'admin_access')) {
                $table->boolean('admin_access')->default(false)->after('kasir_access');
            }
        });
    }

    public function down(): void
    {
        Schema::table('role_permissions', function (Blueprint $table) {
            if (Schema::hasColumn('role_permissions', 'admin_access')) {
                $table->dropColumn('admin_access');
            }
        });
    }
};
