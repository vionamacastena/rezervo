<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->foreignId('reservation_id')->constrained('reservations')->onDelete('cascade');
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->string('payment_id', 32)->unique();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('EUR');
            $table->enum('method', [
                'cash',
                'card',
                'bank_transfer',
                'online',
                'other'
            ])->default('cash');
            $table->date('payment_date');
            $table->text('notes')->nullable();
            $table->boolean('is_deletable')->default(true);
            $table->timestamp('locked_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'reservation_id']);
            $table->index('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
