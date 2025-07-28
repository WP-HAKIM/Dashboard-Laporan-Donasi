# Perbaikan Error Import Excel

## Masalah yang Diperbaiki

### Error: "The transactions.0.qurbanOwnerName field must be a string"

**Penyebab:**
1. Validasi `required_if` di Laravel tidak bekerja dengan baik untuk nested array
2. Data yang dikirim dari frontend mungkin mengandung nilai `null` atau `undefined` yang tidak dikonversi dengan benar menjadi string
3. Kurangnya validasi yang eksplisit untuk field QURBAN di backend

## Solusi yang Diterapkan

### 1. Perbaikan Frontend (`AllTransactions.tsx`)

**Validasi Data yang Lebih Ketat:**
```typescript
// Validasi qurbanOwnerName untuk program QURBAN
if (programType === 'QURBAN') {
  const qurbanOwnerName = String(row[5] || '').trim();
  if (!qurbanOwnerName) {
    results.errors.push({
      row: rowNumber,
      message: 'Nama Pemilik Qurban wajib diisi untuk program QURBAN'
    });
    continue;
  }
}
```

**Pemrosesan Data yang Lebih Aman:**
```typescript
// Pastikan semua string di-trim dan tidak null
const qurbanOwnerName = programType === 'QURBAN' ? String(row[5] || '').trim() : '';

const transactionData = {
  donorName: String(row[0] || '').trim(),
  // ... field lainnya
  qurbanOwnerName: qurbanOwnerName,
  statusReason: row[12] ? String(row[12] || '').trim() : ''
};
```

### 2. Perbaikan Backend (`TransactionController.php`)

**Validasi Custom untuk Field QURBAN:**
```php
// Ganti validasi required_if dengan validasi custom
'transactions.*.qurbanOwnerName' => 'nullable|string|max:255',
'transactions.*.qurbanAmount' => 'nullable|numeric|min:0',

// Tambahkan validasi custom
foreach ($request->transactions as $index => $transactionData) {
    if ($transactionData['programType'] === 'QURBAN') {
        if (empty($transactionData['qurbanOwnerName']) || !is_string($transactionData['qurbanOwnerName'])) {
            return response()->json([
                'success' => false,
                'message' => 'Data tidak valid',
                'errors' => [
                    "transactions.{$index}.qurbanOwnerName" => ['Field wajib untuk program QURBAN']
                ]
            ], 422);
        }
    }
}
```

## Mapping Kolom Excel

Urutan kolom dalam template Excel:
```
0: Nama Donatur
1: Nominal
2: Metode Pembayaran
3: Jenis Program
4: Program
5: Nama Pemilik Qurban  ← Field yang bermasalah
6: Nominal Qurban
7: Cabang
8: Tim
9: Relawan
10: Tanggal Transaksi
11: Status
12: Alasan Status
```

## Validasi Data

### Frontend Validation:
1. Memastikan field tidak kosong untuk program QURBAN
2. Konversi semua data ke string dengan `.trim()`
3. Validasi tipe data sebelum dikirim ke API

### Backend Validation:
1. Validasi dasar dengan Laravel rules
2. Validasi custom untuk field QURBAN
3. Pengecekan eksplisit untuk `is_string()` dan `empty()`

## Cara Pengujian

1. **Download Template Excel** dari aplikasi
2. **Isi data** sesuai format yang benar:
   - Untuk program QURBAN: pastikan kolom "Nama Pemilik Qurban" dan "Nominal Qurban" terisi
   - Untuk program ZISWAF: kosongkan kedua kolom tersebut
3. **Import file** melalui fitur Import Excel
4. **Periksa hasil** import di halaman transaksi

## Status Perbaikan

✅ **Frontend**: Validasi data diperbaiki
✅ **Backend**: Validasi custom ditambahkan
✅ **Error Handling**: Pesan error lebih jelas
✅ **Data Processing**: Konversi string yang aman

## File yang Dimodifikasi

1. `frontend/src/components/Transactions/AllTransactions.tsx`
   - Perbaikan validasi qurbanOwnerName
   - Konversi string yang lebih aman
   - Validasi data sebelum dikirim

2. `backend/app/Http/Controllers/Api/TransactionController.php`
   - Ganti `required_if` dengan validasi custom
   - Pengecekan eksplisit untuk field QURBAN
   - Pesan error yang lebih informatif

## Catatan Penting

- Pastikan backend server berjalan di `http://127.0.0.1:8000`
- Pastikan frontend berjalan di `http://localhost:5174`
- Gunakan template Excel yang sudah disediakan
- Maksimal 1000 baris per import
- Format tanggal: DD/MM/YYYY atau DD/MM/YYYY HH:MM:SS