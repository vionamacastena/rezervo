<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTenantRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $tenantId = $this->route('tenant')->id ?? null;

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:100', 'alpha_dash', Rule::unique('tenants', 'slug')->ignore($tenantId)],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:255'],
            'timezone' => ['nullable', 'string', 'max:50'],
            'currency' => ['nullable', 'string', 'size:3'],
            'status' => ['sometimes', 'in:active,trial,suspended'],
        ];
    }
}
