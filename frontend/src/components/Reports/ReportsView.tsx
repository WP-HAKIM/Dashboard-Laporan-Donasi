import React, { useState, useEffect } from 'react';
import { Building, Users, TrendingUp, CheckCircle, Clock, X, Calendar, Filter, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { reportsAPI, transactionsAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import Loader from '../Common/Loader';

interface BranchReport {
  id: string;
  name: string;
  code: string;
  totalDonations: number;
  totalZiswafAmount: number;
  totalRegularDonations: number;
  totalTransactions: number;
  validatedTransactions: number;
  pendingTransactions: number;
  rejectedTransactions: number;
  failedTransactions: number;
}

interface VolunteerReport {
  id: string;
  name: string;
  teamName: string;
  branchName: string;
  totalDonations: number;
  totalZiswafAmount: number;
  totalRegularDonations: number;
  totalTransactions: number;
  validatedTransactions: number;
  pendingTransactions: number;
}

export default function ReportsView() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'branch' | 'volunteer'>(user?.role === 'branch' ? 'volunteer' : 'branch');
  const [branchReports, setBranchReports] = useState<BranchReport[]>([]);
  const [volunteerReports, setVolunteerReports] = useState<VolunteerReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [sortBy, setSortBy] = useState('branchTeam');
  
  // Date filter states
  const [datePreset, setDatePreset] = useState('current_month');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isDateRangeModalOpen, setIsDateRangeModalOpen] = useState(false);
  const [tempDateFrom, setTempDateFrom] = useState('');
  const [tempDateTo, setTempDateTo] = useState('');

  useEffect(() => {
    fetchReports();
  }, [activeTab, datePreset, dateFrom, dateTo]);

  // Effect to refetch data when user changes (important for branch role users)
  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user]);

  // Separate effect for selectedBranch that only affects volunteer reports
  // Skip for branch role users as they are automatically filtered by their branch
  useEffect(() => {
    if (activeTab === 'volunteer' && user?.role !== 'branch') {
      fetchReports();
    }
  }, [selectedBranch]);

  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {};
      
      if (datePreset === 'custom' && dateFrom && dateTo) {
        params.dateFrom = dateFrom;
        params.dateTo = dateTo;
      } else if (datePreset !== 'all') {
        params.datePreset = datePreset;
        const presetMap: { [key: string]: string } = {
          'current_month': 'current_month',
          '1_month_back': '1_month_back',
          '2_months_back': '2_months_back',
          'all_data': 'all'
        };
        params.datePreset = presetMap[datePreset] || 'current_month';
      }
      
      if (activeTab === 'branch') {
        const response = await reportsAPI.getBranchReports(params);
        if (response.success) {
          setBranchReports(response.data);
        } else {
          setError(response.message || 'Gagal mengambil laporan cabang');
        }
      } else {
        // For branch role users, automatically filter by their branch
        if (user?.role === 'branch' && user?.branch_id) {
          params.branchId = user.branch_id;
        } else if (selectedBranch) {
          params.branchId = selectedBranch;
        }
        const response = await reportsAPI.getVolunteerReports(params);
        if (response.success) {
          setVolunteerReports(response.data);
        } else {
          setError(response.message || 'Gagal mengambil laporan relawan');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Gagal memuat laporan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateFilterChange = (preset: string) => {
    if (preset === 'custom') {
      setTempDateFrom(dateFrom);
      setTempDateTo(dateTo);
      setIsDateRangeModalOpen(true);
    } else {
      setDatePreset(preset);
      setDateFrom('');
      setDateTo('');
    }
  };

  const handleDateRangeSubmit = () => {
    if (tempDateFrom && tempDateTo) {
      setDateFrom(tempDateFrom);
      setDateTo(tempDateTo);
      setDatePreset('custom');
      setIsDateRangeModalOpen(false);
    }
  };

  const handleDateRangeCancel = () => {
    setTempDateFrom('');
    setTempDateTo('');
    setIsDateRangeModalOpen(false);
  };

  const getCurrentDateFilterLabel = () => {
    if (datePreset === 'custom' && dateFrom && dateTo) {
      const startDate = new Date(dateFrom).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      const endDate = new Date(dateTo).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      return `${startDate} - ${endDate}`;
    }
    
    const presetLabels: { [key: string]: string } = {
      'current_month': 'Bulan Berjalan',
      '1_month_back': '1 Bulan Sebelumnya',
      '2_months_back': '2 Bulan Sebelumnya',
      'all_data': 'Semua Data'
    };
    
    return presetLabels[datePreset] || 'Filter Tanggal';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredBranchReports = branchReports.filter(branch =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVolunteerReports = volunteerReports
    .filter(volunteer => {
      const matchesSearch = volunteer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           volunteer.teamName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBranch = !selectedBranch || volunteer.branchName === selectedBranch;
      const matchesTeam = !selectedTeam || volunteer.teamName === selectedTeam;
      return matchesSearch && matchesBranch && matchesTeam;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'branch':
          return a.branchName.localeCompare(b.branchName) || a.name.localeCompare(b.name);
        case 'team':
          return a.teamName.localeCompare(b.teamName) || a.name.localeCompare(b.name);
        case 'branchTeam':
          return a.branchName.localeCompare(b.branchName) || a.teamName.localeCompare(b.teamName) || a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const uniqueBranches = [...new Set(volunteerReports.map(v => v.branchName))];
  const uniqueTeams = [...new Set(volunteerReports.map(v => v.teamName))];

  if (isLoading) {
    return <Loader text="Memuat laporan..." size="medium" />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-blue-600 mb-4">
            <TrendingUp className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Gagal Memuat Laporan</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchReports}
            className="mt-2 px-4 py-2 text-white rounded-lg hover:bg-blue-700"
            style={{backgroundColor: '#2563EB'}}
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // Export to Excel function
  const exportToExcel = async () => {
    try {
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Prepare report parameters
      const reportParams: any = {};
      
      if (datePreset === 'custom' && dateFrom && dateTo) {
        reportParams.dateFrom = dateFrom;
        reportParams.dateTo = dateTo;
      } else if (datePreset !== 'all_data') {
        const presetMap: { [key: string]: string } = {
          'current_month': 'current_month',
          '1_month_back': '1_month_back',
          '2_months_back': '2_months_back'
        };
        reportParams.datePreset = presetMap[datePreset] || 'current_month';
      }
      
      // Apply branch filter for branch role users
      if (user?.role === 'branch' && user?.branch_id) {
        reportParams.branchId = user.branch_id;
      }
      
      // Generate filename based on active tab and date
      let filename = '';
      let monthLabel = '';
      
      if (datePreset === 'custom' && dateFrom && dateTo) {
        const startDate = new Date(dateFrom);
        const endDate = new Date(dateTo);
        const startMonth = startDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        const endMonth = endDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        
        if (startMonth === endMonth) {
          monthLabel = startMonth;
        } else {
          monthLabel = `${startMonth} - ${endMonth}`;
        }
      } else {
        const now = new Date();
        switch (datePreset) {
          case 'current_month':
            monthLabel = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
            break;
          case '1_month_back':
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            monthLabel = lastMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
            break;
          case '2_months_back':
            const twoMonthsBack = new Date(now.getFullYear(), now.getMonth() - 2, 1);
            monthLabel = twoMonthsBack.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
            break;
          case 'all_data':
            monthLabel = 'Semua Data';
            break;
          default:
            monthLabel = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        }
      }
      
      if (activeTab === 'branch') {
        // Export Branch Report
        filename = `Laporan Cabang ${monthLabel}.xlsx`;
        
        // Fetch branch data
        const branchResponse = await reportsAPI.getBranchReports(reportParams);
        const allBranchReports = branchResponse.success ? branchResponse.data : [];
        
        // Prepare branch data
        const branchData = allBranchReports.map((item, index) => ({
          'No': index + 1,
          'Nama Cabang': item.name,
          'Kode Cabang': item.code,
          'Total Donasi': item.totalDonations,
          'Total Donasi ZISWAF': item.totalZiswafAmount,
          'Regulasi Cabang': item.totalRegularDonations,
          'Total Transaksi': item.totalTransactions,
          'Tervalidasi': item.validatedTransactions,
          'Pending': item.pendingTransactions,
          'Ditolak': item.rejectedTransactions || 0,
          'Gagal': item.failedTransactions || 0
        }));
        
        // Calculate totals for branch report
        const totalAllDonations = allBranchReports.reduce((sum, item) => sum + item.totalDonations, 0);
        const totalZiswafDonations = allBranchReports.reduce((sum, item) => sum + item.totalZiswafAmount, 0);
        const totalRegulasiBranch = allBranchReports.reduce((sum, item) => sum + item.totalRegularDonations, 0);
        const totalAllTransactions = allBranchReports.reduce((sum, item) => sum + item.totalTransactions, 0);
        
        // Add summary row to branch data
        branchData.push({
          'No': '',
          'Nama Cabang': 'TOTAL KESELURUHAN',
          'Kode Cabang': '',
          'Total Donasi': totalAllDonations,
          'Total Donasi ZISWAF': totalZiswafDonations,
          'Regulasi Cabang': totalRegulasiBranch,
          'Total Transaksi': totalAllTransactions,
          'Tervalidasi': allBranchReports.reduce((sum, item) => sum + item.validatedTransactions, 0),
          'Pending': allBranchReports.reduce((sum, item) => sum + item.pendingTransactions, 0),
          'Ditolak': allBranchReports.reduce((sum, item) => sum + (item.rejectedTransactions || 0), 0),
          'Gagal': allBranchReports.reduce((sum, item) => sum + (item.failedTransactions || 0), 0)
        });
        
        // Calculate additional totals for branch report
        const totalQurbanDonations = allBranchReports.reduce((sum, item) => sum + (item.totalDonations - item.totalZiswafAmount), 0);
        const totalRejected = allBranchReports.reduce((sum, item) => sum + item.rejectedTransactions, 0);
        const totalFailed = allBranchReports.reduce((sum, item) => sum + item.failedTransactions, 0);
        
        // Create summary section
        const summaryData = [
          ['RINGKASAN LAPORAN'],
          ['Total Semua Donasi', formatCurrency(totalAllDonations)],
          ['Total Donasi ZISWAF', formatCurrency(totalZiswafDonations)],
          ['Total Donasi Qurban', formatCurrency(totalQurbanDonations)],
          ['Total Transaksi', totalAllTransactions.toString()],
          [''],
          ['DETAIL PER CABANG'],
          ['No', 'Nama Cabang', 'Kode Cabang', 'Total Donasi', 'Total Donasi ZISWAF', 'Total Donasi Qurban', 'Regulasi Cabang', 'Total Transaksi', 'Tervalidasi', 'Pending', 'Ditolak', 'Gagal']
        ];
        
        // Convert branch data to array format
        const branchDataArray = branchData.map(item => [
          item['No'],
          item['Nama Cabang'],
          item['Kode Cabang'],
          formatCurrency(item['Total Donasi']), // Format rupiah
          formatCurrency(item['Total Donasi ZISWAF']), // Format rupiah
          formatCurrency(item['Total Donasi'] - item['Total Donasi ZISWAF']), // Total Donasi Qurban
          formatCurrency(item['Regulasi Cabang']), // Regulasi Cabang - using totalRegularDonations (commission)
          item['Total Transaksi'],
          item['Tervalidasi'],
          item['Pending'],
          item['Ditolak'],
          item['Gagal']
        ]);
        
        const finalBranchData = [...summaryData, ...branchDataArray];
        const ws1 = XLSX.utils.aoa_to_sheet(finalBranchData);
        XLSX.utils.book_append_sheet(wb, ws1, 'Laporan Cabang');
        
      } else {
        // Export Volunteer Report
        filename = `Laporan Relawan ${monthLabel}.xlsx`;
        
        // Fetch volunteer data
        const volunteerResponse = await reportsAPI.getVolunteerReports(reportParams);
        const allVolunteerReports = volunteerResponse.success ? volunteerResponse.data : [];
        
        // Prepare volunteer data
        const volunteerData = allVolunteerReports.map((item, index) => ({
          'No': index + 1,
          'Nama Relawan': item.name,
          'Tim': item.teamName,
          'Cabang': item.branchName,
          'Total Donasi': item.totalDonations,
          'Total Donasi ZISWAF': item.totalZiswafAmount,
          'Regulasi Relawan': item.totalRegularDonations,
          'Total Transaksi': item.totalTransactions,
          'Tervalidasi': item.validatedTransactions,
          'Pending': item.pendingTransactions
        }));
        
        // Calculate totals for volunteer report
        const totalAllDonations = allVolunteerReports.reduce((sum, item) => sum + item.totalDonations, 0);
        const totalZiswafDonations = allVolunteerReports.reduce((sum, item) => sum + item.totalZiswafAmount, 0);
        const totalRegulasiVolunteer = allVolunteerReports.reduce((sum, item) => sum + item.totalRegularDonations, 0);
        const totalAllTransactions = allVolunteerReports.reduce((sum, item) => sum + item.totalTransactions, 0);
        const totalValidated = allVolunteerReports.reduce((sum, item) => sum + item.validatedTransactions, 0);
        const totalPending = allVolunteerReports.reduce((sum, item) => sum + item.pendingTransactions, 0);
        
        // Add summary row to volunteer data
        volunteerData.push({
          'No': '',
          'Nama Relawan': 'TOTAL KESELURUHAN',
          'Tim': '',
          'Cabang': '',
          'Total Donasi': totalAllDonations,
          'Total Donasi ZISWAF': totalZiswafDonations,
          'Regulasi Relawan': totalRegulasiVolunteer,
          'Total Transaksi': totalAllTransactions,
          'Tervalidasi': totalValidated,
          'Pending': totalPending
        });
        
        // Calculate additional totals for volunteer report
        const totalQurbanDonations = allVolunteerReports.reduce((sum, item) => sum + (item.totalDonations - item.totalZiswafAmount), 0);
        
        // Create summary section
        const summaryData = [
          ['RINGKASAN LAPORAN'],
          ['Total Semua Donasi', formatCurrency(totalAllDonations)],
          ['Total Donasi ZISWAF', formatCurrency(totalZiswafDonations)],
          ['Total Donasi Qurban', formatCurrency(totalQurbanDonations)],
          ['Total Relawan', allVolunteerReports.length.toString()],
          ['Total Transaksi', totalAllTransactions.toString()],
          [''],
          ['DETAIL PER RELAWAN'],
          ['No', 'Nama Relawan', 'Tim', 'Cabang', 'Total Donasi', 'Total Donasi ZISWAF', 'Total Donasi Qurban', 'Regulasi Relawan', 'Total Transaksi', 'Tervalidasi', 'Pending']
        ];
        
        // Convert volunteer data to array format
        const volunteerDataArray = volunteerData.map(item => {
          return [
            item['No'],
            item['Nama Relawan'],
            item['Tim'],
            item['Cabang'],
            formatCurrency(item['Total Donasi']), // Format rupiah
            formatCurrency(item['Total Donasi ZISWAF']), // Format rupiah
            typeof item['Total Donasi'] === 'number' && typeof item['Total Donasi ZISWAF'] === 'number' 
              ? formatCurrency(item['Total Donasi'] - item['Total Donasi ZISWAF']) 
              : formatCurrency(0), // Total Donasi Qurban
            formatCurrency(item['Regulasi Relawan']), // Regulasi Relawan
            item['Total Transaksi'],
            item['Tervalidasi'],
            item['Pending']
          ];
        });
        
        const finalVolunteerData = [...summaryData, ...volunteerDataArray];
        const ws2 = XLSX.utils.aoa_to_sheet(finalVolunteerData);
        XLSX.utils.book_append_sheet(wb, ws2, 'Laporan Relawan');
      }
      
      // Save file
      XLSX.writeFile(wb, filename);
      
      alert(`Data berhasil diekspor ke file: ${filename}`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Terjadi kesalahan saat mengekspor data ke Excel');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Laporan Transaksi</h1>
          <p className="text-gray-600">Laporan statistik transaksi per cabang dan relawan</p>
        </div>
        <button
          onClick={exportToExcel}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
        >
          <Download className="w-5 h-5" />
          <span>Export Excel</span>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {/* Hide branch tab for branch role users */}
            {user?.role !== 'branch' && (
              <button
                onClick={() => setActiveTab('branch')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'branch'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Building className="inline-block w-4 h-4 mr-2" />
                Laporan Cabang
              </button>
            )}
            <button
              onClick={() => setActiveTab('volunteer')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'volunteer'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="inline-block w-4 h-4 mr-2" />
              Laporan Relawan
            </button>
          </nav>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        {/* Date Filter */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={datePreset}
              onChange={(e) => handleDateFilterChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="current_month">Bulan Berjalan</option>
              <option value="1_month_back">1 Bulan Sebelumnya</option>
              <option value="2_months_back">2 Bulan Sebelumnya</option>
              <option value="all_data">Semua Data</option>
              <option value="custom">Rentang Tanggal Kustom</option>
            </select>
          </div>
          {datePreset === 'custom' && (
            <button
              onClick={() => {
                setTempDateFrom(dateFrom);
                setTempDateTo(dateTo);
                setIsDateRangeModalOpen(true);
              }}
              className="px-3 py-2 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100"
            >
              {getCurrentDateFilterLabel()}
            </button>
          )}
        </div>

        {/* Search Filter */}
        <div className="w-full">
          <input
            type="text"
            placeholder="Cari nama atau kode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        {/* Other Filters */}
        {activeTab === 'volunteer' && (
          <div className="flex flex-wrap items-center gap-4">
            {/* Hide branch filter for branch role users */}
            {user?.role !== 'branch' && (
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Semua Cabang</option>
                {uniqueBranches.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            )}
            
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Semua Tim</option>
              {uniqueTeams.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="name">Urutkan: Nama</option>
              <option value="branch">Urutkan: Cabang</option>
              <option value="team">Urutkan: Tim</option>
              <option value="branchTeam">Urutkan: Cabang & Tim</option>
            </select>
          </div>
        )}
      </div>

      {/* Branch Reports */}
      {activeTab === 'branch' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cabang
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Donasi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Regulasi Cabang
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Transaksi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tervalidasi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pending
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBranchReports.map((branch) => (
                  <tr key={branch.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Building className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {branch.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {branch.code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(branch.totalDonations)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600">
                      {formatCurrency(branch.totalRegularDonations)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {branch.totalTransactions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      {branch.validatedTransactions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                      {branch.pendingTransactions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredBranchReports.length === 0 && (
            <div className="text-center py-12">
              <Building className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada data cabang</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Tidak ada cabang yang sesuai dengan pencarian.' : 'Belum ada data cabang.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Volunteer Reports - Mobile Cards */}
      {activeTab === 'volunteer' && (
        <div className="space-y-6">
          <div className="block md:hidden space-y-4">
            {filteredVolunteerReports.map((volunteer) => (
              <div key={volunteer.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center mb-3">
                  <div className="flex-shrink-0 h-8 w-8">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      {volunteer.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {volunteer.teamName} - {volunteer.branchName}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Total Donasi:</span>
                    <div className="font-medium text-green-600">
                      {formatCurrency(volunteer.totalDonations)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Donasi Rutin:</span>
                    <div className="font-medium text-purple-600">
                      {formatCurrency(volunteer.totalRegularDonations)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Total Transaksi:</span>
                    <div className="font-medium text-gray-900">
                      {volunteer.totalTransactions}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Tervalidasi:</span>
                    <div className="font-medium text-green-600">
                      {volunteer.validatedTransactions}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Pending:</span>
                    <div className="font-medium text-yellow-600">
                      {volunteer.pendingTransactions}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredVolunteerReports.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada data relawan</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedBranch ? 'Tidak ada relawan yang sesuai dengan filter.' : 'Belum ada data relawan.'}
              </p>
            </div>
          )}

          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Relawan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tim
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cabang
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Donasi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Regulasi Relawan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Transaksi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tervalidasi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pending
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVolunteerReports.map((volunteer) => (
                    <tr key={volunteer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <Users className="h-4 w-4 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {volunteer.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {volunteer.teamName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {volunteer.branchName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatCurrency(volunteer.totalDonations)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600">
                        {formatCurrency(volunteer.totalRegularDonations)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {volunteer.totalTransactions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        {volunteer.validatedTransactions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                        {volunteer.pendingTransactions}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredVolunteerReports.length === 0 && (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada data relawan</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || selectedBranch ? 'Tidak ada relawan yang sesuai dengan filter.' : 'Belum ada data relawan.'}
                </p>
              </div>
            )}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={tempDateFrom}
                  onChange={(e) => setTempDateFrom(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Selesai
                </label>
                <input
                  type="date"
                  value={tempDateTo}
                  onChange={(e) => setTempDateTo(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {tempDateFrom && tempDateTo && new Date(tempDateFrom) >= new Date(tempDateTo) && (
                <p className="text-sm text-blue-600">
                  Tanggal mulai harus lebih awal dari tanggal selesai
                </p>
              )}
            </div>
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={handleDateRangeCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDateRangeSubmit}
                disabled={!tempDateFrom || !tempDateTo || new Date(tempDateFrom) >= new Date(tempDateTo)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}