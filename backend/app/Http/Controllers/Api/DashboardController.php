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
            'branch_id' => 'nullable|exists:branches,id',
            'team_id' => 'nullable|exists:teams,id',
            'volunteer_id' => 'nullable|string', // Allow both ID and name
            'program_name' => 'nullable|string',
        ]);

        $filterType = $request->get('filter_type', 'current_month');
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');
        $branchId = $request->get('branch_id');
        $teamId = $request->get('team_id');
        $volunteerId = $request->get('volunteer_id');
        $programName = $request->get('program_name');

        // Set date range based on filter type
        [$dateStart, $dateEnd] = $this->getDateRange($filterType, $startDate, $endDate);
        
        // Create filter array for passing to methods
        $filters = [
            'branch_id' => $branchId,
            'team_id' => $teamId,
            'volunteer_id' => $volunteerId,
            'program_name' => $programName,
        ];

        // Get transaction statistics
        $transactionStats = $this->getTransactionStats($dateStart, $dateEnd, $filters);
        
        // Get user statistics
        $userStats = $this->getUserStats();
        
        // Get branch statistics
        $branchStats = $this->getBranchStats($dateStart, $dateEnd, $filters);
        
        // Get program statistics
        $programStats = $this->getProgramStats($dateStart, $dateEnd, $filters);
        
        // Get volunteer statistics
        $volunteerStats = $this->getVolunteerStats($dateStart, $dateEnd, $filters);
        
        // Get monthly trend (last 6 months)
        $monthlyTrend = $this->getMonthlyTrend($filters);
        
        // Get program trend (last 6 months)
        $programTrend = $this->getProgramTrend();
        
        // Get recent transactions
        $recentTransactions = $this->getRecentTransactions($dateStart, $dateEnd, $filters);

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
                'volunteer_stats' => [
                    'top_volunteers' => $volunteerStats
                ],
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
    private function getTransactionStats($dateStart, $dateEnd, $filters = [])
    {
        $query = Transaction::query();
        
        if ($dateStart && $dateEnd) {
            $query->whereBetween('created_at', [$dateStart, $dateEnd]);
        }
        
        // Apply filters
        if (!empty($filters['branch_id'])) {
            $query->where('branch_id', $filters['branch_id']);
        }
        if (!empty($filters['team_id'])) {
            $query->where('team_id', $filters['team_id']);
        }
        if (!empty($filters['volunteer_id'])) {
            // Check if volunteer_id is numeric (ID) or string (name)
            if (is_numeric($filters['volunteer_id'])) {
                $query->where('volunteer_id', $filters['volunteer_id']);
            } else {
                // Filter by volunteer name
                $query->whereHas('volunteer', function($q) use ($filters) {
                    $q->where('name', $filters['volunteer_id']);
                });
            }
        }
        if (!empty($filters['program_name'])) {
            $query->whereHas('program', function($q) use ($filters) {
                $q->where('name', $filters['program_name']);
            });
        }
        
        $totalTransactions = $query->count();
        // Only count validated transactions for total amount (amount + qurban_amount)
        $totalAmount = (clone $query)->where('status', 'valid')->sum(DB::raw('COALESCE(amount, 0) + COALESCE(qurban_amount, 0)'));
        
        // Get ZISWAF and QURBAN amounts (only from validated transactions)
        $ziswaFAmount = (clone $query)->where('status', 'valid')->sum('amount');
        
        $qurbanAmount = (clone $query)->where('status', 'valid')->whereHas('program', function($q) {
            $q->where('type', 'QURBAN');
        })->sum('qurban_amount');
        
        $validTransactions = (clone $query)->where('status', 'valid')->count();
        $pendingTransactions = (clone $query)->where('status', 'pending')->count();
        $rejectedTransactions = (clone $query)->whereIn('status', ['double_duta', 'double_input', 'not_in_account', 'other'])->count();
        
        // Status breakdown
        $statusBreakdown = (clone $query)->select('status', DB::raw('count(*) as count'), DB::raw('sum(amount) as total_amount'))
            ->groupBy('status')
            ->get()
            ->keyBy('status');

        return [
            'total_transactions' => $totalTransactions,
            'total_amount' => $totalAmount,
            'ziswaf_amount' => $ziswaFAmount,
            'qurban_amount' => $qurbanAmount,
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
    private function getBranchStats($dateStart, $dateEnd, $filters = [])
    {
        $query = Transaction::with('branch')
            ->select('branch_id', DB::raw('count(*) as transaction_count'), DB::raw('sum(COALESCE(amount, 0) + COALESCE(qurban_amount, 0)) as total_amount'))
            ->where('status', 'valid') // Only include validated transactions
            ->groupBy('branch_id');
            
        if ($dateStart && $dateEnd) {
            $query->whereBetween('created_at', [$dateStart, $dateEnd]);
        }
        
        // Apply filters
        if (!empty($filters['branch_id'])) {
            $query->where('branch_id', $filters['branch_id']);
        }
        if (!empty($filters['team_id'])) {
            $query->where('team_id', $filters['team_id']);
        }
        if (!empty($filters['volunteer_id'])) {
            // Check if volunteer_id is numeric (ID) or string (name)
            if (is_numeric($filters['volunteer_id'])) {
                $query->where('volunteer_id', $filters['volunteer_id']);
            } else {
                // Filter by volunteer name
                $query->whereHas('volunteer', function($q) use ($filters) {
                    $q->where('name', $filters['volunteer_id']);
                });
            }
        }
        if (!empty($filters['program_name'])) {
            $query->whereHas('program', function($q) use ($filters) {
                $q->where('name', $filters['program_name']);
            });
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
    private function getProgramStats($dateStart, $dateEnd, $filters = [])
    {
        $query = Transaction::with('program')
            ->select('program_id', 'program.type as program_type', DB::raw('count(*) as transaction_count'), DB::raw('sum(COALESCE(transactions.amount, 0) + COALESCE(transactions.qurban_amount, 0)) as total_amount'))
            ->join('programs as program', 'transactions.program_id', '=', 'program.id')
            ->where('transactions.status', 'valid') // Only include validated transactions
            ->groupBy('program_id', 'program.type');
            
        if ($dateStart && $dateEnd) {
            $query->whereBetween('transactions.created_at', [$dateStart, $dateEnd]);
        }
        
        // Apply filters
        if (!empty($filters['branch_id'])) {
            $query->where('transactions.branch_id', $filters['branch_id']);
        }
        if (!empty($filters['team_id'])) {
            $query->where('transactions.team_id', $filters['team_id']);
        }
        if (!empty($filters['volunteer_id'])) {
            // Check if volunteer_id is numeric (ID) or string (name)
            if (is_numeric($filters['volunteer_id'])) {
                $query->where('transactions.volunteer_id', $filters['volunteer_id']);
            } else {
                // Filter by volunteer name
                $query->whereHas('volunteer', function($q) use ($filters) {
                    $q->where('name', $filters['volunteer_id']);
                });
            }
        }
        if (!empty($filters['program_name'])) {
            $query->where('program.name', $filters['program_name']);
        }
        
        $programStats = $query->get()->map(function ($stat) {
            return [
                'program_id' => $stat->program_id,
                'program_name' => $stat->program ? $stat->program->name : 'Unknown',
                'program_type' => $stat->program_type,
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
     * Get volunteer statistics
     */
    private function getVolunteerStats($dateStart, $dateEnd, $filters = [])
    {
        $query = Transaction::with(['volunteer', 'program'])
            ->select(
                'volunteer_id', 
                DB::raw('count(*) as transaction_count'), 
                DB::raw('sum(COALESCE(transactions.amount, 0) + COALESCE(transactions.qurban_amount, 0)) as total_amount'),
                DB::raw('sum(transactions.amount) as ziswaf_amount'),
                DB::raw('sum(case when programs.type = "QURBAN" then transactions.qurban_amount else 0 end) as qurban_amount')
            )
            ->join('programs', 'transactions.program_id', '=', 'programs.id')
            ->whereNotNull('volunteer_id')
            ->where('transactions.status', 'valid') // Only include valid transactions for top volunteers
            ->groupBy('volunteer_id');
            
        if ($dateStart && $dateEnd) {
            $query->whereBetween('transactions.created_at', [$dateStart, $dateEnd]);
        }
        
        // Apply filters
        if (!empty($filters['branch_id'])) {
            $query->where('transactions.branch_id', $filters['branch_id']);
        }
        if (!empty($filters['team_id'])) {
            $query->where('transactions.team_id', $filters['team_id']);
        }
        if (!empty($filters['volunteer_id'])) {
            // Check if volunteer_id is numeric (ID) or string (name)
            if (is_numeric($filters['volunteer_id'])) {
                $query->where('transactions.volunteer_id', $filters['volunteer_id']);
            } else {
                // Filter by volunteer name
                $query->whereHas('volunteer', function($q) use ($filters) {
                    $q->where('name', $filters['volunteer_id']);
                });
            }
        }
        if (!empty($filters['program_name'])) {
            $query->where('programs.name', $filters['program_name']);
        }
        
        $volunteerStats = $query->orderBy('total_amount', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($stat) {
                return [
                    'volunteer_id' => $stat->volunteer_id,
                    'volunteer_name' => $stat->volunteer ? $stat->volunteer->name : 'Unknown',
                    'transaction_count' => $stat->transaction_count,
                    'total_amount' => $stat->total_amount,
                    'ziswaf_amount' => $stat->ziswaf_amount,
                    'qurban_amount' => $stat->qurban_amount,
                ];
            });
        
        return $volunteerStats;
    }

    /**
     * Get monthly trend for the last 6 months
     */
    private function getMonthlyTrend($filters = [])
    {
        $sixMonthsAgo = Carbon::now()->subMonths(6)->startOfMonth();
        
        $query = Transaction::select(
                DB::raw('YEAR(transactions.created_at) as year'),
                DB::raw('MONTH(transactions.created_at) as month'),
                DB::raw('count(*) as transaction_count'),
                DB::raw('sum(COALESCE(transactions.amount, 0) + COALESCE(transactions.qurban_amount, 0)) as total_amount'),
                DB::raw('sum(transactions.amount) as ziswaf_amount'),
                DB::raw('sum(case when programs.type = "QURBAN" then transactions.qurban_amount else 0 end) as qurban_amount')
            )
            ->join('programs', 'transactions.program_id', '=', 'programs.id')
            ->where('transactions.created_at', '>=', $sixMonthsAgo)
            ->where('transactions.status', 'valid'); // Only include validated transactions
            
        // Apply filters
        if (!empty($filters['branch_id'])) {
            $query->where('transactions.branch_id', $filters['branch_id']);
        }
        if (!empty($filters['team_id'])) {
            $query->where('transactions.team_id', $filters['team_id']);
        }
        if (!empty($filters['volunteer_id'])) {
            // Check if volunteer_id is numeric (ID) or string (name)
            if (is_numeric($filters['volunteer_id'])) {
                $query->where('transactions.volunteer_id', $filters['volunteer_id']);
            } else {
                // Filter by volunteer name
                $query->whereHas('volunteer', function($q) use ($filters) {
                    $q->where('name', $filters['volunteer_id']);
                });
            }
        }
        if (!empty($filters['program_name'])) {
            $query->where('programs.name', $filters['program_name']);
        }
            
        $monthlyData = $query->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get()
            ->map(function ($data) {
                return [
                    'month' => Carbon::create($data->year, $data->month)->format('M Y'),
                    'transaction_count' => $data->transaction_count,
                    'total_amount' => $data->total_amount,
                    'ziswaf_amount' => $data->ziswaf_amount,
                    'qurban_amount' => $data->qurban_amount,
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
                    DB::raw('sum(COALESCE(amount, 0) + COALESCE(qurban_amount, 0)) as total_amount')
                )
                ->where('program_id', $program->id)
                ->where('created_at', '>=', $sixMonthsAgo)
                ->where('status', 'valid') // Only include validated transactions
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
    private function getRecentTransactions($dateStart, $dateEnd, $filters = [], $limit = 10)
    {
        $query = Transaction::with(['branch', 'team', 'program', 'volunteer'])
            ->orderBy('created_at', 'desc')
            ->limit($limit);
            
        if ($dateStart && $dateEnd) {
            $query->whereBetween('created_at', [$dateStart, $dateEnd]);
        }
        
        // Apply filters
        if (!empty($filters['branch_id'])) {
            $query->where('branch_id', $filters['branch_id']);
        }
        if (!empty($filters['team_id'])) {
            $query->where('team_id', $filters['team_id']);
        }
        if (!empty($filters['volunteer_id'])) {
            $query->where('volunteer_id', $filters['volunteer_id']);
        }
        if (!empty($filters['program_name'])) {
            $query->whereHas('program', function($q) use ($filters) {
                $q->where('name', $filters['program_name']);
            });
        }
        
        return $query->get()->map(function ($transaction) {
            return [
                'id' => $transaction->id,
                'donor_name' => $transaction->donor_name,
                'amount' => ($transaction->amount ?? 0) + ($transaction->qurban_amount ?? 0),
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