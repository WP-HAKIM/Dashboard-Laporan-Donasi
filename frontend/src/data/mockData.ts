import { Branch, Team, Program, Transaction } from '../types';

export const mockBranches: Branch[] = [
  { id: '1', name: 'Jakarta Pusat', code: 'JKT-P', address: 'Jl. Thamrin No. 1, Jakarta Pusat' },
  { id: '2', name: 'Jakarta Selatan', code: 'JKT-S', address: 'Jl. Sudirman No. 2, Jakarta Selatan' },
  { id: '3', name: 'Bandung', code: 'BDG', address: 'Jl. Asia Afrika No. 3, Bandung' },
  { id: '4', name: 'Surabaya', code: 'SBY', address: 'Jl. Pemuda No. 4, Surabaya' }
];

export const mockTeams: Team[] = [
  { id: '1', name: 'Tim Alpha', branchId: '1', code: 'ALPHA' },
  { id: '2', name: 'Tim Beta', branchId: '1', code: 'BETA' },
  { id: '3', name: 'Tim Gamma', branchId: '2', code: 'GAMMA' },
  { id: '4', name: 'Tim Delta', branchId: '2', code: 'DELTA' },
  { id: '5', name: 'Tim Epsilon', branchId: '3', code: 'EPSILON' },
  { id: '6', name: 'Tim Zeta', branchId: '4', code: 'ZETA' }
];

export const mockPrograms: Program[] = [
  {
    id: '1',
    type: 'ZISWAF',
    name: 'Zakat Fitrah 2024',
    code: 'ZF24',
    description: 'Program zakat fitrah tahun 2024',
    volunteerRate: 15,
    branchRate: 70
  },
  {
    id: '2',
    type: 'ZISWAF',
    name: 'Infak Pembangunan Masjid',
    code: 'IPM24',
    description: 'Infak untuk pembangunan masjid',
    volunteerRate: 10,
    branchRate: 75
  },
  {
    id: '3',
    type: 'QURBAN',
    name: 'Qurban Idul Adha 2024',
    code: 'QIA24',
    description: 'Program qurban Idul Adha 2024',
    volunteerRate: 20,
    branchRate: 65
  }
];

export const mockTransactions: Transaction[] = [
  {
    id: '1',
    branchId: '1',
    teamId: '1',
    volunteerId: '1',
    programType: 'ZISWAF',
    programId: '1',
    donorName: 'H. Abdullah',
    amount: 500000,
    transferMethod: 'BRI',
    status: 'pending',
    createdAt: '2024-01-15T10:30:00'
  },
  {
    id: '2',
    branchId: '1',
    teamId: '2',
    volunteerId: '2',
    programType: 'QURBAN',
    programId: '3',
    donorName: 'Hj. Khadijah',
    amount: 2500000,
    transferMethod: 'BSI',
    status: 'valid',
    createdAt: '2024-01-14T14:20:00',
    validatedAt: '2024-01-14T16:45:00',
    validatedBy: '1'
  },
  {
    id: '3',
    branchId: '2',
    teamId: '3',
    volunteerId: '3',
    programType: 'ZISWAF',
    programId: '2',
    donorName: 'Umar bin Khattab',
    amount: 1000000,
    transferMethod: 'BCA',
    status: 'pending',
    createdAt: '2024-01-13T09:15:00'
  }
];