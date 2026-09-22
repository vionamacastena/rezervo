<?php

namespace App\Services;

use App\Models\Reservation;
use InvalidArgumentException;

class ReservationStateMachine
{
    // Kalimet e lejuara nga secili status
    public const TRANSITIONS = [
        'draft'      => ['tentative', 'confirmed', 'cancelled'],
        'tentative'  => ['confirmed', 'cancelled'],
        'confirmed'  => ['completed', 'cancelled'],
        'completed'  => [],              // final
        'cancelled'  => [],              // final
    ];

    public static function canTransition(string $from, string $to): bool
    {
        return in_array($to, self::TRANSITIONS[$from] ?? [], true);
    }

    public static function transition(Reservation $reservation, string $to, ?string $reason = null): void
    {
        $from = $reservation->status;

        if (! self::canTransition($from, $to)) {
            throw new InvalidArgumentException(
                "Kalim i palejuar: {$from} → {$to}"
            );
        }

        $reservation->status = $to;

        match ($to) {
            'confirmed' => $reservation->confirmed_at = now(),
            'completed' => $reservation->completed_at = now(),
            'cancelled' => tap($reservation, function ($r) use ($reason) {
                $r->cancelled_at = now();
                $r->cancellation_reason = $reason;
            }),
            default => null,
        };

        $reservation->save();
    }
}
