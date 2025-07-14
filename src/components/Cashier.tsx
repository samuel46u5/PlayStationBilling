import React, { useState } from 'react';
import { Plus, Minus, Trash2, ShoppingCart, Calculator, CreditCard, DollarSign, Receipt, Clock, User, Gamepad2, X, Printer, MessageCircle, CheckCircle, Edit3 } from 'lucide-react';
import { mockConsoles, mockRateProfiles } from '../data/mockData';
import { db } from '../lib/supabase';
import { Product, SaleItem, RentalSession } from '../types';

interface PaymentItem {
  id: string;
  type: 'product' | 'rental';
  name: string;
  description?: string;
  quantity: number;
  price: number;
  total: number;
  productId?: string;
  rentalSessionId?: string;
}

const Cashier: React.FC = () => {
  const [cart, setCart] = useState<PaymentItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'products' | 'rentals'>('products');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [lastTransaction, setLastTransaction] = useState<any>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // Manual input states
  const [isManualInput, setIsManualInput] = useState(false);
  const [manualAmount, setManualAmount] = useState<string>('');

  // State for products, customers, and rentals from Supabase
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState<boolean>(true);
  const [rentals, setRentals] = useState<RentalSession[]>([]);
  const [loadingRentals, setLoadingRentals] = useState<boolean>(true);

  // Fetch products, customers, and rentals from Supabase on mount
  React.useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const data = await db.products.getAll();
        // Map is_active (snake_case) ke isActive (camelCase)
        const mapped = (data || []).map((p: any) => ({
          ...p,
          isActive: p.is_active,
        }));
        setProducts(mapped);
      } catch (err) {
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };
    const fetchCustomers = async () => {
      setLoadingCustomers(true);
      try {
        const data = await db.customers.getAll();
        setCustomers(data || []);
      } catch (err) {
        setCustomers([]);
      } finally {
        setLoadingCustomers(false);
      }
    };
    const fetchRentals = async () => {
      setLoadingRentals(true);
      try {
        // Use getActive to fetch active/pending rentals
        const data = await db.rentals.getActive();
        // If error, data is array of GenericStringError, else RentalSession[]
        if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && 'id' in data[0]) {
          setRentals(data);
        } else {
          setRentals([]);
        }
      } catch (err) {
        setRentals([]);
      } finally {
        setLoadingRentals(false);
      }
    };
    fetchProducts();
    fetchCustomers();
    fetchRentals();
  }, []);

  // Filter products from Supabase
  const filteredProducts = products.filter(product =>
    product.isActive && (
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.includes(searchTerm)
    )
  );

  // Filter active rentals that need payment (from Supabase)
  const pendingRentals = rentals;

  const addProductToCart = (product: Product) => {
    const existingItem = cart.find(item => item.productId === product.id && item.type === 'product');
    if (existingItem) {
      setCart(cart.map(item =>
        item.productId === product.id && item.type === 'product'
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      const newItem: PaymentItem = {
        id: `product-${product.id}-${Date.now()}`,
        type: 'product',
        name: product.name,
        description: product.description,
        quantity: 1,
        price: product.price,
        total: product.price,
        productId: product.id
      };
      setCart([...cart, newItem]);
    }
  };

  const addRentalToCart = (session: RentalSession) => {
    const customer = customers.find((c: any) => c.id === session.customerId);
    const console = mockConsoles.find(c => c.id === session.consoleId);
    
    // Calculate current rental cost
    const startTime = new Date(session.startTime);
    const now = new Date();
    const minutesElapsed = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
    const hoursElapsed = Math.ceil(minutesElapsed / 60);
    
    // Get the rate profile for this console
    const rateProfile = mockRateProfiles.find(profile => profile.id === console?.rateProfileId);
    const currentCost = hoursElapsed * (rateProfile?.hourlyRate || 0);

    const existingItem = cart.find(item => item.rentalSessionId === session.id);
    if (existingItem) {
      // Update existing rental item with current cost
      setCart(cart.map(item =>
        item.rentalSessionId === session.id
          ? { ...item, price: currentCost, total: currentCost }
          : item
      ));
    } else {
      const newItem: PaymentItem = {
        id: `rental-${session.id}-${Date.now()}`,
        type: 'rental',
        name: `${console?.name} Rental`,
        description: `Customer: ${customer?.name} | Duration: ${Math.floor(minutesElapsed / 60)}h ${minutesElapsed % 60}m`,
        quantity: 1,
        price: currentCost,
        total: currentCost,
        rentalSessionId: session.id
      };
      setCart([...cart, newItem]);
    }
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(cart.map(item =>
      item.id === itemId
        ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
        : item
    ));
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setShowPayment(false);
    setPaymentAmount(0);
    setSelectedCustomer('');
    setIsManualInput(false);
    setManualAmount('');
  };

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const tax = 0; // No tax for now
  const total = subtotal + tax;
  
  // Use manual amount if in manual mode, otherwise use paymentAmount
  const actualPaymentAmount = isManualInput ? parseFloat(manualAmount) || 0 : paymentAmount;
  const change = actualPaymentAmount - total;

  // Money denomination buttons (in thousands)
  const denominations = [
    { label: '1K', value: 1000 },
    { label: '5K', value: 5000 },
    { label: '10K', value: 10000 },
    { label: '20K', value: 20000 },
    { label: '50K', value: 50000 },
    { label: '100K', value: 100000 }
  ];

  const addDenomination = (value: number) => {
    if (isManualInput) {
      const currentValue = parseFloat(manualAmount) || 0;
      setManualAmount((currentValue + value).toString());
    } else {
      setPaymentAmount(prev => prev + value);
    }
  };

  const clearPaymentAmount = () => {
    if (isManualInput) {
      setManualAmount('');
    } else {
      setPaymentAmount(0);
    }
  };

  const setExactAmount = () => {
    if (isManualInput) {
      setManualAmount(total.toString());
    } else {
      setPaymentAmount(total);
    }
  };

  const toggleManualInput = () => {
    setIsManualInput(!isManualInput);
    if (!isManualInput) {
      // Switching to manual, clear both
      setPaymentAmount(0);
      setManualAmount('');
    } else {
      // Switching to quick buttons, clear manual
      setManualAmount('');
      setPaymentAmount(0);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'beverage': return 'bg-blue-100 text-blue-800';
      case 'food': return 'bg-orange-100 text-orange-800';
      case 'snack': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const calculateRentalCost = (session: RentalSession) => {
    const startTime = new Date(session.startTime);
    const now = new Date();
    const minutesElapsed = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
    const hoursElapsed = Math.ceil(minutesElapsed / 60);
    const console = mockConsoles.find(c => c.id === session.consoleId);
    const rateProfile = mockRateProfiles.find(profile => profile.id === console?.rateProfileId);
    return hoursElapsed * (rateProfile?.hourlyRate || 0);
  };

  const generateReceiptData = () => {
    const customer = selectedCustomer ? customers.find((c: any) => c.id === selectedCustomer) : null;
    const receiptId = `RCP-${Date.now()}`;
    const timestamp = new Date().toLocaleString('id-ID');
    
    return {
      id: receiptId,
      timestamp,
      customer,
      items: cart,
      subtotal,
      tax,
      total,
      paymentMethod,
      paymentAmount: actualPaymentAmount,
      change,
      cashier: 'Kasir 1' // This would come from logged in user
    };
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    // Validate payment amount
    if (paymentMethod === 'cash' && actualPaymentAmount < total) {
      return; // Don't proceed if insufficient payment
    }
    
    const receiptData = generateReceiptData();
    setLastTransaction(receiptData);
    
    // Process the payment
    setPaymentSuccess(true);
    setShowPaymentModal(true);
    
    // Clear cart and payment form
    clearCart();
  };

  const handlePrintReceipt = () => {
    if (!lastTransaction) return;
    
    // Create printable receipt
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt - ${lastTransaction.id}</title>
            <style>
              body { font-family: 'Courier New', monospace; font-size: 12px; margin: 20px; }
              .receipt { width: 300px; margin: 0 auto; }
              .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
              .item { display: flex; justify-content: space-between; margin: 5px 0; }
              .total { border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; }
              .footer { text-align: center; margin-top: 20px; font-size: 10px; }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="header">
                <h2>GAMING & BILLIARD CENTER</h2>
                <p>PlayStation Rental + Mini Cafe</p>
                <p>Receipt: ${lastTransaction.id}</p>
                <p>${lastTransaction.timestamp}</p>
                ${lastTransaction.customer ? `<p>Customer: ${lastTransaction.customer.name}</p>` : ''}
                <p>Kasir: ${lastTransaction.cashier}</p>
              </div>
              
              <div class="items">
                ${lastTransaction.items.map((item: any) => `
                  <div class="item">
                    <span>${item.name} ${item.type === 'product' ? `x${item.quantity}` : ''}</span>
                    <span>Rp ${item.total.toLocaleString('id-ID')}</span>
                  </div>
                  ${item.description ? `<div style="font-size: 10px; color: #666; margin-left: 10px;">${item.description}</div>` : ''}
                `).join('')}
              </div>
              
              <div class="total">
                <div class="item">
                  <span>Subtotal:</span>
                  <span>Rp ${lastTransaction.subtotal.toLocaleString('id-ID')}</span>
                </div>
                ${lastTransaction.tax > 0 ? `
                  <div class="item">
                    <span>Pajak:</span>
                    <span>Rp ${lastTransaction.tax.toLocaleString('id-ID')}</span>
                  </div>
                ` : ''}
                <div class="item" style="font-weight: bold; font-size: 14px;">
                  <span>TOTAL:</span>
                  <span>Rp ${lastTransaction.total.toLocaleString('id-ID')}</span>
                </div>
                <div class="item">
                  <span>Bayar (${lastTransaction.paymentMethod.toUpperCase()}):</span>
                  <span>Rp ${lastTransaction.paymentAmount.toLocaleString('id-ID')}</span>
                </div>
                ${lastTransaction.change > 0 ? `
                  <div class="item">
                    <span>Kembalian:</span>
                    <span>Rp ${lastTransaction.change.toLocaleString('id-ID')}</span>
                  </div>
                ` : ''}
              </div>
              
              <div class="footer">
                <p>Terima kasih atas kunjungan Anda!</p>
                <p>Selamat bermain dan nikmati waktu Anda</p>
                <p>---</p>
                <p>Simpan struk ini sebagai bukti pembayaran</p>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleSendWhatsApp = () => {
    if (!lastTransaction || !whatsappNumber) {
      return; // Don't show alert, just return
    }

    // Format WhatsApp message
    const message = `
*STRUK PEMBAYARAN*
Gaming & Billiard Center

Receipt: ${lastTransaction.id}
Tanggal: ${lastTransaction.timestamp}
${lastTransaction.customer ? `Customer: ${lastTransaction.customer.name}` : ''}
Kasir: ${lastTransaction.cashier}

*DETAIL PEMBELIAN:*
${lastTransaction.items.map((item: any) => 
  `• ${item.name} ${item.type === 'product' ? `x${item.quantity}` : ''} - Rp ${item.total.toLocaleString('id-ID')}`
).join('\n')}

*TOTAL PEMBAYARAN:*
Subtotal: Rp ${lastTransaction.subtotal.toLocaleString('id-ID')}
${lastTransaction.tax > 0 ? `Pajak: Rp ${lastTransaction.tax.toLocaleString('id-ID')}\n` : ''}*TOTAL: Rp ${lastTransaction.total.toLocaleString('id-ID')}*

Bayar (${lastTransaction.paymentMethod.toUpperCase()}): Rp ${lastTransaction.paymentAmount.toLocaleString('id-ID')}
${lastTransaction.change > 0 ? `Kembalian: Rp ${lastTransaction.change.toLocaleString('id-ID')}` : ''}

Terima kasih atas kunjungan Anda! 🎮
Selamat bermain dan nikmati waktu Anda ☕
    `.trim();

    // Format phone number for WhatsApp
    let formattedNumber = whatsappNumber.replace(/\D/g, '');
    if (formattedNumber.startsWith('0')) {
      formattedNumber = '62' + formattedNumber.substring(1);
    } else if (!formattedNumber.startsWith('62')) {
      formattedNumber = '62' + formattedNumber;
    }

    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    
    setShowWhatsAppModal(false);
    setWhatsappNumber('');
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentSuccess(false);
    setLastTransaction(null);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Kasir Terintegrasi</h1>
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Cari produk, barcode, atau customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg mb-4">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'products'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
              Produk Cafe ({filteredProducts.length})
            </button>
            <button
              onClick={() => setActiveTab('rentals')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'rentals'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Gamepad2 className="h-4 w-4" />
              Rental Aktif ({pendingRentals.length})
            </button>
          </div>
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <>
            {loadingProducts ? (
              <div className="text-center text-gray-500 py-8">Memuat produk cafe...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                Tidak ada produk cafe yang aktif atau data belum masuk.<br />
                Silakan cek data master produk di database.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => addProductToCart(product)}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="mb-3">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(product.category)}`}>
                        {product.category}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-blue-600">
                        Rp {product.price.toLocaleString('id-ID')}
                      </span>
                      <span className="text-sm text-gray-500">
                        Stok: {product.stock}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Rentals Tab */}
        {activeTab === 'rentals' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingRentals ? (
              <div className="text-center text-gray-500 py-8 col-span-full">Memuat data rental aktif...</div>
            ) : pendingRentals.length === 0 ? (
              <div className="text-center text-gray-500 py-8 col-span-full">
                Tidak ada rental aktif atau pembayaran pending.<br />
                Silakan cek data rental di database.
              </div>
            ) : (
              pendingRentals.map((session) => {
                const customer = customers.find((c: any) => c.id === session.customerId);
                const console = mockConsoles.find(c => c.id === session.consoleId);
                const rateProfile = mockRateProfiles.find(profile => profile.id === console?.rateProfileId);
                const startTime = session.startTime;
                const currentCost = calculateRentalCost({ ...session, startTime });
                return (
                  <div
                    key={session.id}
                    onClick={() => addRentalToCart({ ...session, startTime })}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Gamepad2 className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-gray-900">{console?.name}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        session.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {session.paymentStatus === 'pending' ? 'PENDING' : 'ACTIVE'}
                      </span>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <span>{customer?.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>Durasi: {formatDuration(startTime)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-green-600">
                        Rp {currentCost.toLocaleString('id-ID')}
                      </span>
                      <span className="text-sm text-gray-500">
                        Rp {(rateProfile?.hourlyRate || 0).toLocaleString('id-ID')}/jam
                      </span>
                    </div>

                    <div className="mt-3 text-xs text-gray-500">
                      Mulai: {new Date(startTime).toLocaleString('id-ID')}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      <div className="w-96 bg-white shadow-xl border-l border-gray-200 flex flex-col">
        {/* Cart Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Pembayaran
            </h2>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Customer Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer (Opsional)</label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              disabled={loadingCustomers}
            >
              <option value="">Pilih Customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>{customer.name}</option>
              ))}
            </select>
            {loadingCustomers && <div className="text-xs text-gray-400 mt-1">Memuat data customer...</div>}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {cart.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <Receipt className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Belum ada item</p>
              <p className="text-sm">Pilih produk atau rental untuk memulai</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className={`rounded-lg p-4 ${
                  item.type === 'rental' ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {item.type === 'rental' ? (
                        <Gamepad2 className="h-4 w-4 text-blue-600" />
                      ) : (
                        <ShoppingCart className="h-4 w-4 text-gray-600" />
                      )}
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {item.description && (
                    <p className="text-xs text-gray-600 mb-2">{item.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    {item.type === 'product' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-blue-600 font-medium">Rental Payment</span>
                    )}
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        Rp {item.price.toLocaleString('id-ID')} {item.type === 'product' && `x ${item.quantity}`}
                      </p>
                      <p className="font-semibold text-gray-900">
                        Rp {item.total.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Summary & Payment */}
        {cart.length > 0 && (
          <div className="border-t border-gray-200 p-6">
            {/* Summary */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Produk ({cart.filter(i => i.type === 'product').length}):</span>
                <span>Rp {cart.filter(i => i.type === 'product').reduce((sum, i) => sum + i.total, 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Rental ({cart.filter(i => i.type === 'rental').length}):</span>
                <span>Rp {cart.filter(i => i.type === 'rental').reduce((sum, i) => sum + i.total, 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pajak:</span>
                <span className="font-medium">Rp {tax.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-3">
                <span>Total:</span>
                <span>Rp {total.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {!showPayment ? (
              <button
                onClick={() => setShowPayment(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Calculator className="h-5 w-5" />
                Proses Pembayaran
              </button>
            ) : (
              <div className="space-y-4">
                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Metode Pembayaran</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'cash', label: 'Cash', icon: DollarSign },
                      { value: 'card', label: 'Card', icon: CreditCard },
                      { value: 'transfer', label: 'Transfer', icon: CreditCard }
                    ].map((method) => {
                      const Icon = method.icon;
                      return (
                        <button
                          key={method.value}
                          onClick={() => setPaymentMethod(method.value as any)}
                          className={`p-2 rounded-lg border text-sm font-medium transition-colors flex flex-col items-center gap-1 ${
                            paymentMethod === method.value
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {method.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Payment Amount */}
                {paymentMethod === 'cash' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Jumlah Bayar</label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={toggleManualInput}
                          className={`text-xs px-2 py-1 rounded font-medium transition-colors flex items-center gap-1 ${
                            isManualInput 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <Edit3 className="h-3 w-3" />
                          {isManualInput ? 'Manual' : 'Quick'}
                        </button>
                        <button
                          onClick={clearPaymentAmount}
                          className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                        >
                          <X className="h-3 w-3" />
                          Clear
                        </button>
                      </div>
                    </div>
                    
                    {/* Payment Amount Display */}
                    <div className="mb-3 p-3 bg-gray-100 rounded-lg text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        Rp {actualPaymentAmount.toLocaleString('id-ID')}
                      </div>
                      {actualPaymentAmount > 0 && (
                        <div className="text-sm mt-1">
                          <span className={`font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            Kembalian: Rp {change.toLocaleString('id-ID')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Manual Input or Quick Buttons */}
                    {isManualInput ? (
                      <div className="mb-3">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                          <p className="text-xs text-yellow-800 font-medium">
                            📝 Mode Input Manual
                          </p>
                          <p className="text-xs text-yellow-700 mt-1">
                            Masukkan jumlah pembayaran secara manual. Sistem akan menerima input nominal yang Anda masukkan, terlepas dari total tagihan yang terkalkulasi otomatis. Pastikan jumlah yang Anda masukkan sudah benar sebelum melanjutkan ke proses pembayaran.
                          </p>
                        </div>
                        <input
                          type="number"
                          value={manualAmount}
                          onChange={(e) => setManualAmount(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono"
                          placeholder="0"
                          min="0"
                        />
                        <p className="text-xs text-gray-500 mt-1 text-center">
                          Masukkan nominal pembayaran (dalam Rupiah)
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Money Denomination Buttons */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {denominations.map((denom) => (
                            <button
                              key={denom.value}
                              onClick={() => addDenomination(denom.value)}
                              className="p-3 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg font-medium transition-colors text-sm"
                            >
                              {denom.label}
                            </button>
                          ))}
                        </div>

                        {/* Exact Amount Button */}
                        <button
                          onClick={setExactAmount}
                          className="w-full p-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg font-medium transition-colors text-sm mb-3"
                        >
                          LUNAS (Rp {total.toLocaleString('id-ID')})
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPayment(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg font-medium transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleCheckout}
                    disabled={paymentMethod === 'cash' && change < 0}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Receipt className="h-4 w-4" />
                    Bayar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment Success Modal */}
      {showPaymentModal && lastTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Pembayaran Berhasil!</h2>
                    <p className="text-gray-600">Receipt: {lastTransaction.id}</p>
                  </div>
                </div>
                <button
                  onClick={closePaymentModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Transaction Summary */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-900 mb-2">
                    Rp {lastTransaction.total.toLocaleString('id-ID')}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-green-700">Metode Pembayaran:</span>
                      <div className="font-medium text-green-900 capitalize">
                        {lastTransaction.paymentMethod}
                      </div>
                    </div>
                    <div>
                      <span className="text-green-700">Waktu Transaksi:</span>
                      <div className="font-medium text-green-900">
                        {lastTransaction.timestamp}
                      </div>
                    </div>
                    <div>
                      <span className="text-green-700">Jumlah Bayar:</span>
                      <div className="font-medium text-green-900">
                        Rp {lastTransaction.paymentAmount.toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div>
                      <span className="text-green-700">Kembalian:</span>
                      <div className="font-medium text-green-900">
                        Rp {lastTransaction.change.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              {lastTransaction.customer && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">Informasi Customer</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Nama:</span>
                      <div className="font-medium">{lastTransaction.customer.name}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Telepon:</span>
                      <div className="font-medium">{lastTransaction.customer.phone}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Items Detail */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Detail Pembelian</h3>
                <div className="space-y-3">
                  {lastTransaction.items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {item.type === 'rental' ? (
                            <Gamepad2 className="h-4 w-4 text-blue-600" />
                          ) : (
                            <ShoppingCart className="h-4 w-4 text-gray-600" />
                          )}
                          <span className="font-medium">{item.name}</span>
                          {item.type === 'product' && (
                            <span className="text-gray-600">x {item.quantity}</span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-gray-600 ml-6">{item.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium">Rp {item.total.toLocaleString('id-ID')}</div>
                        {item.type === 'product' && (
                          <div className="text-xs text-gray-600">
                            @Rp {item.price.toLocaleString('id-ID')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Rincian Pembayaran</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>Rp {lastTransaction.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  {lastTransaction.tax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pajak:</span>
                      <span>Rp {lastTransaction.tax.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium border-t border-gray-200 pt-2">
                    <span>Total:</span>
                    <span>Rp {lastTransaction.total.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bayar ({lastTransaction.paymentMethod}):</span>
                    <span>Rp {lastTransaction.paymentAmount.toLocaleString('id-ID')}</span>
                  </div>
                  {lastTransaction.change > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Kembalian:</span>
                      <span className="font-medium">Rp {lastTransaction.change.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handlePrintReceipt}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Printer className="h-5 w-5" />
                    Cetak Nota
                  </button>
                  
                  <button
                    onClick={() => setShowWhatsAppModal(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Kirim via WhatsApp
                  </button>
                </div>
                
                <button
                  onClick={closePaymentModal}
                  className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  Tutup & Lanjutkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Send Modal */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                  Kirim Nota via WhatsApp
                </h2>
                <button
                  onClick={() => setShowWhatsAppModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor WhatsApp Customer
                </label>
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+62 8xx-xxxx-xxxx"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: +62xxx, 62xxx, atau 0xxx
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-green-800">
                  Nota akan dikirim dalam format pesan WhatsApp yang berisi detail lengkap transaksi.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowWhatsAppModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSendWhatsApp}
                  disabled={!whatsappNumber}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Kirim
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cashier;