# Frontend Development Guide - Dashboard Donasi PABU

## Tech Stack

- **React 18+** - UI Library
- **TypeScript** - Type Safety
- **Tailwind CSS** - Styling
- **Vite** - Build Tool
- **Axios** - HTTP Client
- **Lucide React** - Icons

## Project Structure

```
frontend/src/
├── components/
│   ├── Layout/
│   │   └── Sidebar.tsx          # Navigation sidebar
│   ├── Teams/
│   │   └── TeamManagement.tsx   # Team CRUD operations
│   ├── Branches/
│   ├── Volunteers/
│   ├── Programs/
│   └── Transactions/
├── hooks/
│   ├── useTeams.ts              # Team data management
│   ├── useBranches.ts           # Branch data management
│   └── ...
├── services/
│   └── api.ts                   # API client configuration
├── types/
│   └── index.ts                 # TypeScript interfaces
└── data/
    └── mockData.ts              # Mock data for development
```

## Components

### TeamManagement Component

**Location:** `src/components/Teams/TeamManagement.tsx`

**Features:**
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Search functionality
- ✅ Filter by branch
- ✅ Responsive card layout
- ✅ Modal for add/edit
- ✅ Grouped by branch display

**Key Functions:**
```typescript
// Main component functions
const handleSubmit = async (e: React.FormEvent) => { ... }    // Form submission
const handleEdit = (team: Team) => { ... }                    // Edit team
const handleDelete = async (id: string) => { ... }            // Delete team
const getTeamsByBranch = () => { ... }                       // Group teams by branch
```

**State Management:**
```typescript
const [isModalOpen, setIsModalOpen] = useState(false);        // Modal visibility
const [editingTeam, setEditingTeam] = useState<Team | null>(null); // Current editing team
const [searchTerm, setSearchTerm] = useState('');             // Search input
const [filterBranch, setFilterBranch] = useState('');         // Branch filter
const [isSubmitting, setIsSubmitting] = useState(false);      // Form submission state
const [formData, setFormData] = useState({                    // Form data
  name: '',
  branchId: '',
  code: ''
});
```

**Props & Dependencies:**
```typescript
// Hooks used
const { teams, isLoading: teamsLoading, error: teamsError, createTeam, updateTeam, deleteTeam } = useTeams();
const { branches, isLoading: branchesLoading } = useBranches();
```

### Sidebar Component

**Location:** `src/components/Layout/Sidebar.tsx`

**Features:**
- Navigation menu
- Active route highlighting
- Responsive design
- Icon integration

**Menu Items:**
```typescript
const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/' },
  { id: 'branches', label: 'Cabang', icon: Building2, path: '/branches' },
  { id: 'teams', label: 'Tim', icon: Users, path: '/teams' },
  { id: 'volunteers', label: 'Relawan', icon: UserCheck, path: '/volunteers' },
  { id: 'programs', label: 'Program', icon: Package, path: '/programs' },
  { id: 'transactions', label: 'Transaksi', icon: CreditCard, path: '/transactions' },
  { id: 'validation', label: 'Validasi', icon: CheckCircle, path: '/validation' },
];
```

## Custom Hooks

### useTeams Hook

**Location:** `src/hooks/useTeams.ts`

**Purpose:** Manages team data state and API operations

**Return Values:**
```typescript
return {
  teams,           // Team[] - Array of teams
  isLoading,       // boolean - Loading state
  error,           // string | null - Error message
  fetchTeams,      // () => Promise<void> - Refresh teams
  createTeam,      // (data: Omit<Team, 'id'>) => Promise<Team> - Create new team
  updateTeam,      // (id: string, data: Partial<Team>) => Promise<Team> - Update team
  deleteTeam,      // (id: string) => Promise<void> - Delete team
};
```

**Usage Example:**
```typescript
const { teams, isLoading, createTeam, updateTeam, deleteTeam } = useTeams();

// Create new team
const newTeam = await createTeam({
  name: 'Tim Alpha',
  branchId: '1',
  code: 'ALPHA'
});

// Update existing team
const updatedTeam = await updateTeam('1', {
  name: 'Tim Alpha Updated'
});

// Delete team
await deleteTeam('1');
```

### useBranches Hook

**Location:** `src/hooks/useBranches.ts`

**Purpose:** Manages branch data for dropdowns and filters

**Return Values:**
```typescript
return {
  branches,        // Branch[] - Array of branches
  isLoading,       // boolean - Loading state
  error,           // string | null - Error message
  fetchBranches,   // () => Promise<void> - Refresh branches
};
```

## TypeScript Interfaces

**Location:** `src/types/index.ts`

### Core Interfaces:

```typescript
export interface Team {
  id: string;
  name: string;
  branchId: string;
  code: string;
  branch?: Branch;  // Optional nested branch data
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  branchId: string;
  teamId: string;
  role: 'admin' | 'validator' | 'volunteer' | 'branch';
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
```

## API Service

**Location:** `src/services/api.ts`

**Configuration:**
```typescript
const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});
```

**API Objects:**
```typescript
export const teamsAPI = {
  getAll: () => api.get('/teams'),
  getById: (id: string) => api.get(`/teams/${id}`),
  create: (data: any) => api.post('/teams', data),
  update: (id: string, data: any) => api.put(`/teams/${id}`, data),
  delete: (id: string) => api.delete(`/teams/${id}`),
};

export const branchesAPI = {
  getAll: () => api.get('/branches'),
  // ... other methods
};
```

## Styling Guidelines

### Tailwind CSS Classes

**Common Patterns:**
```css
/* Container */
.container { @apply p-6; }

/* Cards */
.card { @apply bg-white rounded-xl shadow-sm border border-gray-200 p-6; }

/* Buttons */
.btn-primary { @apply bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700; }
.btn-secondary { @apply bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400; }

/* Form Elements */
.form-input { @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent; }
.form-select { @apply w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent; }

/* Grid Layouts */
.grid-responsive { @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4; }
```

### Color Scheme
```css
/* Primary Colors */
--blue-600: #2563eb;
--blue-700: #1d4ed8;

/* Gray Scale */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-300: #d1d5db;
--gray-600: #4b5563;
--gray-700: #374151;
--gray-900: #111827;

/* Status Colors */
--green-600: #059669; /* Success */
--red-600: #dc2626;   /* Error */
--yellow-600: #d97706; /* Warning */
```

## Best Practices

### 1. Component Structure
```typescript
// 1. Imports
import React, { useState } from 'react';
import { Icon } from 'lucide-react';

// 2. Types/Interfaces
interface ComponentProps {
  // props definition
}

// 3. Component
export default function Component({ prop }: ComponentProps) {
  // 4. State
  const [state, setState] = useState();
  
  // 5. Hooks
  const { data } = useCustomHook();
  
  // 6. Functions
  const handleAction = () => {
    // implementation
  };
  
  // 7. Effects
  useEffect(() => {
    // side effects
  }, []);
  
  // 8. Early returns
  if (loading) return <LoadingSpinner />;
  
  // 9. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### 2. Error Handling
```typescript
// In hooks
try {
  const response = await api.call();
  setData(response.data);
} catch (err: any) {
  setError(err.response?.data?.message || 'Default error message');
  console.error('Error context:', err);
}

// In components
if (error) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <p className="text-red-600">Error: {error}</p>
    </div>
  );
}
```

### 3. Loading States
```typescript
// Loading spinner
if (isLoading) {
  return (
    <div className="flex items-center justify-center min-h-96">
      <div className="flex items-center space-x-2">
        <Loader className="w-6 h-6 animate-spin text-blue-600" />
        <span className="text-gray-600">Loading...</span>
      </div>
    </div>
  );
}
```

### 4. Form Handling
```typescript
// Form submission
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);
  
  try {
    await submitAction(formData);
    resetForm();
    closeModal();
  } catch (err: any) {
    alert(err.message || 'Error occurred');
  } finally {
    setIsSubmitting(false);
  }
};
```

## Development Workflow

### 1. Starting Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser
# http://localhost:5173
```

### 2. Adding New Features
1. Create component in appropriate folder
2. Add TypeScript interfaces in `types/index.ts`
3. Create custom hook if needed
4. Add API endpoints in `services/api.ts`
5. Update navigation in `Sidebar.tsx`
6. Test functionality

### 3. Code Quality
```bash
# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Build for production
npm run build
```

## Common Issues & Solutions

### 1. Type Mismatch (Frontend vs Backend)
**Problem:** Backend returns `branch_id` but frontend expects `branchId`

**Solution:**
```typescript
// Handle both formats
const teamBranchId = team.branchId || (team as any).branch_id || team.branch?.id;
```

### 2. Filter Not Working
**Problem:** String vs Number comparison

**Solution:**
```typescript
// Convert both to string
const matchesBranch = !filterBranch || String(teamBranchId) === String(filterBranch);
```

### 3. Modal State Management
**Problem:** Form data not clearing

**Solution:**
```typescript
// Reset form when closing modal
const closeModal = () => {
  setIsModalOpen(false);
  setFormData({ name: '', branchId: '', code: '' });
  setEditingTeam(null);
};
```

---

**Note:** This guide covers the current implementation of the Teams module. Similar patterns should be followed for other modules (Branches, Volunteers, Programs, Transactions).