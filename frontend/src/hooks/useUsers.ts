import { useState, useEffect } from 'react';
import { User } from '../types';
import { usersAPI } from '../services/api';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async (params?: { branch_id?: string; team_id?: string; role?: string }) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await usersAPI.getAll(params);
      setUsers(response.data || response || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const createUser = async (data: Omit<User, 'id'> & { password: string }) => {
    try {
      const response = await usersAPI.create(data);
      const newUser = response.data || response;
      setUsers(prev => [...prev, newUser]);
      return newUser;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to create user');
    }
  };

  const updateUser = async (id: string, data: Partial<User> & { password?: string }) => {
    try {
      const response = await usersAPI.update(id, data);
      const updatedUser = response.data || response;
      setUsers(prev => prev.map(user => 
        user.id === id ? updatedUser : user
      ));
      return updatedUser;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update user');
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await usersAPI.delete(id);
      setUsers(prev => prev.filter(user => user.id !== id));
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const getUsersByBranch = async (branchId: string) => {
    try {
      const response = await usersAPI.getByBranch(branchId);
      return response.data || response || [];
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to fetch users by branch');
    }
  };

  const getUsersByTeam = async (teamId: string) => {
    try {
      const response = await usersAPI.getByTeam(teamId);
      return response.data || response || [];
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to fetch users by team');
    }
  };

  return {
    users,
    isLoading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    getUsersByBranch,
    getUsersByTeam,
  };
}