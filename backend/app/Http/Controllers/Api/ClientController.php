<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\StoreClientRequest;
use App\Http\Requests\UpdateClientRequest;
use App\Http\Resources\ClientResource;
use App\Models\Client;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClientController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Client::query()->withCount('reservations');

        // Kërkim
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // Sortim
        $sortBy = $request->input('sort_by', 'created_at');
        $sortDir = $request->input('sort_dir', 'desc');
        $allowedSorts = ['first_name', 'last_name', 'email', 'created_at'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'asc' ? 'asc' : 'desc');
        }

        $perPage = min((int) $request->input('per_page', 15), 100);
        $clients = $query->paginate($perPage);

        return $this->success(ClientResource::collection($clients)->response()->getData(true));
    }

    public function store(StoreClientRequest $request): JsonResponse
    {
        $client = Client::create($request->validated());

        return $this->created(new ClientResource($client), 'Klienti u krijua me sukses.');
    }

    public function show(Client $client): JsonResponse
    {
        $client->loadCount('reservations');
        return $this->success(new ClientResource($client));
    }

    public function update(UpdateClientRequest $request, Client $client): JsonResponse
    {
        $client->update($request->validated());

        return $this->success(new ClientResource($client->fresh()), 'Klienti u përditësua me sukses.');
    }

    public function destroy(Client $client): JsonResponse
    {
        // Kontrollo nëse ka rezervime aktive
        $activeReservations = $client->reservations()
            ->whereIn('status', ['draft', 'tentative', 'confirmed'])
            ->count();

        if ($activeReservations > 0) {
            return $this->error(
                "Klienti ka {$activeReservations} rezervime aktive. Anuloni rezervimet para fshirjes.",
                409
            );
        }

        $client->delete();

        return $this->noContent('Klienti u fshi me sukses.');
    }
}
