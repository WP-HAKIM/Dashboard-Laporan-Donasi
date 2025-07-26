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
        $query = Transaction::with(['branch', 'team', 'volunteer', 'program', 'validator']);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

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

        // Filter by program type
        if ($request->has('program_type')) {
            $query->where('program_type', $request->program_type);
        }

        // Filter by date range
        if ($request->has('date_from')) {
            $query->whereDate('transaction_date', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('transaction_date', '<=', $request->date_to);
        }

        // Filter by date preset (current month, 1 month back, 2 months back)
        if ($request->has('date_preset')) {
            switch ($request->date_preset) {
                case 'current_month':
                    $query->whereMonth('transaction_date', now()->month)
                          ->whereYear('transaction_date', now()->year);
                    break;
                case '1_month_back':
                    $startDate = now()->subMonth()->startOfMonth();
                    $endDate = now()->subMonth()->endOfMonth();
                    $query->whereBetween('transaction_date', [$startDate, $endDate]);
                    break;
                case '2_months_back':
                    $startDate = now()->subMonths(2)->startOfMonth();
                    $endDate = now()->subMonths(2)->endOfMonth();
                    $query->whereBetween('transaction_date', [$startDate, $endDate]);
                    break;
                case 'last_3_months':
                    $startDate = now()->subMonths(2)->startOfMonth();
                    $endDate = now()->endOfMonth();
                    $query->whereBetween('transaction_date', [$startDate, $endDate]);
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
        $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'team_id' => 'required|exists:teams,id',
            'volunteer_id' => 'required|exists:users,id',
            'program_type' => 'required|in:ZISWAF,QURBAN',
            'program_id' => 'required|exists:programs,id',
            'donor_name' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'transaction_date' => 'required|date',
            'transfer_method' => 'required|string|max:255',
            'proof_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

        $data = $request->all();

        // Get program rates
        $program = Program::find($request->program_id);
        if ($program) {
            $data['volunteer_rate'] = $program->volunteer_rate;
            $data['branch_rate'] = $program->branch_rate;
        }

        // Handle file upload
        if ($request->hasFile('proof_image')) {
            $path = $request->file('proof_image')->store('transaction-proofs', 'public');
            $data['proof_image'] = $path;
        }

        $transaction = Transaction::create($data);
        return response()->json($transaction->load(['branch', 'team', 'volunteer', 'program']), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Transaction $transaction)
    {
        return response()->json($transaction->load(['branch', 'team', 'volunteer', 'program', 'validator']));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Transaction $transaction)
    {
        $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'team_id' => 'required|exists:teams,id',
            'volunteer_id' => 'required|exists:users,id',
            'program_type' => 'required|in:ZISWAF,QURBAN',
            'program_id' => 'required|exists:programs,id',
            'donor_name' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'transaction_date' => 'required|date',
            'transfer_method' => 'required|string|max:255',
            'proof_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

        $data = $request->all();

        // Get program rates if program_id is being updated
        if ($request->has('program_id')) {
            $program = Program::find($request->program_id);
            if ($program) {
                $data['volunteer_rate'] = $program->volunteer_rate;
                $data['branch_rate'] = $program->branch_rate;
            }
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
        return response()->json($transaction->load(['branch', 'team', 'volunteer', 'program', 'validator']));
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

        return response()->json($transaction->load(['branch', 'team', 'volunteer', 'program', 'validator']));
    }

    /**
     * Get transactions by current user (volunteer)
     */
    public function myTransactions(Request $request)
    {
        $transactions = Transaction::with(['branch', 'team', 'volunteer', 'program', 'validator'])
            ->where('volunteer_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($transactions);
    }

    /**
     * Get pending transactions for validation
     */
    public function pending(Request $request)
    {
        $query = Transaction::with(['branch', 'team', 'volunteer', 'program'])
            ->where('status', 'pending');

        // If user is branch role, only show transactions from their branch
        if ($request->user()->role === 'branch' && $request->user()->branch_id) {
            $query->where('branch_id', $request->user()->branch_id);
        }

        $transactions = $query->orderBy('created_at', 'asc')->paginate(20);
        return response()->json($transactions);
    }
}
