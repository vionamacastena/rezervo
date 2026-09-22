<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Client extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant;   // <-- shto BelongsToTenant

    protected $fillable = [
        'tenant_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'birth_date',
        'notes',
        'metadata',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'metadata' => 'array',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }
}
