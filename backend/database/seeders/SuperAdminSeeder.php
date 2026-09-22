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
        // ═══════════════════════════════════════
        // 1) SuperAdmin — PA TENANT (platform level)
        // ═══════════════════════════════════════
        $superAdmin = User::firstOrCreate(
            ['email' => 'viona@superadmin.rezervo.com'],
            [
                'tenant_id' => null,
                'name' => 'Viona Macastena',
                'password' => Hash::make('SuperAdmin123!'),
                'phone' => null,
                'status' => 'active',
            ]
        );
        $superAdmin->syncRoles(['super_admin']);

        // ═══════════════════════════════════════
        // 2) Demo Tenant (i thatë)
        // ═══════════════════════════════════════
        $demoTenant = Tenant::firstOrCreate(
            ['slug' => 'demo'],
            [
                'name' => 'Rezervo Demo',
                'email' => 'demo@rezervo.com',
                'status' => 'active',
                'currency' => 'EUR',
                'timezone' => 'Europe/Tirane',
            ]
        );

        // Owner i Demo tenant
        $demoOwner = User::firstOrCreate(
            ['email' => 'admin@rezervo.com'],
            [
                'tenant_id' => $demoTenant->id,
                'name' => 'Admin Demo',
                'password' => Hash::make('Admin12345!'),
                'phone' => null,
                'status' => 'active',
            ]
        );
        $demoOwner->syncRoles(['owner']);

        $this->command->info('');
        $this->command->info('  ═══════════════════════════════════════');
        $this->command->info('  🔐 SUPER ADMIN (platform)');
        $this->command->info('     Email:    viona@superadmin.rezervo.com');
        $this->command->info('     Password: SuperAdmin123!');
        $this->command->info('     Role:     super_admin');
        $this->command->info('     Tenant:   — (none)');
        $this->command->info('');
        $this->command->info('  🏢 DEMO OWNER (tenant)');
        $this->command->info('     Email:    admin@rezervo.com');
        $this->command->info('     Password: Admin12345!');
        $this->command->info('     Role:     owner');
        $this->command->info('     Tenant:   demo');
        $this->command->info('  ═══════════════════════════════════════');
        $this->command->info('');
    }
}
