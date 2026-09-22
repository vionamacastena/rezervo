<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateReservationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'client_id' => ['sometimes', 'exists:clients,id'],
            'starts_at' => ['sometimes', 'date'],
            'ends_at' => ['sometimes', 'date', 'after:starts_at'],
            'guests_count' => ['sometimes', 'integer', 'min:1'],
            'resource' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'total_price' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
        ];
    }
}
