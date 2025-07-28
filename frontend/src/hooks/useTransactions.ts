import { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { transactionsAPI } from '../services/api';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [myTransactions, setMyTransactions] = useState<Transaction[]>([]);
  const [myTransactionsStats, setMyTransactionsStats] = useState<{
    ziswaf_total: number;
    qurban_total: number;
    volunteer_regulation: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async (params?: { 
    status?: string; 
    branch_id?: string; 
    program_id?: string;
    team_id?: string;
    program_type?: string;
    date_from?: string;
    date_to?: string;
    date_preset?: string;
  }) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await transactionsAPI.getAll(params);
      // API returns paginated data with structure: {data: [...], links: {...}, meta: {...}}
      // Filter out any null or undefined transactions
      const validTransactions = (response.data || []).filter(transaction => transaction && typeof transaction === 'object');
      setTransactions(validTransactions);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch transactions');
      console.error('Error fetching transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyTransactions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await transactionsAPI.getMyTransactions();
      // API returns paginated data with structure: {data: [...], links: {...}, meta: {...}}
      // Filter out any null or undefined transactions
      const validTransactions = (response.data || []).filter(transaction => transaction && typeof transaction === 'object');
      setMyTransactions(validTransactions);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch my transactions');
      console.error('Error fetching my transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyTransactionsStats = async () => {
    try {
      setError(null);
      const response = await transactionsAPI.getMyTransactionsStats();
      setMyTransactionsStats(response);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch my transactions stats');
      console.error('Error fetching my transactions stats:', err);
    }
  };

  // Remove auto-fetch to prevent conflicts with MyTransactions
  // Components should call fetchTransactions or fetchMyTransactions explicitly

  const createTransaction = async (data: FormData) => {
    try {
      const response = await transactionsAPI.create(data);
      setTransactions(prev => [...prev, response.data]);
      setMyTransactions(prev => [...prev, response.data]);
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to create transaction');
    }
  };

  const validateTransaction = async (id: string | number, status: 'validated' | 'rejected', notes?: string) => {
    try {
      const response = await transactionsAPI.validate(String(id), status, notes);
      const updatedTransaction = response.data;
      
      setTransactions(prev => prev.map(transaction => 
        String(transaction.id) === String(id) ? updatedTransaction : transaction
      ));
      
      setMyTransactions(prev => prev.map(transaction => 
        String(transaction.id) === String(id) ? updatedTransaction : transaction
      ).filter(transaction => transaction && typeof transaction === 'object'));
      
      return updatedTransaction;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to validate transaction');
    }
  };

  const updateTransaction = async (id: string | number, data: Partial<Transaction>) => {
    try {
      const response = await transactionsAPI.update(String(id), data);
      const updatedTransaction = response.data;
      
      setTransactions(prev => prev.map(transaction => 
        String(transaction.id) === String(id) ? updatedTransaction : transaction
      ));
      
      setMyTransactions(prev => prev.map(transaction => 
        String(transaction.id) === String(id) ? updatedTransaction : transaction
      ));
      
      return updatedTransaction;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update transaction');
    }
  };

  const bulkUpdateStatus = async (transactionIds: string[], status: string) => {
    try {
      const response = await transactionsAPI.bulkUpdateStatus(transactionIds, status);
      
      // Update local state for affected transactions
      setTransactions(prev => prev.map(transaction => 
        transactionIds.includes(String(transaction.id)) 
          ? { ...transaction, status: status as Transaction['status'] }
          : transaction
      ));
      
      setMyTransactions(prev => prev.map(transaction => 
        transactionIds.includes(String(transaction.id)) 
          ? { ...transaction, status: status as Transaction['status'] }
          : transaction
      ));
      
      return response;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to bulk update transaction status');
    }
  };

  const deleteTransaction = async (id: string | number) => {
    try {
      await transactionsAPI.delete(String(id));
      setTransactions(prev => prev.filter(transaction => String(transaction.id) !== String(id)));
      setMyTransactions(prev => prev.filter(transaction => String(transaction.id) !== String(id)));
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to delete transaction');
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    transactions,
    myTransactions,
    myTransactionsStats,
    isLoading,
    error,
    fetchTransactions,
    fetchMyTransactions,
    fetchMyTransactionsStats,
    createTransaction,
    validateTransaction,
    deleteTransaction,
    updateTransaction,
    bulkUpdateStatus,
    clearError,
  };
}