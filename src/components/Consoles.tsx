import React, { useState, useEffect } from 'react';
import { Gamepad2, Plus, Settings, Wrench, Clock } from 'lucide-react';
import { mockRateProfiles } from '../data/mockData';
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
    if (!newConsole.name || newConsole.hourlyRate <= 0) {
      Swal.fire('Gagal', 'Console name and hourly rate are required', 'error');
      return;
    }
    setLoading(true);
    try {
      // Insert to Supabase
      const newId = `CNSL-${Date.now()}`;
      const insertData = {
        id: newId,
        name: newConsole.name,
        equipment_type_id: newConsole.type === 'PS5' ? 'ET002' : 'ET001',
        rate_profile_id: newConsole.type === 'PS5' ? 'RP002' : 'RP001',
        status: 'available',
        is_active: true,
      };
      await db.insert('consoles', insertData);
      // Refresh list
      const data = await db.select('consoles');
      setConsoles(data);
      Swal.fire('Berhasil', 'Console added successfully!', 'success');
      setShowAddForm(false);
      setNewConsole({
        name: '',
        type: 'PS5',
        hourlyRate: 0,
        dailyRate: 0,
        weeklyRate: 0
      });
    } catch (err: any) {
      Swal.fire('Gagal', err.message || 'Failed to add console', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Update Console
  const handleEditConsole = async (consoleId: string, updatedFields?: any) => {
    setLoading(true);
    try {
      let updateData = updatedFields;
      if (!updateData) {
        const name = (document.getElementById('edit-name') as HTMLInputElement)?.value;
        const location = (document.getElementById('edit-location') as HTMLInputElement)?.value;
        const serialNumber = (document.getElementById('edit-serial') as HTMLInputElement)?.value;
        let ipAddress = (document.getElementById('edit-ip') as HTMLInputElement)?.value;
        const notes = (document.getElementById('edit-notes') as HTMLTextAreaElement)?.value;
        // Perbaikan: jika ipAddress kosong, set null
        ipAddress = ipAddress && ipAddress.trim() !== '' ? ipAddress : null;
        updateData = {
          name,
          location,
          serial_number: serialNumber,
          ip_address: ipAddress,
          notes
        };
      }
      await db.update('consoles', consoleId, updateData);
      const data = await db.select('consoles');
      setConsoles(data);
      Swal.fire('Berhasil', 'Console updated successfully!', 'success');
      setShowEditForm(null);
    } catch (err: any) {
      Swal.fire('Gagal', err.message || 'Failed to update console', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Delete Console
  const handleDeleteConsole = async (consoleId: string) => {
    const result = await Swal.fire({
      title: 'Hapus Console?',
      text: 'Are you sure you want to delete this console?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;
    setLoading(true);
    try {
      await db.delete('consoles', consoleId);
      const data = await db.select('consoles');
      setConsoles(data);
      Swal.fire('Berhasil', 'Console deleted successfully!', 'success');
    } catch (err: any) {
      Swal.fire('Gagal', err.message || 'Failed to delete console', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Set Maintenance
  const handleSetMaintenance = async (consoleId: string) => {
    await handleEditConsole(consoleId, { status: 'maintenance' });
  };

  // Set Available
  const handleSetAvailable = async (consoleId: string) => {
    await handleEditConsole(consoleId, { status: 'available' });
  };

  const handleStartRental = (consoleId: string) => {
    // Here you would normally start a new rental session
    alert(`Starting new rental for console ${consoleId}`);
  };

  const handleEndSession = (consoleId: string) => {
    // Here you would normally end the current session
    alert(`Ending current session for console ${consoleId}`);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Console Management</h1>
            <p className="text-gray-600">Manage your PlayStation consoles</p>
          </div>
          <button 
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Console
          </button>
        </div>
      </div>

      {/* Console Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {consoles.map((console) => {
          const rateProfile = mockRateProfiles.find(profile => profile.id === console.rateProfileId);
          
          return (
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
                      Console Information
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
                        {console.status === 'available' ? 'Start Rental' : 'View Details'}
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
                        title="Delete Console"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Extended Details */}
                  {selectedConsole === console.id && (
                    <div className="pt-4 border-t border-gray-100">
                      <h4 className="font-semibold text-gray-900 mb-3">Console Information</h4>
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
                            onClick={() => handleStartRental(console.id)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                          >
                            Start New Rental Session
                          </button>
                          <button 
                            onClick={() => handleSetMaintenance(console.id)}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                          >
                            Set to Maintenance
                          </button>
                        </div>
                      )}
                      
                      {console.status === 'rented' && (
                        <div className="mt-4">
                          <button 
                            onClick={() => handleEndSession(console.id)}
                            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                          >
                            End Current Session
                          </button>
                        </div>
                      )}
                      
                      {console.status === 'maintenance' && (
                        <div className="mt-4">
                          <button 
                            onClick={() => handleSetAvailable(console.id)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                          >
                            Mark as Available
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Console Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Console</h2>
              
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Console Name *</label>
                  <input
                    type="text"
                    value={newConsole.name}
                    onChange={(e) => setNewConsole({...newConsole, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., PlayStation 5 - Station 1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Console Type</label>
                  <select 
                    value={newConsole.type}
                    onChange={(e) => setNewConsole({...newConsole, type: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="PS4">PlayStation 4</option>
                    <option value="PS5">PlayStation 5</option>
                  </select>
                </div>
              </form>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddConsole}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Add Console
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Console Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Console</h2>
              
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Console Name</label>
                  <input
                    id="edit-name"
                    type="text"
                    defaultValue={consoles.find(c => c.id === showEditForm)?.name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    id="edit-location"
                    type="text"
                    defaultValue={consoles.find(c => c.id === showEditForm)?.location}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                  <input
                    id="edit-serial"
                    type="text"
                    defaultValue={consoles.find(c => c.id === showEditForm)?.serial_number}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
                  <input
                    id="edit-ip"
                    type="text"
                    defaultValue={consoles.find(c => c.id === showEditForm)?.ip_address}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    id="edit-notes"
                    defaultValue={consoles.find(c => c.id === showEditForm)?.notes}
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
                  Cancel
                </button>
                <button 
                  onClick={() => handleEditConsole(showEditForm)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Update Console
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
            <Clock className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {consoles.filter(c => c.status === 'available').length}
          </h3>
          <p className="text-gray-600 text-sm">Available Consoles</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Gamepad2 className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {consoles.filter(c => c.status === 'rented').length}
          </h3>
          <p className="text-gray-600 text-sm">Currently Rented</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Wrench className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {consoles.filter(c => c.status === 'maintenance').length}
          </h3>
          <p className="text-gray-600 text-sm">Under Maintenance</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Settings className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {Math.round((consoles.filter(c => c.status === 'rented').length / consoles.length) * 100)}%
          </h3>
          <p className="text-gray-600 text-sm">Utilization Rate</p>
        </div>
      </div>
    </div>
  );
};

export default Consoles;