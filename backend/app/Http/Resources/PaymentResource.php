<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'payment_id' => $this->payment_id,
            'reservation_id' => $this->reservation_id,
            'amount' => (float) $this->amount,
            'currency' => $this->currency,
            'method' => $this->method,
            'payment_date' => $this->payment_date->format('Y-m-d'),
            'notes' => $this->notes,
            'is_deletable' => $this->is_deletable && ! $this->isLocked(),
            'created_at' => $this->created_at->toIso8601String(),
            'creator' => $this->whenLoaded('creator', fn() => [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
            ]),
            'reservation' => $this->whenLoaded('reservation', fn() => [
                'id' => $this->reservation->id,
                'code' => $this->reservation->code,
            ]),
        ];
    }

    private function isLocked(): bool
    {
        // Fshirja lejohet vetëm brenda 24 orësh
        return $this->created_at->diffInHours(now()) >= 24;
    }
}
