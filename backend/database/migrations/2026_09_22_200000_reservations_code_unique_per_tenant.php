<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            // Fshij unique global ekzistues
            $table->dropUnique('reservations_code_unique');
            // Shto unique per-tenant
            $table->unique(['tenant_id', 'code'], 'reservations_tenant_code_unique');
        });
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropUnique('reservations_tenant_code_unique');
            $table->unique('code', 'reservations_code_unique');
        });
    }
};
