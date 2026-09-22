<?php

namespace App\Notifications;

use App\Models\Reservation;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NewReservationNotification extends Notification
{
    use Queueable;

    public function __construct(public Reservation $reservation) {}

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toDatabase($notifiable): array
    {
        $r = $this->reservation->loadMissing(['client', 'service']);

        return [
            'type' => 'new_reservation',
            'reservation_id' => $r->id,
            'reservation_code' => $r->code,
            'client_name' => $r->client?->full_name ?? 'Klient',
            'client_phone' => $r->client?->phone ?? null,
            'service_name' => $r->service?->name ?? null,
            'starts_at' => $r->starts_at->toIso8601String(),
            'total_price' => (float) $r->total_price,
            'currency' => $r->currency,
            'title' => 'Rezervim i re',
            'message' => sprintf(
                '%s — %s',
                $r->client?->full_name ?? 'Klient',
                $r->starts_at->format('d.m.Y H:i')
            ),
        ];
    }

    public function toArray($notifiable): array
    {
        return $this->toDatabase($notifiable);
    }
}
