import React from 'react';
import { 
  TrendingUp, 
  Users, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Award,
  Loader
} from 'lucide-react';
import { useAuthContext } from '../../hooks/useAuth.tsx';
import { useTransactions } from '../../hooks/useTransactions';
import { useBranches } from '../../hooks/useBranches';
import { usePrograms } from '../../hooks/usePrograms';

export default function DashboardView() {
  const { user } = useAuthContext();
  const { transactions, isLoading: transactionsLoading, error: transactionsError } = useTransactions();
  const { branches, isLoading: branchesLoading } = useBranches();
  const { programs, isLoading: programsLoading } = usePrograms();

  const isLoading = transactionsLoading || branchesLoading || programsLoading;

  if (isLoading) {
    return <Loader />;
  }

  if (transactionsError) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-500">Error: {transactionsError}</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalTransactions = transactions.length;
  const validatedTransactions = transactions.filter(t => t.status === 'valid').length;
  const pendingTransactions = transactions.filter(t => t.status === 'pending').length;
  const totalAmount = transactions
    .filter(t => t.status === 'valid')
    .reduce((sum, t) => sum + t.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const stats = [
    {
      title: 'Total Donasi Tervalidasi',
      value: formatCurrency(totalAmount),
      icon: DollarSign,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Transaksi Tervalidasi',
      value: validatedTransactions.toString(),
      icon: CheckCircle,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Menunggu Validasi',
      value: pendingTransactions.toString(),
      icon: Clock,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Total Transaksi',
      value: totalTransactions.toString(),
      icon: TrendingUp,
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    }
  ];

  const programStats = programs.map(program => {
    const programTransactions = transactions.filter(t => t.programId === program.id);
    const validAmount = programTransactions
      .filter(t => t.status === 'valid')
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      name: program.name,
      amount: validAmount,
      count: programTransactions.length
    };
  });

  const branchStats = branches.map(branch => {
    const branchTransactions = transactions.filter(t => t.branchId === branch.id);
    const validAmount = branchTransactions
      .filter(t => t.status === 'valid')
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      name: branch.name,
      amount: validAmount,
      count: branchTransactions.length
    };
  });

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Selamat datang, {user?.name}! Berikut ringkasan aktivitas donasi.
        </p>
      </div>

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
                  <h3 className="font-medium text-gray-900">{program.name}</h3>
                  <p className="text-sm text-gray-600">{program.count} transaksi</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">{formatCurrency(program.amount)}</p>
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
                  <h3 className="font-medium text-gray-900">{branch.name}</h3>
                  <p className="text-sm text-gray-600">{branch.count} transaksi</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{formatCurrency(branch.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Transaksi Terbaru</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Donatur</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Program</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Nominal</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 5).map((transaction) => {
                const program = programs.find(p => p.id === transaction.programId);
                return (
                  <tr key={transaction.id} className="border-b border-gray-100">
                    <td className="py-3 px-4">{transaction.donorName}</td>
                    <td className="py-3 px-4">{program?.name}</td>
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
                      {new Date(transaction.createdAt).toLocaleDateString('id-ID')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}