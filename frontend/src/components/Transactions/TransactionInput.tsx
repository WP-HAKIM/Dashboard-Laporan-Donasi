import React, { useState } from 'react';
import { Upload, Save, DollarSign, Loader } from 'lucide-react';
import { useAuthContext } from '../../hooks/useAuth.tsx';
import { useBranches } from '../../hooks/useBranches';
import { useTeams } from '../../hooks/useTeams';
import { usePrograms } from '../../hooks/usePrograms';
import { useTransactions } from '../../hooks/useTransactions';

export default function TransactionInput() {
  const { user } = useAuthContext();
  const { branches } = useBranches();
  const { teams } = useTeams();
  const { programs } = usePrograms();
  const { createTransaction } = useTransactions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    branchId: user?.role === 'volunteer' ? user.branchId : '',
    teamId: user?.role === 'volunteer' ? user.teamId : '',
    volunteerId: user?.role === 'volunteer' ? user.id : '',
    programType: 'ZISWAF' as 'ZISWAF' | 'QURBAN',
    programId: '',
    donorName: '',
    amount: '',
    transferMethod: 'BRI',
    proofImage: null as File | null,
    datetime: new Date().toISOString().slice(0, 16)
  });

  const filteredTeams = teams.filter(team => team.branchId === formData.branchId);
  const filteredPrograms = programs.filter(program => program.type === formData.programType);

  const transferMethods = ['BRI', 'BSI', 'BCA', 'Mandiri', 'BNI', 'CIMB Niaga', 'Danamon'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal 5MB');
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        alert('Hanya file JPG dan PNG yang diperbolehkan');
        return;
      }
      setFormData({ ...formData, proofImage: file });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const transactionData = {
        branch_id: formData.branchId,
        team_id: formData.teamId,
        volunteer_id: formData.volunteerId,
        program_id: formData.programId,
        donor_name: formData.donorName,
        amount: parseInt(formData.amount),
        transfer_method: formData.transferMethod,
        datetime: formData.datetime,
        proof_image: formData.proofImage
      };
      
      await createTransaction(transactionData);
      
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
        transferMethod: 'BRI',
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Branch Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cabang/Kantor *
                </label>
                <select
                  value={formData.branchId}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    branchId: e.target.value, 
                    teamId: '',
                    volunteerId: ''
                  })}
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
                  onChange={(e) => setFormData({ ...formData, teamId: e.target.value, volunteerId: '' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={!formData.branchId || user?.role === 'volunteer'}
                >
                  <option value="">Pilih Tim</option>
                  {filteredTeams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>

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
                  {transferMethods.map(method => (
                    <option key={method} value={method}>{method}</option>
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
                <DollarSign className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
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
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <span>Upload file</span>
                      <input
                        type="file"
                        className="sr-only"
                        accept="image/jpeg,image/png"
                        onChange={handleFileChange}
                        required
                      />
                    </label>
                    <p className="pl-1">atau drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">JPG atau PNG, maksimal 5MB</p>
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
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}