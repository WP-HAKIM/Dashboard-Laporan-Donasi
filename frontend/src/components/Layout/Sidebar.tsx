import React from 'react';
import { 
  Home, 
  Users, 
  Gift, 
  Plus, 
  CheckSquare, 
  List, 
  Building, 
  UsersRound,
  CreditCard,
  BarChart3,
  LogOut,
  Menu,
  X,
  User,
  Settings
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.tsx';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({ activeTab, setActiveTab, collapsed, setCollapsed }: SidebarProps) {
  const { user, logout } = useAuth();

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: 'Admin',
      validator: 'Validator',
      volunteer: 'Relawan',
      branch: 'Cabang'
    };
    return labels[role as keyof typeof labels] || role;
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, roles: ['admin', 'validator', 'volunteer', 'branch'] },
    { id: 'input-transaction', label: 'Input Transaksi', icon: Plus, roles: ['admin', 'volunteer', 'branch'] },
    { id: 'validation', label: 'Validasi Transaksi', icon: CheckSquare, roles: ['admin', 'validator'] },
    { id: 'all-transactions', label: 'Semua Transaksi', icon: List, roles: ['admin', 'validator'] },
    { id: 'my-transactions', label: 'Transaksi Saya', icon: List, roles: ['volunteer', 'branch'] },
    { id: 'reports', label: 'Laporan', icon: BarChart3, roles: ['admin', 'validator', 'branch'] },
    { id: 'volunteers', label: 'Data Relawan', icon: Users, roles: ['admin', 'branch'] },
    { id: 'programs', label: 'Program Donasi', icon: Gift, roles: ['admin'] },
    { id: 'payment-methods', label: 'Metode Pembayaran', icon: CreditCard, roles: ['admin'] },
    { id: 'branches', label: 'Kantor/Cabang', icon: Building, roles: ['admin'] },
    { id: 'teams', label: 'Tim', icon: UsersRound, roles: ['admin'] },
    {
      id: 'settings',
      label: 'Pengaturan Tampilan',
      icon: Settings,
      roles: ['admin']
    },
    { id: 'profile', label: 'Profile Saya', icon: User, roles: ['admin', 'validator', 'volunteer', 'branch'] }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role || '')
  );

  return (
    <>
      {/* Mobile Overlay */}
      {!collapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`${
        collapsed ? '-translate-x-full lg:translate-x-0 lg:w-16' : 'translate-x-0 w-64'
      } fixed lg:sticky lg:top-0 z-50 bg-white shadow-lg h-screen flex flex-col transition-all duration-300 ease-in-out`}>
        
        {/* Header with Toggle Button */}
        <div className="p-4 lg:p-6 border-b border-gray-200 flex items-center justify-between">
          <div className={`${collapsed ? 'lg:hidden' : 'block'}`}>
            <h1 className="text-xl font-bold text-blue-600">Dashboard Donasi</h1>
            <p className="text-sm text-gray-500 mt-1">{user?.name}</p>
            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full mt-2 capitalize">
              {getRoleLabel(user?.role || '')}
            </span>
          </div>
          
          {/* Toggle Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
          >
            {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
          
          {/* Desktop Toggle Button (only visible when collapsed) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`hidden lg:block p-2 pl-0 rounded-lg hover:bg-gray-100 transition-colors ${
              collapsed ? 'mx-auto' : 'hidden'
            }`}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setActiveTab(item.id);
                      // Close sidebar on mobile after selection
                      if (window.innerWidth < 1024) {
                        setCollapsed(true);
                      }
                    }}
                    className={`w-full flex items-center ${collapsed ? 'justify-center lg:justify-center' : 'space-x-3'} px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === item.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    title={collapsed ? item.label : ''}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className={`${collapsed ? 'lg:hidden' : 'block'} truncate`}>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className={`w-full flex items-center ${collapsed ? 'justify-center lg:justify-center' : 'space-x-3'} px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors`}
            title={collapsed ? 'Keluar' : ''}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className={`${collapsed ? 'lg:hidden' : 'block'}`}>Keluar</span>
          </button>
        </div>
      </div>
      
      {/* Mobile Header with Menu Button and Dashboard Title (when sidebar is collapsed) */}
      {collapsed && (
        <div className="fixed top-0 left-0 right-0 z-30 lg:hidden bg-white shadow-lg border-b border-gray-200 flex items-center justify-center w-full px-4 py-4">
          <button
            onClick={() => setCollapsed(false)}
            className="absolute left-4 p-2 hover:bg-gray-50 transition-colors rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-blue-600">Dashboard Donasi</h1>
        </div>
      )}
    </>
  );
}