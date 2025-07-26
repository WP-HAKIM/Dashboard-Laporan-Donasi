<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Branch;
use App\Models\Team;
use App\Models\Program;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Get dashboard statistics with date filtering
     */
    public function index(Request $request)
    {
        $request->validate([
            'filter_type' => 'in:current_month,one_month_ago,two_months_ago,all,date_range',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $filterType = $request->get('filter_type', 'current_month');
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');

        // Set date range based on filter type
        [$dateStart, $dateEnd] = $this->getDateRange($filterType, $startDate, $endDate);

        // Get transaction statistics
        $transactionStats = $this->getTransactionStats($dateStart, $dateEnd);
        
        // Get user statistics
        $userStats = $this->getUserStats();
        
        // Get branch statistics
        $branchStats = $this->getBranchStats($dateStart, $dateEnd);
        
        // Get program statistics
        $programStats = $this->getProgramStats($dateStart, $dateEnd);
        
        // Get monthly trend (last 6 months)
        $monthlyTrend = $this->getMonthlyTrend();
        
        // Get program trend (last 6 months)
        $programTrend = $this->getProgramTrend();
        
        // Get recent transactions
        $recentTransactions = $this->getRecentTransactions($dateStart, $dateEnd);

        return response()->json([
            'data' => [
                'filter_info' => [
                    'filter_type' => $filterType,
                    'date_start' => $dateStart ? $dateStart->format('Y-m-d') : null,
                    'date_end' => $dateEnd ? $dateEnd->format('Y-m-d') : null,
                ],
                'transaction_stats' => $transactionStats,
                'user_stats' => $userStats,
                'branch_stats' => $branchStats,
                'program_stats' => $programStats,
                'monthly_trend' => $monthlyTrend,
                'program_trend' => $programTrend,
                'recent_transactions' => $recentTransactions,
            ]
        ]);
    }

    /**
     * Get date range based on filter type
     */
    private function getDateRange($filterType, $startDate, $endDate)
    {
        $now = Carbon::now();
        
        switch ($filterType) {
            case 'current_month':
                return [
                    $now->copy()->startOfMonth(),
                    $now->copy()->endOfMonth()
                ];
                
            case 'one_month_ago':
                $oneMonthAgo = $now->copy()->subMonth();
                return [
                    $oneMonthAgo->copy()->startOfMonth(),
                    $oneMonthAgo->copy()->endOfMonth()
                ];
                
            case 'two_months_ago':
                $twoMonthsAgo = $now->copy()->subMonths(2);
                return [
                    $twoMonthsAgo->copy()->startOfMonth(),
                    $twoMonthsAgo->copy()->endOfMonth()
                ];
                
            case 'date_range':
                return [
                    $startDate ? Carbon::parse($startDate)->startOfDay() : null,
                    $endDate ? Carbon::parse($endDate)->endOfDay() : null
                ];
                
            case 'all':
            default:
                return [null, null];
        }
    }

    /**
     * Get transaction statistics
     */
    private function getTransactionStats($dateStart, $dateEnd)
    {
        $query = Transaction::query();
        
        if ($dateStart && $dateEnd) {
            $query->whereBetween('created_at', [$dateStart, $dateEnd]);
        }
        
        $totalTransactions = $query->count();
        $totalAmount = $query->sum('amount');
        $validTransactions = $query->where('status', 'valid')->count();
        $pendingTransactions = $query->where('status', 'pending')->count();
        $rejectedTransactions = $query->whereIn('status', ['double_duta', 'double_input', 'not_in_account', 'other'])->count();
        
        // Status breakdown
        $statusBreakdown = $query->select('status', DB::raw('count(*) as count'), DB::raw('sum(amount) as total_amount'))
            ->groupBy('status')
            ->get()
            ->keyBy('status');

        return [
            'total_transactions' => $totalTransactions,
            'total_amount' => $totalAmount,
            'valid_transactions' => $validTransactions,
            'pending_transactions' => $pendingTransactions,
            'rejected_transactions' => $rejectedTransactions,
            'validation_rate' => $totalTransactions > 0 ? round(($validTransactions / $totalTransactions) * 100, 2) : 0,
            'status_breakdown' => $statusBreakdown,
        ];
    }

    /**
     * Get user statistics
     */
    private function getUserStats()
    {
        $totalUsers = User::count();
        $activeVolunteers = User::where('role', 'VOLUNTEER')->count();
        $admins = User::where('role', 'ADMIN')->count();
        $superAdmins = User::where('role', 'SUPER_ADMIN')->count();
        
        return [
            'total_users' => $totalUsers,
            'active_volunteers' => $activeVolunteers,
            'admins' => $admins,
            'super_admins' => $superAdmins,
        ];
    }

    /**
     * Get branch statistics
     */
    private function getBranchStats($dateStart, $dateEnd)
    {
        $query = Transaction::with('branch')
            ->select('branch_id', DB::raw('count(*) as transaction_count'), DB::raw('sum(amount) as total_amount'))
            ->groupBy('branch_id');
            
        if ($dateStart && $dateEnd) {
            $query->whereBetween('created_at', [$dateStart, $dateEnd]);
        }
        
        $branchStats = $query->get()->map(function ($stat) {
            return [
                'branch_id' => $stat->branch_id,
                'branch_name' => $stat->branch ? $stat->branch->name : 'Unknown',
                'transaction_count' => $stat->transaction_count,
                'total_amount' => $stat->total_amount,
            ];
        });
        
        $totalBranches = Branch::count();
        
        return [
            'total_branches' => $totalBranches,
            'branch_performance' => $branchStats,
        ];
    }

    /**
     * Get program statistics
     */
    private function getProgramStats($dateStart, $dateEnd)
    {
        $query = Transaction::with('program')
            ->select('program_id', DB::raw('count(*) as transaction_count'), DB::raw('sum(amount) as total_amount'))
            ->groupBy('program_id');
            
        if ($dateStart && $dateEnd) {
            $query->whereBetween('created_at', [$dateStart, $dateEnd]);
        }
        
        $programStats = $query->get()->map(function ($stat) {
            return [
                'program_id' => $stat->program_id,
                'program_name' => $stat->program ? $stat->program->name : 'Unknown',
                'transaction_count' => $stat->transaction_count,
                'total_amount' => $stat->total_amount,
            ];
        });
        
        $totalPrograms = Program::count();
        
        return [
            'total_programs' => $totalPrograms,
            'program_performance' => $programStats,
        ];
    }

    /**
     * Get monthly trend for the last 6 months
     */
    private function getMonthlyTrend()
    {
        $sixMonthsAgo = Carbon::now()->subMonths(6)->startOfMonth();
        
        $monthlyData = Transaction::select(
                DB::raw('YEAR(created_at) as year'),
                DB::raw('MONTH(created_at) as month'),
                DB::raw('count(*) as transaction_count'),
                DB::raw('sum(amount) as total_amount')
            )
            ->where('created_at', '>=', $sixMonthsAgo)
            ->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get()
            ->map(function ($data) {
                return [
                    'month' => Carbon::create($data->year, $data->month)->format('M Y'),
                    'transaction_count' => $data->transaction_count,
                    'total_amount' => $data->total_amount,
                ];
            });
            
        return $monthlyData;
    }

    /**
     * Get program trend for the last 6 months
     */
    private function getProgramTrend()
    {
        $sixMonthsAgo = Carbon::now()->subMonths(6)->startOfMonth();
        
        // Get all programs
        $programs = Program::all();
        
        // Get monthly data for each program
        $programTrendData = [];
        
        foreach ($programs as $program) {
            $monthlyData = Transaction::select(
                    DB::raw('YEAR(created_at) as year'),
                    DB::raw('MONTH(created_at) as month'),
                    DB::raw('sum(amount) as total_amount')
                )
                ->where('program_id', $program->id)
                ->where('created_at', '>=', $sixMonthsAgo)
                ->groupBy('year', 'month')
                ->orderBy('year')
                ->orderBy('month')
                ->get();
            
            $programTrendData[] = [
                'program_id' => $program->id,
                'program_name' => $program->name,
                'monthly_data' => $monthlyData->map(function ($data) {
                    return [
                        'month' => Carbon::create($data->year, $data->month)->format('M Y'),
                        'total_amount' => $data->total_amount,
                    ];
                })
            ];
        }
        
        return $programTrendData;
    }

    /**
     * Get recent transactions
     */
    private function getRecentTransactions($dateStart, $dateEnd, $limit = 10)
    {
        $query = Transaction::with(['branch', 'team', 'program', 'volunteer'])
            ->orderBy('created_at', 'desc')
            ->limit($limit);
            
        if ($dateStart && $dateEnd) {
            $query->whereBetween('created_at', [$dateStart, $dateEnd]);
        }
        
        return $query->get()->map(function ($transaction) {
            return [
                'id' => $transaction->id,
                'donor_name' => $transaction->donor_name,
                'amount' => $transaction->amount,
                'status' => $transaction->status,
                'branch_name' => $transaction->branch ? $transaction->branch->name : null,
                'team_name' => $transaction->team ? $transaction->team->name : null,
                'program_name' => $transaction->program ? $transaction->program->name : null,
                'volunteer_name' => $transaction->volunteer ? $transaction->volunteer->name : null,
                'created_at' => $transaction->created_at->format('Y-m-d H:i:s'),
            ];
        });
    }
}