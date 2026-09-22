<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReservationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'status' => $this->status,
            'starts_at' => $this->starts_at->toIso8601String(),
            'ends_at' => $this->ends_at->toIso8601String(),
            'guests_count' => $this->guests_count,
            'resource' => $this->getAttribute('resource'),
            'notes' => $this->notes,
            'total_price' => (float) $this->total_price,
            'currency' => $this->currency,
            'paid_amount' => $this->when(
                $this->relationLoaded('payments'),
                fn() => (float) $this->payments->sum('amount')
            ),
            'balance' => $this->when(
                $this->relationLoaded('payments'),
                fn() => (float) $this->total_price - $this->payments->sum('amount')
            ),
            'cancellation_reason' => $this->cancellation_reason,
            'confirmed_at' => $this->confirmed_at?->toIso8601String(),
            'completed_at' => $this->completed_at?->toIso8601String(),
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
            'client' => new ClientResource($this->whenLoaded('client')),
            'creator' => $this->whenLoaded('creator', fn() => [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
            ]),
            'payments' => PaymentResource::collection($this->whenLoaded('payments')),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
