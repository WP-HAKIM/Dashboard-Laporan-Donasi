import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { User } from '../../types';
import { useUsers } from '../../hooks/useUsers';
import { useBranches } from '../../hooks/useBranches';
import { useTeams } from '../../hooks/useTeams';
import Loader from '../Common/Loader';

export default function VolunteerManagement() {
  const { users: volunteers, isLoading, error, createUser, updateUser, deleteUser, fetchUsers } = useUsers();
  const { branches, fetchBranches } = useBranches();
  const { teams, fetchTeams } = useTeams();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filter states
  const [filterBranchId, setFilterBranchId] = useState('');
  const [filterTeamId, setFilterTeamId] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    branchId: '',
    teamId: '',
    role: 'volunteer' as const
  });

  // Helper functions - defined early to avoid hoisting issues
  const getVolunteerBranchId = (volunteer: User) => {
    return volunteer.branchId || (volunteer as any).branch_id || '';
  };

  const getVolunteerTeamId = (volunteer: User) => {
    return volunteer.teamId || (volunteer as any).team_id || '';
  };

  // Load initial data
  useEffect(() => {
    fetchBranches();
    fetchTeams();
  }, []);

  const filteredTeams = teams.filter(team => {
    // Handle both frontend (branchId) and backend (branch_id) formats
    const teamBranchId = team.branchId || (team as any).branch_id || team.branch?.id;
    return String(teamBranchId) === String(formData.branchId);
  });
  
  // Filter teams for filter dropdown
  const filterTeams = teams.filter(team => {
    if (!filterBranchId) return true;
    const teamBranchId = team.branchId || (team as any).branch_id || team.branch?.id;
    return String(teamBranchId) === String(filterBranchId);
  });
  
  // Apply all filters
  const filteredVolunteers = volunteers.filter(volunteer => {
    // Search filter
    const matchesSearch = volunteer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         volunteer.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Branch filter
    const volunteerBranchId = getVolunteerBranchId(volunteer);
    const matchesBranch = !filterBranchId || String(volunteerBranchId) === String(filterBranchId);
    
    // Team filter
    const volunteerTeamId = getVolunteerTeamId(volunteer);
    const matchesTeam = !filterTeamId || String(volunteerTeamId) === String(filterTeamId);
    
    return matchesSearch && matchesBranch && matchesTeam;
  });
  
  // Pagination logic
  const totalPages = Math.ceil(filteredVolunteers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedVolunteers = filteredVolunteers.slice(startIndex, endIndex);
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterBranchId, filterTeamId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Convert frontend format to backend format
      const submitData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        branch_id: formData.branchId, // Convert to backend format
        team_id: formData.teamId,     // Convert to backend format
        role: formData.role
      };

      if (editingVolunteer) {
        // For updates, only include password if it's provided
        if (formData.password) {
          (submitData as any).password = formData.password;
        }
        await updateUser(editingVolunteer.id, submitData);
        // Refresh data to ensure UI shows latest changes
        await fetchUsers();
      } else {
        // For new users, password is required
        if (!formData.password) {
          alert('Password is required for new users');
          return;
        }
        (submitData as any).password = formData.password;
        await createUser(submitData);
        // Refresh data to ensure UI shows latest changes
        await fetchUsers();
      }
      
      setIsModalOpen(false);
      setEditingVolunteer(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        branchId: '',
        teamId: '',
        role: 'volunteer'
      });
    } catch (err: any) {
      alert(err.message || 'Failed to save user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (volunteer: User) => {
    setEditingVolunteer(volunteer);
    // Handle both frontend (branchId/teamId) and backend (branch_id/team_id) formats
    const volunteerBranchId = volunteer.branchId || (volunteer as any).branch_id || '';
    const volunteerTeamId = volunteer.teamId || (volunteer as any).team_id || '';
    
    setFormData({
      name: volunteer.name,
      email: volunteer.email,
      phone: volunteer.phone,
      password: '', // Reset password for security
      branchId: volunteerBranchId,
      teamId: volunteerTeamId,
      role: volunteer.role
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus relawan ini?')) {
      try {
        await deleteUser(id);
        // Refresh data to ensure UI shows latest changes
        await fetchUsers();
      } catch (err: any) {
        alert(err.message || 'Failed to delete user');
      }
    }
  };

  const getBranchName = (branchId: string) => {
    if (!branchId) return '-';
    return branches.find(b => b.id === branchId)?.name || '-';
  };

  const getTeamName = (teamId: string) => {
    if (!teamId) return '-';
    return teams.find(t => t.id === teamId)?.name || '-';
  };



  const getRoleLabel = (role: string) => {
    const labels = {
      admin: 'Admin',
      validator: 'Validator',
      volunteer: 'Relawan',
      branch: 'Cabang'
    };
    return labels[role as keyof typeof labels] || role;
  };

  if (isLoading) {
    return <Loader text="Memuat Data" size="medium" />;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
        <button
          onClick={() => fetchUsers()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Relawan</h1>
          <p className="text-gray-600 mt-2">Kelola data relawan dan peran mereka</p>
        </div>
        <button
          onClick={() => {
            setEditingVolunteer(null);
            setFormData({
              name: '',
              email: '',
              phone: '',
              password: '',
              branchId: '',
              teamId: '',
              role: 'volunteer'
            });
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Relawan</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari relawan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter Cabang
            </label>
            <select
              value={filterBranchId}
              onChange={(e) => {
                setFilterBranchId(e.target.value);
                setFilterTeamId(''); // Reset team filter when branch changes
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Semua Cabang</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter Tim
            </label>
            <select
              value={filterTeamId}
              onChange={(e) => setFilterTeamId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!filterBranchId}
            >
              <option value="">Semua Tim</option>
              {filterTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterBranchId('');
                setFilterTeamId('');
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Volunteers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-medium text-gray-700">ID</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Nama</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Email</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">No. HP</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Cabang</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Tim</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Peran</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedVolunteers.map((volunteer) => (
                <tr key={volunteer.id} className="border-b border-gray-100">
                  <td className="py-4 px-6 text-gray-600">#{volunteer.id}</td>
                  <td className="py-4 px-6">
                    <div className="font-medium text-gray-900">{volunteer.name}</div>
                  </td>
                  <td className="py-4 px-6 text-gray-600">{volunteer.email}</td>
                  <td className="py-4 px-6 text-gray-600">{volunteer.phone}</td>
                  <td className="py-4 px-6">{getBranchName(getVolunteerBranchId(volunteer))}</td>
                  <td className="py-4 px-6">{getTeamName(getVolunteerTeamId(volunteer))}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      volunteer.role === 'admin' ? 'bg-red-100 text-red-800' :
                      volunteer.role === 'validator' ? 'bg-blue-100 text-blue-800' :
                      volunteer.role === 'branch' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {getRoleLabel(volunteer.role)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(volunteer)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(volunteer.id)}
                        className="text-red-600 hover:text-red-800"
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
          {paginatedVolunteers.map((volunteer) => (
            <div key={volunteer.id} className="border-b border-gray-100 p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">#{volunteer.id}</h3>
                  <p className="text-sm text-gray-600">{volunteer.name}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  volunteer.role === 'admin' ? 'bg-red-100 text-red-800' :
                  volunteer.role === 'validator' ? 'bg-blue-100 text-blue-800' :
                  volunteer.role === 'branch' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {getRoleLabel(volunteer.role)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div>
                  <span className="text-gray-500">Email:</span>
                  <p className="text-gray-900">{volunteer.email}</p>
                </div>
                <div>
                  <span className="text-gray-500">No. HP:</span>
                  <p className="text-gray-900">{volunteer.phone}</p>
                </div>
                <div>
                  <span className="text-gray-500">Cabang:</span>
                  <p className="text-gray-900">{getBranchName(getVolunteerBranchId(volunteer))}</p>
                </div>
                <div>
                  <span className="text-gray-500">Tim:</span>
                  <p className="text-gray-900">{getTeamName(getVolunteerTeamId(volunteer))}</p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => handleEdit(volunteer)}
                  className="text-blue-600 hover:text-blue-800 p-2"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(volunteer.id)}
                  className="text-red-600 hover:text-red-800 p-2"
                  title="Hapus"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {filteredVolunteers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Tidak ada relawan yang ditemukan</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredVolunteers.length)} dari {filteredVolunteers.length} relawan
          </div>
          <div className="flex items-center space-x-2">
            <button
               onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
               disabled={currentPage === 1}
               className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
             >
               <ChevronLeft className="w-4 h-4" />
               <span>Sebelumnya</span>
             </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current page
                const showPage = page === 1 || page === totalPages || 
                               (page >= currentPage - 1 && page <= currentPage + 1);
                
                if (!showPage) {
                  // Show ellipsis for gaps
                  if (page === 2 && currentPage > 4) {
                    return <span key={page} className="px-2 text-gray-500">...</span>;
                  }
                  if (page === totalPages - 1 && currentPage < totalPages - 3) {
                    return <span key={page} className="px-2 text-gray-500">...</span>;
                  }
                  return null;
                }
                
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            <button
               onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
               disabled={currentPage === totalPages}
               className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
             >
               <span>Selanjutnya</span>
               <ChevronRight className="w-4 h-4" />
             </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 rounded-t-lg">
              <h3 className="text-lg font-semibold">
                {editingVolunteer ? 'Edit Relawan' : 'Tambah Relawan Baru'}
              </h3>
            </div>
            <form id="volunteer-form" onSubmit={handleSubmit}>
              <div className="px-4 sm:px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Relawan
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nomor HP
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password {editingVolunteer && '(Kosongkan jika tidak ingin mengubah)'}
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required={!editingVolunteer}
                      placeholder={editingVolunteer ? 'Masukkan password baru (opsional)' : 'Masukkan password'}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cabang
                    </label>
                    <select
                      value={formData.branchId}
                      onChange={(e) => setFormData({ ...formData, branchId: e.target.value, teamId: '' })}
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
                      onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                      disabled={!formData.branchId}
                    >
                      <option value="">{!formData.branchId ? 'Pilih cabang terlebih dahulu' : 'Pilih Tim'}</option>
                      {filteredTeams.map(team => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Peran
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    >
                      <option value="volunteer">Relawan</option>
                      <option value="branch">Cabang</option>
                      <option value="validator">Validator</option>
                      <option value="admin">Admin</option>
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
                  form="volunteer-form"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2 text-sm"
                >
                  {isSubmitting && (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  <span>{isSubmitting ? 'Menyimpan...' : (editingVolunteer ? 'Update' : 'Tambah')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}