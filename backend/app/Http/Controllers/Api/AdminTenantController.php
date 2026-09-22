<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\Service;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminTenantController extends Controller
{
    /**
     * Listo të gjitha bizneset me statistika.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Tenant::query()
            ->withCount([
                'users',
                'services',
                'reservations',
                'clients',
            ]);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $query->orderBy('created_at', 'desc');

        $tenants = $query->paginate(20);

        // Shto revenue për secilin
        $tenants->getCollection()->transform(function ($tenant) {
            $tenant->revenue_total = (float) Payment::withoutGlobalScopes()
                ->where('tenant_id', $tenant->id)
                ->sum('amount');

            $tenant->revenue_month = (float) Payment::withoutGlobalScopes()
                ->where('tenant_id', $tenant->id)
                ->where('payment_date', '>=', now()->startOfMonth())
                ->sum('amount');

            return $tenant;
        });

        return response()->json($tenants);
    }

    /**
     * Detajet e plotë të një biznesi.
     */
    public function show(Tenant $tenant): JsonResponse
    {
        $tenant->loadCount(['users', 'services', 'reservations', 'clients', 'staffMembers', 'inventoryItems']);

        $stats = [
            'revenue_total' => (float) Payment::withoutGlobalScopes()
                ->where('tenant_id', $tenant->id)->sum('amount'),
            'revenue_month' => (float) Payment::withoutGlobalScopes()
                ->where('tenant_id', $tenant->id)
                ->where('payment_date', '>=', now()->startOfMonth())->sum('amount'),
            'reservations_confirmed' => Reservation::withoutGlobalScopes()
                ->where('tenant_id', $tenant->id)->where('status', 'confirmed')->count(),
            'reservations_completed' => Reservation::withoutGlobalScopes()
                ->where('tenant_id', $tenant->id)->where('status', 'completed')->count(),
            'reservations_cancelled' => Reservation::withoutGlobalScopes()
                ->where('tenant_id', $tenant->id)->where('status', 'cancelled')->count(),
        ];

        $recentReservations = Reservation::withoutGlobalScopes()
            ->with('client:id,first_name,last_name,phone')
            ->where('tenant_id', $tenant->id)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        $services = Service::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->get();

        $users = User::where('tenant_id', $tenant->id)
            ->with('roles:id,name')
            ->get(['id', 'name', 'email', 'phone', 'status', 'last_login_at']);

        return response()->json([
            'tenant' => $tenant,
            'stats' => $stats,
            'recent_reservations' => $recentReservations,
            'services' => $services,
            'users' => $users,
        ]);
    }

    /**
     * Statistika globale të platformës.
     */
    public function platformStats(): JsonResponse
    {
        $totalTenants = Tenant::count();
        $activeTenants = Tenant::where('status', 'active')->count();
        $totalUsers = User::count();
        $totalReservations = Reservation::withoutGlobalScopes()->count();
        $totalRevenue = (float) Payment::withoutGlobalScopes()->sum('amount');
        $revenueMonth = (float) Payment::withoutGlobalScopes()
            ->where('payment_date', '>=', now()->startOfMonth())
            ->sum('amount');

        // Top 5 bizneset sipas revenue
        $topTenants = Tenant::withCount('reservations')
            ->get()
            ->map(function ($t) {
                $t->revenue = (float) Payment::withoutGlobalScopes()
                    ->where('tenant_id', $t->id)->sum('amount');
                return $t;
            })
            ->sortByDesc('revenue')
            ->take(5)
            ->values();

        // Rezervime sipas statusit
        $byStatus = Reservation::withoutGlobalScopes()
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        return response()->json([
            'total_tenants' => $totalTenants,
            'active_tenants' => $activeTenants,
            'total_users' => $totalUsers,
            'total_reservations' => $totalReservations,
            'total_revenue' => $totalRevenue,
            'revenue_month' => $revenueMonth,
            'top_tenants' => $topTenants,
            'reservations_by_status' => $byStatus,
        ]);
    }

    /**
     * Ndrysho statusin e një biznesi.
     */
    public function updateStatus(Request $request, Tenant $tenant): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:active,suspended,trial'],
        ]);

        $tenant->update(['status' => $data['status']]);

        return response()->json([
            'message' => 'Statusi u përditësua.',
            'tenant' => $tenant->fresh(),
        ]);
    }
}
