<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BlockedSlot;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BlockedSlotController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = BlockedSlot::query()->with('creator:id,name');

        if ($from = $request->input('from')) {
            $query->where('starts_at', '>=', Carbon::parse($from)->startOfDay());
        }
        if ($to = $request->input('to')) {
            $query->where('starts_at', '<=', Carbon::parse($to)->endOfDay());
        }

        $query->orderBy('starts_at');

        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $startsAt = Carbon::parse($data['starts_at']);
        $endsAt = Carbon::parse($data['ends_at']);

        // Kontrollo konflikt me bllokime të tjera
        $conflict = BlockedSlot::where('tenant_id', app('tenant_id'))
            ->where('starts_at', '<', $endsAt)
            ->where('ends_at', '>', $startsAt)
            ->exists();

        if ($conflict) {
            return response()->json([
                'message' => 'Ky orar është i bllokuar tashmë.',
            ], 409);
        }

        $block = BlockedSlot::create([
            'tenant_id' => app('tenant_id'),
            'created_by' => auth()->id(),
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
            'reason' => $data['reason'] ?? null,
        ]);

        return response()->json([
            'message' => 'Oraret u bllokuan me sukses.',
            'blocked_slot' => $block->fresh(),
        ], 201);
    }

    public function destroy(BlockedSlot $blockedSlot): JsonResponse
    {
        $blockedSlot->delete();

        return response()->json(['message' => 'Bllokimi u fshi.']);
    }
}
