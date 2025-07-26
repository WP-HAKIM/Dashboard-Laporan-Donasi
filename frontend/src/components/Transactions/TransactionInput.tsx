import React, { useState, useEffect } from 'react';
import { Upload, Save, Loader } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.tsx';
import { useBranches } from '../../hooks/useBranches';
import { useTeams } from '../../hooks/useTeams';
import { usePrograms } from '../../hooks/usePrograms';
import { useTransactions } from '../../hooks/useTransactions';
import { usePaymentMethods } from '../../hooks/usePaymentMethods';
import { useUsers } from '../../hooks/useUsers';
import { User, Team } from '../../types';
import { teamsAPI } from '../../services/api';

export default function TransactionInput() {
  const { user } = useAuth();
  const { branches } = useBranches();
  const { programs } = usePrograms();
  const { createTransaction } = useTransactions();
  const { paymentMethods } = usePaymentMethods();
  const { getUsersByTeam } = useUsers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [volunteers, setVolunteers] = useState<User[]>([]);
  const [branchTeams, setBranchTeams] = useState<Team[]>([]);
  const [formData, setFormData] = useState({
    branchId: user?.role === 'volunteer' ? user.branchId : '',
    teamId: user?.role === 'volunteer' ? user.teamId : '',
    volunteerId: user?.role === 'volunteer' ? user.id : '',
    programType: 'ZISWAF' as 'ZISWAF' | 'QURBAN',
    programId: '',
    donorName: '',
    amount: '',
    transferMethod: '',
    proofImage: null as File | null,
    datetime: new Date().toISOString().slice(0, 16)
  });

  const filteredPrograms = programs.filter(program => program.type === formData.programType);
  // Handle different team ID formats from backend for volunteers
  const filteredVolunteers = volunteers.filter(volunteer => {
    const volunteerTeamId = volunteer.teamId || (volunteer as any).team_id || volunteer.team?.id;
    return String(volunteerTeamId) === String(formData.teamId);
  });

  // Load teams when branch changes
  useEffect(() => {
    const loadTeamsByBranch = async () => {
      if (formData.branchId) {
        try {
          const response = await teamsAPI.getAll();
          const teams = response.data || [];
          // Handle different branch ID formats from backend
          const filteredTeams = teams.filter((team: Team) => {
            const teamBranchId = team.branchId || (team as any).branch_id || team.branch?.id;
            return String(teamBranchId) === String(formData.branchId);
          });
          setBranchTeams(filteredTeams);
        } catch (error) {
          console.error('Error loading teams:', error);
          setBranchTeams([]);
        }
      } else {
        setBranchTeams([]);
      }
    };

    loadTeamsByBranch();
  }, [formData.branchId]);

  // Load volunteers when team changes
  useEffect(() => {
    const loadVolunteers = async () => {
      if (formData.teamId) {
        try {
          const teamVolunteers = await getUsersByTeam(formData.teamId);
          setVolunteers(teamVolunteers);
        } catch (error) {
          console.error('Error loading volunteers:', error);
          setVolunteers([]);
        }
      } else {
        setVolunteers([]);
      }
    };

    loadVolunteers();
  }, [formData.teamId]);

  // Reset team and volunteer when branch changes
  const handleBranchChange = (branchId: string) => {
    setFormData(prev => ({ 
      ...prev, 
      branchId, 
      teamId: '', 
      volunteerId: '' 
    }));
    setVolunteers([]);
    setBranchTeams([]);
  };

  const handleTeamChange = (teamId: string) => {
    setFormData(prev => ({ 
      ...prev, 
      teamId, 
      volunteerId: '' 
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal 5MB');
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'].includes(file.type)) {
        alert('Hanya file JPG, PNG, GIF, dan WebP yang diperbolehkan');
        return;
      }
      setFormData({ ...formData, proofImage: file });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('branch_id', formData.branchId);
      formDataToSend.append('team_id', formData.teamId);
      formDataToSend.append('volunteer_id', formData.volunteerId);
      formDataToSend.append('program_type', formData.programType);
      formDataToSend.append('program_id', formData.programId);
      formDataToSend.append('donor_name', formData.donorName);
      formDataToSend.append('amount', formData.amount);
      formDataToSend.append('transaction_date', formData.datetime);
      formDataToSend.append('transfer_method', formData.transferMethod);
      
      if (formData.proofImage) {
        formDataToSend.append('proof_image', formData.proofImage);
      }
      
      await createTransaction(formDataToSend);
      
      alert('Transaksi berhasil disimpan!');
      
      // Reset form
      setFormData({
        branchId: user?.role === 'volunteer' ? user.branchId : '',
        teamId: user?.role === 'volunteer' ? user.teamId : '',
        volunteerId: user?.role === 'volunteer' ? user.id : '',
        programType: 'ZISWAF',
        programId: '',
        donorName: '',
        amount: '',
        transferMethod: '',
        proofImage: null,
        datetime: new Date().toISOString().slice(0, 16)
      });
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Terjadi kesalahan saat menyimpan transaksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: string) => {
    const number = value.replace(/\D/g, '');
    return new Intl.NumberFormat('id-ID').format(parseInt(number) || 0);
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Input Transaksi Donasi</h1>
        <p className="text-gray-600 mt-2">Masukkan data transaksi donasi baru</p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Branch Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cabang/Kantor *
                </label>
                <select
                  value={formData.branchId}
                  onChange={(e) => handleBranchChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={user?.role === 'volunteer'}
                >
                  <option value="">Pilih Cabang</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>

              {/* Team Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tim Relawan *
                </label>
                <select
                  value={formData.teamId}
                  onChange={(e) => handleTeamChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={!formData.branchId || user?.role === 'volunteer'}
                >
                  <option value="">
                    {!formData.branchId ? 'Pilih cabang terlebih dahulu' : 
                     branchTeams.length === 0 ? 'Tidak ada tim tersedia' : 'Pilih Tim'}
                  </option>
                  {branchTeams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>

              {/* Volunteer Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relawan *
                </label>
                <select
                  value={formData.volunteerId}
                  onChange={(e) => setFormData({ ...formData, volunteerId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={!formData.teamId || user?.role === 'volunteer'}
                >
                  <option value="">
                    {!formData.teamId ? 'Pilih tim terlebih dahulu' : 
                     filteredVolunteers.length === 0 ? 'Tidak ada relawan tersedia' : 'Pilih Relawan'}
                  </option>
                  {filteredVolunteers.map(volunteer => (
                    <option key={volunteer.id} value={volunteer.id}>{volunteer.name}</option>
                  ))}
                </select>
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Program Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jenis Program *
                </label>
                <select
                  value={formData.programType}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    programType: e.target.value as 'ZISWAF' | 'QURBAN',
                    programId: ''
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="ZISWAF">ZISWAF</option>
                  <option value="QURBAN">QURBAN</option>
                </select>
              </div>

              {/* Program Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Program *
                </label>
                <select
                  value={formData.programId}
                  onChange={(e) => setFormData({ ...formData, programId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Pilih Program</option>
                  {filteredPrograms.map(program => (
                    <option key={program.id} value={program.id}>
                      {program.name} ({program.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date and Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal & Jam Transaksi *
                </label>
                <input
                  type="datetime-local"
                  value={formData.datetime}
                  onChange={(e) => setFormData({ ...formData, datetime: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Transfer Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Metode Transfer *
                </label>
                <select
                  value={formData.transferMethod}
                  onChange={(e) => setFormData({ ...formData, transferMethod: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Pilih Metode Transfer</option>
                  {paymentMethods.map(method => (
                    <option key={method.id} value={method.name}>{method.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Donor Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Donatur *
              </label>
              <input
                type="text"
                value={formData.donorName}
                onChange={(e) => setFormData({ ...formData, donorName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Masukkan nama donatur"
                required
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nominal Donasi *
              </label>
              <div className="relative">
                <span className="text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 font-medium">Rp</span>
                <input
                  type="text"
                  value={formatCurrency(formData.amount)}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setFormData({ ...formData, amount: value });
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  required
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Nilai: Rp {parseInt(formData.amount) || 0}
              </p>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Bukti Pembayaran *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <div className="text-center text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <span>Upload file</span>
                      <input
                        type="file"
                        className="sr-only"
                        accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                        onChange={handleFileChange}
                        required
                      />
                    </label>
                    <span className="ml-1">atau drag and drop</span>
                  </div>
                  <p className="text-xs text-gray-500">JPG, PNG, GIF, atau WebP, maksimal 5MB</p>
                  {formData.proofImage && (
                    <p className="text-sm text-green-600 mt-2">
                      File terpilih: {formData.proofImage.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                disabled={isSubmitting}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                <span>{isSubmitting ? 'Menyimpan...' : 'Tambah Transaksi'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}