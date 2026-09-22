<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SuperAdminOnly
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (! $user->hasRole('super_admin')) {
            return response()->json([
                'message' => 'Akses i ndaluar. Vetëm Super Admin.',
            ], 403);
        }

        return $next($request);
    }
}
