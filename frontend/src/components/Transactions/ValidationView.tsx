import React, { useState } from 'react';
import { Filter, CheckCircle, RefreshCw, Edit, X, AlertTriangle, Eye, Loader } from 'lucide-react';
import { Transaction } from '../../types';
import { useTransactions } from '../../hooks/useTransactions';
import { useBranches } from '../../hooks/useBranches';
import { useTeams } from '../../hooks/useTeams';
import { usePrograms } from '../../hooks/usePrograms';

export default function ValidationView() {
  const { transactions, isLoading, error, updateTransaction } = useTransactions();
  const { branches } = useBranches();
  const { teams } = useTeams();
  const { programs } = usePrograms();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [validationAction, setValidationAction] = useState<string>('');
  const [validationReason, setValidationReason] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    branchId: '',
    teamId: ''
  });

  const validationActions = [
    { value: 'valid', label: 'Valid', icon: CheckCircle, color: 'bg-green-500' },
    { value: 'double_duta', label: 'Double Duta', icon: RefreshCw, color: 'bg-blue-500' },
    { value: 'double_input', label: 'Double Input', icon: Edit, color: 'bg-yellow-500' },
    { value: 'not_in_account', label: 'Tidak Ada di Rekening', icon: X, color: 'bg-red-500' },
    { value: 'other', label: 'Lainnya', icon: AlertTriangle, color: 'bg-gray-500' }
  ];

  const getBranchName = (branchId: string) => {
    return branches.find(b => b.id === branchId)?.name || '-';
  };

  const getTeamName = (teamId: string) => {
    return teams.find(t => t.id === teamId)?.name || '-';
  };

  const getProgramName = (programId: string) => {
    return programs.find(p => p.id === programId)?.name || '-';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleValidation = (transaction: Transaction, action: string) => {
    setSelectedTransaction(transaction);
    setValidationAction(action);
    setValidationReason('');
    setShowModal(true);
  };

  const confirmValidation = async () => {
    if (!selectedTransaction) return;

    if (validationAction === 'other' && !validationReason.trim()) {
      alert('Harap isi alasan untuk status "Lainnya"');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTransaction(selectedTransaction.id, {
        status: validationAction as any,
        statusReason: validationAction === 'other' ? validationReason : undefined
      });

      setShowModal(false);
      setSelectedTransaction(null);
      setValidationAction('');
      setValidationReason('');
      alert('Transaksi berhasil divalidasi!');
    } catch (error) {
      console.error('Error validating transaction:', error);
      alert('Gagal memvalidasi transaksi. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingTransactions = transactions.filter(t => t.status === 'pending');
  
  const filteredTransactions = pendingTransactions.filter(transaction => {
    if (filters.dateFrom && new Date(transaction.createdAt) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(transaction.createdAt) > new Date(filters.dateTo)) return false;
    if (filters.branchId && transaction.branchId !== filters.branchId) return false;
    if (filters.teamId && transaction.teamId !== filters.teamId) return false;
    return true;
  });

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-500">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Validasi Transaksi</h1>
        <p className="text-gray-600 mt-2">Validasi transaksi donasi yang masuk</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filter Transaksi</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Dari
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Sampai
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cabang
            </label>
            <select
              value={filters.branchId}
              onChange={(e) => setFilters({ ...filters, branchId: e.target.value, teamId: '' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Semua Cabang</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tim
            </label>
            <select
              value={filters.teamId}
              onChange={(e) => setFilters({ ...filters, teamId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!filters.branchId}
            >
              <option value="">Semua Tim</option>
              {teams.filter(t => t.branchId === filters.branchId).map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">
            Transaksi Menunggu Validasi ({filteredTransactions.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Donatur</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Cabang</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Tim</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Program</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Nominal</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Bank</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Tanggal</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Bukti</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-gray-100">
                  <td className="py-4 px-6 font-medium">{transaction.donorName}</td>
                  <td className="py-4 px-6">{getBranchName(transaction.branchId)}</td>
                  <td className="py-4 px-6">{getTeamName(transaction.teamId)}</td>
                  <td className="py-4 px-6">{getProgramName(transaction.programId)}</td>
                  <td className="py-4 px-6 font-medium text-green-600">
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="py-4 px-6">{transaction.transferMethod}</td>
                  <td className="py-4 px-6 text-gray-600">
                    {new Date(transaction.createdAt).toLocaleDateString('id-ID')}
                  </td>
                  <td className="py-4 px-6">
                    <button className="text-blue-600 hover:text-blue-800">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap gap-1">
                      {validationActions.map((action) => {
                        const Icon = action.icon;
                        return (
                          <button
                            key={action.value}
                            onClick={() => handleValidation(transaction, action.value)}
                            className={`${action.color} text-white p-2 rounded-md hover:opacity-80 transition-opacity`}
                            title={action.label}
                          >
                            <Icon className="w-4 h-4" />
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Tidak ada transaksi yang menunggu validasi</p>
          </div>
        )}
      </div>

      {/* Validation Modal */}
      {showModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Konfirmasi Validasi</h2>
            
            <div className="mb-4">
              <p className="text-gray-600">Donatur: <span className="font-medium">{selectedTransaction.donorName}</span></p>
              <p className="text-gray-600">Nominal: <span className="font-medium">{formatCurrency(selectedTransaction.amount)}</span></p>
              <p className="text-gray-600">Status: <span className="font-medium">
                {validationActions.find(a => a.value === validationAction)?.label}
              </span></p>
            </div>

            {validationAction === 'other' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alasan *
                </label>
                <textarea
                  value={validationReason}
                  onChange={(e) => setValidationReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Masukkan alasan..."
                  required
                />
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={confirmValidation}
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Memproses...
                  </>
                ) : (
                  'Konfirmasi'
                )}
              </button>
              <button
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}