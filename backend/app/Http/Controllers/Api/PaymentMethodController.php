<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PaymentMethodController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $paymentMethods = PaymentMethod::orderBy('name')->get();
        return response()->json($paymentMethods);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        // Not needed for API
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:payment_methods',
            'description' => 'nullable|string|max:500',
            'is_active' => 'boolean'
        ]);

        $paymentMethod = PaymentMethod::create($request->all());
        return response()->json($paymentMethod, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(PaymentMethod $paymentMethod): JsonResponse
    {
        return response()->json($paymentMethod);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        // Not needed for API
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, PaymentMethod $paymentMethod): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:payment_methods,name,' . $paymentMethod->id,
            'description' => 'nullable|string|max:500',
            'is_active' => 'boolean'
        ]);

        $paymentMethod->update($request->all());
        return response()->json($paymentMethod);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PaymentMethod $paymentMethod): JsonResponse
    {
        $paymentMethod->delete();
        return response()->json(['message' => 'Payment method deleted successfully']);
    }
}
