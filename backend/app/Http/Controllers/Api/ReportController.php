<?php

namespace App\Http\Controllers\Api;

use App\Models\Client;
use App\Models\InventoryItem;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\StaffMember;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends BaseApiController
{
    /**
     * Revenue Summary: të ardhurat sipas periudhës
     */
    public function revenue(Request $request): JsonResponse
    {
        $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        $from = $request->input('from')
            ? Carbon::parse($request->input('from'))
            : now()->startOfMonth();
        $to = $request->input('to')
            ? Carbon::parse($request->input('to'))
            : now()->endOfMonth();

        $total = Payment::whereBetween('payment_date', [$from, $to])->sum('amount');

        $byMethod = Payment::whereBetween('payment_date', [$from, $to])
            ->select('method', DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('method')
            ->get()
            ->map(fn($row) => [
                'method' => $row->method,
                'total' => (float) $row->total,
                'count' => (int) $row->count,
            ]);

        $daily = Payment::whereBetween('payment_date', [$from, $to])
            ->select(
                DB::raw('DATE(payment_date) as date'),
                DB::raw('SUM(amount) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn($row) => [
                'date' => $row->date,
                'total' => (float) $row->total,
                'count' => (int) $row->count,
            ]);

        return $this->success([
            'period' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
            ],
            'total' => (float) $total,
            'by_method' => $byMethod,
            'daily' => $daily,
        ]);
    }

    /**
     * Outstanding Balances: saldot e pambyllura
     */
    public function outstanding(Request $request): JsonResponse
    {
        $reservations = Reservation::with(['client', 'payments'])
            ->whereIn('status', ['confirmed', 'completed'])
            ->get()
            ->map(function ($r) {
                $paid = (float) $r->payments->sum('amount');
                $total = (float) $r->total_price;

                return [
                    'id' => $r->id,
                    'code' => $r->code,
                    'status' => $r->status,
                    'client' => $r->client->full_name,
                    'client_id' => $r->client_id,
                    'starts_at' => $r->starts_at->toIso8601String(),
                    'total_price' => $total,
                    'paid' => $paid,
                    'balance' => $total - $paid,
                ];
            })
            ->filter(fn($r) => $r['balance'] > 0.01)
            ->sortByDesc('balance')
            ->values();

        $totalOutstanding = $reservations->sum('balance');

        return $this->success([
            'total_outstanding' => (float) $totalOutstanding,
            'count' => $reservations->count(),
            'reservations' => $reservations,
        ]);
    }

    /**
     * Hall Occupancy: ditë të zëna vs të lira
     */
    public function occupancy(Request $request): JsonResponse
    {
        $request->validate([
            'from' => ['required', 'date'],
            'to' => ['required', 'date', 'after:from'],
        ]);

        $from = Carbon::parse($request->input('from'));
        $to = Carbon::parse($request->input('to'));

        $resources = Reservation::whereIn('status', ['confirmed', 'completed'])
            ->whereBetween('starts_at', [$from, $to])
            ->distinct()
            ->pluck('resource')
            ->filter();

        $totalDays = $from->diffInDays($to) + 1;
        $report = [];

        foreach ($resources as $resource) {
            $reservations = Reservation::where('resource', $resource)
                ->whereIn('status', ['confirmed', 'completed'])
                ->whereBetween('starts_at', [$from, $to])
                ->get();

            $occupiedDays = $reservations->sum(function ($r) {
                return $r->starts_at->diffInDays($r->ends_at) + 1;
            });

            $report[] = [
                'resource' => $resource,
                'total_days' => $totalDays,
                'occupied_days' => $occupiedDays,
                'free_days' => max(0, $totalDays - $occupiedDays),
                'occupancy_rate' => $totalDays > 0
                    ? round(($occupiedDays / $totalDays) * 100, 2)
                    : 0,
                'reservations_count' => $reservations->count(),
            ];
        }

        return $this->success([
            'period' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'resources' => $report,
        ]);
    }

    /**
     * Staff Utilization
     */
    public function staffUtilization(Request $request): JsonResponse
    {
        $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $from = $request->input('from') ? Carbon::parse($request->input('from')) : now()->startOfMonth();
        $to = $request->input('to') ? Carbon::parse($request->input('to')) : now()->endOfMonth();

        // Për thjeshtësi — në të ardhmen kur lidhim staf → rezervim
        $staff = StaffMember::where('is_active', true)->get()->map(function ($s) {
            return [
                'id' => $s->id,
                'name' => $s->full_name,
                'position' => $s->position,
                'reservations_count' => 0,   // placeholder
                'hours_worked' => 0,          // placeholder
            ];
        });

        return $this->success([
            'period' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'staff' => $staff,
        ]);
    }

    /**
     * Inventory Status: stoku vs pragu
     */
    public function inventoryStatus(): JsonResponse
    {
        $items = InventoryItem::all();

        $lowStock = $items->filter(fn($i) => $i->is_low_stock)->values();
        $totalValue = $items->sum(fn($i) => ($i->unit_price ?? 0) * $i->quantity);

        return $this->success([
            'summary' => [
                'total_items' => $items->count(),
                'low_stock_count' => $lowStock->count(),
                'total_value' => round($totalValue, 2),
            ],
            'low_stock_items' => $lowStock->map(fn($i) => [
                'id' => $i->id,
                'name' => $i->name,
                'quantity' => $i->quantity,
                'min_threshold' => $i->min_threshold,
                'unit' => $i->unit,
            ]),
        ]);
    }

    /**
     * Dashboard KPIs
     */
    public function dashboard(): JsonResponse
    {
        $today = now()->startOfDay();
        $monthStart = now()->startOfMonth();

        return $this->success([
            'reservations' => [
                'total' => Reservation::count(),
                'confirmed' => Reservation::where('status', 'confirmed')->count(),
                'today' => Reservation::whereDate('starts_at', $today)->count(),
                'this_month' => Reservation::where('starts_at', '>=', $monthStart)->count(),
            ],
            'clients' => [
                'total' => Client::count(),
                'this_month' => Client::where('created_at', '>=', $monthStart)->count(),
            ],
            'revenue' => [
                'this_month' => (float) Payment::where('payment_date', '>=', $monthStart)->sum('amount'),
                'today' => (float) Payment::whereDate('payment_date', $today)->sum('amount'),
            ],
            'inventory' => [
                'low_stock' => InventoryItem::whereColumn('quantity', '<=', 'min_threshold')->count(),
            ],
        ]);
    }
}
