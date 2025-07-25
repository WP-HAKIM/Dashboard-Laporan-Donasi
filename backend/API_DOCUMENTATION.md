# Dashboard Donasi PABU - API Documentation

## Overview
This is a Laravel-based API for managing donation transactions for PABU (Persatuan Amal Bakti Umat). The system manages branches, teams, programs, users, and donation transactions.

## Authentication
The API uses Laravel Sanctum for authentication. Include the Bearer token in the Authorization header for protected routes.

## Base URL
```
http://localhost:8000/api
```

## Authentication Endpoints

### POST /auth/login
Login to get access token
```json
{
  "email": "admin@pabu.org",
  "password": "password"
}
```

### POST /auth/register
Register new user
```json
{
  "name": "John Doe",
  "email": "john@pabu.org",
  "password": "password",
  "password_confirmation": "password",
  "role": "VOLUNTEER",
  "branch_id": 1,
  "team_id": 1
}
```

### POST /auth/logout
Logout (requires authentication)

### GET /auth/user
Get current user profile (requires authentication)

## Resource Endpoints (All require authentication)

### Branches
- GET /branches - List all branches
- POST /branches - Create new branch
- GET /branches/{id} - Get specific branch
- PUT /branches/{id} - Update branch
- DELETE /branches/{id} - Delete branch

### Teams
- GET /teams - List teams (can filter by branch_id)
- POST /teams - Create new team
- GET /teams/{id} - Get specific team
- PUT /teams/{id} - Update team
- DELETE /teams/{id} - Delete team

### Programs
- GET /programs - List programs (can filter by type)
- POST /programs - Create new program
- GET /programs/{id} - Get specific program
- PUT /programs/{id} - Update program
- DELETE /programs/{id} - Delete program

### Transactions
- GET /transactions - List transactions (with filters)
- POST /transactions - Create new transaction
- GET /transactions/{id} - Get specific transaction
- PUT /transactions/{id} - Update transaction
- DELETE /transactions/{id} - Delete transaction

#### Special Transaction Endpoints
- POST /transactions/{id}/validate - Validate a transaction
- GET /transactions/my-transactions - Get current user's transactions
- GET /transactions/pending - Get pending transactions for validation

## Sample Data
The system comes with seeded data:

### Test Users
- **Admin**: admin@pabu.org / password
- **Branch Managers**: manager.jakarta@pabu.org, manager.bandung@pabu.org, etc. / password
- **Volunteers**: ahmad@pabu.org, siti@pabu.org, etc. / password

### Branches
- Jakarta Pusat (JKT-PST)
- Bandung (BDG)
- Surabaya (SBY)
- Medan (MDN)

### Programs
- ZISWAF: Zakat Fitrah, Zakat Mal, Infaq Sedekah
- QURBAN: Qurban Kambing, Qurban Sapi

## User Roles
- **ADMIN**: Full system access
- **BRANCH**: Branch-level management
- **VOLUNTEER**: Can create and manage own transactions

## Getting Started
1. Start the Laravel server: `php artisan serve`
2. Login with test credentials
3. Use the Bearer token for subsequent API calls
4. Create transactions and test the validation workflow

## File Uploads
Transaction proof images should be uploaded as multipart/form-data to the `proof_image` field when creating transactions.