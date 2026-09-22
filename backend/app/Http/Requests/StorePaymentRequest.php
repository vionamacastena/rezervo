<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reservation_id' => ['required', 'exists:reservations,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'method' => ['required', 'in:cash,card,bank_transfer,online,other'],
            'payment_date' => ['required', 'date', 'before_or_equal:today'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'reservation_id.required' => 'Rezervimi është i detyrueshëm.',
            'amount.min' => 'Shuma duhet të jetë më e madhe se 0.',
            'payment_date.before_or_equal' => 'Data nuk mund të jetë në të ardhmen.',
        ];
    }
}
