<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount' => ['sometimes', 'numeric', 'min:0.01'],
            'method' => ['sometimes', 'in:cash,card,bank_transfer,online,other'],
            'payment_date' => ['sometimes', 'date', 'before_or_equal:today'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
