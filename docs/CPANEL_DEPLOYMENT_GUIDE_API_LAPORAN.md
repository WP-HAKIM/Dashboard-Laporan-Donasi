# Panduan Deployment cPanel - Dashboard Donasi PABU
## Arsitektur Dual Subdomain

### Backend: `api.pabu.or.id`
### Frontend: `laporan.pabu.or.id`

---

## 📋 Overview

Panduan ini menjelaskan langkah-langkah deployment Dashboard Donasi PABU menggunakan 2 subdomain terpisah:
- **Backend API**: `api.pabu.or.id` (Laravel 12)
- **Frontend Dashboard**: `laporan.pabu.or.id` (React + TypeScript)

## 🏗️ Arsitektur Deployment

```
api.pabu.or.id
├── Document Root: /public_html/api/public
├── Laravel Backend
├── API Endpoints (/login, /dashboard, /transactions, etc.)
└── File Storage (transaction proofs)

laporan.pabu.or.id
├── Document Root: /public_html/laporan/dist
├── React SPA
├── Static Assets (HTML, CSS, JS)
└── Client-side Routing
```

---

## 🚀 Langkah 1: Setup Subdomain di cPanel

### 1.1 Buat Subdomain Backend

1. **Login ke cPanel**
2. **Cari "Subdomains"** di File Manager section
3. **Buat subdomain baru:**
   - **Subdomain**: `api`
   - **Domain**: `pabu.or.id`
   - **Document Root**: `/public_html/api` (akan diubah nanti)
4. **Klik "Create"**

### 1.2 Buat Subdomain Frontend

1. **Buat subdomain kedua:**
   - **Subdomain**: `laporan`
   - **Domain**: `pabu.or.id`
   - **Document Root**: `/public_html/laporan`
2. **Klik "Create"**

---

## 🔧 Langkah 2: Upload & Setup Backend (api.pabu.or.id)

### 2.1 Upload File Backend

1. **Compress folder backend** menjadi `backend.zip`
2. **Upload ke `/public_html/api/`** via File Manager
3. **Extract file** di dalam folder `/public_html/api/`
4. **Struktur yang diharapkan:**
   ```
   /public_html/api/
   ├── app/
   ├── bootstrap/
   ├── config/
   ├── database/
   ├── public/
   ├── routes/
   ├── storage/
   ├── vendor/
   ├── .env
   ├── composer.json
   └── artisan
   ```

### 2.2 Ubah Document Root

1. **Kembali ke Subdomains** di cPanel
2. **Klik ikon "pencil" (edit)** pada subdomain `api.pabu.or.id`
3. **Ubah Document Root** menjadi: `/public_html/api/public`
4. **Save changes**

### 2.3 Konfigurasi Database

1. **Buat Database MySQL:**
   - Database name: `pabu_donasi`
   - Username: `pabu_user`
   - Password: `[strong_password]`

2. **Import Database:**
   - Upload file SQL dump ke phpMyAdmin
   - Import ke database `pabu_donasi`

### 2.4 Konfigurasi Environment (.env)

**File: `/public_html/api/.env`**
```env
APP_NAME="Dashboard Donasi PABU"
APP_ENV=production
APP_KEY=base64:[generate_new_key]
APP_DEBUG=false
APP_URL=https://api.pabu.or.id

# Frontend URL untuk CORS
FRONTEND_URL=https://laporan.pabu.or.id

# Database Configuration
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=pabu_donasi
DB_USERNAME=pabu_user
DB_PASSWORD=[your_database_password]

# Sanctum Configuration
SANCTUM_STATEFUL_DOMAINS=laporan.pabu.or.id
SESSION_DOMAIN=.pabu.or.id

# File Storage
FILESYSTEM_DISK=public

# Mail Configuration (optional)
MAIL_MAILER=smtp
MAIL_HOST=mail.pabu.or.id
MAIL_PORT=587
MAIL_USERNAME=noreply@pabu.or.id
MAIL_PASSWORD=[mail_password]
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@pabu.or.id
MAIL_FROM_NAME="Dashboard Donasi PABU"
```

### 2.5 Set Permissions

**Via Terminal SSH atau File Manager:**
```bash
# Set permissions untuk storage dan cache
chmod -R 755 /public_html/api/storage
chmod -R 755 /public_html/api/bootstrap/cache

# Set ownership (jika diperlukan)
chown -R [your_cpanel_user]:nobody /public_html/api/storage
chown -R [your_cpanel_user]:nobody /public_html/api/bootstrap/cache
```

### 2.6 Konfigurasi CORS

**File: `/public_html/api/config/cors.php`**
```php
<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'https://laporan.pabu.or.id',
        'http://localhost:5173', // untuk development
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

### 2.7 Optimize Laravel untuk Production

**Via Terminal SSH:**
```bash
cd /public_html/api

# Install dependencies (jika belum)
composer install --optimize-autoloader --no-dev

# Generate application key
php artisan key:generate

# Run migrations
php artisan migrate --force

# Cache configurations
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Create storage link
php artisan storage:link
```

---

## 🎨 Langkah 3: Setup Frontend (laporan.pabu.or.id)

### 3.1 Build Frontend Locally

**Di komputer lokal:**
```bash
cd frontend

# Install dependencies
npm install

# Update API URL
# Edit src/services/api.ts
```

**File: `frontend/src/services/api.ts`**
```typescript
import axios from 'axios';

// Update API Base URL untuk production
const API_BASE_URL = 'https://api.pabu.or.id';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor untuk token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor untuk error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };
```

**Build untuk production:**
```bash
# Build aplikasi
npm run build

# Hasil build ada di folder 'dist'
```

### 3.2 Upload Frontend ke cPanel

1. **Compress folder `dist`** menjadi `frontend-dist.zip`
2. **Upload ke `/public_html/laporan/`**
3. **Extract file** di dalam folder `/public_html/laporan/`
4. **Pindahkan semua file dari `/public_html/laporan/dist/`** ke `/public_html/laporan/`
5. **Hapus folder `dist` yang kosong**

**Struktur akhir:**
```
/public_html/laporan/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [other assets]
└── [other static files]
```

### 3.3 Konfigurasi .htaccess untuk SPA

**File: `/public_html/laporan/.htaccess`**
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Handle Angular/React/Vue Router
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
    
    # Security headers
    <IfModule mod_headers.c>
        Header always set X-Content-Type-Options nosniff
        Header always set X-Frame-Options DENY
        Header always set X-XSS-Protection "1; mode=block"
        Header always set Referrer-Policy "strict-origin-when-cross-origin"
        Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"
    </IfModule>
    
    # Gzip compression
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/plain
        AddOutputFilterByType DEFLATE text/html
        AddOutputFilterByType DEFLATE text/xml
        AddOutputFilterByType DEFLATE text/css
        AddOutputFilterByType DEFLATE application/xml
        AddOutputFilterByType DEFLATE application/xhtml+xml
        AddOutputFilterByType DEFLATE application/rss+xml
        AddOutputFilterByType DEFLATE application/javascript
        AddOutputFilterByType DEFLATE application/x-javascript
    </IfModule>
    
    # Cache static assets
    <IfModule mod_expires.c>
        ExpiresActive on
        ExpiresByType text/css "access plus 1 year"
        ExpiresByType application/javascript "access plus 1 year"
        ExpiresByType image/png "access plus 1 year"
        ExpiresByType image/jpg "access plus 1 year"
        ExpiresByType image/jpeg "access plus 1 year"
        ExpiresByType image/gif "access plus 1 year"
        ExpiresByType image/svg+xml "access plus 1 year"
    </IfModule>
</IfModule>
```

---

## 🔒 Langkah 4: SSL Certificate

### 4.1 Install SSL untuk Backend

1. **Pergi ke "SSL/TLS" di cPanel**
2. **Pilih "Let's Encrypt"** (gratis)
3. **Centang `api.pabu.or.id`**
4. **Klik "Issue"**

### 4.2 Install SSL untuk Frontend

1. **Centang `laporan.pabu.or.id`**
2. **Klik "Issue"**

### 4.3 Force HTTPS Redirect

**File: `/public_html/api/public/.htaccess`** (tambahkan di atas):
```apache
# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

**File: `/public_html/laporan/.htaccess`** (tambahkan di atas):
```apache
# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

## ✅ Langkah 5: Testing & Verification

### 5.1 Test Backend API

**Test endpoints:**
```bash
# Test basic connectivity
curl https://api.pabu.or.id

# Test login endpoint
curl -X POST https://api.pabu.or.id/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pabu.or.id","password":"password"}'

# Test authenticated endpoint
curl https://api.pabu.or.id/dashboard/stats \
  -H "Authorization: Bearer [token]"
```

### 5.2 Test Frontend

1. **Buka `https://laporan.pabu.or.id`**
2. **Verifikasi halaman login muncul**
3. **Test login dengan kredensial valid**
4. **Verifikasi dashboard dapat diakses**
5. **Test navigasi antar halaman**

### 5.3 Test CORS

**Buka Developer Tools di browser:**
```javascript
// Test di console browser
fetch('https://api.pabu.or.id/dashboard/stats', {
  method: 'GET',
  credentials: 'include',
  headers: {
    'Authorization': 'Bearer [your_token]'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

---

## 🔧 Langkah 6: Optimasi & Maintenance

### 6.1 Database Optimization

```sql
-- Optimize tables
OPTIMIZE TABLE transactions, users, branches, teams, programs;

-- Add indexes untuk performance
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_users_branch_team ON users(branch_id, team_id);
```

### 6.2 Backup Strategy

**Setup automated backup:**
1. **Database backup** via cPanel Backup Wizard
2. **File backup** untuk `/public_html/api/storage`
3. **Schedule weekly backups**

### 6.3 Monitoring

**Setup monitoring untuk:**
- **API Response Time**: Monitor `/dashboard/stats`
- **Error Logs**: Check `/public_html/api/storage/logs/`
- **Disk Usage**: Monitor file uploads
- **SSL Certificate**: Auto-renewal alerts

---

## 🚨 Troubleshooting

### Backend Issues

**500 Internal Server Error:**
```bash
# Check error logs
tail -f /public_html/api/storage/logs/laravel.log

# Check permissions
ls -la /public_html/api/storage
ls -la /public_html/api/bootstrap/cache
```

**CORS Errors:**
```php
// Verify config/cors.php
// Check FRONTEND_URL in .env
// Ensure Sanctum configuration is correct
```

**Database Connection:**
```bash
# Test database connection
php artisan tinker
> DB::connection()->getPdo();
```

### Frontend Issues

**White Screen:**
- Check browser console for JavaScript errors
- Verify API_BASE_URL in build
- Check .htaccess configuration

**API Connection Failed:**
- Verify CORS configuration
- Check SSL certificates
- Test API endpoints directly

### Performance Issues

**Slow Loading:**
```bash
# Clear Laravel caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Re-cache for production
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## 📝 Checklist Deployment

### Pre-Deployment
- [ ] Database backup created
- [ ] SSL certificates ready
- [ ] DNS propagation complete
- [ ] Environment variables configured

### Backend Deployment
- [ ] Files uploaded to `/public_html/api/`
- [ ] Document root changed to `/public_html/api/public`
- [ ] Database imported and configured
- [ ] `.env` file configured
- [ ] Permissions set correctly
- [ ] Laravel optimized for production
- [ ] Storage link created

### Frontend Deployment
- [ ] API URL updated in build
- [ ] Frontend built for production
- [ ] Files uploaded to `/public_html/laporan/`
- [ ] `.htaccess` configured for SPA
- [ ] Static assets accessible

### Post-Deployment
- [ ] SSL certificates installed
- [ ] HTTPS redirects working
- [ ] API endpoints responding
- [ ] Frontend loading correctly
- [ ] Login functionality working
- [ ] CORS configured properly
- [ ] File uploads working
- [ ] Error monitoring setup

---

## 🔗 URLs Akhir

- **Frontend Dashboard**: https://laporan.pabu.or.id
- **Backend API**: https://api.pabu.or.id
- **API Documentation**: https://api.pabu.or.id/docs (jika ada)
- **File Storage**: https://api.pabu.or.id/storage/transaction-proofs/

---

**Deployment Guide Version**: 1.0  
**Last Updated**: Januari 2025  
**Status**: Production Ready