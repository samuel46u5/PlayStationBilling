import React, { useState } from 'react';
import { Plus, Search, User, Phone, Mail, MapPin, Calendar, DollarSign, Edit, Trash2, MessageCircle, Shield, Clock, CheckCircle, XCircle, RefreshCw, LayoutGrid, List as ListIcon, Gamepad2 } from 'lucide-react';
import { mockCustomers } from '../data/mockData';

const Customers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    whatsapp: '',
    email: '',
    address: ''
  });
  const [customerView, setCustomerView] = useState<'card' | 'list'>('card');

  // OTP States
  const [otpStep, setOtpStep] = useState<'input' | 'verify' | 'verified'>('input');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const filteredCustomers = mockCustomers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  // Generate random 6-digit OTP
  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Start OTP timer countdown
  const startOtpTimer = () => {
    setOtpTimer(120); // 2 minutes
    const interval = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Format timer display
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Send OTP via WhatsApp
  const handleSendOtp = async () => {
    if (!newCustomer.whatsapp) {
      alert('Nomor WhatsApp wajib diisi');
      return;
    }

    // Validate WhatsApp number format
    const whatsappRegex = /^(\+62|62|0)[0-9]{9,13}$/;
    if (!whatsappRegex.test(newCustomer.whatsapp)) {
      alert('Format nomor WhatsApp tidak valid. Gunakan format: +62xxx, 62xxx, atau 0xxx');
      return;
    }

    setIsSendingOtp(true);
    
    try {
      // Generate OTP
      const otp = generateOTP();
      setGeneratedOtp(otp);
      
      // Simulate API call to WhatsApp service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real implementation, you would call your WhatsApp API here
      console.log(`Sending OTP ${otp} to WhatsApp: ${newCustomer.whatsapp}`);
      
      setOtpStep('verify');
      startOtpTimer();
      
      // Show success message
      alert(`Kode OTP telah dikirim ke WhatsApp ${newCustomer.whatsapp}. Silakan cek pesan masuk.`);
      
    } catch (error) {
      alert('Gagal mengirim OTP. Silakan coba lagi.');
      console.error('OTP send error:', error);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      alert('Masukkan kode OTP 6 digit');
      return;
    }

    setIsVerifying(true);
    
    try {
      // Simulate API verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (otpCode === generatedOtp) {
        setOtpStep('verified');
        alert('Nomor WhatsApp berhasil diverifikasi!');
      } else {
        alert('Kode OTP salah. Silakan coba lagi.');
        setOtpCode('');
      }
    } catch (error) {
      alert('Gagal memverifikasi OTP. Silakan coba lagi.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend OTP
  const handleResendOtp = () => {
    if (otpTimer > 0) {
      alert(`Tunggu ${formatTimer(otpTimer)} sebelum mengirim ulang`);
      return;
    }
    
    setOtpCode('');
    handleSendOtp();
  };

  const handleAddCustomer = () => {
    if (!newCustomer.name || !newCustomer.whatsapp) {
      alert('Nama dan WhatsApp wajib diisi');
      return;
    }
    
    if (otpStep !== 'verified') {
      alert('Silakan verifikasi nomor WhatsApp terlebih dahulu');
      return;
    }
    
    // Here you would normally save to database
    alert('Customer berhasil ditambahkan dengan WhatsApp terverifikasi!');
    setShowAddForm(false);
    setNewCustomer({ name: '', whatsapp: '', email: '', address: '' });
    setOtpStep('input');
    setOtpCode('');
    setGeneratedOtp('');
    setOtpTimer(0);
  };

  const handleEditCustomer = (customerId: string) => {
    // Here you would normally update the database
    alert(`Customer ${customerId} berhasil diperbarui!`);
    setShowEditForm(null);
  };

  const handleDeleteCustomer = (customerId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus customer ini?')) {
      // Here you would normally delete from database
      alert(`Customer ${customerId} berhasil dihapus!`);
    }
  };

  const handleStartRental = (customerId: string) => {
    // Here you would normally navigate to rental creation
    alert(`Memulai rental baru untuk customer ${customerId}`);
  };

  const resetForm = () => {
    setNewCustomer({ name: '', whatsapp: '', email: '', address: '' });
    setOtpStep('input');
    setOtpCode('');
    setGeneratedOtp('');
    setOtpTimer(0);
    setShowAddForm(false);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Gamepad2 className="h-10 w-10 text-blue-700" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Manajemen Customer</h1>
              <p className="text-gray-600">Kelola database customer dan riwayat rental</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCustomerView('card')}
              className={`p-2 rounded-lg border ${customerView === 'card' ? 'bg-blue-100 border-blue-400 text-blue-600' : 'border-gray-200 text-gray-400 hover:text-blue-600'}`}
              aria-label="Tampilan Card"
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCustomerView('list')}
              className={`p-2 rounded-lg border ${customerView === 'list' ? 'bg-blue-100 border-blue-400 text-blue-600' : 'border-gray-200 text-gray-400 hover:text-blue-600'}`}
              aria-label="Tampilan List"
            >
              <ListIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Tambah Customer
            </button>
          </div>
        </div>
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Cari customer berdasarkan nama atau nomor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Customer Grid/List */}
      {customerView === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <div key={customer.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-4 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{customer.name}</h3>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        customer.status === 'active' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-400 text-white'
                      }`}>
                        {customer.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-4">
                <div className="space-y-3">
                  {/* Contact Info */}
                  <div className="flex items-center gap-3 text-gray-600">
                    <MessageCircle className="h-4 w-4 flex-shrink-0 text-green-600" />
                    <span className="text-sm">{customer.phone}</span>
                  </div>

                  {customer.email && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm">{customer.email}</span>
                    </div>
                  )}

                  {customer.address && (
                    <div className="flex items-start gap-3 text-gray-600">
                      <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{customer.address}</span>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign className="h-4 w-4" />
                        <span className="text-sm">Total Belanja</span>
                      </div>
                      <span className="font-semibold text-green-600">
                        Rp {customer.totalSpent.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">Member Sejak</span>
                      </div>
                      <span className="text-sm text-gray-900">
                        {new Date(customer.joinDate).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-2">
                  <button 
                    onClick={() => setSelectedCustomer(selectedCustomer === customer.id ? null : customer.id)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Lihat Detail
                  </button>
                  <button 
                    onClick={() => setShowEditForm(customer.id)}
                    className="p-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteCustomer(customer.id)}
                    className="p-2 border border-red-300 hover:border-red-400 text-red-600 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Extended Details */}
                {selectedCustomer === customer.id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Riwayat Customer</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Customer ID:</span>
                        <span className="font-medium">{customer.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Kunjungan:</span>
                        <span className="font-medium">12 sesi</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Rata-rata Sesi:</span>
                        <span className="font-medium">2.5 jam</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Console Favorit:</span>
                        <span className="font-medium">PlayStation 5</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleStartRental(customer.id)}
                      className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Mulai Rental Baru
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">WhatsApp</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alamat</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Belanja</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member Sejak</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-gray-400 py-6">
                    Tidak ada data customer ditemukan.
                  </td>
                </tr>
              )}
              {filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{customer.name}</td>
                  <td className="px-4 py-3">{customer.phone}</td>
                  <td className="px-4 py-3">{customer.email || '-'}</td>
                  <td className="px-4 py-3">{customer.address || '-'}</td>
                  <td className="px-4 py-3 text-green-600 font-semibold">Rp {customer.totalSpent.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3">{new Date(customer.joinDate).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${customer.status === 'active' ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}>{customer.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelectedCustomer(selectedCustomer === customer.id ? null : customer.id)} className="p-1 text-gray-400 hover:text-blue-600 transition-colors"><User className="h-4 w-4" /></button>
                      <button onClick={() => setShowEditForm(customer.id)} className="p-1 text-gray-400 hover:text-blue-600 transition-colors"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => handleDeleteCustomer(customer.id)} className="p-1 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Tambah Customer Baru</h2>
              
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Masukkan nama customer"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor WhatsApp *
                    {otpStep === 'verified' && (
                      <span className="ml-2 inline-flex items-center gap-1 text-green-600 text-xs">
                        <CheckCircle className="h-3 w-3" />
                        Terverifikasi
                      </span>
                    )}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={newCustomer.whatsapp}
                      onChange={(e) => {
                        setNewCustomer({...newCustomer, whatsapp: e.target.value});
                        if (otpStep !== 'input') {
                          setOtpStep('input');
                          setOtpCode('');
                          setGeneratedOtp('');
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+62 8xx-xxxx-xxxx"
                      disabled={otpStep === 'verified'}
                    />
                    {otpStep === 'input' && (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isSendingOtp || !newCustomer.whatsapp}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                      >
                        {isSendingOtp ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <MessageCircle className="h-4 w-4" />
                        )}
                        {isSendingOtp ? 'Mengirim...' : 'Kirim OTP'}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Format: +62xxx, 62xxx, atau 0xxx
                  </p>
                </div>

                {/* OTP Verification Section */}
                {otpStep === 'verify' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <h4 className="font-medium text-blue-900">Verifikasi WhatsApp</h4>
                    </div>
                    
                    <p className="text-sm text-blue-800 mb-3">
                      Kode OTP telah dikirim ke WhatsApp <strong>{newCustomer.whatsapp}</strong>
                    </p>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-1">
                          Masukkan Kode OTP (6 digit)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-mono text-lg"
                            placeholder="000000"
                            maxLength={6}
                          />
                          <button
                            type="button"
                            onClick={handleVerifyOtp}
                            disabled={isVerifying || otpCode.length !== 6}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                          >
                            {isVerifying ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              'Verifikasi'
                            )}
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-blue-600">
                          <Clock className="h-4 w-4" />
                          <span>
                            {otpTimer > 0 ? `Kirim ulang dalam ${formatTimer(otpTimer)}` : 'Kode expired'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={otpTimer > 0}
                          className="text-blue-600 hover:text-blue-700 disabled:text-gray-400 font-medium"
                        >
                          Kirim Ulang
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success Verification */}
                {otpStep === 'verified' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-900">WhatsApp Terverifikasi</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Nomor WhatsApp {newCustomer.whatsapp} telah berhasil diverifikasi
                    </p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email (Opsional)</label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="customer@email.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alamat (Opsional)</label>
                  <textarea
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Masukkan alamat customer"
                  />
                </div>
              </form>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={handleAddCustomer}
                  disabled={otpStep !== 'verified'}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Tambah Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Customer</h2>
              
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    defaultValue={mockCustomers.find(c => c.id === showEditForm)?.name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nomor WhatsApp</label>
                  <input
                    type="tel"
                    defaultValue={mockCustomers.find(c => c.id === showEditForm)?.phone}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    defaultValue={mockCustomers.find(c => c.id === showEditForm)?.email}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                  <textarea
                    defaultValue={mockCustomers.find(c => c.id === showEditForm)?.address}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
              </form>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEditForm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={() => handleEditCustomer(showEditForm)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Perbarui Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;