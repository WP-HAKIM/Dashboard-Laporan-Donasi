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
  LogOut
} from 'lucide-react';
import { useAuthContext } from '../../hooks/useAuth.tsx';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { user, logout } = useAuthContext();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, roles: ['admin', 'validator', 'volunteer', 'branch'] },
    { id: 'volunteers', label: 'Data Relawan', icon: Users, roles: ['admin'] },
    { id: 'programs', label: 'Program Donasi', icon: Gift, roles: ['admin'] },
    { id: 'input-transaction', label: 'Input Transaksi', icon: Plus, roles: ['admin', 'volunteer', 'branch'] },
    { id: 'validation', label: 'Validasi Transaksi', icon: CheckSquare, roles: ['admin', 'validator'] },
    { id: 'all-transactions', label: 'Semua Transaksi', icon: List, roles: ['admin', 'validator'] },
    { id: 'my-transactions', label: 'Transaksi Saya', icon: List, roles: ['volunteer', 'branch'] },
    { id: 'branches', label: 'Kantor/Cabang', icon: Building, roles: ['admin'] },
    { id: 'teams', label: 'Tim', icon: UsersRound, roles: ['admin'] }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role || '')
  );

  return (
    <div className="w-64 bg-white shadow-lg h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-blue-600">Dashboard Donasi</h1>
        <p className="text-sm text-gray-500 mt-1">{user?.name}</p>
        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full mt-2 capitalize">
          {user?.role}
        </span>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );
}