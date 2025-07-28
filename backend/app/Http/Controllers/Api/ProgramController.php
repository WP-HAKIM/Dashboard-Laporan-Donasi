<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Exception;

class ProgramController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $query = Program::query();
            
            // Filter by type if provided
            if ($request->has('type')) {
                $query->where('type', $request->type);
            }
            
            $programs = $query->get();
            return response()->json([
                'success' => true,
                'data' => $programs,
                'message' => 'Programs retrieved successfully'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve programs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'type' => 'required|in:ZISWAF,QURBAN',
                'name' => 'required|string|max:255',
                'code' => 'required|string|max:50|unique:programs',
                'description' => 'required|string',
                'volunteer_rate' => 'required|numeric|min:0|max:100',
                'branch_rate' => 'required|numeric|min:0|max:100',
            ]);

            $program = Program::create($request->all());
            return response()->json([
                'success' => true,
                'data' => $program,
                'message' => 'Program created successfully'
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create program',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Program $program)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $program,
                'message' => 'Program retrieved successfully'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve program',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Program $program)
    {
        try {
            $request->validate([
                'type' => 'required|in:ZISWAF,QURBAN',
                'name' => 'required|string|max:255',
                'code' => 'required|string|max:50|unique:programs,code,' . $program->id,
                'description' => 'required|string',
                'volunteer_rate' => 'required|numeric|min:0|max:100',
                'branch_rate' => 'required|numeric|min:0|max:100',
            ]);

            // Check if rates are being updated
            $ratesChanged = (
                $program->volunteer_rate != $request->volunteer_rate ||
                $program->branch_rate != $request->branch_rate
            );

            $program->update($request->all());

            // Update existing transactions with new rates if rates changed
            if ($ratesChanged) {
                // Update transactions where this program is the main program
                Transaction::where('program_id', $program->id)
                    ->update([
                        'volunteer_rate' => $request->volunteer_rate,
                        'branch_rate' => $request->branch_rate,
                        'updated_at' => now()
                    ]);
                
                // Also update transactions where this program is used as ziswaf_program_id
                // (for QURBAN transactions with additional ZISWAF program)
                if ($program->type === 'ZISWAF') {
                    Transaction::where('ziswaf_program_id', $program->id)
                        ->update([
                            'ziswaf_volunteer_rate' => $request->volunteer_rate,
                            'ziswaf_branch_rate' => $request->branch_rate,
                            'updated_at' => now()
                        ]);
                }
            }

            return response()->json([
                'success' => true,
                'data' => $program->fresh(),
                'message' => 'Program updated successfully' . ($ratesChanged ? ' and existing transaction rates updated' : '')
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update program',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Program $program)
    {
        try {
            $program->delete();
            return response()->json([
                'success' => true,
                'message' => 'Program deleted successfully'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete program',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update rates for all existing transactions
     */
    public function updateAllTransactionRates()
    {
        try {
            $updatedCount = 0;
            $programs = Program::all();
            
            foreach ($programs as $program) {
                // Update transactions where this program is the main program
                $mainProgramUpdates = Transaction::where('program_id', $program->id)
                    ->update([
                        'volunteer_rate' => $program->volunteer_rate,
                        'branch_rate' => $program->branch_rate,
                        'updated_at' => now()
                    ]);
                
                $updatedCount += $mainProgramUpdates;
                
                // Also update transactions where this program is used as ziswaf_program_id
                if ($program->type === 'ZISWAF') {
                    $ziswafProgramUpdates = Transaction::where('ziswaf_program_id', $program->id)
                        ->update([
                            'ziswaf_volunteer_rate' => $program->volunteer_rate,
                            'ziswaf_branch_rate' => $program->branch_rate,
                            'updated_at' => now()
                        ]);
                    
                    $updatedCount += $ziswafProgramUpdates;
                }
            }
            
            return response()->json([
                'success' => true,
                'message' => "Successfully updated rates for {$updatedCount} transactions",
                'updated_count' => $updatedCount
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update transaction rates',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
