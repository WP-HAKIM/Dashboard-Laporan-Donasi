<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\Program;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TransactionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Use same preload as dashboard for consistency
        $query = Transaction::with(['branch', 'team', 'volunteer', 'program', 'validator', 'paymentMethod']);

        // If user is volunteer, filter by their data automatically
        $user = $request->user();
        if ($user && $user->role === 'volunteer') {
            $query->where('volunteer_id', $user->id);
            
            // Also filter by their branch and team for consistency
            if ($user->branch_id || $user->branchId) {
                $query->where('branch_id', $user->branch_id ?? $user->branchId);
            }
            if ($user->team_id || $user->teamId) {
                $query->where('team_id', $user->team_id ?? $user->teamId);
            }
        } else {
            // For non-volunteer users, apply filters as before
            
            // Filter by branch
            if ($request->has('branch_id')) {
                $query->where('branch_id', $request->branch_id);
            }

            // Filter by team
            if ($request->has('team_id')) {
                $query->where('team_id', $request->team_id);
            }

            // Filter by volunteer
            if ($request->has('volunteer_id')) {
                $query->where('volunteer_id', $request->volunteer_id);
            }
        }

        // Common filters for all users
        
        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by program type
        if ($request->has('program_type')) {
            $query->where('program_type', $request->program_type);
        }

        // Filter by date range (using created_at)
        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Filter by date preset (current month, 1 month back, 2 months back)
        if ($request->has('date_preset')) {
            switch ($request->date_preset) {
                case 'current_month':
                    $query->whereMonth('created_at', now()->month)
                          ->whereYear('created_at', now()->year);
                    break;
                case '1_month_back':
                    $startDate = now()->subMonth()->startOfMonth();
                    $endDate = now()->subMonth()->endOfMonth();
                    $query->whereBetween('created_at', [$startDate, $endDate]);
                    break;
                case '2_months_back':
                    $startDate = now()->subMonths(2)->startOfMonth();
                    $endDate = now()->subMonths(2)->endOfMonth();
                    $query->whereBetween('created_at', [$startDate, $endDate]);
                    break;
                case 'last_3_months':
                    $startDate = now()->subMonths(2)->startOfMonth();
                    $endDate = now()->endOfMonth();
                    $query->whereBetween('created_at', [$startDate, $endDate]);
                    break;
            }
        }

        $transactions = $query->orderBy('created_at', 'desc')->paginate(20);
        return response()->json($transactions);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validationRules = [
                'branch_id' => 'required|exists:branches,id',
                'team_id' => 'required|exists:teams,id',
                'volunteer_id' => 'required|exists:users,id',
                'program_type' => 'required|in:ZISWAF,QURBAN',
                'program_id' => 'required|exists:programs,id',
                'donor_name' => 'required|string|max:255',
                'qurban_owner_name' => 'nullable|string|max:255',
                'qurban_amount' => 'nullable|numeric|min:0',
                'ziswaf_program_id' => 'nullable|exists:programs,id',
                'transaction_date' => 'required|date',
                'payment_method_id' => 'required|exists:payment_methods,id',
                'proof_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            ];

            // Amount is required for ZISWAF or when ziswaf_program_id is provided for QURBAN
            if ($request->program_type === 'ZISWAF' || $request->ziswaf_program_id) {
                $validationRules['amount'] = 'required|numeric|min:0';
            } else {
                $validationRules['amount'] = 'nullable|numeric|min:0';
            }

            $request->validate($validationRules);

            $data = $request->all();

            // Get program rates
            $program = Program::find($request->program_id);
            if ($program) {
                $data['volunteer_rate'] = $program->volunteer_rate;
                $data['branch_rate'] = $program->branch_rate;
            }

            // Get ZISWAF program rates if ziswaf_program_id is provided
            if ($request->ziswaf_program_id) {
                $ziswafProgram = Program::find($request->ziswaf_program_id);
                if ($ziswafProgram) {
                    $data['ziswaf_volunteer_rate'] = $ziswafProgram->volunteer_rate;
                    $data['ziswaf_branch_rate'] = $ziswafProgram->branch_rate;
                }
            }

            // Handle file upload
            if ($request->hasFile('proof_image')) {
                $path = $request->file('proof_image')->store('transaction-proofs', 'public');
                $data['proof_image'] = $path;
            }

            $transaction = Transaction::create($data);
            return response()->json([
                'success' => true,
                'data' => $transaction->load(['branch', 'team', 'volunteer', 'program', 'paymentMethod']),
                'message' => 'Transaksi berhasil disimpan'
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Data tidak valid',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error creating transaction: ' . $e->getMessage(), [
                'request_data' => $request->all(),
                'stack_trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat menyimpan transaksi: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Transaction $transaction)
    {
        return response()->json($transaction->load(['branch', 'team', 'volunteer', 'program', 'validator', 'paymentMethod']));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Transaction $transaction)
    {
        $validationRules = [
            'branch_id' => 'required|exists:branches,id',
            'team_id' => 'required|exists:teams,id',
            'volunteer_id' => 'required|exists:users,id',
            'program_type' => 'required|in:ZISWAF,QURBAN',
            'program_id' => 'required|exists:programs,id',
            'donor_name' => 'required|string|max:255',
            'qurban_owner_name' => 'nullable|string|max:255',
            'qurban_amount' => 'nullable|numeric|min:0',
            'ziswaf_program_id' => 'nullable|exists:programs,id',
            'transaction_date' => 'required|date',
            'payment_method_id' => 'required|exists:payment_methods,id',
            'proof_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ];

        // Amount is required for ZISWAF or when ziswaf_program_id is provided for QURBAN
        if ($request->program_type === 'ZISWAF' || $request->ziswaf_program_id) {
            $validationRules['amount'] = 'required|numeric|min:0';
        } else {
            $validationRules['amount'] = 'nullable|numeric|min:0';
        }

        $request->validate($validationRules);

        $data = $request->all();

        // Get program rates if program_id is being updated
        if ($request->has('program_id')) {
            $program = Program::find($request->program_id);
            if ($program) {
                $data['volunteer_rate'] = $program->volunteer_rate;
                $data['branch_rate'] = $program->branch_rate;
            }
        }

        // Get ZISWAF program rates if ziswaf_program_id is being updated
        if ($request->has('ziswaf_program_id') && $request->ziswaf_program_id) {
            $ziswafProgram = Program::find($request->ziswaf_program_id);
            if ($ziswafProgram) {
                $data['ziswaf_volunteer_rate'] = $ziswafProgram->volunteer_rate;
                $data['ziswaf_branch_rate'] = $ziswafProgram->branch_rate;
            }
        } elseif ($request->has('ziswaf_program_id') && !$request->ziswaf_program_id) {
            // Clear ZISWAF rates if ziswaf_program_id is being removed
            $data['ziswaf_volunteer_rate'] = null;
            $data['ziswaf_branch_rate'] = null;
        }

        // Handle file upload
        if ($request->hasFile('proof_image')) {
            // Delete old image if exists
            if ($transaction->proof_image) {
                Storage::disk('public')->delete($transaction->proof_image);
            }
            $path = $request->file('proof_image')->store('transaction-proofs', 'public');
            $data['proof_image'] = $path;
        }

        $transaction->update($data);
        return response()->json($transaction->load(['branch', 'team', 'volunteer', 'program', 'validator', 'paymentMethod']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Transaction $transaction)
    {
        // Delete associated image
        if ($transaction->proof_image) {
            Storage::disk('public')->delete($transaction->proof_image);
        }

        $transaction->delete();
        return response()->json(['message' => 'Transaction deleted successfully']);
    }

    /**
     * Validate a transaction
     */
    public function validate(Request $request, Transaction $transaction)
    {
        $request->validate([
            'status' => 'required|in:valid,double_duta,double_input,not_in_account,other',
            'status_reason' => 'nullable|string',
        ]);

        $transaction->update([
            'status' => $request->status,
            'status_reason' => $request->status_reason,
            'validated_at' => now(),
            'validated_by' => $request->user()->id,
        ]);

        return response()->json($transaction->load(['branch', 'team', 'volunteer', 'program', 'validator', 'paymentMethod']));
    }

    /**
     * Get transactions by current user (volunteer)
     * Uses same preload as dashboard for consistency
     */
    public function myTransactions(Request $request)
    {
        $user = $request->user();
        
        // Use same preload as dashboard for consistency
        $query = Transaction::with(['branch', 'team', 'volunteer', 'program', 'validator', 'paymentMethod'])
            ->where('volunteer_id', $user->id);
            
        // Also filter by user's branch and team for consistency
        if ($user->branch_id || $user->branchId) {
            $query->where('branch_id', $user->branch_id ?? $user->branchId);
        }
        if ($user->team_id || $user->teamId) {
            $query->where('team_id', $user->team_id ?? $user->teamId);
        }
        
        // Apply additional filters if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        if ($request->has('program_type')) {
            $query->where('program_type', $request->program_type);
        }
        
        // Filter by date range
        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        
        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }
        
        $transactions = $query->orderBy('created_at', 'desc')->paginate(20);
        
        return response()->json($transactions);
    }

    /**
     * Get pending transactions for validation
     */
    public function pending(Request $request)
    {
        $query = Transaction::with(['branch', 'team', 'volunteer', 'program', 'paymentMethod'])
            ->where('status', 'pending');

        // If user is branch role, only show transactions from their branch
        if ($request->user()->role === 'branch' && $request->user()->branch_id) {
            $query->where('branch_id', $request->user()->branch_id);
        }

        $transactions = $query->orderBy('created_at', 'asc')->paginate(20);
        return response()->json($transactions);
    }

    /**
     * Get my transactions statistics
     */
    public function myTransactionsStats(Request $request)
    {
        $user = $request->user();
        
        // Base query for user's transactions
        $query = Transaction::with(['program'])
            ->where('volunteer_id', $user->id)
            ->where('status', 'valid'); // Only validated transactions
            
        // Also filter by user's branch and team for consistency
        if ($user->branch_id || $user->branchId) {
            $query->where('branch_id', $user->branch_id ?? $user->branchId);
        }
        if ($user->team_id || $user->teamId) {
            $query->where('team_id', $user->team_id ?? $user->teamId);
        }
        
        $transactions = $query->get();
        
        // Calculate ZISWAF total (amount from ZISWAF transactions + amount from QURBAN with ziswaf_program_id)
        $ziswafTotal = $transactions->where('program_type', 'ZISWAF')->sum('amount') +
                      $transactions->where('program_type', 'QURBAN')
                                  ->whereNotNull('ziswaf_program_id')
                                  ->sum('amount');
        
        // Calculate QURBAN total (qurban_amount from QURBAN transactions)
        $qurbanTotal = $transactions->where('program_type', 'QURBAN')->sum('qurban_amount');
        
        // Calculate Volunteer Regulation with proper rates
        $volunteerRegulation = 0;
        foreach ($transactions as $transaction) {
            // For ZISWAF transactions, use volunteer_rate
            if ($transaction->program_type === 'ZISWAF' && $transaction->amount > 0) {
                $volunteerRate = $transaction->volunteer_rate ?? 0;
                $volunteerRegulation += $transaction->amount * ($volunteerRate / 100);
            }
            
            // For QURBAN transactions
            if ($transaction->program_type === 'QURBAN') {
                // QURBAN amount uses volunteer_rate from QURBAN program
                if ($transaction->qurban_amount > 0) {
                    $volunteerRate = $transaction->volunteer_rate ?? 0;
                    $volunteerRegulation += $transaction->qurban_amount * ($volunteerRate / 100);
                }
                
                // ZISWAF amount (when ziswaf_program_id exists) uses ziswaf_volunteer_rate
                if ($transaction->amount > 0 && $transaction->ziswaf_program_id) {
                    $ziswafVolunteerRate = $transaction->ziswaf_volunteer_rate ?? 0;
                    $volunteerRegulation += $transaction->amount * ($ziswafVolunteerRate / 100);
                }
            }
        }
        
        return response()->json([
            'ziswaf_total' => $ziswafTotal,
            'qurban_total' => $qurbanTotal,
            'volunteer_regulation' => $volunteerRegulation,
        ]);
    }

    /**
     * Bulk update transaction status
     */
    public function bulkUpdateStatus(Request $request)
    {
        $request->validate([
            'transaction_ids' => 'required|array',
            'transaction_ids.*' => 'required|exists:transactions,id',
            'status' => 'required|in:pending,valid,double_duta,double_input,not_in_account,other',
        ]);

        try {
            $updatedCount = Transaction::whereIn('id', $request->transaction_ids)
                ->update([
                    'status' => $request->status,
                    'updated_at' => now(),
                ]);

            return response()->json([
                'success' => true,
                'message' => "Status {$updatedCount} transaksi berhasil diubah",
                'updated_count' => $updatedCount
            ]);
        } catch (\Exception $e) {
            \Log::error('Error bulk updating transaction status: ' . $e->getMessage(), [
                'transaction_ids' => $request->transaction_ids,
                'status' => $request->status,
                'stack_trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengubah status transaksi: ' . $e->getMessage()
            ], 500);
        }
    }
}
