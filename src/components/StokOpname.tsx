import React, { useState, useRef, useEffect } from "react";
// db import removed for offline UI mode
import Swal from "sweetalert2";
import { Plus, Search, XCircle } from "lucide-react";

type Product = any;

const generateId = () => Math.random().toString(36).slice(2, 9);

const MONTH_ABBR_ID = [
  'JAN','FEB','MAR','APR','MEI','JUN','JUL','AGT','SEP','OKT','NOV','DES'
];

const formatNomor = (date: Date, seq: number) => {
  const m = MONTH_ABBR_ID[date.getMonth()] || 'XXX';
  const yy = String(date.getFullYear()).slice(-2);
  const xxx = String(seq).padStart(3, '0');
  return `SO-${m}${yy}-${xxx}`;
};

const getLocalNextSeq = (sessions: any[], date: Date) => {
  const mm = date.getMonth();
  const yy = date.getFullYear();
  const same = sessions.filter((s:any) => {
    try {
      const d = new Date(s.createdAt || s.created_at || null);
      return d.getMonth() === mm && d.getFullYear() === yy;
    } catch (e) { return false; }
  });
  return (same.length || 0) + 1;
};

const StokOpname: React.FC<{ products: Product[]; onOpenCreate?: () => void }> = ({ products, onOpenCreate }) => {
  const [sessions, setSessions] = useState<any[]>([]); // local saved sessions
  const [current, setCurrent] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [showProductSelectModal, setShowProductSelectModal] = useState<{ open: boolean; index: number | null }>({ open: false, index: null });

  // track focused input to restore focus after state updates (prevents focus-jump)
  const focusedRef = useRef<{ id: string; field: string; start: number | null; end: number | null } | null>(null);
  // per-row input refs to reliably restore focus to the correct input
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // restore focus to input after updates (if we recorded it)
  useEffect(() => {
    const info = focusedRef.current;
    if (!info) return;
    // first try: use the dedicated per-row ref map (most reliable)
    try {
      const el = inputRefs.current[info.id];
      if (el) {
        el.focus();
        if (info.start !== null && info.end !== null) {
          try { el.setSelectionRange(info.start, info.end); } catch (e) {}
        }
        focusedRef.current = null;
        return;
      }
    } catch (e) {
      // ignore
    }
    // fallback: try to find input by data attributes in the DOM
    try {
      const selector = `input[data-row-id="${info.id}"][data-field="${info.field}"]`;
      const el = document.querySelector(selector) as HTMLInputElement | null;
      if (el) {
        el.focus();
        if (info.start !== null && info.end !== null) {
          try { el.setSelectionRange(info.start, info.end); } catch (e) {}
        }
        focusedRef.current = null;
        return;
      }
    } catch (e) {
      // ignore
    }
    focusedRef.current = null;
  }, [current]);

  const filteredProductsForSelect = React.useMemo(() => {
    const term = productSearchTerm.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) => {
      const byName = (p.name || "").toLowerCase().includes(term);
      const byCat = (p.category || "").toLowerCase().includes(term);
      const byBarcode = (p.barcode || "").toLowerCase().includes(term);
      return byName || byCat || byBarcode;
    });
  }, [productSearchTerm, products]);

  const startNew = () => {
    const now = new Date();
    const localSeq = getLocalNextSeq(sessions, now);
    const nomor = formatNomor(now, localSeq);
    const s = {
      id: generateId(),
      nomor,
      name: nomor,
      createdAt: new Date().toISOString(),
      opnameDate: new Date().toISOString(),
      notes: "",
      rows: [] as any[],
    };
    setCurrent(s);
    setShowCreateModal(true);
    // offline mode: do not call server for nomor
  };

  const addRow = (product?: Product) => {
    if (!current) startNew();
    const row = {
      id: generateId(),
      productId: product?.id ?? null,
      code: product?.code || product?.sku || product?.barcode || product?.id || '',
      productName: product?.name ?? "",
      barcode: product?.barcode ?? "",
      systemStock: product?.stock ?? 0,
      physicalStock: 0,
      note: '',
      unitCost: Number(product?.cost || product?.price || 0),
    };
    setCurrent((c: any) => ({ ...c, rows: [...(c?.rows || []), row] }));
  };

  const updateRow = (id: string, changes: Partial<any>) => {
    setCurrent((c: any) => {
      if (!c) return c;
      const rows = (c.rows || []).map((r: any) => (r.id === id ? { ...r, ...changes } : r));
      return { ...c, rows };
    });
  };

  const removeRow = (id: string) => {
    if (!current) return;
    const rows = (current.rows || []).filter((r: any) => r.id !== id);
    // cleanup ref map
    if (inputRefs.current[id]) delete inputRefs.current[id];
    setCurrent({ ...current, rows });
  };

  const saveSession = () => {
    if (!current) return;
    setSessions((s) => [current, ...s]);
    setCurrent(null);
  };

  const parseCSV = (text: string) => {
    // naive CSV parser: split by lines, commas; expect header or simple rows
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];
    const rows: { productKey: string; qty: number }[] = [];
    // Try detect header: if first line contains non-numeric in qty position
    for (const line of lines) {
      const cols = line.split(",").map((c) => c.trim());
      if (cols.length === 0) continue;
      // Try: barcode,name,qty or name,qty or barcode,qty
      let productKey = cols[0];
      let qty = Number((cols[cols.length - 1] || "").replace(/[^0-9.-]/g, "")) || 0;
      // If first line looks like header (contains 'name' or 'barcode' or 'qty'), skip
      if (/name|barcode|qty|quantity/i.test(productKey) && rows.length === 0) continue;
      rows.push({ productKey, qty });
    }
    return rows;
  };

  const importCSV = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const txt = String(e.target?.result || "");
      const parsed = parseCSV(txt);
      if (!current) startNew();
      // Map parsed rows to products (by barcode or name)
      const mapped = parsed.map((r) => {
        const lower = String(r.productKey).toLowerCase();
        const found = products.find((p: any) => (String(p.barcode || "").toLowerCase() === lower) || String(p.name || "").toLowerCase().includes(lower));
        return {
          id: generateId(),
          productId: found?.id ?? null,
          productName: found?.name ?? r.productKey,
          barcode: found?.barcode ?? "",
          systemStock: found?.stock ?? 0,
          physicalStock: Number(r.qty) || 0,
        };
      });
      setCurrent((c: any) => ({ ...c, rows: [...(c?.rows || []), ...mapped] }));
    };
    reader.readAsText(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    importCSV(f ?? null);
    // clear file input to allow re-import of same file
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const computeSummary = (s: any) => {
    const rows = s?.rows || [];
    let totalSystem = 0;
    let totalPhysical = 0;
    let totalDiff = 0;
    for (const r of rows) {
      const sys = Number(r.systemStock || 0);
      const phy = Number(r.physicalStock ?? 0);
      totalSystem += sys;
      totalPhysical += phy;
      totalDiff += phy - sys;
    }
    return { totalSystem, totalPhysical, totalDiff };
  };

  const computeTotalsWithNominal = (s: any) => {
    const rows = s?.rows || [];
    let totalDiff = 0;
    let totalNominal = 0;
    for (const r of rows) {
      const sys = Number(r.systemStock || 0);
      const phy = Number(r.physicalStock ?? 0);
      const diff = phy - sys;
      totalDiff += diff;
      totalNominal += diff * Number(r.unitCost || 0);
    }
    return { totalDiff, totalNominal };
  };

  // product select handler: open modal for index
  const openProductSelect = (index: number) => {
    setShowProductSelectModal({ open: true, index });
    setProductSearchTerm("");
  };

  const handleSelectProduct = (p: any) => {
    if (showProductSelectModal.index === null) {
      setShowProductSelectModal({ open: false, index: null });
      return;
    }
    const idx = showProductSelectModal.index;
    setCurrent((c: any) => {
      const items = [...(c.rows || [])];
      const unitCost = Number(p.cost || p.price || 0);
      items[idx] = {
        ...items[idx],
        productId: p.id,
        productName: p.name,
        barcode: p.barcode || "",
        systemStock: Number(p.stock || 0),
        unitCost,
      };
      return { ...c, rows: items };
    });
    setShowProductSelectModal({ open: false, index: null });
    setProductSearchTerm("");
  };

  const saveToServer = async () => {
    // offline/local save only with validation
    if (!current) return;
    const hasRows = (current.rows || []).length > 0;
    if (!hasRows) {
      Swal.fire({ icon: 'warning', title: 'Tidak ada item', text: 'Tambahkan minimal satu item sebelum menyimpan.' });
      return;
    }
  const totals = computeTotalsWithNominal(current);
  const opnameSaved = { ...current, id: Math.random().toString(36).slice(2,9), totals, opnameDate: current.opnameDate || current.createdAt };
    (window as any).lastOpname = opnameSaved;
    Swal.fire({ icon: 'success', title: 'Disimpan (lokal)', text: 'Sesi Stok Opname disimpan secara lokal.' });
    setSessions((s) => [opnameSaved, ...s]);
    setCurrent(null);
    setShowCreateModal(false);
  };

  // Modal & product-select UI
  const CreateModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Buat Stok Opname</h2>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Stok Opname</label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">{current?.nomor}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Stok Opname</label>
                <input type="date" value={current ? new Date(current.opnameDate || current.createdAt).toISOString().slice(0,10) : ''} onChange={(e) => {
                  const val = e.target.value;
                  const d = new Date(val + 'T00:00:00');
                  // recompute nomor based on new date and local session count
                  const seq = getLocalNextSeq(sessions, d);
                  const newNomor = formatNomor(d, seq);
                  setCurrent((c:any) => ({ ...c, opnameDate: d.toISOString(), nomor: newNomor, name: newNomor }));
                }} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-900">Item Stok Opname</h3>
                <button type="button" onClick={() => addRow()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Tambah Item
                </button>
              </div>

              <div className="space-y-3">
                {(current?.rows || []).map((item:any, index:number) => (
                  <div key={item.id || index} className="grid grid-cols-12 gap-3 items-end p-3 bg-gray-50 rounded-lg">
                    <div className="col-span-4">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Produk</label>
                      <button type="button" onClick={() => openProductSelect(index)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-left flex items-center justify-between">
                        <span>{item.productId ? products.find((p) => p.id === item.productId)?.name || item.productName || 'Pilih Produk' : 'Pilih Produk'}</span>
                        <Search className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Stok Komputer</label>
                      <div className="px-2 py-1 bg-gray-100 rounded text-sm font-medium text-right">{Number(item.systemStock||0).toLocaleString()}</div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Stok Fisik</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        data-row-id={item.id}
                        data-field="physicalStock"
                        value={item.physicalStock ?? ''}
                        ref={(el) => { inputRefs.current[item.id] = el; }}
                        onFocus={(e) => {
                          const target = e.target as HTMLInputElement;
                          focusedRef.current = { id: item.id, field: 'physicalStock', start: target.selectionStart, end: target.selectionEnd };
                        }}
                        onChange={(e) => {
                          const raw = String(e.target.value || '');
                          const cleaned = raw.replace(/[^0-9.-]/g, '');
                          const v = cleaned === '' ? 0 : Number(cleaned);
                          updateRow(item.id, { physicalStock: v });
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Selisih</label>
                      <div className="px-2 py-1 bg-gray-100 rounded text-sm font-medium text-right">{((Number(item.physicalStock ?? 0) - Number(item.systemStock || 0))).toLocaleString()}</div>
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Harga Beli</label>
                      <div className="px-2 py-1 bg-gray-100 rounded text-sm font-medium text-right">Rp {Number(item.unitCost||0).toLocaleString('id-ID')}</div>
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Nominal</label>
                      <div className="px-2 py-1 bg-gray-100 rounded text-sm font-medium text-right">Rp {(((Number(item.physicalStock ?? 0) - Number(item.systemStock || 0)) * Number(item.unitCost||0)) ).toLocaleString('id-ID')}</div>
                    </div>
                    <div className="col-span-12 text-right">
                      <button type="button" onClick={() => removeRow(item.id)} className="text-sm text-red-600">Hapus</button>
                    </div>
                  </div>
                ))}
              </div>

              {(current?.rows || []).length > 0 && (
                <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg">
                  <h4 className="font-medium text-indigo-900 mb-3">Ringkasan Stok Opname</h4>
                  <div className="flex justify-between items-center">
                    <div className="text-indigo-800">Total Selisih</div>
                    <div className="font-medium text-indigo-900">{computeTotalsWithNominal(current).totalDiff.toLocaleString()}</div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-indigo-800">Total Nominal Selisih</div>
                    <div className="font-medium text-indigo-900">Rp {computeTotalsWithNominal(current).totalNominal.toLocaleString('id-ID')}</div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (Opsional)</label>
              <textarea value={current?.notes || ''} onChange={(e) => setCurrent((c:any) => ({ ...c, notes: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={3} />
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowCreateModal(false); setCurrent(null); }} className="flex-1 px-4 py-2 border rounded-lg font-medium">Batal</button>
              <button onClick={() => saveToServer()} className={`flex-1 text-white px-4 py-2 rounded-lg ${((current?.rows||[]).length === 0) ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700' } font-medium`} disabled={((current?.rows||[]).length === 0)}>Buat Stok Opname</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ProductSelectModal = () => (
    showProductSelectModal.open ? (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex">
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Pilih Produk</h3>
              <button onClick={() => setShowProductSelectModal({ open: false, index: null })} className="text-gray-400 hover:text-gray-600"><XCircle className="h-6 w-6" /></button>
            </div>
            <div className="relative mb-4">
              <input type="text" placeholder="Cari produk..." value={productSearchTerm} onChange={(e) => setProductSearchTerm(e.target.value)} className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg" />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-5 w-5 text-gray-400" /></div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-100">
              {filteredProductsForSelect.length === 0 ? (
                <div className="p-6 text-center text-gray-500">{productSearchTerm ? 'Tidak ada produk yang cocok' : 'Belum ada produk'}</div>
              ) : (
                filteredProductsForSelect.map((p: any) => (
                  <button key={p.id} onClick={() => handleSelectProduct(p)} className="w-full text-left p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{p.name}</div>
                        <div className="text-xs text-gray-500">Kategori: {p.category || '-'}{p.barcode ? ` • Barcode: ${p.barcode}` : ''}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-700">Stok: {p.stock}</div>
                        <div className="text-xs text-gray-500">Modal: Rp {Number(p.cost || 0).toLocaleString('id-ID')}</div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
            <div className="border-t border-gray-200 pt-4 mt-4 flex justify-end">
              <button type="button" onClick={() => setShowProductSelectModal({ open: false, index: null })} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Tutup</button>
            </div>
          </div>
        </div>
      </div>
    ) : null
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Stok Opname</h2>
        <div className="flex items-center gap-2">
          {onOpenCreate && (
            <button onClick={() => onOpenCreate()} className="px-3 py-1 rounded bg-indigo-600 text-white text-sm">Buat Stok Opname</button>
          )}
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleFileInput} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm"
          >
            Import CSV
          </button>
          <button
            onClick={() => { if (!current) startNew(); else addRow(); }}
            className="px-3 py-1 rounded bg-blue-600 text-white text-sm"
          >
            Buat / Tambah Baris
          </button>
          <button
            onClick={() => { if (current) saveSession(); }}
            className={`px-3 py-1 rounded text-white text-sm ${!current ? 'bg-gray-300 cursor-not-allowed' : ((current?.rows||[]).length === 0) ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
            disabled={!current || (current?.rows||[]).length === 0}
          >
            Simpan (lokal)
          </button>
        </div>
      </div>

      {!current && (
        <div className="text-sm text-gray-500 mb-4">Belum ada sesi opname aktif. Tekan "Buat / Tambah Baris" untuk memulai.</div>
      )}

      {current && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm text-gray-500">Sesi</div>
                <div className="font-medium">{current.name} {current.nomor ? <span className="text-xs text-gray-500 ml-2">({current.nomor})</span> : null}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Dibuat</div>
                <div className="font-medium">{new Date(current.createdAt).toLocaleString()}</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kode</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Sistem</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Fisik</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Selisih</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Catatan</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {(current.rows || []).map((r: any) => (
                    <tr key={r.id}>
                      <td className="px-3 py-2">
                        <div className="font-medium">{r.code || ''}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{r.productName || "-"}</div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{r.barcode ? `Barcode: ${r.barcode}` : ''}</div>
                      </td>
                      <td className="px-3 py-2 text-right">{Number(r.systemStock||0).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="text"
                          inputMode="numeric"
                          data-row-id={r.id}
                          data-field="physicalStock"
                            value={r.physicalStock ?? ""}
                            ref={(el) => { inputRefs.current[r.id] = el; }}
                            onFocus={(e) => {
                              const t = e.target as HTMLInputElement;
                              focusedRef.current = { id: r.id, field: 'physicalStock', start: t.selectionStart, end: t.selectionEnd };
                            }}
                            onChange={(e) => {
                              const raw = String(e.target.value || '');
                              const cleaned = raw.replace(/[^0-9.-]/g, '');
                              const v = cleaned === '' ? 0 : Number(cleaned);
                              updateRow(r.id, { physicalStock: v });
                            }}
                            className="w-20 text-right px-2 py-1 border rounded appearance-none"
                            style={{ MozAppearance: 'textfield' as any }}
                        />
                      </td>
                      <td className={`px-3 py-2 text-right font-medium ${((Number(r.physicalStock||0) - Number(r.systemStock||0)) > 0) ? 'text-green-600' : 'text-red-600'}`}>
                        {((r.physicalStock ?? 0) - (r.systemStock ?? 0)).toLocaleString?.() ?? ((r.physicalStock ?? 0) - (r.systemStock ?? 0))}
                      </td>
                      <td className="px-3 py-2">
                        <input type="text" value={r.note || ''} onChange={(e) => updateRow(r.id, { note: e.target.value })} className="w-full px-2 py-1 border rounded text-sm" />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button onClick={() => removeRow(r.id)} className="text-sm text-red-600">Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Baris: {(current.rows || []).length}
              </div>
              <div className="text-sm">
                {(() => {
                  const sum = computeSummary(current);
                  return (
                    <div className="text-right">
                      <div>Stok Sistem: <span className="font-medium">{sum.totalSystem.toLocaleString()}</span></div>
                      <div>Stok Fisik: <span className="font-medium">{sum.totalPhysical.toLocaleString()}</span></div>
                      <div>Selisih: <span className={`font-medium ${sum.totalDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>{sum.totalDiff.toLocaleString()}</span></div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {sessions.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-2">Sesi Tersimpan</h3>
          <div className="space-y-2">
            {sessions.map((s) => (
              <div key={s.id} className="bg-white border rounded p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-gray-500">{new Date(s.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-sm text-gray-700">Baris: {(s.rows||[]).length}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {showCreateModal && <CreateModal />}
      <ProductSelectModal />
    </div>
  );
};

export default StokOpname;
