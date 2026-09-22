<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\StaffMemberController;
use App\Http\Controllers\Api\InventoryItemController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\PublicBookingController;
use App\Http\Controllers\Api\AdminTenantController;

Route::prefix('v1')->group(function () {

    // ═══ Public Booking (pa auth) ═══
    Route::prefix('public/{slug}')->group(function () {
        Route::get('/', [PublicBookingController::class, 'show']);
        Route::get('/availability', [PublicBookingController::class, 'availability']);
        Route::post('/book', [PublicBookingController::class, 'book']);
    });

    // ═══ Login ═══
    Route::post('/auth/login', [AuthController::class, 'login']);

    // ═══ Protected (auth + tenant) ═══
    Route::middleware(['auth:sanctum', 'tenant'])->group(function () {

        // Auth
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        // Health
        Route::get('/health', fn () => response()->json([
            'status' => 'ok',
            'tenant_id' => app('tenant_id'),
            'user' => auth()->user()->only(['id', 'name', 'email']),
        ]));

        // ─── Clients ───
        Route::apiResource('clients', ClientController::class);

        // ─── Reservations ───
        Route::apiResource('reservations', ReservationController::class);
        Route::post('reservations/{reservation}/confirm', [ReservationController::class, 'confirm']);
        Route::post('reservations/{reservation}/tentative', [ReservationController::class, 'tentative']);
        Route::post('reservations/{reservation}/complete', [ReservationController::class, 'complete']);
        Route::post('reservations/{reservation}/cancel', [ReservationController::class, 'cancel']);
        Route::post('reservations/{reservation}/duplicate', [ReservationController::class, 'duplicate']);

        // ─── Payments ───
        Route::apiResource('payments', PaymentController::class);

        // ─── Staff ───
        Route::apiResource('staff', StaffMemberController::class);

        // ─── Inventory ───
        Route::apiResource('inventory', InventoryItemController::class);
        Route::post('inventory/{inventory}/adjust-stock', [InventoryItemController::class, 'adjustStock']);

        // ─── Reports ───
        Route::prefix('reports')->group(function () {
            Route::get('dashboard', [ReportController::class, 'dashboard']);
            Route::get('revenue', [ReportController::class, 'revenue']);
            Route::get('outstanding', [ReportController::class, 'outstanding']);
            Route::get('occupancy', [ReportController::class, 'occupancy']);
            Route::get('staff-utilization', [ReportController::class, 'staffUtilization']);
            Route::get('inventory-status', [ReportController::class, 'inventoryStatus']);
        });

        // ─── SuperAdmin only ───
        Route::middleware('role:super_admin')->prefix('admin')->group(function () {
            Route::get('platform-stats', [AdminTenantController::class, 'platformStats']);
            Route::get('tenants', [AdminTenantController::class, 'index']);
            Route::get('tenants/{tenant}', [AdminTenantController::class, 'show']);
            Route::patch('tenants/{tenant}/status', [AdminTenantController::class, 'updateStatus']);
        });
    });
});
