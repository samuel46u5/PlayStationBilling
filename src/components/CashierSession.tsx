import React, { useState, useEffect } from 'react';
import { DollarSign, Clock, Calculator, TrendingUp, TrendingDown, AlertCircle, CheckCircle, User, Receipt, CreditCard, Banknote, ArrowUpCircle, ArrowDownCircle, FileText, Printer, Eye, EyeOff, Calendar, ShoppingCart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CashierSession, CashierTransaction, CashFlow } from '../types';
import Swal from 'sweetalert2';

const CashierSessionComponent: React.FC = () => {
  const [currentSession, setCurrentSession] = useState<CashierSession | null>(null);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [openingCash, setOpeningCash] = useState<number>(0);
  const [closingCash, setClosingCash] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [cashierSessions, setCashierSessions] = useState<any[]>([]);
  const [cashierTransactions, setCashierTransactions] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [rentalSessions, setRentalSessions] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Fetch current user from Supabase
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        
        if (user) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (userError) throw userError;
          setCurrentUser(userData);
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Gagal memuat data user. Silakan refresh halaman.'
        });
      }
    };
    
    fetchCurrentUser();
  }, []);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // Fetch cashier sessions, transactions, sales, and rentals from Supabase
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch active session for current user
        const { data: sessionData, error: sessionError } = await supabase
          .from('cashier_sessions')
          .select('*')
          .eq('cashier_id', currentUser.id)
          .eq('status', 'active')
          .single();
        
        if (sessionError && sessionError.code !== 'PGRST116') {
          // PGRST116 means no rows returned, which is fine
          throw sessionError;
        }
        
        if (sessionData) {
          setCurrentSession({
            id: sessionData.id,
            cashierId: sessionData.cashier_id,
            cashierName: sessionData.cashier_name,
            startTime: sessionData.start_time,
            endTime: sessionData.end_time,
            openingCash: sessionData.opening_cash,
            closingCash: sessionData.closing_cash,
            expectedCash: sessionData.expected_cash,
            variance: sessionData.variance,
            totalSales: sessionData.total_sales,
            totalCash: sessionData.total_cash,
            totalCard: sessionData.total_card,
            totalTransfer: sessionData.total_transfer,
            totalTransactions: sessionData.total_transactions,
            status: sessionData.status,
            notes: sessionData.notes,
            createdAt: sessionData.created_at,
            updatedAt: sessionData.updated_at
          });
          
          // Fetch transactions for this session
          const { data: transactionData, error: transactionError } = await supabase
            .from('cashier_transactions')
            .select('*')
            .eq('session_id', sessionData.id)
            .order('timestamp', { ascending: false });
          
          if (transactionError) throw transactionError;
          setCashierTransactions(transactionData || []);
          
          // Fetch today's sales
          const today = new Date().toISOString().split('T')[0];
          const { data: salesData, error: salesError } = await supabase
            .from('sales')
            .select(`
              *,
              sale_items(*)
            `)
            .eq('cashier_id', currentUser.id)
            .gte('sale_date', today)
            .order('sale_date', { ascending: false });
          
          if (salesError) throw salesError;
          setSales(salesData || []);
          
          // Fetch today's rental sessions
          const { data: rentalData, error: rentalError } = await supabase
            .from('rental_sessions')
            .select('*')
            .gte('start_time', today)
            .eq('payment_status', 'paid')
            .order('start_time', { ascending: false });
          
          if (rentalError) throw rentalError;
          setRentalSessions(rentalData || []);
        } else {
          setCurrentSession(null);
        }
      } catch (err) {
        console.error('Error fetching cashier data:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Gagal memuat data kasir. Silakan refresh halaman.'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser]);

  // Calculate session duration
  const getSessionDuration = (session: CashierSession) => {
    const start = new Date(session.startTime);
    const end = session.endTime ? new Date(session.endTime) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}j ${minutes}m`;
  };

  // Calculate expected cash for current session
  const calculateExpectedCash = (session: CashierSession) => {
    const transactions = cashierTransactions.filter(t => t.session_id === session.id);
    const cashSales = transactions
      .filter(t => t.payment_method === 'cash')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    // Expected = Opening + Cash Sales - Change Given
    // For simplicity, assuming 10% of cash sales as average change
    const estimatedChange = cashSales * 0.1;
    return Number(session.openingCash) + cashSales - estimatedChange;
  };

  // Get today's transactions for current session
  const getTodayTransactions = () => {
    if (!currentSession) return [];
    
    const today = new Date().toDateString();
    return cashierTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.timestamp).toDateString();
      return transaction.session_id === currentSession.id && transactionDate === today;
    });
  };

  // Get today's sales for current session
  const getTodaySales = () => {
    if (!currentSession) return [];
    
    const today = new Date().toDateString();
    return sales.filter(sale => {
      const saleDate = new Date(sale.sale_date).toDateString();
      return sale.cashier_id === currentSession.cashierId && saleDate === today;
    });
  };

  // Get today's rental payments for current session
  const getTodayRentalPayments = () => {
    if (!currentSession) return [];
    
    const today = new Date().toDateString();
    return rentalSessions.filter(rental => {
      if (!rental.start_time) return false;
      const rentalDate = new Date(rental.start_time).toDateString();
      return rentalDate === today && rental.payment_status === 'paid';
    });
  };

  const handleOpenSession = async () => {
    if (openingCash <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Saldo awal harus lebih dari 0'
      });
      return;
    }
    
    setLoading(true);
    try {
      // Insert new cashier session to database
      const { data: newSession, error } = await supabase
        .from('cashier_sessions')
        .insert({
          cashier_id: currentUser?.id,
          cashier_name: currentUser?.full_name,
          start_time: new Date().toISOString(),
          opening_cash: openingCash,
          total_sales: 0,
          total_cash: 0,
          total_card: 0,
          total_transfer: 0,
          total_transactions: 0,
          status: 'active',
          notes: notes
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Format the session data
      setCurrentSession({
        id: newSession.id,
        cashierId: newSession.cashier_id,
        cashierName: newSession.cashier_name,
        startTime: newSession.start_time,
        openingCash: newSession.opening_cash,
        totalSales: newSession.total_sales,
        totalCash: newSession.total_cash,
        totalCard: newSession.total_card,
        totalTransfer: newSession.total_transfer,
        totalTransactions: newSession.total_transactions,
        status: newSession.status,
        notes: newSession.notes,
        createdAt: newSession.created_at,
        updatedAt: newSession.updated_at
      });
      
      setShowOpenModal(false);
      setNotes('');
      
      Swal.fire({
        icon: 'success',
        title: 'Sukses',
        text: `Sesi kasir berhasil dibuka! Saldo awal: Rp ${openingCash.toLocaleString('id-ID')}`
      });
    } catch (err) {
      console.error('Error opening cashier session:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Gagal membuka sesi kasir. Silakan coba lagi.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSession = async () => {
    if (!currentSession) return;
    
    if (closingCash <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Jumlah setoran harus lebih dari 0'
      });
      return;
    }

    const expectedCash = calculateExpectedCash(currentSession);
    const variance = closingCash - expectedCash;
    
    setLoading(true);
    try {
      // Update cashier session in database
      const { error } = await supabase
        .from('cashier_sessions')
        .update({
          end_time: new Date().toISOString(),
          closing_cash: closingCash,
          expected_cash: expectedCash,
          variance: variance,
          status: 'closed',
          notes: notes ? `${currentSession.notes ? currentSession.notes + '\n' : ''}${notes}` : currentSession.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSession.id);
      
      if (error) throw error;
      
      Swal.fire({
        icon: 'success',
        title: 'Sukses',
        html: `
          <p>Sesi kasir berhasil ditutup!</p>
          <div class="mt-4 text-left">
            <p><strong>Ringkasan:</strong></p>
            <p>- Saldo Awal: Rp ${currentSession.openingCash.toLocaleString('id-ID')}</p>
            <p>- Setoran: Rp ${closingCash.toLocaleString('id-ID')}</p>
            <p>- Expected: Rp ${expectedCash.toLocaleString('id-ID')}</p>
            <p>- Selisih: Rp ${Math.abs(variance).toLocaleString('id-ID')} ${variance >= 0 ? '(Lebih)' : '(Kurang)'}</p>
          </div>
        `
      });
      
      setCurrentSession(null);
      setShowCloseModal(false);
      setClosingCash(0);
      setNotes('');
    } catch (err) {
      console.error('Error closing cashier session:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Gagal menutup sesi kasir. Silakan coba lagi.'
      });
    } finally {
      setLoading(false);
    }
  };

  const todayTransactions = getTodayTransactions();
  const todaySales = getTodaySales();
  const todayRentals = getTodayRentalPayments();

  // Calculate today's totals
  const todayTotalSales = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  const todayTotalRentals = todayRentals.reduce((sum, rental) => sum + Number(rental.total_amount), 0);
  const todayTotalRevenue = todayTotalSales + todayTotalRentals;

  // Payment method breakdown for today
  const todayCashSales = todaySales.filter(s => s.payment_method === 'cash').reduce((sum, s) => sum + s.total, 0);
  const todayCardSales = todaySales.filter(s => s.payment_method === 'card').reduce((sum, s) => sum + s.total, 0);
  const todayTransferSales = todaySales.filter(s => s.payment_method === 'transfer').reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Sesi Kasir</h1>
            <p className="text-gray-600">Kelola sesi kasir harian dan pantau transaksi</p>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {currentTime.toLocaleTimeString('id-ID', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
            <div className="text-gray-600">
              {currentTime.toLocaleDateString('id-ID', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>

        {/* Session Status */}
        <div className="mt-6">
          {!currentSession ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-yellow-900">Sesi Kasir Belum Dibuka</h3>
                    <p className="text-yellow-700 text-sm">Buka sesi kasir untuk mulai melayani transaksi</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowOpenModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpCircle className="h-5 w-5" />
                      <span>Buka Kasir</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-green-900">Sesi Kasir Aktif</h3>
                      <p className="text-green-700 text-sm">
                        Dimulai {new Date(currentSession.startTime).toLocaleString('id-ID')} • 
                        Durasi: {getSessionDuration(currentSession)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCloseModal(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownCircle className="h-5 w-5" />
                        <span>Tutup Kasir</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Session Details */}
                <div className="mt-4 bg-white rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-green-700">
                        <strong>Kasir:</strong> {currentSession.cashierName || currentUser?.full_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-green-700">
                        <strong>Saldo Awal:</strong> Rp {currentSession.openingCash.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div>
                      <p className="text-green-700">
                        <strong>Total Transaksi:</strong> {currentSession.totalTransactions || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Dashboard Stats */}
      {currentSession && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Revenue Today */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pendapatan Hari Ini</p>
                <p className="text-2xl font-bold text-gray-900">
                  Rp {todayTotalRevenue.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 font-medium">
                {todaySales.length + todayRentals.length} transaksi
              </span>
            </div>
          </div>

          {/* Cash Sales */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Penjualan Cash</p>
                <p className="text-2xl font-bold text-gray-900">
                  Rp {todayCashSales.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Banknote className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-600">
                {todaySales.filter(s => s.payment_method === 'cash').length} transaksi
              </span>
            </div>
          </div>

          {/* Card Sales */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Penjualan Card</p>
                <p className="text-2xl font-bold text-gray-900">
                  Rp {todayCardSales.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-600">
                {todaySales.filter(s => s.payment_method === 'card').length} transaksi
              </span>
            </div>
          </div>

          {/* Transfer Sales */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Transfer</p>
                <p className="text-2xl font-bold text-gray-900">
                  Rp {todayTransferSales.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Receipt className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-600">
                {todaySales.filter(s => s.payment_method === 'transfer').length} transaksi
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      {currentSession && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Transaksi Hari Ini</h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Update terakhir: {currentTime.toLocaleTimeString('id-ID')}</span>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {todayTransactions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Receipt className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Belum ada transaksi hari ini</p>
              </div>
            ) : (
              todayTransactions.map((transaction) => (
                <div key={transaction.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'sale' ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        {transaction.type === 'sale' ? (
                          <ShoppingCart className="h-5 w-5 text-green-600" />
                        ) : (
                          <Receipt className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{transaction.description}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.payment_method === 'cash' ? 'bg-green-100 text-green-800' :
                            transaction.payment_method === 'card' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {transaction.payment_method.toUpperCase()}
                          </span>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            {new Date(transaction.timestamp).toLocaleTimeString('id-ID', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                          <span className="text-sm text-gray-500">Ref: {transaction.reference_id}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        +Rp {Number(transaction.amount).toLocaleString('id-ID')}
                      </p>
                      <p className="text-sm text-gray-600 capitalize">{transaction.type}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Open Session Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Buka Sesi Kasir</h2>
              
              {/* Cashier Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Kasir</span>
                </div>
                <p className="text-blue-800">{currentUser?.full_name}</p>
                <p className="text-sm text-blue-600">{new Date().toLocaleString('id-ID')}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Saldo Awal (Rp)
                </label>
                <input
                  type="number"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan (Opsional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Catatan untuk sesi ini..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowOpenModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleOpenSession}
                  disabled={openingCash <= 0}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>Buka Kasir</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close Session Modal */}
      {showCloseModal && currentSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Tutup Sesi Kasir</h2>
              
              {/* Cashier Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Kasir</span>
                </div>
                <p className="text-blue-800">{currentUser?.full_name}</p>
                <p className="text-sm text-blue-600">{new Date().toLocaleString('id-ID')}</p>
              </div>

              {/* Session Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-gray-900 mb-2">Ringkasan Sesi</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Saldo Awal:</span>
                    <span className="font-medium">Rp {currentSession.openingCash.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Durasi:</span>
                    <span className="font-medium">{getSessionDuration(currentSession)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Transaksi:</span>
                    <span className="font-medium">{todayTransactions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expected Cash:</span>
                    <span className="font-medium">Rp {calculateExpectedCash(currentSession).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah Setoran (Rp)
                </label>
                <input
                  type="number"
                  value={closingCash}
                  onChange={(e) => setClosingCash(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                />
                {closingCash > 0 && (
                  <div className="mt-2 text-sm">
                    <span className={`font-medium ${
                      closingCash - calculateExpectedCash(currentSession) >= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      Selisih: Rp {Math.abs(closingCash - calculateExpectedCash(currentSession)).toLocaleString('id-ID')} 
                      {closingCash - calculateExpectedCash(currentSession) >= 0 ? ' (Lebih)' : ' (Kurang)'}
                    </span>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan Penutupan (Opsional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Catatan untuk penutupan sesi..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCloseModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleCloseSession}
                  disabled={closingCash <= 0}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>Tutup Kasir</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierSessionComponent;