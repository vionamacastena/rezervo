<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Service::query();

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        $query->orderBy('sort_order')->orderBy('name');

        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:1000'],
            'duration_minutes' => ['required', 'integer', 'min:5', 'max:480'],
            'price' => ['required', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            'color' => ['nullable', 'string', 'max:7'],
            'category' => ['nullable', 'string', 'max:100'],
            'is_active' => ['boolean'],
            'sort_order' => ['integer', 'min:0'],
        ]);

        $service = Service::create($data);

        return response()->json([
            'message' => 'Shërbimi u krijua.',
            'service' => $service,
        ], 201);
    }

    public function show(Service $service): JsonResponse
    {
        return response()->json($service);
    }

    public function update(Request $request, Service $service): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:1000'],
            'duration_minutes' => ['sometimes', 'integer', 'min:5', 'max:480'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            'color' => ['nullable', 'string', 'max:7'],
            'category' => ['nullable', 'string', 'max:100'],
            'is_active' => ['boolean'],
            'sort_order' => ['integer', 'min:0'],
        ]);

        $service->update($data);

        return response()->json([
            'message' => 'Shërbimi u përditësua.',
            'service' => $service->fresh(),
        ]);
    }

    public function destroy(Service $service): JsonResponse
    {
        $activeReservations = $service->reservations()
            ->whereIn('status', ['draft', 'tentative', 'confirmed'])
            ->count();

        if ($activeReservations > 0) {
            return response()->json([
                'message' => "Shërbimi ka {$activeReservations} rezervime aktive. Çaktivizoje në vend të fshirjes.",
            ], 409);
        }

        $service->delete();
        return response()->json(['message' => 'Shërbimi u fshi.']);
    }
}
