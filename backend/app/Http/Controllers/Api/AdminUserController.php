<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AdminUserController extends Controller
{
    /**
     * Listo të gjithë përdoruesit (përveç super admin).
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::query()
            ->with(['roles:id,name', 'tenant:id,name,slug'])
            ->whereDoesntHave('roles', fn ($q) => $q->where('name', 'super_admin'));

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($tenantId = $request->input('tenant_id')) {
            $query->where('tenant_id', $tenantId);
        }

        if ($role = $request->input('role')) {
            $query->whereHas('roles', fn ($q) => $q->where('name', $role));
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $query->orderBy('created_at', 'desc');

        $users = $query->paginate(20);

        return response()->json($users);
    }

    /**
     * Detajet e një përdoruesi.
     */
    public function show(User $user): JsonResponse
    {
        $user->load(['roles:id,name', 'tenant:id,name,slug']);

        return response()->json([
            'user' => $user,
        ]);
    }

    /**
     * Krijo përdorues të ri.
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $data = $request->validated();

        DB::beginTransaction();
        try {
            $user = User::create([
                'tenant_id' => $data['tenant_id'],
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'phone' => $data['phone'] ?? null,
                'status' => $data['status'],
            ]);
            $user->assignRole($data['role']);

            DB::commit();

            return response()->json([
                'message' => 'Përdoruesi u krijua me sukses.',
                'user' => $user->fresh()->load(['roles:id,name', 'tenant:id,name,slug']),
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            report($e);
            return response()->json([
                'message' => 'Gabim: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Përditëso përdoruesin.
     */
    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $data = $request->validated();

        // Mos lejo edit të super_admin
        if ($user->hasRole('super_admin')) {
            return response()->json([
                'message' => 'Nuk mund të modifikoni Super Admin.',
            ], 403);
        }

        DB::beginTransaction();
        try {
            $updateData = collect($data)->except(['password', 'role'])->toArray();

            if (! empty($data['password'])) {
                $updateData['password'] = Hash::make($data['password']);
            }

            $user->update($updateData);

            if (! empty($data['role'])) {
                $user->syncRoles([$data['role']]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Përdoruesi u përditësua.',
                'user' => $user->fresh()->load(['roles:id,name', 'tenant:id,name,slug']),
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Gabim: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Fshij përdoruesin.
     */
    public function destroy(User $user): JsonResponse
    {
        if ($user->hasRole('super_admin')) {
            return response()->json([
                'message' => 'Nuk mund të fshini Super Admin.',
            ], 403);
        }

        if ($user->id === auth()->id()) {
            return response()->json([
                'message' => 'Nuk mund të fshini veten.',
            ], 403);
        }

        // Kontrollo nëse është owner i vetëm i tenantit
        if ($user->hasRole('owner')) {
            $otherOwners = User::where('tenant_id', $user->tenant_id)
                ->where('id', '!=', $user->id)
                ->whereHas('roles', fn ($q) => $q->where('name', 'owner'))
                ->count();

            if ($otherOwners === 0) {
                return response()->json([
                    'message' => 'Ky është Owneri i vetëm i biznesit. Caktoni një Owner tjetër së pari.',
                ], 409);
            }
        }

        $userName = $user->name;
        $user->delete();

        Log::warning('User deleted by SuperAdmin', [
            'user_id' => $user->id,
            'user_email' => $user->email,
            'deleted_by' => auth()->id(),
        ]);

        return response()->json([
            'message' => "Përdoruesi '{$userName}' u fshi.",
        ]);
    }

    /**
     * Ndrysho statusin (aktiv/joaktiv).
     */
    public function updateStatus(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:active,inactive'],
        ]);

        if ($user->hasRole('super_admin')) {
            return response()->json(['message' => 'Nuk mund të modifikoni Super Admin.'], 403);
        }

        $user->update(['status' => $data['status']]);

        return response()->json([
            'message' => 'Statusi u përditësua.',
            'user' => $user->fresh(),
        ]);
    }

    /**
     * Reset password (SuperAdmin jep një password të re).
     */
    public function resetPassword(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'password' => ['required', 'string', 'min:8'],
        ]);

        if ($user->hasRole('super_admin')) {
            return response()->json(['message' => 'Nuk mund të modifikoni Super Admin.'], 403);
        }

        $user->update(['password' => Hash::make($data['password'])]);

        // Revoko të gjithë tokenat
        $user->tokens()->delete();

        return response()->json([
            'message' => 'Fjalëkalimi u rivendos. Përdoruesi duhet të logohet përsëri.',
        ]);
    }
}
