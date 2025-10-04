import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, XCircle } from 'lucide-react';
import { db } from '../lib/supabase';
import Swal from 'sweetalert2';

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

type DaySpec = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
};

type Paket = {
  id: string;
  code?: string;
  name: string;
  description?: string;
  status: string;
  durationHours: number;
  durationMinutes: number;
  hargaNormal?: number;
  packagePrice?: number;
  discountAmount?: number;
  selectedConsoles?: string[];
  hariJamList?: DaySpec[];
};

const defaultDays = [
  { id: 'mon', day: 'Senin', startTime: '09:00', endTime: '21:00' },
  { id: 'tue', day: 'Selasa', startTime: '09:00', endTime: '21:00' },
  { id: 'wed', day: 'Rabu', startTime: '09:00', endTime: '21:00' },
  { id: 'thu', day: 'Kamis', startTime: '09:00', endTime: '21:00' },
  { id: 'fri', day: 'Jumat', startTime: '09:00', endTime: '21:00' },
  { id: 'sat', day: 'Sabtu', startTime: '09:00', endTime: '23:59' },
  { id: 'sun', day: 'Minggu', startTime: '09:00', endTime: '21:00' },
];

const PaketManagement: React.FC = () => {
  const [pakets, setPakets] = useState<Paket[]>([]);
  const [consoles, setConsoles] = useState<{ id: string; name: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Paket>>({
    name: '',
    code: undefined,
    status: 'active',
    durationHours: 1,
    durationMinutes: 0,
    hargaNormal: 0,
    packagePrice: undefined,
    discountAmount: 0,
    selectedConsoles: [],
    hariJamList: [],
  });

  useEffect(() => {
    loadConsoles();
    loadPakets();
  }, []);

  const loadConsoles = async () => {
    try {
      const rows = await db.consoles.getAll();
  setConsoles((rows || []).map((r: any) => ({ id: r.id, name: r.name })));
    } catch (err) {
      console.warn('Failed loading consoles', err);
      setConsoles([]);
    }
  };

  const loadPakets = async () => {
    try {
      // try to fetch packages; if table doesn't exist this will throw and we'll keep empty list
      const rows = await db.select('packages', '*');
      if (!rows) return setPakets([]);
      // map to local shape
  const mapped = (rows as any[]).map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        description: r.description,
        status: r.status,
        durationHours: r.duration_hours ?? r.durationHours ?? 0,
        durationMinutes: r.duration_minutes ?? r.durationMinutes ?? 0,
        hargaNormal: r.harga_normal ?? r.hargaNormal ?? 0,
        packagePrice: r.package_price ?? r.packagePrice ?? undefined,
        discountAmount: r.discount_amount ?? r.discountAmount ?? 0,
        selectedConsoles: r.consoles ?? [],
        hariJamList: r.hari_jam_list ?? r.hariJamList ?? [],
      }));
      setPakets(mapped as Paket[]);
    } catch (e) {
      setPakets([]);
    }
  };

  const openCreate = () => {
    // generate default code PKT###
    const existingNumbers = pakets.map((p) => {
      const m = (p.code || '').match(/PKT(\d+)/i);
      return m ? Number(m[1]) : 0;
    });
    const maxNum = existingNumbers.length ? Math.max(...existingNumbers) : 0;
    const next = (maxNum + 1).toString().padStart(3, '0');
    const defaultCode = `PKT${next}`;

  setDraft({ name: '', code: defaultCode, status: 'active', durationHours: 1, durationMinutes: 0, hargaNormal: 0, packagePrice: undefined, discountAmount: 0, selectedConsoles: [], hariJamList: defaultDays });
    setEditingId(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!draft.name) return Swal.fire('Error', 'Nama paket wajib diisi', 'error');

    try {
      if (editingId) {
        // update parent
        await db.update('packages', editingId, {
          name: draft.name,
          code: draft.code,
          description: draft.description,
          status: draft.status,
          duration_hours: draft.durationHours,
          duration_minutes: draft.durationMinutes,
          harga_normal: draft.hargaNormal,
          package_price: draft.packagePrice,
          discount_amount: draft.discountAmount,
        });
        // replace child records: simple approach - delete existing availabilities/consoles then insert
        // delete availabilities
  try { await (db as any).supabase.from('package_availabilities').delete().eq('package_id', editingId); } catch (err) { console.warn('cleanup avail delete failed', err); }
  try { await (db as any).supabase.from('package_consoles').delete().eq('package_id', editingId); } catch (err) { console.warn('cleanup consoles delete failed', err); }
        // insert new
        for (const hj of (draft.hariJamList || [])) {
          await db.insert('package_availabilities', { package_id: editingId, day: hj.day, start_time: hj.startTime, end_time: hj.endTime });
        }
        for (const cid of (draft.selectedConsoles || [])) {
          await db.insert('package_consoles', { package_id: editingId, console_id: cid });
        }
        Swal.fire('Berhasil', 'Paket diperbarui', 'success');
      } else {
        // create parent
        const created: any = await db.insert('packages', {
          name: draft.name,
          code: draft.code,
          description: draft.description,
          status: draft.status,
          duration_hours: draft.durationHours,
          duration_minutes: draft.durationMinutes,
          harga_normal: draft.hargaNormal,
          package_price: draft.packagePrice,
          discount_amount: draft.discountAmount,
        });
        // insert children
        for (const hj of (draft.hariJamList || [])) {
          await db.insert('package_availabilities', { package_id: created.id, day: hj.day, start_time: hj.startTime, end_time: hj.endTime });
        }
        for (const cid of (draft.selectedConsoles || [])) {
          await db.insert('package_consoles', { package_id: created.id, console_id: cid });
        }
        Swal.fire('Berhasil', 'Paket dibuat', 'success');
      }
    } catch (err: any) {
      Swal.fire('Gagal', err?.message || 'Terjadi kesalahan saat menyimpan paket', 'error');
    }

    setShowForm(false);
    loadPakets();
  };

  const handleEdit = async (p: Paket) => {
    // load children if possible
    try {
  const avails = await db.select('package_availabilities', '*', { package_id: p.id });
  const consolesRows = await db.select('package_consoles', '*', { package_id: p.id });
      const hariJamList = (avails || []).map((r: any) => ({ id: `hj-${r.id}`, day: r.day, startTime: r.start_time, endTime: r.end_time }));
      const selectedConsoles = (consolesRows || []).map((r: any) => r.console_id);
      setDraft({ ...p, hariJamList, selectedConsoles });
    } catch {
      setDraft(p);
    }
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleDelete = async (p: Paket) => {
    const res = await Swal.fire({ title: `Hapus paket ${p.name}?`, text: 'Tindakan ini tidak bisa dibatalkan', icon: 'warning', showCancelButton: true });
    if (!res.isConfirmed) return;

    try {
      // delete children then parent
  try { await (db as any).supabase.from('package_availabilities').delete().eq('package_id', p.id); } catch (err) { console.warn('cleanup avail delete failed', err); }
  try { await (db as any).supabase.from('package_consoles').delete().eq('package_id', p.id); } catch (err) { console.warn('cleanup consoles delete failed', err); }
      await db.delete('packages', p.id);
      Swal.fire('Berhasil', 'Paket dihapus', 'success');
      loadPakets();
    } catch (e: any) {
      Swal.fire('Gagal', e?.message || 'Gagal menghapus paket', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Master Paket</h2>
          <p className="text-gray-600">Daftar paket master (database-backed) — {consoles.length} consoles tersedia</p>
        </div>
        <div>
          <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
            <Plus className="h-4 w-4" /> Buat Paket
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kode Paket</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama Paket</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Durasi</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Harga</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pakets.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.code || ''}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{p.name}</div>
                    <div className="text-sm text-gray-500">{p.description}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">{p.durationHours} jam {p.durationMinutes} menit</td>
                  <td className="px-4 py-3 text-sm">Rp {Number(p.packagePrice ?? p.hargaNormal ?? 0).toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${p.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="inline-flex items-center gap-2">
                      <button onClick={() => handleEdit(p)} className="text-blue-600 hover:text-blue-700 p-1 rounded"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(p)} className="text-red-600 hover:text-red-700 p-1 rounded"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{editingId ? 'Edit Paket' : 'Buat Paket'}</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><XCircle className="h-6 w-6" /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kode Paket</label>
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={draft.code || ''} onChange={(e) => setDraft({ ...draft, code: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Paket *</label>
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={draft.name || ''} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durasi (jam)</label>
                  <input type="number" min={0} className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={draft.durationHours ?? 0} onChange={(e) => setDraft({ ...draft, durationHours: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durasi (menit)</label>
                  <input type="number" min={0} max={59} className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={draft.durationMinutes ?? 0} onChange={(e) => setDraft({ ...draft, durationMinutes: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Normal (Rp)</label>
                  <input type="number" min={0} className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={draft.hargaNormal ?? 0} onChange={(e) => setDraft({ ...draft, hargaNormal: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Paket (Rp)</label>
                  <input type="number" min={0} className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={draft.packagePrice ?? ''} onChange={(e) => setDraft({ ...draft, packagePrice: e.target.value === '' ? undefined : Number(e.target.value) })} />
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg">Batal</button>
                <button onClick={handleSave} className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaketManagement;
