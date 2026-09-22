<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::firstOrCreate(
            ['slug' => 'demo'],
            [
                'name' => 'Rezervo Demo',
                'email' => 'demo@rezervo.com',
                'status' => 'active',
                'currency' => 'EUR',
                'timezone' => 'Europe/Tirane',
            ]
        );

        $admin = User::firstOrCreate(
            ['email' => 'admin@rezervo.com'],
            [
                'tenant_id' => $tenant->id,
                'name' => 'Super Admin',
                'password' => Hash::make('Admin12345!'),
                'status' => 'active',
            ]
        );

        $admin->assignRole('super_admin');

        $this->command->info('Admin: admin@rezervo.com / Admin12345!');
        $this->command->info('Tenant: ' . $tenant->slug);
    }
}
