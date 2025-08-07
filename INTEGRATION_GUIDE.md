# Panduan Integrasi Modul Pembayaran

## Perubahan yang Dilakukan

### 1. Komponen Cashier.tsx
**Perubahan Utama:**
- Mengganti dialog konfirmasi sederhana dengan modul pembayaran baru
- Integrasi `usePaymentModule` hook untuk state management
- Handler `handlePayAndStart()` sekarang membuka `PrepaidPaymentModule`
- Handler `handleProcessSale()` sekarang membuka `PayAsYouGoPaymentModule`
- Menambahkan handler untuk memproses pembayaran setelah konfirmasi

**Fungsi Baru:**
```tsx
// Handler untuk membuka payment module prepaid
const handlePayAndStart = () => {
  openPrepaidPayment({
    totalAmount,
    customerName: selectedCustomer.name,
    consoleName: selectedConsole.name,
    duration: selectedDuration,
    rateDetails: rateProfile
  });
};

// Handler untuk memproses rental setelah pembayaran dikonfirmasi
const handleStartPrepaidRental = async (paymentData: PaymentData) => {
  // Logic untuk menyimpan rental dan payment ke database
};
```

### 2. Komponen ActiveRentals.tsx
**Perubahan Utama:**
- Mengganti dialog konfirmasi untuk mengakhiri rental
- Integrasi dengan `PayAsYouGoPaymentModule`
- Handler `handleEndRental()` sekarang membuka payment module dengan breakdown lengkap
- Menambahkan kalkulasi item tambahan dan denda keterlambatan

**Fungsi Baru:**
```tsx
// Handler untuk membuka payment module pay-as-you-go
const handleEndRental = async (rental: RentalSession) => {
  const additionalItems = await getAdditionalItems(rental.id);
  const lateFee = calculateLateFee(rental);
  
  openPayAsYouGoPayment({
    totalAmount: finalAmount,
    items: additionalItems,
    breakdown: { subtotal, lateFee, discount: 0 }
  });
};

// Handler untuk menyelesaikan rental setelah pembayaran
const handleCompleteRental = async (rental: RentalSession, paymentData: PaymentData) => {
  // Logic untuk update rental session dan console status
};
```

## Fitur yang Ditambahkan

### 1. Payment Module Integration
- **State Management**: Menggunakan `usePaymentModule` hook
- **Error Handling**: Comprehensive error handling dengan SweetAlert2
- **Success Callbacks**: Automatic success handling dan UI updates

### 2. Enhanced Payment Flow
- **Prepaid**: Pembayaran sebelum rental dimulai dengan preview lengkap
- **Pay-as-you-go**: Pembayaran setelah rental selesai dengan breakdown detail
- **Validation**: Validasi pembayaran dan error handling

### 3. Database Integration
- **Payment Records**: Otomatis menyimpan record pembayaran ke database
- **Rental Updates**: Update status rental dan console setelah pembayaran
- **Item Management**: Integrasi dengan item tambahan pada rental

## Cara Kerja Baru

### Flow Pembayaran Prepaid:
1. User memilih customer, console, dan durasi
2. Klik "Bayar dan Mulai Rental"
3. Modul pembayaran terbuka dengan preview lengkap
4. User memilih metode pembayaran dan konfirmasi
5. Sistem memproses pembayaran dan memulai rental
6. Console status berubah ke "rented"

### Flow Pembayaran Pay-as-you-go:
1. User mengakhiri rental dari Active Rentals
2. Sistem menghitung durasi aktual dan item tambahan
3. Modul pembayaran terbuka dengan breakdown lengkap
4. User konfirmasi pembayaran
5. Sistem menyelesaikan rental dan update database
6. Console status kembali ke "available"

## Keuntungan Implementasi

1. **User Experience**: UI yang konsisten dan profesional
2. **Data Integrity**: Semua pembayaran tercatat dengan detail lengkap
3. **Flexibility**: Mudah dikustomisasi untuk kebutuhan spesifik
4. **Maintainability**: Kode terorganisir dengan separation of concerns
5. **Scalability**: Mudah ditambahkan fitur payment gateway di masa depan

## Backward Compatibility

- Semua fungsi existing tetap berfungsi normal
- Database schema tidak berubah
- API calls tetap menggunakan struktur yang sama
- Hanya UI dan flow pembayaran yang diperbaiki

## Testing Checklist

- [ ] Prepaid rental dapat dimulai dengan pembayaran tunai
- [ ] Prepaid rental dapat dimulai dengan pembayaran kartu/transfer
- [ ] Pay-as-you-go rental dapat diselesaikan dengan berbagai metode pembayaran
- [ ] Kalkulasi kembalian untuk pembayaran tunai berfungsi
- [ ] Item tambahan terhitung dalam total pembayaran
- [ ] Denda keterlambatan terhitung dengan benar
- [ ] Payment records tersimpan ke database
- [ ] Console status terupdate dengan benar
- [ ] Error handling berfungsi dengan baik

Integrasi ini menggantikan dialog konfirmasi sederhana dengan sistem pembayaran yang komprehensif tanpa mengubah logika bisnis yang sudah ada.