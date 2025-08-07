import React, { useState, useEffect } from 'react';
import { Clock, User, Gamepad2, DollarSign, Plus, Minus, X, ShoppingCart, Calculator, Receipt, AlertCircle, CheckCircle, Package, Search, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { mockCustomers, mockConsoles, mockProducts, mockRateProfiles } from '../data/mockData';
import { RentalSession, Customer, Console, Product } from '../types';
import { deleteSaleItem } from '../lib/deleteSaleItem';
import Swal from 'sweetalert2';

const ActiveRentals: React.FC = () => {
  const [rentals, setRentals] = useState<RentalSession[]>([]);
  const [selectedRental, setSelectedRental] = useState<RentalSession | null>(null);
  const [showAddItemModal, setShowAddItemModal] = useState<string | null>(null);
  const [searchProduct, setSearchProduct] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');


  // Fetch active rentals from database
  const fetchActiveRentals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rental_sessions')
        .select(`
          *,
          customers(name, phone),
          consoles(name, location)
        `)
        .eq('status', 'active')
        .order('start_time', { ascending: false });

      if (error) throw error;

      // Transform data to match RentalSession interface
      const transformedRentals: RentalSession[] = (data || []).map((rental: any) => ({
        id: rental.id,
        customerId: rental.customer_id,
        consoleId: rental.console_id,
        startTime: rental.start_time,
        endTime: rental.end_time,
        duration: rental.duration_minutes || 0,
        rateType: rental.rate_type || 'hourly',
        baseAmount: Number(rental.base_amount) || 0,
        peakHourAmount: Number(rental.peak_hour_amount) || 0,
        weekendAmount: Number(rental.weekend_amount) || 0,
        lateFee: Number(rental.late_fee) || 0,
        totalAmount: Number(rental.total_amount) || 0,
        paidAmount: Number(rental.paid_amount) || 0,
        status: rental.status,
        paymentStatus: rental.payment_status,
        appliedRateProfile: rental.applied_rate_profile || {},
        isVoucherUsed: rental.is_voucher_used || false,
        voucherId: rental.voucher_id,
        voucherCode: rental.voucher_code,
        voucherHoursUsed: Number(rental.voucher_hours_used) || 0,
        voucherRemainingBefore: Number(rental.voucher_remaining_before) || 0,
        voucherRemainingAfter: Number(rental.voucher_remaining_after) || 0,
        // Add customer and console data
        customer: rental.customers,
        console: rental.consoles
      }));

      setRentals(transformedRentals);
    } catch (error: any) {
      console.error('Error fetching rentals:', error);
      Swal.fire('Error', 'Gagal mengambil data rental: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveRentals();
  }, []);

  const filteredRentals = rentals.filter(rental => {
    const customer = rental.customer || mockCustomers.find(c => c.id === rental.customerId);
    const console = rental.console || mockConsoles.find(c => c.id === rental.consoleId);
    
    const matchesSearch = customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer?.phone.includes(searchTerm) ||
                         console?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rental.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || rental.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getCurrentDuration = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const hours = diffMs / (1000 * 60 * 60);
    return Math.max(0, hours);
  };

  const calculateCurrentAmount = (rental: RentalSession) => {
    const currentHours = getCurrentDuration(rental.startTime);
    const rateProfile = rental.appliedRateProfile;
    
    if (!rateProfile || !rateProfile.hourlyRate) {
      return rental.baseAmount || 0;
    }
    
    return Math.ceil(currentHours) * rateProfile.hourlyRate;
  };

  // Handler untuk mengakhiri rental - tetap menggunakan cara lama
  const handleEndRental = async (rental: RentalSession) => {
    const customer = rental.customer || mockCustomers.find(c => c.id === rental.customerId);
    const console = rental.console || mockConsoles.find(c => c.id === rental.consoleId);
    const currentHours = getCurrentDuration(rental.startTime);
    const currentAmount = calculateCurrentAmount(rental);
    
    const result = await Swal.fire({
      title: 'Akhiri Rental?',
      html: `
        <div class="text-left">
          <p><strong>Customer:</strong> ${customer?.name}</p>
          <p><strong>Console:</strong> ${console?.name}</p>
          <p><strong>Durasi:</strong> ${currentHours.toFixed(1)} jam</p>
          <p><strong>Total:</strong> Rp ${currentAmount.toLocaleString('id-ID')}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, akhiri',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    try {
      const endTime = new Date().toISOString();
      const plannedDuration = rental.duration / 60;
      const lateFee = currentHours > plannedDuration ? (currentHours - plannedDuration) * 5000 : 0;
      const finalAmount = currentAmount + lateFee;

      // Update rental session
      const { error: rentalError } = await supabase
        .from('rental_sessions')
        .update({
          end_time: endTime,
          duration_minutes: Math.ceil(currentHours * 60),
          total_amount: finalAmount,
          paid_amount: finalAmount,
          late_fee: lateFee,
          status: 'completed',
          payment_status: 'paid'
        })
        .eq('id', rental.id);

      if (rentalError) throw rentalError;

      // Update console status to available
      await supabase
        .from('consoles')
        .update({ status: 'available' })
        .eq('id', rental.consoleId);

      // Create payment record
      const paymentRecord = {
        customer_id: rental.customerId,
        customer_name: customer?.name || 'Unknown',
        amount: finalAmount,
        payment_method: 'cash',
        reference_id: rental.id,
        reference_type: 'rental',
        status: 'completed'
      };

      await supabase
        .from('payments')
        .insert(paymentRecord);

      // Refresh rentals list
      await fetchActiveRentals();
      
      Swal.fire({
        icon: 'success',
        title: 'Rental Selesai!',
        text: 'Rental berhasil diselesaikan',
        timer: 2000,
        timerProgressBar: true
      });

    } catch (error: any) {
      console.error('Rental completion error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyelesaikan Rental',
        text: error.message
      });
    }
  };

  const handleAddItem = async (rentalId: string, product: Product, quantity: number = 1) => {
    try {
      const total = product.price * quantity;
      
      // Check if item already exists
      const { data: existingItems, error: fetchError } = await supabase
        .from('rental_session_products')
        .select('*')
        .eq('session_id', rentalId)
        .eq('product_id', product.id);

      if (fetchError) throw fetchError;

      if (existingItems && existingItems.length > 0) {
        // Update existing item
        const existingItem = existingItems[0];
        const newQuantity = existingItem.quantity + quantity;
        const newTotal = newQuantity * product.price;

        const { error: updateError } = await supabase
          .from('rental_session_products')
          .update({
            quantity: newQuantity,
            total: newTotal
          })
          .eq('id', existingItem.id);

        if (updateError) throw updateError;
      } else {
        // Add new item
        const { error: insertError } = await supabase
          .from('rental_session_products')
          .insert({
            session_id: rentalId,
            product_id: product.id,
            product_name: product.name,
            price: product.price,
            quantity,
            total,
            status: 'pending'
          });

        if (insertError) throw insertError;
      }

      // Update product stock
      const { data: productData } = await supabase
        .from('products')
        .select('stock')
        .eq('id', product.id)
        .single();

      if (productData) {
        await supabase
          .from('products')
          .update({ stock: productData.stock - quantity })
          .eq('id', product.id);
      }

      Swal.fire('Success', `${product.name} berhasil ditambahkan ke rental`, 'success');
      setShowAddItemModal(null);
      setSearchProduct('');
      
    } catch (error: any) {
      console.error('Error adding item:', error);
      Swal.fire('Error', 'Gagal menambahkan item: ' + error.message, 'error');
    }
  };

  const handleRemoveItem = async (rentalId: string, productId: string) => {
    try {
      const result = await Swal.fire({
        title: 'Hapus Item?',
        text: 'Apakah Anda yakin ingin menghapus item ini dari rental?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, hapus',
        cancelButtonText: 'Batal'
      });

      if (!result.isConfirmed) return;

      await deleteSaleItem(productId, rentalId);
      Swal.fire('Success', 'Item berhasil dihapus dari rental', 'success');
      
    } catch (error: any) {
      console.error('Error removing item:', error);
      Swal.fire('Error', 'Gagal menghapus item: ' + error.message, 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchProduct.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory && product.isActive && product.stock > 0;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Active Rentals</h1>
            <p className="text-gray-600">Kelola rental yang sedang berlangsung</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {filteredRentals.length} rental aktif
            </span>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Cari customer, console, atau rental ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="overdue">Terlambat</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Memuat data rental...</p>
        </div>
      ) : filteredRentals.length === 0 ? (
        <div className="text-center py-12">
          <Gamepad2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Tidak Ada Rental Aktif</h3>
          <p className="text-gray-600">Belum ada rental yang sedang berlangsung saat ini</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredRentals.map((rental) => {
            const customer = rental.customer || mockCustomers.find(c => c.id === rental.customerId);
            const console = rental.console || mockConsoles.find(c => c.id === rental.consoleId);
            const currentHours = getCurrentDuration(rental.startTime);
            const currentAmount = calculateCurrentAmount(rental);
            const isOverdue = currentHours > (rental.duration / 60);

            return (
              <div key={rental.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className={`p-6 ${isOverdue ? 'bg-red-50 border-b border-red-200' : 'bg-blue-50 border-b border-blue-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isOverdue ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        <Gamepad2 className={`h-6 w-6 ${isOverdue ? 'text-red-600' : 'text-blue-600'}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">#{rental.id}</h3>
                        <p className="text-gray-600">{customer?.name} - {console?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(rental.status)}`}>
                          <CheckCircle className="h-4 w-4" />
                          {rental.status.toUpperCase()}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(rental.paymentStatus)}`}>
                          <DollarSign className="h-4 w-4" />
                          {rental.paymentStatus.toUpperCase()}
                        </span>
                      </div>
                      {isOverdue && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          <AlertCircle className="h-4 w-4" />
                          TERLAMBAT
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Mulai</p>
                        <p className="font-medium text-gray-900">
                          {new Date(rental.startTime).toLocaleTimeString('id-ID', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Durasi Saat Ini</p>
                        <p className="font-medium text-gray-900">
                          {currentHours.toFixed(1)} jam
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Biaya Saat Ini</p>
                        <p className="font-medium text-gray-900">
                          Rp {currentAmount.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Receipt className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Sudah Dibayar</p>
                        <p className="font-medium text-gray-900">
                          Rp {rental.paidAmount.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Items Section */}
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Item Tambahan
                      </h4>
                      <button
                        onClick={() => setShowAddItemModal(rental.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Tambah Item
                      </button>
                    </div>

                    <AdditionalItemsList 
                      rentalId={rental.id} 
                      onRemoveItem={handleRemoveItem}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => handleEndRental(rental)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <Receipt className="h-5 w-5" />
                      Akhiri dan Bayar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Tambah Item ke Rental</h2>
              
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleAddItem(showAddItemModal!, product)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
                  >
                    <div className="space-y-2">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-blue-600 font-semibold">Rp {product.price.toLocaleString('id-ID')}</p>
                      <p className="text-xs text-gray-500">Stok: {product.stock}</p>
                    </div>
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setShowAddItemModal(null)}
                className="w-full mt-6 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Module - hanya untuk prepaid */}
      <PrepaidPaymentModule
        isOpen={showPrepaidPayment}
        onClose={() => setShowPrepaidPayment(false)}
        onConfirm={handleStartPrepaidRental}
        totalAmount={calculateRentalAmount()}
        customerName={selectedCustomer?.name || ''}
        consoleName={selectedConsole?.name || ''}
        duration={selectedDuration}
        rateDetails={selectedRateProfile ? {
          baseRate: selectedRateProfile.hourlyRate,
          peakHourRate: selectedRateProfile.peakHourRate,
          weekendMultiplier: selectedRateProfile.weekendMultiplier
        } : undefined}
      />
    </div>
  );
};

// Component to display additional items for a rental
const AdditionalItemsList: React.FC<{ 
  rentalId: string; 
  onRemoveItem: (rentalId: string, productId: string) => void;
}> = ({ rentalId, onRemoveItem }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const { data, error } = await supabase
          .from('rental_session_products')
          .select('*')
          .eq('session_id', rentalId);

        if (error) throw error;
        setItems(data || []);
      } catch (error) {
        console.error('Error fetching items:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [rentalId]);

  if (loading) {
    return <div className="text-center text-gray-500">Memuat item...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
        <p>Belum ada item tambahan</p>
      </div>
    );
  }

  const totalItems = items.reduce((sum, item) => sum + Number(item.total), 0);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Package className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{item.product_name}</p>
              <p className="text-sm text-gray-600">
                {item.quantity} x Rp {Number(item.price).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-gray-900">
              Rp {Number(item.total).toLocaleString('id-ID')}
            </span>
            <button
              onClick={() => onRemoveItem(rentalId, item.product_id)}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
      
      {items.length > 0 && (
        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
          <span className="font-semibold text-gray-900">Total Item:</span>
          <span className="font-bold text-green-600">
            Rp {totalItems.toLocaleString('id-ID')}
          </span>
        </div>
      )}
    </div>
  );
};

export default ActiveRentals;