import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Gamepad2, Clock, Plus, Search, Settings, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Dummy data untuk tampilan awal
const dummyProfiles = [
  {
    id: '1',
    name: 'PlayStation Premium',
    description: 'Tarif premium untuk PS5 dan PS4 Pro',
    hourlyRate: 15000,
    dailyRate: 120000,
    weeklyRate: 700000,
    monthlyRate: 2500000,
    peakHourRate: 18000,
    peakHourStart: '18:00',
    peakHourEnd: '22:00',
    weekendMultiplier: 1.2,
    applicableEquipmentTypes: ['ps5', 'ps4pro'],
    isActive: true,
    createdAt: '2025-07-01',
    updatedAt: '2025-07-01',
    createdBy: 'admin',
    // Paket Hemat
    packages: [
      { name: 'Paket 1', duration: 2, price: 18000, note: 'hemat Rp 2.000 dari harga normal Rp 20.000' },
      { name: 'Paket 2', duration: 3, price: 25000, note: 'hemat Rp 5.000' },
      { name: 'Paket 3', duration: 5, price: 40000, note: 'hemat Rp 10.000' },
      { name: 'Paket 4', duration: 10, price: 75000, note: 'bisa dipakai beberapa kali' },
    ],
  },
  {
    id: '2',
    name: 'PS3 Reguler',
    description: 'Tarif standar untuk PS3',
    hourlyRate: 10000,
    dailyRate: 80000,
    weeklyRate: 450000,
    monthlyRate: 1500000,
    peakHourRate: 12000,
    peakHourStart: '18:00',
    peakHourEnd: '22:00',
    weekendMultiplier: 1.1,
    applicableEquipmentTypes: ['ps3'],
    isActive: false,
    createdAt: '2025-07-01',
    updatedAt: '2025-07-01',
    createdBy: 'admin',
    packages: [
      { name: 'Paket 1', duration: 2, price: 15000, note: 'hemat Rp 2.000 dari harga normal Rp 17.000' },
      { name: 'Paket 2', duration: 3, price: 20000, note: 'hemat Rp 5.000' },
      { name: 'Paket 3', duration: 5, price: 35000, note: 'hemat Rp 10.000' },
      { name: 'Paket 4', duration: 10, price: 65000, note: 'bisa dipakai beberapa kali' },
    ],
  },
];

const RateProfilePage: React.FC = () => {
  const [profiles, setProfiles] = useState(dummyProfiles);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEquipmentType, setSelectedEquipmentType] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState<string | null>(null);
  const [editData, setEditData] = useState<any | null>(null);
  const [showConsoleManageModal, setShowConsoleManageModal] = useState<string | null>(null);
  const [consoles, setConsoles] = useState<{ id: string; name: string }[]>([]);
  const [consoleTab, setConsoleTab] = useState<string>('');
  const [editFormTab, setEditFormTab] = useState<'detail' | 'console'>('detail');
  const [addFormTab, setAddFormTab] = useState<'detail' | 'console'>('detail');
  const [addData, setAddData] = useState<any>({
    name: '',
    isActive: true,
    description: '',
    hourlyRate: '',
    peakHourStart: '',
    peakHourEnd: '',
    applicableEquipmentTypes: [],
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Group consoles by type
  const consolesByType = consoles.reduce((acc: Record<string, any[]>, curr) => {
    const type = curr.type || 'Lainnya';
    if (!acc[type]) acc[type] = [];
    acc[type].push(curr);
    return acc;
  }, {});
  let consoleTypes = Object.keys(consolesByType).filter(type => type !== 'Lainnya');

  useEffect(() => {
    const fetchConsoles = async () => {
      const { data, error } = await supabase.from('consoles').select('id, name');
      if (!error && data) setConsoles(data);
    };
    fetchConsoles();
  }, []);

  useEffect(() => {
    if (consoleTypes.length && !consoleTab) setConsoleTab(consoleTypes[0]);
  }, [consoleTypes]);

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (profile.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEquipmentType = selectedEquipmentType === 'all' || (profile.applicableEquipmentTypes || []).includes(selectedEquipmentType);
    return matchesSearch && matchesEquipmentType;
  });

  // Handle open edit form
  const handleEdit = (profileId: string) => {
    const profile = profiles.find((p) => p.id === profileId);
    if (profile) {
      setEditData({ ...profile });
      setShowEditForm(profileId);
    }
  };

  // Handle change in edit form
  const handleEditChange = (field: string, value: any) => {
    setEditData((prev: any) => ({ ...prev, [field]: value }));
  };

  // Handle checkbox change for equipment types
  const handleEditEquipmentType = (id: string) => {
    setEditData((prev: any) => {
      const types = prev.applicableEquipmentTypes || [];
      return {
        ...prev,
        applicableEquipmentTypes: types.includes(id)
          ? types.filter((t: string) => t !== id)
          : [...types, id],
      };
    });
  };

  // Handle save edit
  const handleEditSave = () => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === editData.id ? { ...editData } : p))
    );
    setShowEditForm(null);
    setEditData(null);
  };

  // Handle cancel edit
  const handleEditCancel = () => {
    setShowEditForm(null);
    setEditData(null);
  };

  const handleAddChange = (field: string, value: any) => {
    setAddData((prev: any) => ({ ...prev, [field]: value }));
  };
  const handleAddEquipmentType = (id: string) => {
    setAddData((prev: any) => {
      const types = prev.applicableEquipmentTypes || [];
      return {
        ...prev,
        applicableEquipmentTypes: types.includes(id)
          ? types.filter((t: string) => t !== id)
          : [...types, id],
      };
    });
  };
  const handleAddCancel = () => {
    setShowAddForm(false);
    setAddFormTab('detail');
    setAddData({
      name: '',
      isActive: true,
      description: '',
      hourlyRate: '',
      peakHourStart: '',
      peakHourEnd: '',
      applicableEquipmentTypes: [],
    });
  };

  // Handle delete
  const handleDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };
  const handleDeleteConfirm = () => {
    setProfiles(prev => prev.filter(p => p.id !== deleteId));
    setShowDeleteConfirm(false);
    setDeleteId(null);
  };
  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setDeleteId(null);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Statistik Ringkasan */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{profiles.length}</h3>
          <p className="text-gray-600 text-sm">Total Profil Tarif</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {profiles.filter(p => p.isActive).length}
          </h3>
          <p className="text-gray-600 text-sm">Profil Aktif</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Gamepad2 className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">0</h3>
          <p className="text-gray-600 text-sm">Console Menggunakan Tarif</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Clock className="h-6 w-6 text-orange-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            Rp {profiles.length > 0 ? Math.round(profiles.reduce((sum, p) => sum + p.hourlyRate, 0) / profiles.length).toLocaleString('id-ID') : 0}
          </h3>
          <p className="text-gray-600 text-sm">Rata-rata Tarif/Jam</p>
        </div>
      </div>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Manajemen Tarif</h1>
            <p className="text-gray-600">Kelola profil tarif untuk berbagai jenis equipment</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Tambah Profil Tarif
          </button>
        </div>
        {/* Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Cari profil tarif..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedEquipmentType}
            onChange={(e) => setSelectedEquipmentType(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Semua Jenis Equipment</option>
            {consoles.map(equipmentType => (
              <option key={equipmentType.id} value={equipmentType.id}>{equipmentType.name}</option>
            ))}
          </select>
        </div>
      </div>
      {/* Grid Profil Tarif */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProfiles.map((profile) => (
          <div key={profile.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{profile.name}</h2>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${profile.isActive ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}>
                    {profile.isActive ? 'AKTIF' : 'NONAKTIF'}
                  </span>
                  {/* Tombol Edit & Hapus */}
                  <button
                    className="flex items-center gap-1 px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-40 rounded-lg text-xs font-medium transition-colors"
                    onClick={() => handleEdit(profile.id)}
                    type="button"
                  >
                    <Pencil className="h-4 w-4" /> Edit
                  </button>
                  <button
                    className="flex items-center gap-1 px-3 py-1 bg-white bg-opacity-20 hover:bg-red-500/40 rounded-lg text-xs font-medium text-red-100 hover:text-white transition-colors"
                    onClick={() => handleDelete(profile.id)}
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" /> Hapus
                  </button>
                </div>
              </div>
            </div>
            {/* Body */}
            <div className="p-4">
              <div className="space-y-4">
                {/* Deskripsi */}
                <p className="text-gray-600 text-sm">{profile.description}</p>
                {/* Tarif per Jam */}
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-gray-900">Tarif per Jam</span>
                  <span>Rp {profile.hourlyRate.toLocaleString('id-ID')}</span>
                </div>
                {/* Jam Berlaku */}
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-gray-900">Jam Berlaku</span>
                  <span>{profile.peakHourStart?.slice(0,5)} - {profile.peakHourEnd?.slice(0,5)}</span>
                </div>
                {/* Berlaku untuk Console */}
                <div>
                  <span className="font-semibold text-gray-900 block mb-1">Berlaku untuk Console</span>
                  <div className="flex flex-wrap gap-2">
                    {(profile.applicableEquipmentTypes || []).map((id) => {
                      const eq = consoles.find(e => e.id === id);
                      return eq ? (
                        <span key={eq.id} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{eq.name}</span>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Modal Tambah Profil Tarif (hanya field yang diperlukan) */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Tambah Profil Tarif Baru</h2>
              <div className="flex gap-2 mb-6 border-b border-gray-200">
                <button
                  type="button"
                  className={`px-4 py-2 rounded-t-lg border-b-2 ${addFormTab === 'detail' ? 'border-blue-500 text-blue-600 font-semibold bg-blue-50' : 'border-transparent text-gray-600'}`}
                  onClick={() => setAddFormTab('detail')}
                >
                  Detail Data
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 rounded-t-lg border-b-2 ${addFormTab === 'console' ? 'border-blue-500 text-blue-600 font-semibold bg-blue-50' : 'border-transparent text-gray-600'}`}
                  onClick={() => setAddFormTab('console')}
                >
                  Berlaku untuk Console
                </button>
              </div>
              {addFormTab === 'detail' && (
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nama Profil</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={addData.name}
                        onChange={e => handleAddChange('name', e.target.value)}
                        placeholder="e.g., PlayStation Premium"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={addData.isActive ? 'Aktif' : 'Nonaktif'}
                        onChange={e => handleAddChange('isActive', e.target.value === 'Aktif')}
                      >
                        <option>Aktif</option>
                        <option>Nonaktif</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                      value={addData.description}
                      onChange={e => handleAddChange('description', e.target.value)}
                      placeholder="Deskripsi profil tarif"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tarif per Jam</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={addData.hourlyRate}
                      onChange={e => handleAddChange('hourlyRate', Number(e.target.value))}
                      placeholder="Contoh: 10000"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Jam Mulai Berlaku</label>
                      <input
                        type="time"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={addData.peakHourStart}
                        onChange={e => handleAddChange('peakHourStart', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Jam Selesai Berlaku</label>
                      <input
                        type="time"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={addData.peakHourEnd}
                        onChange={e => handleAddChange('peakHourEnd', e.target.value)}
                      />
                    </div>
                  </div>
                </form>
              )}
              {addFormTab === 'console' && (
                <div>
                  <div className="mb-2 flex gap-2 border-b border-gray-200">
                    {consoleTypes.map(type => (
                      <button
                        key={type}
                        type="button"
                        className={`px-3 py-1 rounded-t-lg border-b-2 ${consoleTab === type ? 'border-blue-500 text-blue-600 font-semibold bg-blue-50' : 'border-transparent text-gray-600'}`}
                        onClick={() => setConsoleTab(type)}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3">
                    {(consolesByType[consoleTab] || []).map(eq => (
                      <div key={eq.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={addData.applicableEquipmentTypes?.includes(eq.id)}
                          onChange={() => handleAddEquipmentType(eq.id)}
                        />
                        <span>{eq.name}</span>
                      </div>
                    ))}
                    {(!consolesByType[consoleTab] || consolesByType[consoleTab].length === 0) && (
                      <span className="text-gray-400 text-xs">Tidak ada console pada kategori ini</span>
                    )}
                  </div>
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAddCancel}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors opacity-50 cursor-not-allowed"
                  disabled
                >
                  Simpan Profil Tarif
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal Edit Profil Tarif */}
      {showEditForm && editData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Profil Tarif</h2>
              <div className="flex gap-2 mb-6 border-b border-gray-200">
                <button
                  type="button"
                  className={`px-4 py-2 rounded-t-lg border-b-2 ${editFormTab === 'detail' ? 'border-blue-500 text-blue-600 font-semibold bg-blue-50' : 'border-transparent text-gray-600'}`}
                  onClick={() => setEditFormTab('detail')}
                >
                  Detail Data
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 rounded-t-lg border-b-2 ${editFormTab === 'console' ? 'border-blue-500 text-blue-600 font-semibold bg-blue-50' : 'border-transparent text-gray-600'}`}
                  onClick={() => setEditFormTab('console')}
                >
                  Berlaku untuk Console
                </button>
              </div>
              {editFormTab === 'detail' && (
                <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleEditSave(); }}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nama Profil</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={editData.name}
                        onChange={e => handleEditChange('name', e.target.value)}
                        placeholder="e.g., PlayStation Premium"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={editData.isActive ? 'Aktif' : 'Nonaktif'}
                        onChange={e => handleEditChange('isActive', e.target.value === 'Aktif')}
                      >
                        <option>Aktif</option>
                        <option>Nonaktif</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                      value={editData.description}
                      onChange={e => handleEditChange('description', e.target.value)}
                      placeholder="Deskripsi profil tarif"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tarif per Jam</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={editData.hourlyRate}
                      onChange={e => handleEditChange('hourlyRate', Number(e.target.value))}
                      placeholder="Contoh: 10000"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Jam Mulai Berlaku</label>
                      <input
                        type="time"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={editData.peakHourStart}
                        onChange={e => handleEditChange('peakHourStart', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Jam Selesai Berlaku</label>
                      <input
                        type="time"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={editData.peakHourEnd}
                        onChange={e => handleEditChange('peakHourEnd', e.target.value)}
                      />
                    </div>
                  </div>
                </form>
              )}
              {editFormTab === 'console' && (
                <div>
                  <div className="mb-2 flex gap-2 border-b border-gray-200">
                    {consoleTypes.map(type => (
                      <button
                        key={type}
                        type="button"
                        className={`px-3 py-1 rounded-t-lg border-b-2 ${consoleTab === type ? 'border-blue-500 text-blue-600 font-semibold bg-blue-50' : 'border-transparent text-gray-600'}`}
                        onClick={() => setConsoleTab(type)}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3">
                    {(consolesByType[consoleTab] || []).map(eq => (
                      <div key={eq.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editData.applicableEquipmentTypes?.includes(eq.id)}
                          onChange={() => handleEditEquipmentType(eq.id)}
                        />
                        <span>{eq.name}</span>
                      </div>
                    ))}
                    {(!consolesByType[consoleTab] || consolesByType[consoleTab].length === 0) && (
                      <span className="text-gray-400 text-xs">Tidak ada console pada kategori ini</span>
                    )}
                  </div>
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleEditCancel}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleEditSave}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal konfirmasi hapus */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4">
            <div className="p-6 text-center">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Konfirmasi Hapus</h2>
              <p className="mb-6 text-gray-700">Apakah Anda yakin ingin menghapus profil tarif ini?</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors hover:bg-red-700"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RateProfilePage;
