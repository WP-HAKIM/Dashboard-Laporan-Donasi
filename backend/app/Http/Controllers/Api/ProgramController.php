<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Program;
use Illuminate\Http\Request;

class ProgramController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Program::query();
        
        // Filter by type if provided
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }
        
        $programs = $query->get();
        return response()->json($programs);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'type' => 'required|in:ZISWAF,QURBAN',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:programs',
            'description' => 'required|string',
            'volunteer_rate' => 'required|numeric|min:0|max:100',
            'branch_rate' => 'required|numeric|min:0|max:100',
        ]);

        $program = Program::create($request->all());
        return response()->json($program, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Program $program)
    {
        return response()->json($program);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Program $program)
    {
        $request->validate([
            'type' => 'required|in:ZISWAF,QURBAN',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:programs,code,' . $program->id,
            'description' => 'required|string',
            'volunteer_rate' => 'required|numeric|min:0|max:100',
            'branch_rate' => 'required|numeric|min:0|max:100',
        ]);

        $program->update($request->all());
        return response()->json($program);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Program $program)
    {
        $program->delete();
        return response()->json(['message' => 'Program deleted successfully']);
    }
}
