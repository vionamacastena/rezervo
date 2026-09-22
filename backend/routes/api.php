<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\ReservationController;

Route::prefix('v1')->group(function () {

    // Public
    Route::post('/auth/login', [AuthController::class, 'login']);

    // Protected
    Route::middleware(['auth:sanctum', 'tenant'])->group(function () {

        // Auth
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        // Health
        Route::get('/health', fn() => response()->json([
            'status' => 'ok',
            'tenant_id' => app('tenant_id'),
            'user' => auth()->user()->only(['id', 'name', 'email']),
        ]));

        // Clients
        Route::apiResource('clients', ClientController::class);

        // Reservations
        Route::apiResource('reservations', ReservationController::class);
        Route::post('reservations/{reservation}/confirm', [ReservationController::class, 'confirm']);
        Route::post('reservations/{reservation}/tentative', [ReservationController::class, 'tentative']);
        Route::post('reservations/{reservation}/complete', [ReservationController::class, 'complete']);
        Route::post('reservations/{reservation}/cancel', [ReservationController::class, 'cancel']);
        Route::post('reservations/{reservation}/duplicate', [ReservationController::class, 'duplicate']);

        // Payments
        Route::apiResource('payments', \App\Http\Controllers\Api\PaymentController::class);

        // Staff
        Route::apiResource('staff', \App\Http\Controllers\Api\StaffMemberController::class);

        // Inventory
        Route::apiResource('inventory', \App\Http\Controllers\Api\InventoryItemController::class);
        Route::post('inventory/{inventory}/adjust-stock', [\App\Http\Controllers\Api\InventoryItemController::class, 'adjustStock']);

        // Reports
        Route::prefix('reports')->group(function () {
            Route::get('dashboard', [\App\Http\Controllers\Api\ReportController::class, 'dashboard']);
            Route::get('revenue', [\App\Http\Controllers\Api\ReportController::class, 'revenue']);
            Route::get('outstanding', [\App\Http\Controllers\Api\ReportController::class, 'outstanding']);
            Route::get('occupancy', [\App\Http\Controllers\Api\ReportController::class, 'occupancy']);
            Route::get('staff-utilization', [\App\Http\Controllers\Api\ReportController::class, 'staffUtilization']);
            Route::get('inventory-status', [\App\Http\Controllers\Api\ReportController::class, 'inventoryStatus']);
        });
    });
});
