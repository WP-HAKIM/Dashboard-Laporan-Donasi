export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  branchId: string;
  teamId: string;
  role: 'admin' | 'validator' | 'volunteer' | 'branch';
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
}

export interface Team {
  id: string;
  name: string;
  branchId: string;
  code: string;
  branch?: Branch;
}

export interface Program {
  id: string;
  type: 'ZISWAF' | 'QURBAN';
  name: string;
  code: string;
  description: string;
  volunteerRate: number;
  branchRate: number;
}

export interface Transaction {
  id: string;
  branchId: string;
  teamId: string;
  volunteerId: string;
  programType: 'ZISWAF' | 'QURBAN';
  programId: string;
  donorName: string;
  amount: number;
  transferMethod: string;
  proofImage?: string;
  status: 'pending' | 'valid' | 'double_duta' | 'double_input' | 'not_in_account' | 'other';
  statusReason?: string;
  createdAt: string;
  validatedAt?: string;
  validatedBy?: string;
}

export interface DashboardStats {
  totalValidated: number;
  totalPending: number;
  totalTransactions: number;
  programStats: { [key: string]: number };
  branchStats: { [key: string]: number };
  topVolunteers: { name: string; amount: number }[];
}