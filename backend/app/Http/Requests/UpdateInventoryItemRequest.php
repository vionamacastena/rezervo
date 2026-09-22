<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateInventoryItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:150'],
            'sku' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string', 'max:1000'],
            'category' => ['nullable', 'string', 'max:100'],
            'quantity' => ['sometimes', 'integer', 'min:0'],
            'min_threshold' => ['sometimes', 'integer', 'min:0'],
            'unit' => ['sometimes', 'string', 'max:20'],
            'unit_price' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
