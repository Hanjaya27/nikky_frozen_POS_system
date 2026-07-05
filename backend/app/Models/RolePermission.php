<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RolePermission extends Model
{
    protected $fillable = [
        'permission_id',
        'menu_name',
        'menu_group',
        'path',
        'icon',
        'owner_access',
        'admin_access',
        'kasir_access',
        'sort_order',
        'status',
    ];

    protected $casts = [
        'owner_access' => 'boolean',
        'admin_access' => 'boolean',
        'kasir_access' => 'boolean',
    ];
}
