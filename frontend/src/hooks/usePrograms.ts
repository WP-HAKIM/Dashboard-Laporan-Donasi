import { useState, useEffect } from 'react';
import { Program } from '../types';
import { programsAPI } from '../services/api';

export function usePrograms() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const transformProgram = (program: any): Program => ({
    id: program.id,
    type: program.type,
    name: program.name,
    code: program.code,
    description: program.description,
    volunteerRate: program.volunteer_rate || program.volunteerRate,
    branchRate: program.branch_rate || program.branchRate
  });

  const fetchPrograms = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await programsAPI.getAll();
      // Handle both old and new response formats
      const programsData = response.data?.data || response.data || [];
      const transformedPrograms = programsData.map(transformProgram);
      setPrograms(transformedPrograms);
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
      // Transform frontend data to backend format
      const backendData = {
        type: data.type,
        name: data.name,
        code: data.code,
        description: data.description,
        volunteer_rate: data.volunteerRate,
        branch_rate: data.branchRate
      };
      const response = await programsAPI.create(backendData);
      // Handle both old and new response formats
      const programData = response.data?.data || response.data;
      const transformedProgram = transformProgram(programData);
      setPrograms(prev => [...prev, transformedProgram]);
      return transformedProgram;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to create program');
    }
  };

  const updateProgram = async (id: string, data: Partial<Program>) => {
    try {
      // Transform frontend data to backend format
      const backendData: any = {};
      if (data.type) backendData.type = data.type;
      if (data.name) backendData.name = data.name;
      if (data.code) backendData.code = data.code;
      if (data.description) backendData.description = data.description;
      if (data.volunteerRate !== undefined) backendData.volunteer_rate = data.volunteerRate;
      if (data.branchRate !== undefined) backendData.branch_rate = data.branchRate;
      
      const response = await programsAPI.update(id, backendData);
      // Handle both old and new response formats
      const programData = response.data?.data || response.data;
      const transformedProgram = transformProgram(programData);
      setPrograms(prev => prev.map(program => 
        program.id === id ? transformedProgram : program
      ));
      return transformedProgram;
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