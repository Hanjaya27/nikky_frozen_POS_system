<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoginActivity extends Model
{
    protected $fillable = [
        'user_id',
        'branch_id',
        'name',
        'username',
        'role',
        'branch_name',
        'shift_name',
        'login_at',
        'logout_at',
        'status',
        'ip_address',
        'user_agent',
        'device',
        'note',
    ];

    protected $casts = [
        'login_at' => 'datetime',
        'logout_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
