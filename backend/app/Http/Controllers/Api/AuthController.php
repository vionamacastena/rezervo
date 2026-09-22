<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string|min:8',
            'device_name' => 'nullable|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Kredencialet nuk janë të sakta.'],
            ]);
        }

        if ($user->status !== 'active') {
            throw ValidationException::withMessages([
                'email' => ['Llogaria është e çaktivizuar.'],
            ]);
        }

        $token = $user->createToken(
            $request->device_name ?? 'api-token'
        )->plainTextToken;

        $user->update(['last_login_at' => now()]);

        return response()->json([
            'user' => $user->load('roles'),
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'U shkëputët me sukses.']);
    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user()->load('roles', 'tenant'),
        ]);
    }
}
