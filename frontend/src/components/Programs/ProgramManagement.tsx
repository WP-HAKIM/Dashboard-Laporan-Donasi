import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Program } from '../../types';
import { usePrograms } from '../../hooks/usePrograms';
import Loader from '../Common/Loader';

export default function ProgramManagement() {
  const { programs, isLoading, error, createProgram, updateProgram, deleteProgram } = usePrograms();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Filter state
  const [filterType, setFilterType] = useState<'ALL' | 'ZISWAF' | 'QURBAN'>('ALL');
  const [formData, setFormData] = useState({
    type: 'ZISWAF' as 'ZISWAF' | 'QURBAN',
    name: '',
    code: '',
    description: '',
    volunteerRate: 15,
    branchRate: 70
  });

  // Apply all filters
  const filteredPrograms = programs.filter(program => {
    // Search filter
    const matchesSearch = program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Type filter
    const matchesType = filterType === 'ALL' || program.type === filterType;
    
    return matchesSearch && matchesType;
  });
  
  // Pagination logic
  const totalPages = Math.ceil(filteredPrograms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPrograms = filteredPrograms.slice(startIndex, endIndex);
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validasi data sebelum dikirim
      if (!formData.name.trim()) {
        alert('Nama program harus diisi');
        return;
      }
      if (!formData.code.trim()) {
        alert('Kode program harus diisi');
        return;
      }
      if (!formData.description.trim()) {
        alert('Deskripsi program harus diisi');
        return;
      }
      if (formData.volunteerRate < 0 || formData.volunteerRate > 100) {
        alert('Regulasi relawan harus antara 0-100%');
        return;
      }
      if (formData.branchRate < 0 || formData.branchRate > 100) {
        alert('Regulasi cabang harus antara 0-100%');
        return;
      }

      if (editingProgram) {
        await updateProgram(editingProgram.id, formData);
      } else {
        await createProgram(formData);
      }

      setIsModalOpen(false);
      setEditingProgram(null);
      setFormData({
        type: 'ZISWAF',
        name: '',
        code: '',
        description: '',
        volunteerRate: 15,
        branchRate: 70
      });
    } catch (error: any) {
      console.error('Error saving program:', error);
      const errorMessage = error.message || 'Terjadi kesalahan saat menyimpan program';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (program: Program) => {
    setEditingProgram(program);
    setFormData({
      type: program.type,
      name: program.name,
      code: program.code,
      description: program.description,
      volunteerRate: program.volunteerRate,
      branchRate: program.branchRate
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus program ini?')) {
      try {
        await deleteProgram(id);
      } catch (error) {
        console.error('Error deleting program:', error);
        alert('Terjadi kesalahan saat menghapus program');
      }
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
          <h1 className="text-3xl font-bold text-gray-900">Program Donasi</h1>
          <p className="text-gray-600 mt-2">Kelola program donasi ZISWAF dan QURBAN</p>
        </div>
        <button
          onClick={() => {
            setEditingProgram(null);
            setFormData({
              type: 'ZISWAF',
              name: '',
              code: '',
              description: '',
              volunteerRate: 15,
              branchRate: 70
            });
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Program</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari program..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter Jenis Program
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'ALL' | 'ZISWAF' | 'QURBAN')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Semua Jenis</option>
              <option value="ZISWAF">ZISWAF</option>
              <option value="QURBAN">QURBAN</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('ALL');
                setCurrentPage(1);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Programs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Jenis</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Nama Program</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Kode</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Deskripsi</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Regulasi Relawan</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Regulasi Cabang</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPrograms.length > 0 ? (
                paginatedPrograms.map((program) => (
                  <tr key={program.id} className="border-b border-gray-100">
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        program.type === 'ZISWAF' 
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {program.type}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{program.name}</div>
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {program.code}
                    </td>
                    <td className="py-4 px-6 text-gray-600 max-w-xs truncate">
                      {program.description}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="font-medium text-blue-600">{program.volunteerRate}%</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="font-medium text-green-600">{program.branchRate}%</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(program)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(program.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="text-lg">📋</div>
                      <div>
                        {filteredPrograms.length === 0 && programs.length > 0
                          ? 'Tidak ada program yang sesuai dengan filter'
                          : 'Belum ada program donasi'
                        }
                      </div>
                      <div className="text-sm">
                        {filteredPrograms.length === 0 && programs.length > 0
                          ? 'Coba ubah kriteria pencarian atau filter'
                          : 'Silakan tambah program baru atau pastikan Anda sudah login'
                        }
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile/Tablet Card View */}
        <div className="lg:hidden">
          {paginatedPrograms.length > 0 ? (
            paginatedPrograms.map((program) => (
              <div key={program.id} className="border-b border-gray-100 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      program.type === 'ZISWAF' 
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {program.type}
                    </span>
                    <span className="text-sm text-gray-500">{program.code}</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(program)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(program.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mb-3">
                  <h3 className="font-medium text-gray-900 mb-1">{program.name}</h3>
                  <p className="text-sm text-gray-600">{program.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Regulasi Relawan:</span>
                    <p className="font-medium text-blue-600">{program.volunteerRate}%</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Regulasi Cabang:</span>
                    <p className="font-medium text-green-600">{program.branchRate}%</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-gray-500">
              <div className="flex flex-col items-center space-y-2">
                <div className="text-lg">📋</div>
                <div>
                  {filteredPrograms.length === 0 && programs.length > 0
                    ? 'Tidak ada program yang sesuai dengan filter'
                    : 'Belum ada program donasi'
                  }
                </div>
                <div className="text-sm">
                  {filteredPrograms.length === 0 && programs.length > 0
                    ? 'Coba ubah kriteria pencarian atau filter'
                    : 'Silakan tambah program baru atau pastikan Anda sudah login'
                  }
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {filteredPrograms.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredPrograms.length)} dari {filteredPrograms.length} program
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Sebelumnya
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current page
                  const showPage = page === 1 || page === totalPages || 
                                  (page >= currentPage - 1 && page <= currentPage + 1);
                  
                  if (!showPage) {
                    // Show ellipsis
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
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
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
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Selanjutnya
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">
              {editingProgram ? 'Edit Program' : 'Tambah Program Baru'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jenis Program
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'ZISWAF' | 'QURBAN' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="ZISWAF">ZISWAF</option>
                  <option value="QURBAN">QURBAN</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Program
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kode Program
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contoh: ZF24"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi Singkat
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Regulasi Relawan (%)
                  </label>
                  <input
                    type="number"
                    value={formData.volunteerRate}
                    onChange={(e) => setFormData({ ...formData, volunteerRate: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    max="100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Regulasi Cabang (%)
                  </label>
                  <input
                    type="number"
                    value={formData.branchRate}
                    onChange={(e) => setFormData({ ...formData, branchRate: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    max="100"
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSubmitting && <Loader className="w-4 h-4 animate-spin" />}
                  <span>{isSubmitting ? 'Memproses...' : (editingProgram ? 'Update' : 'Tambah')}</span>
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