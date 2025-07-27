import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Edit, Trash2, Eye, Plus, X, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Transaction } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useTransactions } from '../../hooks/useTransactions';
import { useBranches } from '../../hooks/useBranches';
import { useTeams } from '../../hooks/useTeams';
import { usePrograms } from '../../hooks/usePrograms';
import { useUsers } from '../../hooks/useUsers';
import { usePaymentMethods } from '../../hooks/usePaymentMethods';
import Loader from '../Common/Loader';
import SearchableSelect from '../Common/SearchableSelect';

export default function AllTransactions() {
  const { user } = useAuth();
  const { transactions, isLoading, error, deleteTransaction, updateTransaction, bulkUpdateStatus, fetchTransactions } = useTransactions();
  const { branches } = useBranches();
  const { teams } = useTeams();
  const { programs } = usePrograms();
  const { users: volunteers } = useUsers();
  const { paymentMethods } = usePaymentMethods();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    datePreset: 'current_month',
    branchId: '',
    teamId: '',
    status: '',
    programType: '',
    volunteerName: '',
    bank: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState<{[key: string]: boolean}>({});
  const [isDateRangeModalOpen, setIsDateRangeModalOpen] = useState(false);
  const [tempDateFrom, setTempDateFrom] = useState('');
  const [tempDateTo, setTempDateTo] = useState('');
  const [formData, setFormData] = useState({
    donorName: '',
    amount: 0,
    transferMethod: '',
    programType: 'ZISWAF' as 'ZISWAF' | 'QURBAN',
    programId: '',
    qurbanOwnerName: '',
    qurbanAmount: '',
    ziswafProgramId: '',
    branchId: '',
    teamId: '',
    volunteerId: '',
    transactionDate: '',
    status: 'pending' as Transaction['status']
  });
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Reset selected transactions when filters change
  useEffect(() => {
    setSelectedTransactions([]);
  }, [filters, searchTerm]);

  // Bulk actions functions
  const handleSelectAll = () => {
    if (selectedTransactions.length === paginatedTransactions.length && paginatedTransactions.length > 0) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(paginatedTransactions.map(t => String(t.id)));
    }
  };

  const handleSelectTransaction = (transactionId: string) => {
    setSelectedTransactions(prev => {
      if (prev.includes(transactionId)) {
        return prev.filter(id => id !== transactionId);
      } else {
        return [...prev, transactionId];
      }
    });
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedTransactions.length === 0) return;

    const actionText = bulkAction === 'delete' ? 'menghapus' : 'mengubah status';
    const confirmMessage = `Apakah Anda yakin ingin ${actionText} ${selectedTransactions.length} transaksi yang dipilih?`;
    
    if (!window.confirm(confirmMessage)) return;

    setIsBulkProcessing(true);
    try {
      if (bulkAction === 'delete') {
        // Delete selected transactions
        for (const transactionId of selectedTransactions) {
          await deleteTransaction(Number(transactionId));
        }
        alert(`${selectedTransactions.length} transaksi berhasil dihapus`);
      } else {
        // Update status of selected transactions using bulk update
        await bulkUpdateStatus(selectedTransactions, bulkAction);
        alert(`Status ${selectedTransactions.length} transaksi berhasil diubah`);
      }
      
      // Reset selections
      setSelectedTransactions([]);
      setBulkAction('');
      
      // Refresh transactions to ensure UI is updated
      const params: any = {};
      if (filters.datePreset && filters.datePreset !== 'all') {
        params.date_preset = filters.datePreset;
      } else if (filters.dateFrom || filters.dateTo) {
        if (filters.dateFrom) params.date_from = filters.dateFrom;
        if (filters.dateTo) params.date_to = filters.dateTo;
      }
      if (filters.branchId) params.branch_id = filters.branchId;
      if (filters.teamId) params.team_id = filters.teamId;
      if (filters.status) params.status = filters.status;
      if (filters.programType) params.program_type = filters.programType;
      
      await fetchTransactions(params);
    } catch (error: any) {
      console.error('Bulk action error:', error);
      alert('Terjadi kesalahan: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Fetch transactions with filters
  useEffect(() => {
    const loadTransactions = async () => {
      const params: any = {};
      
      if (filters.datePreset && filters.datePreset !== 'all') {
        params.date_preset = filters.datePreset;
      } else if (filters.dateFrom || filters.dateTo) {
        if (filters.dateFrom) params.date_from = filters.dateFrom;
        if (filters.dateTo) params.date_to = filters.dateTo;
      }
      
      if (filters.branchId) params.branch_id = filters.branchId;
      if (filters.teamId) params.team_id = filters.teamId;
      if (filters.status) params.status = filters.status;
      if (filters.programType) params.program_type = filters.programType;
      
      // For volunteer role, automatically filter by their data
      if (user?.role === 'volunteer') {
        params.volunteer_id = user.id;
        params.branch_id = user.branchId || user.branch_id;
        params.team_id = user.teamId || user.team_id;
      }
      
      await fetchTransactions(params);
    };
    
    loadTransactions();
  }, [filters.datePreset, filters.dateFrom, filters.dateTo, filters.branchId, filters.teamId, filters.status, filters.programType, user]);

  const filteredTransactions = transactions.filter(transaction => {
    if (!transaction) return false;
    
    // Filter by volunteer name
    if (filters.volunteerName && getVolunteerName(transaction) !== filters.volunteerName) return false;
    
    // Filter by bank
    if (filters.bank && (transaction.transferMethod || transaction.transfer_method) !== filters.bank) return false;
    
    // Search filter
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      const searchableFields = [
        transaction.donorName || transaction.donor_name || '',
        transaction.transferMethod || transaction.transfer_method || '',
        getBranchName(transaction),
        getTeamName(transaction),
        getVolunteerName(transaction),
        getProgramName(transaction),
        transaction.amount?.toString() || '',
        transaction.id?.toString() || ''
      ];
      
      const matchesSearch = searchableFields.some(field => 
        field.toLowerCase().includes(searchTermLower)
      );
      
      if (!matchesSearch) return false;
    }
    
    return true;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm]);

  const handleEdit = (transaction: Transaction) => {
    console.log('Editing transaction:', transaction);
    
    setEditingTransaction(transaction);
    
    // Extract IDs from transaction data (backend uses snake_case)
    const branchId = String(transaction.branch_id || transaction.branchId || '');
    const teamId = String(transaction.team_id || transaction.teamId || '');
    const volunteerId = String(transaction.volunteer_id || transaction.volunteerId || '');
    const programId = String(transaction.program_id || transaction.programId || '');
    
    console.log('Extracted IDs from transaction:', {
      branchId,
      teamId,
      volunteerId,
      programId,
      availableTeams: teams.length,
      availableVolunteers: volunteers.length
    });
    
    // Format transaction date for date input (YYYY-MM-DD)
    let formattedDate = '';
    if (transaction.transaction_date) {
      // If transaction_date exists, use it and format to YYYY-MM-DD
      formattedDate = new Date(transaction.transaction_date).toISOString().split('T')[0];
    } else if (transaction.transactionDate) {
      // If camelCase transactionDate exists, use it
      formattedDate = new Date(transaction.transactionDate).toISOString().split('T')[0];
    } else if (transaction.created_at) {
      // Fallback to created_at
      formattedDate = new Date(transaction.created_at).toISOString().split('T')[0];
    } else if (transaction.createdAt) {
      // Fallback to camelCase createdAt
      formattedDate = new Date(transaction.createdAt).toISOString().split('T')[0];
    }
    
    setFormData({
      donorName: transaction.donorName || transaction.donor_name || '',
      amount: transaction.amount || 0,
      transferMethod: transaction.transferMethod || transaction.transfer_method || '',
      programType: (transaction.program?.type || 'ZISWAF') as 'ZISWAF' | 'QURBAN',
      programId: programId,
      qurbanOwnerName: transaction.qurban_owner_name || '',
      qurbanAmount: transaction.qurban_amount || '',
      ziswafProgramId: transaction.ziswaf_program_id || '',
      branchId: branchId,
      teamId: teamId,
      volunteerId: volunteerId,
      transactionDate: formattedDate,
      status: transaction.status || 'pending'
    });
    
    setIsModalOpen(true);
  };

  // Filter teams based on selected branch
  const filteredTeams = formData.branchId 
    ? teams.filter(team => {
        const teamBranchId = team.branchId || team.branch_id;
        return teamBranchId ? String(teamBranchId) === String(formData.branchId) : false;
      })
    : teams;

  // Filter volunteers based on selected team
  const filteredVolunteers = formData.teamId 
    ? volunteers.filter(volunteer => {
        const volunteerTeamId = volunteer.teamId || volunteer.team_id;
        return volunteerTeamId ? String(volunteerTeamId) === String(formData.teamId) : false;
      })
    : volunteers;

  // Reset team selection when branch changes in edit form
  useEffect(() => {
    if (formData.branchId && formData.teamId) {
      const isTeamValid = teams.some(team => {
        const teamBranchId = team.branchId || team.branch_id;
        return String(team.id) === String(formData.teamId) && 
               teamBranchId ? String(teamBranchId) === String(formData.branchId) : false;
      });
      if (!isTeamValid) {
        console.log('Resetting team selection due to branch change');
        setFormData(prev => ({ ...prev, teamId: '', volunteerId: '' }));
      }
    }
  }, [formData.branchId, teams]);

  // Reset volunteer selection when team changes in edit form
  useEffect(() => {
    if (formData.teamId && formData.volunteerId) {
      const isVolunteerValid = volunteers.some(volunteer => {
        const volunteerTeamId = volunteer.teamId || volunteer.team_id;
        return String(volunteer.id) === String(formData.volunteerId) && 
               volunteerTeamId ? String(volunteerTeamId) === String(formData.teamId) : false;
      });
      if (!isVolunteerValid) {
        console.log('Resetting volunteer selection due to team change');
        setFormData(prev => ({ ...prev, volunteerId: '' }));
      }
    }
  }, [formData.teamId, volunteers]);

  // Auto-populate team and volunteer when data is loaded and form is open
  useEffect(() => {
    if (isModalOpen && editingTransaction && teams.length > 0 && volunteers.length > 0 && formData.branchId) {
      const transactionTeamId = String(editingTransaction.team_id || editingTransaction.teamId || '');
      const transactionVolunteerId = String(editingTransaction.volunteer_id || editingTransaction.volunteerId || '');
      
      console.log('Auto-populate check:', {
        transactionTeamId,
        transactionVolunteerId,
        currentFormTeamId: formData.teamId,
        currentFormVolunteerId: formData.volunteerId,
        branchId: formData.branchId
      });
      
      // If team is not set but should be, try to set it
      if (!formData.teamId && transactionTeamId) {
        const foundTeam = teams.find(t => {
          const teamMatches = String(t.id) === transactionTeamId;
          const teamBranchId = t.branchId || t.branch_id;
          const branchMatches = teamBranchId ? String(teamBranchId) === String(formData.branchId) : false;
          console.log('Team check:', { team: t, teamMatches, branchMatches, teamBranchId });
          return teamMatches && branchMatches;
        });
        
        if (foundTeam) {
          console.log('Auto-setting team:', foundTeam);
          setFormData(prev => ({ ...prev, teamId: String(foundTeam.id) }));
        } else {
          console.log('Team not found or does not belong to branch');
        }
      }
      
      // If volunteer is not set but should be, try to set it
      if (!formData.volunteerId && transactionVolunteerId && formData.teamId) {
        const foundVolunteer = volunteers.find(v => {
          const volunteerMatches = String(v.id) === transactionVolunteerId;
          const volunteerTeamId = v.teamId || v.team_id;
          const teamMatches = volunteerTeamId ? String(volunteerTeamId) === String(formData.teamId) : false;
          console.log('Volunteer check:', { volunteer: v, volunteerMatches, teamMatches, volunteerTeamId });
          return volunteerMatches && teamMatches;
        });
        
        if (foundVolunteer) {
          console.log('Auto-setting volunteer:', foundVolunteer);
          setFormData(prev => ({ ...prev, volunteerId: String(foundVolunteer.id) }));
        } else {
          console.log('Volunteer not found or does not belong to team');
        }
      }
    }
  }, [isModalOpen, editingTransaction, teams, volunteers, formData.branchId, formData.teamId]);

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

  const handleDateFilterChange = (datePreset: string) => {
    if (datePreset === 'custom') {
      setTempDateFrom(filters.dateFrom);
      setTempDateTo(filters.dateTo);
      setIsDateRangeModalOpen(true);
    } else {
      setFilters({ ...filters, datePreset, dateFrom: '', dateTo: '' });
    }
  };

  const handleDateRangeSubmit = () => {
    if (tempDateFrom && tempDateTo) {
      setFilters({ 
        ...filters, 
        datePreset: 'custom', 
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
    if (filters.datePreset === 'custom' && filters.dateFrom && filters.dateTo) {
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
    return presetLabels[filters.datePreset as keyof typeof presetLabels] || 'Bulan Ini';
  };

  const handleDelete = async (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    const donorName = transaction?.donorName || transaction?.donor_name || 'Tidak diketahui';
    
    if (window.confirm(`Apakah Anda yakin ingin menghapus transaksi dari ${donorName}?\n\nTindakan ini tidak dapat dibatalkan.`)) {
      try {
        await deleteTransaction(id);
        alert('Transaksi berhasil dihapus');
        
        // Refresh transactions to ensure UI is updated
        const params: any = {};
        if (filters.datePreset && filters.datePreset !== 'all') {
          params.date_preset = filters.datePreset;
        } else if (filters.dateFrom || filters.dateTo) {
          if (filters.dateFrom) params.date_from = filters.dateFrom;
          if (filters.dateTo) params.date_to = filters.dateTo;
        }
        if (filters.branchId) params.branch_id = filters.branchId;
        if (filters.teamId) params.team_id = filters.teamId;
        if (filters.status) params.status = filters.status;
        if (filters.programType) params.program_type = filters.programType;
        
        await fetchTransactions(params);
      } catch (err: any) {
        console.error('Error deleting transaction:', err);
        alert('Gagal menghapus transaksi: ' + (err.response?.data?.message || err.message));
      }
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
    if (!formData.transferMethod.trim()) {
      alert('Metode transfer harus diisi');
      return;
    }
    if (!formData.programId) {
      alert('Program harus dipilih');
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

    setIsSubmitting(true);
    try {
      // Get program type from selected program
      const selectedProgram = programs.find(p => p.id === formData.programId);
      const programType = selectedProgram?.type || 'ZISWAF'; // Default to ZISWAF if not found
      
      const updateData: any = {
        donor_name: formData.donorName,
        transfer_method: formData.transferMethod,
        program_type: formData.programType,
        program_id: formData.programId,
        branch_id: formData.branchId,
        team_id: formData.teamId,
        volunteer_id: formData.volunteerId,
        transaction_date: formData.transactionDate,
        status: formData.status
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
      
      // Add amount only if it's filled or required (ZISWAF or QURBAN with ziswaf program)
      if (formData.amount || formData.programType === 'ZISWAF' || formData.ziswafProgramId) {
        updateData.amount = formData.amount;
      }
      
      const updatedTransaction = await updateTransaction(String(editingTransaction.id), updateData);
      setIsModalOpen(false);
      setEditingTransaction(null);
      alert('Transaksi berhasil diperbarui');
      
      // Refresh transactions to ensure UI is updated
      const params: any = {};
      if (filters.datePreset && filters.datePreset !== 'all') {
        params.date_preset = filters.datePreset;
      } else if (filters.dateFrom || filters.dateTo) {
        if (filters.dateFrom) params.date_from = filters.dateFrom;
        if (filters.dateTo) params.date_to = filters.dateTo;
      }
      if (filters.branchId) params.branch_id = filters.branchId;
      if (filters.teamId) params.team_id = filters.teamId;
      if (filters.status) params.status = filters.status;
      if (filters.programType) params.program_type = filters.programType;
      
      await fetchTransactions(params);
    } catch (err: any) {
      console.error('Error updating transaction:', err);
      alert('Gagal memperbarui transaksi: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
    setFormData({
      donorName: '',
      amount: 0,
      transferMethod: '',
      programType: 'ZISWAF' as 'ZISWAF' | 'QURBAN',
      programId: '',
      qurbanOwnerName: '',
      qurbanAmount: '',
      ziswafProgramId: '',
      branchId: '',
      teamId: '',
      volunteerId: '',
      transactionDate: '',
      status: 'pending'
    });
  };



  const getBranchName = (transaction: Transaction) => {
    if (!transaction) return '-';
    
    if (transaction.branch?.name) {
      return transaction.branch.name;
    }
    
    const branchId = transaction.branchId || transaction.branch_id;
    if (branchId) {
      const branch = branches.find(b => String(b.id) === String(branchId));
      return branch?.name || '-';
    }
    
    return '-';
  };

  const getTeamName = (transaction: Transaction) => {
    if (!transaction) return '-';
    
    // First check if team object is embedded
    if (transaction.team?.name) {
      return transaction.team.name;
    }
    
    // Fallback: find team by ID from multiple possible field names
    const teamId = String(
      transaction.team_id || 
      transaction.teamId || 
      transaction.team?.id || 
      ''
    );
    
    if (teamId) {
      const team = teams.find(t => String(t.id) === teamId);
      if (team?.name) {
        return team.name;
      }
    }
    
    // Additional fallback: check if there's a team name field directly
    if (transaction.team_name) {
      return transaction.team_name;
    }
    
    console.log('Could not find team name for transaction:', {
      transaction,
      teamId,
      availableTeams: teams.length
    });
    
    return '-';
  };

  const getProgramName = (transaction: Transaction) => {
    if (!transaction) return '-';
    
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

  const getVolunteerName = (transaction: Transaction) => {
    if (!transaction) return '-';
    
    // First check if volunteer object is embedded
    if (transaction.volunteer?.name) {
      return transaction.volunteer.name;
    }
    
    // Fallback: find volunteer by ID from multiple possible field names
    const volunteerId = String(
      transaction.volunteer_id || 
      transaction.volunteerId || 
      transaction.volunteer?.id || 
      ''
    );
    
    if (volunteerId) {
      const volunteer = volunteers.find(v => String(v.id) === volunteerId);
      if (volunteer?.name) {
        return volunteer.name;
      }
    }
    
    // Additional fallback: check if there's a volunteer name field directly
    if (transaction.volunteer_name) {
      return transaction.volunteer_name;
    }
    
    console.log('Could not find volunteer name for transaction:', {
      transaction,
      volunteerId,
      availableVolunteers: volunteers.length
    });
    
    return '-';
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

  const formatCurrencyInput = (value: string) => {
    const number = value.replace(/\D/g, '');
    return new Intl.NumberFormat('id-ID').format(parseInt(number) || 0);
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

  // Get unique values from all transactions for dropdown filters
  const getUniqueValues = () => {
    // If no transactions, show all available options
    if (transactions.length === 0) {
      return {
        branches: branches,
        teams: teams,
        volunteers: [],
        banks: []
      };
    }
    
    const uniqueBranchIds = Array.from(new Set(
      transactions
        .filter(t => t != null)
        .map(t => {
          const branchId = t.branchId || t.branch_id;
          return branchId ? String(branchId) : null;
        })
        .filter(Boolean)
    ));
    
    const uniqueBranches = uniqueBranchIds.length > 0 
      ? uniqueBranchIds
          .map(branchId => branches.find(b => String(b.id) === String(branchId)))
          .filter(branch => branch !== undefined)
      : branches;
    
    const uniqueTeamIds = Array.from(new Set(
      transactions
        .filter(t => t != null)
        .map(t => {
          const teamId = t.teamId || t.team_id;
          return teamId ? String(teamId) : null;
        })
        .filter(Boolean)
    ));
    
    const uniqueTeams = uniqueTeamIds.length > 0
      ? uniqueTeamIds
          .map(teamId => teams.find(t => String(t.id) === String(teamId)))
          .filter(team => team !== undefined)
      : teams;
    
    const uniqueVolunteers = Array.from(new Set(
      transactions
        .filter(t => t != null)
        .map(t => getVolunteerName(t))
        .filter(name => name && name !== '-')
    ));
    
    const uniqueBanks = Array.from(new Set(
      transactions
        .filter(t => t != null)
        .map(t => t.transferMethod || t.transfer_method)
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

  const exportToExcel = () => {
    try {
      // Prepare data for export
      const exportData = filteredTransactions.map((transaction, index) => {
        const programName = getProgramName(transaction);
        const isQurban = programName.toLowerCase().includes('qurban');
        
        return {
          'No': index + 1,
          'ID Transaksi': transaction.id,
          'Nama Donatur': transaction.donorName || transaction.donor_name || '-',
          'Cabang': getBranchName(transaction),
          'Tim': getTeamName(transaction),
          'Relawan': getVolunteerName(transaction),
          'Program': programName,
          'Jenis Program': isQurban ? 'QURBAN' : 'ZISWAF',
          'Nominal': transaction.amount || 0,
          'Nominal Qurban': isQurban && transaction.qurban_amount ? transaction.qurban_amount : '-',
          'Total Nominal': isQurban && transaction.qurban_amount ? 
            (transaction.amount || 0) + (transaction.qurban_amount || 0) : 
            (transaction.amount || 0),
          'Bank': transaction.transferMethod || transaction.transfer_method || '-',
          'Status': getStatusLabel(transaction.status),
          'Alasan': transaction.statusReason || transaction.status_reason || '-',
          'Tanggal Transaksi': formatDate(transaction.created_at || transaction.createdAt),
          'Tanggal Update': formatDate(transaction.updated_at || transaction.updatedAt)
        };
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const colWidths = [
        { wch: 5 },   // No
        { wch: 12 },  // ID Transaksi
        { wch: 20 },  // Nama Donatur
        { wch: 15 },  // Cabang
        { wch: 15 },  // Tim
        { wch: 20 },  // Relawan
        { wch: 25 },  // Program
        { wch: 12 },  // Jenis Program
        { wch: 15 },  // Nominal
        { wch: 15 },  // Nominal Qurban
        { wch: 15 },  // Total Nominal
        { wch: 15 },  // Bank
        { wch: 15 },  // Status
        { wch: 20 },  // Alasan
        { wch: 18 },  // Tanggal Transaksi
        { wch: 18 }   // Tanggal Update
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Transaksi');

      // Generate filename with current date
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const filename = `Transaksi_${dateStr}_${timeStr}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);
      
      // Show success message
      alert(`Data berhasil diekspor ke file: ${filename}`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Terjadi kesalahan saat mengekspor data ke Excel');
    }
  };

  if (isLoading) {
    return <Loader text="Memuat Data" size="medium" />;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Semua Transaksi</h1>
          <p className="text-gray-600 mt-2">Kelola dan pantau semua transaksi donasi</p>
        </div>
        <div className="flex space-x-3">
          {selectedTransactions.length > 0 && (
            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center space-x-2"
            >
              <Edit className="w-5 h-5" />
              <span>Aksi Bulk ({selectedTransactions.length})</span>
            </button>
          )}
          <button
            onClick={exportToExcel}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
        {/* Search - Full width on mobile */}
        <div className="mb-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama donatur, bank, cabang, tim, relawan, program, nominal, atau ID transaksi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filter Header */}
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filter:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter Tanggal
            </label>
            <div className="flex gap-2">
              <select
                value={filters.datePreset}
                onChange={(e) => handleDateFilterChange(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="current_month">Bulan Ini</option>
                <option value="1_month_back">1 Bulan Lalu</option>
                <option value="2_months_back">2 Bulan Lalu</option>
                <option value="last_3_months">3 Bulan Terakhir</option>
                <option value="all">Semua Tanggal</option>
                <option value="custom">Pilih Tanggal</option>
              </select>
              {filters.datePreset === 'custom' && (
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
            {filters.datePreset === 'custom' && filters.dateFrom && filters.dateTo && (
              <div className="mt-1 text-xs text-gray-600">
                {getCurrentDateFilterLabel()}
              </div>
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
                  value: branch?.id || '',
                  label: branch?.name || ''
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
                  value: team?.id || '',
                  label: team?.name || ''
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <SearchableSelect
              options={[
                { value: '', label: 'Semua Status' },
                { value: 'pending', label: 'Menunggu Validasi' },
                { value: 'valid', label: 'Tervalidasi' },
                { value: 'double_duta', label: 'Double Duta' },
                { value: 'double_input', label: 'Double Input' },
                { value: 'not_in_account', label: 'Tidak Ada di Rekening' },
                { value: 'other', label: 'Lainnya' }
              ]}
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
              placeholder="Pilih Status..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jenis Program
            </label>
            <SearchableSelect
              options={[
                { value: '', label: 'Semua Jenis' },
                { value: 'ZISWAF', label: 'ZISWAF' },
                { value: 'QURBAN', label: 'QURBAN' }
              ]}
              value={filters.programType}
              onChange={(value) => setFilters({ ...filters, programType: value })}
              placeholder="Pilih Jenis Program..."
            />
          </div>
        </div>
      </div>

      {/* Bulk Actions Panel */}
      {selectedTransactions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-800">
                {selectedTransactions.length} transaksi dipilih
              </span>
              <button
                onClick={() => setSelectedTransactions([])}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Batal Pilih
              </button>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Pilih Aksi</option>
                <option value="valid">Ubah ke Tervalidasi</option>
                <option value="pending">Ubah ke Menunggu Validasi</option>
                <option value="double_duta">Ubah ke Double Duta</option>
                <option value="double_input">Ubah ke Double Input</option>
                <option value="not_in_account">Ubah ke Tidak Ada di Rekening</option>
                <option value="other">Ubah ke Lainnya</option>
                <option value="delete">Hapus Transaksi</option>
              </select>
              <button
                onClick={handleBulkAction}
                disabled={!bulkAction || isBulkProcessing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
              >
                {isBulkProcessing ? 'Memproses...' : 'Terapkan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">
            Daftar Transaksi ({filteredTransactions.length})
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)} dari {filteredTransactions.length} transaksi
          </p>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-medium text-gray-700 w-12">
                  <input
                    type="checkbox"
                    checked={selectedTransactions.length === paginatedTransactions.length && paginatedTransactions.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">ID</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Donatur</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Cabang</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Tim</th>
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
              {paginatedTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-gray-100">
                  <td className="py-4 px-6">
                    <input
                      type="checkbox"
                      checked={selectedTransactions.includes(String(transaction.id))}
                      onChange={() => handleSelectTransaction(String(transaction.id))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-4 px-6 text-gray-600">#{transaction.id}</td>
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
                  <td className="py-4 px-6">{transaction.transferMethod || '-'}</td>
                  <td className="py-4 px-6 text-gray-600">
                    {formatDate(transaction.created_at || transaction.createdAt)}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                      {getStatusLabel(transaction.status)}
                    </span>
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
                      <button 
                        onClick={() => handleEdit(transaction)}
                        className="text-green-600 hover:text-green-800" 
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Mobile/Tablet Card View */}
        <div className="lg:hidden">
          {paginatedTransactions.map((transaction) => (
            <div key={transaction.id} className="border-b border-gray-100 p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedTransactions.includes(String(transaction.id))}
                    onChange={() => handleSelectTransaction(String(transaction.id))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                  />
                  <div>
                    <h3 className="font-medium text-gray-900">#{transaction.id}</h3>
                    <p className="text-sm text-gray-600">{transaction.donorName || '-'}</p>
                  </div>
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
                    {formatDate(transaction.created_at || transaction.createdAt)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Cabang:</span>
                  <p className="text-gray-900">{getBranchName(transaction)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Tim:</span>
                  <p className="text-gray-900">{getTeamName(transaction)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Relawan:</span>
                  <p className="text-gray-900">{getVolunteerName(transaction)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Program:</span>
                  <div className="text-gray-900">{getProgramName(transaction)}</div>
                </div>
              </div>
              
              {(transaction.transferMethod) && (
                <div className="mb-3">
                  <span className="text-gray-500 text-sm">Bank:</span>
                  <p className="text-gray-900 text-sm">{transaction.transferMethod}</p>
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
                <button 
                  onClick={() => handleEdit(transaction)}
                  className="text-green-600 hover:text-green-800 p-2" 
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(transaction.id)}
                  className="text-red-600 hover:text-red-800 p-2"
                  title="Hapus"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Tidak ada transaksi yang ditemukan</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 sm:p-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
              <div className="text-sm text-gray-700 order-2 sm:order-1">
                Halaman {currentPage} dari {totalPages}
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2 order-1 sm:order-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="hidden sm:inline">Sebelumnya</span>
                  <span className="sm:hidden">‹</span>
                </button>
                
                {/* Page numbers - responsive */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(window.innerWidth < 640 ? 3 : 5, totalPages) }, (_, i) => {
                    let pageNum;
                    const maxPages = window.innerWidth < 640 ? 3 : 5;
                    if (totalPages <= maxPages) {
                      pageNum = i + 1;
                    } else if (currentPage <= Math.floor(maxPages/2) + 1) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - Math.floor(maxPages/2)) {
                      pageNum = totalPages - maxPages + 1 + i;
                    } else {
                      pageNum = currentPage - Math.floor(maxPages/2) + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-2 sm:px-3 py-2 text-sm rounded-lg ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="hidden sm:inline">Selanjutnya</span>
                  <span className="sm:hidden">›</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 rounded-t-lg">
              <h3 className="text-lg font-semibold">Edit Transaksi</h3>
            </div>
            <form id="edit-transaction-form" onSubmit={handleSubmit}>
              <div className="px-4 sm:px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Donatur
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
                      Jenis Program
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
                        Nama Pengqurban
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
                        Nominal Qurban
                      </label>
                      <div className="relative">
                        <span className="text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 font-medium text-sm">Rp</span>
                        <input
                          type="text"
                          value={formatCurrencyInput(String(formData.qurbanAmount))}
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
                
                {/* Program ZISWAF - Optional for QURBAN */}
                {formData.programType === 'QURBAN' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Program ZISWAF (Opsional)
                    </label>
                    <select
                      value={formData.ziswafProgramId}
                      onChange={(e) => setFormData({ ...formData, ziswafProgramId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="">Pilih Program ZISWAF (Opsional)</option>
                      {programs.filter(program => program.type === 'ZISWAF').map(program => (
                        <option key={program.id} value={program.id}>
                          {program.name} ({program.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Amount - Always visible for ZISWAF, only visible for QURBAN when ZISWAF program selected */}
                {(formData.programType === 'ZISWAF' || (formData.programType === 'QURBAN' && formData.ziswafProgramId)) && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nominal Donasi
                    </label>
                    <div className="relative">
                      <span className="text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 font-medium text-sm">Rp</span>
                      <input
                        type="text"
                        value={formatCurrencyInput(String(formData.amount))}
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tanggal Transaksi
                    </label>
                    <input
                      type="date"
                      value={formData.transactionDate}
                      onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Metode Transfer
                    </label>
                    <select
                      value={formData.transferMethod}
                      onChange={(e) => setFormData({ ...formData, transferMethod: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    >
                      <option value="">Pilih Metode Transfer</option>
                      {paymentMethods.map(method => (
                        <option key={method.id} value={method.name}>{method.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.programType === 'QURBAN' ? 'Type Hewan Qurban' : 'Program'}
                  </label>
                  <select
                    value={formData.programId}
                    onChange={(e) => setFormData({ ...formData, programId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  >
                    <option value="">
                      {formData.programType === 'QURBAN' ? 'Pilih Type Hewan Qurban' : 'Pilih Program'}
                    </option>
                    {programs
                      .filter(program => program.type === formData.programType)
                      .map(program => (
                        <option key={program.id} value={program.id}>
                          {program.name} ({program.code})
                        </option>
                      ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cabang
                    </label>
                    <select
                      value={formData.branchId}
                      onChange={(e) => setFormData({ ...formData, branchId: e.target.value, teamId: '', volunteerId: '' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    >
                      <option value="">Pilih Cabang</option>
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
                      value={formData.teamId}
                      onChange={(e) => setFormData({ ...formData, teamId: e.target.value, volunteerId: '' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      disabled={!formData.branchId}
                      required
                    >
                      <option value="">{!formData.branchId ? 'Pilih cabang terlebih dahulu' : 'Pilih Tim'}</option>
                      {teams
                        .filter(team => {
                          const teamBranchId = team.branchId || team.branch_id;
                          const selectedBranchId = String(formData.branchId);
                          return teamBranchId ? String(teamBranchId) === selectedBranchId : false;
                        })
                        .map(team => (
                          <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Relawan
                    </label>
                    <select
                      value={formData.volunteerId}
                      onChange={(e) => setFormData({ ...formData, volunteerId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      disabled={!formData.teamId}
                      required
                    >
                      <option value="">{!formData.teamId ? 'Pilih tim terlebih dahulu' : 'Pilih Relawan'}</option>
                      {volunteers
                        .filter(volunteer => {
                          const volunteerTeamId = volunteer.teamId || volunteer.team_id;
                          const selectedTeamId = String(formData.teamId);
                          return volunteerTeamId ? String(volunteerTeamId) === selectedTeamId : false;
                        })
                        .map(volunteer => (
                          <option key={volunteer.id} value={volunteer.id}>{volunteer.name}</option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
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
                </div>
              </div>
            </form>
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-4 rounded-b-lg">
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                   type="button"
                   onClick={() => setIsModalOpen(false)}
                   className="w-full sm:w-auto px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                 >
                   Batal
                 </button>
                <button
                  type="submit"
                  form="edit-transaction-form"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2 text-sm"
                >
                  {isSubmitting && (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan'}</span>
                </button>
              </div>
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
                 const transactionId = paginatedTransactions.find(t => 
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