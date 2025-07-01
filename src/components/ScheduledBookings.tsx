import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, User, Gamepad2, DollarSign, Search, Filter, Eye, Edit, Trash2, CheckCircle, XCircle, AlertCircle, Phone, Mail } from 'lucide-react';
import { mockScheduledBookings, mockCustomers, mockConsoles } from '../data/mockData';
import { ScheduledBooking, CalendarEvent } from '../types';

const ScheduledBookings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'list' | 'today'>('calendar');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showBookingDetails, setShowBookingDetails] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [consoleFilter, setConsoleFilter] = useState<string>('all');
  const [currentTime, setCurrentTime] = useState(new Date());

  const [newBooking, setNewBooking] = useState({
    customerId: '',
    consoleId: '',
    scheduledDate: '',
    scheduledTime: '',
    duration: 2,
    notes: '',
    depositAmount: 0
  });

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const statusOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'confirmed', label: 'Terkonfirmasi' },
    { value: 'in-progress', label: 'Sedang Berlangsung' },
    { value: 'completed', label: 'Selesai' },
    { value: 'cancelled', label: 'Dibatalkan' },
    { value: 'no-show', label: 'Tidak Datang' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no-show': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'in-progress': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      case 'no-show': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredBookings = mockScheduledBookings.filter(booking => {
    const customer = mockCustomers.find(c => c.id === booking.customerId);
    const console = mockConsoles.find(c => c.id === booking.consoleId);
    
    const matchesSearch = customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer?.phone.includes(searchTerm) ||
                         booking.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesConsole = consoleFilter === 'all' || booking.consoleId === consoleFilter;
    
    return matchesSearch && matchesStatus && matchesConsole;
  });

  const todayBookings = mockScheduledBookings.filter(booking => {
    const bookingDate = new Date(booking.scheduledDate);
    const today = new Date();
    return bookingDate.toDateString() === today.toDateString();
  });

  // Generate calendar events
  const generateCalendarEvents = (): CalendarEvent[] => {
    return mockScheduledBookings.map(booking => {
      const customer = mockCustomers.find(c => c.id === booking.customerId);
      const console = mockConsoles.find(c => c.id === booking.consoleId);
      const startDateTime = new Date(`${booking.scheduledDate}T${booking.scheduledTime}`);
      const endDateTime = new Date(startDateTime.getTime() + (booking.duration * 60 * 60 * 1000));
      
      return {
        id: booking.id,
        title: `${customer?.name} - ${console?.name}`,
        start: startDateTime,
        end: endDateTime,
        type: 'booking' as const,
        status: booking.status,
        consoleId: booking.consoleId,
        customerId: booking.customerId,
        color: booking.status === 'confirmed' ? '#3B82F6' :
               booking.status === 'in-progress' ? '#10B981' :
               booking.status === 'cancelled' ? '#EF4444' :
               booking.status === 'no-show' ? '#F59E0B' : '#6B7280'
      };
    });
  };

  const handleCreateBooking = () => {
    if (!newBooking.customerId || !newBooking.consoleId || !newBooking.scheduledDate || !newBooking.scheduledTime) {
      alert('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    // Check for conflicts
    const startDateTime = new Date(`${newBooking.scheduledDate}T${newBooking.scheduledTime}`);
    const endDateTime = new Date(startDateTime.getTime() + (newBooking.duration * 60 * 60 * 1000));
    
    const hasConflict = mockScheduledBookings.some(booking => {
      if (booking.consoleId !== newBooking.consoleId || booking.status === 'cancelled') return false;
      
      const existingStart = new Date(`${booking.scheduledDate}T${booking.scheduledTime}`);
      const existingEnd = new Date(existingStart.getTime() + (booking.duration * 60 * 60 * 1000));
      
      return (startDateTime < existingEnd && endDateTime > existingStart);
    });

    if (hasConflict) {
      alert('Waktu yang dipilih bentrok dengan booking lain. Silakan pilih waktu yang berbeda.');
      return;
    }

    alert('Booking berhasil dibuat!');
    setShowBookingForm(false);
    setNewBooking({
      customerId: '',
      consoleId: '',
      scheduledDate: '',
      scheduledTime: '',
      duration: 2,
      notes: '',
      depositAmount: 0
    });
  };

  const handleStartBooking = (bookingId: string) => {
    alert(`Memulai sesi rental untuk booking ${bookingId}`);
  };

  const handleCancelBooking = (bookingId: string) => {
    if (confirm('Apakah Anda yakin ingin membatalkan booking ini?')) {
      alert(`Booking ${bookingId} dibatalkan`);
    }
  };

  const renderCalendarView = () => {
    const events = generateCalendarEvents();
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    
    // Get first day of month and number of days
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Generate calendar days
    const calendarDays = [];
    
    // Previous month days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(currentYear, currentMonth, -i);
      calendarDays.push({
        date: prevDate,
        isCurrentMonth: false,
        events: []
      });
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dayEvents = events.filter(event => 
        event.start.toDateString() === date.toDateString()
      );
      
      calendarDays.push({
        date,
        isCurrentMonth: true,
        events: dayEvents
      });
    }
    
    // Next month days to fill the grid
    const remainingDays = 42 - calendarDays.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(currentYear, currentMonth + 1, day);
      calendarDays.push({
        date: nextDate,
        isCurrentMonth: false,
        events: []
      });
    }

    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {monthNames[currentMonth]} {currentYear}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedDate(new Date(currentYear, currentMonth - 1, 1))}
              className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ‹
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Hari Ini
            </button>
            <button
              onClick={() => setSelectedDate(new Date(currentYear, currentMonth + 1, 1))}
              className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ›
            </button>
          </div>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`min-h-[100px] p-2 border border-gray-100 ${
                day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
              } ${
                day.date.toDateString() === new Date().toDateString() 
                  ? 'bg-blue-50 border-blue-200' 
                  : ''
              }`}
            >
              <div className={`text-sm font-medium mb-1 ${
                day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {day.date.getDate()}
              </div>
              
              {/* Events */}
              <div className="space-y-1">
                {day.events.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    className="text-xs p-1 rounded text-white cursor-pointer hover:opacity-80"
                    style={{ backgroundColor: event.color }}
                    onClick={() => setShowBookingDetails(event.id)}
                  >
                    <div className="truncate">
                      {event.start.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - {event.title}
                    </div>
                  </div>
                ))}
                {day.events.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{day.events.length - 3} lainnya
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderListView = () => (
    <div className="space-y-4">
      {filteredBookings.map(booking => {
        const customer = mockCustomers.find(c => c.id === booking.customerId);
        const console = mockConsoles.find(c => c.id === booking.consoleId);
        const scheduledDateTime = new Date(`${booking.scheduledDate}T${booking.scheduledTime}`);
        const endDateTime = new Date(scheduledDateTime.getTime() + (booking.duration * 60 * 60 * 1000));
        
        return (
          <div key={booking.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">#{booking.id}</h3>
                  <p className="text-gray-600">{customer?.name}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                  {getStatusIcon(booking.status)}
                  {booking.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Gamepad2 className="h-4 w-4" />
                <div>
                  <p className="text-xs">Console</p>
                  <p className="font-medium text-gray-900">{console?.name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <div>
                  <p className="text-xs">Tanggal & Waktu</p>
                  <p className="font-medium text-gray-900">
                    {scheduledDateTime.toLocaleDateString('id-ID')} {scheduledDateTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <div>
                  <p className="text-xs">Durasi</p>
                  <p className="font-medium text-gray-900">{booking.duration} jam</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-gray-600">
                <DollarSign className="h-4 w-4" />
                <div>
                  <p className="text-xs">Total</p>
                  <p className="font-medium text-gray-900">Rp {booking.totalAmount.toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowBookingDetails(booking.id)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Detail
              </button>
              
              {booking.status === 'confirmed' && (
                <button 
                  onClick={() => handleStartBooking(booking.id)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Mulai Sesi
                </button>
              )}
              
              {(booking.status === 'confirmed' || booking.status === 'in-progress') && (
                <button 
                  onClick={() => handleCancelBooking(booking.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Batalkan
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderTodayView = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Booking Hari Ini - {new Date().toLocaleDateString('id-ID', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </h2>
        
        {todayBookings.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Tidak ada booking untuk hari ini</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todayBookings
              .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))
              .map(booking => {
                const customer = mockCustomers.find(c => c.id === booking.customerId);
                const console = mockConsoles.find(c => c.id === booking.consoleId);
                const scheduledDateTime = new Date(`${booking.scheduledDate}T${booking.scheduledTime}`);
                const endDateTime = new Date(scheduledDateTime.getTime() + (booking.duration * 60 * 60 * 1000));
                const isUpcoming = scheduledDateTime > currentTime;
                const isOngoing = scheduledDateTime <= currentTime && endDateTime > currentTime;
                
                return (
                  <div key={booking.id} className={`p-4 rounded-lg border-l-4 ${
                    isOngoing ? 'border-green-500 bg-green-50' :
                    isUpcoming ? 'border-blue-500 bg-blue-50' :
                    'border-gray-300 bg-gray-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">
                            {scheduledDateTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-sm text-gray-600">
                            {endDateTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{customer?.name}</h4>
                          <p className="text-sm text-gray-600">{console?.name} - {booking.duration} jam</p>
                          <p className="text-sm font-medium text-gray-900">Rp {booking.totalAmount.toLocaleString('id-ID')}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)}
                          {isOngoing ? 'BERLANGSUNG' : booking.status.toUpperCase()}
                        </span>
                        
                        {booking.status === 'confirmed' && (
                          <button 
                            onClick={() => handleStartBooking(booking.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                          >
                            Mulai
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Pemesanan Terjadwal</h1>
            <p className="text-gray-600">Kelola booking dan jadwal rental PlayStation</p>
          </div>
          <button
            onClick={() => setShowBookingForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Buat Booking
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg mb-6">
          {[
            { id: 'calendar', label: 'Kalender', icon: Calendar },
            { id: 'today', label: 'Hari Ini', icon: Clock },
            { id: 'list', label: 'Daftar Booking', icon: User }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${
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

        {/* Filters for List View */}
        {activeTab === 'list' && (
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Cari customer, booking ID..."
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
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select
              value={consoleFilter}
              onChange={(e) => setConsoleFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Semua Console</option>
              {mockConsoles.map(console => (
                <option key={console.id} value={console.id}>{console.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'calendar' && renderCalendarView()}
      {activeTab === 'list' && renderListView()}
      {activeTab === 'today' && renderTodayView()}

      {/* Create Booking Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Buat Booking Baru</h2>
              
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
                    <select
                      value={newBooking.customerId}
                      onChange={(e) => setNewBooking({...newBooking, customerId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Pilih Customer</option>
                      {mockCustomers.map(customer => (
                        <option key={customer.id} value={customer.id}>{customer.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Console *</label>
                    <select
                      value={newBooking.consoleId}
                      onChange={(e) => setNewBooking({...newBooking, consoleId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Pilih Console</option>
                      {mockConsoles.filter(c => c.status === 'available').map(console => (
                        <option key={console.id} value={console.id}>
                          {console.name} - Rp {console.hourlyRate.toLocaleString('id-ID')}/jam
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal *</label>
                    <input
                      type="date"
                      value={newBooking.scheduledDate}
                      onChange={(e) => setNewBooking({...newBooking, scheduledDate: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Waktu *</label>
                    <input
                      type="time"
                      value={newBooking.scheduledTime}
                      onChange={(e) => setNewBooking({...newBooking, scheduledTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Durasi (jam) *</label>
                    <input
                      type="number"
                      value={newBooking.duration}
                      onChange={(e) => setNewBooking({...newBooking, duration: Number(e.target.value)})}
                      min="1"
                      max="12"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deposit (Opsional)</label>
                    <input
                      type="number"
                      value={newBooking.depositAmount}
                      onChange={(e) => setNewBooking({...newBooking, depositAmount: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (Opsional)</label>
                  <textarea
                    value={newBooking.notes}
                    onChange={(e) => setNewBooking({...newBooking, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Catatan tambahan untuk booking ini"
                  />
                </div>

                {/* Booking Summary */}
                {newBooking.consoleId && newBooking.duration && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Ringkasan Booking</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Console:</span>
                        <span>{mockConsoles.find(c => c.id === newBooking.consoleId)?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Durasi:</span>
                        <span>{newBooking.duration} jam</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tarif per jam:</span>
                        <span>Rp {mockConsoles.find(c => c.id === newBooking.consoleId)?.hourlyRate.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between font-medium border-t border-gray-200 pt-2">
                        <span>Total:</span>
                        <span>Rp {((mockConsoles.find(c => c.id === newBooking.consoleId)?.hourlyRate || 0) * newBooking.duration).toLocaleString('id-ID')}</span>
                      </div>
                      {newBooking.depositAmount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Deposit:</span>
                          <span>Rp {newBooking.depositAmount.toLocaleString('id-ID')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </form>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowBookingForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={handleCreateBooking}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Buat Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {showBookingDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {(() => {
                const booking = mockScheduledBookings.find(b => b.id === showBookingDetails);
                const customer = mockCustomers.find(c => c.id === booking?.customerId);
                const console = mockConsoles.find(c => c.id === booking?.consoleId);
                
                if (!booking) return null;
                
                const scheduledDateTime = new Date(`${booking.scheduledDate}T${booking.scheduledTime}`);
                const endDateTime = new Date(scheduledDateTime.getTime() + (booking.duration * 60 * 60 * 1000));
                
                return (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Detail Booking #{booking.id}</h2>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        {booking.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-6">
                      {/* Customer Info */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-3">Informasi Customer</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Nama</p>
                            <p className="font-medium">{customer?.name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Telepon</p>
                            <p className="font-medium">{customer?.phone}</p>
                          </div>
                          {customer?.email && (
                            <div>
                              <p className="text-sm text-gray-600">Email</p>
                              <p className="font-medium">{customer.email}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Booking Details */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-3">Detail Booking</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Console</p>
                            <p className="font-medium">{console?.name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Tanggal</p>
                            <p className="font-medium">{scheduledDateTime.toLocaleDateString('id-ID')}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Waktu Mulai</p>
                            <p className="font-medium">{scheduledDateTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Waktu Selesai</p>
                            <p className="font-medium">{endDateTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Durasi</p>
                            <p className="font-medium">{booking.duration} jam</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Total Biaya</p>
                            <p className="font-medium">Rp {booking.totalAmount.toLocaleString('id-ID')}</p>
                          </div>
                        </div>
                      </div>

                      {/* Payment Info */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-3">Informasi Pembayaran</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Status Pembayaran</p>
                            <p className="font-medium">{booking.paymentStatus}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Deposit</p>
                            <p className="font-medium">Rp {booking.depositAmount.toLocaleString('id-ID')}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Sisa Pembayaran</p>
                            <p className="font-medium">Rp {booking.remainingAmount.toLocaleString('id-ID')}</p>
                          </div>
                        </div>
                      </div>

                      {booking.notes && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-medium text-gray-900 mb-2">Catatan</h3>
                          <p className="text-gray-700">{booking.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => setShowBookingDetails(null)}
                        className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                      >
                        Tutup
                      </button>
                      
                      {booking.status === 'confirmed' && (
                        <button 
                          onClick={() => {
                            handleStartBooking(booking.id);
                            setShowBookingDetails(null);
                          }}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          Mulai Sesi
                        </button>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Calendar className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{mockScheduledBookings.length}</h3>
          <p className="text-gray-600 text-sm">Total Booking</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {mockScheduledBookings.filter(b => b.status === 'confirmed').length}
          </h3>
          <p className="text-gray-600 text-sm">Terkonfirmasi</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Clock className="h-6 w-6 text-orange-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{todayBookings.length}</h3>
          <p className="text-gray-600 text-sm">Booking Hari Ini</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <DollarSign className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            Rp {mockScheduledBookings.reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString('id-ID')}
          </h3>
          <p className="text-gray-600 text-sm">Total Revenue</p>
        </div>
      </div>
    </div>
  );
};

export default ScheduledBookings;