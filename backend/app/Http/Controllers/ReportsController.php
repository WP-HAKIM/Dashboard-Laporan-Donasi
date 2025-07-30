<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Branch;
use App\Models\User;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ReportsController extends Controller
{
    /**
     * Get branch reports with transaction statistics
     */
    public function getBranchReports(Request $request): JsonResponse
    {
        try {
            $dateFrom = $request->get('dateFrom');
            $dateTo = $request->get('dateTo');
            $datePreset = $request->get('datePreset');
            
            // Handle date preset filters
            if ($datePreset && !$dateFrom && !$dateTo) {
                $dateRange = $this->getDateRangeFromPreset($datePreset);
                $dateFrom = $dateRange['start'];
                $dateTo = $dateRange['end'];
            }

            $query = Branch::select([
                'branches.id',
                'branches.name',
                'branches.code',
                DB::raw('COALESCE(SUM(COALESCE(transactions.amount, 0) + COALESCE(transactions.qurban_amount, 0)), 0) as total_donations'),
                DB::raw('COALESCE(SUM((COALESCE(transactions.amount, 0) + COALESCE(transactions.qurban_amount, 0)) * COALESCE(transactions.branch_rate, 0) / 100), 0) as total_regular_donations'),
                DB::raw('COUNT(transactions.id) as total_transactions'),
                DB::raw('COUNT(CASE WHEN transactions.status = "valid" THEN 1 END) as validated_transactions'),
                DB::raw('COUNT(CASE WHEN transactions.status = "pending" THEN 1 END) as pending_transactions'),
                DB::raw('COUNT(CASE WHEN transactions.status = "rejected" THEN 1 END) as rejected_transactions'),
                DB::raw('COUNT(CASE WHEN transactions.status = "failed" THEN 1 END) as failed_transactions')
            ])
            ->leftJoin('transactions', 'branches.id', '=', 'transactions.branch_id')
            ->leftJoin('programs', 'transactions.program_id', '=', 'programs.id');

            // Apply date filters if provided
            if ($dateFrom) {
                $query->where('transactions.created_at', '>=', $dateFrom);
            }
            if ($dateTo) {
                $query->where('transactions.created_at', '<=', $dateTo);
            }

            $branchReports = $query
                ->groupBy('branches.id', 'branches.name', 'branches.code')
                ->orderBy('total_donations', 'desc')
                ->get()
                ->map(function ($branch) {
                    return [
                        'id' => (string) $branch->id,
                        'name' => $branch->name,
                        'code' => $branch->code,
                        'totalDonations' => (float) $branch->total_donations,
                        'totalRegularDonations' => (float) $branch->total_regular_donations,
                        'totalTransactions' => (int) $branch->total_transactions,
                        'validatedTransactions' => (int) $branch->validated_transactions,
                        'pendingTransactions' => (int) $branch->pending_transactions,
                        'rejectedTransactions' => (int) $branch->rejected_transactions,
                        'failedTransactions' => (int) $branch->failed_transactions,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $branchReports
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil laporan cabang: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get volunteer reports with transaction statistics
     */
    public function getVolunteerReports(Request $request): JsonResponse
    {
        try {
            $dateFrom = $request->get('dateFrom');
            $dateTo = $request->get('dateTo');
            $datePreset = $request->get('datePreset');
            $branchId = $request->get('branch_id');
            
            // Handle date preset filters
            if ($datePreset && !$dateFrom && !$dateTo) {
                $dateRange = $this->getDateRangeFromPreset($datePreset);
                $dateFrom = $dateRange['start'];
                $dateTo = $dateRange['end'];
            }

            $query = User::select([
                'users.id',
                'users.name',
                'teams.name as team_name',
                'branches.name as branch_name',
                DB::raw('COALESCE(SUM(COALESCE(transactions.amount, 0) + COALESCE(transactions.qurban_amount, 0)), 0) as total_donations'),
                DB::raw('COALESCE(SUM((COALESCE(transactions.amount, 0) + COALESCE(transactions.qurban_amount, 0)) * COALESCE(transactions.volunteer_rate, 0) / 100), 0) as total_regular_donations'),
                DB::raw('COUNT(transactions.id) as total_transactions'),
                DB::raw('COUNT(CASE WHEN transactions.status = "valid" THEN 1 END) as validated_transactions'),
                DB::raw('COUNT(CASE WHEN transactions.status = "pending" THEN 1 END) as pending_transactions')
            ])
            ->where('users.role', 'volunteer')
            ->leftJoin('teams', 'users.team_id', '=', 'teams.id')
            ->leftJoin('branches', 'users.branch_id', '=', 'branches.id')
            ->leftJoin('transactions', 'users.id', '=', 'transactions.volunteer_id')
            ->leftJoin('programs', 'transactions.program_id', '=', 'programs.id');

            // Apply date filters if provided
            if ($dateFrom) {
                $query->where('transactions.created_at', '>=', $dateFrom);
            }
            if ($dateTo) {
                $query->where('transactions.created_at', '<=', $dateTo);
            }

            // Apply branch filter if provided
            if ($branchId) {
                $query->where('users.branch_id', $branchId);
            }

            $volunteerReports = $query
                ->groupBy('users.id', 'users.name', 'teams.name', 'branches.name')
                ->orderBy('total_donations', 'desc')
                ->get()
                ->map(function ($volunteer) {
                    return [
                        'id' => (string) $volunteer->id,
                        'name' => $volunteer->name,
                        'teamName' => $volunteer->team_name ?? '-',
                        'branchName' => $volunteer->branch_name ?? '-',
                        'totalDonations' => (float) $volunteer->total_donations,
                        'totalRegularDonations' => (float) $volunteer->total_regular_donations,
                        'totalTransactions' => (int) $volunteer->total_transactions,
                        'validatedTransactions' => (int) $volunteer->validated_transactions,
                        'pendingTransactions' => (int) $volunteer->pending_transactions,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $volunteerReports
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil laporan relawan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get detailed branch report with team breakdown
     */
    public function getBranchDetailReport(Request $request, $branchId): JsonResponse
    {
        try {
            $dateFrom = $request->get('date_from');
            $dateTo = $request->get('date_to');

            // Get branch info
            $branch = Branch::findOrFail($branchId);

            // Get team statistics for this branch
            $teamQuery = DB::table('teams')
                ->select([
                    'teams.id',
                    'teams.name',
                    'teams.code',
                    DB::raw('COALESCE(SUM(COALESCE(transactions.amount, 0) + COALESCE(transactions.qurban_amount, 0)), 0) as total_donations'),
                    DB::raw('COUNT(transactions.id) as total_transactions'),
                    DB::raw('COUNT(CASE WHEN transactions.status = "valid" THEN 1 END) as validated_transactions'),
                    DB::raw('COUNT(CASE WHEN transactions.status = "pending" THEN 1 END) as pending_transactions')
                ])
                ->where('teams.branch_id', $branchId)
                ->leftJoin('transactions', 'teams.id', '=', 'transactions.team_id');

            // Apply date filters if provided
            if ($dateFrom) {
                $teamQuery->where('transactions.created_at', '>=', $dateFrom);
            }
            if ($dateTo) {
                $teamQuery->where('transactions.created_at', '<=', $dateTo);
            }

            $teamStats = $teamQuery
                ->groupBy('teams.id', 'teams.name', 'teams.code')
                ->orderBy('total_donations', 'desc')
                ->get()
                ->map(function ($team) {
                    return [
                        'id' => (string) $team->id,
                        'name' => $team->name,
                        'code' => $team->code,
                        'totalDonations' => (float) $team->total_donations,
                        'totalTransactions' => (int) $team->total_transactions,
                        'validatedTransactions' => (int) $team->validated_transactions,
                        'pendingTransactions' => (int) $team->pending_transactions,
                    ];
                });

            // Get overall branch statistics
            $branchStatsQuery = Transaction::where('branch_id', $branchId);
            
            if ($dateFrom) {
                $branchStatsQuery->where('created_at', '>=', $dateFrom);
            }
            if ($dateTo) {
                $branchStatsQuery->where('created_at', '<=', $dateTo);
            }

            $branchStats = [
                'totalDonations' => $branchStatsQuery->selectRaw('SUM(COALESCE(amount, 0) + COALESCE(qurban_amount, 0)) as total')->value('total') ?? 0,
                'totalTransactions' => $branchStatsQuery->count(),
                'validatedTransactions' => $branchStatsQuery->where('status', 'valid')->count(),
                'pendingTransactions' => $branchStatsQuery->where('status', 'pending')->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'branch' => [
                        'id' => (string) $branch->id,
                        'name' => $branch->name,
                        'code' => $branch->code,
                        'address' => $branch->address,
                    ],
                    'statistics' => $branchStats,
                    'teams' => $teamStats
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil detail laporan cabang: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get summary statistics for all reports
     */
    public function getSummaryStats(Request $request): JsonResponse
    {
        try {
            $dateFrom = $request->get('date_from');
            $dateTo = $request->get('date_to');

            $transactionQuery = Transaction::query();
            
            if ($dateFrom) {
                $transactionQuery->where('created_at', '>=', $dateFrom);
            }
            if ($dateTo) {
                $transactionQuery->where('created_at', '<=', $dateTo);
            }

            $stats = [
                'totalBranches' => Branch::count(),
                'totalVolunteers' => User::where('role', 'volunteer')->count(),
                'totalDonations' => $transactionQuery->selectRaw('SUM(COALESCE(amount, 0) + COALESCE(qurban_amount, 0)) as total')->value('total') ?? 0,
                'totalTransactions' => $transactionQuery->count(),
                'validatedTransactions' => $transactionQuery->where('status', 'valid')->count(),
                'pendingTransactions' => $transactionQuery->where('status', 'pending')->count(),
                'rejectedTransactions' => $transactionQuery->whereIn('status', [
                    'double_duta', 'double_input', 'not_in_account', 'other'
                ])->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil statistik: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get date range from preset
     */
    private function getDateRangeFromPreset($preset)
    {
        $now = now();
        
        switch ($preset) {
             case 'current_month':
                 return [
                     'start' => $now->startOfMonth()->format('Y-m-d'),
                     'end' => $now->endOfMonth()->format('Y-m-d')
                 ];
             
             case 'last_month':
             case '1_month_back':
                 $lastMonth = $now->copy()->subMonth();
                 return [
                     'start' => $lastMonth->startOfMonth()->format('Y-m-d'),
                     'end' => $lastMonth->endOfMonth()->format('Y-m-d')
                 ];
             
             case 'two_months_ago':
             case '2_months_back':
                 $twoMonthsAgo = $now->copy()->subMonths(2);
                 return [
                     'start' => $twoMonthsAgo->startOfMonth()->format('Y-m-d'),
                     'end' => $twoMonthsAgo->endOfMonth()->format('Y-m-d')
                 ];
             
             case 'all_data':
             default:
                 return [
                     'start' => null,
                     'end' => null
                 ];
         }
    }
}