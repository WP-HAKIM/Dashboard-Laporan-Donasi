# Troubleshooting: Menu Metode Pembayaran Tidak Berfungsi Setelah Deployment di cPanel

## Ringkasan Masalah
Setelah deployment aplikasi Dashboard Donasi PABU ke cPanel, menu metode pembayaran tidak berfungsi dengan baik. Dokumen ini menganalisis kemungkinan penyebab dan memberikan langkah-langkah perbaikan.

## Arsitektur Sistem
- **Backend**: Laravel 11 (api.pabu.or.id)
- **Frontend**: React + TypeScript + Vite (laporan.pabu.or.id)
- **Database**: MySQL
- **Authentication**: Laravel Sanctum dengan Bearer Token

## Analisis Masalah

### 1. Struktur Route Payment Methods
```php
// backend/routes/api.php
Route::middleware('role:admin')->group(function () {
    Route::apiResource('payment-methods', PaymentMethodController::class)->except(['index']);
});
```

**Masalah Potensial:**
- Route `index` (GET /payment-methods) dikecualikan dari middleware `role:admin`
- Route lainnya (store, show, update, destroy) memerlukan role admin

### 2. Frontend Service Configuration
```typescript
// frontend/src/services/paymentMethodService.ts
private baseUrl = 'http://localhost:8000/api';
```

**Masalah Utama:**
- URL masih mengarah ke localhost, bukan ke domain production

### 3. Authentication & Authorization
- Middleware `RoleMiddleware` memerlukan user dengan role 'admin'
- Token authentication menggunakan Bearer token dari localStorage

## Langkah-Langkah Perbaikan

### Langkah 1: Update URL API di Frontend

1. **Edit file `frontend/src/services/paymentMethodService.ts`:**
```typescript
// Ganti dari:
private baseUrl = 'http://localhost:8000/api';

// Menjadi:
private baseUrl = 'https://api.pabu.or.id/api';
```

2. **Pastikan juga file `frontend/src/services/api.ts` sudah diupdate:**
```typescript
const API_BASE_URL = 'https://api.pabu.or.id/api';
```

### Langkah 2: Verifikasi Konfigurasi Backend di cPanel

1. **Periksa file `.env` di backend:**
```env
APP_URL=https://api.pabu.or.id
FRONTEND_URL=https://laporan.pabu.or.id
SANCTUM_STATEFUL_DOMAINS=laporan.pabu.or.id
SESSION_DOMAIN=.pabu.or.id
```

2. **Periksa konfigurasi CORS di `config/cors.php`:**
```php
'allowed_origins' => [
    'https://laporan.pabu.or.id',
    'http://localhost:5173', // untuk development
],
```

### Langkah 3: Perbaiki Route Configuration

**Edit file `backend/routes/api.php`:**
```php
// Tambahkan route index untuk public access
Route::get('/payment-methods', [PaymentMethodController::class, 'index']);

// Admin-only routes
Route::middleware(['auth:api', 'role:admin'])->group(function () {
    Route::post('/payment-methods', [PaymentMethodController::class, 'store']);
    Route::get('/payment-methods/{paymentMethod}', [PaymentMethodController::class, 'show']);
    Route::put('/payment-methods/{paymentMethod}', [PaymentMethodController::class, 'update']);
    Route::delete('/payment-methods/{paymentMethod}', [PaymentMethodController::class, 'destroy']);
});
```

### Langkah 4: Build dan Deploy Frontend

1. **Build aplikasi frontend:**
```bash
cd frontend
npm run build
```

2. **Upload folder `dist` ke `/public_html/laporan/` di cPanel**

3. **Pastikan file `.htaccess` ada di `/public_html/laporan/`:**
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

### Langkah 5: Verifikasi Database dan Permissions

1. **Periksa tabel `payment_methods` di database:**
```sql
SELECT * FROM payment_methods;
```

2. **Periksa user admin di database:**
```sql
SELECT id, name, email, role FROM users WHERE role = 'admin';
```

### Langkah 6: Testing dan Debugging

1. **Test endpoint API langsung:**
```bash
# Test public endpoint
curl -X GET "https://api.pabu.or.id/api/payment-methods"

# Test dengan authentication
curl -X GET "https://api.pabu.or.id/api/payment-methods" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

2. **Periksa browser console untuk error:**
   - Buka Developer Tools (F12)
   - Lihat tab Console dan Network
   - Cari error CORS, 401, 403, atau 500

## Masalah Umum dan Solusi

### Error 401 (Unauthorized)
**Penyebab:** Token tidak valid atau expired
**Solusi:**
- Logout dan login ulang
- Periksa localStorage untuk token
- Verifikasi konfigurasi Sanctum

### Error 403 (Forbidden)
**Penyebab:** User tidak memiliki role admin
**Solusi:**
- Periksa role user di database
- Update role user menjadi 'admin' jika diperlukan

### Error 500 (Internal Server Error)
**Penyebab:** Error di backend
**Solusi:**
- Periksa log Laravel di `storage/logs/laravel.log`
- Periksa error log cPanel
- Verifikasi konfigurasi database

### CORS Error
**Penyebab:** Konfigurasi CORS tidak tepat
**Solusi:**
- Update `config/cors.php`
- Pastikan domain frontend ada di `allowed_origins`
- Restart server jika diperlukan

### White Screen atau Loading Terus
**Penyebab:** Frontend tidak bisa connect ke API
**Solusi:**
- Periksa URL API di service files
- Verifikasi SSL certificate
- Test API endpoint secara manual

## Checklist Deployment

### Backend (api.pabu.or.id)
- [ ] File `.env` dikonfigurasi dengan benar
- [ ] Database connection berfungsi
- [ ] CORS dikonfigurasi untuk domain frontend
- [ ] SSL certificate aktif
- [ ] Route payment-methods dapat diakses
- [ ] User admin tersedia di database

### Frontend (laporan.pabu.or.id)
- [ ] URL API diupdate ke production
- [ ] Build berhasil tanpa error
- [ ] File `.htaccess` dikonfigurasi untuk SPA
- [ ] SSL certificate aktif
- [ ] Authentication berfungsi

### Testing
- [ ] Login sebagai admin berhasil
- [ ] Menu metode pembayaran dapat diakses
- [ ] CRUD operations berfungsi
- [ ] No console errors
- [ ] API responses normal

## Kontak dan Support
Jika masalah masih berlanjut setelah mengikuti langkah-langkah di atas, periksa:
1. Log error di cPanel
2. Laravel log di `storage/logs/`
3. Browser console untuk error frontend
4. Network tab untuk failed requests

---
*Dokumen ini dibuat untuk membantu troubleshooting deployment Dashboard Donasi PABU di cPanel.*