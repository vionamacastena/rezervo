<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;

Route::prefix('v1')->group(function () {

    // Public
    Route::post('/auth/login', [AuthController::class, 'login']);

    // Protected
    Route::middleware(['auth:sanctum', 'tenant'])->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        Route::get('/health', fn () => response()->json([
            'status' => 'ok',
            'tenant_id' => app('tenant_id'),
            'user' => auth()->user()->only(['id', 'name', 'email']),
        ]));
    });
});
