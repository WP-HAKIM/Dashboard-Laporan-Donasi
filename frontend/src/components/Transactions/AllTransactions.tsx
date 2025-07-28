import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Upload, FileDown, Edit, Trash2, Eye, Plus, X, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Transaction } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useTransactions } from '../../hooks/useTransactions';
import { useBranches } from '../../hooks/useBranches';
import { useTeams } from '../../hooks/useTeams';
import { usePrograms } from '../../hooks/usePrograms';
import { useUsers } from '../../hooks/useUsers';
import { usePaymentMethods } from '../../hooks/usePaymentMethods';
import { transactionsAPI } from '../../services/api';
import Loader from '../Common/Loader';
import SearchableSelect from '../Common/SearchableSelect';
import { formatDateForInput, convertInputToISO } from '../../utils/dateUtils';

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
  const [isMobile, setIsMobile] = useState(false);
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
    paymentMethodId: '',
    programType: 'ZISWAF' as 'ZISWAF' | 'QURBAN',
    programId: '',
    qurbanOwnerName: '',
    qurbanAmount: '',
    ziswafProgramId: '',
    branchId: '',
    teamId: '',
    volunteerId: '',
    transactionDate: '',
    status: 'pending' as Transaction['status'],
    statusReason: '',
    proofImage: null as File | null
  });
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    success: number;
    errors: Array<{ row: number; message: string }>;
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    // Check on mount
    checkMobile();
    
    // Add event listener for resize
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
        getProgramNameString(transaction),
        transaction.amount?.toString() || '',
        transaction.id?.toString() || ''
      ];
      
      const matchesSearch = searchableFields.some(field => 
        String(field).toLowerCase().includes(searchTermLower)
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
    
    // Format transaction date for datetime-local input with Indonesian timezone
    const transactionDate = transaction.transaction_date || transaction.transactionDate || transaction.created_at || transaction.createdAt;
    const formattedDate = formatDateForInput(transactionDate);
    
    const paymentMethodId = String(transaction.payment_method_id || transaction.paymentMethodId || '');
    
    setFormData({
      donorName: transaction.donorName || transaction.donor_name || '',
      amount: transaction.amount || 0,
      paymentMethodId: paymentMethodId,
      programType: (transaction.program?.type || 'ZISWAF') as 'ZISWAF' | 'QURBAN',
      programId: programId,
      qurbanOwnerName: transaction.qurban_owner_name || '',
      qurbanAmount: transaction.qurban_amount || '',
      ziswafProgramId: transaction.ziswaf_program_id || '',
      branchId: branchId,
      teamId: teamId,
      volunteerId: volunteerId,
      transactionDate: formattedDate,
      status: transaction.status || 'pending',
      statusReason: transaction.status_reason || transaction.statusReason || '',
      proofImage: null
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
    // Validate amount only for ZISWAF or QURBAN with ZISWAF program
    if (formData.programType === 'ZISWAF' || (formData.programType === 'QURBAN' && formData.ziswafProgramId)) {
      if (!formData.amount || formData.amount <= 0) {
        alert('Nominal donasi harus lebih dari 0');
        return;
      }
    }
    if (!formData.paymentMethodId) {
      alert('Metode pembayaran harus dipilih');
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
        payment_method_id: formData.paymentMethodId,
        program_type: formData.programType,
        program_id: formData.programId,
        branch_id: formData.branchId,
        team_id: formData.teamId,
        volunteer_id: formData.volunteerId,
        transaction_date: convertInputToISO(formData.transactionDate),
        status: formData.status,
        status_reason: formData.statusReason
      };
      
      // Add amount only if it's required (ZISWAF or QURBAN with ZISWAF program)
      if (formData.programType === 'ZISWAF' || (formData.programType === 'QURBAN' && formData.ziswafProgramId)) {
        updateData.amount = formData.amount;
      }
      
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
      paymentMethodId: '',
      programType: 'ZISWAF' as 'ZISWAF' | 'QURBAN',
      programId: '',
      qurbanOwnerName: '',
      qurbanAmount: '',
      ziswafProgramId: '',
      branchId: '',
      teamId: '',
      volunteerId: '',
      transactionDate: '',
      status: 'pending',
      statusReason: '',
      proofImage: null
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

  // Function to get program name as string for search purposes
  const getProgramNameString = (transaction: Transaction) => {
    if (!transaction) return '';
    
    const mainProgram = transaction.program?.name || programs.find(p => p.id === transaction.program_id)?.name || '';
    
    if (transaction.program_type === 'QURBAN') {
      const ziswafProgram = transaction.ziswaf_program?.name || 
        (transaction.ziswaf_program_id ? programs.find(p => p.id === transaction.ziswaf_program_id)?.name : '');
      
      return `${mainProgram} ${ziswafProgram}`.trim();
    }
    
    return mainProgram;
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
        
        // Calculate regulation amounts
        let volunteerCommission = 0;
        let branchCommission = 0;
        
        if (transaction.program_type === 'ZISWAF') {
          const volunteerRate = transaction.ziswaf_volunteer_rate || transaction.volunteer_rate || 0;
          const branchRate = transaction.ziswaf_branch_rate || transaction.branch_rate || 0;
          const amount = Number(transaction.amount) || 0;
          volunteerCommission = amount * volunteerRate / 100;
          branchCommission = amount * branchRate / 100;
        } else if (transaction.program_type === 'QURBAN') {
          if (transaction.ziswaf_program_id) {
            // QURBAN dengan komponen ZISWAF
            const qurbanVolunteerRate = transaction.volunteer_rate || 0;
            const ziswafVolunteerRate = transaction.ziswaf_volunteer_rate || 0;
            const qurbanBranchRate = transaction.branch_rate || 0;
            const ziswafBranchRate = transaction.ziswaf_branch_rate || 0;
            
            const qurbanAmount = Number(transaction.qurban_amount) || 0;
            const ziswafAmount = Number(transaction.amount) || 0;
            
            volunteerCommission = (qurbanAmount * qurbanVolunteerRate / 100) + (ziswafAmount * ziswafVolunteerRate / 100);
            branchCommission = (qurbanAmount * qurbanBranchRate / 100) + (ziswafAmount * ziswafBranchRate / 100);
          } else {
            // QURBAN tanpa komponen ZISWAF
            const volunteerRate = transaction.volunteer_rate || 0;
            const branchRate = transaction.branch_rate || 0;
            const amount = Number(transaction.amount) || 0;
            volunteerCommission = amount * volunteerRate / 100;
            branchCommission = amount * branchRate / 100;
          }
        }
        
        return {
          'No': index + 1,
          'ID Transaksi': transaction.id,
          'Nama Donatur': transaction.donorName || transaction.donor_name || '-',
          'Cabang': getBranchName(transaction),
          'Tim': getTeamName(transaction),
          'Relawan': getVolunteerName(transaction),
          'Program': programName,
          'Jenis Program': isQurban ? 'QURBAN' : 'ZISWAF',
          'Regulasi Relawan': volunteerCommission,
          'Regulasi Cabang': branchCommission,
          'Nominal': transaction.amount || 0,
          'Nominal Qurban': isQurban && transaction.qurban_amount ? transaction.qurban_amount : '-',
          'Total Nominal': isQurban && transaction.qurban_amount ? 
            (transaction.amount || 0) + (transaction.qurban_amount || 0) : 
            (transaction.amount || 0),
          'Bank': transaction.transferMethod || transaction.transfer_method || '-',
          'Status': getStatusLabel(transaction.status),
          'Alasan': transaction.statusReason || transaction.status_reason || '-',
          'Tanggal Transaksi': formatDate(transaction.transaction_date || transaction.transactionDate || transaction.created_at || transaction.createdAt),
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
        { wch: 15 },  // Regulasi Relawan
        { wch: 15 },  // Regulasi Cabang
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

  // Download Excel Template
  const downloadTemplate = () => {
    try {
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Template headers
      const headers = [
        'Nama Donatur',
        'Nominal',
        'Metode Pembayaran',
        'Jenis Program',
        'Program',
        'Nama Pemilik Qurban',
        'Nominal Qurban',
        'Cabang',
        'Tim',
        'Relawan',
        'Tanggal Transaksi',
        'Status',
        'Alasan Status'
      ];
      
      // Sample data with instructions
      const sampleData = [
        [
          'Contoh: Ahmad Budi',
          '500000',
          'Transfer Bank',
          'ZISWAF atau QURBAN',
          'Zakat Mal',
          'Kosongkan jika bukan QURBAN',
          'Kosongkan jika bukan QURBAN',
          'Cabang Jakarta',
          'Tim Alpha',
          'Nama Relawan',
          '25/01/2025 14:30:00',
          'pending',
          'Kosongkan jika status pending'
        ]
      ];
      
      // Create worksheet data
      const wsData = [headers, ...sampleData];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Set column widths
      const colWidths = [
        { wch: 20 }, // Nama Donatur
        { wch: 15 }, // Nominal
        { wch: 18 }, // Metode Pembayaran
        { wch: 15 }, // Jenis Program
        { wch: 20 }, // Program
        { wch: 20 }, // Nama Pemilik Qurban
        { wch: 15 }, // Nominal Qurban
        { wch: 15 }, // Cabang
        { wch: 15 }, // Tim
        { wch: 20 }, // Relawan
        { wch: 20 }, // Tanggal Transaksi
        { wch: 12 }, // Status
        { wch: 25 }  // Alasan Status
      ];
      ws['!cols'] = colWidths;
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Template Import');
      
      // Create instructions sheet
      const instructionsData = [
        ['PETUNJUK PENGGUNAAN TEMPLATE IMPORT TRANSAKSI'],
        [''],
        ['1. FORMAT TANGGAL:'],
        ['   - Gunakan format: DD/MM/YYYY HH:MM:SS'],
        ['   - Contoh: 25/01/2025 14:30:00'],
        ['   - Atau format: DD/MM/YYYY'],
        ['   - Contoh: 25/01/2025'],
        [''],
        ['2. JENIS PROGRAM:'],
        ['   - ZISWAF: untuk program zakat, infaq, sedekah, wakaf'],
        ['   - QURBAN: untuk program qurban'],
        [''],
        ['3. KOLOM KHUSUS QURBAN:'],
        ['   - Nama Pemilik Qurban: wajib diisi jika Jenis Program = QURBAN'],
        ['   - Nominal Qurban: wajib diisi jika Jenis Program = QURBAN'],
        ['   - Kosongkan kedua kolom ini jika Jenis Program = ZISWAF'],
        [''],
        ['4. STATUS TRANSAKSI:'],
        ['   - pending: menunggu validasi'],
        ['   - valid: transaksi valid'],
        ['   - double_duta: duplikasi dari duta'],
        ['   - double_input: duplikasi input'],
        ['   - not_in_account: tidak ada di rekening'],
        ['   - other: lainnya'],
        [''],
        ['5. METODE PEMBAYARAN:'],
        ['   - Sesuaikan dengan metode pembayaran yang tersedia'],
        ['   - Contoh: Transfer Bank, Cash, QRIS, dll'],
        [''],
        ['6. CABANG, TIM, RELAWAN:'],
        ['   - Pastikan nama sesuai dengan data yang ada di sistem'],
        ['   - Jika tidak ditemukan, akan dibuat otomatis'],
        [''],
        ['7. VALIDASI:'],
        ['   - Semua kolom wajib diisi kecuali yang disebutkan opsional'],
        ['   - Nominal harus berupa angka'],
        ['   - Format tanggal harus sesuai'],
        [''],
        ['8. TIPS:'],
        ['   - Hapus baris contoh sebelum import'],
        ['   - Pastikan tidak ada baris kosong di tengah data'],
        ['   - Maksimal 1000 baris per import']
      ];
      
      const instructionsWs = XLSX.utils.aoa_to_sheet(instructionsData);
      instructionsWs['!cols'] = [{ wch: 80 }];
      XLSX.utils.book_append_sheet(wb, instructionsWs, 'Petunjuk');
      
      // Generate filename
      const filename = 'Template_Import_Transaksi.xlsx';
      
      // Save file
      XLSX.writeFile(wb, filename);
      
      alert('Template berhasil didownload!');
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Terjadi kesalahan saat mendownload template');
    }
  };

  // Handle file import
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
    }
  };

  // Process Excel import
  const processImport = async () => {
    if (!importFile) {
      alert('Pilih file Excel terlebih dahulu');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);
    setImportResults(null);

    try {
      const data = await importFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Skip header row
      const rows = jsonData.slice(1) as any[][];
      
      if (rows.length === 0) {
        alert('File Excel kosong atau tidak ada data');
        setIsImporting(false);
        return;
      }

      if (rows.length > 1000) {
        alert('Maksimal 1000 baris per import');
        setIsImporting(false);
        return;
      }

      const results = {
        success: 0,
        errors: [] as Array<{ row: number; message: string }>
      };

      const validTransactions: any[] = [];

      // Validate each row first
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2; // +2 because we skip header and array is 0-indexed
        
        setImportProgress(Math.round(((i + 1) / rows.length) * 100));

        try {
          // Validate required fields
          if (!row[0] || !row[1] || !row[2] || !row[3] || !row[4] || !row[7] || !row[8] || !row[9] || !row[10]) {
            results.errors.push({
              row: rowNumber,
              message: 'Kolom wajib tidak boleh kosong'
            });
            continue;
          }

          // Validate program type
          const programType = String(row[3]).toUpperCase();
          if (programType !== 'ZISWAF' && programType !== 'QURBAN') {
            results.errors.push({
              row: rowNumber,
              message: 'Jenis Program harus ZISWAF atau QURBAN'
            });
            continue;
          }

          // Validate QURBAN specific fields
          if (programType === 'QURBAN') {
            // Validate qurban owner name
            const qurbanOwnerName = String(row[5] || '').trim();
            if (!qurbanOwnerName) {
              results.errors.push({
                row: rowNumber,
                message: 'Nama Pemilik Qurban wajib diisi untuk program QURBAN'
              });
              continue;
            }
            
            // Validate qurban amount exists
            if (!row[6]) {
              results.errors.push({
                row: rowNumber,
                message: 'Nominal Qurban wajib diisi untuk program QURBAN'
              });
              continue;
            }
          }

          // Validate amount
          const amount = Number(row[1]);
          if (isNaN(amount) || amount <= 0) {
            results.errors.push({
              row: rowNumber,
              message: 'Nominal harus berupa angka positif'
            });
            continue;
          }

          // Validate qurban amount if QURBAN
          let qurbanAmount = 0;
          if (programType === 'QURBAN') {
            qurbanAmount = Number(row[6]);
            if (isNaN(qurbanAmount) || qurbanAmount <= 0) {
              results.errors.push({
                row: rowNumber,
                message: 'Nominal Qurban harus berupa angka positif'
              });
              continue;
            }
          }

          // Parse transaction date
          let transactionDate = new Date();
          if (row[10]) {
            const dateStr = String(row[10]);
            // Try different date formats
            const dateFormats = [
              /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/, // DD/MM/YYYY HH:MM:SS
              /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/, // DD/MM/YYYY HH:MM
              /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/ // DD/MM/YYYY
            ];
            
            let dateValid = false;
            for (const format of dateFormats) {
              const match = dateStr.match(format);
              if (match) {
                const day = parseInt(match[1]);
                const month = parseInt(match[2]) - 1; // Month is 0-indexed
                const year = parseInt(match[3]);
                const hour = match[4] ? parseInt(match[4]) : 0;
                const minute = match[5] ? parseInt(match[5]) : 0;
                const second = match[6] ? parseInt(match[6]) : 0;
                
                transactionDate = new Date(year, month, day, hour, minute, second);
                if (!isNaN(transactionDate.getTime())) {
                  dateValid = true;
                  break;
                }
              }
            }
            
            if (!dateValid) {
              results.errors.push({
                row: rowNumber,
                message: 'Format tanggal tidak valid. Gunakan DD/MM/YYYY atau DD/MM/YYYY HH:MM:SS'
              });
              continue;
            }
          }

          // Find or create branch
          let branch = branches.find(b => b.name.toLowerCase() === String(row[7]).toLowerCase());
          if (!branch) {
            // In real implementation, you might want to create the branch
            results.errors.push({
              row: rowNumber,
              message: `Cabang '${row[7]}' tidak ditemukan`
            });
            continue;
          }

          // Find or create team
          let team = teams.find(t => t.name.toLowerCase() === String(row[8]).toLowerCase());
          if (!team) {
            results.errors.push({
              row: rowNumber,
              message: `Tim '${row[8]}' tidak ditemukan`
            });
            continue;
          }

          // Find volunteer
          let volunteer = volunteers.find(v => v.name.toLowerCase() === String(row[9]).toLowerCase());
          if (!volunteer) {
            results.errors.push({
              row: rowNumber,
              message: `Relawan '${row[9]}' tidak ditemukan`
            });
            continue;
          }

          // Find payment method
          let paymentMethod = paymentMethods.find(pm => pm.name.toLowerCase() === String(row[2]).toLowerCase());
          if (!paymentMethod) {
            results.errors.push({
              row: rowNumber,
              message: `Metode pembayaran '${row[2]}' tidak ditemukan`
            });
            continue;
          }

          // Find program
          let program = programs.find(p => p.name.toLowerCase() === String(row[4]).toLowerCase());
          if (!program) {
            results.errors.push({
              row: rowNumber,
              message: `Program '${row[4]}' tidak ditemukan`
            });
            continue;
          }

          // Validate status
          const validStatuses = ['pending', 'valid', 'double_duta', 'double_input', 'not_in_account', 'other'];
          const status = row[11] ? String(row[11]).toLowerCase() : 'pending';
          if (!validStatuses.includes(status)) {
            results.errors.push({
              row: rowNumber,
              message: 'Status tidak valid'
            });
            continue;
          }

          // Create transaction data
          const qurbanOwnerName = programType === 'QURBAN' ? String(row[5] || '').trim() : '';
          
          const transactionData = {
            donorName: String(row[0] || '').trim(),
            amount: amount,
            paymentMethodId: paymentMethod.id,
            programType: programType as 'ZISWAF' | 'QURBAN',
            programId: program.id,
            qurbanOwnerName: qurbanOwnerName,
            qurbanAmount: programType === 'QURBAN' ? qurbanAmount : 0,
            ziswafProgramId: programType === 'ZISWAF' ? program.id : '',
            branchId: branch.id,
            teamId: team.id,
            volunteerId: volunteer.id,
            transactionDate: transactionDate.toISOString(),
            status: status as Transaction['status'],
            statusReason: row[12] ? String(row[12] || '').trim() : ''
          };

          // Add to valid transactions
          validTransactions.push(transactionData);
        } catch (error) {
          results.errors.push({
            row: rowNumber,
            message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      }

      // Send valid transactions to API if any
      if (validTransactions.length > 0) {
        try {
          const apiResult = await transactionsAPI.import(validTransactions);
          
          if (apiResult.success) {
            results.success = apiResult.results.success;
            // Merge API errors with validation errors
            if (apiResult.results.errors && apiResult.results.errors.length > 0) {
              results.errors.push(...apiResult.results.errors);
            }
          } else {
            // If API fails, mark all valid transactions as errors
            validTransactions.forEach((_, index) => {
              results.errors.push({
                row: index + 1,
                message: apiResult.message || 'Gagal menyimpan ke database'
              });
            });
          }
        } catch (error: any) {
          console.error('API Error:', error);
          // If API fails, mark all valid transactions as errors
          validTransactions.forEach((_, index) => {
            results.errors.push({
              row: index + 1,
              message: error.response?.data?.message || 'Gagal menghubungi server'
            });
          });
        }
      }

      setImportResults(results);
      setImportProgress(100);
      
      // Refresh transactions after import
      if (results.success > 0) {
        await fetchTransactions();
      }
      
    } catch (error) {
      console.error('Error processing import:', error);
      alert('Terjadi kesalahan saat memproses file import');
    } finally {
      setIsImporting(false);
    }
  };

  // Reset import modal
  const resetImportModal = () => {
    setIsImportModalOpen(false);
    setImportFile(null);
    setImportProgress(0);
    setImportResults(null);
    setIsImporting(false);
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
          <button
            onClick={downloadTemplate}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <FileDown className="w-5 h-5" />
            <span>Download Template</span>
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
          >
            <Upload className="w-5 h-5" />
            <span>Import Excel</span>
          </button>
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

        {/* Filter Header - Hidden for volunteers */}
        {user?.role !== 'volunteer' && (
          <>
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
            />          </div>
        </div>
          </>
        )}
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
                <th className="text-left py-4 px-6 font-medium text-gray-700">Regulasi</th>
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
                          <div className="text-xs">
                            <span className="text-gray-600">Qurban:</span>
                            <span className="ml-1 font-medium">{formatCurrency(transaction.qurban_amount || 0)}</span>
                          </div>
                        )}
                        <div className="text-xs">
                          <span className="text-gray-600">Donasi:</span>
                          <span className="ml-1 font-medium">{formatCurrency(transaction.amount || 0)}</span>
                        </div>
                        <div className="text-xs border-t pt-1 mt-1">
                          <span className="text-gray-600 font-semibold">Total:</span>
                          <span className="ml-1 font-bold">{formatCurrency((Number(transaction.qurban_amount) || 0) + (Number(transaction.amount) || 0))}</span>
                        </div>
                      </div>
                    ) : (
                      formatCurrency(transaction.amount)
                    )}
                  </td>
                  <td className="py-4 px-6 font-medium text-blue-600">
                    {(() => {
                      let volunteerRate = 0;
                      let branchRate = 0;
                      
                      if (transaction.program_type === 'ZISWAF') {
                        volunteerRate = transaction.ziswaf_volunteer_rate || transaction.volunteer_rate || 0;
                        branchRate = transaction.ziswaf_branch_rate || transaction.branch_rate || 0;
                      } else if (transaction.program_type === 'QURBAN') {
                        if (transaction.ziswaf_program_id) {
                          // QURBAN dengan komponen ZISWAF
                          const qurbanVolunteerRate = transaction.volunteer_rate || 0;
                          const ziswafVolunteerRate = transaction.ziswaf_volunteer_rate || 0;
                          const qurbanBranchRate = transaction.branch_rate || 0;
                          const ziswafBranchRate = transaction.ziswaf_branch_rate || 0;
                          
                          const qurbanAmount = Number(transaction.qurban_amount) || 0;
                          const ziswafAmount = Number(transaction.amount) || 0;
                          
                          volunteerRate = ((qurbanAmount * qurbanVolunteerRate / 100) + (ziswafAmount * ziswafVolunteerRate / 100));
                          branchRate = ((qurbanAmount * qurbanBranchRate / 100) + (ziswafAmount * ziswafBranchRate / 100));
                          
                          return (
                            <div className="space-y-1">
                              <div className="text-xs">
                                <span className="text-gray-600">Relawan:</span>
                                <span className="ml-1 font-medium">{formatCurrency(volunteerRate)}</span>
                              </div>
                              <div className="text-xs">
                                <span className="text-gray-600">Cabang:</span>
                                <span className="ml-1 font-medium">{formatCurrency(branchRate)}</span>
                              </div>
                            </div>
                          );
                        } else {
                          // QURBAN tanpa komponen ZISWAF
                          volunteerRate = transaction.volunteer_rate || 0;
                          branchRate = transaction.branch_rate || 0;
                        }
                      }
                      
                      // Untuk QURBAN tanpa ZISWAF, gunakan qurban_amount
                      const amount = (transaction.program_type === 'QURBAN' && !transaction.ziswaf_program_id) 
                        ? Number(transaction.qurban_amount) || 0 
                        : Number(transaction.amount) || 0;
                      const volunteerCommission = amount * volunteerRate / 100;
                      const branchCommission = amount * branchRate / 100;
                      
                      return (
                        <div className="space-y-1">
                          <div className="text-xs">
                            <span className="text-gray-600">Relawan:</span>
                            <span className="ml-1 font-medium">{formatCurrency(volunteerCommission)}</span>
                          </div>
                          <div className="text-xs">
                            <span className="text-gray-600">Cabang:</span>
                            <span className="ml-1 font-medium">{formatCurrency(branchCommission)}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="py-4 px-6">{transaction.transferMethod || '-'}</td>
                  <td className="py-4 px-6 text-gray-600">
                    {formatDate(transaction.transaction_date || transaction.transactionDate || transaction.created_at || transaction.createdAt)}
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
                    {formatDate(transaction.transaction_date || transaction.transactionDate || transaction.created_at || transaction.createdAt)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Regulasi:</span>
                  <div className="text-blue-600 text-sm">
                    {(() => {
                      let volunteerRate = 0;
                      let branchRate = 0;
                      
                      if (transaction.program_type === 'ZISWAF') {
                        volunteerRate = transaction.ziswaf_volunteer_rate || transaction.volunteer_rate || 0;
                        branchRate = transaction.ziswaf_branch_rate || transaction.branch_rate || 0;
                      } else if (transaction.program_type === 'QURBAN') {
                        if (transaction.ziswaf_program_id) {
                          // QURBAN dengan komponen ZISWAF
                          const qurbanVolunteerRate = transaction.volunteer_rate || 0;
                          const ziswafVolunteerRate = transaction.ziswaf_volunteer_rate || 0;
                          const qurbanBranchRate = transaction.branch_rate || 0;
                          const ziswafBranchRate = transaction.ziswaf_branch_rate || 0;
                          
                          const qurbanAmount = Number(transaction.qurban_amount) || 0;
                          const ziswafAmount = Number(transaction.amount) || 0;
                          
                          volunteerRate = ((qurbanAmount * qurbanVolunteerRate / 100) + (ziswafAmount * ziswafVolunteerRate / 100));
                          branchRate = ((qurbanAmount * qurbanBranchRate / 100) + (ziswafAmount * ziswafBranchRate / 100));
                          
                          return (
                            <div className="space-y-1">
                              <div>
                                <span className="text-gray-600">Relawan: </span>
                                <span className="font-medium">{formatCurrency(volunteerRate)}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Cabang: </span>
                                <span className="font-medium">{formatCurrency(branchRate)}</span>
                              </div>
                            </div>
                          );
                        } else {
                          // QURBAN tanpa komponen ZISWAF
                          volunteerRate = transaction.volunteer_rate || 0;
                          branchRate = transaction.branch_rate || 0;
                        }
                      }
                      
                      // Untuk QURBAN tanpa ZISWAF, gunakan qurban_amount
                      const amount = (transaction.program_type === 'QURBAN' && !transaction.ziswaf_program_id) 
                        ? Number(transaction.qurban_amount) || 0 
                        : Number(transaction.amount) || 0;
                      const volunteerCommission = amount * volunteerRate / 100;
                      const branchCommission = amount * branchRate / 100;
                      
                      return (
                        <div className="space-y-1">
                          <div>
                            <span className="text-gray-600">Relawan: </span>
                            <span className="font-medium">{formatCurrency(volunteerCommission)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Cabang: </span>
                            <span className="font-medium">{formatCurrency(branchCommission)}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
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
                  {Array.from({ length: Math.min(isMobile ? 3 : 5, totalPages) }, (_, i) => {
                    let pageNum;
                    const maxPages = isMobile ? 3 : 5;
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
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Transaksi #{editingTransaction?.id}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form id="edit-transaction-form" onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
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
                           value={formData.qurbanAmount ? new Intl.NumberFormat('id-ID').format(Number(formData.qurbanAmount)) : ''}
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
                
                {/* For QURBAN - Type Hewan Qurban and Tanggal Transaksi side by side */}
                {formData.programType === 'QURBAN' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                        {programs
                          .filter(program => program.type === 'QURBAN')
                          .map(program => (
                            <option key={program.id} value={program.id}>
                              {program.name} ({program.code})
                            </option>
                          ))}
                      </select>
                    </div>
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
                
                {/* For ZISWAF - Program and Nominal Donasi side by side */}
                {formData.programType === 'ZISWAF' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Program <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.programId}
                        onChange={(e) => setFormData({ ...formData, programId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required
                      >
                        <option value="">Pilih Program</option>
                        {programs
                          .filter(program => program.type === 'ZISWAF')
                          .map(program => (
                            <option key={program.id} value={program.id}>
                              {program.name} ({program.code})
                            </option>
                          ))}
                      </select>
                    </div>
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
                
                {/* For ZISWAF - Tanggal Transaksi full width */}
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
                
                {/* Program ZISWAF and Nominal Donasi for QURBAN */}
                {formData.programType === 'QURBAN' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                        {programs.filter(program => program.type === 'ZISWAF').map(program => (
                          <option key={program.id} value={program.id}>
                            {program.name} ({program.code})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Nominal Donasi - Only visible for QURBAN when ZISWAF program selected */}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                       {paymentMethods.map(method => (
                         <option key={method.id} value={method.id}>{method.name}</option>
                       ))}
                     </select>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Cabang <span className="text-red-500">*</span>
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
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tim <span className="text-red-500">*</span>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Relawan <span className="text-red-500">*</span>
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
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                    <textarea
                      value={formData.statusReason || ''}
                      onChange={(e) => setFormData({ ...formData, statusReason: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Masukkan alasan status (opsional)"
                      rows={3}
                    />
                  </div>
                </div>
                
                {/* Proof Image */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bukti Transaksi (Opsional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setFormData({ ...formData, proofImage: file });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Kosongkan jika tidak ingin mengubah gambar</p>

                </div>
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
            </form>
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

      {/* Import Excel Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Import Transaksi dari Excel</h2>
              <button
                onClick={resetImportModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {!importResults ? (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">Petunjuk Import:</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Download template Excel terlebih dahulu</li>
                      <li>• Isi data sesuai format yang disediakan</li>
                      <li>• Pastikan semua kolom wajib terisi</li>
                      <li>• Format tanggal: DD/MM/YYYY atau DD/MM/YYYY HH:MM:SS</li>
                      <li>• Maksimal 1000 baris per import</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pilih File Excel
                      </label>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileImport}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                    
                    {importFile && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-800">
                          File dipilih: <span className="font-medium">{importFile.name}</span>
                        </p>
                      </div>
                    )}
                    
                    {isImporting && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Progress Import</span>
                          <span>{importProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${importProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-medium text-green-900 mb-2">Hasil Import</h3>
                    <p className="text-sm text-green-800">
                      <span className="font-medium">{importResults.success}</span> transaksi berhasil diimport
                    </p>
                  </div>
                  
                  {importResults.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h3 className="font-medium text-red-900 mb-2">
                        Error ({importResults.errors.length} baris)
                      </h3>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {importResults.errors.map((error, index) => (
                          <p key={index} className="text-sm text-red-800">
                            Baris {error.row}: {error.message}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={resetImportModal}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {importResults ? 'Tutup' : 'Batal'}
              </button>
              {!importResults && (
                <button
                  onClick={processImport}
                  disabled={!importFile || isImporting}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImporting ? 'Memproses...' : 'Import Data'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}