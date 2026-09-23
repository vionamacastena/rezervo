<?php

namespace App\Services;

use App\Models\BlockedSlot;
use App\Models\Reservation;
use App\Models\Service;
use Carbon\Carbon;

class AvailabilityService
{
    public const WORK_START = '09:00';
    public const WORK_END = '18:00';
    public const STEP_MINUTES = 30;

    public static function getSlots(int $tenantId, string $date, Service $service): array
    {
        $day = Carbon::parse($date)->startOfDay();
        $now = now();

        if ($day->lt($now->copy()->startOfDay())) {
            return [];
        }

        $workStart = $day->copy()->setTimeFromTimeString(self::WORK_START);
        $workEnd = $day->copy()->setTimeFromTimeString(self::WORK_END);

        $slots = [];
        $cursor = $workStart->copy();
        $duration = $service->duration_minutes;

        // Marrim rezervimet ekzistuese
        $existingReservations = Reservation::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->whereIn('status', ['tentative', 'confirmed'])
            ->whereDate('starts_at', $day)
            ->get(['starts_at', 'ends_at']);

        // Marrim bllokimet
        $blockedSlots = BlockedSlot::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->whereDate('starts_at', $day)
            ->get(['starts_at', 'ends_at', 'reason']);

        while ($cursor->copy()->addMinutes($duration)->lte($workEnd)) {
            $slotStart = $cursor->copy();
            $slotEnd = $cursor->copy()->addMinutes($duration);

            $available = true;
            $reason = null;

            if ($slotStart->lt($now)) {
                $available = false;
                $reason = 'past';
            }

            // Kontrollo rezervimet
            if ($available) {
                foreach ($existingReservations as $r) {
                    $rStart = Carbon::parse($r->starts_at);
                    $rEnd = Carbon::parse($r->ends_at);
                    if ($slotStart->lt($rEnd) && $slotEnd->gt($rStart)) {
                        $available = false;
                        $reason = 'booked';
                        break;
                    }
                }
            }

            // Kontrollo bllokimet
            if ($available) {
                foreach ($blockedSlots as $b) {
                    $bStart = Carbon::parse($b->starts_at);
                    $bEnd = Carbon::parse($b->ends_at);
                    if ($slotStart->lt($bEnd) && $slotEnd->gt($bStart)) {
                        $available = false;
                        $reason = 'blocked';
                        break;
                    }
                }
            }

            $slots[] = [
                'time' => $slotStart->format('H:i'),
                'datetime' => $slotStart->toIso8601String(),
                'ends_at' => $slotEnd->toIso8601String(),
                'available' => $available,
                'reason' => $reason,
            ];

            $cursor->addMinutes(self::STEP_MINUTES);
        }

        return $slots;
    }
}
