import React, { useState, useEffect } from 'react';
import { Plus, Search, ShoppingCart, Gamepad2, User, Clock, DollarSign, Minus, X, Calculator, Receipt, CreditCard, Banknote, Smartphone, CheckCircle, AlertCircle, Package, Ticket } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { mockCustomers, mockConsoles, mockProducts, mockRateProfiles, mockVouchers } from '../data/mockData';
import { Customer, Console, Product, RateProfile, Voucher } from '../types';
import Swal from 'sweetalert2';
import PrepaidPaymentModule from './PrepaidPaymentModule';
import PayAsYouGoPaymentModule from './PayAsYouGoPaymentModule';
import { PaymentData } from './PaymentModule';
import { usePaymentModule } from '../hooks/usePaymentModule';

const Cashier: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'prepaid' | 'payasyougo' | 'pos'>('prepaid');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedConsole, setSelectedConsole] = useState<Console | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(2);
  const [selectedRateProfile, setSelectedRateProfile] = useState<RateProfile | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showConsoleModal, setShowConsoleModal] = useState(false);
  const [searchCustomer, setSearchCustomer] = useState('');
  const [searchConsole, setSearchConsole] = useState('');
  
  // POS States
  const [cart, setCart] = useState<Array<{
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    total: number;
  }>>([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Voucher States
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherHours, setVoucherHours] = useState<number>(0);

  // Payment Module Integration
  const {
    isPaymentOpen,
    paymentType,
    paymentData,
    openPrepaidPayment,
    openPayAsYouGoPayment,
    closePayment,
    handlePaymentConfirm
  } = usePaymentModule({
    onPaymentSuccess: async (payment: PaymentData) => {
      try {
        if (paymentType === 'prepaid') {
          await handleStartPrepaidRental(payment);
        } else {
          await handleCompletePOSSale(payment);
        }
        
        Swal.fire({
          icon: 'success',
          title: 'Pembayaran Berhasil!',
          text: paymentType === 'prepaid' 
            ? 'Rental telah dimulai' 
            : 'Transaksi berhasil diproses',
          timer: 2000,
          timerProgressBar: true
        });
      } catch (error) {
        console.error('Payment processing error:', error);
        Swal.fire({
          icon: 'error',
          title: 'Gagal Memproses Pembayaran',
          text: 'Terjadi kesalahan saat memproses pembayaran'
        });
      }
    },
    onPaymentError: (error: Error) => {
      Swal.fire({
        icon: 'error',
        title: 'Error Pembayaran',
        text: error.message
      });
    }
  });

  const filteredCustomers = mockCustomers.filter(customer =>
    customer.name.toLowerCase().includes(searchCustomer.toLowerCase()) ||
    customer.phone.includes(searchCustomer)
  );

  const availableConsoles = mockConsoles.filter(console => console.status === 'available');
  const filteredConsoles = availableConsoles.filter(console =>
    console.name.toLowerCase().includes(searchConsole.toLowerCase())
  );

  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchProduct.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory && product.isActive;
  });

  const cartTotal = cart.reduce((sum, item) => sum + item.total, 0);

  const calculateRentalAmount = () => {
    if (!selectedConsole || !selectedRateProfile || !selectedDuration) return 0;
    return selectedRateProfile.hourlyRate * selectedDuration;
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(false);
    setSearchCustomer('');
  };

  const handleSelectConsole = (console: Console) => {
    setSelectedConsole(console);
    const rateProfile = mockRateProfiles.find(rp => rp.id === console.rateProfileId);
    setSelectedRateProfile(rateProfile || null);
    setShowConsoleModal(false);
    setSearchConsole('');
  };

  const handleAddToCart = (product: Product) => {
    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: 1,
        total: product.price
      }]);
    }
  };

  const handleUpdateCartQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.productId !== productId));
    } else {
      setCart(cart.map(item =>
        item.productId === productId
          ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
          : item
      ));
    }
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  // Updated handler for prepaid rental - now opens payment module
  const handlePayAndStart = () => {
    if (!selectedCustomer || !selectedConsole || !selectedRateProfile) {
      Swal.fire('Error', 'Silakan pilih customer, console, dan pastikan rate profile tersedia', 'warning');
      return;
    }

    const totalAmount = calculateRentalAmount();
    
    openPrepaidPayment({
      totalAmount,
      customerName: selectedCustomer.name,
      consoleName: selectedConsole.name,
      duration: selectedDuration,
      rateDetails: {
        baseRate: selectedRateProfile.hourlyRate,
        peakHourRate: selectedRateProfile.peakHourRate,
        weekendMultiplier: selectedRateProfile.weekendMultiplier
      }
    });
  };

  // Handler for processing prepaid rental after payment confirmation
  const handleStartPrepaidRental = async (paymentData: PaymentData) => {
    if (!selectedCustomer || !selectedConsole || !selectedRateProfile) return;

    try {
      const rentalData = {
        customer_id: selectedCustomer.id,
        console_id: selectedConsole.id,
        start_time: new Date().toISOString(),
        duration_minutes: selectedDuration * 60,
        rate_type: 'hourly',
        base_amount: selectedRateProfile.hourlyRate * selectedDuration,
        total_amount: calculateRentalAmount(),
        paid_amount: paymentData.amount,
        status: 'active',
        payment_status: 'paid',
        applied_rate_profile: {
          id: selectedRateProfile.id,
          name: selectedRateProfile.name,
          hourlyRate: selectedRateProfile.hourlyRate
        }
      };

      // Save rental session to database
      const { data: rental, error: rentalError } = await supabase
        .from('rental_sessions')
        .insert(rentalData)
        .select()
        .single();

      if (rentalError) throw rentalError;

      // Update console status
      await supabase
        .from('consoles')
        .update({ status: 'rented' })
        .eq('id', selectedConsole.id);

      // Create payment record
      const paymentRecord = {
        customer_id: selectedCustomer.id,
        customer_name: selectedCustomer.name,
        amount: paymentData.amount,
        payment_method: paymentData.method,
        reference_id: rental.id,
        reference_type: 'rental',
        status: 'completed',
        notes: paymentData.notes
      };

      await supabase
        .from('payments')
        .insert(paymentRecord);

      // Reset form
      setSelectedCustomer(null);
      setSelectedConsole(null);
      setSelectedDuration(2);
      setSelectedRateProfile(null);

    } catch (error: any) {
      console.error('Rental creation error:', error);
      throw new Error('Gagal memulai rental: ' + error.message);
    }
  };

  // Updated handler for POS sale - now opens payment module
  const handleProcessSale = () => {
    if (cart.length === 0) {
      Swal.fire('Error', 'Keranjang kosong', 'warning');
      return;
    }

    openPayAsYouGoPayment({
      totalAmount: cartTotal,
      customerName: selectedCustomer?.name || 'Walk-in Customer',
      consoleName: 'POS Sale',
      duration: 0,
      items: cart.map(item => ({
        name: item.productName,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      })),
      breakdown: {
        subtotal: cartTotal,
        tax: 0,
        discount: 0,
        lateFee: 0
      }
    });
  };

  // Handler for processing POS sale after payment confirmation
  const handleCompletePOSSale = async (paymentData: PaymentData) => {
    try {
      // Create sale record
      const saleData = {
        customer_id: selectedCustomer?.id,
        subtotal: cartTotal,
        tax: 0,
        discount: 0,
        total: cartTotal,
        payment_method: paymentData.method,
        payment_amount: paymentData.amount,
        change_amount: paymentData.changeAmount || 0
      };

      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert(saleData)
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const saleItems = cart.map(item => ({
        sale_id: sale.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      }));

      await supabase
        .from('sale_items')
        .insert(saleItems);

      // Update product stock
      for (const item of cart) {
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.productId)
          .single();

        if (product) {
          await supabase
            .from('products')
            .update({ stock: product.stock - item.quantity })
            .eq('id', item.productId);
        }
      }

      // Reset cart and customer
      setCart([]);
      setSelectedCustomer(null);

    } catch (error: any) {
      console.error('Sale processing error:', error);
      throw new Error('Gagal memproses penjualan: ' + error.message);
    }
  };

  const handleApplyVoucher = () => {
    if (!selectedVoucher || voucherHours <= 0) {
      Swal.fire('Error', 'Pilih voucher dan masukkan jam yang valid', 'warning');
      return;
    }

    if (voucherHours > selectedVoucher.remainingHours) {
      Swal.fire('Error', 'Jam yang digunakan melebihi sisa voucher', 'warning');
      return;
    }

    // Apply voucher logic here
    Swal.fire('Success', `Voucher ${selectedVoucher.voucherCode} berhasil diterapkan untuk ${voucherHours} jam`, 'success');
    setShowVoucherModal(false);
    setSelectedVoucher(null);
    setVoucherCode('');
    setVoucherHours(0);
  };

  const renderPrepaidTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Gamepad2 className="h-5 w-5 text-blue-600" />
          Rental Bayar di Muka
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Customer *</label>
            <div className="space-y-2">
              {selectedCustomer ? (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedCustomer.name}</p>
                      <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCustomerModal(true)}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Pilih Customer</span>
                </button>
              )}
            </div>
          </div>

          {/* Console Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Console *</label>
            <div className="space-y-2">
              {selectedConsole ? (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Gamepad2 className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedConsole.name}</p>
                      <p className="text-sm text-gray-600">
                        Rp {selectedRateProfile?.hourlyRate.toLocaleString('id-ID') || '0'}/jam
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedConsole(null);
                      setSelectedRateProfile(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowConsoleModal(true)}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Pilih Console</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Duration and Voucher */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Durasi (jam)</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedDuration(Math.max(1, selectedDuration - 1))}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(Math.max(1, Number(e.target.value)))}
                className="flex-1 text-center text-lg font-semibold py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="24"
              />
              <button
                onClick={() => setSelectedDuration(selectedDuration + 1)}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Voucher (Opsional)</label>
            <button
              onClick={() => setShowVoucherModal(true)}
              className="w-full p-3 border border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
            >
              <Ticket className="h-4 w-4 text-purple-600" />
              <span className="text-gray-600">Gunakan Voucher</span>
            </button>
          </div>
        </div>

        {/* Rental Summary */}
        {selectedCustomer && selectedConsole && selectedRateProfile && (
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Ringkasan Rental
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Customer:</span>
                <span className="font-medium">{selectedCustomer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Console:</span>
                <span className="font-medium">{selectedConsole.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Durasi:</span>
                <span className="font-medium">{selectedDuration} jam</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tarif per jam:</span>
                <span className="font-medium">Rp {selectedRateProfile.hourlyRate.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
                <span>Total:</span>
                <span className="text-blue-600">Rp {calculateRentalAmount().toLocaleString('id-ID')}</span>
              </div>
            </div>
            
            <button
              onClick={handlePayAndStart}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard className="h-5 w-5" />
              Bayar dan Mulai Rental
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderPOSTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Product Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-green-600" />
          Pilih Produk
        </h2>
        
        {/* Search and Filter */}
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Semua Kategori</option>
            <option value="snack">Snack</option>
            <option value="beverage">Minuman</option>
            <option value="food">Makanan</option>
            <option value="other">Lainnya</option>
          </select>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => handleAddToCart(product)}
              className="p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
            >
              <div className="space-y-1">
                <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                <p className="text-blue-600 font-semibold">Rp {product.price.toLocaleString('id-ID')}</p>
                <p className="text-xs text-gray-500">Stok: {product.stock}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Shopping Cart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-purple-600" />
          Keranjang Belanja
        </h2>

        {/* Customer for POS */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Customer (Opsional)</label>
          {selectedCustomer ? (
            <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm font-medium">{selectedCustomer.name}</span>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowCustomerModal(true)}
              className="w-full p-2 border border-dashed border-gray-300 rounded-lg hover:border-blue-400 text-sm text-gray-600"
            >
              + Pilih Customer
            </button>
          )}
        </div>

        {/* Cart Items */}
        <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Keranjang kosong</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.productId} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.productName}</p>
                  <p className="text-sm text-gray-600">Rp {item.price.toLocaleString('id-ID')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateCartQuantity(item.productId, item.quantity - 1)}
                    className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <button
                    onClick={() => handleUpdateCartQuantity(item.productId, item.quantity + 1)}
                    className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleRemoveFromCart(item.productId)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Total */}
        {cart.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-gray-900">Total:</span>
              <span className="text-xl font-bold text-green-600">
                Rp {cartTotal.toLocaleString('id-ID')}
              </span>
            </div>
            
            <button
              onClick={handleProcessSale}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Receipt className="h-5 w-5" />
              Proses Pembayaran
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Kasir POS</h1>
        <p className="text-gray-600">Sistem Point of Sale untuk rental dan penjualan produk</p>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg">
          {[
            { id: 'prepaid', label: 'Bayar di Muka', icon: CreditCard },
            { id: 'payasyougo', label: 'Pay As You Go', icon: Clock },
            { id: 'pos', label: 'Penjualan Produk', icon: ShoppingCart }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'prepaid' && renderPrepaidTab()}
      {activeTab === 'payasyougo' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center py-12">
            <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Pay As You Go</h3>
            <p className="text-gray-600 mb-4">
              Fitur ini digunakan untuk mengakhiri rental yang sedang berlangsung.
            </p>
            <p className="text-sm text-gray-500">
              Silakan gunakan menu "Active Rentals" untuk mengelola rental yang sedang berjalan.
            </p>
          </div>
        </div>
      )}
      {activeTab === 'pos' && renderPOSTab()}

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Pilih Customer</h2>
              
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Cari nama atau nomor..."
                  value={searchCustomer}
                  onChange={(e) => setSearchCustomer(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => handleSelectCustomer(customer)}
                    className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    <p className="text-sm text-gray-600">{customer.phone}</p>
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setShowCustomerModal(false)}
                className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Console Selection Modal */}
      {showConsoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Pilih Console</h2>
              
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Cari console..."
                  value={searchConsole}
                  onChange={(e) => setSearchConsole(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredConsoles.map((console) => {
                  const rateProfile = mockRateProfiles.find(rp => rp.id === console.rateProfileId);
                  return (
                    <button
                      key={console.id}
                      onClick={() => handleSelectConsole(console)}
                      className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
                    >
                      <p className="font-medium text-gray-900">{console.name}</p>
                      <p className="text-sm text-gray-600">
                        Rp {rateProfile?.hourlyRate.toLocaleString('id-ID') || '0'}/jam
                      </p>
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setShowConsoleModal(false)}
                className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voucher Modal */}
      {showVoucherModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Gunakan Voucher</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kode Voucher</label>
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) => {
                      setVoucherCode(e.target.value);
                      const voucher = mockVouchers.find(v => v.voucherCode === e.target.value && v.status === 'active');
                      setSelectedVoucher(voucher || null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Masukkan kode voucher"
                  />
                </div>

                {selectedVoucher && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="font-medium text-purple-900 mb-2">{selectedVoucher.name}</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-purple-700">Sisa jam:</span>
                        <span className="font-medium">{selectedVoucher.remainingHours} jam</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-700">Customer:</span>
                        <span className="font-medium">{selectedVoucher.customerName || 'Umum'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedVoucher && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jam yang Digunakan</label>
                    <input
                      type="number"
                      value={voucherHours}
                      onChange={(e) => setVoucherHours(Number(e.target.value))}
                      max={selectedVoucher.remainingHours}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowVoucherModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={handleApplyVoucher}
                  disabled={!selectedVoucher || voucherHours <= 0}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Gunakan Voucher
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modules */}
      {paymentType === 'prepaid' && paymentData && (
        <PrepaidPaymentModule
          isOpen={isPaymentOpen}
          onClose={closePayment}
          onConfirm={handlePaymentConfirm}
          totalAmount={paymentData.totalAmount}
          customerName={paymentData.customerName}
          consoleName={paymentData.consoleName}
          duration={paymentData.duration}
          rateDetails={paymentData.rateDetails}
        />
      )}
      
      {paymentType === 'payasyougo' && paymentData && (
        <PayAsYouGoPaymentModule
          isOpen={isPaymentOpen}
          onClose={closePayment}
          onConfirm={handlePaymentConfirm}
          totalAmount={paymentData.totalAmount}
          customerName={paymentData.customerName}
          consoleName={paymentData.consoleName}
          duration={paymentData.duration}
          items={paymentData.items}
          breakdown={paymentData.breakdown}
        />
      )}
    </div>
  );
};

export default Cashier;