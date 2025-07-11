import React, { useState, useEffect } from 'react';
import { Clock, DollarSign, User, Gamepad2, Play, Square, Calculator, Plus, CreditCard, Phone, Search, Grid3X3, List, LayoutGrid, ShoppingCart, Minus, X, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ActiveRentals: React.FC = () => {
  const [selectedRental, setSelectedRental] = useState<string | null>(null);
  const [showEndSessionModal, setShowEndSessionModal] = useState<string | null>(null);
  const [showNewRentalModal, setShowNewRentalModal] = useState<string | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [newRental, setNewRental] = useState({
    customerId: '',
    consoleId: '',
    rateType: 'hourly' as 'hourly' | 'daily' | 'weekly'
  });

  // Cart state for each console
  const [consoleCarts, setConsoleCarts] = useState<Record<string, Array<{
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    total: number;
  }>>>({});

  // Product search for modal
  const [productSearch, setProductSearch] = useState('');

  // State to hold data from Supabase
  const [rentalSessions, setRentalSessions] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [consoles, setConsoles] = useState<any[]>([]);
  const [rateProfiles, setRateProfiles] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Update current time every second for real-time duration
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      const [rentalRes, customerRes, consoleRes, rateRes, productRes] = await Promise.all([
        supabase.from('rental_sessions').select('*'),
        supabase.from('customers').select('*'),
        supabase.from('consoles').select('*'),
        supabase.from('rate_profiles').select('*'),
        supabase.from('products').select('*'),
      ]);
      if (!rentalRes.error) setRentalSessions(rentalRes.data || []);
      if (!customerRes.error) setCustomers(customerRes.data || []);
      if (!consoleRes.error) setConsoles(consoleRes.data || []);
      if (!rateRes.error) {
        setRateProfiles((rateRes.data || []).map((p: any) => ({
          ...p,
          hourlyRate: Number(p.hourly_rate) || 0,
          peakHourRate: p.peak_hour_rate !== undefined && p.peak_hour_rate !== null ? Number(p.peak_hour_rate) : undefined,
          peakHourStart: p.peak_hour_start || '',
          peakHourEnd: p.peak_hour_end || '',
        })));
      }
      if (!productRes.error) setProducts(productRes.data || []);
    };
    fetchData();
  }, []);

  const activeRentals = rentalSessions.filter(session => session.status === 'active');

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.phone.includes(customerSearch)
  );

  // Filter products for modal
  const filteredProducts = products.filter(product =>
    product.isActive && (
      product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (product.barcode && product.barcode.includes(productSearch))
    )
  );

  const calculateCurrentCost = (session: any) => {
    const startTime = new Date(session.startTime);
    const minutesElapsed = Math.floor((currentTime.getTime() - startTime.getTime()) / (1000 * 60));
    const hoursElapsed = Math.ceil(minutesElapsed / 60);

    const console = consoles.find(c => c.id === session.consoleId);
    const rateProfile = rateProfiles.find(profile => profile.id === console?.rateProfileId);
    const hourlyRate = rateProfile?.hourlyRate || 0;

    return hoursElapsed * hourlyRate;
  };

  const formatDuration = (startTime: string) => {
    const start = new Date(startTime);
    const diffMs = currentTime.getTime() - start.getTime();
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    return { hours, minutes, seconds, totalMinutes };
  };

  const formatDurationDisplay = (startTime: string) => {
    const { hours, minutes, seconds } = formatDuration(startTime);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Cart functions
  const addProductToCart = (consoleId: string, product: any) => {
    setConsoleCarts(prev => {
      const currentCart = prev[consoleId] || [];
      const existingItem = currentCart.find(item => item.productId === product.id);

      if (existingItem) {
        // Update quantity
        const updatedCart = currentCart.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
            : item
        );
        return { ...prev, [consoleId]: updatedCart };
      } else {
        // Add new item
        const newItem = {
          id: `${consoleId}-${product.id}-${Date.now()}`,
          productId: product.id,
          productName: product.name,
          quantity: 1,
          price: product.price,
          total: product.price
        };
        return { ...prev, [consoleId]: [...currentCart, newItem] };
      }
    });
  };

  const updateCartItemQuantity = (consoleId: string, itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeCartItem(consoleId, itemId);
      return;
    }

    setConsoleCarts(prev => {
      const currentCart = prev[consoleId] || [];
      const updatedCart = currentCart.map(item =>
        item.id === itemId
          ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
          : item
      );
      return { ...prev, [consoleId]: updatedCart };
    });
  };

  const removeCartItem = (consoleId: string, itemId: string) => {
    setConsoleCarts(prev => {
      const currentCart = prev[consoleId] || [];
      const updatedCart = currentCart.filter(item => item.id !== itemId);
      return { ...prev, [consoleId]: updatedCart };
    });
  };

  const clearCart = (consoleId: string) => {
    setConsoleCarts(prev => ({ ...prev, [consoleId]: [] }));
  };

  const saveCartItems = (consoleId: string) => {
    const cart = consoleCarts[consoleId] || [];
    if (cart.length === 0) {
      alert('Keranjang kosong, tidak ada yang disimpan');
      return;
    }

    const total = cart.reduce((sum, item) => sum + item.total, 0);
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    alert(`Berhasil menyimpan ${itemCount} item dengan total Rp ${total.toLocaleString('id-ID')} untuk console ${consoleId}`);

    // Clear cart after saving
    clearCart(consoleId);
    setShowProductModal(null);
  };

  const getCartTotal = (consoleId: string) => {
    const cart = consoleCarts[consoleId] || [];
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const getCartItemCount = (consoleId: string) => {
    const cart = consoleCarts[consoleId] || [];
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleEndSession = (sessionId: string) => {
    // Here you would normally process the session end
    alert(`Session ${sessionId} ended successfully!`);
    setShowEndSessionModal(null);
  };

  const handleStartRental = (consoleId: string) => {
    setShowNewRentalModal(consoleId);
    setNewRental({ ...newRental, consoleId });
  };

  const handleCustomerSelection = () => {
    if (!selectedCustomer) {
      alert('Please select a customer');
      return;
    }

    setNewRental({ ...newRental, customerId: selectedCustomer });
    setShowCustomerModal(false);
    setCustomerSearch('');
    setSelectedCustomer('');

    // Process the rental start
    alert(`Starting new rental for console ${newRental.consoleId} with customer ${selectedCustomer}`);
    setShowNewRentalModal(null);
    setNewRental({ customerId: '', consoleId: '', rateType: 'hourly' });
  };

  const handleProcessPayment = (sessionId: string) => {
    // Navigate to cashier with this rental session
    alert(`Redirecting to cashier for payment processing of session ${sessionId}`);
    // In a real app, you would use React Router to navigate:
    // navigate('/cashier', { state: { rentalSessionId: sessionId } });
  };

  const getConsoleStatus = (consoleId: string) => {
    const activeSession = activeRentals.find(session => session.consoleId === consoleId);
    return activeSession ? 'active' : 'available';
  };

  const getActiveSession = (consoleId: string) => {
    return activeRentals.find(session => session.consoleId === consoleId);
  };

  const closeProductModal = () => {
    setShowProductModal(null);
    setProductSearch('');
  };

  const renderCardView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {consoles.map((console) => {
        const consoleStatus = getConsoleStatus(console.id);
        const activeSession = getActiveSession(console.id);
        const customer = activeSession ? customers.find(c => c.id === activeSession.customerId) : null;
        const currentCost = activeSession ? calculateCurrentCost(activeSession) : 0;
        const duration = activeSession ? formatDuration(activeSession.startTime) : null;
        // Perbaiki pengambilan rateProfile agar tidak salah
        const rateProfile = console.rateProfileId
          ? rateProfiles.find(profile => String(profile.id) === String(console.rateProfileId))
          : null;
        const cartItemCount = getCartItemCount(console.id);
        const cartTotal = getCartTotal(console.id);

        return (
          <div key={console.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            {/* Header */}
            <div className={`p-4 text-white ${
              console.status === 'maintenance' ? 'bg-gradient-to-r from-red-600 to-red-700' :
              consoleStatus === 'active' ? 'bg-gradient-to-r from-blue-600 to-blue-700' :
              console.type === 'PS5' ? 'bg-gradient-to-r from-green-600 to-green-700' : 
              'bg-gradient-to-r from-purple-600 to-purple-700'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <Gamepad2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{console.name}</h3>
                    <span className="text-sm opacity-90">{console.type}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                  console.status === 'maintenance' ? 'bg-red-500 text-white' :
                  consoleStatus === 'active' ? 'bg-blue-500 text-white' :
                  'bg-green-500 text-white'
                }`}>
                  {console.status === 'maintenance' ? 'MAINTENANCE' :
                   consoleStatus === 'active' ? 'ACTIVE' : 'AVAILABLE'}
                </span>
                {customer && (
                  <div className="flex items-center gap-1 text-sm opacity-90">
                    <User className="h-4 w-4" />
                    <span>{customer.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="p-4">
              {/* Console is Available */}
              {consoleStatus === 'available' && console.status !== 'maintenance' && (
                <div className="space-y-4">
                  {/* Pricing Info */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Tarif per Jam
                    </h4>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Per Jam</span>
                      <span className="font-semibold text-blue-600">
                        Rp {(rateProfile?.hourly_rate ? Number(rateProfile.hourly_rate) : 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Cart Summary */}
                  {cartItemCount > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-medium text-orange-800">
                            Cart Items ({cartItemCount})
                          </span>
                        </div>
                        <span className="font-semibold text-orange-800">
                          Rp {cartTotal.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <button
                        onClick={() => setShowProductModal(console.id)}
                        className="w-full text-orange-700 hover:text-orange-800 text-sm font-medium"
                      >
                        Lihat & Edit Cart
                      </button>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <button 
                      onClick={() => handleStartRental(console.id)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Play className="h-5 w-5" />
                      Start Rental
                    </button>
                    
                    <button
                      onClick={() => setShowProductModal(console.id)}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Add Products
                    </button>
                  </div>
                </div>
              )}

              {/* Console is Active */}
              {consoleStatus === 'active' && activeSession && (
                <div className="space-y-4">
                  {/* Real-time Duration Display */}
                  <div className="text-center bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Durasi Aktif</span>
                    </div>
                    <div className="text-3xl font-bold text-blue-600 font-mono tracking-wider">
                      {formatDurationDisplay(activeSession.startTime)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {duration?.hours}h {duration?.minutes}m {duration?.seconds}s
                    </div>
                  </div>

                  {/* Current Cost */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calculator className="h-4 w-4" />
                      <span className="text-sm">Current Cost</span>
                    </div>
                    <span className="font-bold text-lg text-blue-600">
                      Rp {currentCost.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Rate */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-sm">Rate</span>
                    </div>
                    <span className="text-sm text-gray-900">
                      Rp {(rateProfile?.hourlyRate || 0).toLocaleString('id-ID')}/hour
                    </span>
                  </div>

                  {/* Payment Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Payment Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      activeSession.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 
                      activeSession.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {activeSession.paymentStatus.toUpperCase()}
                    </span>
                  </div>

                  {/* Cart Summary for Active Session */}
                  {cartItemCount > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-medium text-orange-800">
                            Cart Items ({cartItemCount})
                          </span>
                        </div>
                        <span className="font-semibold text-orange-800">
                          Rp {cartTotal.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <button
                        onClick={() => setShowProductModal(console.id)}
                        className="w-full text-orange-700 hover:text-orange-800 text-sm font-medium"
                      >
                        Lihat & Edit Cart
                      </button>
                    </div>
                  )}

                  {/* Start Time */}
                  <div className="text-center pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Started at</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(activeSession.startTime).toLocaleString('id-ID')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    {/* Payment Button - Prominent if payment pending */}
                    {activeSession.paymentStatus === 'pending' && (
                      <button 
                        onClick={() => handleProcessPayment(activeSession.id)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <CreditCard className="h-4 w-4" />
                        Process Payment
                      </button>
                    )}
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setShowEndSessionModal(activeSession.id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Square className="h-4 w-4" />
                        End Session
                      </button>
                      <button 
                        onClick={() => setSelectedRental(selectedRental === activeSession.id ? null : activeSession.id)}
                        className="px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                      >
                        Details
                      </button>
                    </div>
                    
                    <button
                      onClick={() => setShowProductModal(console.id)}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Add Products
                    </button>
                  </div>

                  {/* Extended Details */}
                  {selectedRental === activeSession.id && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3">Session Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Customer Phone:</span>
                          <span className="font-medium">{customer?.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Console Type:</span>
                          <span className="font-medium">{console.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Session ID:</span>
                          <span className="font-medium">{activeSession.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Base Amount:</span>
                          <span className="font-medium">Rp {activeSession.baseAmount.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Paid Amount:</span>
                          <span className="font-medium">Rp {activeSession.paidAmount.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Outstanding:</span>
                          <span className="font-medium text-red-600">
                            Rp {(currentCost - activeSession.paidAmount).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Minutes:</span>
                          <span className="font-medium">{duration?.totalMinutes} minutes</span>
                        </div>
                      </div>
                      
                      {activeSession.paymentStatus !== 'paid' && (
                        <button 
                          onClick={() => handleProcessPayment(activeSession.id)}
                          className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <CreditCard className="h-4 w-4" />
                          Go to Cashier
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Console is in Maintenance */}
              {console.status === 'maintenance' && (
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Gamepad2 className="h-8 w-8 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Under Maintenance</h3>
                    <p className="text-gray-600 text-sm">This console is currently unavailable</p>
                  </div>
                  
                  <button className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    Mark as Available
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderListView = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Console
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Cost
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cart
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {consoles.map((console) => {
              const consoleStatus = getConsoleStatus(console.id);
              const activeSession = getActiveSession(console.id);
              const customer = activeSession ? customers.find(c => c.id === activeSession.customerId) : null;
              const currentCost = activeSession ? calculateCurrentCost(activeSession) : 0;
              const duration = activeSession ? formatDuration(activeSession.startTime) : null;
              const rateProfile = rateProfiles.find(profile => profile.id === console.rateProfileId);
              const cartItemCount = getCartItemCount(console.id);
              const cartTotal = getCartTotal(console.id);
              
              return (
                <tr key={console.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                        console.status === 'maintenance' ? 'bg-red-100' :
                        consoleStatus === 'active' ? 'bg-blue-100' :
                        'bg-green-100'
                      }`}>
                        <Gamepad2 className={`h-5 w-5 ${
                          console.status === 'maintenance' ? 'text-red-600' :
                          consoleStatus === 'active' ? 'text-blue-600' :
                          'text-green-600'
                        }`} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{console.name}</div>
                        <div className="text-sm text-gray-500">{console.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      console.status === 'maintenance' ? 'bg-red-100 text-red-800' :
                      consoleStatus === 'active' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {console.status === 'maintenance' ? 'MAINTENANCE' :
                       consoleStatus === 'active' ? 'ACTIVE' : 'AVAILABLE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {customer ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                        <div className="text-sm text-gray-500">{customer.phone}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {activeSession && duration ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900 font-mono">
                          {formatDurationDisplay(activeSession.startTime)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {duration.hours}h {duration.minutes}m {duration.seconds}s
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {activeSession ? (
                      <div className="text-sm font-medium text-gray-900">
                        Rp {currentCost.toLocaleString('id-ID')}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        Rp {(rateProfile?.hourlyRate || 0).toLocaleString('id-ID')}/hour
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {activeSession ? (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        activeSession.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 
                        activeSession.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {activeSession.paymentStatus.toUpperCase()}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {cartItemCount > 0 ? (
                      <div className="text-sm">
                        <div className="font-medium text-orange-600">{cartItemCount} items</div>
                        <div className="text-gray-500">Rp {cartTotal.toLocaleString('id-ID')}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Empty</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {/* Available Console Actions */}
                      {consoleStatus === 'available' && console.status !== 'maintenance' && (
                        <>
                          <button
                            onClick={() => handleStartRental(console.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                          >
                            Start Rental
                          </button>
                          <button
                            onClick={() => setShowProductModal(console.id)}
                            className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                          >
                            Add Products
                          </button>
                        </>
                      )}
                      
                      {/* Active Console Actions */}
                      {consoleStatus === 'active' && activeSession && (
                        <>
                          {activeSession.paymentStatus === 'pending' && (
                            <button
                              onClick={() => handleProcessPayment(activeSession.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                            >
                              Payment
                            </button>
                          )}
                          <button
                            onClick={() => setShowEndSessionModal(activeSession.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                          >
                            End
                          </button>
                          <button
                            onClick={() => setShowProductModal(console.id)}
                            className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                          >
                            Products
                          </button>
                          <button
                            onClick={() => setSelectedRental(selectedRental === activeSession.id ? null : activeSession.id)}
                            className="border border-gray-300 hover:border-gray-400 text-gray-700 px-3 py-1 rounded text-xs font-medium transition-colors"
                          >
                            Details
                          </button>
                        </>
                      )}
                      
                      {/* Maintenance Console Actions */}
                      {console.status === 'maintenance' && (
                        <button className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors">
                          Mark Available
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Extended Details for List View */}
      {selectedRental && (
        <div className="border-t border-gray-200 bg-gray-50 p-6">
          {(() => {
            const activeSession = activeRentals.find(s => s.id === selectedRental);
            const customer = activeSession ? customers.find(c => c.id === activeSession.customerId) : null;
            const console = activeSession ? consoles.find(c => c.id === activeSession.consoleId) : null;
            const currentCost = activeSession ? calculateCurrentCost(activeSession) : 0;
            const duration = activeSession ? formatDuration(activeSession.startTime) : null;
            
            if (!activeSession || !customer || !console) return null;
            
            return (
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Session Details - {console.name}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-700">Customer Information</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{customer.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">{customer.phone}</span>
                      </div>
                      {customer.email && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="font-medium">{customer.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-700">Session Information</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Session ID:</span>
                        <span className="font-medium">{activeSession.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Started:</span>
                        <span className="font-medium">{new Date(activeSession.startTime).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">{duration?.totalMinutes} minutes</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-700">Payment Information</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Base Amount:</span>
                        <span className="font-medium">Rp {activeSession.baseAmount.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Cost:</span>
                        <span className="font-medium text-blue-600">Rp {currentCost.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Paid Amount:</span>
                        <span className="font-medium">Rp {activeSession.paidAmount.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Outstanding:</span>
                        <span className="font-medium text-red-600">
                          Rp {(currentCost - activeSession.paidAmount).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {activeSession.paymentStatus !== 'paid' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button 
                      onClick={() => handleProcessPayment(activeSession.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <CreditCard className="h-4 w-4" />
                      Process Payment in Cashier
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Console Management</h1>
              <p className="text-gray-600">Monitor all consoles and manage rental sessions</p>
            </div>
            {/* Real-time clock */}
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-6 py-3 shadow-sm">
              <Clock className="h-7 w-7 text-blue-600" />
              <span className="font-mono text-2xl font-bold text-gray-900 tracking-widest">
                {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* View Toggle */}
            <div className="flex items-center bg-gray-200 rounded-lg p-1">
              <button
                onClick={() => setViewMode('card')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'card'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                Card View
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <List className="h-4 w-4" />
                List View
              </button>
            </div>
            
            {/* Status Indicators */}
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Available ({consoles.filter(c => getConsoleStatus(c.id) === 'available').length})</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Active ({activeRentals.length})</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Maintenance ({consoles.filter(c => c.status === 'maintenance').length})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Render based on view mode */}
      {viewMode === 'card' ? renderCardView() : renderListView()}

      {/* Product Selection Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Add Products - {consoles.find(c => c.id === showProductModal)?.name}
                </h2>
                <p className="text-gray-600">Select products to add to cart</p>
              </div>
              <button
                onClick={closeProductModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Product List */}
              <div className="flex-1 p-6 overflow-y-auto">
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => addProductToCart(showProductModal!, product)}
                      className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
                    >
                      <div className="mb-2">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          product.category === 'beverage' ? 'bg-blue-100 text-blue-800' :
                          product.category === 'food' ? 'bg-orange-100 text-orange-800' :
                          product.category === 'snack' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
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
                          Stock: {product.stock}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cart Sidebar */}
              <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Cart Items
                  </h3>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {showProductModal && consoleCarts[showProductModal]?.length > 0 ? (
                    <div className="space-y-3">
                      {consoleCarts[showProductModal].map((item) => (
                        <div key={item.id} className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900 text-sm">{item.productName}</h4>
                            <button
                              onClick={() => removeCartItem(showProductModal!, item.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateCartItemQuantity(showProductModal!, item.id, item.quantity - 1)}
                                className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                              <button
                                onClick={() => updateCartItemQuantity(showProductModal!, item.id, item.quantity + 1)}
                                className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-xs text-gray-600">
                                Rp {item.price.toLocaleString('id-ID')} x {item.quantity}
                              </p>
                              <p className="font-semibold text-gray-900 text-sm">
                                Rp {item.total.toLocaleString('id-ID')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 mt-8">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No items in cart</p>
                      <p className="text-sm">Click on products to add them</p>
                    </div>
                  )}
                </div>

                {/* Cart Summary & Actions */}
                {showProductModal && consoleCarts[showProductModal]?.length > 0 && (
                  <div className="border-t border-gray-200 p-4">
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Items:</span>
                        <span>{getCartItemCount(showProductModal)}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>Rp {getCartTotal(showProductModal).toLocaleString('id-ID')}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => saveCartItems(showProductModal!)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Save Cart Items
                      </button>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => clearCart(showProductModal!)}
                          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg font-medium transition-colors"
                        >
                          Clear Cart
                        </button>
                        <button
                          onClick={closeProductModal}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Customer</h2>
              
              {/* Search Input */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Customer List */}
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                {filteredCustomers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No customers found
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        onClick={() => setSelectedCustomer(customer.id)}
                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedCustomer === customer.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{customer.name}</h4>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="h-4 w-4" />
                              <span>{customer.phone}</span>
                            </div>
                            {customer.email && (
                              <p className="text-sm text-gray-500">{customer.email}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-green-600">
                              Rp {customer.totalSpent.toLocaleString('id-ID')}
                            </p>
                            <p className="text-xs text-gray-500">Total spent</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Customer Option */}
              <div className="mt-4 p-3 border border-dashed border-gray-300 rounded-lg">
                <button className="w-full text-left text-blue-600 hover:text-blue-700 font-medium">
                  <Plus className="h-4 w-4 inline mr-2" />
                  Add New Customer
                </button>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCustomerModal(false);
                    setShowNewRentalModal(null);
                    setCustomerSearch('');
                    setSelectedCustomer('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCustomerSelection}
                  disabled={!selectedCustomer}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Start Rental
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Rental Modal */}
      {showNewRentalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Start New Rental</h2>
              
              <div className="mb-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="font-medium text-blue-900 mb-2">Selected Console</h3>
                  <p className="text-blue-800">
                    {consoles.find(c => c.id === showNewRentalModal)?.name}
                  </p>
                  <p className="text-sm text-blue-600">
                    Rp {(rateProfiles.find(profile => profile.id === consoles.find(c => c.id === showNewRentalModal)?.rateProfileId)?.hourlyRate || 0).toLocaleString('id-ID')}/hour
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rate Type</label>
                  <select
                    value={newRental.rateType}
                    onChange={(e) => setNewRental({...newRental, rateType: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowNewRentalModal(null);
                    setNewRental({ customerId: '', consoleId: '', rateType: 'hourly' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => setShowCustomerModal(true)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Select Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* End Session Modal */}
      {showEndSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">End Rental Session</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to end this rental session? The final bill will be calculated and any outstanding payment will need to be processed.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEndSessionModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleEndSession(showEndSessionModal)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  End & Process Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveRentals;