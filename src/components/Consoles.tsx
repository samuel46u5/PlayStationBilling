import React, { useState, useEffect } from 'react';
import { Gamepad2, Plus, Settings, Wrench, Clock, LayoutGrid, List as ListIcon } from 'lucide-react';
import { mockRateProfiles, mockEquipmentTypes } from '../data/mockData';
import { db } from '../lib/supabase';
import Swal from 'sweetalert2';

const Consoles: React.FC = () => {
  const [consoles, setConsoles] = useState<any[]>([]);
  const [selectedConsole, setSelectedConsole] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState<string | null>(null);
  const [newConsole, setNewConsole] = useState({
    name: '',
    type: 'PS5' as 'PS4' | 'PS5',
    hourlyRate: 0,
    dailyRate: 0,
    weeklyRate: 0
  });
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [editTab, setEditTab] = useState<'umum' | 'teknis' | 'perintah'>('umum');
  const [addTab, setAddTab] = useState<'umum' | 'teknis'>('umum');
  const [editConsoleData, setEditConsoleData] = useState<any>(null);

  useEffect(() => {
    // Fetch consoles from Supabase
    const fetchConsoles = async () => {
      setLoading(true);
      try {
        const data = await db.select('consoles');
        setConsoles(data);
      } catch (err) {
        alert('Failed to fetch consoles');
      } finally {
        setLoading(false);
      }
    };
    fetchConsoles();
  }, []);

  useEffect(() => {
    if (showEditForm) {
      setEditTab('umum');
      const editing = consoles.find(c => c.id === showEditForm);
      setEditConsoleData(editing ? { ...editing } : null);
    }
  }, [showEditForm, consoles]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'rented': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <Clock className="h-4 w-4" />;
      case 'rented': return <Gamepad2 className="h-4 w-4" />;
      case 'maintenance': return <Wrench className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const handleAddConsole = async () => {
    setLoading(true);
    try {
      // Ambil semua field dari form (dua tab)
      const name = (document.getElementById('add-name') as HTMLInputElement)?.value;
      const equipmentTypeId = (document.getElementById('add-equipment-type') as HTMLSelectElement)?.value;
      const status = (document.getElementById('add-status') as HTMLSelectElement)?.value;
      const location = (document.getElementById('add-location') as HTMLInputElement)?.value;
      const serialNumber = (document.getElementById('add-serial') as HTMLInputElement)?.value;
      const isActive = (document.getElementById('add-active') as HTMLInputElement)?.checked;
      const purchaseDate = (document.getElementById('add-purchase-date') as HTMLInputElement)?.value;
      const warrantyExpiry = (document.getElementById('add-warranty') as HTMLInputElement)?.value;
      let ipAddress = (document.getElementById('add-ip') as HTMLInputElement)?.value;
      const relayCommandOn = (document.getElementById('add-relay-on') as HTMLInputElement)?.value;
      const relayCommandOff = (document.getElementById('add-relay-off') as HTMLInputElement)?.value;
      const relayCommandStatus = (document.getElementById('add-relay-status') as HTMLInputElement)?.value;
      const powerTvCommand = (document.getElementById('add-power-tv') as HTMLInputElement)?.value;
      const notes = (document.getElementById('add-notes') as HTMLTextAreaElement)?.value;
      // Field opsional: null jika kosong
      const safe = (v: string | undefined) => v && v.trim() !== '' ? v : null;
      if (!name) {
        Swal.fire('Gagal', 'Nama konsol diperlukan', 'error');
        setLoading(false);
        return;
      }
      const newId = `CNSL-${Date.now()}`;
      const insertData = {
        id: newId,
        name,
        equipment_type_id: equipmentTypeId,
        status,
        location: safe(location),
        serial_number: safe(serialNumber),
        is_active: !!isActive,
        purchase_date: safe(purchaseDate),
        warranty_expiry: safe(warrantyExpiry),
        ip_address: safe(ipAddress),
        relay_command_on: safe(relayCommandOn),
        relay_command_off: safe(relayCommandOff),
        relay_command_status: safe(relayCommandStatus),
        power_tv_command: safe(powerTvCommand),
        notes: safe(notes)
      };
      await db.insert('consoles', insertData);
      // Refresh list
      const data = await db.select('consoles');
      setConsoles(data);
      Swal.fire('Berhasil', 'Konsol berhasil ditambahkan!', 'success');
      setShowAddForm(false);
      setNewConsole({
        name: '',
        type: 'PS5',
        hourlyRate: 0,
        dailyRate: 0,
        weeklyRate: 0
      });
    } catch (err: any) {
      Swal.fire('Gagal', err.message || 'Gagal menambahkan konsol', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Update Console
  const handleEditConsole = async (consoleId: string) => {
    if (!editConsoleData) return;
    setLoading(true);
    try {
      // Field opsional: null jika kosong
      const safe = (v: string | undefined) => v && v.trim() !== '' ? v : null;
      const updateData = {
        name: editConsoleData.name,
        equipment_type_id: editConsoleData.equipment_type_id,
        status: editConsoleData.status,
        location: safe(editConsoleData.location),
        serial_number: safe(editConsoleData.serial_number),
        is_active: !!editConsoleData.is_active,
        purchase_date: safe(editConsoleData.purchase_date),
        warranty_expiry: safe(editConsoleData.warranty_expiry),
        ip_address: safe(editConsoleData.ip_address),
        relay_command_on: safe(editConsoleData.relay_command_on),
        relay_command_off: safe(editConsoleData.relay_command_off),
        relay_command_status: safe(editConsoleData.relay_command_status),
        power_tv_command: safe(editConsoleData.power_tv_command),
        notes: safe(editConsoleData.notes)
      };
      await db.update('consoles', consoleId, updateData);
      const data = await db.select('consoles');
      setConsoles(data);
      Swal.fire('Berhasil', 'Konsol berhasil diperbarui!', 'success');
      setShowEditForm(null);
    } catch (err: any) {
      Swal.fire('Gagal', err.message || 'Gagal memperbarui konsol', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Delete Console
  const handleDeleteConsole = async (consoleId: string) => {
    const result = await Swal.fire({
      title: 'Hapus Konsol?',
      text: 'Apakah Anda yakin ingin menghapus konsol ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;
    setLoading(true);
    try {
      await db.delete('consoles', consoleId);
      const data = await db.select('consoles');
      setConsoles(data);
      Swal.fire('Berhasil', 'Konsol berhasil dihapus!', 'success');
    } catch (err: any) {
      Swal.fire('Gagal', err.message || 'Gagal menghapus konsol', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Set Maintenance
  const handleSetMaintenance = async (consoleId: string) => {
    setEditConsoleData((prev: any) => ({ ...prev, status: 'maintenance' }));
    setTimeout(() => handleEditConsole(consoleId), 0);
  };

  // Set Available
  const handleSetAvailable = async (consoleId: string) => {
    setEditConsoleData((prev: any) => ({ ...prev, status: 'available' }));
    setTimeout(() => handleEditConsole(consoleId), 0);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Summary Stats - DIPINDAH KE ATAS */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Clock className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {/* Jumlah Konsol Tersedia */}
            {consoles.filter(c => c.status === 'available').length}
          </h3>
          <p className="text-gray-600 text-sm">Konsol Tersedia</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Gamepad2 className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {/* Jumlah Konsol Disewa */}
            {consoles.filter(c => c.status === 'rented').length}
          </h3>
          <p className="text-gray-600 text-sm">Sedang Disewa</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Wrench className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {/* Jumlah Konsol Maintenance */}
            {consoles.filter(c => c.status === 'maintenance').length}
          </h3>
          <p className="text-gray-600 text-sm">Dalam Pemeliharaan</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Settings className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {/* Tingkat Pemanfaatan */}
            {consoles.length > 0 ? `${Math.round((consoles.filter(c => c.status === 'rented').length / consoles.length) * 100)}%` : '0%'}
          </h3>
          <p className="text-gray-600 text-sm">Tingkat Pemanfaatan</p>
        </div>
      </div>
      {/* END Summary Stats */}

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Manajemen Konsol</h1>
            <p className="text-gray-600">Kelola konsol PlayStation Anda</p>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 rounded-lg border ${viewMode === 'card' ? 'bg-blue-100 border-blue-400' : 'bg-white border-gray-300'} transition-colors`}
              title="Tampilan Kartu"
            >
              <LayoutGrid className={`h-5 w-5 ${viewMode === 'card' ? 'text-blue-600' : 'text-gray-400'}`} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg border ${viewMode === 'list' ? 'bg-blue-100 border-blue-400' : 'bg-white border-gray-300'} transition-colors`}
              title="Tampilan Daftar"
            >
              <ListIcon className={`h-5 w-5 ${viewMode === 'list' ? 'text-blue-600' : 'text-gray-400'}`} />
            </button>
            <button 
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Tambah Konsol
            </button>
          </div>
        </div>
      </div>

      {/* Tampilan List */}
      {viewMode === 'list' && (
        <div className="overflow-x-auto mb-8">
          <table className="min-w-full bg-white rounded-xl shadow-sm border border-gray-200">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="px-4 py-2 text-left">Nama</th>
                <th className="px-4 py-2 text-left">Tipe</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Lokasi</th>
                <th className="px-4 py-2 text-left">Serial</th>
                <th className="px-4 py-2 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {consoles.map((console) => (
                <tr key={console.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{console.name}</td>
                  <td className="px-4 py-2">{console.equipment_type_id}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                      console.status === 'available' ? 'bg-green-100 text-green-700' :
                      console.status === 'rented' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {getStatusIcon(console.status)}
                      {console.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">{console.location || '-'}</td>
                  <td className="px-4 py-2">{console.serial_number || '-'}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      onClick={() => setShowEditForm(console.id)}
                      className="p-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg transition-colors"
                      title="Edit Konsol"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteConsole(console.id)}
                      className="p-2 border border-red-300 hover:border-red-500 text-red-600 rounded-lg transition-colors"
                      title="Hapus Konsol"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 7.5V19a2 2 0 002 2h8a2 2 0 002-2V7.5M4 7.5h16M10 11v6M14 11v6M9 7.5V5a2 2 0 012-2h2a2 2 0 012 2v2.5" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tampilan Card (Grid) */}
      {viewMode === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {consoles.map((console) => (
            <div key={console.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Header */}
              <div className={`p-4 ${console.equipmentTypeId === 'ET002' ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gradient-to-r from-purple-600 to-purple-700'} text-white`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <Gamepad2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{console.name}</h3>
                      <span className="text-sm opacity-90">{console.location}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                    console.status === 'available' ? 'bg-green-500 text-white' :
                    console.status === 'rented' ? 'bg-orange-500 text-white' :
                    'bg-red-500 text-white'
                  }`}>
                    {getStatusIcon(console.status)}
                    {console.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-4">
                <div className="space-y-4">
                  {/* Console Info */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Informasi Konsol
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Serial Number</span>
                        <span className="font-medium text-gray-900">
                          {console.serial_number || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Location</span>
                        <span className="font-medium text-gray-900">
                          {console.location || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Purchase Date</span>
                        <span className="font-medium text-gray-900">
                          {console.purchase_date ? new Date(console.purchase_date).toLocaleDateString('id-ID') : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Warranty</span>
                        <span className="font-medium text-gray-900">
                          {console.warranty_expiry ? new Date(console.warranty_expiry).toLocaleDateString('id-ID') : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setSelectedConsole(selectedConsole === console.id ? null : console.id)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        Lihat Detail
                      </button>
                      <button 
                        onClick={() => setShowEditForm(console.id)}
                        className="p-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteConsole(console.id)}
                        className="p-2 border border-red-300 hover:border-red-500 text-red-600 rounded-lg transition-colors"
                        title="Hapus Console"
                      >
                        {/* Ikon keranjang sampah */}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 7.5V19a2 2 0 002 2h8a2 2 0 002-2V7.5M4 7.5h16M10 11v6M14 11v6M9 7.5V5a2 2 0 012-2h2a2 2 0 012 2v2.5" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Extended Details */}
                  {selectedConsole === console.id && (
                    <div className="pt-4 border-t border-gray-100">
                      <h4 className="font-semibold text-gray-900 mb-3">Informasi Konsol</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Console ID:</span>
                          <span className="font-medium">{console.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Equipment Type:</span>
                          <span className="font-medium">{console.equipment_type_id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Current Status:</span>
                          <span className={`font-medium ${
                            console.status === 'available' ? 'text-green-600' :
                            console.status === 'rented' ? 'text-blue-600' : 'text-red-600'
                          }`}>
                            {console.status}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Revenue Today:</span>
                          <span className="font-medium text-green-600">Rp 150,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Hours Played Today:</span>
                          <span className="font-medium">8.5 hours</span>
                        </div>
                        {console.ip_address && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">IP Address:</span>
                            <span className="font-medium">{console.ip_address}</span>
                          </div>
                        )}
                        {console.notes && (
                          <div className="mt-3">
                            <span className="text-gray-600">Notes:</span>
                            <p className="font-medium mt-1">{console.notes}</p>
                          </div>
                        )}
                      </div>
                      
                      {console.status === 'available' && (
                        <div className="mt-4 space-y-2">
                          <button 
                            onClick={() => handleSetMaintenance(console.id)}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                          >
                            Setel ke Pemeliharaan
                          </button>
                        </div>
                      )}
                      
                      {console.status === 'rented' && (
                        <div className="mt-4">
                          {/* Hapus tombol Akhiri Sesi Saat Ini */}
                        </div>
                      )}
                      
                      {console.status === 'maintenance' && (
                        <div className="mt-4">
                          <button 
                            onClick={() => handleSetAvailable(console.id)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                          >
                            Tandai Sebagai Tersedia
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Console Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Tambah Konsol Baru</h2>
              <div className="flex gap-2 mb-6">
                <button
                  type="button"
                  className={`flex-1 px-4 py-2 rounded-lg font-medium border transition-colors ${addTab === 'umum' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
                  onClick={() => setAddTab('umum')}
                >
                  Informasi Umum
                </button>
                <button
                  type="button"
                  className={`flex-1 px-4 py-2 rounded-lg font-medium border transition-colors ${addTab === 'teknis' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
                  onClick={() => setAddTab('teknis')}
                >
                  Detail Teknis
                </button>
              </div>
              <form className="space-y-4">
                {addTab === 'umum' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nama Konsol *</label>
                      <input
                        id="add-name"
                        type="text"
                        defaultValue={newConsole.name}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="mis. PlayStation 5 - Station 1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Konsol</label>
                      <select
                        id="add-equipment-type"
                        defaultValue={newConsole.type === 'PS5' ? 'ET002' : 'ET001'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {mockEquipmentTypes.map(type => (
                          <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        id="add-status"
                        defaultValue="available"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="available">Tersedia</option>
                        <option value="rented">Disewa</option>
                        <option value="maintenance">Pemeliharaan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
                      <input
                        id="add-location"
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                      <input
                        id="add-serial"
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="add-active"
                        type="checkbox"
                        defaultChecked={true}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                      <label htmlFor="add-active" className="text-sm text-gray-700">Aktif</label>
                    </div>
                  </>
                )}
                {addTab === 'teknis' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Pembelian</label>
                      <input
                        id="add-purchase-date"
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Garansi s/d</label>
                      <input
                        id="add-warranty"
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
                      <input
                        id="add-ip"
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Perintah Relay ON</label>
                    <input
                      id="add-relay-on"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Perintah Relay OFF</label>
                    <input
                      id="add-relay-off"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Perintah Relay STATUS</label>
                    <input
                      id="add-relay-status"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Perintah Power TV</label>
                    <input
                      id="add-power-tv"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                      <textarea
                        id="add-notes"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        placeholder="Catatan tambahan tentang konsol ini"
                      />
                    </div>
                  </>
                )}
              </form>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleAddConsole}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Tambah Konsol
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Console Modal */}
      {showEditForm && editConsoleData && (() => {
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Konsol</h2>
                <div className="flex gap-2 mb-6">
                  <button
                    type="button"
                    className={`flex-1 px-4 py-2 rounded-lg font-medium border transition-colors ${editTab === 'umum' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
                    onClick={() => setEditTab('umum')}
                  >
                    Informasi Umum
                  </button>
                  <button
                    type="button"
                    className={`flex-1 px-4 py-2 rounded-lg font-medium border transition-colors ${editTab === 'teknis' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
                    onClick={() => setEditTab('teknis')}
                  >
                    Detail Teknis
                  </button>
                  <button
                    type="button"
                    className={`flex-1 px-4 py-2 rounded-lg font-medium border transition-colors ${editTab === 'perintah' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
                    onClick={() => setEditTab('perintah')}
                  >
                    Daftar Perintah
                  </button>
                </div>
                <form className="space-y-4">
                  {editTab === 'umum' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Konsol *</label>
                        <input
                          type="text"
                          value={editConsoleData.name}
                          onChange={e => setEditConsoleData((prev: any) => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="mis. PlayStation 5 - Station 1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Konsol</label>
                        <select
                          value={editConsoleData.equipment_type_id}
                          onChange={e => setEditConsoleData((prev: any) => ({ ...prev, equipment_type_id: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {mockEquipmentTypes.map(type => (
                            <option key={type.id} value={type.id}>{type.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                          value={editConsoleData.status}
                          onChange={e => setEditConsoleData((prev: any) => ({ ...prev, status: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="available">Tersedia</option>
                          <option value="rented">Disewa</option>
                          <option value="maintenance">Pemeliharaan</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
                        <input
                          type="text"
                          value={editConsoleData.location || ''}
                          onChange={e => setEditConsoleData((prev: any) => ({ ...prev, location: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                        <input
                          type="text"
                          value={editConsoleData.serial_number || ''}
                          onChange={e => setEditConsoleData((prev: any) => ({ ...prev, serial_number: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!editConsoleData.is_active}
                          onChange={e => setEditConsoleData((prev: any) => ({ ...prev, is_active: e.target.checked }))}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                        <label className="text-sm text-gray-700">Aktif</label>
                      </div>
                    </>
                  )}
                  {editTab === 'teknis' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Pembelian</label>
                        <input
                          type="date"
                          value={editConsoleData.purchase_date || ''}
                          onChange={e => setEditConsoleData((prev: any) => ({ ...prev, purchase_date: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Garansi s/d</label>
                        <input
                          type="date"
                          value={editConsoleData.warranty_expiry || ''}
                          onChange={e => setEditConsoleData((prev: any) => ({ ...prev, warranty_expiry: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                        <textarea
                          value={editConsoleData.notes || ''}
                          onChange={e => setEditConsoleData((prev: any) => ({ ...prev, notes: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={3}
                          placeholder="Catatan tambahan tentang konsol ini"
                        />
                      </div>
                    </>
                  )}
                  {editTab === 'perintah' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
                        <input
                          type="text"
                          value={editConsoleData.ip_address || ''}
                          onChange={e => setEditConsoleData((prev: any) => ({ ...prev, ip_address: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Perintah Relay ON</label>
                        <input
                          type="text"
                          value={editConsoleData.relay_command_on || ''}
                          onChange={e => setEditConsoleData((prev: any) => ({ ...prev, relay_command_on: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Perintah Relay OFF</label>
                        <input
                          type="text"
                          value={editConsoleData.relay_command_off || ''}
                          onChange={e => setEditConsoleData((prev: any) => ({ ...prev, relay_command_off: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Perintah Relay STATUS</label>
                        <input
                          type="text"
                          value={editConsoleData.relay_command_status || ''}
                          onChange={e => setEditConsoleData((prev: any) => ({ ...prev, relay_command_status: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Perintah Power TV</label>
                        <input
                          type="text"
                          value={editConsoleData.power_tv_command || ''}
                          onChange={e => setEditConsoleData((prev: any) => ({ ...prev, power_tv_command: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </>
                  )}
                </form>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setShowEditForm(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={() => handleEditConsole(editConsoleData.id)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Consoles;
