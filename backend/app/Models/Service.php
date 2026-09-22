<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Service extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'name', 'description', 'duration_minutes',
        'price', 'currency', 'color', 'category', 'is_active', 'sort_order',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_active' => 'boolean',
        'duration_minutes' => 'integer',
    ];

    public function tenant() { return $this->belongsTo(Tenant::class); }
    public function reservations() { return $this->hasMany(Reservation::class); }
}
