<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventoryItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'sku' => $this->sku,
            'description' => $this->description,
            'category' => $this->category,
            'quantity' => $this->quantity,
            'min_threshold' => $this->min_threshold,
            'unit' => $this->unit,
            'unit_price' => $this->unit_price ? (float) $this->unit_price : null,
            'total_value' => $this->unit_price ? (float) $this->unit_price * $this->quantity : null,
            'is_low_stock' => $this->is_low_stock,
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
