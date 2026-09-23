<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Tenant extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'email',
        'phone',
        'address',
        'logo_path',
        'timezone',
        'currency',
        'status',
        'trial_ends_at',
        'settings',
    ];

    protected $casts = [
        'settings' => 'array',
        'trial_ends_at' => 'datetime',
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }
    public function clients()
    {
        return $this->hasMany(Client::class);
    }
    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }
    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
    public function staffMembers()
    {
        return $this->hasMany(StaffMember::class);
    }
    public function services()
    {
        return $this->hasMany(Service::class);
    }
    public function inventoryItems()
    {
        return $this->hasMany(InventoryItem::class);
    }
    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class);
    }
    public function blockedSlots()
    {
        return $this->hasMany(BlockedSlot::class);
    }
}
