# Fitur Import Excel Transaksi

Fitur import Excel telah berhasil dibuat untuk memudahkan pengguna dalam menginput transaksi secara massal.

## Fitur yang Tersedia

### 1. Download Template Excel
- **Lokasi**: Tombol "Download Template" di halaman Semua Transaksi
- **File**: Template_Import_Transaksi.xlsx
- **Isi**: 
  - Sheet "Template Import" dengan header dan contoh data
  - Sheet "Petunjuk" dengan panduan lengkap penggunaan

### 2. Import Excel
- **Lokasi**: Tombol "Import Excel" di halaman Semua Transaksi
- **Format**: File Excel (.xlsx, .xls)
- **Maksimal**: 1000 baris per import
- **Validasi**: Komprehensif dengan pesan error yang jelas

## Template Excel

### Kolom Wajib:
1. **Nama Donatur** - Nama pemberi donasi
2. **Nominal** - Jumlah donasi (angka)
3. **Metode Pembayaran** - Sesuai dengan data di sistem
4. **Jenis Program** - ZISWAF atau QURBAN
5. **Program** - Nama program sesuai data di sistem
6. **Cabang** - Nama cabang sesuai data di sistem
7. **Tim** - Nama tim sesuai data di sistem
8. **Relawan** - Nama relawan sesuai data di sistem
9. **Tanggal Transaksi** - Format: DD/MM/YYYY atau DD/MM/YYYY HH:MM:SS

### Kolom Khusus QURBAN:
- **Nama Pemilik Qurban** - Wajib diisi jika Jenis Program = QURBAN
- **Nominal Qurban** - Wajib diisi jika Jenis Program = QURBAN

### Kolom Opsional:
- **Status** - Default: pending (pending, valid, double_duta, double_input, not_in_account, other)
- **Alasan Status** - Keterangan tambahan untuk status

## Format Tanggal yang Didukung

1. **DD/MM/YYYY HH:MM:SS** - Contoh: 25/01/2025 14:30:00
2. **DD/MM/YYYY HH:MM** - Contoh: 25/01/2025 14:30
3. **DD/MM/YYYY** - Contoh: 25/01/2025

## Validasi Data

### Validasi Frontend:
- Format file Excel
- Kolom wajib tidak boleh kosong
- Format tanggal yang benar
- Jenis program harus ZISWAF atau QURBAN
- Nominal harus berupa angka positif
- Validasi khusus untuk program QURBAN
- Referensi data (cabang, tim, relawan, program, metode pembayaran)

### Validasi Backend:
- Validasi database constraint
- Validasi relasi antar tabel
- Validasi role volunteer
- Validasi program type
- Auto-assignment rate dari program

## Proses Import

1. **Upload File** - User memilih file Excel
2. **Parsing** - Sistem membaca dan memvalidasi data
3. **Validasi** - Setiap baris divalidasi secara komprehensif
4. **Batch Insert** - Data valid dikirim ke API dalam satu batch
5. **Hasil** - Menampilkan jumlah sukses dan daftar error

## Error Handling

- **Validasi Error**: Ditampilkan per baris dengan pesan yang jelas
- **API Error**: Ditangani dengan graceful fallback
- **Network Error**: Pesan error yang user-friendly
- **Progress Indicator**: Real-time progress bar selama import

## API Endpoint

**POST** `/api/transactions/import`

### Request Body:
```json
{
  "transactions": [
    {
      "donorName": "string",
      "amount": "number",
      "paymentMethodId": "number",
      "programType": "ZISWAF|QURBAN",
      "programId": "number",
      "branchId": "number",
      "teamId": "number",
      "volunteerId": "number",
      "transactionDate": "ISO date string",
      "status": "string",
      "qurbanOwnerName": "string (required if QURBAN)",
      "qurbanAmount": "number (required if QURBAN)",
      "statusReason": "string (optional)"
    }
  ]
}
```

### Response:
```json
{
  "success": true,
  "message": "Import selesai. X transaksi berhasil diimport",
  "results": {
    "success": 0,
    "errors": [
      {
        "row": 1,
        "message": "Error message"
      }
    ]
  }
}
```

## Keamanan

- **Authentication**: Menggunakan Sanctum token
- **Authorization**: Hanya user yang login dapat import
- **Validation**: Komprehensif di frontend dan backend
- **Rate Limiting**: Maksimal 1000 baris per import
- **Data Sanitization**: Input dibersihkan sebelum disimpan

## UI/UX Features

- **Modal Import**: Interface yang user-friendly
- **Progress Bar**: Real-time progress indicator
- **File Validation**: Validasi format file di frontend
- **Error Display**: Daftar error yang mudah dibaca
- **Success Feedback**: Konfirmasi jumlah data yang berhasil diimport
- **Template Download**: Satu klik download template

## Testing

Untuk menguji fitur:
1. Buka halaman "Semua Transaksi"
2. Klik "Download Template" untuk mendapatkan template
3. Isi template dengan data yang valid
4. Klik "Import Excel" dan pilih file
5. Klik "Import Data" untuk memproses
6. Lihat hasil import dan daftar error (jika ada)

## Catatan Pengembangan

- Template Excel dibuat dengan library XLSX
- Import menggunakan validasi bertingkat (frontend + backend)
- API menggunakan Laravel validation rules
- Progress tracking menggunakan React state
- Error handling yang komprehensif di semua layer