import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, Users, Loader } from 'lucide-react';
import { Team } from '../../types';
import { useTeams } from '../../hooks/useTeams';
import { useBranches } from '../../hooks/useBranches';

export default function TeamManagement() {
  const { teams, isLoading: teamsLoading, error: teamsError, createTeam, updateTeam, deleteTeam } = useTeams();
  const { branches, isLoading: branchesLoading } = useBranches();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    branchId: '',
    code: ''
  });

  const filteredTeams = teams.filter(team => {
    const matchesSearch = 
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Handle different branch ID formats from backend
    const teamBranchId = team.branchId || (team as any).branch_id || team.branch?.id;
    
    // Convert both to string for comparison to handle type differences
    const matchesBranch = !filterBranch || String(teamBranchId) === String(filterBranch);
    
    return matchesSearch && matchesBranch;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData = {
        name: formData.name,
        branch_id: formData.branchId,
        code: formData.code
      };
      
      if (editingTeam) {
        await updateTeam(editingTeam.id, submitData);
      } else {
        await createTeam(submitData);
      }
      setIsModalOpen(false);
      setFormData({ name: '', branchId: '', code: '' });
      setEditingTeam(null);
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      branchId: team.branchId || (team as any).branch_id || team.branch?.id || '',
      code: team.code
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus tim ini?')) {
      try {
        await deleteTeam(id);
      } catch (err: any) {
        alert(err.message || 'Terjadi kesalahan saat menghapus tim');
      }
    }
  };

  const getBranchName = (branchId: string) => {
    return branches.find(b => b.id === branchId)?.name || '-';
  };

  const getTeamsByBranch = () => {
    const teamsByBranch: { [key: string]: Team[] } = {};
    filteredTeams.forEach(team => {
      const teamBranchId = team.branchId || (team as any).branch_id || team.branch?.id;
      if (!teamsByBranch[teamBranchId]) {
        teamsByBranch[teamBranchId] = [];
      }
      teamsByBranch[teamBranchId].push(team);
    });
    return teamsByBranch;
  };

  const teamsByBranch = getTeamsByBranch();

  if (teamsLoading || branchesLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2">
          <Loader className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Memuat data tim...</span>
        </div>
      </div>
    );
  }

  if (teamsError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error: {teamsError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tim</h1>
          <p className="text-gray-600 mt-2">Kelola tim relawan di setiap cabang</p>
        </div>
        <button
          onClick={() => {
            setEditingTeam(null);
            setFormData({
              name: '',
              branchId: '',
              code: ''
            });
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Tim</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari tim..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Semua Cabang</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Teams by Branch */}
      <div className="space-y-8">
        {Object.entries(teamsByBranch).map(([branchId, branchTeams]) => {
          // Coba ambil data branch dari tim pertama, atau fallback ke pencarian di branches
          const branch = branchTeams[0]?.branch || branches.find(b => b.id === branchId);
          return (
            <div key={branchId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {branch?.name || 'Cabang Tidak Diketahui'} ({branchTeams.length} tim)
                </h2>
                <span className="text-sm text-gray-500">Kode: {branch?.code || '-'}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {branchTeams.map((team) => (
                  <div key={team.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{team.name}</h3>
                          <p className="text-sm text-gray-500">Kode: {team.code}</p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEdit(team)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(team.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* No teams message */}
      {Object.keys(teamsByBranch).length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Tidak ada tim yang ditemukan</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">
              {editingTeam ? 'Edit Tim' : 'Tambah Tim Baru'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cabang
                </label>
                <select
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  Nama Tim
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contoh: Tim Alpha"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kode Tim
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contoh: ALPHA"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSubmitting && <Loader className="w-4 h-4 animate-spin" />}
                  <span>{isSubmitting ? 'Memproses...' : (editingTeam ? 'Update' : 'Tambah')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}