import React from 'react';
import { 
  TrendingUp, 
  Users, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Award,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.tsx';
import { useDashboard } from '../../hooks/useDashboard';
import DashboardFilter from './DashboardFilter';
import ProgramTrendChart from './ProgramTrendChart';
import Loader from '../Common/Loader';

export default function DashboardView() {
  const { user } = useAuth();
  const { 
    dashboardData, 
    isLoading, 
    error, 
    currentFilter, 
    updateFilter, 
    refreshData 
  } = useDashboard();

  if (isLoading) {
    return <Loader text="Memuat Data Dashboard" size="medium" />;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return <Loader text="Memuat Data Dashboard" size="medium" />;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '-';
      }
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return '-';
    }
  };

  const stats = [
    {
      title: 'Total Donasi Tervalidasi',
      value: formatCurrency(dashboardData.transaction_stats.total_amount),
      icon: DollarSign,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Transaksi Tervalidasi',
      value: dashboardData.transaction_stats.valid_transactions.toString(),
      icon: CheckCircle,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Menunggu Validasi',
      value: dashboardData.transaction_stats.pending_transactions.toString(),
      icon: Clock,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Total Transaksi',
      value: dashboardData.transaction_stats.total_transactions.toString(),
      icon: TrendingUp,
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    }
  ];

  const programStats = dashboardData.program_stats.program_performance;
  const branchStats = dashboardData.branch_stats.branch_performance;

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Selamat datang, {user?.name}! Berikut ringkasan aktivitas donasi.
            </p>
          </div>
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Dashboard Filter */}
      <DashboardFilter
        currentFilter={currentFilter}
        onFilterChange={updateFilter}
        isLoading={isLoading}
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.textColor} mt-2`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-full`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Program Statistics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Perolehan per Program</h2>
          <div className="space-y-4">
            {programStats.map((program, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{program.program_name}</h3>
                  <p className="text-sm text-gray-600">{program.transaction_count} transaksi</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">{formatCurrency(program.total_amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Branch Statistics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Perolehan per Cabang</h2>
          <div className="space-y-4">
            {branchStats.map((branch, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{branch.branch_name}</h3>
                  <p className="text-sm text-gray-600">{branch.transaction_count} transaksi</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{formatCurrency(branch.total_amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <div className="mt-8">
        <ProgramTrendChart data={dashboardData.program_trend} />
      </div>

      {/* Recent Transactions */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Transaksi Terbaru</h2>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Donatur</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Program</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Nominal</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.recent_transactions.map((transaction) => {
                return (
                  <tr key={transaction.id} className="border-b border-gray-100">
                    <td className="py-3 px-4">{transaction.donor_name}</td>
                    <td className="py-3 px-4">{transaction.program_name || '-'}</td>
                    <td className="py-3 px-4 font-medium">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.status === 'valid' 
                          ? 'bg-green-100 text-green-800'
                          : transaction.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.status === 'valid' ? 'Tervalidasi' : 
                         transaction.status === 'pending' ? 'Menunggu' : 'Ditolak'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {formatDate(transaction.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile/Tablet Card View */}
        <div className="lg:hidden">
          {dashboardData.recent_transactions.map((transaction) => (
            <div key={transaction.id} className="border-b border-gray-100 p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">{transaction.donor_name}</h3>
                  <p className="text-sm text-gray-600">{transaction.program_name || '-'}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  transaction.status === 'valid' 
                    ? 'bg-green-100 text-green-800'
                    : transaction.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {transaction.status === 'valid' ? 'Tervalidasi' : 
                   transaction.status === 'pending' ? 'Menunggu' : 'Ditolak'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="font-medium text-green-600">
                  {formatCurrency(transaction.amount)}
                </div>
                <div className="text-sm text-gray-500">
                  {formatDate(transaction.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {dashboardData.recent_transactions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Tidak ada transaksi terbaru</p>
          </div>
        )}
      </div>
    </div>
  );
}