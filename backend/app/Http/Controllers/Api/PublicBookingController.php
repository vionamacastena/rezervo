<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Reservation;
use App\Models\Service;
use App\Models\Tenant;
use App\Models\User;
use App\Notifications\NewReservationNotification;
use App\Services\AvailabilityService;
use App\Services\ReservationCodeService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class PublicBookingController extends Controller
{
    public function show(string $slug)
    {
        $tenant = Tenant::where('slug', $slug)->where('status', 'active')->firstOrFail();

        $services = Service::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'description' => $s->description,
                'duration_minutes' => $s->duration_minutes,
                'duration_label' => self::humanDuration($s->duration_minutes),
                'price' => (float) $s->price,
                'currency' => $s->currency,
                'color' => $s->color,
                'category' => $s->category,
            ]);

        return response()->json([
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'phone' => $tenant->phone,
                'address' => $tenant->address,
                'timezone' => $tenant->timezone,
                'currency' => $tenant->currency,
            ],
            'services' => $services,
        ]);
    }

    public function availability(Request $request, string $slug)
    {
        $tenant = Tenant::where('slug', $slug)->firstOrFail();

        $data = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'service_id' => ['required', 'integer'],
        ]);

        $service = Service::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('id', $data['service_id'])
            ->where('is_active', true)
            ->firstOrFail();

        $slots = AvailabilityService::getSlots($tenant->id, $data['date'], $service);

        return response()->json([
            'date' => $data['date'],
            'service_id' => $service->id,
            'service_duration' => $service->duration_minutes,
            'slots' => $slots,
        ]);
    }

    public function book(Request $request, string $slug)
    {
        $tenant = Tenant::where('slug', $slug)->where('status', 'active')->firstOrFail();

        $data = $request->validate([
            'service_id' => ['required', 'integer'],
            'starts_at' => ['required', 'date', 'after:now'],
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'phone' => ['required', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $service = Service::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('id', $data['service_id'])
            ->where('is_active', true)
            ->firstOrFail();

        $startsAt = Carbon::parse($data['starts_at']);
        $endsAt = $startsAt->copy()->addMinutes($service->duration_minutes);

        DB::beginTransaction();
        try {
            // ═══ ATOMIC LOCK: kontrollo konflikt brenda transaction ═══
            $conflict = Reservation::withoutGlobalScopes()
                ->where('tenant_id', $tenant->id)
                ->whereIn('status', ['tentative', 'confirmed'])
                ->where('starts_at', '<', $endsAt)
                ->where('ends_at', '>', $startsAt)
                ->lockForUpdate()
                ->first();

            if ($conflict) {
                DB::rollBack();
                return response()->json([
                    'message' => 'Ky orar sapo u zu nga një klient tjetër. Zgjidhni një orar tjetër.',
                ], 409);
            }

            $client = Client::withoutGlobalScopes()->firstOrCreate(
                ['tenant_id' => $tenant->id, 'phone' => $data['phone']],
                [
                    'first_name' => $data['first_name'],
                    'last_name' => $data['last_name'],
                    'email' => $data['email'] ?? null,
                ]
            );

            $reservation = Reservation::create([
                'tenant_id' => $tenant->id,
                'client_id' => $client->id,
                'service_id' => $service->id,
                'code' => ReservationCodeService::generate($tenant->id),
                'status' => 'confirmed',
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'guests_count' => 1,
                'notes' => $data['notes'] ?? null,
                'total_price' => $service->price,
                'currency' => $service->currency,
                'confirmed_at' => now(),
            ]);

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Booking failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'message' => 'Gabim gjatë krijimit të rezervimit. Provoni përsëri.',
            ], 500);
        }

        // ═══ NJOFTIM — JASHTË transaksionit, me try-catch ═══
        try {
            $staff = User::where('tenant_id', $tenant->id)
                ->where('status', 'active')
                ->whereHas('roles', fn ($q) => $q->whereIn('name', ['owner', 'manager', 'receptionist']))
                ->get();

            if ($staff->isNotEmpty()) {
                Notification::send($staff, new NewReservationNotification($reservation));
            }
        } catch (\Throwable $e) {
            // Mos e prish booking-un nëse dështon njoftimi
            Log::warning('Notification failed', [
                'reservation_id' => $reservation->id,
                'error' => $e->getMessage(),
            ]);
        }

        return response()->json([
            'message' => 'Termini u konfirmua me sukses!',
            'reservation' => [
                'id' => $reservation->id,
                'code' => $reservation->code,
                'status' => $reservation->status,
                'starts_at' => $reservation->starts_at->toIso8601String(),
                'ends_at' => $reservation->ends_at->toIso8601String(),
                'service' => [
                    'name' => $service->name,
                    'duration_minutes' => $service->duration_minutes,
                ],
                'client' => [
                    'full_name' => $client->full_name,
                    'phone' => $client->phone,
                    'email' => $client->email,
                ],
                'total_price' => (float) $reservation->total_price,
                'currency' => $reservation->currency,
            ],
            'tenant' => [
                'name' => $tenant->name,
                'phone' => $tenant->phone,
                'address' => $tenant->address,
            ],
        ], 201);
    }

    private static function humanDuration(int $minutes): string
    {
        $h = intdiv($minutes, 60);
        $m = $minutes % 60;
        $parts = [];
        if ($h > 0) $parts[] = $h . ' orë';
        if ($m > 0) $parts[] = $m . ' min';
        return implode(' ', $parts) ?: $minutes . ' min';
    }
}
