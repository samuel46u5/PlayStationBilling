import React, { useState, useEffect } from 'react';
import { Plus, Search, DollarSign, Edit, Trash2, Clock, Calendar, TrendingUp, Users, Gamepad2, Settings, Eye, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { RateProfile, EquipmentType, Console } from '../types';
import Swal from 'sweetalert2';

const RateManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEquipmentType, setSelectedEquipmentType] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);

  // State for data from database
  const [rateProfiles, setRateProfiles] = useState<RateProfile[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  const [consoles, setConsoles] = useState<Console[]>([]);
  const [loading, setLoading] = useState(false);

  const [newRateProfile, setNewRateProfile] = useState({
    name: '',
    description: '',
    hourlyRate: 0,
    dailyRate: 0,
    weeklyRate: 0,
    monthlyRate: 0,
    peakHourRate: 0,
    peakHourStart: '18:00',
    peakHourEnd: '22:00',
    weekendMultiplier: 1.2,
    applicableEquipmentTypes: [] as string[],
    isActive: true,
  });

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: rateData, error: rateError } = await supabase.from('rate_profiles').select('*').order('created_at', { ascending: false });
        const { data: eqData, error: eqError } = await supabase.from('equipment_types').select('*').order('name');
        const { data: consoleData, error: consoleError } = await supabase.from('consoles').select('*');
        if (rateError || eqError || consoleError) {
          Swal.fire('Gagal mengambil data', 'Pastikan Supabase berjalan dan koneksi benar.', 'error');
        }
        // Mapping snake_case ke camelCase agar tidak error
        setRateProfiles((rateData || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          hourlyRate: Number(p.hourly_rate) || 0,
          dailyRate: Number(p.daily_rate) || 0,
          weeklyRate: Number(p.weekly_rate) || 0,
          monthlyRate: p.monthly_rate !== undefined && p.monthly_rate !== null ? Number(p.monthly_rate) : undefined,
          peakHourRate: p.peak_hour_rate !== undefined && p.peak_hour_rate !== null ? Number(p.peak_hour_rate) : undefined,
          peakHourStart: p.peak_hour_start || '',
          peakHourEnd: p.peak_hour_end || '',
          weekendMultiplier: p.weekend_multiplier !== undefined && p.weekend_multiplier !== null ? Number(p.weekend_multiplier) : 1,
          applicableEquipmentTypes: p.applicable_equipment_types || [],
          isActive: p.is_active,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
          createdBy: p.created_by,
        })));
        setEquipmentTypes((eqData || []).map((e: any) => ({
          id: e.id,
          name: e.name,
          description: e.description,
          icon: e.icon,
          category: e.category,
          isActive: e.is_active,
          createdAt: e.created_at,
          updatedAt: e.updated_at,
        })));
        setConsoles((consoleData || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          equipmentTypeId: c.equipment_type_id,
          rateProfileId: c.rate_profile_id,
          status: c.status,
          location: c.location,
          serialNumber: c.serial_number,
          purchaseDate: c.purchase_date,
          warrantyExpiry: c.warranty_expiry,
          notes: c.notes,
          ipAddress: c.ip_address,
          relayCommand: c.relay_command,
          isActive: c.is_active,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        })));
      } catch (err) {
        Swal.fire('Error', 'Terjadi error saat mengambil data: ' + (err instanceof Error ? err.message : String(err)), 'error');
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredRateProfiles = rateProfiles.filter(profile => {
    const matchesSearch = profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (profile.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEquipmentType = selectedEquipmentType === 'all' || 
                                 (profile.applicableEquipmentTypes || []).includes(selectedEquipmentType);
    return matchesSearch && matchesEquipmentType;
  });

  // Helper untuk refresh data dari Supabase
  const refreshData = async () => {
    setLoading(true);
    const { data: rateData } = await supabase.from('rate_profiles').select('*').order('created_at', { ascending: false });
    setRateProfiles((rateData || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      hourlyRate: Number(p.hourly_rate) || 0,
      dailyRate: Number(p.daily_rate) || 0,
      weeklyRate: Number(p.weekly_rate) || 0,
      monthlyRate: p.monthly_rate !== undefined && p.monthly_rate !== null ? Number(p.monthly_rate) : undefined,
      peakHourRate: p.peak_hour_rate !== undefined && p.peak_hour_rate !== null ? Number(p.peak_hour_rate) : undefined,
      peakHourStart: p.peak_hour_start || '',
      peakHourEnd: p.peak_hour_end || '',
      weekendMultiplier: p.weekend_multiplier !== undefined && p.weekend_multiplier !== null ? Number(p.weekend_multiplier) : 1,
      applicableEquipmentTypes: p.applicable_equipment_types || [],
      isActive: p.is_active,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      createdBy: p.created_by,
    })));
    setLoading(false);
  };

  // Tambah profil tarif ke database
  const handleAddRateProfile = async () => {
    if (!newRateProfile.name || newRateProfile.hourlyRate <= 0) {
      Swal.fire('Validasi Gagal', 'Nama profil tarif dan tarif per jam wajib diisi', 'warning');
      return;
    }
    // Generate id unik (pakai Date.now + random)
    const id = `${Date.now()}_${Math.floor(Math.random()*10000)}`;
    const insertData = {
      id,
      name: newRateProfile.name,
      description: newRateProfile.description,
      hourly_rate: newRateProfile.hourlyRate,
      daily_rate: newRateProfile.dailyRate,
      weekly_rate: newRateProfile.weeklyRate,
      monthly_rate: newRateProfile.monthlyRate,
      peak_hour_rate: newRateProfile.peakHourRate,
      peak_hour_start: newRateProfile.peakHourStart,
      peak_hour_end: newRateProfile.peakHourEnd,
      weekend_multiplier: newRateProfile.weekendMultiplier,
      applicable_equipment_types: newRateProfile.applicableEquipmentTypes,
      is_active: newRateProfile.isActive,
      created_by: null, // TODO: isi user id jika sudah ada auth
    };
    const { error } = await supabase.from('rate_profiles').insert([insertData]);
    if (error) {
      Swal.fire('Gagal', 'Gagal menambah profil tarif: ' + error.message, 'error');
      return;
    }
    setShowAddForm(false);
    setNewRateProfile({
      name: '',
      description: '',
      hourlyRate: 0,
      dailyRate: 0,
      weeklyRate: 0,
      monthlyRate: 0,
      peakHourRate: 0,
      peakHourStart: '18:00',
      peakHourEnd: '22:00',
      weekendMultiplier: 1.2,
      applicableEquipmentTypes: [],
      isActive: true,
    });
    await refreshData();
    Swal.fire('Berhasil', 'Profil tarif berhasil ditambahkan!', 'success');
  };

  // Edit profil tarif ke database
  const handleEditRateProfile = async (profileId: string) => {
    const profile = rateProfiles.find(p => p.id === profileId);
    if (!profile) return;
    // Ambil data dari form (bisa diimprove, ini contoh minimal)
    const form = document.querySelector('#edit-form') as HTMLFormElement;
    if (!form) return;
    const formData = new FormData(form);
    const updateData: any = {
      name: formData.get('name'),
      description: formData.get('description'),
      hourly_rate: Number(formData.get('hourlyRate')),
      daily_rate: Number(formData.get('dailyRate')),
      weekly_rate: Number(formData.get('weeklyRate')),
      monthly_rate: Number(formData.get('monthlyRate')),
      peak_hour_rate: Number(formData.get('peakHourRate')),
      peak_hour_start: formData.get('peakHourStart'),
      peak_hour_end: formData.get('peakHourEnd'),
      weekend_multiplier: Number(formData.get('weekendMultiplier')),
      is_active: formData.get('isActive') === 'true',
    };
    const { error } = await supabase.from('rate_profiles').update(updateData).eq('id', profileId);
    if (error) {
      Swal.fire('Gagal', 'Gagal update profil tarif: ' + error.message, 'error');
      return;
    }
    setShowEditForm(null);
    await refreshData();
    Swal.fire('Berhasil', `Profil tarif berhasil diperbarui!`, 'success');
  };

  // Hapus profil tarif dari database
  const handleDeleteRateProfile = async (profileId: string) => {
    const confirm = await Swal.fire({
      title: 'Konfirmasi',
      text: 'Apakah Anda yakin ingin menghapus profil tarif ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
    });
    if (!confirm.isConfirmed) return;
    const { error } = await supabase.from('rate_profiles').delete().eq('id', profileId);
    if (error) {
      Swal.fire('Gagal', 'Gagal menghapus profil tarif: ' + error.message, 'error');
      return;
    }
    await refreshData();
    Swal.fire('Berhasil', 'Profil tarif berhasil dihapus!', 'success');
  };

  const getEquipmentTypeName = (equipmentTypeId: string) => {
    const equipmentType = equipmentTypes.find(et => et.id === equipmentTypeId);
    return equipmentType?.name || 'Unknown';
  };

  const getConsoleCount = (profileId: string) => {
    return consoles.filter(console => console.rateProfileId === profileId).length;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {loading && <div className="text-center text-gray-500">Memuat data...</div>}
      {!loading && rateProfiles.length === 0 && (
        <div className="text-center text-gray-400 py-10">Tidak ada data profil tarif ditemukan.</div>
      )}
      {!loading && rateProfiles.length > 0 && (
        <>
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

            {/* Filters */}
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
                {equipmentTypes.map(equipmentType => (
                  <option key={equipmentType.id} value={equipmentType.id}>{equipmentType.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Rate Profiles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRateProfiles.map((profile) => (
              <div key={profile.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 p-4 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <DollarSign className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{profile.name}</h3>
                        <span className="text-sm opacity-90">{getConsoleCount(profile.id)} console menggunakan</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      profile.isActive ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
                    }`}>
                      {profile.isActive ? 'AKTIF' : 'NONAKTIF'}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4">
                  <div className="space-y-4">
                    {/* Description */}
                    <p className="text-gray-600 text-sm">{profile.description}</p>

                    {/* Pricing */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Struktur Tarif
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Per Jam</span>
                          <span className="font-semibold text-blue-600">
                            Rp {profile.hourlyRate.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Per Hari</span>
                          <span className="font-semibold text-green-600">
                            Rp {profile.dailyRate.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Per Minggu</span>
                          <span className="font-semibold text-purple-600">
                            Rp {profile.weeklyRate.toLocaleString('id-ID')}
                          </span>
                        </div>
                        {profile.monthlyRate && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Per Bulan</span>
                            <span className="font-semibold text-orange-600">
                              Rp {profile.monthlyRate.toLocaleString('id-ID')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Peak Hour & Weekend */}
                    {(profile.peakHourRate || profile.weekendMultiplier) && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Tarif Khusus
                        </h4>
                        <div className="space-y-2">
                          {profile.peakHourRate && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">
                                Peak Hour ({profile.peakHourStart} - {profile.peakHourEnd})
                              </span>
                              <span className="font-semibold text-red-600">
                                Rp {profile.peakHourRate.toLocaleString('id-ID')}
                              </span>
                            </div>
                          )}
                          {profile.weekendMultiplier && profile.weekendMultiplier !== 1 && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Weekend Multiplier</span>
                              <span className="font-semibold text-yellow-600">
                                {profile.weekendMultiplier}x
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Applicable Equipment Types */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Gamepad2 className="h-4 w-4" />
                        Berlaku Untuk
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {profile.applicableEquipmentTypes.map((equipmentTypeId) => (
                          <span
                            key={equipmentTypeId}
                            className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {getEquipmentTypeName(equipmentTypeId)}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setSelectedProfile(selectedProfile === profile.id ? null : profile.id)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          {selectedProfile === profile.id ? 'Tutup Detail' : 'Lihat Detail'}
                        </button>
                        <button 
                          onClick={() => setShowEditForm(profile.id)}
                          className="p-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteRateProfile(profile.id)}
                          className="p-2 border border-red-300 hover:border-red-400 text-red-600 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Extended Details */}
                    {selectedProfile === profile.id && (
                      <div className="pt-4 border-t border-gray-100">
                        <h4 className="font-semibold text-gray-900 mb-3">Detail Profil Tarif</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">ID Profil:</span>
                            <span className="font-medium">{profile.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Dibuat oleh:</span>
                            <span className="font-medium">{profile.createdBy}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Dibuat pada:</span>
                            <span className="font-medium">{new Date(profile.createdAt).toLocaleDateString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Terakhir diupdate:</span>
                            <span className="font-medium">{new Date(profile.updatedAt).toLocaleDateString('id-ID')}</span>
                          </div>
                        </div>
                        
                        {/* Console Usage */}
                        <div className="mt-4">
                          <h5 className="font-medium text-gray-900 mb-2">Console yang Menggunakan Tarif Ini</h5>
                          <div className="space-y-1">
                            {consoles
                              .filter(console => console.rateProfileId === profile.id)
                              .map(console => (
                                <div key={console.id} className="text-sm text-gray-600 flex items-center gap-2">
                                  <Gamepad2 className="h-3 w-3" />
                                  {console.name}
                                </div>
                              ))}
                            {getConsoleCount(profile.id) === 0 && (
                              <p className="text-sm text-gray-500 italic">Belum ada console yang menggunakan tarif ini</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Rate Profile Modal */}
          {showAddForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Tambah Profil Tarif Baru</h2>
                  
                  <form className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Profil *</label>
                        <input
                          type="text"
                          value={newRateProfile.name}
                          onChange={(e) => setNewRateProfile({...newRateProfile, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., PlayStation Premium"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                          <option value="true">Aktif</option>
                          <option value="false">Nonaktif</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                      <textarea
                        value={newRateProfile.description}
                        onChange={(e) => setNewRateProfile({...newRateProfile, description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={2}
                        placeholder="Deskripsi profil tarif"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tarif per Jam *</label>
                        <input
                          type="number"
                          value={newRateProfile.hourlyRate}
                          onChange={(e) => setNewRateProfile({...newRateProfile, hourlyRate: Number(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="15000"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tarif per Hari</label>
                        <input
                          type="number"
                          value={newRateProfile.dailyRate}
                          onChange={(e) => setNewRateProfile({...newRateProfile, dailyRate: Number(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="120000"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tarif per Minggu</label>
                        <input
                          type="number"
                          value={newRateProfile.weeklyRate}
                          onChange={(e) => setNewRateProfile({...newRateProfile, weeklyRate: Number(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="700000"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tarif per Bulan</label>
                        <input
                          type="number"
                          value={newRateProfile.monthlyRate}
                          onChange={(e) => setNewRateProfile({...newRateProfile, monthlyRate: Number(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="2500000"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tarif Peak Hour</label>
                        <input
                          type="number"
                          value={newRateProfile.peakHourRate}
                          onChange={(e) => setNewRateProfile({...newRateProfile, peakHourRate: Number(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="18000"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Peak Hour Mulai</label>
                        <input
                          type="time"
                          value={newRateProfile.peakHourStart}
                          onChange={(e) => setNewRateProfile({...newRateProfile, peakHourStart: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Peak Hour Selesai</label>
                        <input
                          type="time"
                          value={newRateProfile.peakHourEnd}
                          onChange={(e) => setNewRateProfile({...newRateProfile, peakHourEnd: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Weekend Multiplier</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newRateProfile.weekendMultiplier}
                        onChange={(e) => setNewRateProfile({...newRateProfile, weekendMultiplier: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="1.2"
                      />
                      <p className="text-xs text-gray-500 mt-1">Multiplier untuk weekend (1.2 = 20% lebih mahal)</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Berlaku untuk Equipment</label>
                      <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3">
                        {equipmentTypes.map(equipmentType => (
                          <label key={equipmentType.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={newRateProfile.applicableEquipmentTypes.includes(equipmentType.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewRateProfile({
                                    ...newRateProfile,
                                    applicableEquipmentTypes: [...newRateProfile.applicableEquipmentTypes, equipmentType.id]
                                  });
                                } else {
                                  setNewRateProfile({
                                    ...newRateProfile,
                                    applicableEquipmentTypes: newRateProfile.applicableEquipmentTypes.filter(id => id !== equipmentType.id)
                                  });
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">{equipmentType.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </form>
                  
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                    >
                      Batal
                    </button>
                    <button 
                      onClick={handleAddRateProfile}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Simpan Profil Tarif
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit Rate Profile Modal */}
          {showEditForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Profil Tarif</h2>
                  
                  <form className="space-y-4" id="edit-form">
                    {(() => {
                      const profile = rateProfiles.find(p => p.id === showEditForm);
                      if (!profile) return null;
                      return (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Profil</label>
                              <input
                                type="text"
                                name="name"
                                defaultValue={profile.name}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                              <select
                                name="isActive"
                                defaultValue={profile.isActive.toString()}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="true">Aktif</option>
                                <option value="false">Nonaktif</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                            <textarea
                              name="description"
                              defaultValue={profile.description}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              rows={2}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Tarif per Jam</label>
                              <input
                                type="number"
                                name="hourlyRate"
                                defaultValue={profile.hourlyRate}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Tarif per Hari</label>
                              <input
                                type="number"
                                name="dailyRate"
                                defaultValue={profile.dailyRate}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Tarif per Minggu</label>
                              <input
                                type="number"
                                name="weeklyRate"
                                defaultValue={profile.weeklyRate}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Tarif per Bulan</label>
                              <input
                                type="number"
                                name="monthlyRate"
                                defaultValue={profile.monthlyRate || 0}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Tarif Peak Hour</label>
                              <input
                                type="number"
                                name="peakHourRate"
                                defaultValue={profile.peakHourRate || 0}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Peak Hour Mulai</label>
                              <input
                                type="time"
                                name="peakHourStart"
                                defaultValue={profile.peakHourStart || '18:00'}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Peak Hour Selesai</label>
                              <input
                                type="time"
                                name="peakHourEnd"
                                defaultValue={profile.peakHourEnd || '22:00'}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Weekend Multiplier</label>
                            <input
                              type="number"
                              step="0.1"
                              name="weekendMultiplier"
                              defaultValue={profile.weekendMultiplier || 1}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </>
                      );
                    })()}
                  </form>
                  
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowEditForm(null)}
                      className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                    >
                      Batal
                    </button>
                    <button 
                      onClick={() => handleEditRateProfile(showEditForm)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Perbarui Profil Tarif
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
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{rateProfiles.length}</h3>
              <p className="text-gray-600 text-sm">Total Profil Tarif</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {rateProfiles.filter(p => p.isActive).length}
              </h3>
              <p className="text-gray-600 text-sm">Profil Aktif</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Gamepad2 className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {consoles.filter(c => c.rateProfileId).length}
              </h3>
              <p className="text-gray-600 text-sm">Console Menggunakan Tarif</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                Rp {Math.round(rateProfiles.reduce((sum, p) => sum + p.hourlyRate, 0) / rateProfiles.length).toLocaleString('id-ID')}
              </h3>
              <p className="text-gray-600 text-sm">Rata-rata Tarif/Jam</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RateManagement;