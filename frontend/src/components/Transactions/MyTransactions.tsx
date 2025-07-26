import React, { useState } from 'react';
import { Search, Filter, Eye, Edit, Trash2, Plus, Loader, X, Calendar } from 'lucide-react';
import { Transaction } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useTransactions } from '../../hooks/useTransactions';
import { useBranches } from '../../hooks/useBranches';
import { useTeams } from '../../hooks/useTeams';
import { usePrograms } from '../../hooks/usePrograms';

export default function MyTransactions() {
  const { user } = useAuth();
  const { transactions, isLoading, error, deleteTransaction } = useTransactions();
  const { branches } = useBranches();
  const { teams } = useTeams();
  const { programs } = usePrograms();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    status: '',
    programType: ''
  });
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState<{[key: string]: boolean}>({});
  const [isDateRangeModalOpen, setIsDateRangeModalOpen] = useState(false);
  const [tempDateFrom, setTempDateFrom] = useState('');
  const [tempDateTo, setTempDateTo] = useState('');
  const [datePreset, setDatePreset] = useState('all');

  // Filter transactions based on user role
  const getUserTransactions = () => {
    if (user?.role === 'volunteer') {
      return transactions.filter(t => t.volunteerId === user.id);
    } else if (user?.role === 'branch') {
      return transactions.filter(t => t.branchId === user.branchId);
    }
    return transactions;
  };

  const filteredTransactions = getUserTransactions().filter(transaction => {
    const matchesSearch = 
      (transaction.donorName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (transaction.id?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const transactionDate = transaction.transaction_date || transaction.transactionDate || transaction.created_at || transaction.createdAt;
    const matchesDateFrom = !filters.dateFrom || new Date(transactionDate) >= new Date(filters.dateFrom);
    const matchesDateTo = !filters.dateTo || new Date(transactionDate) <= new Date(filters.dateTo);
    const matchesStatus = !filters.status || transaction.status === filters.status;
    const matchesProgram = !filters.programType || transaction.programType === filters.programType;

    return matchesSearch && matchesDateFrom && matchesDateTo && matchesStatus && matchesProgram;
  });

  const getBranchName = (transaction: Transaction) => {
    return transaction.branch?.name || branches.find(b => b.id === transaction.branchId)?.name || '-';
  };

  const getTeamName = (transaction: Transaction) => {
    return transaction.team?.name || teams.find(t => t.id === transaction.teamId)?.name || '-';
  };

  const getProgramName = (transaction: Transaction) => {
    return transaction.program?.name || programs.find(p => p.id === transaction.programId)?.name || '-';
  };

  const getVolunteerName = (transaction: Transaction) => {
    return transaction.volunteer?.name || '-';
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Menunggu Validasi',
      valid: 'Tervalidasi',
      double_duta: 'Double Duta',
      double_input: 'Double Input',
      not_in_account: 'Tidak Ada di Rekening',
      other: 'Lainnya'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      valid: 'bg-green-100 text-green-800',
      double_duta: 'bg-blue-100 text-blue-800',
      double_input: 'bg-purple-100 text-purple-800',
      not_in_account: 'bg-red-100 text-red-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const canEdit = (transaction: Transaction) => {
    return transaction.status === 'pending';
  };

  const handleViewProof = (transaction: Transaction) => {
    if (transaction.proof_image || transaction.proofImage) {
      const imageUrl = transaction.proof_image || transaction.proofImage;
      // Handle both relative and absolute URLs
      const fullImageUrl = imageUrl.startsWith('http') 
        ? imageUrl 
        : `http://localhost:8000/storage/${imageUrl}`;
      setSelectedImage(fullImageUrl);
      setShowImageModal(true);
      // Reset error state when opening new image
      setImageLoadError(prev => ({ ...prev, [transaction.id]: false }));
    } else {
      alert('Tidak ada bukti gambar untuk transaksi ini');
    }
  };

  const handleImageError = (transactionId: string) => {
    setImageLoadError(prev => ({ ...prev, [transactionId]: true }));
    console.error('Error loading image for transaction:', transactionId);
    alert('Gagal memuat gambar bukti transaksi');
    setShowImageModal(false);
  };

  const isProofButtonDisabled = (transaction: Transaction) => {
    const hasProofImage = !!(transaction.proof_image || transaction.proofImage);
    const hasLoadError = imageLoadError[transaction.id];
    return !hasProofImage || hasLoadError;
  };

  const handleDateFilterChange = (preset: string) => {
    if (preset === 'custom') {
      setTempDateFrom(filters.dateFrom);
      setTempDateTo(filters.dateTo);
      setIsDateRangeModalOpen(true);
    } else {
      setDatePreset(preset);
      // Apply preset logic
      const now = new Date();
      let dateFrom = '';
      let dateTo = '';
      
      switch (preset) {
        case 'current_month':
          dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
          dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
          break;
        case '1_month_back':
          dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
          dateTo = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
          break;
        case '2_months_back':
          dateFrom = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0];
          dateTo = new Date(now.getFullYear(), now.getMonth() - 1, 0).toISOString().split('T')[0];
          break;
        case 'last_3_months':
          dateFrom = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0];
          dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
          break;
        case 'all':
        default:
          dateFrom = '';
          dateTo = '';
          break;
      }
      
      setFilters({ ...filters, dateFrom, dateTo });
    }
  };

  const handleDateRangeSubmit = () => {
    if (tempDateFrom && tempDateTo) {
      setDatePreset('custom');
      setFilters({ 
        ...filters, 
        dateFrom: tempDateFrom, 
        dateTo: tempDateTo 
      });
      setIsDateRangeModalOpen(false);
    }
  };

  const handleDateRangeCancel = () => {
    setTempDateFrom('');
    setTempDateTo('');
    setIsDateRangeModalOpen(false);
  };

  const getCurrentDateFilterLabel = () => {
    if (datePreset === 'custom' && filters.dateFrom && filters.dateTo) {
      const startDate = new Date(filters.dateFrom).toLocaleDateString('id-ID');
      const endDate = new Date(filters.dateTo).toLocaleDateString('id-ID');
      return `${startDate} - ${endDate}`;
    }
    const presetLabels = {
      'current_month': 'Bulan Ini',
      '1_month_back': '1 Bulan Lalu',
      '2_months_back': '2 Bulan Lalu',
      'last_3_months': '3 Bulan Terakhir',
      'all': 'Semua Tanggal',
      'custom': 'Pilih Tanggal'
    };
    return presetLabels[datePreset as keyof typeof presetLabels] || 'Semua Tanggal';
  };

  const handleDelete = async (id: string) => {
    const transaction = getUserTransactions().find(t => t.id === id);
    if (transaction && transaction.status !== 'pending') {
      alert('Hanya transaksi dengan status "Menunggu Validasi" yang dapat dihapus');
      return;
    }
    
    if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      try {
        await deleteTransaction(id);
        alert('Transaksi berhasil dihapus!');
      } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Gagal menghapus transaksi. Silakan coba lagi.');
      }
    }
  };

  const totalAmount = filteredTransactions
    .filter(t => t.status === 'valid')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingCount = filteredTransactions.filter(t => t.status === 'pending').length;
  const validCount = filteredTransactions.filter(t => t.status === 'valid').length;

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
        <h1 className="text-3xl font-bold text-gray-900">
          {user?.role === 'volunteer' ? 'Transaksi Saya' : 'Transaksi Cabang'}
        </h1>
        <p className="text-gray-600 mt-2">
          {user?.role === 'volunteer' 
            ? 'Kelola transaksi donasi yang Anda input'
            : 'Kelola transaksi donasi di cabang Anda'
          }
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tervalidasi</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {formatCurrency(totalAmount)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold">{validCount}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Menunggu Validasi</p>
              <p className="text-2xl font-bold text-yellow-600 mt-2">{pendingCount}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 font-bold">!</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Transaksi</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{filteredTransactions.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold">#</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama donatur atau ID transaksi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter Tanggal
            </label>
            <div className="flex gap-2">
              <select
                value={datePreset}
                onChange={(e) => handleDateFilterChange(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Semua Tanggal</option>
                <option value="current_month">Bulan Ini</option>
                <option value="1_month_back">1 Bulan Lalu</option>
                <option value="2_months_back">2 Bulan Lalu</option>
                <option value="last_3_months">3 Bulan Terakhir</option>
                <option value="custom">Pilih Tanggal</option>
              </select>
              {datePreset === 'custom' && (
                <button
                  onClick={() => {
                    setTempDateFrom(filters.dateFrom);
                    setTempDateTo(filters.dateTo);
                    setIsDateRangeModalOpen(true);
                  }}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                  title="Pilih rentang tanggal"
                >
                  <Calendar className="w-4 h-4" />
                </button>
              )}
            </div>
            {datePreset === 'custom' && filters.dateFrom && filters.dateTo && (
              <div className="mt-1 text-xs text-gray-600">
                {getCurrentDateFilterLabel()}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Semua Status</option>
              <option value="pending">Menunggu Validasi</option>
              <option value="valid">Tervalidasi</option>
              <option value="double_duta">Double Duta</option>
              <option value="double_input">Double Input</option>
              <option value="not_in_account">Tidak Ada di Rekening</option>
              <option value="other">Lainnya</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jenis Program
            </label>
            <select
              value={filters.programType}
              onChange={(e) => setFilters({ ...filters, programType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Semua Jenis</option>
              <option value="ZISWAF">ZISWAF</option>
              <option value="QURBAN">QURBAN</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">
            Daftar Transaksi ({filteredTransactions.length})
          </h2>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-medium text-gray-700">ID</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Donatur</th>
                {user?.role === 'branch' && (
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Tim</th>
                )}
                <th className="text-left py-4 px-6 font-medium text-gray-700">Relawan</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Program</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Nominal</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Bank</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Tanggal</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Status</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-gray-100">
                  <td className="py-4 px-6 text-gray-600">#{transaction.id}</td>
                  <td className="py-4 px-6 font-medium">{transaction.donorName || '-'}</td>
                  {user?.role === 'branch' && (
                    <td className="py-4 px-6">{getTeamName(transaction)}</td>
                  )}
                  <td className="py-4 px-6">{getVolunteerName(transaction)}</td>
                  <td className="py-4 px-6">{getProgramName(transaction)}</td>
                  <td className="py-4 px-6 font-medium text-green-600">
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="py-4 px-6">{transaction.transferMethod || '-'}</td>
                  <td className="py-4 px-6 text-gray-600">
                    {formatDate(transaction.transaction_date || transaction.transactionDate || transaction.created_at || transaction.createdAt)}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                      {getStatusLabel(transaction.status)}
                    </span>
                    {transaction.statusReason && (
                      <p className="text-xs text-gray-500 mt-1">{transaction.statusReason}</p>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleViewProof(transaction)}
                        className="text-blue-600 hover:text-blue-800 disabled:text-gray-400" 
                        disabled={isProofButtonDisabled(transaction)}
                        title={isProofButtonDisabled(transaction) ? 'Tidak ada bukti gambar atau gagal memuat' : 'Lihat bukti transaksi'}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canEdit(transaction) && (
                        <>
                          <button className="text-green-600 hover:text-green-800" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Mobile/Tablet Card View */}
        <div className="lg:hidden">
          {filteredTransactions.map((transaction) => (
            <div key={transaction.id} className="border-b border-gray-100 p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">#{transaction.id}</h3>
                  <p className="text-sm text-gray-600">{transaction.donorName || '-'}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                  {getStatusLabel(transaction.status)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div>
                  <span className="text-gray-500">Nominal:</span>
                  <p className="font-medium text-green-600">{formatCurrency(transaction.amount)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Tanggal:</span>
                  <p className="text-gray-900">
                    {formatDate(transaction.transaction_date || transaction.transactionDate || transaction.created_at || transaction.createdAt)}
                  </p>
                </div>
                {user?.role === 'branch' && (
                  <div>
                    <span className="text-gray-500">Tim:</span>
                    <p className="text-gray-900">{getTeamName(transaction)}</p>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Relawan:</span>
                  <p className="text-gray-900">{getVolunteerName(transaction)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Program:</span>
                  <p className="text-gray-900">{getProgramName(transaction)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Bank:</span>
                  <p className="text-gray-900">{transaction.transferMethod || '-'}</p>
                </div>
              </div>
              
              {transaction.statusReason && (
                <div className="mb-3">
                  <span className="text-gray-500 text-sm">Alasan:</span>
                  <p className="text-gray-900 text-sm">{transaction.statusReason}</p>
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <button 
                  onClick={() => handleViewProof(transaction)}
                  className="text-blue-600 hover:text-blue-800 disabled:text-gray-400 p-2" 
                  disabled={isProofButtonDisabled(transaction)}
                  title={isProofButtonDisabled(transaction) ? 'Tidak ada bukti gambar atau gagal memuat' : 'Lihat bukti transaksi'}
                >
                  <Eye className="w-4 h-4" />
                </button>
                {canEdit(transaction) && (
                  <>
                    <button className="text-green-600 hover:text-green-800 p-2" title="Edit">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      className="text-red-600 hover:text-red-800 p-2"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Tidak ada transaksi yang ditemukan</p>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setShowImageModal(false)}>
          <div className="relative max-w-4xl max-h-[90vh] mx-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-all z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedImage}
              alt="Bukti Transaksi"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onError={() => {
                const transactionId = filteredTransactions.find(t => 
                  (t.proof_image && selectedImage.includes(t.proof_image)) || 
                  (t.proofImage && selectedImage.includes(t.proofImage))
                )?.id;
                if (transactionId) {
                  handleImageError(transactionId);
                }
              }}
            />
            <div className="absolute bottom-4 left-4 right-4 text-center">
              <p className="text-white bg-black bg-opacity-50 rounded-lg px-4 py-2 inline-block">
                Bukti Transaksi - Klik di luar gambar atau tombol X untuk menutup
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Date Range Modal */}
      {isDateRangeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Pilih Rentang Tanggal</h3>
              <button
                onClick={handleDateRangeCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={tempDateFrom}
                  onChange={(e) => setTempDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Akhir
                </label>
                <input
                  type="date"
                  value={tempDateTo}
                  onChange={(e) => setTempDateTo(e.target.value)}
                  min={tempDateFrom}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              {tempDateFrom && tempDateTo && tempDateFrom > tempDateTo && (
                <div className="text-red-600 text-sm">
                  Tanggal akhir harus setelah tanggal mulai
                </div>
              )}
            </div>
            
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={handleDateRangeCancel}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDateRangeSubmit}
                disabled={!tempDateFrom || !tempDateTo || tempDateFrom > tempDateTo}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}