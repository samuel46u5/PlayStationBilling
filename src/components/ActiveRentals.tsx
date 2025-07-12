import React, { useState, useEffect } from 'react';
import { Clock, User, Gamepad2, DollarSign, Play, Pause, Square, Plus, ShoppingCart, Minus, X, Calculator, CreditCard } from 'lucide-react';
import { mockRentalSessions, mockCustomers, mockConsoles, mockProducts } from '../data/mockData';
import { db, supabase } from '../lib/supabase';
import Swal from 'sweetalert2';

interface RentalSession {
  id: string;
  customerId: string;
  consoleId: string;
  startTime: string;
  endTime?: string;
  duration: number;
  totalAmount: number;
  status: 'active' | 'completed' | 'overdue';
  paymentStatus: 'pending' | 'partial' | 'paid';
  paidAmount: number;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  isActive: boolean;
}

interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  total: number;
}

const ActiveRentals: React.FC = () => {
  const [sessions, setSessions] = useState<RentalSession[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [showProductModal, setShowProductModal] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load rental sessions
      const { data: rentalData, error: rentalError } = await supabase
        .from('rental_sessions')
        .select(`
          *,
          customers(name, phone),
          consoles(name, location)
        `)
        .eq('status', 'active');

      if (rentalError) throw rentalError;

      // Load products
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .gt('stock', 0);

      if (productError) throw productError;

      setSessions(rentalData || []);
      setProducts(productData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      Swal.fire('Error', 'Gagal memuat data', 'error');
    } finally {
      setLoading(false);
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

  const calculateCurrentCost = (session: RentalSession) => {
    const start = new Date(session.startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const hours = Math.ceil(diffMs / (1000 * 60 * 60));
    // Assuming hourly rate of 15000 for now - this should come from rate profile
    return hours * 15000;
  };

  const handleEndSession = async (sessionId: string) => {
    const result = await Swal.fire({
      title: 'Akhiri Sesi Rental?',
      text: 'Apakah Anda yakin ingin mengakhiri sesi rental ini?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Akhiri',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        const session = sessions.find(s => s.id === sessionId);
        if (!session) return;

        const endTime = new Date().toISOString();
        const totalCost = calculateCurrentCost(session);

        await db.rentals.endSession(sessionId, {
          end_time: endTime,
          total_amount: totalCost,
          status: 'completed'
        });

        // Update console status to available
        await db.consoles.updateStatus(session.consoleId, 'available');

        await loadData();
        Swal.fire('Berhasil', 'Sesi rental berhasil diakhiri', 'success');
      } catch (error) {
        console.error('Error ending session:', error);
        Swal.fire('Error', 'Gagal mengakhiri sesi rental', 'error');
      }
    }
  };

  // Product cart functions
  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        Swal.fire('Stok Tidak Cukup', `Stok ${product.name} hanya tersisa ${product.stock}`, 'warning');
        return;
      }
      
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      const newItem: CartItem = {
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: 1,
        total: product.price
      };
      setCart([...cart, newItem]);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (product && newQuantity > product.stock) {
      Swal.fire('Stok Tidak Cukup', `Stok ${product.name} hanya tersisa ${product.stock}`, 'warning');
      return;
    }

    setCart(cart.map(item =>
      item.productId === productId
        ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const handleCheckoutProducts = async (sessionId: string) => {
    if (cart.length === 0) {
      Swal.fire('Keranjang Kosong', 'Silakan pilih produk terlebih dahulu', 'warning');
      return;
    }

    try {
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return;

      const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
      const total = subtotal;

      // Create sale record
      const saleData = {
        customer_id: session.customerId,
        subtotal: subtotal,
        tax: 0,
        discount: 0,
        total: total,
        payment_method: 'cash', // Default to cash, can be changed
        payment_amount: total,
        change_amount: 0
      };

      const { sale } = await db.sales.create(saleData, cart.map(item => ({
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      })));

      clearCart();
      setShowProductModal(null);
      await loadData();

      Swal.fire('Berhasil', `Penjualan produk berhasil dicatat. Total: Rp ${total.toLocaleString('id-ID')}`, 'success');
    } catch (error) {
      console.error('Error processing sale:', error);
      Swal.fire('Error', 'Gagal memproses penjualan produk', 'error');
    }
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchProduct.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory && product.stock > 0;
  });

  const categories = [...new Set(products.map(p => p.category))];
  const cartTotal = cart.reduce((sum, item) => sum + item.total, 0);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'beverage': return 'bg-blue-100 text-blue-800';
      case 'food': return 'bg-orange-100 text-orange-800';
      case 'snack': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Rental Aktif</h1>
        <p className="text-gray-600">Kelola sesi rental yang sedang berlangsung</p>
      </div>

      {/* Active Sessions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.map((session) => {
          const customer = mockCustomers.find(c => c.id === session.customerId);
          const console = mockConsoles.find(c => c.id === session.consoleId);
          const currentCost = calculateCurrentCost(session);
          
          return (
            <div key={session.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 p-4 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <Gamepad2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{console?.name}</h3>
                      <span className="text-sm opacity-90">{console?.location}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    AKTIF
                  </span>
                  <span className="text-sm opacity-90">
                    {formatDuration(session.startTime)}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-4">
                <div className="space-y-4">
                  {/* Customer Info */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Customer</span>
                    </div>
                    <p className="font-medium text-gray-900">{customer?.name}</p>
                    <p className="text-sm text-gray-600">{customer?.phone}</p>
                  </div>

                  {/* Session Details */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Mulai:</span>
                      <span className="font-medium">
                        {new Date(session.startTime).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Durasi:</span>
                      <span className="font-medium">{formatDuration(session.startTime)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Biaya Saat Ini:</span>
                      <span className="font-bold text-green-600">
                        Rp {currentCost.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status Bayar:</span>
                      <span className={`font-medium ${
                        session.paymentStatus === 'paid' ? 'text-green-600' :
                        session.paymentStatus === 'partial' ? 'text-orange-600' :
                        'text-red-600'
                      }`}>
                        {session.paymentStatus.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => setShowProductModal(session.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Produk
                      </button>
                      <button 
                        onClick={() => handleEndSession(session.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Square className="h-4 w-4" />
                        Akhiri
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* No Active Sessions */}
      {sessions.length === 0 && (
        <div className="text-center py-12">
          <Gamepad2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Rental Aktif</h3>
          <p className="text-gray-600">Semua konsol sedang tidak digunakan</p>
        </div>
      )}

      {/* Product Selection Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden flex">
            {/* Product List */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Pilih Produk</h2>
                <button
                  onClick={() => {
                    setShowProductModal(null);
                    clearCart();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Search and Filter */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Cari produk..."
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Semua Kategori</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="mb-3">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(product.category)}`}>
                        {product.category}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                    
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

              {filteredProducts.length === 0 && (
                <div className="text-center py-8">
                  <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Tidak ada produk ditemukan</p>
                </div>
              )}
            </div>

            {/* Cart Sidebar */}
            <div className="w-96 bg-gray-50 border-l border-gray-200 flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Keranjang ({cart.length})
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {cart.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Keranjang kosong</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.productId} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{item.productName}</h4>
                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-sm text-gray-600">
                              Rp {item.price.toLocaleString('id-ID')} x {item.quantity}
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

              {cart.length > 0 && (
                <div className="border-t border-gray-200 p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>Rp {cartTotal.toLocaleString('id-ID')}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <button
                        onClick={() => handleCheckoutProducts(showProductModal)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Calculator className="h-5 w-5" />
                        Checkout
                      </button>
                      <button
                        onClick={clearCart}
                        className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg font-medium transition-colors"
                      >
                        Clear Cart
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Gamepad2 className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{sessions.length}</h3>
          <p className="text-gray-600 text-sm">Sesi Aktif</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <DollarSign className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            Rp {sessions.reduce((sum, session) => sum + calculateCurrentCost(session), 0).toLocaleString('id-ID')}
          </h3>
          <p className="text-gray-600 text-sm">Total Revenue Saat Ini</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Clock className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {sessions.length > 0 ? Math.round(sessions.reduce((sum, session) => {
              const start = new Date(session.startTime);
              const now = new Date();
              return sum + (now.getTime() - start.getTime()) / (1000 * 60 * 60);
            }, 0) / sessions.length) : 0}h
          </h3>
          <p className="text-gray-600 text-sm">Rata-rata Durasi</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <User className="h-6 w-6 text-orange-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {new Set(sessions.map(s => s.customerId)).size}
          </h3>
          <p className="text-gray-600 text-sm">Customer Aktif</p>
        </div>
      </div>
    </div>
  );
};

export default ActiveRentals;