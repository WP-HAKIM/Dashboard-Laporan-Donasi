import { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { transactionsAPI } from '../services/api';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [myTransactions, setMyTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
      setTransactions(response.data || []);
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
      setMyTransactions(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch my transactions');
      console.error('Error fetching my transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

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

  const validateTransaction = async (id: string, status: 'validated' | 'rejected', notes?: string) => {
    try {
      const response = await transactionsAPI.validate(id, status, notes);
      const updatedTransaction = response.data;
      
      setTransactions(prev => prev.map(transaction => 
        transaction.id === id ? updatedTransaction : transaction
      ));
      
      setMyTransactions(prev => prev.map(transaction => 
        transaction.id === id ? updatedTransaction : transaction
      ));
      
      return updatedTransaction;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to validate transaction');
    }
  };

  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    try {
      const response = await transactionsAPI.update(id, data);
      const updatedTransaction = response.data;
      
      setTransactions(prev => prev.map(transaction => 
        transaction.id === id ? updatedTransaction : transaction
      ));
      
      setMyTransactions(prev => prev.map(transaction => 
        transaction.id === id ? updatedTransaction : transaction
      ));
      
      return updatedTransaction;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update transaction');
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await transactionsAPI.delete(id);
      setTransactions(prev => prev.filter(transaction => transaction.id !== id));
      setMyTransactions(prev => prev.filter(transaction => transaction.id !== id));
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to delete transaction');
    }
  };

  return {
    transactions,
    myTransactions,
    isLoading,
    error,
    fetchTransactions,
    fetchMyTransactions,
    createTransaction,
    validateTransaction,
    updateTransaction,
    deleteTransaction,
  };
}