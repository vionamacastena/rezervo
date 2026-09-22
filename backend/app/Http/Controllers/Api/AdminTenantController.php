<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreTenantRequest;
use App\Http\Requests\Admin\UpdateTenantRequest;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\Service;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AdminTenantController extends Controller
{
    /**
     * Listo të gjitha bizneset me statistika.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Tenant::query()->withCount([
            'users', 'services', 'reservations', 'clients',
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

        $tenants->getCollection()->transform(function ($tenant) {
            $tenant->revenue_total = (float) Payment::withoutGlobalScopes()
                ->where('tenant_id', $tenant->id)->sum('amount');
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
            ->limit(10)->get();

        $services = Service::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)->get();

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
     * Krijo biznes të ri + Owner automatik.
     */
    public function store(StoreTenantRequest $request): JsonResponse
    {
        $data = $request->validated();

        DB::beginTransaction();
        try {
            // 1) Krijo tenant
            $tenant = Tenant::create([
                'name' => $data['name'],
                'slug' => $data['slug'],
                'email' => $data['email'] ?? null,
                'phone' => $data['phone'] ?? null,
                'address' => $data['address'] ?? null,
                'timezone' => $data['timezone'] ?? 'Europe/Tirane',
                'currency' => $data['currency'] ?? 'EUR',
                'status' => $data['status'] ?? 'active',
            ]);

            // 2) Krijo Owner
            $owner = User::create([
                'tenant_id' => $tenant->id,
                'name' => $data['owner_name'],
                'email' => $data['owner_email'],
                'password' => Hash::make($data['owner_password']),
                'phone' => $data['owner_phone'] ?? null,
                'status' => 'active',
            ]);
            $owner->assignRole('owner');

            DB::commit();

            Log::info('Tenant created by SuperAdmin', [
                'tenant_id' => $tenant->id,
                'owner_id' => $owner->id,
                'created_by' => auth()->id(),
            ]);

            return response()->json([
                'message' => 'Biznesi u krijua me sukses.',
                'tenant' => $tenant->fresh()->loadCount(['users', 'services']),
                'owner' => [
                    'id' => $owner->id,
                    'name' => $owner->name,
                    'email' => $owner->email,
                ],
                'credentials' => [
                    'email' => $owner->email,
                    'password' => $data['owner_password'],
                    'login_url' => env('FRONTEND_URL', 'http://localhost:3000') . '/login',
                ],
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            report($e);
            return response()->json([
                'message' => 'Gabim gjatë krijimit: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Përditëso biznesin.
     */
    public function update(UpdateTenantRequest $request, Tenant $tenant): JsonResponse
    {
        $tenant->update($request->validated());
        return response()->json([
            'message' => 'Biznesi u përditësua.',
            'tenant' => $tenant->fresh(),
        ]);
    }

    /**
     * Fshij biznesin (soft delete + cascade).
     */
    public function destroy(Tenant $tenant): JsonResponse
    {
        // Kontrollo nëse ka rezervime aktive
        $activeReservations = Reservation::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->whereIn('status', ['confirmed', 'tentative'])
            ->count();

        if ($activeReservations > 0) {
            return response()->json([
                'message' => "Biznesi ka {$activeReservations} rezervime aktive. Anuloni ose përfundoni ato së pari.",
            ], 409);
        }

        $tenantName = $tenant->name;

        DB::beginTransaction();
        try {
            // Fshij users (cascade)
            User::where('tenant_id', $tenant->id)->delete();
            // Soft delete tenant
            $tenant->delete();
            DB::commit();

            Log::warning('Tenant deleted by SuperAdmin', [
                'tenant_id' => $tenant->id,
                'tenant_name' => $tenantName,
                'deleted_by' => auth()->id(),
            ]);

            return response()->json([
                'message' => "Biznesi '{$tenantName}' u fshi me sukses.",
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Gabim gjatë fshirjes: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Ndrysho statusin.
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

    /**
     * Statistika globale.
     */
    public function platformStats(): JsonResponse
    {
        $totalTenants = Tenant::count();
        $activeTenants = Tenant::where('status', 'active')->count();
        $totalUsers = User::whereHas('roles', fn ($q) => $q->where('name', '!=', 'super_admin'))->count();
        $totalReservations = Reservation::withoutGlobalScopes()->count();
        $totalRevenue = (float) Payment::withoutGlobalScopes()->sum('amount');
        $revenueMonth = (float) Payment::withoutGlobalScopes()
            ->where('payment_date', '>=', now()->startOfMonth())->sum('amount');

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
}
