<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('role_permissions', function (Blueprint $table) {
            if (!Schema::hasColumn('role_permissions', 'owner_access')) {
                $table->boolean('owner_access')->default(true)->after('icon');
            }
        });
    }

    public function down(): void
    {
        Schema::table('role_permissions', function (Blueprint $table) {
            if (Schema::hasColumn('role_permissions', 'owner_access')) {
                $table->dropColumn('owner_access');
            }
        });
    }
};
