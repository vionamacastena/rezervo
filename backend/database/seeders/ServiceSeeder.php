<?php

namespace Database\Seeders;

use App\Models\Service;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::where('slug', 'demo')->first();
        if (! $tenant) return;

        $services = [
            [
                'name' => 'Konsultë e përgjithshme',
                'description' => 'Takim i shkurtër për konsultë',
                'duration_minutes' => 30,
                'price' => 0,
                'color' => '#3B82F6',
                'category' => 'Konsulta',
                'sort_order' => 1,
            ],
            [
                'name' => 'Vizitë standarde',
                'description' => 'Vizitë e plotë',
                'duration_minutes' => 60,
                'price' => 50,
                'color' => '#10B981',
                'category' => 'Vizita',
                'sort_order' => 2,
            ],
            [
                'name' => 'Trajtim i avancuar',
                'description' => 'Trajtim i specializuar',
                'duration_minutes' => 90,
                'price' => 120,
                'color' => '#8B5CF6',
                'category' => 'Trajtime',
                'sort_order' => 3,
            ],
            [
                'name' => 'Kontroll periodik',
                'description' => 'Kontroll rutinë',
                'duration_minutes' => 45,
                'price' => 30,
                'color' => '#F59E0B',
                'category' => 'Kontroll',
                'sort_order' => 4,
            ],
        ];

        foreach ($services as $s) {
            Service::updateOrCreate(
                ['tenant_id' => $tenant->id, 'name' => $s['name']],
                array_merge($s, ['tenant_id' => $tenant->id, 'is_active' => true])
            );
        }

        $this->command->info('Services created: ' . count($services));
    }
}
