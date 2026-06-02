<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $fillable = [
        'branch_id',
        'invoice_number',
        'cashier_name',
        'username',
        'shift_name',
        'total_item',
        'subtotal',
        'discount',
        'tax',
        'tax_rate',
        'grand_total',
        'payment_method',
        'paid_amount',
        'change_amount',
        'status',
        'transaction_date',
    ];

    protected $casts = [
        'transaction_date' => 'datetime',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function items()
    {
        return $this->hasMany(TransactionItem::class);
    }
}
