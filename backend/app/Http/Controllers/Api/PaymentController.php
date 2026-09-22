<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\StorePaymentRequest;
use App\Http\Requests\UpdatePaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Models\Reservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Payment::query()->with(['creator', 'reservation']);

        if ($reservationId = $request->input('reservation_id')) {
            $query->where('reservation_id', $reservationId);
        }

        if ($method = $request->input('method')) {
            $query->where('method', $method);
        }

        if ($from = $request->input('from')) {
            $query->where('payment_date', '>=', $from);
        }
        if ($to = $request->input('to')) {
            $query->where('payment_date', '<=', $to);
        }

        $query->orderBy('payment_date', 'desc')->orderBy('id', 'desc');

        $perPage = min((int) $request->input('per_page', 15), 100);

        return $this->success(
            PaymentResource::collection($query->paginate($perPage))->response()->getData(true)
        );
    }

    public function store(StorePaymentRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Kontrollo rezervimin
        $reservation = Reservation::findOrFail($data['reservation_id']);

        if (in_array($reservation->status, ['cancelled'])) {
            return $this->error('Nuk mund të shtohen pagesa për rezervime të anuluara.', 422);
        }

        // Kontrollo nëse pagesa e kalon totalin
        $totalPaid = $reservation->payments()->sum('amount');
        $newTotal = $totalPaid + $data['amount'];
        $totalPrice = (float) $reservation->total_price;

        if ($newTotal > $totalPrice + 0.01) {
            return $this->error(
                sprintf(
                    'Pagesa e kalon totalin. Total: %.2f, Paguar: %.2f, Mbetur: %.2f',
                    $totalPrice,
                    $totalPaid,
                    $totalPrice - $totalPaid
                ),
                422
            );
        }

        $payment = Payment::create([
            ...$data,
            'created_by' => auth()->id(),
            'currency' => $reservation->currency,
        ]);

        $payment->load(['creator', 'reservation']);

        return $this->created(new PaymentResource($payment), 'Pagesa u regjistrua me sukses.');
    }

    public function show(Payment $payment): JsonResponse
    {
        $payment->load(['creator', 'reservation']);
        return $this->success(new PaymentResource($payment));
    }

    public function update(UpdatePaymentRequest $request, Payment $payment): JsonResponse
    {
        // Nuk lejohet edit pas 24 orësh
        if ($payment->created_at->diffInHours(now()) >= 24) {
            return $this->error('Pagesa nuk mund të ndryshohet pas 24 orësh.', 409);
        }

        $payment->update($request->validated());
        $payment->load(['creator', 'reservation']);

        return $this->success(new PaymentResource($payment->fresh()), 'Pagesa u përditësua.');
    }

    public function destroy(Payment $payment): JsonResponse
    {
        // Logjika 24h
        if ($payment->created_at->diffInHours(now()) >= 24) {
            return $this->error('Pagesa nuk mund të fshihet pas 24 orësh (immutable).', 409);
        }

        $payment->delete();

        return $this->noContent('Pagesa u fshi me sukses.');
    }
}
