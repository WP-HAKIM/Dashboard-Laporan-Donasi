import React, { useState } from 'react';
import { AuthProvider, useAuthContext } from './hooks/useAuth.tsx';
import LoginForm from './components/Auth/LoginForm';
import Sidebar from './components/Layout/Sidebar';
import DashboardView from './components/Dashboard/DashboardView';
import VolunteerManagement from './components/Volunteers/VolunteerManagement';
import ProgramManagement from './components/Programs/ProgramManagement';
import AllTransactions from './components/Transactions/AllTransactions';
import MyTransactions from './components/Transactions/MyTransactions';
import TransactionInput from './components/Transactions/TransactionInput';
import ValidationView from './components/Transactions/ValidationView';
import BranchManagement from './components/Branches/BranchManagement';
import TeamManagement from './components/Teams/TeamManagement';

function AppContent() {
  const { user, isLoading } = useAuthContext();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'volunteers':
        return <VolunteerManagement />;
      case 'programs':
        return <ProgramManagement />;
      case 'input-transaction':
        return <TransactionInput />;
      case 'validation':
        return <ValidationView />;
      case 'all-transactions':
        return <AllTransactions />;
      case 'my-transactions':
        return <MyTransactions />;
      case 'branches':
        return <BranchManagement />;
      case 'teams':
        return <TeamManagement />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;