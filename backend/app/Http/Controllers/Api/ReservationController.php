<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\StoreReservationRequest;
use App\Http\Requests\UpdateReservationRequest;
use App\Http\Resources\ReservationResource;
use App\Models\Reservation;
use App\Services\ReservationAvailabilityService;
use App\Services\ReservationCodeService;
use App\Services\ReservationStateMachine;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReservationController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Reservation::query()->with(['client', 'creator']);

        // Filtro sipas statusit
        if ($status = $request->input('status')) {
            $statuses = explode(',', $status);
            $query->whereIn('status', $statuses);
        }

        // Filtro sipas klientit
        if ($clientId = $request->input('client_id')) {
            $query->where('client_id', $clientId);
        }

        // Filtro sipas dates
        if ($from = $request->input('from')) {
            $query->where('starts_at', '>=', Carbon::parse($from));
        }
        if ($to = $request->input('to')) {
            $query->where('starts_at', '<=', Carbon::parse($to));
        }

        // Kërkim sipas code
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('resource', 'like', "%{$search}%");
            });
        }

        $query->orderBy('starts_at', 'desc');

        $perPage = min((int) $request->input('per_page', 15), 100);
        $reservations = $query->paginate($perPage);

        return $this->success(ReservationResource::collection($reservations)->response()->getData(true));
    }

    public function store(StoreReservationRequest $request): JsonResponse
    {
        $data = $request->validated();
        $tenantId = app('tenant_id');

        // Double-booking check
        if (! empty($data['resource'])) {
            $available = ReservationAvailabilityService::isAvailable(
                $tenantId,
                $data['resource'],
                Carbon::parse($data['starts_at']),
                Carbon::parse($data['ends_at'])
            );

            if (! $available) {
                return $this->error(
                    'Ka një rezervim tjetër në të njëjtin burim/kohë. Zgjidhni kohë tjetër ose burim tjetër.',
                    409
                );
            }
        }

        $reservation = Reservation::create([
            ...$data,
            'code' => ReservationCodeService::generate($tenantId),
            'created_by' => auth()->id(),
            'status' => $data['status'] ?? 'draft',
            'total_price' => $data['total_price'] ?? 0,
            'currency' => $data['currency'] ?? 'EUR',
        ]);

        $reservation->load(['client', 'creator', 'payments']);

        return $this->created(new ReservationResource($reservation), 'Rezervimi u krijua me sukses.');
    }

    public function show(Reservation $reservation): JsonResponse
    {
        $reservation->load(['client', 'creator', 'payments']);
        return $this->success(new ReservationResource($reservation));
    }

    public function update(UpdateReservationRequest $request, Reservation $reservation): JsonResponse
    {
        if (in_array($reservation->status, ['completed', 'cancelled'])) {
            return $this->error('Rezervimet e përfunduara ose të anuluara nuk mund të ndryshohen.', 409);
        }

        $reservation->update($request->validated());
        $reservation->load(['client', 'creator']);

        return $this->success(new ReservationResource($reservation), 'Rezervimi u përditësua me sukses.');
    }

    public function destroy(Reservation $reservation): JsonResponse
    {
        if (in_array($reservation->status, ['confirmed', 'completed'])) {
            return $this->error('Rezervimet e konfirmuara ose të përfunduara nuk mund të fshihen. Anuloni ato.', 409);
        }

        $reservation->delete();
        return $this->noContent('Rezervimi u fshi me sukses.');
    }

    // ─── Custom actions (State Machine) ───

    public function confirm(Reservation $reservation): JsonResponse
    {
        return $this->transition($reservation, 'confirmed');
    }

    public function complete(Reservation $reservation): JsonResponse
    {
        return $this->transition($reservation, 'completed');
    }

    public function cancel(Request $request, Reservation $reservation): JsonResponse
    {
        $request->validate([
            'reason' => ['required', 'string', 'min:3', 'max:500'],
        ]);

        return $this->transition($reservation, 'cancelled', $request->input('reason'));
    }

    public function tentative(Reservation $reservation): JsonResponse
    {
        return $this->transition($reservation, 'tentative');
    }

    private function transition(Reservation $reservation, string $to, ?string $reason = null): JsonResponse
    {
        try {
            ReservationStateMachine::transition($reservation, $to, $reason);
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), 422);
        }

        $reservation->load(['client', 'creator']);

        return $this->success(
            new ReservationResource($reservation->fresh()),
            "Statusi u ndryshua në: {$to}"
        );
    }

    // ─── Duplicate ───

    public function duplicate(Reservation $reservation): JsonResponse
    {
        $tenantId = app('tenant_id');

        $newReservation = $reservation->replicate();
        $newReservation->code = ReservationCodeService::generate($tenantId);
        $newReservation->status = 'draft';
        $newReservation->confirmed_at = null;
        $newReservation->completed_at = null;
        $newReservation->cancelled_at = null;
        $newReservation->cancellation_reason = null;
        $newReservation->created_by = auth()->id();
        $newReservation->save();

        $newReservation->load(['client', 'creator']);

        return $this->created(new ReservationResource($newReservation), 'Rezervimi u duplikua me sukses.');
    }
}
