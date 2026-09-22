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

        // SuperAdmin: pa tenant_id → OK për admin routes
        if ($user->hasRole('super_admin')) {
            $tenantId = $request->header('X-Tenant-Id') ?? $user->tenant_id;

            if ($tenantId) {
                app()->instance('tenant_id', (int) $tenantId);
            }
            // Nëse s'ka tenant_id, mos e vendos fare — admin routes nuk kanë nevojë

            return $next($request);
        }

        // User normal: kërko tenant_id
        if (! $user->tenant_id) {
            return response()->json([
                'message' => 'No tenant assigned to user.',
            ], 403);
        }

        app()->instance('tenant_id', $user->tenant_id);

        return $next($request);
    }
}
