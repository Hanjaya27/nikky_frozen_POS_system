<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    protected $fillable = [
        'branch_id',
        'expense_date',
        'category',
        'description',
        'amount',
        'user_name',
        'username',
        'status',
    ];

    protected $casts = [
        'expense_date' => 'date',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
