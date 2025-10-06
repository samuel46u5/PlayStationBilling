import React, { useState, useRef } from "react";

type Product = any;

const generateId = () => Math.random().toString(36).slice(2, 9);

const StokOpname: React.FC<{ products: Product[] }> = ({ products }) => {
  const [sessions, setSessions] = useState<any[]>([]); // local saved sessions
  const [current, setCurrent] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const startNew = () => {
    const s = {
      id: generateId(),
      name: `Opname ${new Date().toLocaleString()}`,
      createdAt: new Date().toISOString(),
      rows: [] as any[],
    };
    setCurrent(s);
  };

  const addRow = (product?: Product) => {
    if (!current) startNew();
    const row = {
      id: generateId(),
      productId: product?.id ?? null,
      productName: product?.name ?? "",
      barcode: product?.barcode ?? "",
      systemStock: product?.stock ?? 0,
      physicalStock: null as number | null,
    };
    setCurrent((c: any) => ({ ...c, rows: [...(c?.rows || []), row] }));
  };

  const updateRow = (id: string, changes: Partial<any>) => {
    if (!current) return;
    const rows = (current.rows || []).map((r: any) => (r.id === id ? { ...r, ...changes } : r));
    setCurrent({ ...current, rows });
  };

  const removeRow = (id: string) => {
    if (!current) return;
    const rows = (current.rows || []).filter((r: any) => r.id !== id);
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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Stok Opname</h2>
        <div className="flex items-center gap-2">
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
            className="px-3 py-1 rounded bg-green-600 text-white text-sm"
            disabled={!current}
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
                <div className="font-medium">{current.name}</div>
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
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Stok Sistem</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Stok Fisik</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Selisih</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {(current.rows || []).map((r: any) => (
                    <tr key={r.id}>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{r.productName || "-"}</div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{r.barcode ? `Barcode: ${r.barcode}` : ''}</div>
                      </td>
                      <td className="px-3 py-2 text-right">{Number(r.systemStock||0).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          value={r.physicalStock ?? ""}
                          onChange={(e) => updateRow(r.id, { physicalStock: e.target.value === "" ? null : Number(e.target.value) })}
                          className="w-20 text-right px-2 py-1 border rounded"
                        />
                      </td>
                      <td className={`px-3 py-2 text-right font-medium ${((Number(r.physicalStock||0) - Number(r.systemStock||0)) > 0) ? 'text-green-600' : 'text-red-600'}`}>
                        {((r.physicalStock ?? 0) - (r.systemStock ?? 0)).toLocaleString?.() ?? ((r.physicalStock ?? 0) - (r.systemStock ?? 0))}
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
    </div>
  );
};

export default StokOpname;
