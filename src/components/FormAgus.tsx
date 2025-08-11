import React, { useEffect, useMemo, useState } from "react";

// React UI Full Demo
// Single-file demo component showcasing many common UI components used in React apps.
// Use with a React + Tailwind setup (e.g. Vite + Tailwind). Paste into src/App.jsx and run.

function FormAgus() {
  // Generic states for many components
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [checked, setChecked] = useState(false);
  const [radio, setRadio] = useState("A");
  const [text, setText] = useState("");
  const [city, setCity] = useState("Jakarta");
  const [multi, setMulti] = useState(["React"]);
  const [fileName, setFileName] = useState("");
  const [range, setRange] = useState(40);
  const [onOff, setOnOff] = useState(true);
  const [progress, setProgress] = useState(30);
  const [showModal, setShowModal] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [filter, setFilter] = useState("");
  const [tableSort, setTableSort] = useState({ key: "name", dir: "asc" });
  const [step, setStep] = useState(0);

  // sample data for table & timeline
  const people = useMemo(() => [
    { id: 1, name: "Andi", city: "Jakarta", age: 28 },
    { id: 2, name: "Budi", city: "Bandung", age: 32 },
    { id: 3, name: "Citra", city: "Surabaya", age: 24 },
    { id: 4, name: "Dedi", city: "Medan", age: 40 }
  ], []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  useEffect(() => {
    const t = setInterval(() => setProgress(p => (p < 100 ? p + 5 : 0)), 1500);
    return () => clearInterval(t);
  }, []);

  function toggleMulti(option) {
    setMulti(prev => prev.includes(option) ? prev.filter(x => x !== option) : [...prev, option]);
  }

  function handleFile(e) {
    const f = e.target.files?.[0];
    setFileName(f ? f.name : "");
  }

  function sortTable(key) {
    setTableSort(s => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));
  }

  const sortedPeople = useMemo(() => {
    const arr = [...people].filter(p => p.name.toLowerCase().includes(filter.toLowerCase()));
    arr.sort((a,b) => {
      const k = tableSort.key;
      if (a[k] < b[k]) return tableSort.dir === "asc" ? -1 : 1;
      if (a[k] > b[k]) return tableSort.dir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [people, tableSort, filter]);

  // pagination data
  const perPage = 2;
  const totalPages = Math.max(1, Math.ceil(sortedPeople.length / perPage));
  const paged = sortedPeople.slice((page-1)*perPage, page*perPage);

  // context menu handler
  useEffect(() => {
    function onClick() { setContextMenu(null); }
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-800">
      <header className="max-w-7xl mx-auto mb-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 text-white px-3 py-1 rounded-md font-bold">UI DEMO</div>
            <div className="hidden md:flex gap-2">
              <a className="px-2 py-1 hover:bg-slate-100 rounded">Home</a>
              <a className="px-2 py-1 hover:bg-slate-100 rounded">Components</a>
              <a className="px-2 py-1 hover:bg-slate-100 rounded">Docs</a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-3 py-1 bg-green-500 text-white rounded" onClick={() => setShowModal(true)}>Open Modal</button>
            <button className="px-3 py-1 border rounded" onClick={() => setShowDrawer(true)}>Open Drawer</button>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Controls */}
        <section className="col-span-1 lg:col-span-2 space-y-6">
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-3">Form Controls (HTML + React)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nama</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Nama lengkap" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="email@contoh.com" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="••••••" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Textarea</label>
                <textarea value={text} onChange={e => setText(e.target.value)} className="w-full border rounded px-3 py-2" rows={4} placeholder="Tulis pesan..."></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Select</label>
                <select value={city} onChange={e => setCity(e.target.value)} className="w-full border rounded px-3 py-2">
                  <option>Jakarta</option>
                  <option>Bandung</option>
                  <option>Surabaya</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Multi-select (custom)</label>
                <div className="border rounded p-2">
                  {['React','Vue','Svelte','Angular'].map(opt => (
                    <label key={opt} className="inline-flex items-center mr-2">
                      <input type="checkbox" checked={multi.includes(opt)} onChange={() => toggleMulti(opt)} />
                      <span className="ml-2">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">File upload</label>
                <input type="file" onChange={handleFile} className="w-full" />
                <div className="mt-2 text-sm text-slate-500">{fileName || 'Belum memilih file'}</div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Range (slider)</label>
                <input type="range" min={0} max={100} value={range} onChange={e => setRange(Number(e.target.value))} className="w-full" />
                <div className="text-sm mt-1">Nilai: {range}</div>
              </div>

              <div>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} />
                  <span>Checkbox</span>
                </label>

                <div className="mt-2">
                  <label className="inline-flex items-center mr-3">
                    <input type="radio" value="A" checked={radio === 'A'} onChange={e => setRadio(e.target.value)} />
                    <span className="ml-2">Radio A</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="radio" value="B" checked={radio === 'B'} onChange={e => setRadio(e.target.value)} />
                    <span className="ml-2">Radio B</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Switch / Toggle</label>
                <button onClick={() => setOnOff(v => !v)} className={`px-3 py-1 rounded ${onOff ? 'bg-green-500 text-white' : 'bg-slate-200'}`}>
                  {onOff ? 'ON' : 'OFF'}
                </button>
              </div>

            </div>

            <div className="mt-4 flex gap-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setToast('Sukses!')}>Submit</button>
              <button className="px-4 py-2 border rounded" onClick={() => { setName(''); setEmail(''); setPassword(''); setText(''); setMulti([]); }}>Reset</button>
              <button className="px-4 py-2 bg-yellow-400 rounded" onClick={() => setConfirmOpen(true)}>Open Confirm</button>
            </div>

          </div>

          {/* Cards / layout components */}
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-lg font-semibold mb-2">Layout & Surface</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded p-3">
                <div className="text-sm text-slate-500">Card</div>
                <div className="font-bold">Judul Kartu</div>
                <p className="text-sm text-slate-600 mt-2">Deskripsi singkat isi kartu. Bisa berisi teks, tombol, atau metadata.</p>
                <div className="mt-3">
                  <button className="px-3 py-1 bg-indigo-600 text-white rounded">Action</button>
                </div>
              </div>

              <div className="border rounded p-3">
                <div className="text-sm text-slate-500">Accordion (details)</div>
                <details className="mt-2">
                  <summary className="cursor-pointer">Klik untuk buka</summary>
                  <div className="mt-2">Isi accordion: contoh konten panjang yang bisa disembunyikan.</div>
                </details>
              </div>

              <div className="border rounded p-3">
                <div className="text-sm text-slate-500">Tabs</div>
                <div className="mt-2">
                  <div className="flex gap-2 border-b pb-2">
                    <button onClick={() => setActiveTab('home')} className={activeTab === 'home' ? 'border-b-2 border-blue-600 pb-1' : ''}>Home</button>
                    <button onClick={() => setActiveTab('profile')} className={activeTab === 'profile' ? 'border-b-2 border-blue-600 pb-1' : ''}>Profile</button>
                    <button onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? 'border-b-2 border-blue-600 pb-1' : ''}>Settings</button>
                  </div>
                  <div className="mt-3">{activeTab === 'home' ? 'Konten home' : activeTab === 'profile' ? 'Konten profile' : 'Konten settings'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactions: modal, drawer, dropdown, toast */}
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-lg font-semibold mb-2">Interactions</h3>
            <div className="flex gap-3 flex-wrap">
              <button onClick={() => setShowModal(true)} className="px-3 py-1 bg-blue-600 text-white rounded">Modal</button>
              <button onClick={() => setShowDrawer(true)} className="px-3 py-1 border rounded">Drawer</button>
              <div className="relative">
                <button className="px-3 py-1 border rounded" onClick={(e) => {
                  e.stopPropagation();
                  setContextMenu({ x: e.clientX, y: e.clientY });
                }}>Context Menu</button>
                {contextMenu && (
                  <div style={{position:'fixed', left: contextMenu.x, top: contextMenu.y}} className="bg-white border rounded shadow p-2 z-50">
                    <div className="p-1 hover:bg-slate-100 cursor-pointer">Action 1</div>
                    <div className="p-1 hover:bg-slate-100 cursor-pointer">Action 2</div>
                  </div>
                )}
              </div>

              <button className="px-3 py-1 bg-green-500 text-white rounded" onClick={() => setToast('Berhasil disimpan')}>Show Toast</button>
            </div>
          </div>

          {/* Table / list / pagination */}
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-lg font-semibold mb-2">Table, Filter, Sort, Pagination</h3>
            <div className="mb-3 flex gap-2">
              <input className="border px-2 py-1 rounded" placeholder="Filter nama..." value={filter} onChange={e => setFilter(e.target.value)} />
              <button className="px-2 py-1 border rounded" onClick={() => { setTableSort({key:'name', dir:'asc'}); setFilter(''); }}>Reset</button>
            </div>
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 cursor-pointer" onClick={() => sortTable('name')}>Name {tableSort.key==='name' ? (tableSort.dir==='asc'?'▲':'▼') : ''}</th>
                  <th className="border p-2 cursor-pointer" onClick={() => sortTable('city')}>City {tableSort.key==='city' ? (tableSort.dir==='asc'?'▲':'▼') : ''}</th>
                  <th className="border p-2">Age</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="border p-2">{p.name}</td>
                    <td className="border p-2">{p.city}</td>
                    <td className="border p-2">{p.age}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 flex items-center gap-2">
              <button className="px-2 py-1 border rounded" disabled={page===1} onClick={() => setPage(p => Math.max(1, p-1))}>Prev</button>
              <div>Page {page} / {totalPages}</div>
              <button className="px-2 py-1 border rounded" disabled={page===totalPages} onClick={() => setPage(p => Math.min(totalPages, p+1))}>Next</button>
            </div>
          </div>

          {/* Stepper & Timeline */}
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-lg font-semibold mb-2">Stepper & Timeline</h3>
            <div className="flex items-center gap-4 mb-4">
              {['Cart','Checkout','Done'].map((label, idx) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step===idx ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>{idx+1}</div>
                  <div className="hidden md:block">{label}</div>
                  {idx < 2 && <div className="w-10 h-0.5 bg-slate-300"></div>}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button className="px-2 py-1 border rounded" onClick={() => setStep(s => Math.max(0, s-1))}>Prev</button>
              <button className="px-2 py-1 bg-blue-600 text-white rounded" onClick={() => setStep(s => Math.min(2, s+1))}>Next</button>
            </div>

            <div className="mt-4">
              <div className="text-sm text-slate-500">Timeline</div>
              <div className="mt-2 space-y-2">
                <div className="flex gap-3 items-start">
                  <div className="w-3 h-3 rounded-full bg-blue-600 mt-2"></div>
                  <div>
                    <div className="font-semibold">Task created</div>
                    <div className="text-sm text-slate-500">2 hours ago</div>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-3 h-3 rounded-full bg-slate-300 mt-2"></div>
                  <div>
                    <div className="font-semibold">Assigned</div>
                    <div className="text-sm text-slate-500">1 hour ago</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </section>

        {/* Right column: Utilities & visual components */}
        <aside className="col-span-1 space-y-6">
          <div className="bg-white p-4 rounded shadow">
            <h4 className="font-semibold">Badges, Chips, Avatar</h4>
            <div className="mt-3 flex gap-2 items-center flex-wrap">
              <div className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm">Badge</div>
              <div className="px-2 py-1 bg-slate-100 rounded">Chip</div>
              <img src="https://i.pravatar.cc/48?img=3" alt="avatar" className="rounded-full" />
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h4 className="font-semibold">Progress & Spinner</h4>
            <div className="mt-3">
              <div className="w-full bg-slate-200 rounded h-3 overflow-hidden">
                <div style={{width: `${progress}%`}} className="h-3 bg-green-500"></div>
              </div>
              <div className="mt-2">Progress: {progress}%</div>
              <div className="mt-3">Spinner:</div>
              <div className="mt-2"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-800"></div></div>
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h4 className="font-semibold">Media</h4>
            <div className="mt-3">
              <img src="https://via.placeholder.com/150" alt="img" className="w-full rounded" />
              <video controls className="w-full mt-2 rounded">
                <source src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h4 className="font-semibold">Alerts / Notifications</h4>
            <div className="mt-3 space-y-2">
              <div className="px-3 py-2 bg-red-50 border-l-4 border-red-500">Error: Something went wrong</div>
              <div className="px-3 py-2 bg-yellow-50 border-l-4 border-yellow-400">Warning: Check input</div>
              <div className="px-3 py-2 bg-green-50 border-l-4 border-green-500">Success: Saved</div>
            </div>
          </div>

        </aside>
      </main>

      <footer className="max-w-7xl mx-auto mt-6 text-sm text-slate-500">React UI Full Demo — contoh komponen untuk dipelajari</footer>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow max-w-md w-full p-4">
            <div className="flex justify-between items-center">
              <div className="font-bold">Modal Title</div>
              <button onClick={() => setShowModal(false)} className="text-slate-500">✕</button>
            </div>
            <div className="mt-3">Ini isi modal. Bisa diisi form atau konfirmasi.</div>
            <div className="mt-4 flex gap-2 justify-end">
              <button className="px-3 py-1 border rounded" onClick={() => setShowModal(false)}>Close</button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => { setShowModal(false); setToast('Modal action done'); }}>Do</button>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER */}
      {showDrawer && (
        <div className="fixed inset-0 z-40 flex">
          <div className="bg-black/30 flex-1" onClick={() => setShowDrawer(false)} />
          <div className="w-80 bg-white p-4 shadow-xl">
            <div className="flex justify-between items-center">
              <div className="font-bold">Drawer</div>
              <button onClick={() => setShowDrawer(false)}>✕</button>
            </div>
            <div className="mt-3 space-y-2">
              <div className="p-2 hover:bg-slate-50 rounded cursor-pointer">Menu 1</div>
              <div className="p-2 hover:bg-slate-50 rounded cursor-pointer">Menu 2</div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed right-6 bottom-6 bg-white border rounded shadow px-3 py-2">{toast}</div>
      )}

      {/* CONFIRM DIALOG */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow max-w-sm w-full p-4">
            <div className="font-bold">Konfirmasi</div>
            <div className="mt-2">Apakah Anda yakin ingin melakukan aksi ini?</div>
            <div className="mt-4 flex gap-2 justify-end">
              <button className="px-3 py-1 border rounded" onClick={() => setConfirmOpen(false)}>Batal</button>
              <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={() => { setConfirmOpen(false); setToast('Dihapus'); }}>Ya, hapus</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default FormAgus;