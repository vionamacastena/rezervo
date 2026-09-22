<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReservationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'client_id' => ['required', 'exists:clients,id'],
            'starts_at' => ['required', 'date', 'after:now'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'guests_count' => ['required', 'integer', 'min:1', 'max:500'],
            'resource' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'total_price' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            'status' => ['nullable', 'in:draft,tentative,confirmed'],
        ];
    }

    public function messages(): array
    {
        return [
            'client_id.required' => 'Klienti është i detyrueshëm.',
            'client_id.exists' => 'Klienti nuk ekziston.',
            'starts_at.after' => 'Data e fillimit duhet të jetë në të ardhmen.',
            'ends_at.after' => 'Data e mbarimit duhet të jetë pas fillimit.',
            'guests_count.min' => 'Numri i mysafirëve duhet të jetë të paktën 1.',
        ];
    }
}
