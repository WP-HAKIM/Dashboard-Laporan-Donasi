# Perbaikan Import Excel untuk Program Qurban

## Masalah yang Diperbaiki

1. **Kolom `volunteer_rate` dan `branch_rate` tidak terisi** untuk semua jenis program
   - Sebelumnya: Rate hanya disimpan ke kolom spesifik (`qurban_volunteer_rate`, `ziswaf_volunteer_rate`)
   - Sesudahnya: Rate disimpan ke `volunteer_rate` dan `branch_rate` utama untuk semua program

2. **Template Excel tidak fleksibel** untuk program QURBAN
   - Sebelumnya: Struktur kolom tidak memisahkan program QURBAN dan ZISWAF dengan jelas
   - Sesudahnya: Kolom terpisah untuk 'Program/Type Hewan Qurban' dan 'Program Ziswaf'

3. **Tidak mendukung QURBAN dengan program ZISWAF**
   - Sebelumnya: QURBAN hanya bisa menggunakan program qurban murni
   - Sesudahnya: QURBAN bisa menggunakan program ziswaf atau program qurban murni

## Struktur Template Baru

### Kolom Template Excel:
1. Nama Donatur
2. Nominal
3. Metode Pembayaran
4. Jenis Program (ZISWAF/QURBAN)
5. **Program/Type Hewan Qurban** (untuk qurban murni)
6. **Program Ziswaf** (untuk program ziswaf)
7. **Nominal Ziswaf** (untuk program ziswaf)
8. Nama Pemilik Qurban
9. Cabang
10. Tim
11. Relawan
12. Tanggal
13. Status
14. Keterangan Status

### Skenario Penggunaan:
- **ZISWAF**: Isi kolom 6 (Program Ziswaf) dan 7 (Nominal Ziswaf)
- **QURBAN Murni**: Isi kolom 5 (Program/Type Hewan Qurban), 8 (Nama Pemilik), dan 9 (Nominal Qurban)
- **QURBAN dengan Ziswaf**: Isi kolom 6 (Program Ziswaf) dan 7 (Nominal Ziswaf)

## File yang Dimodifikasi

### 1. Backend
- `backend/app/Http/Controllers/Api/TransactionController.php`
  - Memperbaiki logika pengisian kolom rate untuk program QURBAN
  - Menggunakan `volunteer_rate` dan `branch_rate` untuk QURBAN
  - Menggunakan `ziswaf_volunteer_rate` dan `ziswaf_branch_rate` untuk ZISWAF

### 2. Frontend
- `frontend/src/components/Transactions/AllTransactions.tsx`
  - Memperbarui template Excel dengan contoh data yang lebih lengkap
  - Menambahkan contoh untuk Qurban Kambing dan Qurban Sapi

### 3. Dokumentasi
- `docs/test_import_data.csv`
  - Menambahkan contoh data untuk Qurban Sapi
  - Memperbaiki nama program ZISWAF

- `docs/TROUBLESHOOTING_IMPORT.md`
  - Menambahkan penjelasan tentang kolom khusus QURBAN
  - Memberikan contoh data QURBAN yang benar

## Program Qurban yang Tersedia

1. **Qurban Kambing** (QK-001)
   - Volunteer Rate: 3.0%
   - Branch Rate: 7.0%
   - Contoh Nominal: Rp 1.000.000

2. **Qurban Sapi** (QS-001)
   - Volunteer Rate: 2.5%
   - Branch Rate: 5.0%
   - Contoh Nominal: Rp 3.500.000

## Cara Menggunakan Import Excel untuk Qurban

### 1. Download Template
- Klik tombol "Download Template" di halaman Semua Transaksi
- Template akan berisi contoh data untuk berbagai jenis program

### 2. Isi Data Qurban
Untuk program QURBAN, pastikan mengisi:
- **Jenis Program**: QURBAN
- **Program**: Pilih "Qurban Kambing" atau "Qurban Sapi"
- **Nama Pemilik Qurban**: Nama pemilik hewan qurban (wajib)
- **Nominal Qurban**: Nilai hewan qurban (wajib)
- Kolom lainnya sesuai kebutuhan

### 3. Upload File
- Klik tombol "Import Excel" di halaman Semua Transaksi
- Pilih file Excel yang sudah diisi
- Sistem akan memvalidasi dan mengimport data

## Validasi Data

Sistem akan memvalidasi:
- Format file Excel (.xlsx, .xls)
- Kolom wajib tidak boleh kosong
- Jenis Program harus ZISWAF atau QURBAN
- Untuk QURBAN: Nama Pemilik Qurban dan Nominal Qurban wajib diisi
- Nominal harus berupa angka positif
- Data referensi (Cabang, Tim, Relawan, Program) harus ada di sistem

## Status Perbaikan

✅ **Backend**: Logika pengisian kolom rate diperbaiki
✅ **Frontend**: Template Excel diperbarui dengan contoh lengkap
✅ **Dokumentasi**: Panduan penggunaan diperbaiki
✅ **Validasi**: Sistem validasi berfungsi dengan baik

## Testing

Untuk menguji perbaikan:
1. Download template Excel terbaru
2. Isi data sesuai contoh yang disediakan
3. Import file Excel
4. Periksa hasil import:
   - Kolom `volunteer_rate` dan `branch_rate` terisi untuk program QURBAN
   - Data qurban (nama pemilik dan nominal) tersimpan dengan benar
   - Komisi dihitung berdasarkan rate yang benar