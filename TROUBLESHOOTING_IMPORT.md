# Troubleshooting Import Excel

## Masalah yang Telah Diperbaiki

### Error: "Gagal menghubungi server" saat Import

**Masalah**: 
- Error terjadi karena penggunaan relative URL `/api/transactions/import` 
- Token authentication menggunakan key yang salah (`token` instead of `auth_token`)
- Tidak menggunakan axios instance yang sudah dikonfigurasi

**Solusi yang Diterapkan**:

1. **Perbaikan API Service** (`src/services/api.ts`):
   ```typescript
   import: async (transactions: any[]) => {
     const response = await api.post('/transactions/import', {
       transactions: transactions
     });
     return response.data;
   },
   ```

2. **Update AllTransactions.tsx**:
   - Menambahkan import `transactionsAPI`
   - Menggunakan `transactionsAPI.import()` instead of fetch
   - Menggunakan axios instance yang sudah dikonfigurasi dengan base URL dan authentication

3. **Konfigurasi yang Benar**:
   - Base URL: `http://localhost:8000/api`
   - Token key: `auth_token` (bukan `token`)
   - Menggunakan axios interceptors untuk authentication

## Cara Testing Import

### 1. Persiapan Data
- Gunakan template Excel yang didownload dari aplikasi
- Atau gunakan file CSV test: `test_import_data.csv`
- Pastikan data sesuai dengan format yang diperlukan

### 2. Format Data yang Benar

**Kolom Wajib**:
- Nama Donatur
- Nominal (angka)
- Metode Pembayaran (sesuai data di sistem)
- Jenis Program (ZISWAF atau QURBAN)
- Program (sesuai data di sistem)
- Cabang (sesuai data di sistem)
- Tim (sesuai data di sistem)
- Relawan (sesuai data di sistem)
- Tanggal Transaksi (DD/MM/YYYY)

**Kolom Khusus QURBAN**:
- Nama Pemilik Qurban (wajib jika Jenis Program = QURBAN)
- Nominal Qurban (wajib jika Jenis Program = QURBAN)

### 3. Validasi Data

**Frontend Validation**:
- Format file Excel (.xlsx, .xls)
- Kolom wajib tidak boleh kosong
- Format tanggal yang benar
- Jenis program harus ZISWAF atau QURBAN
- Nominal harus berupa angka positif

**Backend Validation**:
- Validasi database constraint
- Validasi relasi antar tabel
- Validasi role volunteer
- Auto-assignment rate dari program

## Error Messages dan Solusi

### "Gagal menghubungi server"
- **Penyebab**: Koneksi ke backend gagal
- **Solusi**: Pastikan backend Laravel berjalan di `http://localhost:8000`
- **Check**: Buka `http://localhost:8000/api/user` di browser (harus return 401 jika tidak login)

### "Unauthorized" atau 401 Error
- **Penyebab**: Token authentication tidak valid
- **Solusi**: Login ulang untuk mendapatkan token baru
- **Check**: Pastikan `auth_token` ada di localStorage

### "Validation Error"
- **Penyebab**: Data tidak sesuai format atau constraint database
- **Solusi**: Periksa format data sesuai template
- **Check**: Lihat detail error di hasil import

### "Program tidak ditemukan"
- **Penyebab**: Nama program di Excel tidak sesuai dengan data di database
- **Solusi**: Gunakan nama program yang exact match dengan data di sistem
- **Check**: Lihat daftar program di halaman Program Management

### "Cabang/Tim/Relawan tidak ditemukan"
- **Penyebab**: Nama tidak sesuai dengan data di database
- **Solusi**: Gunakan nama yang exact match
- **Check**: Lihat daftar di halaman management masing-masing

## File Test yang Tersedia

### `test_import_data.csv`
File CSV dengan contoh data yang valid untuk testing:
- 3 baris data transaksi
- Mix antara ZISWAF dan QURBAN
- Format tanggal yang benar
- Data yang sesuai dengan constraint

### Cara Menggunakan File Test
1. Buka file CSV di Excel
2. Save as Excel format (.xlsx)
3. Sesuaikan data dengan data yang ada di sistem (nama cabang, tim, relawan, program)
4. Import melalui aplikasi

## Monitoring dan Debugging

### Frontend Console
```javascript
// Check token
console.log(localStorage.getItem('auth_token'));

// Check API base URL
console.log('API Base URL:', 'http://localhost:8000/api');
```

### Backend Logs
- Check Laravel logs: `storage/logs/laravel.log`
- Monitor terminal output saat import
- Check database untuk data yang berhasil diimport

### Network Tab (Browser DevTools)
- Monitor request ke `/api/transactions/import`
- Check request headers (Authorization)
- Check response status dan body

## Status Perbaikan

✅ **Fixed**: API URL configuration  
✅ **Fixed**: Authentication token key  
✅ **Fixed**: Axios instance usage  
✅ **Fixed**: Error handling improvement  
✅ **Added**: Comprehensive validation  
✅ **Added**: Better error messages  
✅ **Added**: Test data file  

## Next Steps

1. Test import dengan data yang valid
2. Verify error handling dengan data yang invalid
3. Test dengan file Excel yang besar (mendekati limit 1000 baris)
4. Monitor performance dan memory usage
5. Add more comprehensive logging jika diperlukan