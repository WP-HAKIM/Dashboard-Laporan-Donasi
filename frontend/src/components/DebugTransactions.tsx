import React, { useState, useEffect } from 'react';
import { transactionsAPI } from '../services/api';

interface DebugData {
  current_user: {
    id: number;
    name: string;
    role: string;
    branch_id: number | null;
    team_id: number | null;
  };
  total_transactions: number;
  total_users: number;
  sample_transactions: any[];
  my_transactions_query_result: any[];
  my_transactions_count: number;
  filter_type: string;
  filter_value: number;
}

const DebugTransactions: React.FC = () => {
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDebugData = async () => {
      try {
        setLoading(true);
        const data = await transactionsAPI.debugTransactions();
        setDebugData(data);
        console.log('Debug data:', data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch debug data');
        console.error('Debug error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDebugData();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Debug Transactions</h2>
        <p>Loading debug data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Debug Transactions</h2>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  if (!debugData) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Debug Transactions</h2>
        <p>No debug data available</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Debug Transactions</h2>
      
      <div className="space-y-6">
        {/* Current User Info */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Current User</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>ID: {debugData.current_user.id}</div>
            <div>Name: {debugData.current_user.name}</div>
            <div>Role: {debugData.current_user.role}</div>
            <div>Branch ID: {debugData.current_user.branch_id || 'NULL'}</div>
            <div>Team ID: {debugData.current_user.team_id || 'NULL'}</div>
          </div>
        </div>

        {/* Database Stats */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Database Stats</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Total Transactions: {debugData.total_transactions}</div>
            <div>Total Users: {debugData.total_users}</div>
          </div>
        </div>

        {/* Filter Info */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">My Transactions Filter</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Filter Type: {debugData.filter_type}</div>
            <div>Filter Value: {debugData.filter_value}</div>
            <div>My Transactions Count: {debugData.my_transactions_count}</div>
          </div>
        </div>

        {/* Sample Transactions */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Sample Transactions (First 3)</h3>
          {debugData.sample_transactions.length > 0 ? (
            <div className="space-y-2">
              {debugData.sample_transactions.map((transaction, index) => (
                <div key={index} className="bg-white p-2 rounded border text-sm">
                  <div>ID: {transaction.id}</div>
                  <div>Volunteer ID: {transaction.volunteer_id}</div>
                  <div>Branch ID: {transaction.branch_id}</div>
                  <div>Volunteer Name: {transaction.volunteer?.name || 'NULL'}</div>
                  <div>Branch Name: {transaction.branch?.name || 'NULL'}</div>
                  <div>Amount: {transaction.amount}</div>
                  <div>Status: {transaction.status}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">No sample transactions found</p>
          )}
        </div>

        {/* My Transactions */}
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">My Transactions Query Result</h3>
          {debugData.my_transactions_query_result.length > 0 ? (
            <div className="space-y-2">
              {debugData.my_transactions_query_result.slice(0, 5).map((transaction, index) => (
                <div key={index} className="bg-white p-2 rounded border text-sm">
                  <div>ID: {transaction.id}</div>
                  <div>Volunteer ID: {transaction.volunteer_id}</div>
                  <div>Branch ID: {transaction.branch_id}</div>
                  <div>Volunteer Name: {transaction.volunteer?.name || 'NULL'}</div>
                  <div>Branch Name: {transaction.branch?.name || 'NULL'}</div>
                  <div>Amount: {transaction.amount}</div>
                  <div>Status: {transaction.status}</div>
                </div>
              ))}
              {debugData.my_transactions_query_result.length > 5 && (
                <p className="text-sm text-gray-600">
                  ... and {debugData.my_transactions_query_result.length - 5} more transactions
                </p>
              )}
            </div>
          ) : (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <strong>PROBLEM FOUND:</strong> No transactions returned by myTransactions query!
              <br />
              This explains why the "Transaksi Saya" menu is empty.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DebugTransactions;