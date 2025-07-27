import React, { useState, useEffect } from 'react';
import { Calendar, Filter, X } from 'lucide-react';
import { DashboardFilterType, DashboardData } from '../../hooks/useDashboard';
import { branchesAPI, teamsAPI, usersAPI, programsAPI } from '../../services/api';
import SearchableSelect from '../Common/SearchableSelect';

interface DashboardFilterProps {
  currentFilter: DashboardFilterType;
  onFilterChange: (filter: DashboardFilterType) => void;
  isLoading?: boolean;
  dashboardData?: DashboardData | null;
}

const filterOptions = [
  { value: 'current_month', label: 'Bulan Berjalan' },
  { value: 'one_month_ago', label: '1 Bulan Sebelumnya' },
  { value: 'two_months_ago', label: '2 Bulan Sebelumnya' },
  { value: 'all', label: 'Semua Data' },
  { value: 'date_range', label: 'Rentang Tanggal' }
] as const;

interface Branch {
  id: number;
  name: string;
}

interface Team {
  id: number;
  name: string;
  branch_id: number;
}

interface User {
  id: number;
  name: string;
  role: string;
  branch_id: number;
  team_id: number;
}

interface Program {
  id: number;
  name: string;
  type: string;
}

export default function DashboardFilter({ currentFilter, onFilterChange, isLoading, dashboardData }: DashboardFilterProps) {
  const [isDateRangeModalOpen, setIsDateRangeModalOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(currentFilter.start_date || '');
  const [tempEndDate, setTempEndDate] = useState(currentFilter.end_date || '');
  
  // Filter states
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedVolunteer, setSelectedVolunteer] = useState('');
  const [selectedProgramType, setSelectedProgramType] = useState('');
  
  // Data states
  const [branches, setBranches] = useState<Branch[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [volunteers, setVolunteers] = useState<User[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  
  // Filtered data
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [filteredVolunteers, setFilteredVolunteers] = useState<User[]>([]);
  const [allVolunteerNames, setAllVolunteerNames] = useState<Array<{value: string, label: string}>>([]);

  // Helper function to get volunteer name from transaction (similar to AllTransactions.tsx)
  const getVolunteerNameFromTransaction = (transaction: any) => {
    if (!transaction) return null;
    
    // First check if volunteer object is embedded
    if (transaction.volunteer?.name) {
      return transaction.volunteer.name;
    }
    
    // Check if there's a volunteer_name field directly
    if (transaction.volunteer_name) {
      return transaction.volunteer_name;
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
    
    return null;
  };

  // Get unique volunteer names from dashboard data
  const getUniqueVolunteerNames = () => {
    const volunteerNames = new Set<string>();
    
    // Add names from recent transactions
    if (dashboardData?.recent_transactions) {
      dashboardData.recent_transactions.forEach(transaction => {
        const name = getVolunteerNameFromTransaction(transaction);
        if (name && name !== '-' && name.trim() !== '') {
          volunteerNames.add(name);
        }
      });
    }
    
    // Add names from top volunteers
    if (dashboardData?.volunteer_stats?.top_volunteers) {
      dashboardData.volunteer_stats.top_volunteers.forEach(volunteer => {
        if (volunteer.volunteer_name && volunteer.volunteer_name !== '-' && volunteer.volunteer_name.trim() !== '') {
          volunteerNames.add(volunteer.volunteer_name);
        }
      });
    }
    
    // Add names from users API (existing volunteers)
    volunteers.forEach(volunteer => {
      if (volunteer.name && volunteer.name !== '-' && volunteer.name.trim() !== '') {
        volunteerNames.add(volunteer.name);
      }
    });
    
    // Convert to sorted array of options
    return Array.from(volunteerNames)
      .sort()
      .map(name => ({ value: name, label: name }));
  };

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
  
  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [branchesRes, teamsRes, usersRes, programsRes] = await Promise.all([
          branchesAPI.getAll(),
          teamsAPI.getAll(),
          usersAPI.getAll(),
          programsAPI.getAll()
        ]);
        
        setBranches(branchesRes.data || []);
        setTeams(teamsRes.data || []);
        setVolunteers(usersRes.data?.filter((user: User) => user.role === 'volunteer') || []);
        setPrograms(programsRes.data || []);
      } catch (error) {
        console.error('Error loading filter data:', error);
      }
    };
    
    loadData();
  }, []);
  
  // Filter teams based on selected branch (cascading logic like transactions page)
  useEffect(() => {
    if (selectedBranch) {
      const filtered = teams.filter(team => {
        const teamBranchId = team.branch_id || (team as any).branchId;
        return String(teamBranchId) === String(selectedBranch);
      });
      setFilteredTeams(filtered);
      
      // Reset team and volunteer if current team doesn't belong to selected branch
      if (selectedTeam) {
        const isTeamValid = filtered.some(team => String(team.id) === String(selectedTeam));
        if (!isTeamValid) {
          setSelectedTeam('');
          setSelectedVolunteer('');
        }
      }
    } else {
      setFilteredTeams(teams);
    }
  }, [selectedBranch, teams, selectedTeam]);
  
  // Filter volunteers based on selected team (cascading logic like transactions page)
  useEffect(() => {
    if (selectedTeam) {
      const filtered = volunteers.filter(volunteer => {
        const volunteerTeamId = volunteer.team_id || (volunteer as any).teamId;
        return String(volunteerTeamId) === String(selectedTeam);
      });
      setFilteredVolunteers(filtered);
      
      // Reset volunteer if current volunteer doesn't belong to selected team
      if (selectedVolunteer) {
        let isVolunteerValid = false;
        if (selectedVolunteer.startsWith('name:')) {
          // For name-based values, check by name
          const volunteerName = selectedVolunteer.substring(5);
          isVolunteerValid = filtered.some(volunteer => volunteer.name === volunteerName);
        } else {
          // For ID-based values, check by ID
          isVolunteerValid = filtered.some(volunteer => String(volunteer.id) === selectedVolunteer);
        }
        if (!isVolunteerValid) {
          setSelectedVolunteer('');
        }
      }
    } else if (selectedBranch) {
      // If branch is selected but no team, show volunteers from that branch
      const filtered = volunteers.filter(volunteer => {
        const volunteerBranchId = volunteer.branch_id || (volunteer as any).branchId;
        return String(volunteerBranchId) === String(selectedBranch);
      });
      setFilteredVolunteers(filtered);
      
      // Reset volunteer if current volunteer doesn't belong to selected branch
       if (selectedVolunteer) {
         let isVolunteerValid = false;
         if (selectedVolunteer.startsWith('name:')) {
           // For name-based values, check by name
           const volunteerName = selectedVolunteer.substring(5);
           isVolunteerValid = filtered.some(volunteer => volunteer.name === volunteerName);
         } else {
           // For ID-based values, check by ID
           isVolunteerValid = filtered.some(volunteer => String(volunteer.id) === selectedVolunteer);
         }
         if (!isVolunteerValid) {
           setSelectedVolunteer('');
         }
       }
    } else {
      setFilteredVolunteers(volunteers);
    }
  }, [selectedBranch, selectedTeam, volunteers, selectedVolunteer]);
  
  // Update volunteer names when dashboard data or volunteers change
  useEffect(() => {
    const uniqueNames = getUniqueVolunteerNames();
    setAllVolunteerNames(uniqueNames);
  }, [dashboardData, volunteers]);
  
  // Initialize local filter states from currentFilter
  useEffect(() => {
    setSelectedBranch(currentFilter.branch_id || '');
    setSelectedTeam(currentFilter.team_id || '');
    
    // For volunteer, we need to handle both ID and name
    if (currentFilter.volunteer_id) {
      // If volunteer_id is numeric, use it as ID
      if (!isNaN(Number(currentFilter.volunteer_id))) {
        setSelectedVolunteer(String(currentFilter.volunteer_id));
      } else {
        // If it's a name, prefix it to distinguish from ID
        setSelectedVolunteer(`name:${currentFilter.volunteer_id}`);
      }
    } else {
      setSelectedVolunteer('');
    }
    
    setSelectedProgramType(currentFilter.program_name || '');
  }, [currentFilter.branch_id, currentFilter.team_id, currentFilter.volunteer_id, currentFilter.program_name, volunteers]);
  
  // Handle filter changes automatically
  const applyFilters = () => {
    // For volunteer filter, handle both ID and name-based values
    let volunteerIdToFilter = undefined;
    if (selectedVolunteer) {
      if (selectedVolunteer.startsWith('name:')) {
        // Extract name from prefixed value
        volunteerIdToFilter = selectedVolunteer.substring(5); // Remove 'name:' prefix
      } else {
        // It's an ID, find the volunteer and use the ID for filtering
        const foundVolunteer = volunteers.find(v => String(v.id) === selectedVolunteer);
        if (foundVolunteer) {
          volunteerIdToFilter = String(foundVolunteer.id);
        } else {
          // Fallback: use the value directly
          volunteerIdToFilter = selectedVolunteer;
        }
      }
    }
    
    const newFilter = {
      ...currentFilter,
      branch_id: selectedBranch || undefined,
      team_id: selectedTeam || undefined,
      volunteer_id: volunteerIdToFilter,
      program_name: selectedProgramType || undefined
    };
    
    // Only apply filter if it's actually different from current filter
    const isFilterChanged = (
      (newFilter.branch_id || '') !== (currentFilter.branch_id || '') ||
      (newFilter.team_id || '') !== (currentFilter.team_id || '') ||
      (newFilter.volunteer_id || '') !== (currentFilter.volunteer_id || '') ||
      (newFilter.program_name || '') !== (currentFilter.program_name || '')
    );
    
    if (isFilterChanged) {
      onFilterChange(newFilter);
    }
  };

  // Auto-apply filters when any filter value changes (with debounce to prevent loops)
  const [isApplying, setIsApplying] = useState(false);
  
  useEffect(() => {
    if (!isApplying) {
      const timeoutId = setTimeout(() => {
        setIsApplying(true);
        applyFilters();
        setTimeout(() => setIsApplying(false), 100);
      }, 300); // 300ms debounce
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedBranch, selectedTeam, selectedVolunteer, selectedProgramType]);
  


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
        
        {/* Advanced Filters */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Branch Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cabang</label>
              <SearchableSelect
                options={[
                  { value: '', label: 'Semua Cabang' },
                  ...branches.map(branch => ({
                    value: String(branch.id),
                    label: branch.name
                  }))
                ]}
                value={selectedBranch}
                onChange={(value) => {
                  setSelectedBranch(value);
                  // Reset dependent filters when branch changes
                  if (value !== selectedBranch) {
                    setSelectedTeam('');
                    setSelectedVolunteer('');
                  }
                }}
                placeholder="Pilih Cabang..."
                className="text-sm"
              />
            </div>
            
            {/* Team Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tim</label>
              <SearchableSelect
                options={[
                  { value: '', label: 'Semua Tim' },
                  ...filteredTeams.map(team => ({
                    value: String(team.id),
                    label: team.name
                  }))
                ]}
                value={selectedTeam}
                onChange={(value) => {
                  setSelectedTeam(value);
                  // Reset volunteer when team changes
                  if (value !== selectedTeam) {
                    setSelectedVolunteer('');
                  }
                }}
                placeholder="Pilih Tim..."
                className="text-sm"
              />
            </div>
            
            {/* Volunteer Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Relawan</label>
              <SearchableSelect
                options={[
                  { value: '', label: 'Semua Relawan' },
                  // Use filtered volunteers based on branch/team selection
                  ...filteredVolunteers.map(volunteer => ({
                    value: String(volunteer.id),
                    label: volunteer.name
                  })),
                  // Also include volunteer names from dashboard data that might not be in the users list
                  ...allVolunteerNames.filter(name => 
                    !filteredVolunteers.some(volunteer => volunteer.name === name.value)
                  ).map(name => ({
                    value: `name:${name.value}`, // Prefix to distinguish from ID
                    label: name.value
                  }))
                ]}
                value={selectedVolunteer}
                onChange={(value) => setSelectedVolunteer(value)}
                placeholder="Pilih Relawan..."
                className="text-sm"
              />
            </div>
            
            {/* Program Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
              <SearchableSelect
                options={[
                  { value: '', label: 'Semua Program' },
                  ...programs.map(program => ({
                    value: program.name,
                    label: program.name
                  }))
                ]}
                value={selectedProgramType}
                onChange={(value) => setSelectedProgramType(value)}
                placeholder="Pilih Program..."
                className="text-sm"
              />
            </div>
            

          </div>
        </div>
        
        {/* Active Filters Display */}
        {(currentFilter.filter_type !== 'all' || currentFilter.branch_id || currentFilter.team_id || currentFilter.volunteer_id || currentFilter.program_name) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Filter aktif:</span>
              
              {/* Time Filter */}
              {currentFilter.filter_type !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {getCurrentFilterLabel()}
                </span>
              )}
              
              {/* Branch Filter */}
              {currentFilter.branch_id && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Cabang: {branches.find(b => String(b.id) === currentFilter.branch_id)?.name || currentFilter.branch_id}
                </span>
              )}
              
              {/* Team Filter */}
              {currentFilter.team_id && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Tim: {teams.find(t => String(t.id) === currentFilter.team_id)?.name || currentFilter.team_id}
                </span>
              )}
              
              {/* Volunteer Filter */}
              {currentFilter.volunteer_id && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Relawan: {currentFilter.volunteer_id}
                </span>
              )}
              
              {/* Program Filter */}
              {currentFilter.program_name && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                  Program: {currentFilter.program_name}
                </span>
              )}
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