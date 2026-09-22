<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\StoreStaffMemberRequest;
use App\Http\Requests\UpdateStaffMemberRequest;
use App\Http\Resources\StaffMemberResource;
use App\Models\StaffMember;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffMemberController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = StaffMember::query();

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $query->orderBy('first_name');

        $perPage = min((int) $request->input('per_page', 15), 100);

        return $this->success(
            StaffMemberResource::collection($query->paginate($perPage))->response()->getData(true)
        );
    }

    public function store(StoreStaffMemberRequest $request): JsonResponse
    {
        $staff = StaffMember::create($request->validated());
        return $this->created(new StaffMemberResource($staff), 'Punonjësi u shtua me sukses.');
    }

    public function show(StaffMember $staff): JsonResponse
    {
        return $this->success(new StaffMemberResource($staff));
    }

    public function update(UpdateStaffMemberRequest $request, StaffMember $staff): JsonResponse
    {
        $staff->update($request->validated());
        return $this->success(new StaffMemberResource($staff->fresh()), 'Punonjësi u përditësua.');
    }

    public function destroy(StaffMember $staff): JsonResponse
    {
        $staff->delete();
        return $this->noContent('Punonjësi u fshi me sukses.');
    }
}
