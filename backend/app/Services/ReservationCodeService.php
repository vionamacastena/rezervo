<?php

namespace App\Services;

use App\Models\Reservation;
use App\Models\Tenant;

class ReservationCodeService
{
    /**
     * Gjenero kod unik për tenant.
     * Format: {PREFIX}-{YEAR}-{0000}
     * Shembull: BK-2026-0001 (Barber King), BN-2026-0001 (Blooming Nails)
     */
    public static function generate(int $tenantId): string
    {
        $tenant = Tenant::find($tenantId);

        // Krijo prefix nga slug-u (maks 5 karaktere)
        $slugPrefix = $tenant
            ? strtoupper(substr(preg_replace('/[^a-z0-9]/', '', $tenant->slug), 0, 5))
            : 'RES';

        $year = now()->format('Y');
        $prefix = "{$slugPrefix}-{$year}-";

        // Gjej kodin e fundit me këtë prefix për këtë tenant
        $lastCode = Reservation::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->where('code', 'like', "{$prefix}%")
            ->orderBy('id', 'desc')
            ->value('code');

        $nextNumber = 1;
        if ($lastCode) {
            $nextNumber = ((int) substr($lastCode, -4)) + 1;
        }

        // Sigurohu që kodi është unik (loop në rast konflikti)
        $code = $prefix . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
        $attempts = 0;
        while (
            Reservation::withoutGlobalScopes()
                ->where('tenant_id', $tenantId)
                ->where('code', $code)
                ->exists()
            && $attempts < 100
        ) {
            $nextNumber++;
            $code = $prefix . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
            $attempts++;
        }

        return $code;
    }
}
