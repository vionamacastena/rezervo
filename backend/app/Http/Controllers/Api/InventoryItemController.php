<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\StoreInventoryItemRequest;
use App\Http\Requests\UpdateInventoryItemRequest;
use App\Http\Resources\InventoryItemResource;
use App\Models\InventoryItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryItemController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = InventoryItem::query();

        if ($category = $request->input('category')) {
            $query->where('category', $category);
        }

        if ($request->boolean('low_stock_only')) {
            $query->whereColumn('quantity', '<=', 'min_threshold');
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        $query->orderBy('name');

        $perPage = min((int) $request->input('per_page', 15), 100);

        return $this->success(
            InventoryItemResource::collection($query->paginate($perPage))->response()->getData(true)
        );
    }

    public function store(StoreInventoryItemRequest $request): JsonResponse
    {
        $item = InventoryItem::create($request->validated());
        return $this->created(new InventoryItemResource($item), 'Artikulli u shtua me sukses.');
    }

    public function show(InventoryItem $inventory): JsonResponse
    {
        return $this->success(new InventoryItemResource($inventory));
    }

    public function update(UpdateInventoryItemRequest $request, InventoryItem $inventory): JsonResponse
    {
        $inventory->update($request->validated());
        return $this->success(new InventoryItemResource($inventory->fresh()), 'Artikulli u përditësua.');
    }

    public function destroy(InventoryItem $inventory): JsonResponse
    {
        $inventory->delete();
        return $this->noContent('Artikulli u fshi me sukses.');
    }

    // Custom: shto sasi
    public function adjustStock(Request $request, InventoryItem $inventory): JsonResponse
    {
        $request->validate([
            'delta' => ['required', 'integer'],
        ]);

        $newQty = $inventory->quantity + (int) $request->input('delta');

        if ($newQty < 0) {
            return $this->error('Sasia nuk mund të jetë negative.', 422);
        }

        $inventory->quantity = $newQty;
        $inventory->save();

        return $this->success(new InventoryItemResource($inventory), 'Stoku u përditësua.');
    }
}
