<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'branch_id',
        'code',
        'name',
        'category',
        'stock',
        'store_stock',
        'warehouse_stock',
        'min_stock',
        'price',
        'expired_date',
        'storage_location',
        'image',
        'status',
    ];

    protected $casts = [
        'stock' => 'integer',
        'store_stock' => 'integer',
        'warehouse_stock' => 'integer',
        'price' => 'integer',
        'min_stock' => 'integer',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function transactionItems()
    {
        return $this->hasMany(TransactionItem::class);
    }

    public function stockHistories()
    {
        return $this->hasMany(StockHistory::class);
    }
}
