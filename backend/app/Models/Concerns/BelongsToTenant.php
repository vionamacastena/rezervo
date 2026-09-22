<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;

trait BelongsToTenant
{
    protected static function bootBelongsToTenant(): void
    {
        // Global scope: filtro automatikisht sipas tenant_id
        static::addGlobalScope('tenant', function (Builder $builder) {
            $tenantId = app()->bound('tenant_id') ? app('tenant_id') : null;

            if ($tenantId) {
                $builder->where($builder->getModel()->getTable() . '.tenant_id', $tenantId);
            }
        });

        // Auto-fill tenant_id kur krijohet rekord
        static::creating(function ($model) {
            if (empty($model->tenant_id) && app()->bound('tenant_id')) {
                $model->tenant_id = app('tenant_id');
            }
        });
    }
}
