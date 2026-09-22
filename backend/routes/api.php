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
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\ServiceController;
use App\Services\BusinessTemplates;

Route::prefix('v1')->group(function () {

    // ═══ Public ═══
    Route::prefix('public/{slug}')->group(function () {
        Route::get('/', [PublicBookingController::class, 'show']);
        Route::get('/availability', [PublicBookingController::class, 'availability']);
        Route::post('/book', [PublicBookingController::class, 'book']);
    });

    Route::post('/auth/login', [AuthController::class, 'login']);

    // ═══ Authenticated (pa tenant) ═══
    Route::middleware(['auth:sanctum'])->group(function () {

        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        // SuperAdmin only
        Route::middleware('super.admin')->prefix('admin')->group(function () {
            Route::get('platform-stats', [AdminTenantController::class, 'platformStats']);
            Route::get('tenants', [AdminTenantController::class, 'index']);
            Route::post('tenants', [AdminTenantController::class, 'store']);
            Route::get('tenants/{tenant}', [AdminTenantController::class, 'show']);
            Route::put('tenants/{tenant}', [AdminTenantController::class, 'update']);
            Route::delete('tenants/{tenant}', [AdminTenantController::class, 'destroy']);
            Route::patch('tenants/{tenant}/status', [AdminTenantController::class, 'updateStatus']);

            Route::get('users', [AdminUserController::class, 'index']);
            Route::post('users', [AdminUserController::class, 'store']);
            Route::get('users/{user}', [AdminUserController::class, 'show']);
            Route::put('users/{user}', [AdminUserController::class, 'update']);
            Route::delete('users/{user}', [AdminUserController::class, 'destroy']);
            Route::patch('users/{user}/status', [AdminUserController::class, 'updateStatus']);
            Route::post('users/{user}/reset-password', [AdminUserController::class, 'resetPassword']);

            // Templates list
            Route::get('business-templates', fn () => response()->json(BusinessTemplates::list()));
        });
    });

    // ═══ Tenant-scoped ═══
    Route::middleware(['auth:sanctum', 'tenant'])->group(function () {

        Route::get('/health', fn () => response()->json([
            'status' => 'ok',
            'tenant_id' => app()->bound('tenant_id') ? app('tenant_id') : null,
        ]));

        // Services CRUD
        Route::apiResource('services', ServiceController::class);

        Route::apiResource('clients', ClientController::class);

        Route::apiResource('reservations', ReservationController::class);
        Route::post('reservations/{reservation}/confirm', [ReservationController::class, 'confirm']);
        Route::post('reservations/{reservation}/tentative', [ReservationController::class, 'tentative']);
        Route::post('reservations/{reservation}/complete', [ReservationController::class, 'complete']);
        Route::post('reservations/{reservation}/cancel', [ReservationController::class, 'cancel']);
        Route::post('reservations/{reservation}/duplicate', [ReservationController::class, 'duplicate']);

        Route::apiResource('payments', PaymentController::class);
        Route::apiResource('staff', StaffMemberController::class);

        Route::apiResource('inventory', InventoryItemController::class);
        Route::post('inventory/{inventory}/adjust-stock', [InventoryItemController::class, 'adjustStock']);

        Route::prefix('reports')->group(function () {
            Route::get('dashboard', [ReportController::class, 'dashboard']);
            Route::get('revenue', [ReportController::class, 'revenue']);
            Route::get('outstanding', [ReportController::class, 'outstanding']);
            Route::get('occupancy', [ReportController::class, 'occupancy']);
            Route::get('staff-utilization', [ReportController::class, 'staffUtilization']);
            Route::get('inventory-status', [ReportController::class, 'inventoryStatus']);
        });
    });
});
