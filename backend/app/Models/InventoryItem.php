<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class InventoryItem extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'name',
        'sku',
        'description',
        'category',
        'quantity',
        'min_threshold',
        'unit',
        'unit_price',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function getIsLowStockAttribute(): bool
    {
        return $this->quantity <= $this->min_threshold;
    }
}
