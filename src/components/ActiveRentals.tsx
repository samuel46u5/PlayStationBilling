import { deleteSaleItem } from '../lib/deleteSaleItem';
import React, { useState, useEffect } from 'react';

interface SaleItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  total?: number;
}

interface RentalSession {
  // ...existing properties...
  sale_items?: SaleItem[];
}
import { Clock, User, Gamepad2, DollarSign, Play, Pause, Square, Plus, ShoppingCart, Minus, X, Calculator, CreditCard, UserPlus, Users, MapPin, Wrench } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Swal from 'sweetalert2';

interface Console {
  id: string;
  name: string;
  equipment_type_id: string;
  rate_profile_id: string | null;
  status: 'available' | 'rented' | 'maintenance';
  location?: string;
  serial_number?: string;
  is_active: boolean;
}

interface RateProfile {
  id: string;
  name: string;
  hourly_rate: number;
}

interface RentalSession {
  id: string;
  customer_id: string;
  console_id: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  total_amount: number;
  status: 'active' | 'completed' | 'overdue';
  payment_status: 'pending' | 'partial' | 'paid';
  paid_amount: number;
  customers?: {
    name: string;
    phone: string;
  };
  consoles?: {
    name: string;
    location: string;
  };
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  is_active: boolean;
}

interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  total: number;
}

const ActiveRentals: React.FC = () => {
  const [consoles, setConsoles] = useState<Console[]>([]);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [consoleFilter, setConsoleFilter] = useState<'all' | 'available' | 'rented' | 'maintenance'>('all');
  const [searchConsole, setSearchConsole] = useState('');
  const [rateProfiles, setRateProfiles] = useState<RateProfile[]>([]);
  const [activeSessions, setActiveSessions] = useState<RentalSession[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [showProductModal, setShowProductModal] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  // Fetch cart items from rental_session_products when product modal is opened
  useEffect(() => {
    // Ambil produk billing (pending payment) dan produk keranjang terpisah
    const fetchProductData = async () => {
      if (!showProductModal) return;
      // Produk billing (pending payment)
      const { data: billingData, error: billingError } = await supabase
        .from('rental_session_products')
        .select('*')
        .eq('session_id', showProductModal)
        .eq('status', 'pending');
      if (!billingError && Array.isArray(billingData)) {
        setBillingProducts(billingData);
      } else {
        setBillingProducts([]);
      }
      // Produk keranjang tetap dari state cart
    };
    fetchProductData();
  }, [showProductModal]);
  // Produk billing (pending payment)
  const [billingProducts, setBillingProducts] = useState<any[]>([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showStartRentalModal, setShowStartRentalModal] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerType, setCustomerType] = useState<'member' | 'non-member'>('member');
  const [rentalType, setRentalType] = useState<'pay-as-you-go' | 'prepaid'>('pay-as-you-go');
  const [rentalDurationHours, setRentalDurationHours] = useState<number>(1);
  const [rentalDurationMinutes, setRentalDurationMinutes] = useState<number>(0);
  const [nonMemberName, setNonMemberName] = useState<string>('');
  const [nonMemberPhone, setNonMemberPhone] = useState<string>('');
  const [countdownTimers, setCountdownTimers] = useState<Record<string, number>>({});
  // Toggle view mode: 'simple' | 'detail'
  const [viewMode, setViewMode] = useState<'simple' | 'detail' | 'list'>('simple');
  // Tambahan: countdown detik
  const [countdownSeconds, setCountdownSeconds] = useState<Record<string, number>>({});
  const [elapsedTimers, setElapsedTimers] = useState<Record<string, number>>({});
  const [countdownIntervals, setCountdownIntervals] = useState<Record<string, NodeJS.Timeout>>({});
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historySessions, setHistorySessions] = useState<RentalSession[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyStartDate, setHistoryStartDate] = useState<string>('');
  const [historyEndDate, setHistoryEndDate] = useState<string>('');
  // Pagination states for history
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState<null | { session: RentalSession, productsTotal: number }>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris'>('cash');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [changeAmount, setChangeAmount] = useState<number>(0);

  // Load history sessions
  const loadHistorySessions = async (startDate?: string, endDate?: string) => {
    setLoadingHistory(true);
    try {
      // Get total count for pagination
      let countQuery = supabase
        .from('rental_sessions')
        .select('id', { count: 'exact', head: true })
        .in('status', ['completed', 'overdue']);
      if (startDate) {
        countQuery = countQuery.gte('end_time', startDate + 'T00:00:00');
      }
      if (endDate) {
        countQuery = countQuery.lte('end_time', endDate + 'T23:59:59');
      }
      const { count, error: countError } = await countQuery;
      if (countError) throw countError;
      setTotalItems(count || 0);
      setTotalPages(Math.max(1, Math.ceil((count || 0) / 10)));

      // Fetch paginated data
      const startIdx = (currentPage - 1) * 10;
      const endIdx = startIdx + 9;
      let query = supabase
        .from('rental_sessions')
        .select(`*, customers(name, phone), consoles(name, location)`)
        .in('status', ['completed', 'overdue'])
        .order('end_time', { ascending: false })
        .range(startIdx, endIdx);
      if (startDate) {
        query = query.gte('end_time', startDate + 'T00:00:00');
      }
      if (endDate) {
        query = query.lte('end_time', endDate + 'T23:59:59');
      }
      const { data, error } = await query;
      if (error) throw error;
      setHistorySessions(data || []);
    } catch (error) {
      Swal.fire('Error', 'Gagal memuat history rental', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);
  
  // Real-time clock for header
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Set up countdown timers for prepaid sessions
  useEffect(() => {
    // Clear previous intervals
    Object.values(countdownIntervals).forEach(interval => clearInterval(interval));
    setCountdownIntervals({});

    const newElapsedTimers: Record<string, number> = {};
    const newCountdownTimers: Record<string, number> = {};
    const newCountdownSeconds: Record<string, number> = {};
    const newIntervals: Record<string, NodeJS.Timeout> = {};

    activeSessions.forEach(session => {
      const startTime = new Date(session.start_time).getTime();
      const now = new Date().getTime();
      const elapsedMs = now - startTime;
      const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));

      // For all sessions, track elapsed time
      newElapsedTimers[session.id] = elapsedMinutes;

      // Untuk prepaid (BAYAR DIMUKA), cek apakah waktu sudah habis
      if (session.duration_minutes) {
        const durationMs = session.duration_minutes * 60 * 1000;
        const endTime = startTime + durationMs;
        const remainingMs = Math.max(0, endTime - now);
        const remainingMinutes = Math.floor(remainingMs / (1000 * 60));
        newCountdownTimers[session.id] = remainingMinutes;
        newCountdownSeconds[session.id] = Math.floor(remainingMs / 1000);

        // Otomatis end rental jika prepaid dan waktu habis
        if (remainingMs <= 0 && session.status === 'active' && session.payment_status === 'paid') {
          // End rental otomatis tanpa interaksi user
          handleEndSession(session.id);
        } else if (remainingMs > 0) {
          // Set up interval to update countdown per second
          const interval = setInterval(() => {
            setCountdownSeconds(prev => {
              const current = prev[session.id] ?? Math.floor((endTime - Date.now()) / 1000);
              if (current <= 1) {
                clearInterval(newIntervals[session.id]);
                delete newIntervals[session.id];
                // Otomatis end rental jika prepaid dan waktu habis
                if (session.duration_minutes && session.status === 'active' && session.payment_status === 'paid') {
                  handleEndSession(session.id);
                }
                return { ...prev, [session.id]: 0 };
              }
              return { ...prev, [session.id]: current - 1 };
            });
          }, 1000); // Update every second
          newIntervals[session.id] = interval;
        }
      }
    });

    setElapsedTimers(newElapsedTimers);
    setCountdownTimers(newCountdownTimers);
    setCountdownSeconds(newCountdownSeconds);
    setCountdownIntervals(newIntervals);

    // Set up interval to update elapsed time for all sessions
    const elapsedInterval = setInterval(() => {
      setElapsedTimers(prev => {
        const newTimers = { ...prev };
        activeSessions.forEach(session => {
          const startTime = new Date(session.start_time).getTime();
          const now = new Date().getTime();
          const elapsedMs = now - startTime;
          const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
          newTimers[session.id] = elapsedMinutes;
        });
        return newTimers;
      });
    }, 60000); // Update every minute

    return () => {
      clearInterval(elapsedInterval);
      Object.values(newIntervals).forEach(interval => clearInterval(interval));
    };
  }, [activeSessions]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch consoles
      const { data: consoleData, error: consoleError } = await supabase
        .from('consoles')
        .select('*')
        .eq('is_active', true);

      if (consoleError) throw consoleError;

      // Fetch rate profiles
      const { data: rateData, error: rateError } = await supabase
        .from('rate_profiles')
        .select('id, name, hourly_rate');

      if (rateError) throw rateError;

      // Fetch active rental sessions
      const { data: rentalData, error: rentalError } = await supabase
        .from('rental_sessions')
        .select(`
          *,
          customers(name, phone),
          consoles(name, location)
        `)
        .eq('status', 'active');

      if (rentalError) throw rentalError;

      // Fetch products from database
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .gt('stock', 0);

      if (productError) {
        console.error('Error fetching products:', productError);
        throw productError;
      }
      
      console.log('Fetched products:', productData);

      // Fetch customers
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('status', 'active');

      if (customerError) throw customerError;

      setConsoles(consoleData || []);
      setRateProfiles(rateData || []);
      setActiveSessions(rentalData || []);
      setProducts(productData || []);
      setCustomers(customerData || []);
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
  
  const formatCountdown = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Format countdown in HH:MM:SS for Live Timer Display
  const formatCountdownHMS = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    // Pad with zero
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `Sisa Waktu : ${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  };

  // Format elapsed time in HH:MM:SS for PAY AS YOU GO
  const formatElapsedHMS = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    let diff = Math.floor((now.getTime() - start.getTime()) / 1000); // in seconds
    if (diff < 0) diff = 0;
    const hours = Math.floor(diff / 3600);
    const mins = Math.floor((diff % 3600) / 60);
    const secs = diff % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `Durasi : ${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  };

  const calculateCurrentCost = (session: RentalSession) => {
    const start = new Date(session.start_time);
    const now = new Date();
    let totalMinutes = 0;
    if (session.duration_minutes) {
      totalMinutes = session.duration_minutes;
    } else {
      const diffMs = now.getTime() - start.getTime();
      totalMinutes = Math.ceil(diffMs / (1000 * 60));
    }
    const console = consoles.find(c => c.id === session.console_id);
    const rateProfile = rateProfiles.find(r => r.id === console?.rate_profile_id);
    const hourlyRate = rateProfile?.hourly_rate || 15000;
    if (totalMinutes <= 60) {
      return hourlyRate;
    } else {
      const extraMinutes = totalMinutes - 60;
      const perMinuteRate = hourlyRate / 60;
      return hourlyRate + Math.ceil(extraMinutes * perMinuteRate);
    }
  };

  const handleEndSession = async (sessionId: string) => {
    try {
      const session = activeSessions.find(s => s.id === sessionId);
      if (!session) return;

      // Untuk BAYAR DIMUKA (prepaid), relay_command_off dijalankan di sini
      let isPrepaid = session.duration_minutes && session.payment_status === 'paid';
      if (isPrepaid) {
        const consoleObj = consoles.find(c => c.id === session.console_id);
        if (consoleObj?.relay_command_off) {
          fetch(consoleObj.relay_command_off).catch(() => {});
        }
      }

      // Jika prepaid (bayar dimuka), langsung update status tanpa modal pembayaran
      if (session.duration_minutes && session.payment_status === 'paid') {
        // Update rental session
        await supabase
          .from('rental_sessions')
          .update({
            end_time: new Date().toISOString(),
            status: 'completed'
          })
          .eq('id', session.id);

        // Update console status
        await supabase
          .from('consoles')
          .update({ status: 'available' })
          .eq('id', session.console_id);

        await loadData();
        Swal.fire('Berhasil', 'Rental telah diakhiri otomatis (bayar dimuka)', 'success');
        return;
      }

      // Untuk pay-as-you-go, buka modal pembayaran seperti biasa
      // Hitung total biaya rental
      const totalCost = calculateCurrentCost(session);
      // Hitung total produk dari keranjang (jika ada)
      const productsTotal = 0; // ganti dengan logika jika produk per sesi tersedia
      // Tampilkan modal pembayaran kasir
      setShowPaymentModal({ session, productsTotal });
      setPaymentAmount(totalCost + productsTotal);
      setChangeAmount(0);
      // Proses update status rental & console dilakukan setelah pembayaran di modal
    } catch (error) {
      console.error('Error ending session:', error);
      Swal.fire('Error', 'Gagal mengakhiri sesi rental', 'error');
    }
  };

  // Fungsi proses pembayaran kasir
  const handleProcessPayment = async () => {
    if (!showPaymentModal) return;
    const { session, productsTotal } = showPaymentModal;
    const totalCost = calculateCurrentCost(session);
    const total = totalCost + productsTotal;

    if (paymentAmount < total) {
      Swal.fire('Error', 'Nominal pembayaran kurang dari total', 'warning');
      return;
    }

    try {
      // Jalankan relay_command_off untuk PAY AS YOU GO
      if (!session.duration_minutes) {
        const consoleObj = consoles.find(c => c.id === session.console_id);
        if (consoleObj?.relay_command_off) {
          fetch(consoleObj.relay_command_off).catch(() => {});
        }
      }

      // Catat transaksi pembayaran ke sales/payments
      await supabase.from('sales').insert({
        customer_id: session.customer_id,
        subtotal: totalCost,
        tax: 0,
        discount: 0,
        total: total,
        payment_method: paymentMethod,
        payment_amount: paymentAmount,
        change_amount: paymentAmount - total,
        sale_date: new Date().toISOString(),
        cashier_id: null,
        session_id: null
      });

      // Update rental session
      await supabase
        .from('rental_sessions')
        .update({
          end_time: new Date().toISOString(),
          total_amount: totalCost,
          status: 'completed'
        })
        .eq('id', session.id);

      // Update console status
      await supabase
        .from('consoles')
        .update({ status: 'available' })
        .eq('id', session.console_id);

      setShowPaymentModal(null);
      await loadData();
      Swal.fire('Berhasil', 'Pembayaran berhasil, rental telah diakhiri', 'success');
    } catch (error) {
      console.error('Error processing payment:', error);
      Swal.fire('Error', 'Gagal memproses pembayaran', 'error');
    }
  };

  const handleStartRental = async (consoleId: string) => {
    if (customerType === 'member' && !selectedCustomerId) {
      Swal.fire('Error', 'Silakan pilih customer terlebih dahulu', 'warning');
      return;
    }
    if (customerType === 'non-member' && !nonMemberName) {
      Swal.fire('Error', 'Nama wajib diisi untuk non-member', 'warning');
      return;
    }

    try {
      // Jalankan relay_command_on jika ada
      const consoleObj = consoles.find(c => c.id === consoleId);
      if (consoleObj?.relay_command_on) {
        fetch(consoleObj.relay_command_on).catch(() => {});
      }

      let customerId = selectedCustomerId;

      // Jika non-member, buat customer baru
      if (customerType === 'non-member') {
        // Prepare customer data
        const customerData: any = {
          name: nonMemberName,
          status: 'active',
          join_date: new Date().toISOString().split('T')[0]
        };
        if (nonMemberPhone) {
          customerData.phone = nonMemberPhone;
        }
        const { data: insertedCustomer, error: insertError } = await supabase
          .from('customers')
          .insert(customerData)
          .select()
          .single();
        if (insertError) throw insertError;
        customerId = insertedCustomer.id;
      }

      // Hitung biaya jika prepaid
      let totalAmount = 0;
      let paidAmount = 0;
      let paymentStatus = 'pending';

      let totalDurationMinutes = rentalType === 'prepaid'
        ? (rentalDurationHours * 60 + rentalDurationMinutes)
        : null;

      if (rentalType === 'prepaid') {
        const console = consoles.find(c => c.id === consoleId);
        const rateProfile = rateProfiles.find(r => r.id === console?.rate_profile_id);
        const hourlyRate = rateProfile?.hourly_rate || 0;

        // Billing rule: minimal 1 jam, setelah itu per menit
        if (totalDurationMinutes! <= 60) {
          totalAmount = hourlyRate;
        } else {
          const extraMinutes = totalDurationMinutes! - 60;
          const perMinuteRate = hourlyRate / 60;
          totalAmount = hourlyRate + Math.ceil(extraMinutes * perMinuteRate);
        }
        paidAmount = totalAmount;
        paymentStatus = 'paid';

        // Konfirmasi pembayaran
        const paymentResult = await Swal.fire({
          title: 'Konfirmasi Pembayaran',
          html: `
            <div class="text-left">
              <p><strong>Durasi:</strong> ${rentalDurationHours} jam ${rentalDurationMinutes} menit</p>
              <p><strong>Tarif per jam:</strong> Rp ${hourlyRate.toLocaleString('id-ID')}</p>
              <p><strong>Total:</strong> Rp ${totalAmount.toLocaleString('id-ID')}</p>
            </div>
          `,
          icon: 'info',
          showCancelButton: true,
          confirmButtonText: 'Bayar',
          cancelButtonText: 'Batal'
        });

        if (!paymentResult.isConfirmed) {
          return;
        }
      }

      // Create new rental session
      const { error: rentalError } = await supabase
        .from('rental_sessions')
        .insert({
          customer_id: customerId,
          console_id: consoleId,
          status: 'active',
          payment_status: paymentStatus,
          total_amount: totalAmount,
          paid_amount: paidAmount,
          start_time: new Date().toISOString(),
          duration_minutes: rentalType === 'prepaid' ? totalDurationMinutes : null
        });
      if (rentalError) throw rentalError;

      // Update console status
      const { error: consoleError } = await supabase
        .from('consoles')
        .update({ status: 'rented' })
        .eq('id', consoleId);
      if (consoleError) throw consoleError;

      setShowStartRentalModal(null);
      setSelectedCustomerId('');
      setCustomerType('member');
      setRentalType('pay-as-you-go');
      setRentalDurationHours(1);
      setRentalDurationMinutes(0);
      setNonMemberName('');
      setNonMemberPhone('');
      await loadData();
      Swal.fire('Berhasil', 'Sesi rental berhasil dimulai', 'success');
    } catch (error) {
      console.error('Error starting rental:', error);
      Swal.fire('Error', 'Gagal memulai sesi rental', 'error');
    }
  };

  // Product cart functions
  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.productId === product.id);
    let newQuantity = 1;
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        Swal.fire('Stok Tidak Cukup', `Stok ${product.name} hanya tersisa ${product.stock}`, 'warning');
        return;
      }
      newQuantity = existingItem.quantity + 1;
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
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

    // Simpan ke database sebagai pending jika sedang menambahkan produk pada sesi rental aktif
    if (showProductModal) {
      const sessionId = showProductModal;
      const cartItem = existingItem
        ? { ...existingItem, quantity: newQuantity, total: newQuantity * product.price }
        : {
            productId: product.id,
            productName: product.name,
            price: product.price,
            quantity: 1,
            total: product.price
          };

      // Cek apakah sudah ada data untuk session_id dan product_id
      supabase
        .from('rental_session_products')
        .select('id')
        .eq('session_id', sessionId)
        .eq('product_id', cartItem.productId)
        .single()
        .then(async ({ data, error }) => {
          if (error && error.code !== 'PGRST116') {
            // Error selain not found
            console.error('Error checking pending product:', error);
            Swal.fire('Error', 'Gagal cek produk pending', 'error');
            return;
          }
          if (data) {
            // Sudah ada, update quantity dan total
            const { id } = data;
            const { quantity, total } = cartItem;
            const { price, product_name } = cartItem;
            const { productId } = cartItem;
            await supabase
              .from('rental_session_products')
              .update({ quantity, total, price, product_name })
              .eq('id', id);
          } else {
            // Belum ada, insert baru
            await supabase
              .from('rental_session_products')
              .insert({
                session_id: sessionId,
                product_id: cartItem.productId,
                product_name: cartItem.productName,
                price: cartItem.price,
                quantity: cartItem.quantity,
                total: cartItem.total,
                status: 'pending'
              });
          }
        });
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
      const session = activeSessions.find(s => s.id === sessionId);
      if (!session) return;
      
      // Calculate totals
      const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
      const total = subtotal;
      
      // Create sale in database
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          customer_id: session.customer_id,
          subtotal: subtotal,
          tax: 0,
          discount: 0,
          total: total,
          payment_method: 'cash',
          payment_amount: total,
          change_amount: 0,
          sale_date: new Date().toISOString(),
          cashier_id: null, // Will be updated when auth is implemented
          session_id: null // Optional: link to cashier session if needed
        })
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
      
      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);
      
      if (itemsError) throw itemsError;
      
      // Update product stock
      for (const item of cart) {
        const { error: stockError } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.productId)
          .single()
          .then(({ data, error }) => {
            if (error) throw error;
            return supabase
              .from('products')
              .update({ stock: data.stock - item.quantity })
              .eq('id', item.productId);
          });
          
        if (stockError) throw stockError;
      }
      
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

  const getConsoleRateProfile = (consoleId: string) => {
    const console = consoles.find(c => c.id === consoleId);
    if (!console || !console.rate_profile_id) return null;
    return rateProfiles.find(r => r.id === console.rate_profile_id);
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Console Management</h1>
        <p className="text-gray-600">Monitor all consoles and manage rental sessions</p>
      </div>

      {/* Time Display, Filter & View Mode Toggle */}
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600 animate-pulse" />
            <span className="text-xl font-bold font-mono">
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
          {/* Search Console */}
          <input
            type="text"
            placeholder="Cari nama console..."
            value={searchConsole}
            onChange={e => setSearchConsole(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{ minWidth: 180 }}
          />
        </div>

        {/* Filter Buttons, View Mode Toggle & History Button */}
        <div className="flex gap-2 flex-wrap items-center">
          <button
            className={`px-4 py-2 rounded-lg font-medium border transition-colors ${consoleFilter === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
            onClick={() => setConsoleFilter('all')}
          >
            Semua
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium border transition-colors ${consoleFilter === 'available' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50'}`}
            onClick={() => setConsoleFilter('available')}
          >
            Available ({consoles.filter(c => c.status === 'available').length})
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium border transition-colors ${consoleFilter === 'rented' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
            onClick={() => setConsoleFilter('rented')}
          >
            Active ({consoles.filter(c => c.status === 'rented').length})
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium border transition-colors ${consoleFilter === 'maintenance' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-red-50'}`}
            onClick={() => setConsoleFilter('maintenance')}
          >
            Maintenance ({consoles.filter(c => c.status === 'maintenance').length})
          </button>
          <button
            className="px-4 py-2 rounded-lg font-medium border border-gray-400 bg-white text-gray-700 hover:bg-gray-100 ml-2"
            onClick={() => { setShowHistoryModal(true); loadHistorySessions(historyStartDate, historyEndDate); }}
            type="button"
          >
            Lihat History
          </button>
          {/* View Mode Toggle */}
          <div className="ml-2 flex gap-1">
            <button
              type="button"
              className={`px-3 py-2 rounded-lg font-medium border text-xs transition-colors ${viewMode === 'simple' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
              onClick={() => setViewMode('simple')}
            >
              Simple
            </button>
            <button
              type="button"
              className={`px-3 py-2 rounded-lg font-medium border text-xs transition-colors ${viewMode === 'detail' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
              onClick={() => setViewMode('detail')}
            >
              Detail
            </button>
            <button
              type="button"
              className={`px-3 py-2 rounded-lg font-medium border text-xs transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
          </div>
        </div>
      </div>
      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">History Active Rentals</h2>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              {/* Filter tanggal */}
              <form className="flex flex-wrap gap-4 mb-4 items-end" onSubmit={e => { e.preventDefault(); setCurrentPage(1); loadHistorySessions(historyStartDate, historyEndDate); }}>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={historyStartDate}
                    onChange={e => setHistoryStartDate(e.target.value)}
                    className="border px-2 py-1 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    value={historyEndDate}
                    onChange={e => setHistoryEndDate(e.target.value)}
                    className="border px-2 py-1 rounded"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700"
                >
                  Filter
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-medium hover:bg-gray-300"
                  onClick={() => { setHistoryStartDate(''); setHistoryEndDate(''); setCurrentPage(1); loadHistorySessions(); }}
                >
                  Reset
                </button>
              </form>
              {loadingHistory ? (
                <div className="text-center py-8 text-gray-500">Memuat data...</div>
              ) : historySessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Tidak ada history rental ditemukan.</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-3 py-2 border">Waktu Mulai</th>
                          <th className="px-3 py-2 border">Waktu Selesai</th>
                          <th className="px-3 py-2 border">Customer</th>
                          <th className="px-3 py-2 border">Console</th>
                          <th className="px-3 py-2 border">Durasi</th>
                          <th className="px-3 py-2 border">Total</th>
                          <th className="px-3 py-2 border">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historySessions.map((session) => {
                          const start = new Date(session.start_time);
                          const end = session.end_time ? new Date(session.end_time) : null;
                          const duration = end ? Math.round((end.getTime() - start.getTime()) / 60000) : null;
                          return (
                            <tr key={session.id} className="border-b hover:bg-gray-50">
                              <td className="px-3 py-2 border font-mono">{start.toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: '2-digit' })}</td>
                              <td className="px-3 py-2 border font-mono">{end ? end.toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: '2-digit' }) : '-'}</td>
                              <td className="px-3 py-2 border">{session.customers?.name || '-'}</td>
                              <td className="px-3 py-2 border">{session.consoles?.name || '-'}</td>
                              <td className="px-3 py-2 border">{duration !== null ? `${Math.floor(duration/60)}j ${duration%60}m` : '-'}</td>
                              <td className="px-3 py-2 border">Rp {session.total_amount.toLocaleString('id-ID')}</td>
                              <td className="px-3 py-2 border">{session.status.toUpperCase()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination Controls */}
                  <div className="flex justify-between items-center mt-4">
                    <button
                      className="px-3 py-1 rounded bg-gray-200 text-gray-700 font-medium hover:bg-gray-300"
                      disabled={currentPage === 1}
                      onClick={() => { if (currentPage > 1) { setCurrentPage(currentPage - 1); loadHistorySessions(historyStartDate, historyEndDate); } }}
                    >
                      Previous
                    </button>
                    <div className="flex gap-1 items-center">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          className={`px-2 py-1 rounded ${page === currentPage ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-blue-100'}`}
                          onClick={() => { setCurrentPage(page); loadHistorySessions(historyStartDate, historyEndDate); }}
                          disabled={page === currentPage}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      className="px-3 py-1 rounded bg-gray-200 text-gray-700 font-medium hover:bg-gray-300"
                      disabled={currentPage === totalPages}
                      onClick={() => { if (currentPage < totalPages) { setCurrentPage(currentPage + 1); loadHistorySessions(historyStartDate, historyEndDate); } }}
                    >
                      Next
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Console Grid */}
      {viewMode === 'simple' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {(consoleFilter === 'all' ? consoles : consoles.filter(c => c.status === consoleFilter))
            .filter(c => c.name.toLowerCase().includes(searchConsole.toLowerCase()))
            .map((console) => {
            const isActive = console.status === 'rented';
            const activeSession = activeSessions.find(s => s.console_id === console.id);
            const rateProfile = getConsoleRateProfile(console.id);
            return (
              <div
                key={console.id}
                className={`rounded-lg shadow border text-xs p-2 flex flex-col items-stretch min-w-0 ${
                  console.status === 'available' ? 'border-green-200 bg-white' :
                  console.status === 'rented' ? 'border-blue-200 bg-white' :
                  'border-red-200 bg-white'
                }`}
                style={{ minWidth: 0 }}
              >
                {/* Header */}
                <div className={`flex items-center gap-1 px-2 py-1 rounded-t-lg ${
                  console.status === 'available' ? 'bg-purple-600' :
                  console.status === 'rented' ? 'bg-purple-600' :
                  'bg-purple-600'
                } text-white`}
                  style={{ fontSize: '0.95em' }}
                >
                  <Gamepad2 className="h-4 w-4" />
                  <span className="font-semibold truncate">{console.name}</span>
                  {console.location && (
                    <span className="text-[10px] opacity-80 ml-auto">{console.location}</span>
                  )}
                </div>

                {/* Body */}
                <div className="flex-1 flex flex-col gap-1 p-2">
                  {/* Tarif & Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-1"><DollarSign className="h-3 w-3" />{rateProfile ? rateProfile.hourly_rate.toLocaleString('id-ID') : '0'}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      console.status === 'available' ? 'bg-green-500 text-white' :
                      console.status === 'rented' ? 'bg-blue-500 text-white' :
                      'bg-red-500 text-white'
                    }`}>
                      {console.status === 'available' ? 'READY' :
                       console.status === 'rented' ? 'ACTIVE' :
                       'MAINT.'}
                    </span>
                  </div>

                  {/* Active Session Info (simple) */}
                  {isActive && activeSession && (
                    <div className="mt-1 mb-1 p-1 bg-blue-50 rounded border border-blue-100 flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-blue-600" />
                        <span className="truncate font-semibold text-blue-800">{activeSession.customers?.name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px]">
                        <Clock className="h-3 w-3 text-purple-600 animate-pulse" />
                        {activeSession.duration_minutes
                          ? formatCountdownHMS(countdownSeconds[activeSession.id] ?? 0)
                          : formatElapsedHMS(activeSession.start_time)}
                      </div>
                      <div className="flex items-center gap-1 text-[11px]">
                        <span>Rp {calculateCurrentCost(activeSession).toLocaleString('id-ID')}</span>
                        <span
                          className={`ml-auto font-bold text-[10px] px-2 py-0.5 rounded-full ${
                            activeSession.duration_minutes
                              ? 'bg-purple-100 text-purple-700 border border-purple-300'
                              : 'bg-green-100 text-green-700 border border-green-300'
                          }`}
                        >
                          {activeSession.duration_minutes ? 'BAYAR DIMUKA' : 'PAY AS YOU GO'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons (icon only, tooltip) */}
                  <div className="flex gap-1 mt-auto">
                    {console.status === 'available' ? (
                      <button
                        onClick={() => setShowStartRentalModal(console.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1 rounded flex items-center justify-center text-xs"
                        title="Start Rental"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                    ) : console.status === 'rented' && activeSession ? (
                      <button
                        onClick={() => handleEndSession(activeSession.id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1 rounded flex items-center justify-center text-xs"
                        title="End Rental"
                      >
                        <Square className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        disabled
                        className="flex-1 bg-gray-400 text-white py-1 rounded flex items-center justify-center text-xs cursor-not-allowed"
                        title="In Maintenance"
                      >
                        <Wrench className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (console.status === 'rented' && activeSession) {
                          setShowProductModal(activeSession.id);
                        } else {
                          Swal.fire('Info', 'Konsol harus dalam status aktif untuk menambahkan produk', 'info');
                        }
                      }}
                      className={`flex-1 ${console.status === 'rented' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-gray-400 cursor-not-allowed'} text-white py-1 rounded flex items-center justify-center text-xs`}
                      disabled={console.status !== 'rented'}
                      title="Add Products"
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'list' ? (
        // LIST MODE: Tampilkan dalam bentuk list
        <div className="divide-y divide-gray-200">
          {(consoleFilter === 'all' ? consoles : consoles.filter(c => c.status === consoleFilter))
            .filter(c => c.name.toLowerCase().includes(searchConsole.toLowerCase()))
            .map((console) => {
            const isActive = console.status === 'rented';
            const activeSession = activeSessions.find(s => s.console_id === console.id);
            const rateProfile = getConsoleRateProfile(console.id);
            return (
              <div
                key={console.id}
                className={`py-4 px-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 ${
                  console.status === 'available' ? 'bg-green-50' :
                  console.status === 'rented' ? 'bg-blue-50' :
                  'bg-red-50'
                } rounded-lg transition-all`}
              >
                {/* Left: Status & Console Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${console.status === 'available' ? 'bg-green-500' : console.status === 'rented' ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{console.name}</h3>
                  </div>
                  <div className="text-sm text-gray-600 flex flex-wrap gap-4">
                    <div className="flex items-center gap-1">
                      <Gamepad2 className="h-4 w-4 text-gray-500" />
                      <span>{console.equipment_type_id}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span>{rateProfile ? rateProfile.hourly_rate.toLocaleString('id-ID') : '0'}/jam</span>
                    </div>
                    {console.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{console.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Action & Status */}
                <div className="shrink-0">
                  {isActive && activeSession ? (
                    <div className="flex flex-col items-end">
                      {/* Status Badge */}
                      <span className={`text-[10px] font-bold rounded-full py-1 px-3 mb-2 border ${
                        activeSession.duration_minutes
                          ? 'bg-purple-100 text-purple-800 border-purple-300'
                          : 'bg-green-100 text-green-800 border-green-300'
                      }`}>
                        {activeSession.duration_minutes ? 'BAYAR DIMUKA' : 'PAY AS YOU GO'}
                      </span>
                      
                      {/* End Session Button */}
                      <button
                        onClick={() => handleEndSession(activeSession.id)}
                        className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2"
                        title="Akhiri Sesi"
                      >
                        <Square className="h-5 w-5" />
                        Akhiri Sesi
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowStartRentalModal(console.id)}
                      className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2"
                      title="Mulai Rental"
                    >
                      <Play className="h-5 w-5" />
                      Mulai Rental
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // DETAIL MODE: Card besar (seperti sebelumnya)
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(consoleFilter === 'all' ? consoles : consoles.filter(c => c.status === consoleFilter))
            .filter(c => c.name.toLowerCase().includes(searchConsole.toLowerCase()))
            .map((console) => {
            const isActive = console.status === 'rented';
            const activeSession = activeSessions.find(s => s.console_id === console.id);
            const rateProfile = getConsoleRateProfile(console.id);
            return (
              <div
                key={console.id}
                className={`rounded-xl overflow-hidden shadow-sm border ${
                  console.status === 'available' ? 'border-green-200 bg-white' :
                  console.status === 'rented' ? 'border-blue-200 bg-white' :
                  'border-red-200 bg-white'
                }`}
              >
                {/* Header */}
                <div className={`p-4 ${
                  console.status === 'available' ? 'bg-purple-600' :
                  console.status === 'rented' ? 'bg-purple-600' :
                  'bg-purple-600'
                } text-white`}>
                  <div className="flex items-center gap-3">
                    <Gamepad2 className="h-6 w-6" />
                    <h3 className="font-semibold text-lg">{console.name}</h3>
                    {console.location && (
                      <span className="text-sm opacity-80">{console.location}</span>
                    )}
                  </div>
                  <div className="mt-2 flex justify-between items-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      console.status === 'available' ? 'bg-green-500 text-white' :
                      console.status === 'rented' ? 'bg-blue-500 text-white' :
                      'bg-red-500 text-white'
                    }`}>
                      {console.status === 'available' ? 'AVAILABLE' :
                       console.status === 'rented' ? 'ACTIVE' :
                       'MAINTENANCE'}
                    </span>
                    {console.location && (
                      <span className="text-sm opacity-80">{console.location}</span>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="p-4">
                  {/* Rate Info */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Tarif per Jam
                    </h4>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Per Jam</span>
                      <span className="font-semibold text-blue-600">
                        Rp {rateProfile ? rateProfile.hourly_rate.toLocaleString('id-ID') : '0'}
                      </span>
                    </div>
                  </div>

                  {/* Active Session Info */}
                  {isActive && activeSession && (
                    <div
                      className={`mb-4 p-3 rounded-lg border ${
                        activeSession.duration_minutes
                          ? 'bg-purple-50 border-purple-100'
                          : 'bg-green-50 border-green-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-800">
                            {activeSession.customers?.name}
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                          activeSession.duration_minutes
                            ? 'bg-purple-100 text-purple-800 border-purple-300'
                            : 'bg-green-100 text-green-800 border-green-300'
                        }`}>
                          {activeSession.duration_minutes ? 'BAYAR DIMUKA' : 'PAY AS YOU GO'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-blue-600">Mulai:</span>
                          <p className="font-medium">
                            {new Date(activeSession.start_time).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div>
                          <span className="text-blue-600">Durasi:</span>
                          <p className="font-medium">
                            {activeSession.duration_minutes ? (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-purple-600 animate-pulse" />
                                <span className="font-bold text-purple-700">
                                  {formatCountdown(countdownTimers[activeSession.id] || 0)} tersisa
                                </span>
                              </span>
                            ) : (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-green-600 animate-pulse" />
                            <span className="font-bold text-green-700">
                              {formatElapsedHMS(activeSession.start_time)}
                            </span>
                          </span>
                            )}
                          </p>
                        </div>
                        <div>
                          <span className="text-blue-600">Biaya:</span>
                          <p className="font-medium">Rp {calculateCurrentCost(activeSession).toLocaleString('id-ID')}</p>
                        </div>
                        <div>
                          <span className="text-blue-600">Status:</span>
                          <p className="font-medium">{activeSession.payment_status.toUpperCase()}</p>
                        </div>
                      </div>

                      {/* Live Timer Display */}
                      <div className="mt-2 pt-2 border-t border-blue-200">
                        <div className="text-center font-mono text-lg font-bold text-blue-700">
                          {activeSession.duration_minutes
                            ? formatCountdownHMS(countdownSeconds[activeSession.id] ?? 0)
                            : formatElapsedHMS(activeSession.start_time)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {console.status === 'available' ? (
                    <button
                      onClick={() => setShowStartRentalModal(console.id)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mb-2"
                    >
                      <Play className="h-5 w-5" />
                      Start Rental
                    </button>
                  ) : console.status === 'rented' && activeSession ? (
                    <button
                      onClick={() => handleEndSession(activeSession.id)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mb-2"
                    >
                      <Square className="h-5 w-5" />
                      End Rental
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full bg-gray-400 text-white py-3 rounded-lg font-medium mb-2 cursor-not-allowed"
                    >
                      <Wrench className="h-5 w-5 inline mr-2" />
                      In Maintenance
                    </button>
                  )}

                  {/* Add Products Button */}
                  {!activeSession?.duration_minutes && (
                    <button
                      onClick={() => {
                        if (console.status === 'rented' && activeSession) {
                          setShowProductModal(activeSession.id);
                        } else {
                          Swal.fire('Info', 'Konsol harus dalam status aktif untuk menambahkan produk', 'info');
                        }
                      }}
                      className={`w-full ${
                        console.status === 'rented'
                          ? 'bg-orange-500 hover:bg-orange-600'
                          : 'bg-gray-400 cursor-not-allowed'
                      } text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2`}
                      disabled={console.status !== 'rented'}
                    >
                      <ShoppingCart className="h-5 w-5" />
                      Add Products
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No Consoles */}
      {consoles.length === 0 && (
        <div className="text-center py-12">
          <Gamepad2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Consoles Found</h3>
          <p className="text-gray-600">Add consoles to start managing rentals</p>
        </div>
      )}

      {/* Start Rental Modal */}
      {showStartRentalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Start New Rental</h2>
              
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Customer</label>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => setCustomerType('member')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border ${
                        customerType === 'member' 
                          ? 'bg-blue-50 border-blue-500 text-blue-700' 
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      <Users className="h-5 w-5" />
                      <span className="font-medium">Member</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerType('non-member')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border ${
                        customerType === 'non-member' 
                          ? 'bg-blue-50 border-blue-500 text-blue-700' 
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      <UserPlus className="h-5 w-5" />
                      <span className="font-medium">Non-Member</span>
                    </button>
                  </div>
                  
                  {customerType === 'member' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Member</label>
                      <select
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">-- Pilih Member --</option>
                        {customers.map(customer => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name} - {customer.phone}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Non-Member</label>
                        <input
                          type="text"
                          value={nonMemberName}
                          onChange={(e) => setNonMemberName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Masukkan nama customer"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
                        <input
                          type="tel"
                          value={nonMemberPhone}
                          onChange={(e) => setNonMemberPhone(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Opsional"
                        />
                        <p className="text-xs text-gray-500 mt-1">Opsional</p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Rental</label>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => setRentalType('pay-as-you-go')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border ${
                        rentalType === 'pay-as-you-go' 
                          ? 'bg-green-50 border-green-500 text-green-700' 
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      <Clock className="h-5 w-5" />
                      <span className="font-medium">Pay As You Go</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRentalType('prepaid')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border ${
                        rentalType === 'prepaid' 
                          ? 'bg-green-50 border-green-500 text-green-700' 
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      <DollarSign className="h-5 w-5" />
                      <span className="font-medium">Bayar Dimuka</span>
                    </button>
                  </div>
                  
                  {rentalType === 'prepaid' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Durasi Rental</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="0"
                          value={rentalDurationHours}
                          onChange={e => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setRentalDurationHours(val);
                          }}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Jam"
                        />
                        <span className="self-center">jam</span>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={rentalDurationMinutes}
                          onChange={e => {
                            let val = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                            setRentalDurationMinutes(val);
                          }}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Menit"
                        />
                        <span className="self-center">menit</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Jam dan menit akan digabung sebagai total durasi.</p>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Console Information</h4>
                  <div className="space-y-2 text-sm">
                    {(() => {
                      const console = consoles.find(c => c.id === showStartRentalModal);
                      const rateProfile = console?.rate_profile_id 
                        ? rateProfiles.find(r => r.id === console.rate_profile_id)
                        : null;
                      
                      return (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Console:</span>
                            <span className="font-medium">{console?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Location:</span>
                            <span className="font-medium">{console?.location || '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Hourly Rate:</span>
                            <span className="font-medium">
                              Rp {rateProfile ? rateProfile.hourly_rate.toLocaleString('id-ID') : '0'}/jam
                            </span>
                          </div>
                          {rentalType === 'prepaid' && (
                            <div className="flex justify-between border-t border-gray-200 pt-2 mt-2 font-medium">
                              <span className="text-gray-800">Total ({rentalDurationHours} jam {rentalDurationMinutes} menit):</span>
                              <span className="text-green-600">
                                {(() => {
                                  const hourlyRate = rateProfile?.hourly_rate || 0;
                                  const totalDurationMinutes = rentalDurationHours * 60 + rentalDurationMinutes;
                                  let totalAmount = 0;
                                  if (totalDurationMinutes <= 60) {
                                    totalAmount = hourlyRate;
                                  } else {
                                    const extraMinutes = totalDurationMinutes - 60;
                                    const perMinuteRate = hourlyRate / 60;
                                    totalAmount = hourlyRate + Math.ceil(extraMinutes * perMinuteRate);
                                  }
                                  return `Rp ${totalAmount.toLocaleString('id-ID')}`;
                                })()}
                              </span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </form>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowStartRentalModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={() => handleStartRental(showStartRentalModal)}
                  disabled={(customerType === 'member' && !selectedCustomerId) || 
                           (customerType === 'non-member' && !nonMemberName)}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {rentalType === 'prepaid' ? 'Bayar & Mulai' : 'Mulai Rental'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Selection Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden flex">
            {/* Product List */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Select Products</h2>
                <button
                  onClick={() => { setShowProductModal(null); clearCart(); }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Produk Sudah Ditambahkan (Pending Payment) */}
              {billingProducts.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-md font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Produk Sudah Ditambahkan (Pending Payment)
                  </h3>
                  <div className="space-y-2">
                    {billingProducts.map((prod, idx) => (
                      <div key={prod.product_id || idx} className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                        <div>
                          <span className="font-medium text-gray-900">{prod.product_name}</span>
                          <span className="ml-2 text-xs text-gray-500">x{prod.quantity}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-yellow-700">Rp {prod.price.toLocaleString('id-ID')}</span>
                          <span className="ml-2 px-2 py-0.5 rounded-full bg-yellow-200 text-yellow-800 text-xs font-semibold">Pending Payment</span>
                          <button
                            onClick={async () => {
                              const result = await Swal.fire({
                                title: 'Konfirmasi',
                                text: `Hapus produk ${prod.product_name} dari billing?`,
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonText: 'Ya, hapus',
                                cancelButtonText: 'Batal',
                              });
                              if (result.isConfirmed) {
                                try {
                                  await deleteSaleItem(prod.product_id, prod.session_id);
                                  await loadData();
                                  // Refresh billingProducts
                                  const { data: billingData } = await supabase
                                    .from('rental_session_products')
                                    .select('*')
                                    .eq('session_id', prod.session_id)
                                    .eq('status', 'pending');
                                  setBillingProducts(billingData || []);
                                  Swal.fire('Berhasil', 'Produk berhasil dihapus dari billing.', 'success');
                                } catch (err) {
                                  Swal.fire('Gagal', 'Gagal menghapus produk dari database.', 'error');
                                }
                              }
                            }}
                            className="ml-2 text-red-500 hover:text-red-700 px-2 py-1 rounded"
                            title="Hapus produk dari billing"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Total Produk Pending Payment */}
                  <div className="flex justify-between items-center mt-4 px-3 py-2 bg-yellow-100 rounded-lg font-bold text-yellow-800">
                    <span>Total Produk Pending Payment:</span>
                    <span>
                      Rp {billingProducts.reduce((total, prod) => total + (prod.price * prod.quantity), 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              )}

              {/* Search and Filter */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search products..."
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
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
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
                        Stock: {product.stock}
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
                            onClick={async () => {
                              const result = await Swal.fire({
                                title: 'Konfirmasi',
                                text: `Hapus produk ${item.productName} dari keranjang?`,
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonText: 'Ya, hapus',
                                cancelButtonText: 'Batal',
                              });
                              if (result.isConfirmed) {
                                setCart(prev => prev.filter(cartItem => cartItem.productId !== item.productId));
                                Swal.fire('Berhasil', 'Produk dihapus dari keranjang.', 'success');
                              }
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-700">x{item.quantity}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-blue-700">Rp {item.price.toLocaleString('id-ID')}</span>
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
                      {/* Tombol Tambahkan ke Billing hanya muncul untuk Pay As You Go dan billing belum dibayar */}
                      {(() => {
                        const session = activeSessions.find(s => s.id === showProductModal);
                        if (session && !session.duration_minutes && session.payment_status !== 'paid') {
                          return (
                            <button
                              onClick={async () => {
                                // Validasi produk tidak ganda
                                const newItems = cart.filter(item => {
                                  return !session.sale_items?.some(sale => sale.product_id === item.productId);
                                });
                                if (newItems.length === 0) {
                                  Swal.fire('Info', 'Semua produk di keranjang sudah ada di billing.', 'info');
                                  return;
                                }
                                // Insert ke database rental_session_products
                                try {
                                  for (const item of newItems) {
                                    await supabase
                                      .from('rental_session_products')
                                      .insert({
                                        session_id: session.id,
                                        product_id: item.productId,
                                        product_name: item.productName,
                                        quantity: item.quantity,
                                        price: item.price,
                                        total: item.price * item.quantity,
                                        status: 'pending'
                                      });
                                  }
                                  clearCart();
                                  await loadData();
                                  Swal.fire('Berhasil', 'Produk berhasil ditambahkan ke billing.', 'success');
                                } catch (err) {
                                  Swal.fire('Gagal', 'Gagal menambahkan produk ke billing.', 'error');
                                }
                              }}
                              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mb-2"
                            >
                              <ShoppingCart className="h-5 w-5" />
                              Tambahkan ke Billing
                            </button>
                          );
                        }
                        return null;
                      })()}
                      <button
                        onClick={() => handleCheckoutProducts(showProductModal)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Calculator className="h-5 w-5" />
                        Proses Pembayaran
                      </button>
                      <button
                        onClick={clearCart}
                        className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg font-medium transition-colors"
                      >
                        Kosongkan Keranjang
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Pembayaran Kasir */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Pembayaran Kasir</h2>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span className="font-medium">{showPaymentModal.session.customers?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Durasi:</span>
                  <span className="font-medium">{formatElapsedHMS(showPaymentModal.session.start_time)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Rental:</span>
                  <span className="font-medium">Rp {calculateCurrentCost(showPaymentModal.session).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Produk:</span>
                  <span className="font-medium">Rp {showPaymentModal.productsTotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total Bayar:</span>
                  <span>Rp {(calculateCurrentCost(showPaymentModal.session) + showPaymentModal.productsTotal).toLocaleString('id-ID')}</span> 
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Metode Pembayaran</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="cash">Tunai</option>
                  <option value="qris">QRIS</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Nominal Pembayaran</label>
                <input
                  type="number"
                  min={calculateCurrentCost(showPaymentModal.session) + showPaymentModal.productsTotal}
                  value={paymentAmount}
                  onChange={e => {
                    const val = parseInt(e.target.value) || 0;
                    setPaymentAmount(val);
                    setChangeAmount(val - (calculateCurrentCost(showPaymentModal.session) + showPaymentModal.productsTotal));
                  }}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Kembalian</label>
                <input
                  type="text"
                  value={`Rp ${changeAmount > 0 ? changeAmount.toLocaleString('id-ID') : 0}`}
                  readOnly
                  className="w-full px-3 py-2 border rounded bg-gray-100"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowPaymentModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleProcessPayment}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Proses Pembayaran & Akhiri Rental
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Panel summary stats di bawah dihapus sesuai permintaan */}
    </div>
  );
};

export default ActiveRentals;