import React, { useState } from 'react';
import { Plus, Search, Wrench, Calendar, User, DollarSign, Clock, CheckCircle, AlertCircle, XCircle, Eye, Edit, Trash2, Package, FileText, TrendingUp, BarChart3, Filter, Download, Printer } from 'lucide-react';
import { mockMaintenanceTransactions, mockConsoles, mockTechnicians, mockSpareparts, mockMaintenanceHistory } from '../data/mockData';

const MaintenanceManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'history' | 'reports'>('transactions');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [technicianFilter, setTechnicianFilter] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showTransactionDetails, setShowTransactionDetails] = useState<string | null>(null);
  const [selectedConsole, setSelectedConsole] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const [newTransaction, setNewTransaction] = useState({
    consoleId: '',
    technicianId: '',
    issueDescription: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    serviceDate: new Date().toISOString().split('T')[0],
    laborCost: 0,
    additionalServiceFees: 0,
    serviceNotes: '',
    partsUsed: [] as Array<{
      sparepartId: string;
      quantityUsed: number;
      oldPartNotes: string;
      installationNotes: string;
    }>
  });

  const statusOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'scheduled', label: 'Terjadwal' },
    { value: 'in-progress', label: 'Sedang Dikerjakan' },
    { value: 'completed', label: 'Selesai' },
    { value: 'cancelled', label: 'Dibatalkan' },
    { value: 'on-hold', label: 'Ditunda' }
  ];

  const priorityOptions = [
    { value: 'all', label: 'Semua Prioritas' },
    { value: 'low', label: 'Rendah' },
    { value: 'medium', label: 'Sedang' },
    { value: 'high', label: 'Tinggi' },
    { value: 'urgent', label: 'Mendesak' }
  ];

  const filteredTransactions = mockMaintenanceTransactions.filter(transaction => {
    const console = mockConsoles.find(c => c.id === transaction.consoleId);
    const technician = mockTechnicians.find(t => t.id === transaction.technicianId);
    
    const matchesSearch = transaction.transactionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.issueDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         console?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         technician?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || transaction.serviceStatus === statusFilter;
    const matchesPriority = priorityFilter === 'all' || transaction.priority === priorityFilter;
    const matchesTechnician = technicianFilter === 'all' || transaction.technicianId === technicianFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesTechnician;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'on-hold': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Calendar className="h-4 w-4" />;
      case 'in-progress': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      case 'on-hold': return <AlertCircle className="h-4 w-4" />;
      default: return <Wrench className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const addPartToTransaction = () => {
    setNewTransaction(prev => ({
      ...prev,
      partsUsed: [...prev.partsUsed, {
        sparepartId: '',
        quantityUsed: 1,
        oldPartNotes: '',
        installationNotes: ''
      }]
    }));
  };

  const updatePartUsage = (index: number, field: string, value: any) => {
    setNewTransaction(prev => ({
      ...prev,
      partsUsed: prev.partsUsed.map((part, i) => 
        i === index ? { ...part, [field]: value } : part
      )
    }));
  };

  const removePartUsage = (index: number) => {
    setNewTransaction(prev => ({
      ...prev,
      partsUsed: prev.partsUsed.filter((_, i) => i !== index)
    }));
  };

  const handleCreateTransaction = () => {
    if (!newTransaction.consoleId || !newTransaction.technicianId || !newTransaction.issueDescription) {
      alert('Console, teknisi, dan deskripsi masalah wajib diisi');
      return;
    }
    
    const transactionNumber = `MNT-2024-${String(mockMaintenanceTransactions.length + 1).padStart(3, '0')}`;
    alert(`Transaksi maintenance ${transactionNumber} berhasil dibuat!`);
    setShowCreateForm(false);
    setNewTransaction({
      consoleId: '',
      technicianId: '',
      issueDescription: '',
      priority: 'medium',
      serviceDate: new Date().toISOString().split('T')[0],
      laborCost: 0,
      additionalServiceFees: 0,
      serviceNotes: '',
      partsUsed: []
    });
  };

  const renderTransactionsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transaksi Maintenance</h2>
          <p className="text-gray-600">Kelola reparasi dan maintenance hardware</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Buat Transaksi
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Cari transaksi, console, atau teknisi..."
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
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {priorityOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <select
          value={technicianFilter}
          onChange={(e) => setTechnicianFilter(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Semua Teknisi</option>
          {mockTechnicians.map(technician => (
            <option key={technician.id} value={technician.id}>{technician.name}</option>
          ))}
        </select>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {filteredTransactions.map((transaction) => {
          const console = mockConsoles.find(c => c.id === transaction.consoleId);
          const technician = mockTechnicians.find(t => t.id === transaction.technicianId);
          
          return (
            <div key={transaction.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Wrench className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{transaction.transactionNumber}</h3>
                    <p className="text-gray-600">{console?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(transaction.serviceStatus)}`}>
                    {getStatusIcon(transaction.serviceStatus)}
                    {transaction.serviceStatus.toUpperCase()}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(transaction.priority)}`}>
                    {transaction.priority.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="h-4 w-4" />
                  <div>
                    <p className="text-xs">Teknisi</p>
                    <p className="font-medium text-gray-900">{technician?.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <div>
                    <p className="text-xs">Tanggal Service</p>
                    <p className="font-medium text-gray-900">{new Date(transaction.serviceDate).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="h-4 w-4" />
                  <div>
                    <p className="text-xs">Total Biaya</p>
                    <p className="font-medium text-gray-900">Rp {transaction.totalRepairCost.toLocaleString('id-ID')}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-gray-600">
                  <Package className="h-4 w-4" />
                  <div>
                    <p className="text-xs">Sparepart Digunakan</p>
                    <p className="font-medium text-gray-900">{transaction.partsUsed.length} item</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 font-medium mb-1">Deskripsi Masalah:</p>
                <p className="text-sm">{transaction.issueDescription}</p>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowTransactionDetails(showTransactionDetails === transaction.id ? null : transaction.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Detail
                </button>
                
                {transaction.serviceStatus === 'scheduled' && (
                  <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    Mulai Pengerjaan
                  </button>
                )}
                
                {transaction.serviceStatus === 'in-progress' && (
                  <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    Selesaikan
                  </button>
                )}
                
                {(transaction.serviceStatus === 'scheduled' || transaction.serviceStatus === 'in-progress') && (
                  <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    Batalkan
                  </button>
                )}
              </div>

              {/* Extended Details */}
              {showTransactionDetails === transaction.id && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4">Detail Transaksi Maintenance</h4>
                  
                  {/* Parts Used */}
                  <div className="mb-6">
                    <h5 className="font-medium text-gray-900 mb-3">Sparepart yang Digunakan</h5>
                    <div className="space-y-4">
                      {transaction.partsUsed.map((part, index) => {
                        const sparepart = mockSpareparts.find(s => s.id === part.sparepartId);
                        return (
                          <div key={index} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-blue-600" />
                                <span className="font-medium text-gray-900">{part.sparepartName}</span>
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                Rp {part.totalCost.toLocaleString('id-ID')}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">Part Number:</p>
                                <p className="font-medium">{part.partNumber || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Kategori:</p>
                                <p className="font-medium">{part.category}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Jumlah:</p>
                                <p className="font-medium">{part.quantityUsed} unit</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Harga Satuan:</p>
                                <p className="font-medium">Rp {part.unitCost.toLocaleString('id-ID')}</p>
                              </div>
                            </div>
                            
                            {part.oldPartCondition && (
                              <div className="mt-3">
                                <p className="text-gray-600 text-sm">Kondisi Part Lama:</p>
                                <p className="text-sm">{part.oldPartCondition}</p>
                              </div>
                            )}
                            
                            {part.installationNotes && (
                              <div className="mt-3">
                                <p className="text-gray-600 text-sm">Catatan Instalasi:</p>
                                <p className="text-sm">{part.installationNotes}</p>
                              </div>
                            )}
                            
                            {part.partWarrantyExpiry && (
                              <div className="mt-3 text-sm">
                                <span className="text-gray-600">Garansi Part:</span>
                                <span className="ml-2 font-medium">{part.partWarrantyPeriod} bulan (s/d {new Date(part.partWarrantyExpiry).toLocaleDateString('id-ID')})</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Cost Breakdown */}
                  <div className="mb-6">
                    <h5 className="font-medium text-gray-900 mb-3">Rincian Biaya</h5>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Biaya Jasa:</span>
                          <span className="font-medium">Rp {transaction.laborCost.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Biaya Tambahan:</span>
                          <span className="font-medium">Rp {transaction.additionalServiceFees.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Sparepart:</span>
                          <span className="font-medium">Rp {transaction.totalPartsCost.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between border-t border-gray-300 pt-2 font-bold">
                          <span>Total Biaya:</span>
                          <span>Rp {transaction.totalRepairCost.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Payment & Warranty */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">Informasi Pembayaran</h5>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status Pembayaran:</span>
                            <span className={`font-medium ${
                              transaction.paymentStatus === 'paid' ? 'text-green-600' : 
                              transaction.paymentStatus === 'pending' ? 'text-red-600' : 
                              'text-blue-600'
                            }`}>
                              {transaction.paymentStatus === 'paid' ? 'LUNAS' : 
                               transaction.paymentStatus === 'pending' ? 'BELUM DIBAYAR' : 
                               transaction.paymentStatus === 'warranty' ? 'GARANSI' : 'ASURANSI'}
                            </span>
                          </div>
                          {transaction.paymentStatus === 'paid' && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Tanggal Pembayaran:</span>
                              <span className="font-medium">{new Date(transaction.completedDate || transaction.serviceDate).toLocaleDateString('id-ID')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">Informasi Garansi</h5>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="space-y-2 text-sm">
                          {transaction.warrantyType ? (
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Tipe Garansi:</span>
                                <span className="font-medium">
                                  {transaction.warrantyType === 'manufacturer' ? 'Garansi Pabrik' : 
                                   transaction.warrantyType === 'service' ? 'Garansi Service' : 'Garansi Tambahan'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Berlaku Hingga:</span>
                                <span className="font-medium">{transaction.warrantyExpiry ? new Date(transaction.warrantyExpiry).toLocaleDateString('id-ID') : '-'}</span>
                              </div>
                            </>
                          ) : (
                            <p className="text-gray-600">Tidak ada informasi garansi</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Service Notes & Test Results */}
                  <div className="mb-6">
                    <h5 className="font-medium text-gray-900 mb-3">Catatan Service</h5>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm">{transaction.serviceNotes}</p>
                      
                      {transaction.testResults && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-gray-600 text-sm font-medium mb-1">Hasil Testing:</p>
                          <p className="text-sm">{transaction.testResults}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Photos */}
                  {(transaction.beforePhotos?.length || transaction.afterPhotos?.length) && (
                    <div className="mb-6">
                      <h5 className="font-medium text-gray-900 mb-3">Dokumentasi</h5>
                      <div className="grid grid-cols-2 gap-4">
                        {transaction.beforePhotos && transaction.beforePhotos.length > 0 && (
                          <div>
                            <p className="text-gray-600 text-sm mb-2">Sebelum Perbaikan:</p>
                            <div className="grid grid-cols-2 gap-2">
                              {transaction.beforePhotos.map((photo, index) => (
                                <div key={`before-${index}`} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                  <img 
                                    src={photo} 
                                    alt={`Before repair ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {transaction.afterPhotos && transaction.afterPhotos.length > 0 && (
                          <div>
                            <p className="text-gray-600 text-sm mb-2">Setelah Perbaikan:</p>
                            <div className="grid grid-cols-2 gap-2">
                              {transaction.afterPhotos.map((photo, index) => (
                                <div key={`after-${index}`} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                  <img 
                                    src={photo} 
                                    alt={`After repair ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Audit Trail */}
                  <div>
                    <h5 className="font-medium text-gray-900 mb-3">Audit Trail</h5>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Dibuat oleh:</span>
                          <span className="font-medium">{transaction.createdBy}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Dibuat pada:</span>
                          <span className="font-medium">{new Date(transaction.createdAt).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Terakhir diupdate oleh:</span>
                          <span className="font-medium">{transaction.updatedBy}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Terakhir diupdate pada:</span>
                          <span className="font-medium">{new Date(transaction.updatedAt).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="mt-6 flex gap-3">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
                      <Printer className="h-4 w-4" />
                      Cetak Laporan
                    </button>
                    
                    {transaction.serviceStatus !== 'completed' && transaction.serviceStatus !== 'cancelled' && (
                      <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
                        <Edit className="h-4 w-4" />
                        Edit Transaksi
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Riwayat Maintenance</h2>
          <p className="text-gray-600">Lihat riwayat maintenance per console</p>
        </div>
        <select
          value={selectedConsole}
          onChange={(e) => setSelectedConsole(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Pilih Console</option>
          {mockConsoles.map(console => (
            <option key={console.id} value={console.id}>{console.name}</option>
          ))}
        </select>
      </div>

      {selectedConsole ? (
        (() => {
          const console = mockConsoles.find(c => c.id === selectedConsole);
          const history = mockMaintenanceHistory.find(h => h.consoleId === selectedConsole);
          const transactions = mockMaintenanceTransactions.filter(t => t.consoleId === selectedConsole);
          
          if (!console || !history) {
            return (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-yellow-800 mb-2">Tidak Ada Riwayat Maintenance</h3>
                <p className="text-yellow-700">Console ini belum memiliki riwayat maintenance.</p>
              </div>
            );
          }
          
          return (
            <div className="space-y-6">
              {/* Console Info */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Wrench className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{console.name}</h3>
                    <p className="text-gray-600">{console.serialNumber}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        history.warrantyStatus === 'active' ? 'bg-green-100 text-green-800' :
                        history.warrantyStatus === 'expired' ? 'bg-red-100 text-red-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {history.warrantyStatus === 'active' ? 'GARANSI AKTIF' :
                         history.warrantyStatus === 'expired' ? 'GARANSI EXPIRED' :
                         'GARANSI VOID'}
                      </span>
                      {history.nextScheduledMaintenance && (
                        <span className="text-xs text-gray-500">
                          Maintenance terjadwal: {new Date(history.nextScheduledMaintenance).toLocaleDateString('id-ID')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Wrench className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Total Maintenance</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{history.totalMaintenanceCount}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">Total Biaya</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">Rp {history.totalMaintenanceCost.toLocaleString('id-ID')}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700">Terakhir Maintenance</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {history.lastMaintenanceDate ? new Date(history.lastMaintenanceDate).toLocaleDateString('id-ID') : '-'}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-gray-700">Rata-rata Biaya</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">Rp {history.averageRepairCost.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </div>
              
              {/* Common Issues */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Masalah Umum</h3>
                <div className="space-y-4">
                  {history.commonIssues.map((issue, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{issue.issue}</p>
                        <p className="text-sm text-gray-600">
                          Frekuensi: {issue.frequency} kali | Terakhir: {new Date(issue.lastOccurrence).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">Rp {issue.averageCost.toLocaleString('id-ID')}</p>
                        <p className="text-sm text-gray-600">Rata-rata biaya</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Parts Replacement History */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Riwayat Penggantian Sparepart</h3>
                {history.partsReplacementHistory.length > 0 ? (
                  <div className="space-y-4">
                    {history.partsReplacementHistory.map((part, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{part.sparepartName}</p>
                          <p className="text-sm text-gray-600">
                            Diganti {part.replacementCount} kali | Terakhir: {new Date(part.lastReplacement).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">Rp {part.totalCost.toLocaleString('id-ID')}</p>
                          {part.averageLifespan && (
                            <p className="text-sm text-gray-600">Umur rata-rata: {Math.round(part.averageLifespan / 30)} bulan</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-4">Belum ada penggantian sparepart</p>
                )}
              </div>
              
              {/* Maintenance Timeline */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline Maintenance</h3>
                <div className="space-y-6">
                  {transactions.sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime()).map((transaction, index) => (
                    <div key={transaction.id} className="relative pl-8">
                      {/* Timeline dot and line */}
                      <div className="absolute left-0 top-0 h-full">
                        <div className="w-4 h-4 rounded-full bg-blue-500 z-10 relative"></div>
                        {index < transactions.length - 1 && (
                          <div className="absolute top-4 left-2 w-0.5 h-full -mt-2 bg-gray-200"></div>
                        )}
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{transaction.transactionNumber}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.serviceStatus)}`}>
                              {transaction.serviceStatus.toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm text-gray-600">{new Date(transaction.serviceDate).toLocaleDateString('id-ID')}</span>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-2">{transaction.issueDescription}</p>
                        
                        {transaction.partsUsed.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-600 mb-1">Sparepart yang diganti:</p>
                            <div className="flex flex-wrap gap-1">
                              {transaction.partsUsed.map((part, idx) => (
                                <span key={idx} className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                                  {part.sparepartName}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                          <span className="text-sm text-gray-600">Teknisi: {transaction.technicianName}</span>
                          <span className="font-medium text-gray-900">Rp {transaction.totalRepairCost.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <Wrench className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-blue-800 mb-2">Pilih Console</h3>
          <p className="text-blue-700">Silakan pilih console untuk melihat riwayat maintenance.</p>
        </div>
      )}
    </div>
  );

  const renderReportsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Laporan Maintenance</h2>
          <p className="text-gray-600">Analisis dan laporan maintenance hardware</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="week">Minggu Ini</option>
            <option value="month">Bulan Ini</option>
            <option value="quarter">Kuartal Ini</option>
            <option value="year">Tahun Ini</option>
          </select>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Wrench className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{mockMaintenanceTransactions.length}</h3>
          <p className="text-gray-600 text-sm">Total Transaksi</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            Rp {mockMaintenanceTransactions.reduce((sum, t) => sum + t.totalRepairCost, 0).toLocaleString('id-ID')}
          </h3>
          <p className="text-gray-600 text-sm">Total Biaya</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Package className="h-6 w-6 text-yellow-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {mockMaintenanceTransactions.reduce((sum, t) => sum + t.partsUsed.length, 0)}
          </h3>
          <p className="text-gray-600 text-sm">Total Sparepart</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            Rp {Math.round(mockMaintenanceTransactions.reduce((sum, t) => sum + t.totalRepairCost, 0) / mockMaintenanceTransactions.length).toLocaleString('id-ID')}
          </h3>
          <p className="text-gray-600 text-sm">Rata-rata Biaya</p>
        </div>
      </div>

      {/* Charts & Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Biaya Maintenance per Console</h3>
          <div className="h-64 flex items-center justify-center">
            <BarChart3 className="h-24 w-24 text-gray-300" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sparepart Paling Sering Diganti</h3>
          <div className="h-64 flex items-center justify-center">
            <BarChart3 className="h-24 w-24 text-gray-300" />
          </div>
        </div>
      </div>

      {/* Common Issues */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Masalah Umum</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Masalah</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frekuensi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rata-rata Biaya</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Terakhir Terjadi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model Console</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">Controller stick drift</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">1</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">Rp 900.000</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">20/12/2024</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">PlayStation 5</div>
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">Overheating issues</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">1</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">Rp 100.000</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">28/12/2024</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">PlayStation 4</div>
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">Charging cable issues</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">1</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">Rp 100.000</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">15/12/2024</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">PlayStation 5</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Ringkasan Bulanan</h3>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
            <Download className="h-4 w-4" />
            Download CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bulan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah Transaksi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Biaya</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rata-rata Biaya</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sparepart Terbanyak</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">Desember 2024</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">3</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">Rp 1.000.000</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">Rp 333.333</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">Controller (1)</div>
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">November 2024</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">1</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">Rp 2.650.000</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">Rp 2.650.000</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">SSD (1)</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Manajemen Maintenance Hardware</h1>
        <p className="text-gray-600">Kelola reparasi, penggantian sparepart, dan riwayat maintenance</p>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'transactions', label: 'Transaksi', icon: Wrench },
              { id: 'history', label: 'Riwayat Console', icon: FileText },
              { id: 'reports', label: 'Laporan & Analisis', icon: BarChart3 }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'transactions' && renderTransactionsTab()}
      {activeTab === 'history' && renderHistoryTab()}
      {activeTab === 'reports' && renderReportsTab()}

      {/* Create Transaction Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Buat Transaksi Maintenance Baru</h2>
              
              <form className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Console *</label>
                    <select
                      value={newTransaction.consoleId}
                      onChange={(e) => setNewTransaction({...newTransaction, consoleId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Pilih Console</option>
                      {mockConsoles.map(console => (
                        <option key={console.id} value={console.id}>{console.name} ({console.serialNumber || 'No SN'})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teknisi *</label>
                    <select
                      value={newTransaction.technicianId}
                      onChange={(e) => setNewTransaction({...newTransaction, technicianId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Pilih Teknisi</option>
                      {mockTechnicians.map(technician => (
                        <option key={technician.id} value={technician.id}>{technician.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Service *</label>
                    <input
                      type="date"
                      value={newTransaction.serviceDate}
                      onChange={(e) => setNewTransaction({...newTransaction, serviceDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prioritas</label>
                    <select
                      value={newTransaction.priority}
                      onChange={(e) => setNewTransaction({...newTransaction, priority: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Rendah</option>
                      <option value="medium">Sedang</option>
                      <option value="high">Tinggi</option>
                      <option value="urgent">Mendesak</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Masalah *</label>
                  <textarea
                    value={newTransaction.issueDescription}
                    onChange={(e) => setNewTransaction({...newTransaction, issueDescription: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Jelaskan masalah yang dialami console"
                  />
                </div>

                {/* Parts Used Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-900">Sparepart yang Digunakan</h3>
                    <button
                      type="button"
                      onClick={addPartToTransaction}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Tambah Sparepart
                    </button>
                  </div>

                  <div className="space-y-4">
                    {newTransaction.partsUsed.map((part, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">Sparepart #{index + 1}</h4>
                          <button
                            type="button"
                            onClick={() => removePartUsage(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sparepart *</label>
                            <select
                              value={part.sparepartId}
                              onChange={(e) => updatePartUsage(index, 'sparepartId', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Pilih Sparepart</option>
                              {mockSpareparts.map(sparepart => (
                                <option key={sparepart.id} value={sparepart.id}>
                                  {sparepart.name} - Rp {sparepart.price.toLocaleString('id-ID')}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
                            <input
                              type="number"
                              value={part.quantityUsed}
                              onChange={(e) => updatePartUsage(index, 'quantityUsed', Number(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              min="1"
                            />
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Part Lama</label>
                          <textarea
                            value={part.oldPartNotes}
                            onChange={(e) => updatePartUsage(index, 'oldPartNotes', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={2}
                            placeholder="Kondisi part lama, serial number, dsb."
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Instalasi</label>
                          <textarea
                            value={part.installationNotes}
                            onChange={(e) => updatePartUsage(index, 'installationNotes', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={2}
                            placeholder="Catatan proses instalasi"
                          />
                        </div>
                      </div>
                    ))}
                    
                    {newTransaction.partsUsed.length === 0 && (
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-gray-600">Belum ada sparepart yang ditambahkan</p>
                        <button
                          type="button"
                          onClick={addPartToTransaction}
                          className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          + Tambah Sparepart
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Service Costs */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Biaya Jasa</label>
                    <input
                      type="number"
                      value={newTransaction.laborCost}
                      onChange={(e) => setNewTransaction({...newTransaction, laborCost: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Biaya Tambahan</label>
                    <input
                      type="number"
                      value={newTransaction.additionalServiceFees}
                      onChange={(e) => setNewTransaction({...newTransaction, additionalServiceFees: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Service Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Service</label>
                  <textarea
                    value={newTransaction.serviceNotes}
                    onChange={(e) => setNewTransaction({...newTransaction, serviceNotes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Catatan tambahan tentang service"
                  />
                </div>
              </form>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={handleCreateTransaction}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Buat Transaksi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {mockMaintenanceTransactions.filter(t => t.serviceStatus === 'completed').length}
          </h3>
          <p className="text-gray-600 text-sm">Selesai</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {mockMaintenanceTransactions.filter(t => t.serviceStatus === 'in-progress').length}
          </h3>
          <p className="text-gray-600 text-sm">Dalam Proses</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Calendar className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {mockMaintenanceTransactions.filter(t => t.serviceStatus === 'scheduled').length}
          </h3>
          <p className="text-gray-600 text-sm">Terjadwal</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {mockSpareparts.filter(s => s.stock <= s.minStock).length}
          </h3>
          <p className="text-gray-600 text-sm">Sparepart Menipis</p>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceManagement;