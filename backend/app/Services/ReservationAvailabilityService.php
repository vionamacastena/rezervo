<?php

namespace App\Services;

use App\Models\Reservation;
use Carbon\Carbon;

class ReservationAvailabilityService
{
    /**
     * Kontrollo nëse ka mbivendosje për të njëjtin resource në të njëjtën kohë.
     */
    public static function isAvailable(
        int $tenantId,
        string $resource,
        Carbon $startsAt,
        Carbon $endsAt,
        ?int $excludeReservationId = null
    ): bool {
        $query = Reservation::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->where('resource', $resource)
            ->whereIn('status', ['tentative', 'confirmed'])
            ->where(function ($q) use ($startsAt, $endsAt) {
                $q->whereBetween('starts_at', [$startsAt, $endsAt])
                    ->orWhereBetween('ends_at', [$startsAt, $endsAt])
                    ->orWhere(function ($q2) use ($startsAt, $endsAt) {
                        $q2->where('starts_at', '<=', $startsAt)
                            ->where('ends_at', '>=', $endsAt);
                    });
            });

        if ($excludeReservationId) {
            $query->where('id', '!=', $excludeReservationId);
        }

        return $query->count() === 0;
    }
}
