<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreStaffMemberRequest extends FormRequest
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
            'phone' => ['nullable', 'string', 'max:30'],
            'position' => ['nullable', 'string', 'max:100'],
            'hourly_rate' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['boolean'],
            'working_hours' => ['nullable', 'array'],
            'user_id' => ['nullable', 'exists:users,id'],
        ];
    }
}
