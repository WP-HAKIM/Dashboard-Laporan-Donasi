import React, { useState } from 'react';
import { Search, Filter, Eye, Edit, Trash2, Plus, X, Calendar, Save } from 'lucide-react';
import { Transaction } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useTransactions } from '../../hooks/useTransactions';
import { useBranches } from '../../hooks/useBranches';
import { useTeams } from '../../hooks/useTeams';
import { usePrograms } from '../../hooks/usePrograms';
import { useUsers } from '../../hooks/useUsers';
import { usePaymentMethods } from '../../hooks/usePaymentMethods';
import Loader from '../common/Loader';
import { formatDateForInput, convertInputToISO } from '../../utils/dateUtils';

export default function MyTransactions() {
  const { user } = useAuth();
  const { myTransactions, myTransactionsStats, isLoading, error, deleteTransaction, fetchMyTransactions, fetchMyTransactionsStats, updateTransaction, clearError } = useTransactions();
  const { branches } = useBranches();
  const { teams } = useTeams();
  const { programs } = usePrograms();
  const { volunteers } = useUsers();
  const { paymentMethods } = usePaymentMethods();
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState({
    donorName: '',
    amount: 0,
    transactionDate: '',
    programType: 'ZISWAF' as 'ZISWAF' | 'QURBAN',
    programId: '',
    qurbanOwnerName: '',
    qurbanAmount: '',
    ziswafProgramId: '',
    paymentMethodId: '',
    branchId: '',
    teamId: '',
    volunteerId: '',
    status: 'pending' as Transaction['status'],
    statusReason: '',
    proofImage: null as File | null
  });

  // Fetch my transactions and stats on component mount
  React.useEffect(() => {
    fetchMyTransactions();
    fetchMyTransactionsStats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Use myTransactions directly from the hook
  const filteredTransactions = (myTransactions || []).filter(transaction => {
    // Safety check for transaction object
    if (!transaction) return false;
    
    const donorName = transaction.donorName || transaction.donor_name || '';
    const matchesSearch = 
      donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.id?.toString().toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const createdAt = transaction.created_at || transaction.createdAt || '';
    const matchesDateFrom = !filters.dateFrom || !createdAt || new Date(createdAt) >= new Date(filters.dateFrom);
    const matchesDateTo = !filters.dateTo || !createdAt || new Date(createdAt) <= new Date(filters.dateTo);
    const matchesStatus = !filters.status || transaction.status === filters.status;
    const matchesProgram = !filters.programType || transaction.programType === filters.programType;

    return matchesSearch && matchesDateFrom && matchesDateTo && matchesStatus && matchesProgram;
  });

  const getBranchName = (transaction: Transaction) => {
    return transaction.branch?.name || (branches || []).find(b => b.id === transaction.branchId)?.name || '-';
  };

  const getTeamName = (transaction: Transaction) => {
    return transaction.team?.name || (teams || []).find(t => t.id === transaction.teamId)?.name || '-';
  };

  const getProgramName = (transaction: Transaction) => {
    const mainProgram = transaction.program?.name || (programs || []).find(p => p.id === transaction.program_id)?.name || '-';
    
    if (transaction.program_type === 'QURBAN') {
      const ziswafProgram = transaction.ziswaf_program?.name || 
        (transaction.ziswaf_program_id ? (programs || []).find(p => p.id === transaction.ziswaf_program_id)?.name : null);
      
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
    if (!user) return false;
    
    // Admin can edit all transactions
    if (user.role === 'admin') return true;
    
    // For volunteer and branch, only allow editing if status is 'pending'
    if ((user.role === 'volunteer' || user.role === 'branch') && transaction.status !== 'pending') {
      return false;
    }
    
    // Branch can edit transactions from their branch
    if (user.role === 'branch') {
      return transaction.branch_id === user.branch_id;
    }
    
    // Volunteer can edit their own transactions
    if (user.role === 'volunteer') {
      return transaction.volunteer_id === user.id;
    }
    
    return false;
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
      const startDate = new Date(filters.dateFrom).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      const endDate = new Date(filters.dateTo).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
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

  const canDelete = (transaction: Transaction) => {
    if (!user) return false;
    
    // Only allow deleting if status is 'pending'
    if (transaction.status !== 'pending') return false;
    
    // Admin can delete all transactions
    if (user.role === 'admin') return true;
    
    // Branch can delete transactions from their branch
    if (user.role === 'branch') {
      return transaction.branch_id === user.branch_id;
    }
    
    // Volunteer can delete their own transactions
    if (user.role === 'volunteer') {
      return transaction.volunteer_id === user.id;
    }
    
    return false;
  };

  const handleDelete = async (id: string) => {
    const transaction = myTransactions.find(t => t.id === id);
    if (transaction && transaction.status !== 'pending') {
      alert('Hanya transaksi dengan status "Menunggu Validasi" yang dapat dihapus');
      return;
    }
    
    if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      try {
        await deleteTransaction(id);
        alert('Transaksi berhasil dihapus!');
        
        // Refresh transactions and stats to ensure UI is updated
        await fetchMyTransactions();
        await fetchMyTransactionsStats();
      } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Gagal menghapus transaksi. Silakan coba lagi.');
      }
    }
  };

  const handleEdit = (transaction: Transaction) => {
    try {
      console.log('Editing transaction:', transaction);
      
      // Validate transaction data
      if (!transaction || !transaction.id) {
        console.error('Invalid transaction data:', transaction);
        alert('Data transaksi tidak valid');
        return;
      }
      
      setEditingTransaction(transaction);
      
      // Extract IDs from transaction data (backend uses snake_case)
      let branchId = String(transaction.branch_id || transaction.branchId || '');
      let teamId = String(transaction.team_id || transaction.teamId || '');
      let volunteerId = String(transaction.volunteer_id || transaction.volunteerId || '');
      const programId = String(transaction.program_id || transaction.programId || '');
      const paymentMethodId = String(transaction.payment_method_id || transaction.paymentMethodId || '');
      
      // Apply role-based defaults for volunteer role
      if (user?.role === 'volunteer') {
        branchId = String(user.branchId || (user as any).branch_id || '');
        teamId = String(user.teamId || (user as any).team_id || '');
        volunteerId = String(user.id || '');
      }
      
      // Format transaction date for datetime-local input with Indonesian timezone
      const transactionDate = transaction.transaction_date || transaction.transactionDate || transaction.created_at || transaction.createdAt;
      const formattedDate = formatDateForInput(transactionDate);
      
      setFormData({
        donorName: transaction.donor_name || transaction.donorName || '',
        amount: transaction.amount || 0,
        transactionDate: formattedDate,
        programType: (transaction.program_type || transaction.programType || 'ZISWAF') as 'ZISWAF' | 'QURBAN',
        programId: programId,
        qurbanOwnerName: transaction.qurban_owner_name || transaction.qurbanOwnerName || '',
        qurbanAmount: String(transaction.qurban_amount || transaction.qurbanAmount || ''),
        ziswafProgramId: String(transaction.ziswaf_program_id || transaction.ziswafProgramId || ''),
        paymentMethodId: paymentMethodId,
        branchId: branchId,
        teamId: teamId,
        volunteerId: volunteerId,
        status: transaction.status || 'pending',
        statusReason: transaction.status_reason || transaction.statusReason || '',
        proofImage: null
      });
      setIsModalOpen(true);
      console.log('Edit modal should be shown');
    } catch (error) {
      console.error('Error in handleEdit:', error);
      alert('Terjadi kesalahan saat membuka form edit: ' + (error as Error).message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    // Validation
    if (!formData.donorName.trim()) {
      alert('Nama donatur harus diisi');
      return;
    }
    if (!formData.amount || formData.amount <= 0) {
      alert('Nominal harus lebih dari 0');
      return;
    }
    if (!formData.programId) {
      alert('Program harus dipilih');
      return;
    }
    if (!formData.paymentMethodId) {
      alert('Metode pembayaran harus dipilih');
      return;
    }
    if (!formData.branchId) {
      alert('Cabang harus dipilih');
      return;
    }
    if (!formData.teamId) {
      alert('Tim harus dipilih');
      return;
    }
    if (!formData.volunteerId) {
      alert('Relawan harus dipilih');
      return;
    }

    try {
      // Reset error state before update
      clearError();
      
      const updateData: any = {
        donor_name: formData.donorName,
        amount: formData.amount,
        transaction_date: convertInputToISO(formData.transactionDate),
        program_type: formData.programType,
        program_id: formData.programId,
        payment_method_id: formData.paymentMethodId,
        branch_id: formData.branchId,
        team_id: formData.teamId,
        volunteer_id: formData.volunteerId,
        status: formData.status,
        status_reason: formData.statusReason
      };
      
      // Add qurban fields if program type is QURBAN
      if (formData.programType === 'QURBAN') {
        if (formData.qurbanOwnerName) {
          updateData.qurban_owner_name = formData.qurbanOwnerName;
        }
        if (formData.qurbanAmount) {
          updateData.qurban_amount = formData.qurbanAmount;
        }
      }
      
      // Add ziswaf fields if selected
      if (formData.ziswafProgramId) {
        updateData.ziswaf_program_id = formData.ziswafProgramId;
      }
      
      if (formData.proofImage) {
        const formDataToSend = new FormData();
        Object.keys(updateData).forEach(key => {
          formDataToSend.append(key, updateData[key]);
        });
        formDataToSend.append('proof_image', formData.proofImage);
        await updateTransaction(String(editingTransaction.id), formDataToSend);
      } else {
        await updateTransaction(String(editingTransaction.id), updateData);
      }
      
      setIsModalOpen(false);
      setEditingTransaction(null);
      alert('Transaksi berhasil diperbarui');
      
      // Refresh data with error handling
      try {
        await fetchMyTransactions();
      } catch (fetchError) {
        console.error('Error refreshing transactions:', fetchError);
      }
      
      try {
        await fetchMyTransactionsStats();
      } catch (statsError) {
        console.error('Error refreshing stats:', statsError);
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('Gagal memperbarui transaksi: ' + (error as Error).message);
    }
  };



  const totalAmount = filteredTransactions
    .filter(t => t.status === 'valid')
    .reduce((sum, t) => {
      const regularAmount = Number(t.amount) || 0;
      const qurbanAmount = Number(t.qurban_amount) || 0;
      return sum + regularAmount + qurbanAmount;
    }, 0);

  const pendingCount = filteredTransactions.filter(t => t.status === 'pending').length;
  const validCount = filteredTransactions.filter(t => t.status === 'valid').length;
  const doubleDutaCount = filteredTransactions.filter(t => t.status === 'double_duta').length;
  const doubleInputCount = filteredTransactions.filter(t => t.status === 'double_input').length;
  const notInAccountCount = filteredTransactions.filter(t => t.status === 'not_in_account').length;
  const otherCount = filteredTransactions.filter(t => t.status === 'other').length;

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total Tervalidasi</p>
              <p className="text-lg font-bold text-green-600 mt-1">
                {formatCurrency(totalAmount)}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold text-sm">{validCount}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total Donasi Ziswaf</p>
              <p className="text-lg font-bold text-emerald-600 mt-1">
                {formatCurrency(myTransactionsStats?.ziswaf_total || 0)}
              </p>
            </div>
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-emerald-600 font-bold text-sm">Z</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total Donasi Qurban</p>
              <p className="text-lg font-bold text-orange-600 mt-1">
                {formatCurrency(myTransactionsStats?.qurban_total || 0)}
              </p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 font-bold text-sm">Q</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Regulasi Relawan</p>
              <p className="text-lg font-bold text-teal-600 mt-1">
                {formatCurrency(myTransactionsStats?.volunteer_regulation || 0)}
              </p>
            </div>
            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
              <span className="text-teal-600 font-bold text-sm">R</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Menunggu Validasi</p>
              <p className="text-lg font-bold text-yellow-600 mt-1">{pendingCount}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 font-bold text-sm">!</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Double Duta</p>
              <p className="text-lg font-bold text-blue-600 mt-1">{doubleDutaCount}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">DD</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Double Input</p>
              <p className="text-lg font-bold text-purple-600 mt-1">{doubleInputCount}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-bold text-sm">DI</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Tidak di Rekening</p>
              <p className="text-lg font-bold text-red-600 mt-1">{notInAccountCount}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 font-bold text-sm">NR</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Lainnya</p>
              <p className="text-lg font-bold text-gray-600 mt-1">{otherCount}</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-bold text-sm">L</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total Transaksi</p>
              <p className="text-lg font-bold text-indigo-600 mt-1">{filteredTransactions.length}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-indigo-600 font-bold text-sm">#</span>
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
              <option value="menunggu validasi">Menunggu Validasi</option>
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
                <th className="text-left py-4 px-6 font-medium text-gray-700">Regulasi</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Bank</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Tanggal</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Status</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {(filteredTransactions || []).map((transaction) => (
                <tr key={transaction.id} className="border-b border-gray-100">
                  <td className="py-4 px-6 text-gray-600">#{transaction.id}</td>
                  <td className="py-4 px-6 font-medium">{transaction.donorName || transaction.donor_name || '-'}</td>
                  {user?.role === 'branch' && (
                    <td className="py-4 px-6">{getTeamName(transaction)}</td>
                  )}
                  <td className="py-4 px-6">{getVolunteerName(transaction)}</td>
                  <td className="py-4 px-6">{getProgramName(transaction)}</td>
                  <td className="py-4 px-6 font-medium text-green-600">
                    {(transaction.program_type === 'QURBAN' && (transaction.qurban_amount || transaction.ziswaf_program_id)) ? (
                      <div className="space-y-1">
                         {transaction.qurban_amount && (
                               <div className="text-sm">
                                 <span className="text-gray-600">Nominal Qurban:</span>
                                 <span className="ml-1 font-medium">{formatCurrency(transaction.qurban_amount || 0)}</span>
                               </div>
                             )}
                             <div className="text-sm">
                               <span className="text-gray-600">Nominal Donasi:</span>
                               <span className="ml-1 font-medium">{formatCurrency(transaction.amount || 0)}</span>
                             </div>
                             <div className="text-sm border-t pt-1 mt-1">
                               <span className="text-gray-600 font-semibold">Nominal Total:</span>
                               <span className="ml-1 font-bold text-green-700">{formatCurrency((Number(transaction.qurban_amount) || 0) + (Number(transaction.amount) || 0))}</span>
                             </div>
                       </div>
                    ) : (
                      formatCurrency(transaction.amount)
                    )}
                  </td>
                  <td className="py-4 px-6 font-medium text-blue-600">
                    {(() => {
                      let volunteerCommission = 0;
                      
                      if (transaction.program_type === 'ZISWAF') {
                        const volunteerRate = transaction.ziswaf_volunteer_rate || transaction.volunteer_rate || 0;
                        const amount = Number(transaction.amount) || 0;
                        volunteerCommission = amount * volunteerRate / 100;
                      } else if (transaction.program_type === 'QURBAN') {
                        if (transaction.ziswaf_program_id) {
                          // QURBAN dengan komponen ZISWAF
                          const qurbanVolunteerRate = transaction.volunteer_rate || 0;
                          const ziswafVolunteerRate = transaction.ziswaf_volunteer_rate || 0;
                          
                          const qurbanAmount = Number(transaction.qurban_amount) || 0;
                          const ziswafAmount = Number(transaction.amount) || 0;
                          
                          volunteerCommission = (qurbanAmount * qurbanVolunteerRate / 100) + (ziswafAmount * ziswafVolunteerRate / 100);
                        } else {
                          // QURBAN tanpa komponen ZISWAF
                          const volunteerRate = transaction.volunteer_rate || 0;
                          const amount = Number(transaction.qurban_amount) || 0;
                          volunteerCommission = amount * volunteerRate / 100;
                        }
                      }
                      
                      return (
                        <div className="text-sm">
                          <span className="text-gray-600">Relawan:</span>
                          <span className="ml-1 font-medium">{formatCurrency(volunteerCommission)}</span>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="py-4 px-6">{transaction.paymentMethod?.name || transaction.transferMethod || '-'}</td>
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
                        <button 
                          onClick={() => handleEdit(transaction)}
                          className="text-green-600 hover:text-green-800" 
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete(transaction) && (
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
          {(filteredTransactions || []).map((transaction) => (
            <div key={transaction.id} className="border-b border-gray-100 p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">#{transaction.id}</h3>
                  <p className="text-sm text-gray-600">{transaction.donorName || transaction.donor_name || '-'}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                  {getStatusLabel(transaction.status)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div>
                  <span className="text-gray-500">Nominal:</span>
                  {(transaction.program_type === 'QURBAN' && (transaction.qurban_amount || transaction.ziswaf_program_id)) ? (
                    <div className="space-y-1">
                       {transaction.qurban_amount && (
                         <div className="text-sm">
                           <span className="text-gray-600">Nominal Qurban:</span>
                           <span className="ml-1 font-medium text-green-600">{formatCurrency(transaction.qurban_amount || 0)}</span>
                         </div>
                       )}
                       <div className="text-sm">
                          <span className="text-gray-600">Nominal Donasi:</span>
                          <span className="ml-1 font-medium text-green-600">{formatCurrency(transaction.amount || 0)}</span>
                        </div>
                       <div className="text-sm border-t pt-1 mt-1">
                         <span className="text-gray-600 font-semibold">Nominal Total:</span>
                         <span className="ml-1 font-bold text-green-700">{formatCurrency((Number(transaction.qurban_amount) || 0) + (Number(transaction.amount) || 0))}</span>
                       </div>
                     </div>
                  ) : (
                    <p className="font-medium text-green-600">{formatCurrency(transaction.amount)}</p>
                  )}
                </div>
                <div>
                  <span className="text-gray-500">Tanggal:</span>
                  <p className="text-gray-900">
                    {formatDate(transaction.transaction_date || transaction.transactionDate || transaction.created_at || transaction.createdAt)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Regulasi:</span>
                  <div className="text-blue-600 text-sm">
                    {(() => {
                      let volunteerCommission = 0;
                      
                      if (transaction.program_type === 'ZISWAF') {
                        const volunteerRate = transaction.ziswaf_volunteer_rate || transaction.volunteer_rate || 0;
                        const amount = Number(transaction.amount) || 0;
                        volunteerCommission = amount * volunteerRate / 100;
                      } else if (transaction.program_type === 'QURBAN') {
                        if (transaction.ziswaf_program_id) {
                          // QURBAN dengan komponen ZISWAF
                          const qurbanVolunteerRate = transaction.volunteer_rate || 0;
                          const ziswafVolunteerRate = transaction.ziswaf_volunteer_rate || 0;
                          
                          const qurbanAmount = Number(transaction.qurban_amount) || 0;
                          const ziswafAmount = Number(transaction.amount) || 0;
                          
                          volunteerCommission = (qurbanAmount * qurbanVolunteerRate / 100) + (ziswafAmount * ziswafVolunteerRate / 100);
                        } else {
                          // QURBAN tanpa komponen ZISWAF
                          const volunteerRate = transaction.volunteer_rate || 0;
                          const amount = Number(transaction.qurban_amount) || 0;
                          volunteerCommission = amount * volunteerRate / 100;
                        }
                      }
                      
                      return (
                        <div>
                          <span className="text-gray-600">Relawan: </span>
                          <span className="font-medium">{formatCurrency(volunteerCommission)}</span>
                        </div>
                      );
                    })()}
                  </div>
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
                  <div className="text-gray-900">{getProgramName(transaction)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Bank:</span>
                  <p className="text-gray-900">{transaction.paymentMethod?.name || transaction.transferMethod || '-'}</p>
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
                  <button 
                    onClick={() => handleEdit(transaction)}
                    className="text-green-600 hover:text-green-800 p-2" 
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
                {canDelete(transaction) && (
                  <button
                    onClick={() => handleDelete(transaction.id)}
                    className="text-red-600 hover:text-red-800 p-2"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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

      {/* Edit Transaction Modal */}
      {isModalOpen && editingTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Transaksi #{editingTransaction.id}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form id="edit-transaction-form" onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Donatur <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.donorName}
                    onChange={(e) => setFormData({ ...formData, donorName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jenis Program <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.programType}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      programType: e.target.value as 'ZISWAF' | 'QURBAN',
                      programId: ''
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  >
                    <option value="ZISWAF">ZISWAF</option>
                    <option value="QURBAN">QURBAN</option>
                  </select>
                </div>
              </div>
                 
                 {/* Nama Pengqurban - Only for QURBAN */}
                 {formData.programType === 'QURBAN' && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">
                         Nama Pengqurban <span className="text-red-500">*</span>
                       </label>
                       <input
                         type="text"
                         value={formData.qurbanOwnerName}
                         onChange={(e) => setFormData({ ...formData, qurbanOwnerName: e.target.value })}
                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                         placeholder="Masukkan nama pengqurban"
                         required
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">
                         Nominal Qurban <span className="text-red-500">*</span>
                       </label>
                       <div className="relative">
                         <span className="text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 font-medium text-sm">Rp</span>
                         <input
                           type="text"
                           value={formData.qurbanAmount ? new Intl.NumberFormat('id-ID').format(parseInt(formData.qurbanAmount)) : ''}
                           onChange={(e) => {
                             const value = e.target.value.replace(/\D/g, '');
                             setFormData({ ...formData, qurbanAmount: value });
                           }}
                           className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                           placeholder="0"
                           required
                         />
                       </div>
                       <p className="text-xs text-gray-500 mt-1">
                         Nilai: Rp {Number(formData.qurbanAmount) || 0}
                       </p>
                     </div>
                   </div>
                 )}
                 

                 

                
                {/* Type Hewan Qurban - 50% width */}
                {formData.programType === 'QURBAN' && (
                  <div className="mb-4 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type Hewan Qurban <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.programId}
                        onChange={(e) => setFormData({ ...formData, programId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required
                      >
                        <option value="">Pilih Type Hewan Qurban</option>
                        {(programs || []).filter(program => program.type === 'QURBAN').map(program => (
                          <option key={program.id} value={program.id}>
                            {program.name} ({program.code})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Tanggal Transaksi - 50% width */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tanggal Transaksi <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.transactionDate}
                        onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required
                      />
                    </div>
                  </div>
                )}
                
                {/* Program ZISWAF for QURBAN - 50% width */}
                {formData.programType === 'QURBAN' && (
                  <div className="mb-4 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Program ZISWAF (Opsional)
                      </label>
                      <select
                        value={formData.ziswafProgramId}
                        onChange={(e) => setFormData({ ...formData, ziswafProgramId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="">Pilih Program ZISWAF (Opsional)</option>
                        {(programs || []).filter(program => program.type === 'ZISWAF').map(program => (
                          <option key={program.id} value={program.id}>
                            {program.name} ({program.code})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Nominal Donasi - 50% width for QURBAN with ZISWAF */}
                    {formData.ziswafProgramId && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nominal Donasi <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 font-medium text-sm">Rp</span>
                          <input
                            type="text"
                            value={formData.amount ? new Intl.NumberFormat('id-ID').format(formData.amount) : ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              setFormData({ ...formData, amount: Number(value) });
                            }}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="0"
                            required
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Nilai: Rp {Number(formData.amount) || 0}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* For ZISWAF - Type Hewan Qurban and Tanggal Transaksi side by side */}
                {formData.programType === 'ZISWAF' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tanggal Transaksi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.transactionDate}
                      onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    />
                  </div>
                )}
                
                {/* Program ZISWAF - 50% width */}
                {formData.programType === 'ZISWAF' && (
                  <div className="mb-4 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Program ZISWAF <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.programId}
                        onChange={(e) => setFormData({ ...formData, programId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required
                      >
                        <option value="">Pilih Program</option>
                        {(programs || []).filter(program => program.type === 'ZISWAF').map(program => (
                          <option key={program.id} value={program.id}>
                            {program.name} ({program.code})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Nominal Donasi - 50% width for ZISWAF */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nominal Donasi <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 font-medium text-sm">Rp</span>
                        <input
                          type="text"
                          value={formData.amount ? new Intl.NumberFormat('id-ID').format(formData.amount) : ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            setFormData({ ...formData, amount: Number(value) });
                          }}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="0"
                          required
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Nilai: Rp {Number(formData.amount) || 0}
                      </p>
                    </div>
                  </div>
                )}
                

                
                {/* Metode Transfer and Cabang - 50% width each */}
                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Metode Transfer <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.paymentMethodId}
                      onChange={(e) => setFormData({ ...formData, paymentMethodId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    >
                      <option value="">Pilih Metode Transfer</option>
                      {(paymentMethods || []).map(method => (
                        <option key={method.id} value={method.id}>
                          {method.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cabang <span className="text-red-500">*</span>
                    </label>
                    {user?.role === 'volunteer' || user?.role === 'branch' ? (
                      <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm">
                        {(branches || []).find(branch => String(branch.id) === String(formData.branchId))?.name || 'Cabang tidak ditemukan'}
                      </div>
                    ) : (
                      <select
                        value={formData.branchId}
                        onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required
                      >
                        <option value="">Pilih Cabang</option>
                        {(branches || []).map(branch => (
                          <option key={branch.id} value={branch.id}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
                
                {/* Tim and Relawan - 50% width each */}
                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tim <span className="text-red-500">*</span>
                    </label>
                    {user?.role === 'volunteer' ? (
                      <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm">
                        {(teams || []).find(team => String(team.id) === String(formData.teamId))?.name || 'Tim tidak ditemukan'}
                      </div>
                    ) : (
                      <select
                        value={formData.teamId}
                        onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required
                      >
                        <option value="">Pilih Tim</option>
                        {(teams || []).map(team => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Relawan <span className="text-red-500">*</span>
                    </label>
                    {user?.role === 'volunteer' ? (
                      <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm">
                        {(volunteers || []).find(volunteer => String(volunteer.id) === String(formData.volunteerId))?.name || user?.name || 'Relawan tidak ditemukan'}
                      </div>
                    ) : (
                      <select
                        value={formData.volunteerId}
                        onChange={(e) => setFormData({ ...formData, volunteerId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required
                      >
                        <option value="">Pilih Relawan</option>
                        {(volunteers || []).map(volunteer => (
                          <option key={volunteer.id} value={volunteer.id}>
                            {volunteer.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
                
                {/* Status and Alasan Status - 50% width each */}
                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as Transaction['status'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    >
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
                      Alasan Status
                    </label>
                    <input
                      type="text"
                      value={formData.statusReason}
                      onChange={(e) => setFormData({ ...formData, statusReason: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Opsional"
                    />
                  </div>
                </div>
              
              {/* Bukti Transaksi - 100% width */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bukti Transaksi (Opsional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, proofImage: e.target.files?.[0] || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Kosongkan jika tidak ingin mengubah gambar
                </p>
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}