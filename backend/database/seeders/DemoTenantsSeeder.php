<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\Service;
use App\Models\StaffMember;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoTenantsSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedBarberShop();
        $this->seedNailsSalon();
        $this->command->info('✅ 2 demo bizneset u krijuan.');
    }

    private function seedBarberShop(): void
    {
        $tenant = Tenant::firstOrCreate(
            ['slug' => 'barber-king'],
            [
                'name' => 'Barber King',
                'email' => 'info@barberking.com',
                'phone' => '+383 44 111 222',
                'address' => 'Rr. Nëna Terezë 45, Prishtinë',
                'timezone' => 'Europe/Tirane',
                'currency' => 'EUR',
                'status' => 'active',
            ]
        );

        $owner = User::firstOrCreate(
            ['email' => 'owner@barberking.com'],
            [
                'tenant_id' => $tenant->id,
                'name' => 'Endrit Berisha',
                'password' => Hash::make('Barber123!'),
                'phone' => '+383 44 111 222',
                'status' => 'active',
            ]
        );
        $owner->assignRole('owner');

        $recep = User::firstOrCreate(
            ['email' => 'recep@barberking.com'],
            [
                'tenant_id' => $tenant->id,
                'name' => 'Filan Fisteku',
                'password' => Hash::make('Barber123!'),
                'phone' => '+383 44 333 444',
                'status' => 'active',
            ]
        );
        $recep->assignRole('receptionist');

        $services = [
            ['name' => 'Prerje flokësh klasike', 'duration_minutes' => 30, 'price' => 10, 'color' => '#3B82F6', 'category' => 'Prerje', 'sort_order' => 1],
            ['name' => 'Prerje + Rruajtje', 'duration_minutes' => 45, 'price' => 15, 'color' => '#10B981', 'category' => 'Prerje', 'sort_order' => 2],
            ['name' => 'Rruajtje me brisk', 'duration_minutes' => 30, 'price' => 8, 'color' => '#F59E0B', 'category' => 'Rruajtje', 'sort_order' => 3],
            ['name' => 'Prerje + Mjekër', 'duration_minutes' => 60, 'price' => 20, 'color' => '#8B5CF6', 'category' => 'Paketë', 'sort_order' => 4],
            ['name' => 'Trajtim fëmijësh', 'duration_minutes' => 20, 'price' => 7, 'color' => '#EC4899', 'category' => 'Special', 'sort_order' => 5],
        ];
        foreach ($services as $s) {
            Service::updateOrCreate(
                ['tenant_id' => $tenant->id, 'name' => $s['name']],
                array_merge($s, ['tenant_id' => $tenant->id, 'is_active' => true])
            );
        }

        $staffData = [
            ['first_name' => 'Besi', 'last_name' => 'Krasniqi', 'phone' => '+383 44 555 111', 'position' => 'Berber Senior', 'hourly_rate' => 12],
            ['first_name' => 'Genti', 'last_name' => 'Hoxha', 'phone' => '+383 44 555 222', 'position' => 'Berber', 'hourly_rate' => 10],
            ['first_name' => 'Ardit', 'last_name' => 'Rama', 'phone' => '+383 44 555 333', 'position' => 'Junior', 'hourly_rate' => 8],
        ];
        foreach ($staffData as $s) {
            StaffMember::updateOrCreate(
                ['tenant_id' => $tenant->id, 'phone' => $s['phone']],
                array_merge($s, ['tenant_id' => $tenant->id, 'is_active' => true, 'working_hours' => ['mon-fri' => '09:00-20:00', 'sat' => '09:00-17:00']])
            );
        }

        $clientNames = [
            ['Arben', 'Gashi', '+383 44 100 001'],
            ['Blerim', 'Krasniqi', '+383 44 100 002'],
            ['Driton', 'Hoxha', '+383 44 100 003'],
            ['Erion', 'Berisha', '+383 44 100 004'],
            ['Fatmir', 'Rama', '+383 44 100 005'],
            ['Gentian', 'Zeka', '+383 44 100 006'],
            ['Hekuran', 'Kelmendi', '+383 44 100 007'],
            ['Ilir', 'Shala', '+383 44 100 008'],
            ['Jetmir', 'Leka', '+383 44 100 009'],
            ['Kreshnik', 'Musa', '+383 44 100 010'],
        ];
        $clients = [];
        foreach ($clientNames as [$fn, $ln, $ph]) {
            $clients[] = Client::updateOrCreate(
                ['tenant_id' => $tenant->id, 'phone' => $ph],
                ['first_name' => $fn, 'last_name' => $ln, 'email' => strtolower($fn) . '.' . strtolower($ln) . '@example.com', 'tenant_id' => $tenant->id]
            );
        }

        $serviceIds = Service::withoutGlobalScopes()->where('tenant_id', $tenant->id)->pluck('id')->toArray();
        $statuses = ['completed', 'completed', 'completed', 'confirmed', 'confirmed', 'cancelled'];
        for ($i = 0; $i < 25; $i++) {
            $client = $clients[array_rand($clients)];
            $serviceId = $serviceIds[array_rand($serviceIds)];
            $service = Service::withoutGlobalScopes()->find($serviceId);
            $daysAgo = rand(0, 60);
            $startsAt = Carbon::now()->subDays($daysAgo)->setTime(rand(9, 18), rand(0, 1) * 30);
            $endsAt = $startsAt->copy()->addMinutes($service->duration_minutes);
            $status = $statuses[array_rand($statuses)];
            if ($daysAgo === 0 && $startsAt->isPast()) $status = 'completed';

            Reservation::create([
                'tenant_id' => $tenant->id,
                'client_id' => $client->id,
                'service_id' => $serviceId,
                'created_by' => $owner->id,
                'code' => 'BK-' . Carbon::now()->format('Y') . '-' . str_pad($i + 1, 4, '0', STR_PAD_LEFT),
                'status' => $status,
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'guests_count' => 1,
                'total_price' => $service->price,
                'currency' => 'EUR',
                'confirmed_at' => $status !== 'draft' ? $startsAt->copy()->subHours(2) : null,
                'completed_at' => $status === 'completed' ? $endsAt : null,
                'cancelled_at' => $status === 'cancelled' ? $startsAt->copy()->subHours(4) : null,
                'cancellation_reason' => $status === 'cancelled' ? 'Klienti anuloi' : null,
            ]);
        }

        $completedReservations = Reservation::withoutGlobalScopes()->where('tenant_id', $tenant->id)->where('status', 'completed')->get();
        foreach ($completedReservations as $r) {
            $methods = ['cash', 'cash', 'card', 'card', 'bank_transfer'];
            Payment::create([
                'tenant_id' => $tenant->id,
                'reservation_id' => $r->id,
                'created_by' => $recep->id,
                'payment_id' => 'PAY-' . strtoupper(Str::random(12)),
                'amount' => $r->total_price,
                'currency' => 'EUR',
                'method' => $methods[array_rand($methods)],
                'payment_date' => $r->starts_at->toDateString(),
                'is_deletable' => false,
            ]);
        }
        $this->command->info('  ✅ Barber King — 5 services, 3 staff, 10 clients, 25 rezervime');
    }

    private function seedNailsSalon(): void
    {
        $tenant = Tenant::firstOrCreate(
            ['slug' => 'blooming-nails'],
            [
                'name' => 'Blooming Nails',
                'email' => 'hello@bloomingnails.com',
                'phone' => '+383 44 999 888',
                'address' => 'Rr. Agim Ramadani 12, Prishtinë',
                'timezone' => 'Europe/Tirane',
                'currency' => 'EUR',
                'status' => 'active',
            ]
        );

        $owner = User::firstOrCreate(
            ['email' => 'owner@bloomingnails.com'],
            ['tenant_id' => $tenant->id, 'name' => 'Elira Dema', 'password' => Hash::make('Nails123!'), 'phone' => '+383 44 999 888', 'status' => 'active']
        );
        $owner->assignRole('owner');

        $recep = User::firstOrCreate(
            ['email' => 'recep@bloomingnails.com'],
            ['tenant_id' => $tenant->id, 'name' => 'Arta Bytyqi', 'password' => Hash::make('Nails123!'), 'phone' => '+383 44 777 666', 'status' => 'active']
        );
        $recep->assignRole('receptionist');

        $services = [
            ['name' => 'Manikyr klasik', 'duration_minutes' => 45, 'price' => 15, 'color' => '#EC4899', 'category' => 'Manikyr', 'sort_order' => 1],
            ['name' => 'Manikyr gel', 'duration_minutes' => 60, 'price' => 25, 'color' => '#8B5CF6', 'category' => 'Manikyr', 'sort_order' => 2],
            ['name' => 'Pedikyr klasik', 'duration_minutes' => 60, 'price' => 20, 'color' => '#3B82F6', 'category' => 'Pedikyr', 'sort_order' => 3],
            ['name' => 'Pedikyr spa', 'duration_minutes' => 90, 'price' => 35, 'color' => '#10B981', 'category' => 'Pedikyr', 'sort_order' => 4],
            ['name' => 'Nail Art (dekorim)', 'duration_minutes' => 30, 'price' => 10, 'color' => '#F59E0B', 'category' => 'Dekorim', 'sort_order' => 5],
            ['name' => 'Paketë dasmash', 'duration_minutes' => 120, 'price' => 60, 'color' => '#EF4444', 'category' => 'Special', 'sort_order' => 6],
        ];
        foreach ($services as $s) {
            Service::updateOrCreate(
                ['tenant_id' => $tenant->id, 'name' => $s['name']],
                array_merge($s, ['tenant_id' => $tenant->id, 'is_active' => true])
            );
        }

        $staffData = [
            ['first_name' => 'Elira', 'last_name' => 'Dema', 'phone' => '+383 44 999 111', 'position' => 'Master Nail Artist', 'hourly_rate' => 20],
            ['first_name' => 'Sara', 'last_name' => 'Krasniqi', 'phone' => '+383 44 999 222', 'position' => 'Nail Technician', 'hourly_rate' => 15],
            ['first_name' => 'Mira', 'last_name' => 'Hoxha', 'phone' => '+383 44 999 333', 'position' => 'Junior Artist', 'hourly_rate' => 10],
        ];
        foreach ($staffData as $s) {
            StaffMember::updateOrCreate(
                ['tenant_id' => $tenant->id, 'phone' => $s['phone']],
                array_merge($s, ['tenant_id' => $tenant->id, 'is_active' => true, 'working_hours' => ['mon-fri' => '10:00-19:00', 'sat' => '10:00-16:00']])
            );
        }

        $clientNames = [
            ['Ana', 'Berisha', '+383 44 200 001'],
            ['Arta', 'Krasniqi', '+383 44 200 002'],
            ['Elira', 'Hoxha', '+383 44 200 003'],
            ['Fjolla', 'Gashi', '+383 44 200 004'],
            ['Gentiana', 'Rama', '+383 44 200 005'],
            ['Hana', 'Zeka', '+383 44 200 006'],
            ['Ilire', 'Kelmendi', '+383 44 200 007'],
            ['Jeta', 'Shala', '+383 44 200 008'],
            ['Kaltrina', 'Musa', '+383 44 200 009'],
            ['Lira', 'Leka', '+383 44 200 010'],
            ['Mira', 'Dema', '+383 44 200 011'],
            ['Nora', 'Begu', '+383 44 200 012'],
        ];
        $clients = [];
        foreach ($clientNames as [$fn, $ln, $ph]) {
            $clients[] = Client::updateOrCreate(
                ['tenant_id' => $tenant->id, 'phone' => $ph],
                ['first_name' => $fn, 'last_name' => $ln, 'email' => strtolower($fn) . '.' . strtolower($ln) . '@example.com', 'tenant_id' => $tenant->id]
            );
        }

        $serviceIds = Service::withoutGlobalScopes()->where('tenant_id', $tenant->id)->pluck('id')->toArray();
        $statuses = ['completed', 'completed', 'completed', 'confirmed', 'confirmed', 'cancelled'];
        for ($i = 0; $i < 30; $i++) {
            $client = $clients[array_rand($clients)];
            $serviceId = $serviceIds[array_rand($serviceIds)];
            $service = Service::withoutGlobalScopes()->find($serviceId);
            $daysAgo = rand(0, 60);
            $startsAt = Carbon::now()->subDays($daysAgo)->setTime(rand(10, 18), rand(0, 1) * 30);
            $endsAt = $startsAt->copy()->addMinutes($service->duration_minutes);
            $status = $statuses[array_rand($statuses)];
            if ($daysAgo === 0 && $startsAt->isPast()) $status = 'completed';

            Reservation::create([
                'tenant_id' => $tenant->id,
                'client_id' => $client->id,
                'service_id' => $serviceId,
                'created_by' => $owner->id,
                'code' => 'BN-' . Carbon::now()->format('Y') . '-' . str_pad($i + 1, 4, '0', STR_PAD_LEFT),
                'status' => $status,
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'guests_count' => 1,
                'total_price' => $service->price,
                'currency' => 'EUR',
                'confirmed_at' => $status !== 'draft' ? $startsAt->copy()->subHours(2) : null,
                'completed_at' => $status === 'completed' ? $endsAt : null,
                'cancelled_at' => $status === 'cancelled' ? $startsAt->copy()->subHours(4) : null,
                'cancellation_reason' => $status === 'cancelled' ? 'Klientja nuk mundi' : null,
            ]);
        }

        $completedReservations = Reservation::withoutGlobalScopes()->where('tenant_id', $tenant->id)->where('status', 'completed')->get();
        foreach ($completedReservations as $r) {
            $methods = ['cash', 'card', 'card', 'card', 'bank_transfer'];
            Payment::create([
                'tenant_id' => $tenant->id,
                'reservation_id' => $r->id,
                'created_by' => $recep->id,
                'payment_id' => 'PAY-' . strtoupper(Str::random(12)),
                'amount' => $r->total_price,
                'currency' => 'EUR',
                'method' => $methods[array_rand($methods)],
                'payment_date' => $r->starts_at->toDateString(),
                'is_deletable' => false,
            ]);
        }
        $this->command->info('  ✅ Blooming Nails — 6 services, 3 staff, 12 clients, 30 rezervime');
    }
}
