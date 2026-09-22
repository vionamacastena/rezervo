<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantContext
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // Super Admin mund të aksesojë çdo tenant
        if ($user->hasRole('super_admin')) {
            $tenantId = $request->header('X-Tenant-Id') ?? $user->tenant_id;
            if (! $tenantId) {
                return response()->json([
                    'message' => 'Tenant context required.',
                ], 400);
            }
            app()->instance('tenant_id', (int) $tenantId);
            return $next($request);
        }

        if (! $user->tenant_id) {
            return response()->json([
                'message' => 'No tenant assigned to user.',
            ], 403);
        }

        app()->instance('tenant_id', $user->tenant_id);

        return $next($request);
    }
}
