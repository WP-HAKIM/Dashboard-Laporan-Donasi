# Project Overview - Dashboard Donasi PABU

## Deskripsi Project

Dashboard Donasi PABU adalah sistem manajemen donasi berbasis web yang dirancang untuk mengelola donasi, transaksi, dan administrasi organisasi PABU. Sistem ini terdiri dari backend Laravel dan frontend React dengan TypeScript.

## Teknologi yang Digunakan

### Backend (Laravel)
- **Framework**: Laravel 12.x
- **PHP Version**: 8.2+
- **Database**: MySQL 8.0+
- **Authentication**: Laravel Sanctum
- **Storage**: Laravel Storage (untuk file upload)
- **Dependencies**:
  - Laravel Framework
  - Laravel Sanctum (API Authentication)
  - Laravel Tinker (Development)

### Frontend (React + TypeScript)
- **Framework**: React 18.3.1
- **Build Tool**: Vite 5.4.2
- **Language**: TypeScript 5.5.3
- **Styling**: Tailwind CSS 3.4.1
- **UI Components**: Lucide React (Icons)
- **HTTP Client**: Axios 1.11.0
- **Notifications**: React Hot Toast
- **Alerts**: SweetAlert2
- **File Processing**: XLSX (Excel import/export)
- **Form Controls**: React Select

## Fitur Utama

### 1. Manajemen Pengguna & Autentikasi
- Login/Logout dengan Laravel Sanctum
- Role-based access control
- Manajemen profil pengguna
- Manajemen volunteer/relawan

### 2. Manajemen Organisasi
- **Cabang (Branches)**: Manajemen cabang organisasi
- **Tim (Teams)**: Manajemen tim dalam organisasi
- **Program**: Manajemen program donasi

### 3. Manajemen Transaksi
- **Input Transaksi**: Form input transaksi donasi
- **Validasi Transaksi**: Sistem validasi transaksi
- **Semua Transaksi**: View semua transaksi (admin)
- **Transaksi Saya**: View transaksi personal
- **Upload Bukti**: Upload bukti pembayaran
- **Import Excel**: Import transaksi dari file Excel

### 4. Manajemen Pembayaran
- Manajemen metode pembayaran
- Konfigurasi payment methods

### 5. Dashboard & Laporan
- Dashboard dengan statistik real-time
- Laporan transaksi
- Analytics dan insights

### 6. Pengaturan Sistem
- Konfigurasi aplikasi
- Pengaturan global
- Manajemen settings

## Struktur Database

### Tabel Utama
1. **users** - Data pengguna/volunteer
2. **branches** - Data cabang organisasi
3. **teams** - Data tim
4. **programs** - Data program donasi
5. **transactions** - Data transaksi donasi
6. **payment_methods** - Metode pembayaran
7. **app_settings** - Pengaturan aplikasi

### Relasi Database
- Users belongs to Branch
- Users belongs to Team
- Transactions belongs to User
- Transactions belongs to Program
- Transactions belongs to Payment Method

## Arsitektur Aplikasi

### Backend (Laravel)
```
backend/
├── app/
│   ├── Http/Controllers/Api/
│   │   ├── AuthController.php
│   │   ├── DashboardController.php
│   │   ├── TransactionController.php
│   │   ├── UserController.php
│   │   ├── BranchController.php
│   │   ├── TeamController.php
│   │   ├── ProgramController.php
│   │   └── PaymentMethodController.php
│   └── Models/
│       ├── User.php
│       ├── Branch.php
│       ├── Team.php
│       ├── Program.php
│       ├── Transaction.php
│       ├── PaymentMethod.php
│       └── AppSetting.php
├── database/migrations/
├── routes/api.php
└── storage/app/public/transaction-proofs/
```

### Frontend (React)
```
frontend/src/
├── components/
│   ├── Auth/
│   ├── Dashboard/
│   ├── Transactions/
│   ├── Volunteers/
│   ├── Programs/
│   ├── Branches/
│   ├── Teams/
│   ├── PaymentMethods/
│   ├── Reports/
│   ├── Settings/
│   ├── Profile/
│   ├── Layout/
│   └── Common/
├── hooks/
│   ├── useAuth.tsx
│   ├── useAppSettings.tsx
│   └── [other custom hooks]
├── services/
├── types/
└── utils/
```

## API Endpoints

### Authentication
- `POST /api/login` - Login
- `POST /api/logout` - Logout
- `GET /api/user` - Get current user

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics

### Transactions
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/{id}` - Update transaction
- `DELETE /api/transactions/{id}` - Delete transaction
- `POST /api/transactions/import` - Import from Excel

### Users/Volunteers
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Master Data
- `GET /api/branches` - List branches
- `GET /api/teams` - List teams
- `GET /api/programs` - List programs
- `GET /api/payment-methods` - List payment methods

## Keamanan

### Backend Security
- Laravel Sanctum untuk API authentication
- CSRF protection
- Input validation dan sanitization
- File upload validation
- SQL injection protection (Eloquent ORM)

### Frontend Security
- Token-based authentication
- Protected routes
- Input validation
- XSS protection

## Performance

### Backend Optimization
- Database indexing
- Eloquent relationship optimization
- Caching untuk data statis
- File storage optimization

### Frontend Optimization
- Code splitting dengan Vite
- Lazy loading components
- Optimized bundle size
- Efficient state management

## File Storage

### Transaction Proofs
- Path: `storage/app/public/transaction-proofs/`
- Supported formats: JPG, PNG, PDF
- Max file size: 2MB
- Automatic cleanup saat delete transaction

## Environment Requirements

### Development
- PHP 8.2+
- Node.js 18+
- MySQL 8.0+
- Composer 2.x
- NPM 9.x+

### Production
- Web server (Apache/Nginx)
- PHP 8.2+ dengan extensions: pdo, pdo_mysql, gd, xml
- MySQL 8.0+
- SSL Certificate (recommended)
- Minimum 2GB RAM, 4GB recommended

## Status Project

✅ **Production Ready** - Aplikasi telah siap untuk deployment dengan semua fitur core terimplementasi:

- ✅ Authentication & Authorization
- ✅ User Management
- ✅ Transaction Management
- ✅ File Upload & Storage
- ✅ Dashboard & Reports
- ✅ Master Data Management
- ✅ Excel Import/Export
- ✅ Responsive UI
- ✅ API Documentation
- ✅ Error Handling
- ✅ Security Implementation

## Dokumentasi Terkait

- [API Reference](./API_REFERENCE.md)
- [Frontend Guide](./FRONTEND_GUIDE.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Troubleshooting FAQ](./TROUBLESHOOTING_FAQ.md)
- [Development Logs](./DEVELOPMENT_LOG_2025-7-25.md)

---

**Last Updated**: Juli 2025  
**Version**: 2.0.0  
**Status**: Production Ready