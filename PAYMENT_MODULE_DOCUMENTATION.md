# Dokumentasi Modul Pembayaran Baru

## Overview
Modul pembayaran baru telah dibuat untuk menggantikan dialog konfirmasi pembayaran yang sederhana dengan sistem pembayaran yang lebih komprehensif dan terpisah antara "Bayar di Muka" dan "Pay As You Go".

## Struktur File

### 1. PaymentModule.tsx (Core Component)
**Lokasi:** `src/components/PaymentModule.tsx`

Komponen utama yang menangani UI dan logika pembayaran. Dapat digunakan untuk kedua jenis pembayaran dengan konfigurasi yang berbeda.

**Props:**
- `paymentType`: 'prepaid' | 'payasyougo'
- `totalAmount`: Jumlah total yang harus dibayar
- `customerName`: Nama customer
- `consoleName`: Nama console
- `duration`: Durasi rental (jam)
- `items`: Array item tambahan (untuk Pay As You Go)
- `breakdown`: Rincian biaya

**Features:**
- Pemilihan metode pembayaran (Tunai, Kartu, Transfer)
- Kalkulasi kembalian otomatis untuk pembayaran tunai
- Tombol nominal cepat untuk pembayaran tunai
- Validasi pembayaran
- Input referensi untuk kartu/transfer
- Catatan pembayaran

### 2. PrepaidPaymentModule.tsx (Wrapper untuk Bayar di Muka)
**Lokasi:** `src/components/PrepaidPaymentModule.tsx`

Wrapper khusus untuk pembayaran "Bayar di Muka" yang menyediakan konfigurasi dan logika spesifik.

**Penggunaan:**
```tsx
<PrepaidPaymentModule
  isOpen={showPayment}
  onClose={() => setShowPayment(false)}
  onConfirm={handlePrepaidPayment}
  totalAmount={calculatedAmount}
  customerName={selectedCustomer.name}
  consoleName={selectedConsole.name}
  duration={selectedDuration}
  rateDetails={rateProfile}
/>
```

### 3. PayAsYouGoPaymentModule.tsx (Wrapper untuk Pay As You Go)
**Lokasi:** `src/components/PayAsYouGoPaymentModule.tsx`

Wrapper khusus untuk pembayaran "Pay As You Go" yang menangani item tambahan dan breakdown yang lebih kompleks.

**Penggunaan:**
```tsx
<PayAsYouGoPaymentModule
  isOpen={showPayment}
  onClose={() => setShowPayment(false)}
  onConfirm={handlePayAsYouGoPayment}
  totalAmount={finalAmount}
  customerName={customer.name}
  consoleName={console.name}
  duration={actualDuration}
  items={additionalItems}
  breakdown={paymentBreakdown}
/>
```

### 4. usePaymentModule.ts (Custom Hook)
**Lokasi:** `src/hooks/usePaymentModule.ts`

Custom hook untuk mengelola state dan logika pembayaran.

**Penggunaan:**
```tsx
const {
  isPaymentOpen,
  paymentType,
  paymentData,
  openPrepaidPayment,
  openPayAsYouGoPayment,
  closePayment,
  handlePaymentConfirm
} = usePaymentModule({
  onPaymentSuccess: (data) => console.log('Payment success:', data),
  onPaymentError: (error) => console.error('Payment error:', error)
});
```

### 5. paymentHelpers.ts (Utility Functions)
**Lokasi:** `src/utils/paymentHelpers.ts`

Kumpulan fungsi utility untuk membantu kalkulasi dan validasi pembayaran.

**Functions:**
- `validatePayment()`: Validasi data pembayaran
- `calculateChange()`: Hitung kembalian
- `formatPaymentMethod()`: Format metode pembayaran untuk display
- `generatePaymentReference()`: Generate referensi pembayaran
- `calculatePrepaidBreakdown()`: Hitung breakdown untuk prepaid
- `calculatePayAsYouGoBreakdown()`: Hitung breakdown untuk pay-as-you-go
- `createPaymentRecord()`: Buat record pembayaran untuk database

## Cara Implementasi

### 1. Mengganti Dialog Konfirmasi Lama

Untuk menggantikan dialog konfirmasi pembayaran yang lama, ikuti langkah berikut:

**Sebelum (Dialog Konfirmasi Lama):**
```tsx
// Dialog sederhana dengan confirm()
const handlePayAndStart = () => {
  if (confirm(`Konfirmasi pembayaran Rp ${totalAmount.toLocaleString('id-ID')}?`)) {
    // Start rental logic
    startRental();
  }
};
```

**Sesudah (Modul Pembayaran Baru):**
```tsx
import PrepaidPaymentModule from './PrepaidPaymentModule';
import { PaymentData } from './PaymentModule';

const [showPayment, setShowPayment] = useState(false);

const handlePayAndStart = () => {
  setShowPayment(true);
};

const handlePrepaidPayment = async (paymentData: PaymentData) => {
  try {
    // Process payment
    await processPayment(paymentData);
    
    // Start rental
    await startRental();
    
    // Close payment module
    setShowPayment(false);
    
    // Show success message
    alert('Pembayaran berhasil! Rental dimulai.');
  } catch (error) {
    console.error('Payment error:', error);
    alert('Gagal memproses pembayaran');
  }
};

// Di JSX
<PrepaidPaymentModule
  isOpen={showPayment}
  onClose={() => setShowPayment(false)}
  onConfirm={handlePrepaidPayment}
  totalAmount={totalAmount}
  customerName={selectedCustomer.name}
  consoleName={selectedConsole.name}
  duration={duration}
/>
```

### 2. Integrasi dengan Komponen yang Ada

**Untuk Cashier.tsx:**
```tsx
import PrepaidPaymentModule from './PrepaidPaymentModule';
import PayAsYouGoPaymentModule from './PayAsYouGoPaymentModule';

// Tambahkan state untuk payment module
const [showPrepaidPayment, setShowPrepaidPayment] = useState(false);
const [showPayAsYouGoPayment, setShowPayAsYouGoPayment] = useState(false);

// Ganti handler pembayaran
const handleStartPrepaidRental = () => {
  setShowPrepaidPayment(true);
};

const handleEndPayAsYouGoRental = () => {
  setShowPayAsYouGoPayment(true);
};
```

**Untuk ActiveRentals.tsx:**
```tsx
import PayAsYouGoPaymentModule from './PayAsYouGoPaymentModule';

// Untuk mengakhiri rental dengan pembayaran
const handleEndRental = (rentalId: string) => {
  const rental = rentals.find(r => r.id === rentalId);
  if (rental) {
    setSelectedRental(rental);
    setShowPayAsYouGoPayment(true);
  }
};
```

## Fitur Utama

### 1. Antarmuka yang Konsisten
- Desain yang sama untuk kedua jenis pembayaran
- Responsive design untuk berbagai ukuran layar
- Animasi dan transisi yang smooth

### 2. Metode Pembayaran
- **Tunai**: Dengan kalkulasi kembalian otomatis dan tombol nominal cepat
- **Kartu**: Input referensi nomor kartu
- **Transfer**: Input referensi transfer

### 3. Validasi Pembayaran
- Validasi jumlah minimum pembayaran
- Validasi format referensi
- Error handling yang komprehensif

### 4. Breakdown Biaya
- Tampilan rincian biaya yang jelas
- Support untuk diskon, pajak, dan denda
- Kalkulasi otomatis

### 5. State Management
- Custom hook untuk mengelola state pembayaran
- Separation of concerns yang baik
- Easy integration dengan komponen existing

## Keuntungan Implementasi Baru

1. **Modular**: Setiap jenis pembayaran memiliki wrapper tersendiri
2. **Reusable**: Core component dapat digunakan untuk berbagai skenario
3. **Maintainable**: Kode terorganisir dengan baik dan mudah di-maintain
4. **Extensible**: Mudah ditambahkan fitur baru seperti payment gateway
5. **User-friendly**: UI yang intuitif dan informatif
6. **Type-safe**: Full TypeScript support dengan proper typing

## Migrasi dari Sistem Lama

1. **Identifikasi**: Cari semua tempat yang menggunakan dialog konfirmasi lama
2. **Replace**: Ganti dengan modul pembayaran yang sesuai
3. **Test**: Pastikan semua flow pembayaran berfungsi dengan baik
4. **Cleanup**: Hapus kode dialog konfirmasi lama yang tidak terpakai

## Contoh Implementasi Lengkap

```tsx
// Dalam komponen Cashier atau ActiveRentals
import { usePaymentModule } from '../hooks/usePaymentModule';
import PrepaidPaymentModule from './PrepaidPaymentModule';
import PayAsYouGoPaymentModule from './PayAsYouGoPaymentModule';

const MyComponent = () => {
  const {
    isPaymentOpen,
    paymentType,
    paymentData,
    openPrepaidPayment,
    openPayAsYouGoPayment,
    closePayment,
    handlePaymentConfirm
  } = usePaymentModule({
    onPaymentSuccess: (data) => {
      console.log('Payment successful:', data);
      // Handle success logic
    },
    onPaymentError: (error) => {
      console.error('Payment failed:', error);
      // Handle error logic
    }
  });

  const handleStartPrepaidRental = () => {
    openPrepaidPayment({
      totalAmount: 30000,
      customerName: 'John Doe',
      consoleName: 'PS5 Station 1',
      duration: 2
    });
  };

  const handleEndRental = () => {
    openPayAsYouGoPayment({
      totalAmount: 45000,
      customerName: 'Jane Smith',
      consoleName: 'PS4 Station 2',
      duration: 3,
      items: [
        { name: 'Coca Cola', quantity: 2, price: 5000, total: 10000 }
      ],
      breakdown: {
        subtotal: 35000,
        lateFee: 0,
        discount: 0
      }
    });
  };

  return (
    <div>
      {/* Your existing component JSX */}
      
      {/* Payment Modules */}
      {paymentType === 'prepaid' && (
        <PrepaidPaymentModule
          isOpen={isPaymentOpen}
          onClose={closePayment}
          onConfirm={handlePaymentConfirm}
          {...paymentData}
        />
      )}
      
      {paymentType === 'payasyougo' && (
        <PayAsYouGoPaymentModule
          isOpen={isPaymentOpen}
          onClose={closePayment}
          onConfirm={handlePaymentConfirm}
          {...paymentData}
        />
      )}
    </div>
  );
};
```

Modul pembayaran baru ini memberikan pengalaman yang konsisten dan profesional untuk kedua jenis pembayaran, sambil mempertahankan fleksibilitas untuk pengembangan di masa depan.