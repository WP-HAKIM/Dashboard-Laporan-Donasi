import axios from 'axios';
import { User, Branch, Team, Program, Transaction } from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Users API
export const usersAPI = {
  getAll: async (params?: { branch_id?: string; team_id?: string; role?: string }) => {
    const response = await api.get('/users', { params });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  
  getByBranch: async (branchId: string) => {
    const response = await api.get(`/users/branch/${branchId}`);
    return response.data;
  },
  
  getByTeam: async (teamId: string) => {
    const response = await api.get(`/users/team/${teamId}`);
    return response.data;
  },
  
  create: async (data: Omit<User, 'id'> & { password: string }) => {
    const response = await api.post('/users', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<User> & { password?: string }) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/login', { email, password });
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/logout');
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get('/user');
    return response.data;
  },
};

// Branches API
export const branchesAPI = {
  getAll: async () => {
    const response = await api.get('/branches');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/branches/${id}`);
    return response.data;
  },
  
  create: async (data: Omit<Branch, 'id'>) => {
    const response = await api.post('/branches', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<Branch>) => {
    const response = await api.put(`/branches/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/branches/${id}`);
    return response.data;
  },
};

// Teams API
export const teamsAPI = {
  getAll: async () => {
    const response = await api.get('/teams');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/teams/${id}`);
    return response.data;
  },
  
  create: async (data: Omit<Team, 'id'>) => {
    const response = await api.post('/teams', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<Team>) => {
    const response = await api.put(`/teams/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/teams/${id}`);
    return response.data;
  },
};

// Programs API
export const programsAPI = {
  getAll: async () => {
    const response = await api.get('/programs');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/programs/${id}`);
    return response.data;
  },
  
  create: async (data: Omit<Program, 'id'>) => {
    const response = await api.post('/programs', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<Program>) => {
    const response = await api.put(`/programs/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/programs/${id}`);
    return response.data;
  },
};

// Transactions API
export const transactionsAPI = {
  getAll: async (params?: { 
    status?: string; 
    branch_id?: string; 
    program_id?: string;
    team_id?: string;
    program_type?: string;
    date_from?: string;
    date_to?: string;
    date_preset?: string;
  }) => {
    const response = await api.get('/transactions', { params });
    return response.data;
  },
  
  getMyTransactions: async () => {
    const response = await api.get('/my-transactions');
    return response.data;
  },
  
  getMyTransactionsStats: async () => {
    const response = await api.get('/my-transactions-stats');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },
  
  create: async (data: FormData) => {
    const response = await api.post('/transactions', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  validate: async (id: string, status: 'validated' | 'rejected', notes?: string) => {
    const response = await api.post(`/transactions/${id}/validate`, {
      status,
      validation_notes: notes,
    });
    return response.data;
  },
  
  update: async (id: string, data: Partial<Transaction> | FormData) => {
    const config: any = {};
    if (data instanceof FormData) {
      config.headers = {
        'Content-Type': 'multipart/form-data',
      };
    }
    const response = await api.put(`/transactions/${id}`, data, config);
    return response.data;
  },

  bulkUpdateStatus: async (transactionIds: string[], status: string) => {
    const response = await api.post('/transactions/bulk-update-status', {
      transaction_ids: transactionIds,
      status: status
    });
    return response.data;
  },

  import: async (transactions: any[]) => {
    const response = await api.post('/transactions/import', {
      transactions: transactions
    });
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/transactions/${id}`);
    return response.data;
  },
};

// Dashboard API
export const dashboardAPI = {
  getData: async (params?: {
    filter_type?: string;
    start_date?: string;
    end_date?: string;
    branch_id?: string;
    team_id?: string;
    volunteer_id?: string;
    program_type?: string;
  }) => {
    const response = await api.get('/dashboard', { params });
    return response.data;
  },
};

// Export the api instance as both default and named export
export { api };
export default api;