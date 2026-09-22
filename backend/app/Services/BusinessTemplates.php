<?php

namespace App\Services;

use App\Models\Service;
use App\Models\Tenant;

class BusinessTemplates
{
    public const TEMPLATES = [
        'barber' => [
            'label' => 'Barber Shop',
            'services' => [
                ['name' => 'Prerje flokësh', 'duration_minutes' => 30, 'price' => 10, 'color' => '#3B82F6', 'category' => 'Prerje'],
                ['name' => 'Prerje + Rruajtje', 'duration_minutes' => 45, 'price' => 15, 'color' => '#10B981', 'category' => 'Prerje'],
                ['name' => 'Rruajtje me brisk', 'duration_minutes' => 30, 'price' => 8, 'color' => '#F59E0B', 'category' => 'Rruajtje'],
                ['name' => 'Prerje + Mjekër', 'duration_minutes' => 60, 'price' => 20, 'color' => '#8B5CF6', 'category' => 'Paketë'],
            ],
        ],
        'nails' => [
            'label' => 'Nails Salon',
            'services' => [
                ['name' => 'Manikyr klasik', 'duration_minutes' => 45, 'price' => 15, 'color' => '#EC4899', 'category' => 'Manikyr'],
                ['name' => 'Manikyr gel', 'duration_minutes' => 60, 'price' => 25, 'color' => '#8B5CF6', 'category' => 'Manikyr'],
                ['name' => 'Pedikyr klasik', 'duration_minutes' => 60, 'price' => 20, 'color' => '#3B82F6', 'category' => 'Pedikyr'],
                ['name' => 'Nail Art', 'duration_minutes' => 30, 'price' => 10, 'color' => '#F59E0B', 'category' => 'Dekorim'],
            ],
        ],
        'beauty' => [
            'label' => 'Beauty Salon',
            'services' => [
                ['name' => 'Depilim', 'duration_minutes' => 30, 'price' => 15, 'color' => '#EC4899', 'category' => 'Depilim'],
                ['name' => 'Pastrim fytyre', 'duration_minutes' => 60, 'price' => 30, 'color' => '#8B5CF6', 'category' => 'Fytyrë'],
                ['name' => 'Masazh', 'duration_minutes' => 60, 'price' => 35, 'color' => '#10B981', 'category' => 'Masazh'],
            ],
        ],
        'medical' => [
            'label' => 'Klinikë / Zyrë Mjekësore',
            'services' => [
                ['name' => 'Konsultë e përgjithshme', 'duration_minutes' => 30, 'price' => 30, 'color' => '#3B82F6', 'category' => 'Konsulta'],
                ['name' => 'Vizitë specialistike', 'duration_minutes' => 45, 'price' => 50, 'color' => '#10B981', 'category' => 'Vizita'],
                ['name' => 'Kontroll periodik', 'duration_minutes' => 30, 'price' => 25, 'color' => '#F59E0B', 'category' => 'Kontroll'],
            ],
        ],
        'restaurant' => [
            'label' => 'Restorant',
            'services' => [
                ['name' => 'Drekë / Darkë', 'duration_minutes' => 90, 'price' => 0, 'color' => '#3B82F6', 'category' => 'Vakte'],
                ['name' => 'Rezervim tavoline VIP', 'duration_minutes' => 120, 'price' => 0, 'color' => '#F59E0B', 'category' => 'Special'],
            ],
        ],
        'fitness' => [
            'label' => 'Fitnes / Palestër',
            'services' => [
                ['name' => 'Seancë personale', 'duration_minutes' => 60, 'price' => 30, 'color' => '#3B82F6', 'category' => 'Personal'],
                ['name' => 'Konsultë ushqimi', 'duration_minutes' => 45, 'price' => 40, 'color' => '#10B981', 'category' => 'Konsulta'],
            ],
        ],
        'generic' => [
            'label' => 'Tjetër / Generik',
            'services' => [
                ['name' => 'Konsultë', 'duration_minutes' => 30, 'price' => 0, 'color' => '#3B82F6', 'category' => 'Konsulta'],
                ['name' => 'Shërbim standard', 'duration_minutes' => 60, 'price' => 20, 'color' => '#10B981', 'category' => 'Shërbime'],
            ],
        ],
    ];

    public static function seedForTenant(Tenant $tenant, string $type): int
    {
        $template = self::TEMPLATES[$type] ?? self::TEMPLATES['generic'];
        $count = 0;

        foreach ($template['services'] as $i => $s) {
            Service::updateOrCreate(
                ['tenant_id' => $tenant->id, 'name' => $s['name']],
                array_merge($s, [
                    'tenant_id' => $tenant->id,
                    'currency' => $tenant->currency ?? 'EUR',
                    'is_active' => true,
                    'sort_order' => $i + 1,
                ])
            );
            $count++;
        }

        return $count;
    }

    public static function list(): array
    {
        return collect(self::TEMPLATES)->map(fn ($t, $key) => [
            'key' => $key,
            'label' => $t['label'],
            'services_count' => count($t['services']),
        ])->values()->toArray();
    }
}
