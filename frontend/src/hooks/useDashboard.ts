import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';

export interface DashboardFilterType {
  filter_type: 'current_month' | 'one_month_ago' | 'two_months_ago' | 'all' | 'date_range';
  start_date?: string;
  end_date?: string;
  branch_id?: string;
  team_id?: string;
  volunteer_id?: string;
  program_name?: string;
}

export interface TransactionStats {
  total_transactions: number;
  total_amount: number;
  valid_transactions: number;
  pending_transactions: number;
  rejected_transactions: number;
  validation_rate: number;
  status_breakdown: Record<string, { count: number; total_amount: number }>;
}

export interface UserStats {
  total_users: number;
  active_volunteers: number;
  admins: number;
  super_admins: number;
}

export interface BranchPerformance {
  branch_id: number;
  branch_name: string;
  transaction_count: number;
  total_amount: number;
}

export interface BranchStats {
  total_branches: number;
  branch_performance: BranchPerformance[];
}

export interface ProgramPerformance {
  program_id: number;
  program_name: string;
  program_type: string;
  transaction_count: number;
  total_amount: number;
}

export interface ProgramStats {
  total_programs: number;
  program_performance: ProgramPerformance[];
}

export interface MonthlyTrend {
  month: string;
  transaction_count: number;
  total_amount: number;
  ziswaf_amount?: number;
  qurban_amount?: number;
}

export interface VolunteerPerformance {
  volunteer_id: number;
  volunteer_name: string;
  transaction_count: number;
  total_amount: number;
}

export interface VolunteerStats {
  top_volunteers: VolunteerPerformance[];
}

export interface ProgramMonthlyData {
  month: string;
  total_amount: number;
}

export interface ProgramTrend {
  program_id: number;
  program_name: string;
  monthly_data: ProgramMonthlyData[];
}

export interface RecentTransaction {
  id: number;
  donor_name: string;
  amount: number;
  status: string;
  branch_name: string | null;
  team_name: string | null;
  program_name: string | null;
  volunteer_name: string | null;
  created_at: string;
}

export interface DashboardData {
  filter_info: {
    filter_type: string;
    date_start: string | null;
    date_end: string | null;
  };
  transaction_stats: TransactionStats;
  user_stats: UserStats;
  branch_stats: BranchStats;
  program_stats: ProgramStats;
  volunteer_stats?: VolunteerStats;
  monthly_trend: MonthlyTrend[];
  program_trend: ProgramTrend[];
  recent_transactions: RecentTransaction[];
}

export interface DashboardResponse {
  data: DashboardData;
}

export function useDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<DashboardFilterType>({
    filter_type: 'current_month'
  });

  const fetchDashboardData = async (filter?: DashboardFilterType) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const filterToUse = filter || currentFilter;
      
      // Prepare parameters for API call
      const apiParams: any = {
        filter_type: filterToUse.filter_type
      };
      
      if (filterToUse.filter_type === 'date_range') {
        if (filterToUse.start_date) {
          apiParams.start_date = filterToUse.start_date;
        }
        if (filterToUse.end_date) {
          apiParams.end_date = filterToUse.end_date;
        }
      }
      
      // Add filter parameters
      if (filterToUse.branch_id) {
        apiParams.branch_id = filterToUse.branch_id;
      }
      if (filterToUse.team_id) {
        apiParams.team_id = filterToUse.team_id;
      }
      if (filterToUse.volunteer_id) {
        apiParams.volunteer_id = filterToUse.volunteer_id;
      }
      if (filterToUse.program_name) {
        apiParams.program_name = filterToUse.program_name; // Backend expects program_name
      }
      
      console.log('Sending dashboard API request with params:', apiParams);
      
      const response = await dashboardAPI.getData(apiParams);
      
      if (response && response.data) {
          setDashboardData(response.data);
          setCurrentFilter(filterToUse);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || err.message || 'Gagal memuat data dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFilter = async (newFilter: DashboardFilterType) => {
    await fetchDashboardData(newFilter);
  };

  const refreshData = async () => {
    await fetchDashboardData();
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    dashboardData,
    isLoading,
    error,
    currentFilter,
    updateFilter,
    refreshData,
    fetchDashboardData
  };
}