import { useState, useEffect } from 'react';
import { Program } from '../types';
import { programsAPI } from '../services/api';

export function usePrograms() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrograms = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await programsAPI.getAll();
      setPrograms(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch programs');
      console.error('Error fetching programs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const createProgram = async (data: Omit<Program, 'id'>) => {
    try {
      const response = await programsAPI.create(data);
      setPrograms(prev => [...prev, response.data]);
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to create program');
    }
  };

  const updateProgram = async (id: string, data: Partial<Program>) => {
    try {
      const response = await programsAPI.update(id, data);
      setPrograms(prev => prev.map(program => 
        program.id === id ? response.data : program
      ));
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update program');
    }
  };

  const deleteProgram = async (id: string) => {
    try {
      await programsAPI.delete(id);
      setPrograms(prev => prev.filter(program => program.id !== id));
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to delete program');
    }
  };

  return {
    programs,
    isLoading,
    error,
    fetchPrograms,
    createProgram,
    updateProgram,
    deleteProgram,
  };
}