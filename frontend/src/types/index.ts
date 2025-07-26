export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  // Frontend camelCase fields
  branchId: string;
  teamId: string;
  role: 'admin' | 'validator' | 'volunteer' | 'branch';
  // Backend snake_case fields
  branch_id?: string;
  team_id?: string;
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
  // Frontend camelCase fields
  branchId: string;
  code: string;
  branch?: Branch;
  // Backend snake_case fields
  branch_id?: string;
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
  id: number;
  // Backend snake_case fields (primary)
  branch_id: number;
  team_id: number;
  volunteer_id: number;
  program_type: 'ZISWAF' | 'QURBAN';
  program_id: number;
  donor_name: string;
  amount: number;
  transaction_date: string;
  transfer_method: string;
  proof_image?: string;
  status: 'pending' | 'valid' | 'double_duta' | 'double_input' | 'not_in_account' | 'other';
  status_reason?: string;
  validated_at?: string;
  validated_by?: number;
  created_at: string;
  updated_at: string;
  
  // Nested relations from backend
  branch?: Branch;
  team?: Team;
  volunteer?: User;
  program?: Program;
  validator?: User;
  
  // Frontend camelCase compatibility fields (from backend accessors)
  branchId?: number;
  teamId?: number;
  volunteerId?: number;
  programId?: number;
  donorName?: string;
  transferMethod?: string;
  transactionDate?: string;
  createdAt?: string;
  
  // Additional fields that might exist
  volunteer_name?: string;
  team_name?: string;
  proofImage?: string;
}

export interface DashboardStats {
  totalValidated: number;
  totalPending: number;
  totalTransactions: number;
  programStats: { [key: string]: number };
  branchStats: { [key: string]: number };
  topVolunteers: { name: string; amount: number }[];
}