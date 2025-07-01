import React, { useState } from 'react';
import { Plus, Search, Gamepad2, Edit, Trash2, Settings, Eye, Package, Wrench, AlertCircle, CheckCircle, XCircle, Image, ExternalLink, MapPin, Calendar, User, DollarSign, Clock, FileText, Camera } from 'lucide-react';
import { mockEquipmentTypes, mockConsoles, mockSpareparts, mockMaintenanceTransactions, mockMaintenanceHistory, mockTechnicians } from '../data/mockData';

const EquipmentManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'equipment' | 'spareparts' | 'maintenance'>('equipment');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddEquipmentForm, setShowAddEquipmentForm] = useState(false);
  const [showAddSparepartForm, setShowAddSparepartForm] = useState(false);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [selectedSparepart, setSelectedSparepart] = useState<string | null>(null);
  const [selectedMaintenance, setSelectedMaintenance] = useState<string | null>(null);

  const [newEquipmentType, setNewEquipmentType] = useState({
    name: '',
    description: '',
    category: 'gaming' as 'gaming' | 'billiard' | 'other',
    icon: 'Gamepad2'
  });

  const [newSparepart, setNewSparepart] = useState({
    name: '',
    partNumber: '',
    category: 'controller' as 'controller' | 'cable' | 'power' | 'cooling' | 'storage' | 'display' | 'audio' | 'other',
    compatibleConsoles: [] as string[],
    description: '',
    specifications: '',
    brand: '',
    model: '',
    condition: 'new' as 'new' | 'used' | 'refurbished',
    price: 0,
    stock: 0,
    minStock: 0,
    location: '',
    supplier: '',
    purchaseLink: '',
    alternativeLinks: [] as string[],
    photos: [] as string[],
    installationNotes: '',
    warrantyPeriod: 12
  });

  const [newMaintenance, setNewMaintenance] = useState({
    consoleId: '',
    technicianId: '',
    issueDescription: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    serviceDate: new Date().toISOString().split('T')[0],
    partsUsed: [] as any[],
    laborCost: 0,
    additionalServiceFees: 0,
    serviceNotes: ''
  });

  const categories = [
    { value: 'all', label: 'Semua Kategori' },
    { value: 'gaming', label: 'Gaming' },
    { value: 'billiard', label: 'Billiard' },
    { value: 'other', label: 'Lainnya' }
  ];

  const sparepartCategories = [
    { value: 'all', label: 'Semua Kategori' },
    { value: 'controller', label: 'Controller' },
    { value: 'cable', label: 'Cable' },
    { value: 'power', label: 'Power Supply' },
    { value: 'cooling', label: 'Cooling System' },
    { value: 'storage', label: 'Storage' },
    { value: 'display', label: 'Display' },
    { value: 'audio', label: 'Audio' },
    { value: 'other', label: 'Lainnya' }
  ];

  const filteredEquipmentTypes = mockEquipmentTypes.filter(equipment => {
    const matchesSearch = equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         equipment.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || equipment.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredSpareparts = mockSpareparts.filter(sparepart => {
    const matchesSearch = sparepart.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sparepart.partNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sparepart.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || sparepart.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredMaintenanceTransactions = mockMaintenanceTransactions.filter(transaction => {
    const matchesSearch = transaction.transactionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.consoleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.issueDescription.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleAddEquipmentType = () => {
    if (!newEquipmentType.name || !newEquipmentType.description) {
      alert('Nama dan deskripsi equipment wajib diisi');
      return;
    }
    
    alert('Equipment type berhasil ditambahkan!');
    setShowAddEquipmentForm(false);
    setNewEquipmentType({
      name: '',
      description: '',
      category: 'gaming',
      icon: 'Gamepad2'
    });
  };

  const handleAddSparepart = () => {
    if (!newSparepart.name || newSparepart.price <= 0) {
      alert('Nama sparepart dan harga wajib diisi');
      return;
    }
    
    alert('Sparepart berhasil ditambahkan!');
    setShowAddSparepartForm(false);
    setNewSparepart({
      name: '',
      partNumber: '',
      category: 'controller',
      compatibleConsoles: [],
      description: '',
      specifications: '',
      brand: '',
      model: '',
      condition: 'new',
      price: 0,
      stock: 0,
      minStock: 0,
      location: '',
      supplier: '',
      purchaseLink: '',
      alternativeLinks: [],
      photos: [],
      installationNotes: '',
      warrantyPeriod: 12
    });
  };

  const handleCreateMaintenance = () => {
    if (!newMaintenance.consoleId || !newMaintenance.technicianId || !newMaintenance.issueDescription) {
      alert('Console, teknisi, dan deskripsi masalah wajib diisi');
      return;
    }
    
    alert('Transaksi maintenance berhasil dibuat!');
    setShowMaintenanceForm(false);
    setNewMaintenance({
      consoleId: '',
      technicianId: '',
      issueDescription: '',
      priority: 'medium',
      serviceDate: new Date().toISOString().split('T')[0],
      partsUsed: [],
      laborCost: 0,
      additionalServiceFees: 0,
      serviceNotes: ''
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'gaming': return 'bg-blue-100 text-blue-800';
      case 'billiard': return 'bg-green-100 text-green-800';
      case 'controller': return 'bg-purple-100 text-purple-800';
      case 'cable': return 'bg-yellow-100 text-yellow-800';
      case 'power': return 'bg-red-100 text-red-800';
      case 'cooling': return 'bg-cyan-100 text-cyan-800';
      case 'storage': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new': return 'bg-green-100 text-green-800';
      case 'used': return 'bg-yellow-100 text-yellow-800';
      case 'refurbished': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConsoleCount = (equipmentTypeId: string) => {
    return mockConsoles.filter(console => console.equipmentTypeId === equipmentTypeId).length;
  };

  const renderEquipmentTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Jenis Equipment</h2>
          <p className="text-gray-600">Kelola jenis-jenis equipment yang tersedia</p>
        </div>
        <button
          onClick={() => setShowAddEquipmentForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Tambah Equipment Type
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Cari equipment type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {categories.map(category => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      {/* Equipment Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEquipmentTypes.map((equipmentType) => (
          <div key={equipmentType.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <Gamepad2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{equipmentType.name}</h3>
                    <span className="text-sm opacity-90">{getConsoleCount(equipmentType.id)} console</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(equipmentType.category)}`}>
                  {equipmentType.category}
                </span>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  equipmentType.isActive ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
                }`}>
                  {equipmentType.isActive ? 'AKTIF' : 'NONAKTIF'}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="p-4">
              <div className="space-y-4">
                {/* Description */}
                <p className="text-gray-600 text-sm">{equipmentType.description}</p>

                {/* Console List */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Console yang Menggunakan
                  </h4>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {mockConsoles
                      .filter(console => console.equipmentTypeId === equipmentType.id)
                      .slice(0, 3)
                      .map(console => (
                        <div key={console.id} className="text-sm text-gray-600 flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            console.status === 'available' ? 'bg-green-500' :
                            console.status === 'rented' ? 'bg-blue-500' : 'bg-red-500'
                          }`}></div>
                          {console.name}
                        </div>
                      ))}
                    {getConsoleCount(equipmentType.id) > 3 && (
                      <div className="text-sm text-gray-500 italic">
                        +{getConsoleCount(equipmentType.id) - 3} console lainnya
                      </div>
                    )}
                    {getConsoleCount(equipmentType.id) === 0 && (
                      <p className="text-sm text-gray-500 italic">Belum ada console</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSelectedEquipment(selectedEquipment === equipmentType.id ? null : equipmentType.id)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      {selectedEquipment === equipmentType.id ? 'Tutup Detail' : 'Lihat Detail'}
                    </button>
                    <button className="p-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg transition-colors">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-2 border border-red-300 hover:border-red-400 text-red-600 rounded-lg transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Extended Details */}
                {selectedEquipment === equipmentType.id && (
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="font-semibold text-gray-900 mb-3">Detail Equipment Type</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">ID:</span>
                        <span className="font-medium">{equipmentType.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Kategori:</span>
                        <span className="font-medium">{equipmentType.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Icon:</span>
                        <span className="font-medium">{equipmentType.icon}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Dibuat:</span>
                        <span className="font-medium">{new Date(equipmentType.createdAt).toLocaleDateString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Diupdate:</span>
                        <span className="font-medium">{new Date(equipmentType.updatedAt).toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSparepartsTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Master Sparepart</h2>
          <p className="text-gray-600">Kelola inventory sparepart untuk maintenance equipment</p>
        </div>
        <button
          onClick={() => setShowAddSparepartForm(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Tambah Sparepart
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Cari sparepart, part number, atau brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {sparepartCategories.map(category => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      {/* Low Stock Alert */}
      {mockSpareparts.filter(sp => sp.stock <= sp.minStock).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-800">Stok Sparepart Menipis</h3>
          </div>
          <p className="text-red-700 text-sm">
            {mockSpareparts.filter(sp => sp.stock <= sp.minStock).length} sparepart memiliki stok di bawah minimum
          </p>
        </div>
      )}

      {/* Spareparts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSpareparts.map((sparepart) => (
          <div key={sparepart.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <Package className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{sparepart.name}</h3>
                    <span className="text-sm opacity-90">{sparepart.partNumber}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(sparepart.category)}`}>
                  {sparepart.category}
                </span>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getConditionColor(sparepart.condition)}`}>
                  {sparepart.condition.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="p-4">
              <div className="space-y-4">
                {/* Basic Info */}
                <div>
                  <p className="text-gray-600 text-sm mb-2">{sparepart.description}</p>
                  {sparepart.brand && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Brand:</span>
                      <span className="font-medium">{sparepart.brand} {sparepart.model}</span>
                    </div>
                  )}
                </div>

                {/* Stock & Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-gray-500">Stok Tersedia</span>
                    <p className={`font-semibold ${
                      sparepart.stock <= sparepart.minStock ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {sparepart.stock} unit
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Harga</span>
                    <p className="font-semibold text-blue-600">
                      Rp {sparepart.price.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {/* Location & Supplier */}
                <div className="space-y-2">
                  {sparepart.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{sparepart.location}</span>
                    </div>
                  )}
                  {sparepart.supplier && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="h-4 w-4" />
                      <span>{sparepart.supplier}</span>
                    </div>
                  )}
                </div>

                {/* Photos */}
                {sparepart.photos.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      Foto Sparepart
                    </h5>
                    <div className="grid grid-cols-2 gap-2">
                      {sparepart.photos.slice(0, 2).map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`${sparepart.name} ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                    {sparepart.photos.length > 2 && (
                      <p className="text-xs text-gray-500 mt-1">+{sparepart.photos.length - 2} foto lainnya</p>
                    )}
                  </div>
                )}

                {/* Purchase Links */}
                {sparepart.purchaseLink && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Link Pembelian
                    </h5>
                    <a
                      href={sparepart.purchaseLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm underline"
                    >
                      Link Utama
                    </a>
                    {sparepart.alternativeLinks && sparepart.alternativeLinks.length > 0 && (
                      <div className="mt-1">
                        {sparepart.alternativeLinks.map((link, index) => (
                          <a
                            key={index}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-blue-600 hover:text-blue-700 text-sm underline"
                          >
                            Link Alternatif {index + 1}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSelectedSparepart(selectedSparepart === sparepart.id ? null : sparepart.id)}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      {selectedSparepart === sparepart.id ? 'Tutup Detail' : 'Detail'}
                    </button>
                    <button className="p-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg transition-colors">
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Extended Details */}
                {selectedSparepart === sparepart.id && (
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="font-semibold text-gray-900 mb-3">Detail Lengkap</h4>
                    <div className="space-y-3 text-sm">
                      {sparepart.specifications && (
                        <div>
                          <span className="font-medium text-gray-700">Spesifikasi:</span>
                          <p className="text-gray-600 mt-1">{sparepart.specifications}</p>
                        </div>
                      )}
                      
                      {sparepart.installationNotes && (
                        <div>
                          <span className="font-medium text-gray-700">Catatan Instalasi:</span>
                          <p className="text-gray-600 mt-1">{sparepart.installationNotes}</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-gray-600">Min. Stok:</span>
                          <span className="font-medium ml-2">{sparepart.minStock} unit</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Garansi:</span>
                          <span className="font-medium ml-2">{sparepart.warrantyPeriod} bulan</span>
                        </div>
                      </div>
                      
                      {sparepart.lastUsed && (
                        <div>
                          <span className="text-gray-600">Terakhir digunakan:</span>
                          <span className="font-medium ml-2">{new Date(sparepart.lastUsed).toLocaleDateString('id-ID')}</span>
                        </div>
                      )}
                      
                      {/* Compatible Consoles */}
                      <div>
                        <span className="font-medium text-gray-700">Compatible dengan:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {sparepart.compatibleConsoles.map(consoleId => {
                            const console = mockConsoles.find(c => c.id === consoleId);
                            return (
                              <span key={consoleId} className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                {console?.name || consoleId}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Usage History */}
                      {sparepart.usageHistory.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-700">Riwayat Penggunaan:</span>
                          <div className="mt-1 space-y-1">
                            {sparepart.usageHistory.slice(0, 3).map(usage => (
                              <div key={usage.id} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                <div className="font-medium">{new Date(usage.usageDate).toLocaleDateString('id-ID')}</div>
                                <div>{usage.description}</div>
                                {usage.technician && <div>Teknisi: {usage.technician}</div>}
                              </div>
                            ))}
                            {sparepart.usageHistory.length > 3 && (
                              <div className="text-xs text-gray-500 italic">
                                +{sparepart.usageHistory.length - 3} penggunaan lainnya
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMaintenanceTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hardware Maintenance</h2>
          <p className="text-gray-600">Kelola transaksi maintenance dan reparasi equipment</p>
        </div>
        <button
          onClick={() => setShowMaintenanceForm(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Buat Transaksi Maintenance
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Cari transaksi maintenance..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Maintenance Transactions */}
      <div className="space-y-4">
        {filteredMaintenanceTransactions.map((transaction) => (
          <div key={transaction.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Wrench className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{transaction.transactionNumber}</h3>
                  <p className="text-gray-600">{transaction.consoleName}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(transaction.serviceStatus)}`}>
                  {transaction.serviceStatus.toUpperCase()}
                </span>
                <div className="mt-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(transaction.priority)}`}>
                    {transaction.priority.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <div>
                  <p className="text-xs">Service Date</p>
                  <p className="font-medium text-gray-900">{new Date(transaction.serviceDate).toLocaleDateString('id-ID')}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-gray-600">
                <User className="h-4 w-4" />
                <div>
                  <p className="text-xs">Teknisi</p>
                  <p className="font-medium text-gray-900">{transaction.technicianName}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-gray-600">
                <Package className="h-4 w-4" />
                <div>
                  <p className="text-xs">Parts Used</p>
                  <p className="font-medium text-gray-900">{transaction.partsUsed.length} item</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-gray-600">
                <DollarSign className="h-4 w-4" />
                <div>
                  <p className="text-xs">Total Cost</p>
                  <p className="font-medium text-gray-900">Rp {transaction.totalRepairCost.toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Issue Description</h4>
              <p className="text-gray-600 text-sm">{transaction.issueDescription}</p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setSelectedMaintenance(selectedMaintenance === transaction.id ? null : transaction.id)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {selectedMaintenance === transaction.id ? 'Hide Details' : 'View Details'}
              </button>
              
              {transaction.serviceStatus === 'in-progress' && (
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  Mark Complete
                </button>
              )}
              
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                Edit
              </button>
            </div>

            {/* Extended Details */}
            {selectedMaintenance === transaction.id && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4">Maintenance Details</h4>
                
                {/* Console Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Console Information</h5>
                    <div className="text-sm space-y-1">
                      <div><strong>Model:</strong> {transaction.consoleModel}</div>
                      <div><strong>Serial Number:</strong> {transaction.consoleSerialNumber}</div>
                      <div><strong>Console ID:</strong> {transaction.consoleId}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Service Information</h5>
                    <div className="text-sm space-y-1">
                      <div><strong>Priority:</strong> {transaction.priority}</div>
                      <div><strong>Status:</strong> {transaction.serviceStatus}</div>
                      <div><strong>Payment Status:</strong> {transaction.paymentStatus}</div>
                      {transaction.completedDate && (
                        <div><strong>Completed:</strong> {new Date(transaction.completedDate).toLocaleDateString('id-ID')}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Parts Used */}
                {transaction.partsUsed.length > 0 && (
                  <div className="mb-4">
                    <h5 className="font-medium text-gray-700 mb-2">Parts Used</h5>
                    <div className="space-y-2">
                      {transaction.partsUsed.map((part, index) => (
                        <div key={index} className="bg-white p-3 rounded border">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{part.sparepartName}</div>
                              <div className="text-sm text-gray-600">{part.partNumber}</div>
                              <div className="text-sm text-gray-600">Quantity: {part.quantityUsed}</div>
                              {part.installationNotes && (
                                <div className="text-sm text-gray-600 mt-1">
                                  <strong>Notes:</strong> {part.installationNotes}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-medium">Rp {part.totalCost.toLocaleString('id-ID')}</div>
                              <div className="text-sm text-gray-600">@Rp {part.unitCost.toLocaleString('id-ID')}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cost Breakdown */}
                <div className="mb-4">
                  <h5 className="font-medium text-gray-700 mb-2">Cost Breakdown</h5>
                  <div className="bg-white p-3 rounded border space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Labor Cost:</span>
                      <span>Rp {transaction.laborCost.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Parts Cost:</span>
                      <span>Rp {transaction.totalPartsCost.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Additional Fees:</span>
                      <span>Rp {transaction.additionalServiceFees.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-2">
                      <span>Total:</span>
                      <span>Rp {transaction.totalRepairCost.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                {/* Service Notes */}
                {transaction.serviceNotes && (
                  <div className="mb-4">
                    <h5 className="font-medium text-gray-700 mb-2">Service Notes</h5>
                    <div className="bg-white p-3 rounded border text-sm">
                      {transaction.serviceNotes}
                    </div>
                  </div>
                )}

                {/* Test Results */}
                {transaction.testResults && (
                  <div className="mb-4">
                    <h5 className="font-medium text-gray-700 mb-2">Test Results</h5>
                    <div className="bg-white p-3 rounded border text-sm">
                      {transaction.testResults}
                    </div>
                  </div>
                )}

                {/* Photos */}
                {(transaction.beforePhotos || transaction.afterPhotos) && (
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Photos</h5>
                    <div className="grid grid-cols-2 gap-4">
                      {transaction.beforePhotos && (
                        <div>
                          <h6 className="text-sm font-medium text-gray-600 mb-2">Before</h6>
                          <div className="grid grid-cols-2 gap-2">
                            {transaction.beforePhotos.map((photo, index) => (
                              <img
                                key={index}
                                src={photo}
                                alt={`Before ${index + 1}`}
                                className="w-full h-20 object-cover rounded"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {transaction.afterPhotos && (
                        <div>
                          <h6 className="text-sm font-medium text-gray-600 mb-2">After</h6>
                          <div className="grid grid-cols-2 gap-2">
                            {transaction.afterPhotos.map((photo, index) => (
                              <img
                                key={index}
                                src={photo}
                                alt={`After ${index + 1}`}
                                className="w-full h-20 object-cover rounded"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Equipment Management</h1>
        <p className="text-gray-600">Kelola jenis equipment, sparepart, dan maintenance</p>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'equipment', label: 'Equipment Types', icon: Gamepad2 },
              { id: 'spareparts', label: 'Spareparts', icon: Package },
              { id: 'maintenance', label: 'Maintenance', icon: Wrench }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setSearchTerm('');
                    setSelectedCategory('all');
                  }}
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
      {activeTab === 'equipment' && renderEquipmentTab()}
      {activeTab === 'spareparts' && renderSparepartsTab()}
      {activeTab === 'maintenance' && renderMaintenanceTab()}

      {/* Add Equipment Type Modal */}
      {showAddEquipmentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Tambah Equipment Type</h2>
              
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Equipment *</label>
                  <input
                    type="text"
                    value={newEquipmentType.name}
                    onChange={(e) => setNewEquipmentType({...newEquipmentType, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., PlayStation 5"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <select 
                    value={newEquipmentType.category}
                    onChange={(e) => setNewEquipmentType({...newEquipmentType, category: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="gaming">Gaming</option>
                    <option value="billiard">Billiard</option>
                    <option value="other">Lainnya</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi *</label>
                  <textarea
                    value={newEquipmentType.description}
                    onChange={(e) => setNewEquipmentType({...newEquipmentType, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Deskripsi equipment type"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                  <select 
                    value={newEquipmentType.icon}
                    onChange={(e) => setNewEquipmentType({...newEquipmentType, icon: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Gamepad2">Gamepad2</option>
                    <option value="Circle">Circle</option>
                    <option value="Settings">Settings</option>
                  </select>
                </div>
              </form>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddEquipmentForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={handleAddEquipmentType}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Tambah Equipment Type
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Sparepart Modal */}
      {showAddSparepartForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Tambah Sparepart Baru</h2>
              
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Sparepart *</label>
                    <input
                      type="text"
                      value={newSparepart.name}
                      onChange={(e) => setNewSparepart({...newSparepart, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., DualSense Controller PS5"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Part Number</label>
                    <input
                      type="text"
                      value={newSparepart.partNumber}
                      onChange={(e) => setNewSparepart({...newSparepart, partNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., CFI-ZCT1W"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                    <select 
                      value={newSparepart.category}
                      onChange={(e) => setNewSparepart({...newSparepart, category: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="controller">Controller</option>
                      <option value="cable">Cable</option>
                      <option value="power">Power Supply</option>
                      <option value="cooling">Cooling System</option>
                      <option value="storage">Storage</option>
                      <option value="display">Display</option>
                      <option value="audio">Audio</option>
                      <option value="other">Lainnya</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                    <input
                      type="text"
                      value={newSparepart.brand}
                      onChange={(e) => setNewSparepart({...newSparepart, brand: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Sony"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                    <input
                      type="text"
                      value={newSparepart.model}
                      onChange={(e) => setNewSparepart({...newSparepart, model: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., DualSense"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi *</label>
                  <textarea
                    value={newSparepart.description}
                    onChange={(e) => setNewSparepart({...newSparepart, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="Deskripsi sparepart"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Spesifikasi</label>
                  <textarea
                    value={newSparepart.specifications}
                    onChange={(e) => setNewSparepart({...newSparepart, specifications: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="Spesifikasi teknis"
                  />
                </div>
                
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kondisi</label>
                    <select 
                      value={newSparepart.condition}
                      onChange={(e) => setNewSparepart({...newSparepart, condition: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="new">New</option>
                      <option value="used">Used</option>
                      <option value="refurbished">Refurbished</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Harga *</label>
                    <input
                      type="number"
                      value={newSparepart.price}
                      onChange={(e) => setNewSparepart({...newSparepart, price: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="850000"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stok</label>
                    <input
                      type="number"
                      value={newSparepart.stock}
                      onChange={(e) => setNewSparepart({...newSparepart, stock: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="5"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min. Stok</label>
                    <input
                      type="number"
                      value={newSparepart.minStock}
                      onChange={(e) => setNewSparepart({...newSparepart, minStock: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="2"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi Penyimpanan</label>
                    <input
                      type="text"
                      value={newSparepart.location}
                      onChange={(e) => setNewSparepart({...newSparepart, location: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Rak A-1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                    <input
                      type="text"
                      value={newSparepart.supplier}
                      onChange={(e) => setNewSparepart({...newSparepart, supplier: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Sony Official Store"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link Pembelian</label>
                  <input
                    type="url"
                    value={newSparepart.purchaseLink}
                    onChange={(e) => setNewSparepart({...newSparepart, purchaseLink: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Instalasi</label>
                  <textarea
                    value={newSparepart.installationNotes}
                    onChange={(e) => setNewSparepart({...newSparepart, installationNotes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="Catatan untuk instalasi sparepart"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Garansi (bulan)</label>
                  <input
                    type="number"
                    value={newSparepart.warrantyPeriod}
                    onChange={(e) => setNewSparepart({...newSparepart, warrantyPeriod: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="12"
                  />
                </div>
              </form>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddSparepartForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={handleAddSparepart}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Tambah Sparepart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Maintenance Modal */}
      {showMaintenanceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Buat Transaksi Maintenance</h2>
              
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Console *</label>
                    <select
                      value={newMaintenance.consoleId}
                      onChange={(e) => setNewMaintenance({...newMaintenance, consoleId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Pilih Console</option>
                      {mockConsoles.map(console => (
                        <option key={console.id} value={console.id}>{console.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teknisi *</label>
                    <select
                      value={newMaintenance.technicianId}
                      onChange={(e) => setNewMaintenance({...newMaintenance, technicianId: e.target.value})}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Service</label>
                    <input
                      type="date"
                      value={newMaintenance.serviceDate}
                      onChange={(e) => setNewMaintenance({...newMaintenance, serviceDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prioritas</label>
                    <select
                      value={newMaintenance.priority}
                      onChange={(e) => setNewMaintenance({...newMaintenance, priority: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Masalah *</label>
                  <textarea
                    value={newMaintenance.issueDescription}
                    onChange={(e) => setNewMaintenance({...newMaintenance, issueDescription: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Jelaskan masalah yang dialami console"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Biaya Jasa</label>
                    <input
                      type="number"
                      value={newMaintenance.laborCost}
                      onChange={(e) => setNewMaintenance({...newMaintenance, laborCost: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="50000"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Biaya Tambahan</label>
                    <input
                      type="number"
                      value={newMaintenance.additionalServiceFees}
                      onChange={(e) => setNewMaintenance({...newMaintenance, additionalServiceFees: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Service</label>
                  <textarea
                    value={newMaintenance.serviceNotes}
                    onChange={(e) => setNewMaintenance({...newMaintenance, serviceNotes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Catatan tambahan untuk service"
                  />
                </div>
              </form>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowMaintenanceForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={handleCreateMaintenance}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
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
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Gamepad2 className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{mockEquipmentTypes.length}</h3>
          <p className="text-gray-600 text-sm">Equipment Types</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Package className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{mockSpareparts.length}</h3>
          <p className="text-gray-600 text-sm">Total Spareparts</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Wrench className="h-6 w-6 text-orange-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{mockMaintenanceTransactions.length}</h3>
          <p className="text-gray-600 text-sm">Maintenance Records</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {mockSpareparts.filter(sp => sp.stock <= sp.minStock).length}
          </h3>
          <p className="text-gray-600 text-sm">Low Stock Items</p>
        </div>
      </div>
    </div>
  );
};

export default EquipmentManagement;