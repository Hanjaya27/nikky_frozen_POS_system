<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Shift extends Model
{
    protected $fillable = [
        'branch_id',
        'cashier_name',
        'username',
        'shift_name',
        'opening_cash',
        'closing_cash',
        'opened_at',
        'closed_at',
        'total_sales',
        'total_transactions',
        'expected_cash',
        'cash_difference',
        'note',
        'status',
    ];

    protected $casts = [
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
