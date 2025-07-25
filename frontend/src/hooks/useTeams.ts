import { useState, useEffect } from 'react';
import { Team } from '../types';
import { teamsAPI } from '../services/api';

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await teamsAPI.getAll();
      setTeams(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch teams');
      console.error('Error fetching teams:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const createTeam = async (data: Omit<Team, 'id'>) => {
    try {
      const response = await teamsAPI.create(data);
      setTeams(prev => [...prev, response.data]);
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to create team');
    }
  };

  const updateTeam = async (id: string, data: Partial<Team>) => {
    try {
      const response = await teamsAPI.update(id, data);
      setTeams(prev => prev.map(team => 
        team.id === id ? response.data : team
      ));
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update team');
    }
  };

  const deleteTeam = async (id: string) => {
    try {
      await teamsAPI.delete(id);
      setTeams(prev => prev.filter(team => team.id !== id));
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to delete team');
    }
  };

  return {
    teams,
    isLoading,
    error,
    fetchTeams,
    createTeam,
    updateTeam,
    deleteTeam,
  };
}