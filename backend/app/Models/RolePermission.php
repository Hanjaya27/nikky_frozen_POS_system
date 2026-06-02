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
        'kasir_access',
        'sort_order',
        'status',
    ];

    protected $casts = [
        'kasir_access' => 'boolean',
    ];
}
