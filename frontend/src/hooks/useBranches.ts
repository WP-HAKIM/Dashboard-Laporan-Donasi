import { useState, useEffect } from 'react';
import { Branch } from '../types';
import { branchesAPI } from '../services/api';

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBranches = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await branchesAPI.getAll();
      setBranches(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch branches');
      console.error('Error fetching branches:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const createBranch = async (data: Omit<Branch, 'id'>) => {
    try {
      const response = await branchesAPI.create(data);
      setBranches(prev => [...prev, response.data]);
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to create branch');
    }
  };

  const updateBranch = async (id: string, data: Partial<Branch>) => {
    try {
      const response = await branchesAPI.update(id, data);
      setBranches(prev => prev.map(branch => 
        branch.id === id ? response.data : branch
      ));
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update branch');
    }
  };

  const deleteBranch = async (id: string) => {
    try {
      await branchesAPI.delete(id);
      setBranches(prev => prev.filter(branch => branch.id !== id));
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to delete branch');
    }
  };

  return {
    branches,
    isLoading,
    error,
    fetchBranches,
    createBranch,
    updateBranch,
    deleteBranch,
  };
}