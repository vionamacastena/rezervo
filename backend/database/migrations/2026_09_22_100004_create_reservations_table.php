<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->foreignId('client_id')->constrained('clients')->onDelete('restrict');
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->string('code', 20)->unique();
            $table->enum('status', [
                'draft',
                'tentative',
                'confirmed',
                'completed',
                'cancelled'
            ])->default('draft');
            $table->dateTime('starts_at');
            $table->dateTime('ends_at');
            $table->integer('guests_count')->default(1);
            $table->string('resource')->nullable(); // hall/room/table name
            $table->text('notes')->nullable();
            $table->decimal('total_price', 12, 2)->default(0);
            $table->string('currency', 3)->default('EUR');
            $table->text('cancellation_reason')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'starts_at']);
            $table->index(['tenant_id', 'status']);
            $table->index('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
