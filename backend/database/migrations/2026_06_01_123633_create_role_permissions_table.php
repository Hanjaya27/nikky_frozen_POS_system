<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('role_permissions', function (Blueprint $table) {
            $table->id();

            $table->string('permission_id')->unique();
            $table->string('menu_name');
            $table->string('menu_group')->default('kasir');

            $table->string('path')->nullable();
            $table->string('icon')->nullable();

            $table->boolean('kasir_access')->default(false);
            $table->integer('sort_order')->default(0);

            $table->string('status')->default('Aktif');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('role_permissions');
    }
};
