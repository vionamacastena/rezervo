<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTenantRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:100', 'alpha_dash', Rule::unique('tenants', 'slug')],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:255'],
            'timezone' => ['nullable', 'string', 'max:50'],
            'currency' => ['nullable', 'string', 'size:3'],
            'status' => ['required', 'in:active,trial,suspended'],
            'owner_name' => ['required', 'string', 'max:255'],
            'owner_email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'owner_password' => ['required', 'string', 'min:8'],
            'owner_phone' => ['nullable', 'string', 'max:30'],
        ];
    }

    public function messages(): array
    {
        return [
            'slug.unique' => 'Ky slug është i zënë.',
            'owner_email.unique' => 'Ky email është i regjistruar më parë.',
            'owner_password.min' => 'Fjalëkalimi duhet të paktën 8 karaktere.',
        ];
    }
}
