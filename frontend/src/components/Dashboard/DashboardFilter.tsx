import React, { useState } from 'react';
import { Calendar, Filter, X } from 'lucide-react';
import { DashboardFilterType } from '../../hooks/useDashboard';

interface DashboardFilterProps {
  currentFilter: DashboardFilterType;
  onFilterChange: (filter: DashboardFilterType) => void;
  isLoading?: boolean;
}

const filterOptions = [
  { value: 'current_month', label: 'Bulan Berjalan' },
  { value: 'one_month_ago', label: '1 Bulan Sebelumnya' },
  { value: 'two_months_ago', label: '2 Bulan Sebelumnya' },
  { value: 'all', label: 'Semua Data' },
  { value: 'date_range', label: 'Rentang Tanggal' }
] as const;

export default function DashboardFilter({ currentFilter, onFilterChange, isLoading }: DashboardFilterProps) {
  const [isDateRangeModalOpen, setIsDateRangeModalOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(currentFilter.start_date || '');
  const [tempEndDate, setTempEndDate] = useState(currentFilter.end_date || '');

  const handleFilterTypeChange = (filterType: DashboardFilterType['filter_type']) => {
    if (filterType === 'date_range') {
      setIsDateRangeModalOpen(true);
    } else {
      onFilterChange({ filter_type: filterType });
    }
  };

  const handleDateRangeSubmit = () => {
    if (tempStartDate && tempEndDate) {
      onFilterChange({
        filter_type: 'date_range',
        start_date: tempStartDate,
        end_date: tempEndDate
      });
      setIsDateRangeModalOpen(false);
    }
  };

  const handleDateRangeCancel = () => {
    setTempStartDate(currentFilter.start_date || '');
    setTempEndDate(currentFilter.end_date || '');
    setIsDateRangeModalOpen(false);
  };

  const getCurrentFilterLabel = () => {
    if (currentFilter.filter_type === 'date_range' && currentFilter.start_date && currentFilter.end_date) {
      const startDate = new Date(currentFilter.start_date).toLocaleDateString('id-ID');
      const endDate = new Date(currentFilter.end_date).toLocaleDateString('id-ID');
      return `${startDate} - ${endDate}`;
    }
    return filterOptions.find(option => option.value === currentFilter.filter_type)?.label || 'Filter';
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900">Filter Dashboard</h3>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleFilterTypeChange(option.value)}
                disabled={isLoading}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentFilter.filter_type === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        
        {currentFilter.filter_type !== 'all' && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Filter aktif: <span className="font-medium text-gray-900">{getCurrentFilterLabel()}</span></span>
            </div>
          </div>
        )}
      </div>

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
                  value={tempStartDate}
                  onChange={(e) => setTempStartDate(e.target.value)}
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
                  value={tempEndDate}
                  onChange={(e) => setTempEndDate(e.target.value)}
                  min={tempStartDate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              {tempStartDate && tempEndDate && tempStartDate > tempEndDate && (
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
                disabled={!tempStartDate || !tempEndDate || tempStartDate > tempEndDate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}