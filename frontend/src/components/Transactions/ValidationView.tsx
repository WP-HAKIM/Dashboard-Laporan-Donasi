import React, { useState } from 'react';
import { Filter, CheckCircle, RefreshCw, Edit, X, AlertTriangle, Eye, Calendar } from 'lucide-react';
import { Transaction } from '../../types';
import { useTransactions } from '../../hooks/useTransactions';
import { useBranches } from '../../hooks/useBranches';
import { useTeams } from '../../hooks/useTeams';
import { usePrograms } from '../../hooks/usePrograms';
import { usePaymentMethods } from '../../hooks/usePaymentMethods';
import { useUsers } from '../../hooks/useUsers';
import Loader from '../Common/Loader';
import SearchableSelect from '../Common/SearchableSelect';

export default function ValidationView() {
  const { transactions, isLoading, error, validateTransaction, fetchTransactions } = useTransactions();
  const { branches } = useBranches();
  const { teams } = useTeams();
  const { programs } = usePrograms();
  const { paymentMethods } = usePaymentMethods();
  const { users: volunteers } = useUsers();
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  
  // Fetch transactions on component mount
  React.useEffect(() => {
    fetchTransactions();
  }, []);
  
  // Initialize local transactions when transactions are loaded
  React.useEffect(() => {
    setLocalTransactions(transactions);
  }, [transactions]);
  const [validationAction, setValidationAction] = useState<string>('');
  const [validationReason, setValidationReason] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState<{[key: string]: boolean}>({});

  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    branchId: '',
    teamId: '',
    bank: '',
    volunteerName: '',
    search: ''
  });

  // Date range modal states
  const [isDateRangeModalOpen, setIsDateRangeModalOpen] = useState(false);
  const [tempDateFrom, setTempDateFrom] = useState('');
  const [tempDateTo, setTempDateTo] = useState('');
  const [datePreset, setDatePreset] = useState('all');

  const validationActions = [
    { value: 'valid', label: 'Valid', icon: CheckCircle, color: 'bg-green-500' },
    { value: 'double_duta', label: 'Double Duta', icon: RefreshCw, color: 'bg-blue-500' },
    { value: 'double_input', label: 'Double Input', icon: Edit, color: 'bg-yellow-500' },
    { value: 'not_in_account', label: 'Tidak Ada di Rekening', icon: X, color: 'bg-red-500' },
    { value: 'other', label: 'Lainnya', icon: AlertTriangle, color: 'bg-gray-500' }
  ];

  const getBranchName = (transaction: Transaction) => {
    return transaction.branch?.name || branches.find(b => b.id === transaction.branchId)?.name || '-';
  };

  const getTeamName = (transaction: Transaction) => {
    return transaction.team?.name || teams.find(t => t.id === transaction.teamId)?.name || '-';
  };

  const getProgramName = (transaction: Transaction) => {
    const mainProgram = transaction.program?.name || programs.find(p => p.id === transaction.program_id)?.name || '-';
    
    if (transaction.program_type === 'QURBAN') {
      const ziswafProgram = transaction.ziswaf_program?.name || 
        (transaction.ziswaf_program_id ? programs.find(p => p.id === transaction.ziswaf_program_id)?.name : null);
      
      return (
        <div className="space-y-1">
          <div className="text-sm">
            <span className="text-gray-600">Type Hewan:</span>
            <span className="ml-1 font-medium">{mainProgram}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">Program:</span>
            <span className="ml-1 font-medium">{ziswafProgram || '-'}</span>
          </div>
        </div>
      );
    }
    
    return mainProgram;
  };

  const getProgramNameString = (transaction: Transaction) => {
    const mainProgram = transaction.program?.name || programs.find(p => p.id === transaction.program_id)?.name || '-';
    
    if (transaction.program_type === 'QURBAN') {
      const ziswafProgram = transaction.ziswaf_program?.name || 
        (transaction.ziswaf_program_id ? programs.find(p => p.id === transaction.ziswaf_program_id)?.name : null);
      
      return `${mainProgram} - ${ziswafProgram || '-'}`;
    }
    
    return mainProgram;
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
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta'
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

  const handleValidation = (transaction: Transaction, action: string) => {
    setSelectedTransaction(transaction);
    setValidationAction(action);
    setValidationReason('');
    setShowModal(true);
  };

  const handleViewProof = (transaction: Transaction) => {
    if (transaction.proof_image) {
      // Construct the full URL for the image
      const imageUrl = transaction.proof_image.startsWith('http') 
        ? transaction.proof_image 
        : `http://localhost:8000/storage/${transaction.proof_image}`;
      setSelectedImage(imageUrl);
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
    const hasProofImage = !!transaction.proof_image;
    const hasLoadError = imageLoadError[transaction.id];
    return !hasProofImage || hasLoadError;
  };

  const handleDateFilterChange = (preset: string) => {
    setDatePreset(preset);
    
    if (preset === 'custom') {
      setTempDateFrom(filters.dateFrom);
      setTempDateTo(filters.dateTo);
      setIsDateRangeModalOpen(true);
    } else {
      const today = new Date();
      let dateFrom = '';
      let dateTo = '';
      
      switch (preset) {
        case 'today':
          dateFrom = dateTo = today.toISOString().split('T')[0];
          break;
        case 'yesterday':
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          dateFrom = dateTo = yesterday.toISOString().split('T')[0];
          break;
        case 'this_week':
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          dateFrom = startOfWeek.toISOString().split('T')[0];
          dateTo = today.toISOString().split('T')[0];
          break;
        case 'this_month':
          dateFrom = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
          dateTo = today.toISOString().split('T')[0];
          break;
        case 'last_month':
          const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
          dateFrom = lastMonth.toISOString().split('T')[0];
          dateTo = lastDayOfLastMonth.toISOString().split('T')[0];
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
    if (tempDateTo && tempDateFrom && new Date(tempDateTo) < new Date(tempDateFrom)) {
      alert('Tanggal akhir tidak boleh lebih awal dari tanggal mulai');
      return;
    }
    
    setFilters({ ...filters, dateFrom: tempDateFrom, dateTo: tempDateTo });
    setIsDateRangeModalOpen(false);
  };

  const handleDateRangeCancel = () => {
    setTempDateFrom('');
    setTempDateTo('');
    setIsDateRangeModalOpen(false);
    setDatePreset('all');
  };

  const getCurrentDateFilterLabel = () => {
    if (!filters.dateFrom && !filters.dateTo) return 'Semua Tanggal';
    if (filters.dateFrom && filters.dateTo) {
      if (filters.dateFrom === filters.dateTo) {
        return `Tanggal: ${formatDate(filters.dateFrom)}`;
      }
      return `${formatDate(filters.dateFrom)} - ${formatDate(filters.dateTo)}`;
    }
    if (filters.dateFrom) return `Dari: ${formatDate(filters.dateFrom)}`;
    if (filters.dateTo) return `Sampai: ${formatDate(filters.dateTo)}`;
    return 'Semua Tanggal';
  };

  const confirmValidation = async () => {
    if (!selectedTransaction) return;

    if (validationAction === 'other' && !validationReason.trim()) {
      alert('Harap isi alasan untuk status "Lainnya"');
      return;
    }

    setIsSubmitting(true);
    try {
      // Use the correct API endpoint for validation
      const response = await fetch(`http://localhost:8000/api/transactions/${selectedTransaction.id}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          status: validationAction,
          status_reason: validationAction === 'other' ? validationReason : undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to validate transaction');
      }

      const updatedTransaction = await response.json();
      
      // Update the local transactions state without reload
      // Remove the validated transaction from the list since it's no longer pending
      setLocalTransactions(prev => prev.filter(t => t.id !== selectedTransaction.id));
      
      setShowModal(false);
      setSelectedTransaction(null);
      setValidationAction('');
      setValidationReason('');
      alert('Transaksi berhasil divalidasi!');
    } catch (error) {
      console.error('Error validating transaction:', error);
      alert(`Gagal memvalidasi transaksi: ${error instanceof Error ? error.message : 'Silakan coba lagi.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingTransactions = localTransactions.filter(t => t.status === 'pending');
  
  // Get unique values from pending transactions for dropdown filters
  const getUniqueValues = () => {
    // If no pending transactions, show all available options
    if (pendingTransactions.length === 0) {
      return {
        branches: branches,
        teams: teams,
        volunteers: [],
        banks: []
      };
    }
    
    const uniqueBranchIds = Array.from(new Set(
      pendingTransactions
        .map(t => t.branchId)
        .filter(Boolean)
    ));
    
    const uniqueBranches = uniqueBranchIds.length > 0 
      ? uniqueBranchIds
          .map(branchId => branches.find(b => b.id === branchId))
          .filter(Boolean)
      : branches;
    
    const uniqueTeamIds = Array.from(new Set(
      pendingTransactions
        .map(t => t.teamId)
        .filter(Boolean)
    ));
    
    const uniqueTeams = uniqueTeamIds.length > 0
      ? uniqueTeamIds
          .map(teamId => teams.find(t => t.id === teamId))
          .filter(Boolean)
      : teams;
    
    const uniqueVolunteers = Array.from(new Set(
      pendingTransactions
        .map(t => getVolunteerName(t))
        .filter(name => name && name !== '-')
    ));
    
    const uniqueBanks = Array.from(new Set(
      pendingTransactions
        .map(t => t.transferMethod)
        .filter(Boolean)
    ));
    
    return {
      branches: uniqueBranches,
      teams: uniqueTeams,
      volunteers: uniqueVolunteers,
      banks: uniqueBanks
    };
  };
  
  const uniqueData = getUniqueValues();
  
  const filteredTransactions = pendingTransactions.filter(transaction => {
    const createdAt = transaction.created_at || transaction.createdAt;
    if (filters.dateFrom && new Date(createdAt) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(createdAt) > new Date(filters.dateTo)) return false;
    if (filters.branchId && transaction.branchId !== filters.branchId) return false;
    if (filters.teamId && transaction.teamId !== filters.teamId) return false;
    
    // Filter by bank
    if (filters.bank && transaction.transferMethod && transaction.transferMethod !== filters.bank) return false;
    
    // Filter by volunteer name
    if (filters.volunteerName && getVolunteerName(transaction) !== filters.volunteerName) return false;
    
    // Global search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const searchableFields = [
        transaction.donorName || '',
        transaction.transferMethod || '',
        getBranchName(transaction),
        getTeamName(transaction),
        getVolunteerName(transaction),
        getProgramNameString(transaction),
        transaction.amount?.toString() || ''
      ];
      
      const matchesSearch = searchableFields.some(field => 
        String(field).toLowerCase().includes(searchTerm)
      );
      
      if (!matchesSearch) return false;
    }
    
    return true;
  });

  if (isLoading) {
    return <Loader text="Memuat Data" size="medium" />;
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
        
        {/* Search Bar */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pencarian Global
          </label>
          <input
            type="text"
            placeholder="Cari berdasarkan nama donatur, bank, cabang, tim, relawan, program, atau nominal..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
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
                <option value="today">Hari Ini</option>
                <option value="yesterday">Kemarin</option>
                <option value="this_week">Minggu Ini</option>
                <option value="this_month">Bulan Ini</option>
                <option value="last_month">Bulan Lalu</option>
                <option value="custom">Rentang Kustom</option>
              </select>
              <button
                onClick={() => handleDateFilterChange('custom')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                title="Pilih rentang tanggal kustom"
              >
                <Calendar className="w-4 h-4" />
              </button>
            </div>
            {(filters.dateFrom || filters.dateTo) && (
              <p className="text-xs text-gray-500 mt-1">
                {getCurrentDateFilterLabel()}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cabang
            </label>
            <SearchableSelect
              options={[
                { value: '', label: 'Semua Cabang' },
                ...uniqueData.branches.map(branch => ({
                  value: branch.id,
                  label: branch.name
                }))
              ]}
              value={filters.branchId}
              onChange={(value) => setFilters({ ...filters, branchId: value })}
              placeholder="Pilih Cabang..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tim
            </label>
            <SearchableSelect
              options={[
                { value: '', label: 'Semua Tim' },
                ...uniqueData.teams.map(team => ({
                  value: team.id,
                  label: team.name
                }))
              ]}
              value={filters.teamId}
              onChange={(value) => setFilters({ ...filters, teamId: value })}
              placeholder="Pilih Tim..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Relawan
            </label>
            <SearchableSelect
              options={[
                { value: '', label: 'Semua Relawan' },
                ...uniqueData.volunteers.map(volunteerName => ({
                  value: volunteerName,
                  label: volunteerName
                }))
              ]}
              value={filters.volunteerName}
              onChange={(value) => setFilters({ ...filters, volunteerName: value })}
              placeholder="Pilih Relawan..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bank
            </label>
            <SearchableSelect
              options={[
                { value: '', label: 'Semua Bank' },
                ...uniqueData.banks.map(bankName => ({
                  value: bankName,
                  label: bankName
                }))
              ]}
              value={filters.bank}
              onChange={(value) => setFilters({ ...filters, bank: value })}
              placeholder="Pilih Bank..."
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">
            Transaksi Menunggu Validasi ({filteredTransactions.length})
          </h2>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Donatur</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Cabang</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Tim</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Relawan</th>
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
                  <td className="py-4 px-6 font-medium">{transaction.donorName || '-'}</td>
                  <td className="py-4 px-6">{getBranchName(transaction)}</td>
                  <td className="py-4 px-6">{getTeamName(transaction)}</td>
                  <td className="py-4 px-6">{getVolunteerName(transaction)}</td>
                  <td className="py-4 px-6">{getProgramName(transaction)}</td>
                  <td className="py-4 px-6 font-medium text-green-600">
                    {(transaction.program_type === 'QURBAN' && (transaction.qurban_amount || transaction.ziswaf_program_id)) ? (
                      <div className="space-y-1">
                        {transaction.qurban_amount && (
                          <div className="text-sm">
                            <span className="text-gray-600">Nominal Qurban:</span>
                            <div className="font-medium">{formatCurrency(transaction.qurban_amount)}</div>
                          </div>
                        )}
                        <div className="text-sm">
                          <span className="text-gray-600">Nominal Donasi:</span>
                          <div className="font-medium">{formatCurrency(transaction.amount || 0)}</div>
                        </div>
                        <div className="text-sm border-t pt-1 mt-1">
                          <span className="text-gray-600 font-semibold">Nominal Total:</span>
                          <div className="font-bold text-green-700">{formatCurrency((Number(transaction.qurban_amount) || 0) + (Number(transaction.amount) || 0))}</div>
                        </div>
                        {!transaction.qurban_amount && !transaction.amount && (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    ) : (
                      formatCurrency(transaction.amount)
                    )}
                  </td>
                  <td className="py-4 px-6">{transaction.transferMethod || '-'}</td>
                  <td className="py-4 px-6 text-gray-600">
                    {formatDate(transaction.transaction_date || transaction.transactionDate || transaction.created_at || transaction.createdAt)}
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => handleViewProof(transaction)}
                      className="text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                      disabled={isProofButtonDisabled(transaction)}
                      title={isProofButtonDisabled(transaction) ? 'Tidak ada bukti gambar atau gagal memuat' : 'Lihat bukti transaksi'}
                    >
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

        {/* Mobile/Tablet Card View */}
        <div className="lg:hidden">
          {filteredTransactions.map((transaction) => (
            <div key={transaction.id} className="border-b border-gray-100 p-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Donatur:</span>
                  <p className="font-medium">{transaction.donorName || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Nominal:</span>
                  {(transaction.program_type === 'QURBAN' && (transaction.qurban_amount || transaction.ziswaf_program_id)) ? (
                    <div className="space-y-1">
                      {transaction.qurban_amount && (
                        <div className="text-sm">
                          <span className="text-gray-600">Qurban:</span>
                          <span className="ml-1 font-medium text-green-600">{formatCurrency(transaction.qurban_amount)}</span>
                        </div>
                      )}
                      <div className="text-sm">
                        <span className="text-gray-600">Donasi:</span>
                        <span className="ml-1 font-medium text-green-600">{formatCurrency(transaction.amount || 0)}</span>
                      </div>
                      <div className="text-sm border-t pt-1 mt-1">
                        <span className="text-gray-600 font-semibold">Total:</span>
                        <span className="ml-1 font-bold text-green-700">{formatCurrency((Number(transaction.qurban_amount) || 0) + (Number(transaction.amount) || 0))}</span>
                      </div>
                      {!transaction.qurban_amount && !transaction.amount && (
                        <span className="font-medium text-gray-400">-</span>
                      )}
                    </div>
                  ) : (
                    <p className="font-medium text-green-600">{formatCurrency(transaction.amount)}</p>
                  )}
                </div>
                <div>
                  <span className="text-gray-500">Cabang:</span>
                  <p className="font-medium">{getBranchName(transaction)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Tim:</span>
                  <p className="font-medium">{getTeamName(transaction)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Relawan:</span>
                  <p className="font-medium">{getVolunteerName(transaction)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Program:</span>
                  <div className="font-medium">{getProgramName(transaction)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Bank:</span>
                  <p className="font-medium">{transaction.transferMethod || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Tanggal:</span>
                  <p className="font-medium text-gray-600">
                    {formatDate(transaction.transaction_date || transaction.transactionDate || transaction.created_at || transaction.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleViewProof(transaction)}
                  className="text-blue-600 hover:text-blue-800 disabled:text-gray-400 flex items-center gap-1"
                  disabled={isProofButtonDisabled(transaction)}
                  title={isProofButtonDisabled(transaction) ? 'Tidak ada bukti gambar atau gagal memuat' : 'Lihat bukti transaksi'}
                >
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">Lihat Bukti</span>
                </button>
                <div className="flex gap-1">
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
              </div>
            </div>
          ))}
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
                  t.proof_image && selectedImage.includes(t.proof_image)
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Pilih Rentang Tanggal</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={tempDateFrom}
                  onChange={(e) => setTempDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Akhir
                </label>
                <input
                  type="date"
                  value={tempDateTo}
                  onChange={(e) => setTempDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleDateRangeSubmit}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Terapkan
              </button>
              <button
                onClick={handleDateRangeCancel}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
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