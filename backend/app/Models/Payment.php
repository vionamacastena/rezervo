<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'reservation_id',
        'created_by',
        'payment_id',
        'amount',
        'currency',
        'method',
        'payment_date',
        'notes',
        'is_deletable',
        'locked_at',
    ];

    protected $casts = [
        'payment_date' => 'date',
        'locked_at' => 'datetime',
        'amount' => 'decimal:2',
        'is_deletable' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (Payment $payment) {
            if (empty($payment->payment_id)) {
                $payment->payment_id = 'PAY-' . strtoupper(Str::random(12));
            }
        });
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
    public function reservation()
    {
        return $this->belongsTo(Reservation::class);
    }
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
