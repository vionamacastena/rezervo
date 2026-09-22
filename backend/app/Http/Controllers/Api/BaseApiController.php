<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

abstract class BaseApiController extends Controller
{
    protected function success($data = null, string $message = 'OK', int $code = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $code);
    }

    protected function error(string $message = 'Error', int $code = 400, $errors = null): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => $errors,
        ], $code);
    }

    protected function created($data = null, string $message = 'Krijuar me sukses'): JsonResponse
    {
        return $this->success($data, $message, 201);
    }

    protected function noContent(string $message = 'Fshirë me sukses'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
        ], 200);
    }
}
