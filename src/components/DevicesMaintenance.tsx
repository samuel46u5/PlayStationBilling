import React from 'react';
import { db } from '../lib/supabase';
import Swal from 'sweetalert2';
import { Edit2, Trash2, Clock } from 'lucide-react';

const DevicesMaintenance: React.FC = () => {
  const [devices, setDevices] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [time, setTime] = React.useState(() => new Date());
  const [filter, setFilter] = React.useState<'all' | 'available' | 'rented' | 'maintenance'>('all');
  const [viewMode, setViewMode] = React.useState<'simple' | 'detail' | 'list'>('simple');
  const [showAdd, setShowAdd] = React.useState(false);
  const [editDevice, setEditDevice] = React.useState<any | null>(null);

  React.useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        // fetch consoles with equipment type name
        const data = await db.select('consoles', `*, equipment_types(name)`);
        setDevices(data || []);
      } catch (err) {
        setDevices([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // clock
  React.useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const counts = React.useMemo(() => ({
    available: devices.filter((d) => d.status === 'available').length,
    rented: devices.filter((d) => d.status === 'rented').length,
    maintenance: devices.filter((d) => d.status === 'maintenance').length,
    total: devices.length,
  }), [devices]);

  const displayedDevices = React.useMemo(() => {
    return devices.filter((d) => {
      const matchesFilter = filter === 'all' || d.status === filter;
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch = q === '' || (d.name || '').toLowerCase().includes(q) || (d.equipment_types?.name || '').toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [devices, filter, searchTerm]);

  const handleDelete = async (device: any) => {
    const r = await Swal.fire({
      title: `Hapus console ${device.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Hapus',
    });
    if (r.isConfirmed) {
      try {
        await db.delete('consoles', device.id);
        setDevices((s) => s.filter((d) => d.id !== device.id));
        Swal.fire({ icon: 'success', title: 'Terhapus' });
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Gagal menghapus' });
      }
    }
  };

  return (
    <div className="p-6">
      {/* Header styled like reference */}
      <div className="mb-6">
        <div className="flex items-start justify-between w-full">
          <div className="flex items-start gap-4">
            <div className="flex items-center gap-3">
              <div className="text-blue-600">
                <Clock className="h-5 w-5" />
              </div>
              <div className="text-lg font-semibold">
                {/* time with dots like 17.00.09 */}
                {(() => {
                  const h = String(time.getHours()).padStart(2, '0');
                  const m = String(time.getMinutes()).padStart(2, '0');
                  const s = String(time.getSeconds()).padStart(2, '0');
                  return `${h}.${m}.${s}`;
                })()}
              </div>
            </div>

            <div className="ml-4">
              <h2 className="text-2xl font-bold">Console Management</h2>
              <p className="text-sm text-gray-600">Monitor all consoles and manage rental sessions</p>
            </div>

            <div className="ml-6">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama console..."
                className="border border-gray-200 rounded px-3 py-2 w-64 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-md text-sm ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200'}`}>
                Semua
              </button>
              <button onClick={() => setFilter('available')} className="px-4 py-2 rounded-md text-sm bg-white border border-gray-200">Available ({counts.available})</button>
              <button onClick={() => setFilter('rented')} className="px-4 py-2 rounded-md text-sm bg-white border border-gray-200">Active ({counts.rented})</button>
              <button onClick={() => setFilter('maintenance')} className="px-4 py-2 rounded-md text-sm bg-white border border-gray-200">Maintenance ({counts.maintenance})</button>
            </div>

            <button className="px-3 py-2 rounded-md border border-gray-200 text-sm">Lihat History</button>

            <div className="flex items-center gap-2">
              <button onClick={() => setViewMode('simple')} className={`px-3 py-2 rounded-md text-sm ${viewMode === 'simple' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200'}`}>Simple</button>
              <button onClick={() => setViewMode('detail')} className={`px-3 py-2 rounded-md text-sm ${viewMode === 'detail' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200'}`}>Detail</button>
              <button onClick={() => setViewMode('list')} className={`px-3 py-2 rounded-md text-sm ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200'}`}>List</button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : displayedDevices.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-500">No devices found</td></tr>
              ) : (
                displayedDevices.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{d.name}</td>
                    <td className="px-6 py-4">{d.equipment_types?.name || d.type || '-'}</td>
                    <td className="px-6 py-4">{d.status || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex gap-2">
                        <button onClick={() => setEditDevice(d)} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded inline-flex items-center gap-2"><Edit2 className="h-4 w-4"/>Edit</button>
                        <button onClick={() => handleDelete(d)} className="px-3 py-1 bg-red-100 text-red-800 rounded inline-flex items-center gap-2"><Trash2 className="h-4 w-4"/>Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <ConsoleModal
          onClose={() => setShowAdd(false)}
          onSaved={(created) => {
            setShowAdd(false);
            setDevices((s) => [created, ...s]);
          }}
        />
      )}

      {editDevice && (
        <ConsoleModal
          device={editDevice}
          onClose={() => setEditDevice(null)}
          onSaved={(updated) => {
            setEditDevice(null);
            setDevices((s) => s.map((x) => (x.id === updated.id ? updated : x)));
          }}
        />
      )}
    </div>
  );
};

export default DevicesMaintenance;

interface ConsoleModalProps {
  device?: any;
  onClose: () => void;
  onSaved: (item: any) => void;
}

const ConsoleModal: React.FC<ConsoleModalProps> = ({ device, onClose, onSaved }) => {
  const [name, setName] = React.useState(device?.name || '');
  const [type, setType] = React.useState(device?.equipment_types?.name || device?.type || '');
  const [status, setStatus] = React.useState(device?.status || 'available');
  const [loading, setLoading] = React.useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (device) {
        const updated = await db.update('consoles', device.id, { name, status });
        onSaved(updated);
      } else {
        const created = await db.insert('consoles', { id: uuidv4(), name, status });
        onSaved(created);
      }
      Swal.fire({ icon: 'success', title: 'Saved' });
    } catch (err) {
      const msg = (err && (err as any).message) || 'Failed';
      Swal.fire({ icon: 'error', title: 'Error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{device ? 'Edit Console' : 'Tambah Console'}</h2>
          <form className="space-y-4" onSubmit={handleSave}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <input value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="available">Available</option>
                <option value="rented">Rented</option>
                <option value="maintenance">Maintenance</option>
                <option value="out_of_order">Out of Order</option>
              </select>
            </div>

            <div className="flex gap-3 mt-6">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg">{loading ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

function uuidv4() {
  if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) {
    return (crypto as any).randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
