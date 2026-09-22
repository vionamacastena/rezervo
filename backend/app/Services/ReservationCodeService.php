<?php

namespace App\Services;

use App\Models\Reservation;

class ReservationCodeService
{
    public static function generate(int $tenantId): string
    {
        $year = now()->format('Y');
        $prefix = "RES-{$year}-";

        $lastCode = Reservation::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->where('code', 'like', "{$prefix}%")
            ->orderBy('id', 'desc')
            ->value('code');

        $nextNumber = 1;
        if ($lastCode) {
            $nextNumber = ((int) substr($lastCode, -4)) + 1;
        }

        return $prefix . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }
}
