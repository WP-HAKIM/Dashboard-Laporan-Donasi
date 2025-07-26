import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';

export interface DashboardFilterType {
  filter_type: 'current_month' | 'one_month_ago' | 'two_months_ago' | 'all' | 'date_range';
  start_date?: string;
  end_date?: string;
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
      const params = new URLSearchParams();
      
      params.append('filter_type', filterToUse.filter_type);
      
      if (filterToUse.filter_type === 'date_range') {
        if (filterToUse.start_date) {
          params.append('start_date', filterToUse.start_date);
        }
        if (filterToUse.end_date) {
          params.append('end_date', filterToUse.end_date);
        }
      }
      
      const response = await dashboardAPI.getData({
         filter_type: filterToUse.filter_type,
         start_date: filterToUse.start_date,
         end_date: filterToUse.end_date
       });
      
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