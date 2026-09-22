<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreClientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:30'],
            'birth_date' => ['nullable', 'date', 'before:today'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'metadata' => ['nullable', 'array'],
        ];
    }

    public function messages(): array
    {
        return [
            'first_name.required' => 'Emri është i detyrueshëm.',
            'last_name.required' => 'Mbiemri është i detyrueshëm.',
            'phone.required' => 'Telefoni është i detyrueshëm.',
            'email.email' => 'Email-i nuk është valid.',
        ];
    }
}
