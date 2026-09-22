<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInventoryItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:150'],
            'sku' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string', 'max:1000'],
            'category' => ['nullable', 'string', 'max:100'],
            'quantity' => ['required', 'integer', 'min:0'],
            'min_threshold' => ['required', 'integer', 'min:0'],
            'unit' => ['required', 'string', 'max:20'],
            'unit_price' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
