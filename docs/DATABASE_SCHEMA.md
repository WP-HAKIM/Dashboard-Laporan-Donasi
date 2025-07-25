# Database Schema - Dashboard Donasi PABU

## Overview

Database ini menggunakan **MySQL** dengan **Laravel Eloquent ORM** untuk mengelola data sistem donasi PABU. Schema dirancang untuk mendukung multi-cabang dengan sistem tim dan relawan.

## Database Configuration

**File:** `.env`
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=dashboard_donasi_pabu
DB_USERNAME=root
DB_PASSWORD=
```

## Tables Structure

### 1. branches (Cabang)

**Purpose:** Menyimpan data cabang/kantor PABU

```sql
CREATE TABLE branches (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    address TEXT,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
```

**Columns:**
- `id` - Primary key
- `name` - Nama cabang (e.g., "PABU Jakarta Pusat")
- `code` - Kode cabang unik (e.g., "JKT-01")
- `address` - Alamat lengkap cabang
- `created_at` - Timestamp pembuatan
- `updated_at` - Timestamp update terakhir

**Sample Data:**
```sql
INSERT INTO branches (name, code, address) VALUES
('PABU Jakarta Pusat', 'JKT-01', 'Jl. Sudirman No. 123, Jakarta Pusat'),
('PABU Bandung', 'BDG-01', 'Jl. Asia Afrika No. 456, Bandung'),
('PABU Surabaya', 'SBY-01', 'Jl. Pemuda No. 789, Surabaya');
```

### 2. teams (Tim)

**Purpose:** Menyimpan data tim dalam setiap cabang

```sql
CREATE TABLE teams (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    branch_id BIGINT UNSIGNED NOT NULL,
    code VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    UNIQUE KEY unique_team_code_per_branch (branch_id, code)
);
```

**Columns:**
- `id` - Primary key
- `name` - Nama tim (e.g., "Tim Alpha")
- `branch_id` - Foreign key ke tabel branches
- `code` - Kode tim dalam cabang (e.g., "ALPHA")
- `created_at` - Timestamp pembuatan
- `updated_at` - Timestamp update terakhir

**Constraints:**
- `branch_id` harus ada di tabel `branches`
- Kombinasi `branch_id` + `code` harus unik

**Sample Data:**
```sql
INSERT INTO teams (name, branch_id, code) VALUES
('Tim Alpha', 1, 'ALPHA'),
('Tim Beta', 1, 'BETA'),
('Tim Gamma', 2, 'GAMMA'),
('Tim Delta', 2, 'DELTA');
```

### 3. users (Pengguna)

**Purpose:** Menyimpan data pengguna sistem (admin, validator, relawan)

```sql
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    branch_id BIGINT UNSIGNED NOT NULL,
    team_id BIGINT UNSIGNED,
    role ENUM('admin', 'validator', 'volunteer', 'branch') NOT NULL DEFAULT 'volunteer',
    email_verified_at TIMESTAMP NULL,
    password VARCHAR(255) NOT NULL,
    remember_token VARCHAR(100),
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
);
```

**Columns:**
- `id` - Primary key
- `name` - Nama lengkap pengguna
- `email` - Email unik untuk login
- `phone` - Nomor telepon
- `branch_id` - Foreign key ke tabel branches
- `team_id` - Foreign key ke tabel teams (nullable)
- `role` - Peran pengguna (admin/validator/volunteer/branch)
- `email_verified_at` - Timestamp verifikasi email
- `password` - Password terenkripsi
- `remember_token` - Token untuk "remember me"
- `created_at` - Timestamp pembuatan
- `updated_at` - Timestamp update terakhir

**Role Types:**
- `admin` - Administrator sistem
- `validator` - Validator transaksi
- `volunteer` - Relawan pengumpul donasi
- `branch` - Manager cabang

### 4. programs (Program Donasi)

**Purpose:** Menyimpan data program donasi (ZISWAF, QURBAN)

```sql
CREATE TABLE programs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    type ENUM('ZISWAF', 'QURBAN') NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    volunteer_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    branch_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
```

**Columns:**
- `id` - Primary key
- `type` - Tipe program (ZISWAF/QURBAN)
- `name` - Nama program
- `code` - Kode program unik
- `description` - Deskripsi program
- `volunteer_rate` - Persentase komisi relawan (0.00-100.00)
- `branch_rate` - Persentase komisi cabang (0.00-100.00)
- `created_at` - Timestamp pembuatan
- `updated_at` - Timestamp update terakhir

**Sample Data:**
```sql
INSERT INTO programs (type, name, code, description, volunteer_rate, branch_rate) VALUES
('ZISWAF', 'Zakat Fitrah 2024', 'ZF2024', 'Program zakat fitrah tahun 2024', 5.00, 10.00),
('ZISWAF', 'Infaq Pembangunan Masjid', 'IPM2024', 'Infaq untuk pembangunan masjid', 3.00, 7.00),
('QURBAN', 'Qurban Idul Adha 2024', 'QIA2024', 'Program qurban Idul Adha 2024', 2.00, 5.00);
```

### 5. transactions (Transaksi Donasi)

**Purpose:** Menyimpan data transaksi donasi

```sql
CREATE TABLE transactions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    branch_id BIGINT UNSIGNED NOT NULL,
    team_id BIGINT UNSIGNED NOT NULL,
    volunteer_id BIGINT UNSIGNED NOT NULL,
    program_type ENUM('ZISWAF', 'QURBAN') NOT NULL,
    program_id BIGINT UNSIGNED NOT NULL,
    donor_name VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    transfer_method VARCHAR(100) NOT NULL,
    proof_image VARCHAR(255),
    status ENUM('pending', 'valid', 'double_duta', 'double_input', 'not_in_account', 'other') NOT NULL DEFAULT 'pending',
    status_reason TEXT,
    validated_at TIMESTAMP NULL,
    validated_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (volunteer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
    FOREIGN KEY (validated_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_branch_team (branch_id, team_id)
);
```

**Columns:**
- `id` - Primary key
- `branch_id` - Foreign key ke tabel branches
- `team_id` - Foreign key ke tabel teams
- `volunteer_id` - Foreign key ke tabel users (relawan)
- `program_type` - Tipe program (ZISWAF/QURBAN)
- `program_id` - Foreign key ke tabel programs
- `donor_name` - Nama donatur
- `amount` - Jumlah donasi
- `transfer_method` - Metode transfer (Bank, E-wallet, dll)
- `proof_image` - Path file bukti transfer
- `status` - Status validasi transaksi
- `status_reason` - Alasan status (jika ditolak)
- `validated_at` - Timestamp validasi
- `validated_by` - Foreign key ke users (validator)
- `created_at` - Timestamp pembuatan
- `updated_at` - Timestamp update terakhir

**Status Types:**
- `pending` - Menunggu validasi
- `valid` - Transaksi valid
- `double_duta` - Duplikasi dari duta lain
- `double_input` - Input ganda
- `not_in_account` - Tidak masuk rekening
- `other` - Alasan lainnya

## Laravel Models

### 1. Branch Model

**File:** `app/Models/Branch.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Branch extends Model
{
    protected $fillable = [
        'name',
        'code',
        'address',
    ];

    // Relationships
    public function teams(): HasMany
    {
        return $this->hasMany(Team::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }
}
```

### 2. Team Model

**File:** `app/Models/Team.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Team extends Model
{
    protected $fillable = [
        'name',
        'branch_id',
        'code',
    ];

    protected $casts = [
        'branch_id' => 'integer',
    ];

    // Relationships
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }
}
```

### 3. User Model

**File:** `app/Models/User.php`

```php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'branch_id',
        'team_id',
        'role',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'branch_id' => 'integer',
        'team_id' => 'integer',
    ];

    // Relationships
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class, 'volunteer_id');
    }

    public function validatedTransactions(): HasMany
    {
        return $this->hasMany(Transaction::class, 'validated_by');
    }
}
```

### 4. Program Model

**File:** `app/Models/Program.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Program extends Model
{
    protected $fillable = [
        'type',
        'name',
        'code',
        'description',
        'volunteer_rate',
        'branch_rate',
    ];

    protected $casts = [
        'volunteer_rate' => 'decimal:2',
        'branch_rate' => 'decimal:2',
    ];

    // Relationships
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }
}
```

### 5. Transaction Model

**File:** `app/Models/Transaction.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    protected $fillable = [
        'branch_id',
        'team_id',
        'volunteer_id',
        'program_type',
        'program_id',
        'donor_name',
        'amount',
        'transfer_method',
        'proof_image',
        'status',
        'status_reason',
        'validated_at',
        'validated_by',
    ];

    protected $casts = [
        'branch_id' => 'integer',
        'team_id' => 'integer',
        'volunteer_id' => 'integer',
        'program_id' => 'integer',
        'amount' => 'decimal:2',
        'validated_at' => 'datetime',
        'validated_by' => 'integer',
    ];

    // Relationships
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function volunteer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'volunteer_id');
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function validator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validated_by');
    }
}
```

## Migrations

### Running Migrations

```bash
# Run all migrations
php artisan migrate

# Rollback last migration
php artisan migrate:rollback

# Reset all migrations
php artisan migrate:reset

# Refresh migrations (reset + migrate)
php artisan migrate:refresh

# Refresh with seeding
php artisan migrate:refresh --seed
```

### Migration Files Location

```
database/migrations/
├── 2024_01_01_000000_create_branches_table.php
├── 2024_01_01_000001_create_teams_table.php
├── 2024_01_01_000002_create_users_table.php
├── 2024_01_01_000003_create_programs_table.php
└── 2024_01_01_000004_create_transactions_table.php
```

## Database Seeders

### 1. Branch Seeder

**File:** `database/seeders/BranchSeeder.php`

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Branch;

class BranchSeeder extends Seeder
{
    public function run()
    {
        $branches = [
            [
                'name' => 'PABU Jakarta Pusat',
                'code' => 'JKT-01',
                'address' => 'Jl. Sudirman No. 123, Jakarta Pusat'
            ],
            [
                'name' => 'PABU Bandung',
                'code' => 'BDG-01',
                'address' => 'Jl. Asia Afrika No. 456, Bandung'
            ],
            [
                'name' => 'PABU Surabaya',
                'code' => 'SBY-01',
                'address' => 'Jl. Pemuda No. 789, Surabaya'
            ]
        ];

        foreach ($branches as $branch) {
            Branch::create($branch);
        }
    }
}
```

### 2. Team Seeder

**File:** `database/seeders/TeamSeeder.php`

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Team;
use App\Models\Branch;

class TeamSeeder extends Seeder
{
    public function run()
    {
        $branches = Branch::all();
        
        foreach ($branches as $branch) {
            Team::create([
                'name' => 'Tim Alpha',
                'branch_id' => $branch->id,
                'code' => 'ALPHA'
            ]);
            
            Team::create([
                'name' => 'Tim Beta',
                'branch_id' => $branch->id,
                'code' => 'BETA'
            ]);
        }
    }
}
```

### Running Seeders

```bash
# Run all seeders
php artisan db:seed

# Run specific seeder
php artisan db:seed --class=BranchSeeder

# Run with migration refresh
php artisan migrate:refresh --seed
```

## Database Queries Examples

### 1. Get Teams with Branch Information

```php
// Get all teams with branch data
$teams = Team::with('branch')->get();

// Get teams for specific branch
$teams = Team::where('branch_id', 1)
    ->with('branch')
    ->get();

// Get teams with user count
$teams = Team::withCount('users')
    ->with('branch')
    ->get();
```

### 2. Get Transactions with Related Data

```php
// Get transactions with all related data
$transactions = Transaction::with([
    'branch',
    'team',
    'volunteer',
    'program',
    'validator'
])->get();

// Get pending transactions
$pendingTransactions = Transaction::where('status', 'pending')
    ->with(['volunteer', 'program'])
    ->orderBy('created_at', 'desc')
    ->get();

// Get transactions by date range
$transactions = Transaction::whereBetween('created_at', [$startDate, $endDate])
    ->with(['branch', 'team'])
    ->get();
```

### 3. Get Statistics

```php
// Total donations by branch
$branchStats = Branch::withSum('transactions', 'amount')
    ->get();

// Team performance
$teamStats = Team::withCount('transactions')
    ->withSum('transactions', 'amount')
    ->with('branch')
    ->get();

// Volunteer performance
$volunteerStats = User::where('role', 'volunteer')
    ->withCount('transactions')
    ->withSum('transactions', 'amount')
    ->get();
```

## Indexes and Performance

### Important Indexes

```sql
-- Transactions table indexes
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_branch_team ON transactions(branch_id, team_id);
CREATE INDEX idx_transactions_volunteer ON transactions(volunteer_id);
CREATE INDEX idx_transactions_program ON transactions(program_id);

-- Teams table indexes
CREATE INDEX idx_teams_branch ON teams(branch_id);
CREATE UNIQUE INDEX idx_teams_branch_code ON teams(branch_id, code);

-- Users table indexes
CREATE INDEX idx_users_branch ON users(branch_id);
CREATE INDEX idx_users_team ON users(team_id);
CREATE INDEX idx_users_role ON users(role);
```

### Query Optimization Tips

1. **Always use eager loading** untuk relasi yang sering diakses
2. **Use indexes** untuk kolom yang sering di-filter atau di-sort
3. **Limit results** dengan pagination untuk query besar
4. **Use select()** untuk membatasi kolom yang diambil
5. **Cache frequent queries** untuk data yang jarang berubah

## Backup and Maintenance

### Database Backup

```bash
# Create backup
mysqldump -u root -p dashboard_donasi_pabu > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
mysql -u root -p dashboard_donasi_pabu < backup_20241201_120000.sql
```

### Maintenance Commands

```bash
# Check database status
php artisan migrate:status

# Generate model from existing table
php artisan make:model ModelName --migration

# Create factory for testing
php artisan make:factory TeamFactory --model=Team

# Create seeder
php artisan make:seeder TeamSeeder
```

---

**Note:** Schema ini mendukung sistem multi-cabang dengan hierarki: Branch → Team → User, serta tracking lengkap untuk transaksi donasi dengan sistem validasi.