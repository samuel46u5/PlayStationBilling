/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-case-declarations */
import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Package,
  Edit,
  Trash2,
  AlertTriangle,
  ShoppingBag,
  TrendingUp,
  Calendar,
  FileText,
  Truck,
  XCircle,
  Printer,
  DollarSign,
  List as ListIcon,
  LayoutGrid,
} from "lucide-react";
import { db } from "../lib/supabase"; // Hanya import db
import { printPriceList, ProductPriceList } from "../utils/receipt";
import Swal from "sweetalert2";
import PurchaseFilters from "./PurchaseFilters";

const Products: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "products" | "purchases" | "suppliers" | "purchaseList" | "sales" | "salesSummary" | "reports"
  >("products");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState<string | null>(null);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<string | null>(null);

  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "beverage" as "beverage" | "food" | "snack" | "other",
    price: 0,
    cost: 0,
    stock: 0,
    min_stock: 0,
    barcode: "",
    description: "",
  });

  const [newPurchase, setNewPurchase] = useState({
    supplierId: "",
    items: [] as Array<{
      id?: string;
      productId: string;
      productName: string;
      quantity: number;
      unitCost: number;
      total: number;
    }>,
    notes: "",
    expectedDate: new Date().toISOString().split("T")[0],
    // orderDate will be stored in purchase_orders.order_date (ISO string)
    orderDate: new Date().toISOString(),
  });

  const [editingPoId, setEditingPoId] = useState<string | null>(null);
  const [isSavingPurchase, setIsSavingPurchase] = useState(false);

  // Read-only PO detail state (expanded row)
  const [poDetail, setPoDetail] = useState<any | null>(null);
  const [expandedPoId, setExpandedPoId] = useState<string | null>(null);

  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    category: "beverage" as "beverage" | "food" | "snack" | "other",
  });

  // State untuk produk dari database
  const [products, setProducts] = useState<any[]>([]);
  // State untuk supplier dari database
  const [suppliers, setSuppliers] = useState<any[]>([]);
  // const [supplierView, setSupplierView] = useState<'card' | 'list'>('card');
  const [showEditSupplierForm, setShowEditSupplierForm] = useState<
    string | null
  >(null);
  const [editSupplier, setEditSupplier] = useState<any | null>(null);

  // Tambah state untuk daftar PO, filter tanggal, dan status
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  // purchaseDateRange removed - use daftarDateRange instead
  // keep purchaseStatus available for filtering but we don't need the setter here
  const [purchaseStatus] = useState<string>("all");
  // State untuk periode filter pada laporan penjualan
  const [salesPeriod, setSalesPeriod] = useState<string>("week");
  const [salesDateRange, setSalesDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });
  // Filters for Sales Summary (Laporan Rekap Per Barang)
  const [salesSummarySearch, setSalesSummarySearch] = useState<string>("");
  const [salesSummaryPeriod, setSalesSummaryPeriod] = useState<string>("week");
  const [salesSummaryDateRange, setSalesSummaryDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });
  // Local search state for sales tab to avoid clashing with global searchTerm
  const [salesSearch, setSalesSearch] = useState<string>("");
  // Which report sub-tab is active under Laporan Penjualan
  const [reportTab, setReportTab] = useState<'sales' | 'salesSummary'>('sales');
  // expandedProducts removed - not currently used

  // State untuk item PO detail
  const [purchaseOrderItems, setPurchaseOrderItems] = useState<any[]>([]);
  const [loadingPurchaseItems, setLoadingPurchaseItems] = useState(false);
  const [purchaseItemsError, setPurchaseItemsError] = useState<string | null>(
    null
  );
  // purchasePeriod removed - use daftarPeriod instead
  // subtab inside Daftar Pembelian: 'daftar' (existing list), 'rekapTanggalBarang', 'rekapPerBarang'
  const [purchaseTabView, setPurchaseTabView] = useState<'daftar' | 'rekapTanggalBarang' | 'rekapPerBarang'>('daftar');
  // Independent filters for the 'Daftar Pembelian' subtab (do not share with other tabs)
  const [daftarSearch, setDaftarSearch] = useState("");
  const [daftarPeriod, setDaftarPeriod] = useState<string>("week");
  const [daftarDateRange, setDaftarDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });
  // Filters for Rekap Pembelian (Per tanggal - Per Barang)
  const [rekapTanggalSearch, setRekapTanggalSearch] = useState("");
  const [rekapTanggalPeriod, setRekapTanggalPeriod] = useState<string>("week");
  const [rekapTanggalDateRange, setRekapTanggalDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });

  // Filters for Rekap Per Barang
  const [rekapPerBarangSearch, setRekapPerBarangSearch] = useState("");
  const [rekapPerBarangPeriod, setRekapPerBarangPeriod] = useState<string>("week");
  const [rekapPerBarangDateRange, setRekapPerBarangDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });

  // Data + loading states for Rekap views
  const [rekapTanggalData, setRekapTanggalData] = useState<Record<string, any>>({});
  const [rekapTanggalLoading, setRekapTanggalLoading] = useState(false);
  const [rekapTanggalError, setRekapTanggalError] = useState<string | null>(null);

  const [rekapPerBarangData, setRekapPerBarangData] = useState<Record<string, any>>({});
  const [rekapPerBarangLoading, setRekapPerBarangLoading] = useState(false);
  const [rekapPerBarangError, setRekapPerBarangError] = useState<string | null>(null);

  // Load purchase order items and purchases for rekap computations when needed
  useEffect(() => {
    const loadRekapTanggal = async () => {
      if (purchaseTabView !== 'rekapTanggalBarang') return;
      setRekapTanggalLoading(true);
      setRekapTanggalError(null);
      try {
        // build date range from period/dateRange
        let start: string | null = null;
        let end: string | null = null;
        const now = new Date();
        switch (rekapTanggalPeriod) {
          case 'today': { const s = new Date(); s.setHours(0,0,0,0); start = s.toISOString().slice(0,10); const e = new Date(); e.setHours(23,59,59,999); end = e.toISOString().slice(0,10); break; }
          case 'yesterday': { const s = new Date(); s.setDate(s.getDate()-1); s.setHours(0,0,0,0); start = s.toISOString().slice(0,10); const e = new Date(s); e.setHours(23,59,59,999); end = e.toISOString().slice(0,10); break; }
          case 'week': { const s = new Date(); const d = s.getDay(); const diff = (d === 0 ? -6 : 1) - d; s.setDate(s.getDate() + diff); s.setHours(0,0,0,0); start = s.toISOString().slice(0,10); const e = new Date(); e.setHours(23,59,59,999); end = e.toISOString().slice(0,10); break; }
          case 'month': { const s = new Date(now.getFullYear(), now.getMonth(), 1); start = s.toISOString().slice(0,10); const e = new Date(now.getFullYear(), now.getMonth()+1, 0); e.setHours(23,59,59,999); end = e.toISOString().slice(0,10); break; }
          case 'range': if (rekapTanggalDateRange.start) start = new Date(rekapTanggalDateRange.start).toISOString().slice(0,10); if (rekapTanggalDateRange.end) end = new Date(rekapTanggalDateRange.end).toISOString().slice(0,10); break;
        }

        // Build purchases query with date filters (DB-side)
        const { supabase } = db as any; // use db.supabase if available, otherwise fallback to exported supabase
        // prefer using the exported supabase client directly
        // Query purchase_orders (via supabase)
        let purchasesQuery: any = (supabase || (db as any).supabase).from('purchase_orders').select('*');
        if (start) purchasesQuery = purchasesQuery.gte('order_date', start);
        if (end) purchasesQuery = purchasesQuery.lte('order_date', end);
        purchasesQuery = purchasesQuery.order('order_date', { ascending: false }).limit(2000);
        const { data: posData, error: posErr } = await purchasesQuery;
        if (posErr) throw posErr;

        // apply search: PO number or supplier name
        let filteredPos = posData || [];
        if (rekapTanggalSearch) {
          const st = rekapTanggalSearch.toLowerCase();
          // try supplier name match
          const { data: supMatches } = await (supabase || (db as any).supabase).from('suppliers').select('id').ilike('name', `%${st}%`).limit(200);
          const supplierIds = (supMatches || []).map((s: any) => s.id);
          filteredPos = (filteredPos || []).filter((p: any) => {
            const matchPo = p.po_number?.toLowerCase().includes(st);
            const matchSupplier = supplierIds.length ? supplierIds.includes(p.supplier_id) : false;
            return matchPo || matchSupplier;
          });
        }

        const poIds = (filteredPos || []).map((p: any) => p.id).filter(Boolean);

        // fetch PO items for filtered PO ids only
        let poItems: any[] = [];
        if (poIds.length > 0) {
          const { data: itemsData, error: itemsErr } = await (supabase || (db as any).supabase)
            .from('purchase_order_items')
            .select('*')
            .in('po_id', poIds)
            .limit(5000);
          if (itemsErr) throw itemsErr;
          poItems = itemsData || [];
        }

        // build map: date -> productKey -> { qty, total }
        const map: Record<string, any> = {};
        for (const iti of (poItems || []) as any[]) {
          const po = ((filteredPos || []).find((p: any) => p.id === iti.po_id) as any) || {};
          const orderDate = (po as any).order_date ? new Date((po as any).order_date).toISOString().slice(0,10) : 'unknown';
          const productId = iti.product_id ?? iti.productId ?? null;
          const name = iti.product_name || (productId ? (products.find((p: any) => String(p.id) === String(productId))?.name) : '') || 'Unknown Produk';
          const qty = Number(iti.quantity || iti.qty || 0) || 0;
          const total = Number(iti.total || (iti.unit_cost ? iti.unit_cost * qty : 0)) || 0;
          if (!map[orderDate]) map[orderDate] = { products: {}, dateTotal: 0 };
          const key = String(productId ?? name);
          if (!map[orderDate].products[key]) map[orderDate].products[key] = { productId, name, qty: 0, total: 0, lines: [] };
          map[orderDate].products[key].qty += qty;
          map[orderDate].products[key].total += total;
          const supplierName = suppliers.find((s: any) => s.id === po.supplier_id)?.name || '';
          map[orderDate].products[key].lines.push({ poId: iti.po_id, qty, total, unitPrice: qty ? Math.round(total/qty) : 0, supplierName });
          map[orderDate].dateTotal += total;
        }

        setRekapTanggalData(map);
      } catch (err: any) {
        setRekapTanggalError(err?.message || String(err));
        setRekapTanggalData({});
      } finally {
        setRekapTanggalLoading(false);
      }
    };

    const loadRekapPerBarang = async () => {
      if (purchaseTabView !== 'rekapPerBarang') return;
      setRekapPerBarangLoading(true);
      setRekapPerBarangError(null);
      try {
        // Build date range (YYYY-MM-DD) from period/dateRange
        let start: string | null = null;
        let end: string | null = null;
        const now = new Date();
        switch (rekapPerBarangPeriod) {
          case 'today': { const s = new Date(); s.setHours(0,0,0,0); start = s.toISOString().slice(0,10); const e = new Date(); e.setHours(23,59,59,999); end = e.toISOString().slice(0,10); break; }
          case 'yesterday': { const s = new Date(); s.setDate(s.getDate()-1); s.setHours(0,0,0,0); start = s.toISOString().slice(0,10); const e = new Date(s); e.setHours(23,59,59,999); end = e.toISOString().slice(0,10); break; }
          case 'week': { const s = new Date(); const d = s.getDay(); const diff = (d === 0 ? -6 : 1) - d; s.setDate(s.getDate() + diff); s.setHours(0,0,0,0); start = s.toISOString().slice(0,10); const e = new Date(); e.setHours(23,59,59,999); end = e.toISOString().slice(0,10); break; }
          case 'month': { const s = new Date(now.getFullYear(), now.getMonth(), 1); start = s.toISOString().slice(0,10); const e = new Date(now.getFullYear(), now.getMonth()+1, 0); e.setHours(23,59,59,999); end = e.toISOString().slice(0,10); break; }
          case 'range': if (rekapPerBarangDateRange.start) start = new Date(rekapPerBarangDateRange.start).toISOString().slice(0,10); if (rekapPerBarangDateRange.end) end = new Date(rekapPerBarangDateRange.end).toISOString().slice(0,10); break;
        }

        const supabase = (db as any).supabase;

        // Query matching purchase_orders with date filters
        let purchasesQuery: any = supabase.from('purchase_orders').select('*');
        if (start) purchasesQuery = purchasesQuery.gte('order_date', start);
        if (end) purchasesQuery = purchasesQuery.lte('order_date', end);
        purchasesQuery = purchasesQuery.order('order_date', { ascending: false }).limit(2000);
        const { data: posData, error: posErr } = await purchasesQuery;
        if (posErr) throw posErr;

        let filteredPos = posData || [];
        if (rekapPerBarangSearch) {
          const st = rekapPerBarangSearch.toLowerCase();
          const { data: supMatches } = await supabase.from('suppliers').select('id').ilike('name', `%${st}%`).limit(200);
          const supplierIds = (supMatches || []).map((s: any) => s.id);
          filteredPos = (filteredPos || []).filter((p: any) => {
            const matchPo = p.po_number?.toLowerCase().includes(st);
            const matchSupplier = supplierIds.length ? supplierIds.includes(p.supplier_id) : false;
            return matchPo || matchSupplier;
          });
        }

        const poIds = (filteredPos || []).map((p: any) => p.id).filter(Boolean);

        // fetch only items for matching PO ids
        let poItems: any[] = [];
        if (poIds.length > 0) {
          const { data: itemsData, error: itemsErr } = await supabase
            .from('purchase_order_items')
            .select('*')
            .in('po_id', poIds)
            .limit(5000);
          if (itemsErr) throw itemsErr;
          poItems = itemsData || [];
        }

        // aggregate per product
        const map: Record<string, any> = {};
        for (const iti of (poItems || []) as any[]) {
          const po = ((filteredPos || []).find((p: any) => p.id === iti.po_id) as any) || {};
          const orderDate = (po as any).order_date ? new Date((po as any).order_date).toISOString().slice(0,10) : ((iti.created_at || iti.inserted_at || '') ? String((iti.created_at || iti.inserted_at)).slice(0,10) : 'unknown');
          const productId = iti.product_id ?? iti.productId ?? null;
          const name = iti.product_name || (productId ? (products.find((p: any) => String(p.id) === String(productId))?.name) : '') || 'Unknown Produk';
          const qty = Number(iti.quantity || iti.qty || 0) || 0;
          const total = Number(iti.total || (iti.unit_cost ? iti.unit_cost * qty : 0)) || 0;
          const key = String(productId ?? name);
          if (!map[key]) map[key] = { productId, name, qty: 0, total: 0, lines: [] };
          map[key].qty += qty;
          map[key].total += total;
          const supplierName = suppliers.find((s: any) => s.id === po.supplier_id)?.name || '';
          map[key].lines.push({ poId: iti.po_id, qty, total, unitPrice: qty ? Math.round(total/qty) : 0, date: orderDate, supplierName });
        }

        setRekapPerBarangData(map);
      } catch (err: any) {
        setRekapPerBarangError(err?.message || String(err));
        setRekapPerBarangData({});
      } finally {
        setRekapPerBarangLoading(false);
      }
    };

    // run both (each will early-return if not active)
    loadRekapTanggal();
    loadRekapPerBarang();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    purchaseTabView,
    products,
    rekapTanggalPeriod,
    rekapTanggalDateRange.start,
    rekapTanggalDateRange.end,
    rekapTanggalSearch,
    rekapPerBarangPeriod,
    rekapPerBarangDateRange.start,
    rekapPerBarangDateRange.end,
    rekapPerBarangSearch
  ]);

  // Render helpers for rekap tabs
  const renderRekapTanggalTab = () => {
    if (rekapTanggalLoading) return <div className="text-sm text-gray-500">Memuat rekap...</div>;
    if (rekapTanggalError) return <div className="text-sm text-red-500">{rekapTanggalError}</div>;
    const dateKeys = Object.keys(rekapTanggalData).sort((a,b) => a < b ? 1 : -1);
    if (dateKeys.length === 0) return <div className="text-sm text-gray-500">Belum ada data pembelian.</div>;
    const rtPeriodLabel = (() => {
      if (rekapTanggalPeriod === 'range') {
        if (rekapTanggalDateRange.start && rekapTanggalDateRange.end) {
          const s = new Date(rekapTanggalDateRange.start).toLocaleDateString();
          const e = new Date(rekapTanggalDateRange.end).toLocaleDateString();
          return `${s} - ${e}`;
        }
        if (rekapTanggalDateRange.start) return `Mulai ${new Date(rekapTanggalDateRange.start).toLocaleDateString()}`;
        return 'Rentang waktu (tidak lengkap)';
      }
      switch (rekapTanggalPeriod) {
        case 'today': { const d = new Date(); return `Hari Ini (${d.toLocaleDateString()})`; }
        case 'yesterday': { const d = new Date(); d.setDate(d.getDate()-1); return `Kemarin (${d.toLocaleDateString()})`; }
        case 'week': { const d0 = new Date(); const dd = new Date(d0); const day = dd.getDay(); const diff = (day === 0 ? -6 : 1) - day; dd.setDate(dd.getDate() + diff); return `Minggu Ini (${dd.toLocaleDateString()} - ${new Date().toLocaleDateString()})`; }
        case 'month': { const now = new Date(); const start = new Date(now.getFullYear(), now.getMonth(), 1); const end = new Date(now.getFullYear(), now.getMonth()+1, 0); return `Bulan Ini (${start.toLocaleDateString()} - ${end.toLocaleDateString()})`; }
        default: return 'Semua Waktu';
      }
    })();

    return (
      <div className="space-y-4">
  {dateKeys.map(dk => {
          const day = rekapTanggalData[dk];
          const productsArr = Object.values(day.products).sort((a:any,b:any) => b.total - a.total);
          return (
            <div key={dk} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm text-gray-500">{new Date(dk).toLocaleDateString('id-ID', { weekday: 'long' })}</div>
                      <button
                        onClick={() => {
                          const s = new Set(expandedDates);
                          if (s.has(dk)) s.delete(dk);
                          else s.add(dk);
                          setExpandedDates(s);
                        }}
                        className="font-semibold text-left text-blue-600 hover:underline flex items-center gap-2"
                        aria-expanded={expandedDates.has(dk)}
                      >
                        <span>{dk === 'unknown' ? '-' : new Date(dk).toLocaleDateString('id-ID')}</span>
                        <svg className={`h-4 w-4 transform ${expandedDates.has(dk) ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                      </button>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Total</div>
                      <div className="font-semibold text-green-700">Rp {Number(day.dateTotal||0).toLocaleString('id-ID')}</div>
                    </div>
                  </div>
                  {expandedDates.has(dk) && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Harga</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total (Rp)</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {productsArr.map((p:any) => (
                            <tr key={String(p.productId ?? p.name)}>
                              <td className="px-4 py-2">
                                <div className="font-medium">{p.name}</div>
                                {p.lines && p.lines.length > 0 && (
                                  <div className="text-xs text-gray-500 mt-1">Supplier: {Array.from(new Set(p.lines.map((l:any)=> l.supplierName).filter(Boolean))).join(', ') || '-'}</div>
                                )}
                              </td>
                              <td className="px-4 py-2 text-right font-medium">{p.qty}</td>
                              <td className="px-4 py-2 text-right font-medium">{p.qty ? Number(Math.round((p.total||0) / p.qty)).toLocaleString('id-ID') : '-'}</td>
                              <td className="px-4 py-2 text-right font-semibold">{Number(p.total||0).toLocaleString('id-ID')}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          {(() => {
                            const totalQty = productsArr.reduce((s:any, it:any) => s + (Number(it.qty) || 0), 0);
                            const totalAmount = productsArr.reduce((s:any, it:any) => s + (Number(it.total) || 0), 0);
                            return (
                              <>
                                <tr className="bg-gray-50">
                                  <td className="px-4 py-2 text-left font-medium">Subtotal</td>
                                  <td className="px-4 py-2 text-right font-medium">{String(totalQty)}</td>
                                  <td className="px-4 py-2 text-right font-medium">-</td>
                                  <td className="px-4 py-2 text-right font-semibold">{String(Number(totalAmount).toLocaleString('id-ID'))}</td>
                                </tr>
                                <tr>
                                  <td colSpan={3} className="px-4 py-2 text-right font-semibold">Grand Total</td>
                                  <td className="px-4 py-2 text-right font-semibold">Rp {Number(totalAmount).toLocaleString('id-ID')}</td>
                                </tr>
                              </>
                            );
                          })()}
                        </tfoot>
                      </table>
                    </div>
                  )}
            </div>
          );
        })}

        {/* Grand total for all dates - shown as a footer inside the container */}
        {(() => {
          const grand = Object.keys(rekapTanggalData).reduce((s:any, dk:any) => s + (Number(rekapTanggalData[dk]?.dateTotal) || 0), 0);
          // compute days and average per day if possible
          const dateKeys = Object.keys(rekapTanggalData).filter((k) => k !== null && k !== undefined && String(k).trim() !== '');
          const days = dateKeys.length || 1;
          const avg = days ? Math.round((grand || 0) / days) : 0;
          return (
            <div className="mt-3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Total {days}-Hari</div>
                  <div className="font-semibold text-gray-900">{rtPeriodLabel}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Grand Total</div>
                  <div className="font-semibold text-green-700">Rp {Number(grand).toLocaleString('id-ID')}</div>
                  <div className="text-sm text-gray-500 mt-2">Rata-rata / hari</div>
                  <div className="font-medium text-gray-900">Rp {Number(avg).toLocaleString('id-ID')}</div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  const renderRekapPerBarangTab = () => {
    if (rekapPerBarangLoading) return <div className="text-sm text-gray-500">Memuat rekap per barang...</div>;
    if (rekapPerBarangError) return <div className="text-sm text-red-500">{rekapPerBarangError}</div>;
    // Compute period label for this tab
    const periodLabel = (() => {
      if (rekapPerBarangPeriod === 'range') {
        if (rekapPerBarangDateRange.start && rekapPerBarangDateRange.end) {
          const s = new Date(rekapPerBarangDateRange.start).toLocaleDateString();
          const e = new Date(rekapPerBarangDateRange.end).toLocaleDateString();
          return `${s} s.d. ${e}`;
        }
        if (rekapPerBarangDateRange.start) return `Mulai ${new Date(rekapPerBarangDateRange.start).toLocaleDateString()}`;
        return 'Rentang waktu (tidak lengkap)';
      }
      switch (rekapPerBarangPeriod) {
        case 'today': {
          const d = new Date();
          return `Hari Ini (${d.toLocaleDateString()})`;
        }
        case 'yesterday': {
          const d = new Date(); d.setDate(d.getDate() - 1);
          return `Kemarin (${d.toLocaleDateString()})`;
        }
        case 'week': {
          const d0 = new Date();
          const dd = new Date(d0);
          const day = dd.getDay();
          const diff = (day === 0 ? -6 : 1) - day;
          dd.setDate(dd.getDate() + diff);
          return `Minggu Ini (${dd.toLocaleDateString()} - ${new Date().toLocaleDateString()})`;
        }
        case 'month': {
          const now = new Date();
          const start = new Date(now.getFullYear(), now.getMonth(), 1);
          const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          return `Bulan Ini (${start.toLocaleDateString()} - ${end.toLocaleDateString()})`;
        }
        default:
          return 'Semua Waktu';
      }
    })();
    const productKeys = Object.keys(rekapPerBarangData).sort((a,b) => {
      const A = rekapPerBarangData[a];
      const B = rekapPerBarangData[b];
      return (B.total || 0) - (A.total || 0);
    });
    if (productKeys.length === 0) return <div className="text-sm text-gray-500">Belum ada data pembelian.</div>;
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty Total</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Harga</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total (Rp)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {productKeys.map(k => {
                const p = rekapPerBarangData[k];
                const unitPrice = p.qty ? Math.round((Number(p.total) || 0) / p.qty) : 0;
                return (
                  <tr key={k}>
                    <td className="px-4 py-2">
                      <div className="font-medium">{p.name}</div>
                      {p.lines && p.lines.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">Supplier: {Array.from(new Set(p.lines.map((l:any)=> l.supplierName).filter(Boolean))).join(', ') || '-'}</div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">{p.qty}</td>
                    <td className="px-4 py-2 text-right font-medium">{unitPrice ? unitPrice.toLocaleString('id-ID') : '-'}</td>
                    <td className="px-4 py-2 text-right font-semibold">{Number(p.total||0).toLocaleString('id-ID')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {(() => {
            const grandPerBarang = Object.keys(rekapPerBarangData).reduce((s:any,k)=> s + (Number(rekapPerBarangData[k].total)||0),0);
            const keys = Object.keys(rekapPerBarangData);
            const daysCount = keys.length || 1;
            const avgPer = daysCount ? Math.round((grandPerBarang || 0) / daysCount) : 0;
            return (
              <div className="mt-3">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500">Total {keys.length}-Item</div>
                      <div className="font-semibold text-gray-900">{periodLabel}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Grand Total</div>
                      <div className="font-semibold text-green-700">Rp {Number(grandPerBarang).toLocaleString('id-ID')}</div>
                      <div className="flex items-center justify-end gap-4 mt-2 text-sm text-gray-600">
                        <div className="text-gray-500">Rata-rata / item</div>
                        <div className="font-medium text-gray-900">Rp {Number(avgPer).toLocaleString('id-ID')}</div>
                      </div>
                    </div>
                  </div>
                </div>
            );
          })()}
        </div>
      </div>
    );
  };

  // Calculate totals whenever items change
  const [purchaseSubtotal, setPurchaseSubtotal] = useState(0);
  // const [purchaseTax, setPurchaseTax] = useState(0);
  const [purchaseTotal, setPurchaseTotal] = useState(0);

  // State untuk print price list
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedProductsForPrint, setSelectedProductsForPrint] = useState<
    string[]
  >([]);
  const [selectAllProducts, setSelectAllProducts] = useState(false);
  const [selectLowStockProducts, setSelectLowStockProducts] = useState(false);

  // State untuk modal pemilihan produk pada form Purchase Order
  const [showProductSelectModal, setShowProductSelectModal] = useState<{
    open: boolean;
    index: number | null;
  }>({ open: false, index: null });
  const [productSearchTerm, setProductSearchTerm] = useState("");

  // State untuk Stock Card modal
  const [showStockCard, setShowStockCard] = useState(false);
  const [stockCardProduct, setStockCardProduct] = useState<any | null>(null);
  const [stockHistory, setStockHistory] = useState<any[]>([]);
  const [stockHistoryLoading, setStockHistoryLoading] = useState(false);
  const [stockHistoryError, setStockHistoryError] = useState<string | null>(null);
  // Controlled inputs for Stock Card modal
  const [stockAdj, setStockAdj] = useState<number>(0);
  const [stockAdjType, setStockAdjType] = useState<'in' | 'out'>('in');
  const [stockNote, setStockNote] = useState<string>('');
  // pagination for stock history
  const [historyPage, setHistoryPage] = useState<number>(0);
  const HISTORY_PAGE_SIZE = 10;

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

  // State untuk modal pemilihan supplier pada form Purchase Order
  const [showSupplierSelectModal, setShowSupplierSelectModal] = useState(false);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");
  const filteredSuppliersForSelect = React.useMemo(() => {
    const term = supplierSearchTerm.trim().toLowerCase();
    if (!term) return suppliers;
    return suppliers.filter((s: any) => {
      const byName = (s.name || "").toLowerCase().includes(term);
      const byContact = (s.contact_person || "").toLowerCase().includes(term);
      const byPhone = (s.phone || "").toLowerCase().includes(term);
      return byName || byContact || byPhone;
    });
  }, [supplierSearchTerm, suppliers]);


  // Update totals when items change
  useEffect(() => {
    const subtotal = newPurchase.items.reduce(
      (sum, item) => sum + item.total,
      0
    );
    // const tax = subtotal * 0.1; // 10% tax
    const total = subtotal;

    setPurchaseSubtotal(subtotal);
    // setPurchaseTax(tax);
    setPurchaseTotal(total);
  }, [newPurchase.items]);

  // Fetch products from Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await db.products.getAll();
        setProducts(data || []);
      } catch (error: any) {
        Swal.fire({
          icon: "error",
          title: "Gagal memuat produk",
          text:
            error.message || "Terjadi kesalahan saat mengambil data produk.",
        });
      }
    };
    fetchProducts();
    // expose for refresh
    (window as any).refreshProducts = fetchProducts;
  }, []);

  // Fetch suppliers from Supabase
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const data = await db.suppliers.getAll();
        setSuppliers(data || []);
      } catch (error: any) {
        Swal.fire({
          icon: "error",
          title: "Gagal memuat supplier",
          text:
            error.message || "Terjadi kesalahan saat mengambil data supplier.",
        });
      }
    };
    fetchSuppliers();
    (window as any).refreshSuppliers = fetchSuppliers;
  }, []);

  // Fetch purchase orders dari Supabase
  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const data = await db.purchases.getAll();
        setPurchaseOrders(data || []);
      } catch (error: any) {
        Swal.fire({
          icon: "error",
          title: "Gagal memuat daftar pembelian",
          text:
            error.message || "Terjadi kesalahan saat mengambil data pembelian.",
        });
      }
    };
    fetchPurchases();
    (window as any).refreshPurchases = fetchPurchases;
  }, []);

  // State and fetch for sales (cashier transactions of type 'sale')
  const [sales, setSales] = useState<any[]>([]);
  // expanded product in Sales Summary (moved to top-level to avoid hook order mismatch)
  const [expandedSalesProductKey, setExpandedSalesProductKey] = useState<string | null>(null);
  // expanded products within date-based report (key = `${dateKey}::${productKey}`)
  const [expandedDateProducts, setExpandedDateProducts] = useState<Set<string>>(new Set());
  // expanded dates for per-date report (key = dateKey)
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  useEffect(() => {
    const fetchSales = async () => {
      try {
        // fetch cashier transactions where type is 'sale'
        const rows = (await db.select('cashier_transactions', '*', { type: 'sale' })) as any[];
        setSales(rows || []);
      } catch (err: any) {
        console.error('Gagal mengambil data penjualan', err?.message || err);
        setSales([]);
      }
    };
    fetchSales();
    (window as any).refreshSales = fetchSales;
  }, []);

  // Helper: mapping DB fields to UI fields for purchases
  // function mapPurchaseFromDb(p: any) {
  //   return {
  //     id: p.id,
  //     poNumber: p.po_number || p.poNumber || '-',
  //     supplier_id: p.supplier_id,
  //     orderDate: p.order_date || p.orderDate,
  //     expectedDate: p.expected_date || p.expectedDate,
  //     status: p.status || 'pending',
  //     notes: p.notes,
  //     totalAmount: p.total_amount || p.totalAmount,
  //     createdBy: p.created_by || p.createdBy,
  //     // items: p.items || [] // items will be fetched separately if needed
  //   };
  // }

  // Buka modal edit dan isi data produk
  useEffect(() => {
    if (showEditForm) {
      const prod = products.find((p) => p.id === showEditForm);
      if (prod) setEditProduct({ ...prod });
    } else {
      setEditProduct(null);
    }
  }, [showEditForm, products]);

  // Buka modal edit supplier dan isi data
  useEffect(() => {
    if (showEditSupplierForm) {
      const sup = suppliers.find((s) => s.id === showEditSupplierForm);
      if (sup) setEditSupplier({ ...sup });
    } else {
      setEditSupplier(null);
    }
  }, [showEditSupplierForm, suppliers]);

  // Fetch item PO saat detail PO dibuka
  useEffect(() => {
    const fetchItems = async () => {
      if (!selectedPurchase) {
        setPurchaseOrderItems([]);
        setPurchaseItemsError(null);
        return;
      }
      setLoadingPurchaseItems(true);
      setPurchaseItemsError(null);
      try {
        const items = await db.select("purchase_order_items", "*", {
          po_id: selectedPurchase,
        });
        setPurchaseOrderItems(items || []);
      } catch (err: any) {
        setPurchaseItemsError(err?.message || "Gagal memuat item PO");
        setPurchaseOrderItems([]);
      } finally {
        setLoadingPurchaseItems(false);
      }
    };
    fetchItems();
  }, [selectedPurchase]);

  const categories = [
    { value: "all", label: "Semua Kategori" },
    { value: "beverage", label: "Minuman" },
    { value: "food", label: "Makanan" },
    { value: "snack", label: "Snack" },
    { value: "other", label: "Lainnya" },
  ];

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.includes(searchTerm);
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // const filteredPurchases = mockPurchaseOrders.filter(purchase => {
  //   const supplier = mockSuppliers.find(s => s.id === purchase.supplierId);
  //   return supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     purchase.poNumber.toLowerCase().includes(searchTerm.toLowerCase());
  // });

  // Ganti filteredSuppliers agar pakai data dari database
  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contact_person.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPurchaseOrders = purchaseOrders.filter((po) => {
    // Filter status
    const statusMatch =
      purchaseStatus === "all" || po.status === purchaseStatus;

  // Hitung periode tanggal berdasarkan preset (gunakan daftarPeriod untuk subtab Daftar)
  let start: Date | null = null;
  let end: Date | null = null;
  const now = new Date();
  switch (daftarPeriod) {
      case "today": {
        start = new Date();
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setHours(23, 59, 59, 999);
        break;
      }
      case "yesterday": {
        start = new Date();
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setHours(23, 59, 59, 999);
        break;
      }
      case "week": {
        start = new Date();
        const day = start.getDay();
        const diff = (day === 0 ? -6 : 1) - day; // Senin awal minggu
        start.setDate(start.getDate() + diff);
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setHours(23, 59, 59, 999);
        break;
      }
      case "month": {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      }
      case 'range': {
        if (daftarDateRange.start) {
          start = new Date(daftarDateRange.start);
          start.setHours(0, 0, 0, 0);
        }
        if (daftarDateRange.end) {
          end = new Date(daftarDateRange.end);
          end.setHours(23, 59, 59, 999);
        }
        break;
      }
    }

    // Filter tanggal order
    let dateMatch = true;
    const orderDate = po.order_date ? new Date(po.order_date) : null;
    if (orderDate) {
      if (start && orderDate < start) dateMatch = false;
      if (end && orderDate > end) dateMatch = false;
    }

    // Filter search
    const supplier = suppliers.find((s) => s.id === po.supplier_id);
    const searchMatch =
      po.po_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && dateMatch && searchMatch;
  });

  // Filtered list for the Daftar Pembelian subtab (uses independent filter state)
  const filteredPurchaseOrdersForDaftar = purchaseOrders.filter((po) => {
    // Filter status (same as before)
    const statusMatch = purchaseStatus === "all" || po.status === purchaseStatus;

    // Hitung periode tanggal berdasarkan preset (use daftarPeriod/daftarDateRange)
    let start: Date | null = null;
    let end: Date | null = null;
    const now = new Date();
    switch (daftarPeriod) {
      case "today": {
        start = new Date();
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setHours(23, 59, 59, 999);
        break;
      }
      case "yesterday": {
        start = new Date();
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setHours(23, 59, 59, 999);
        break;
      }
      case "week": {
        start = new Date();
        const day = start.getDay();
        const diff = (day === 0 ? -6 : 1) - day; // Senin awal minggu
        start.setDate(start.getDate() + diff);
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setHours(23, 59, 59, 999);
        break;
      }
      case "month": {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      }
      case "range": {
        if (daftarDateRange.start) {
          start = new Date(daftarDateRange.start);
          start.setHours(0, 0, 0, 0);
        }
        if (daftarDateRange.end) {
          end = new Date(daftarDateRange.end);
          end.setHours(23, 59, 59, 999);
        }
        break;
      }
    }

    // Filter tanggal order
    let dateMatch = true;
    const orderDate = po.order_date ? new Date(po.order_date) : null;
    if (orderDate) {
      if (start && orderDate < start) dateMatch = false;
      if (end && orderDate > end) dateMatch = false;
    }

    // Filter search (use daftarSearch)
    const supplier = suppliers.find((s) => s.id === po.supplier_id);
    const searchMatch =
      po.po_number?.toLowerCase().includes(daftarSearch.toLowerCase()) ||
      supplier?.name?.toLowerCase().includes(daftarSearch.toLowerCase());

    return statusMatch && dateMatch && searchMatch;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "beverage":
        return "bg-blue-100 text-blue-800";
      case "food":
        return "bg-orange-100 text-orange-800";
      case "snack":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case "pending":
  //       return "bg-yellow-100 text-yellow-800";
  //     case "ordered":
  //       return "bg-blue-100 text-blue-800";
  //     case "received":
  //       return "bg-green-100 text-green-800";
  //     case "cancelled":
  //       return "bg-red-100 text-red-800";
  //     default:
  //       return "bg-gray-100 text-gray-800";
  //   }
  // };

  // const getStatusIcon = (status: string) => {
  //   switch (status) {
  //     case "pending":
  //       return <Clock className="h-4 w-4" />;
  //     case "ordered":
  //       return <Truck className="h-4 w-4" />;
  //     case "received":
  //       return <CheckCircle className="h-4 w-4" />;
  //     case "cancelled":
  //       return <XCircle className="h-4 w-4" />;
  //     default:
  //       return <Clock className="h-4 w-4" />;
  //   }
  // };

  const lowStockProducts = products.filter((p) => p.stock <= p.min_stock);

  const addItemToPurchase = () => {
    const newItem = {
      productId: "",
      productName: "",
      quantity: 1,
      unitCost: 0,
      total: 0,
    };

    setNewPurchase((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const updatePurchaseItem = (index: number, field: string, value: any) => {
    setNewPurchase((prev) => {
      const updatedItems = [...prev.items];
      const item = { ...updatedItems[index] };

      // Update the specific field
      // @ts-expect-error: dynamic assignment
      item[field as keyof typeof item] = value;

      // Handle product selection
      if (field === "productId") {
        const product = products.find((p) => p.id === value);
        if (product) {
          item.productName = product.name;
          item.unitCost = product.cost;
          item.total = item.quantity * product.cost;
        } else {
          item.productName = "";
          item.unitCost = 0;
          item.total = 0;
        }
      }

      // Recalculate total when quantity or unitCost changes
      if (field === "quantity" || field === "unitCost") {
        item.total = item.quantity * item.unitCost;
      }

      updatedItems[index] = item;

      return {
        ...prev,
        items: updatedItems,
      };
    });
  };

  const removePurchaseItem = (index: number) => {
    setNewPurchase((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || newProduct.price <= 0) {
      Swal.fire({
        icon: "error",
        title: "Validasi Gagal",
        text: "Nama produk dan harga wajib diisi",
      });
      return;
    }

    // Here we would normally save to database
    try {
      const { error } = await db.products.create(newProduct);
      if (error) {
        // If there was an error while saving to the database
        Swal.fire({
          icon: "error",
          title: "Gagal!",
          text: `Terjadi kesalahan saat menambahkan produk: ${error.message}`,
        });
        return;
      }

      // If no error, show success message
      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: `Produk ${newProduct.name} berhasil ditambahkan!`,
      });

      setProducts(await db.products.getAll());

      setNewProduct({
        name: "",
        category: "beverage",
        price: 0,
        cost: 0,
        stock: 0,
        min_stock: 0,
        barcode: "",
        description: "",
      });
      setShowAddForm(false);
    } catch (err) {
      console.error("Error saving product:", err);
      Swal.fire({
        icon: "error",
        title: "Terjadi Kesalahan!",
        text: "Gagal menambahkan produk. Silakan coba lagi.",
      });
    }
  };

  // Ubah handleAddSupplier agar simpan ke database dan refresh list
  const handleAddSupplier = async () => {
    if (!newSupplier.name?.trim() || !newSupplier.contact_person?.trim()) {
      Swal.fire({
        icon: "error",
        title: "Validasi Gagal",
        text: "Nama supplier dan kontak person wajib diisi",
      });
      return;
    }
    try {
      await db.suppliers.create(newSupplier);
      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: `Supplier ${newSupplier.name} berhasil ditambahkan!`,
      });
      setShowSupplierForm(false);
      setNewSupplier({
        name: "",
        contact_person: "",
        phone: "",
        email: "",
        address: "",
        category: "beverage",
      });
      if ((window as any).refreshSuppliers) (window as any).refreshSuppliers();
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal tambah supplier",
        text: error.message || "Terjadi kesalahan saat menambah supplier.",
      });
    }
  };

  const [editProduct, setEditProduct] = useState<any | null>(null); // State produk yang diedit

  const handleEditProduct = async () => {
    if (!editProduct.name || editProduct.price <= 0) {
      Swal.fire({
        icon: "error",
        title: "Validasi Gagal",
        text: "Nama produk dan harga wajib diisi",
      });
      return;
    }
    try {
      await db.products.update(editProduct.id, {
        name: editProduct.name,
        category: editProduct.category,
        price: editProduct.price,
        cost: editProduct.cost,
        stock: editProduct.stock,
        min_stock: editProduct.min_stock,
        barcode: editProduct.barcode,
        description: editProduct.description,
      });

      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: `Produk ${editProduct.name} berhasil diupdate!`,
      });
      setShowEditForm(null);
      // Refresh produk
      if ((window as any).refreshProducts) (window as any).refreshProducts();
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal update",
        text: error.message || "Terjadi kesalahan saat update produk.",
      });
    }
  };

  // Edit supplier
  const handleEditSupplier = async () => {
    // Cek null/undefined dan string kosong
    if (
      !editSupplier ||
      !editSupplier.name?.trim() ||
      !editSupplier.contact_person?.trim()
    ) {
      Swal.fire({
        icon: "error",
        title: "Validasi Gagal",
        text: "Nama supplier dan kontak person wajib diisi",
      });
      return;
    }
    try {
      await db.suppliers.update(editSupplier.id, editSupplier);
      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Supplier berhasil diupdate!",
      });
      setShowEditSupplierForm(null);
      if ((window as any).refreshSuppliers) (window as any).refreshSuppliers();
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal update supplier",
        text: error.message || "Terjadi kesalahan saat update supplier.",
      });
    }
  };

  const handleDeleteProduct = async (product: any) => {
    const result = await Swal.fire({
      title: `Hapus produk?`,
      text: `Yakin ingin menghapus produk ${product.name}? Data tidak dapat dikembalikan!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
    });
    if (result.isConfirmed) {
      try {
        await db.delete("products", product.id);
        Swal.fire(
          "Terhapus!",
          `Produk ${product.name} berhasil dihapus.`,
          "success"
        );
        if ((window as any).refreshProducts)
          await (window as any).refreshProducts();
      } catch (error: any) {
        Swal.fire("Gagal", error.message || "Gagal menghapus produk.", "error");
      }
    }
  };

  // Placeholder: buka kartu stok untuk produk
  const handleOpenStockCard = (product: any) => {
    // open React modal instead of Swal to allow richer UI
    setStockCardProduct(product);
    // reset controlled inputs
    setStockAdj(0);
    setStockAdjType('in');
    setStockNote('');
    setShowStockCard(true);
    // fetch history
    fetchStockHistory(product.id, product.stock).catch((e) => {
      console.error('fetchStockHistory error', e);
    });
  };

  const fetchStockHistory = async (productId: string, currentStock: number) => {
    setStockHistoryLoading(true);
    setStockHistoryError(null);
    setStockHistory([]);

    try {
      const rows: any[] = [];

      // 1) incoming: purchase_order_items (assume field 'quantity' and 'created_at' or similar)
      try {
        const poItems = (await db.select('purchase_order_items', '*', { product_id: productId })) as any[];
        if (Array.isArray(poItems) && poItems.length > 0) {
          for (const r of poItems as any[]) {
            const qty = Number(r.quantity ?? r.qty ?? r.qty_received ?? 0);
            rows.push({
              id: (r as any).id,
              product_id: productId,
              quantity: qty, // positive = masuk
              note: (r as any).note || (r as any).notes || `PO:${(r as any).po_id || (r as any).po_number || ''}`,
              created_at: (r as any).created_at || (r as any).inserted_at || (r as any).timestamp || new Date().toISOString(),
            });
          }
        }
      } catch (err) {
        // table might not exist or other error - ignore
      }

      // 2) outgoing: cashier_transactions (type = 'sale' or 'rental' etc.) - parse details JSON to find product quantities
      try {
        const txs = (await db.select('cashier_transactions', '*', { type: 'sale' })) as any[];
        if (Array.isArray(txs) && txs.length > 0) {
          for (const tx of txs as any[]) {
            const details = (tx as any).details;
            let parsed: any = details;
            if (!parsed && (tx as any).details && typeof (tx as any).details === 'string') {
              try { parsed = JSON.parse((tx as any).details); } catch (e) { parsed = null; }
            }

            // try several shapes: array of items, { items: [...] }, { products: [...] }
            const candidates = [] as any[];
            if (Array.isArray(parsed)) candidates.push(...parsed);
            if (parsed && Array.isArray(parsed.items)) candidates.push(...parsed.items);
            if (parsed && Array.isArray(parsed.products)) candidates.push(...parsed.products);
            if (parsed && Array.isArray(parsed.cart)) candidates.push(...parsed.cart);

            // also some systems store details as object with keys being ids
            if (candidates.length === 0 && parsed && typeof parsed === 'object') {
              // attempt to collect values that look like items
              for (const v of Object.values(parsed)) {
                if (Array.isArray(v)) candidates.push(...v);
              }
            }

            for (const it of candidates) {
              const pid = (it as any).product_id ?? (it as any).productId ?? (it as any).id ?? (it as any).item_id;
              if (!pid) continue;
              if (String(pid) === String(productId)) {
                const qty = Number((it as any).quantity ?? (it as any).qty ?? (it as any).q ?? 0);
                if (qty === 0) continue;
                rows.push({
                  id: (tx as any).id,
                  product_id: productId,
                  quantity: -Math.abs(qty), // negative = keluar
                  note: (tx as any).description || (tx as any).note || (tx as any).reference_id || (tx as any).details?.note || null,
                  created_at: (tx as any).timestamp || (tx as any).created_at || (tx as any).inserted_at || new Date().toISOString(),
                });
              }
            }
          }
        }
      } catch (err) {
        // ignore if table missing or error
      }

      if (rows.length === 0) {
        setStockHistory([]);
        setStockHistoryLoading(false);
        return;
      }

      // sort ascending (oldest -> newest)
      rows.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      const totalDelta = rows.reduce((s: number, r: any) => s + Number(r.quantity || 0), 0);
      const baseline = Number(currentStock || 0) - totalDelta;
      let running = baseline;
      const withBalance = rows.map((r: any) => {
        const qty = Number(r.quantity || 0);
        running = running + qty;
        return {
          ...r,
          _qty: qty,
          _balance: running,
        };
      });

      // store newest-first for UI (existing code expects newest-first then we reverse when rendering)
      setStockHistory(withBalance.reverse());
    } catch (error: any) {
      setStockHistoryError(error?.message || String(error));
    } finally {
      setStockHistoryLoading(false);
    }
  };

  // reset page when history or product changes
  useEffect(() => {
    setHistoryPage(0);
  }, [stockHistory, stockCardProduct]);

  // Delete supplier
  const handleDeleteSupplier = async (supplier: any) => {
    // Cek apakah ada produk yang masih terkait dengan supplier ini
    const relatedProducts = products.filter(
      (p) => p.supplier_id === supplier.id
    );
    if (relatedProducts.length > 0) {
      Swal.fire({
        icon: "error",
        title: "Tidak bisa hapus supplier",
        text: `Masih ada ${relatedProducts.length} produk yang terkait dengan supplier ini. Hapus atau pindahkan produk terlebih dahulu.`,
      });
      return;
    }
    const result = await Swal.fire({
      title: `Hapus supplier?`,
      text: `Yakin ingin menghapus supplier ${supplier.name}? Data tidak dapat dikembalikan!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
    });
    if (result.isConfirmed) {
      try {
        await db.suppliers.delete(supplier.id);
        Swal.fire(
          "Terhapus!",
          `Supplier ${supplier.name} berhasil dihapus.`,
          "success"
        );
        if ((window as any).refreshSuppliers)
          await (window as any).refreshSuppliers();
      } catch (error: any) {
        Swal.fire(
          "Gagal",
          error.message || "Gagal menghapus supplier.",
          "error"
        );
      }
    }
  };

  const [productView, setProductView] = useState<"card" | "list">("card");
  const [supplierView, setSupplierView] = useState<"card" | "list">("card");

  const renderProductsTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manajemen Produk</h2>
          <p className="text-gray-600">Kelola inventory produk cafe</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setProductView("card")}
            className={`p-2 rounded-lg border ${
              productView === "card"
                ? "bg-blue-100 border-blue-400 text-blue-600"
                : "border-gray-200 text-gray-400 hover:text-blue-600"
            }`}
            aria-label="Tampilan Card"
          >
            <LayoutGrid className="h-5 w-5" />
          </button>
          <button
            onClick={() => setProductView("list")}
            className={`p-2 rounded-lg border ${
              productView === "list"
                ? "bg-blue-100 border-blue-400 text-blue-600"
                : "border-gray-200 text-gray-400 hover:text-blue-600"
            }`}
            aria-label="Tampilan List"
          >
            <ListIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ml-2"
          >
            <Plus className="h-5 w-5" />
            Tambah Produk
          </button>
          <button
            onClick={() => setShowPrintModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ml-2"
          >
            <Printer className="h-5 w-5" />
            Print Price List
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 cursor-pointer"
            onClick={() => setSearchTerm("")}
          />
          <input
            type="text"
            placeholder="Cari produk atau barcode..."
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
          {categories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-800">Stok Menipis</h3>
          </div>
          <p className="text-red-700 text-sm">
            {lowStockProducts.length} produk memiliki stok di bawah minimum:{" "}
            {lowStockProducts.map((p) => p.name).join(", ")}
          </p>
        </div>
      )}

      {/* Stock Card Modal */}
      {showStockCard && stockCardProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Kartu Stok - {stockCardProduct.name}
                </h2>
                <button
                  onClick={() => setShowStockCard(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-600">Stok Saat Ini</label>
                  <div className="mt-1 font-semibold text-gray-900">
                    {stockCardProduct.stock} unit
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Min. Stok</label>
                  <div className="mt-1 text-gray-900">{stockCardProduct.min_stock} unit</div>
                </div>
              </div>

                      <div className="mb-4">
                        <label className="block text-sm text-gray-600 mb-1">Catatan</label>
                        <textarea
                          id="stockCardNote"
                          value={stockNote}
                          onChange={(e) => setStockNote(e.target.value)}
                          placeholder="Catatan perubahan stok (opsional)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={3}
                        />
                      </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Tambah / Kurangi Stok</label>
                  <input
                    id="stockAdjustment"
                    type="number"
                    value={String(stockAdj)}
                    onChange={(e) => setStockAdj(Number(e.target.value || 0))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Tipe</label>
                  <select id="stockAdjustmentType" value={stockAdjType} onChange={(e) => setStockAdjType(e.target.value as 'in' | 'out')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="in">Tambah</option>
                    <option value="out">Kurangi</option>
                  </select>
                </div>
              </div>
            </div>

            {/* History Section */}
            <div className="p-6 border-t border-gray-200 bg-white">
              <h3 className="font-semibold text-gray-900 mb-3">Riwayat Stok</h3>
              {stockHistoryLoading ? (
                <div className="text-sm text-gray-500">Memuat riwayat...</div>
              ) : stockHistoryError ? (
                <div className="text-sm text-red-500">{stockHistoryError}</div>
              ) : stockHistory.length === 0 ? (
                <div className="text-sm text-gray-500">Belum ada riwayat stok.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase">
                      <tr>
                        <th className="px-2 py-2">Tanggal</th>
                        <th className="px-2 py-2">Keluar</th>
                        <th className="px-2 py-2">Masuk</th>
                        <th className="px-2 py-2">Saldo</th>
                        <th className="px-2 py-2">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700">
                      {/* Show starting balance row */}
                      {(() => {
                        // stockHistory is newest-first; compute starting balance from last element
                        const rev = [...stockHistory].reverse(); // oldest -> newest
                        const startBalance = rev.length > 0 ? rev[0]._balance - (rev[0]._qty || 0) : (stockCardProduct?.stock || 0);

                        // pagination slice (on chronological list)
                        const totalPages = Math.max(1, Math.ceil(rev.length / HISTORY_PAGE_SIZE));
                        const page = Math.max(0, Math.min(historyPage, totalPages - 1));
                        const start = page * HISTORY_PAGE_SIZE;
                        const paged = rev.slice(start, start + HISTORY_PAGE_SIZE);

                        return (
                          <>
                            <tr className="border-t">
                              <td className="px-2 py-2">-</td>
                              <td className="px-2 py-2 text-right">-</td>
                              <td className="px-2 py-2 text-right">-</td>
                              <td className="px-2 py-2 text-right font-semibold">{startBalance}</td>
                              <td className="px-2 py-2">Saldo Awal</td>
                            </tr>
                            {paged.map((r) => (
                              <tr key={r.id || `${r.created_at}-${r._qty}`} className="border-t">
                                <td className="px-2 py-2">{new Date(r.created_at).toLocaleString('id-ID')}</td>
                                <td className="px-2 py-2 text-right">{r._qty < 0 ? Math.abs(r._qty) : '-'}</td>
                                <td className="px-2 py-2 text-right">{r._qty > 0 ? r._qty : '-'}</td>
                                <td className="px-2 py-2 text-right">{r._balance}</td>
                                <td className="px-2 py-2">{r.note || r.notes || '-'}</td>
                              </tr>
                            ))}
                            {/* pagination controls row */}
                            <tr>
                              <td colSpan={5} className="px-2 py-3">
                                <div className="flex items-center justify-between">
                                  <div className="text-xs text-gray-500">Menampilkan {start + 1} - {Math.min(start + HISTORY_PAGE_SIZE, rev.length)} dari {rev.length} entri</div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => setHistoryPage((p) => Math.max(0, p - 1))}
                                      disabled={page === 0}
                                      className={`px-3 py-1 rounded-lg border ${page === 0 ? 'text-gray-400 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                                    >
                                      Prev
                                    </button>
                                    <button
                                      onClick={() => setHistoryPage((p) => Math.min(totalPages - 1, p + 1))}
                                      disabled={page >= totalPages - 1}
                                      className={`px-3 py-1 rounded-lg border ${page >= totalPages - 1 ? 'text-gray-400 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                                    >
                                      Next
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowStockCard(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  const adj = stockAdj || 0;
                  const type = stockAdjType || 'in';

                  const newProducts = products.map((p) => {
                    if (p.id === stockCardProduct.id) {
                      const newStock = type === 'in' ? p.stock + adj : p.stock - adj;
                      return { ...p, stock: newStock < 0 ? 0 : newStock };
                    }
                    return p;
                  });
                  setProducts(newProducts);

                  // Persist to DB using helpers
                  try {
                    if (adj !== 0) {
                      if (type === 'in') {
                        await db.products.increaseStock(stockCardProduct.id, adj);
                      } else {
                        await db.products.decreaseStock(stockCardProduct.id, adj);
                      }

                      // Try to insert history row into candidate tables
                      const historyCandidates = [
                        'stock_movements',
                        'stock_movements_history',
                        'inventory_movements',
                        'product_stock_movements',
                        'stock_changes',
                        'stock_journal',
                        'stock_logs',
                        'stock_histories',
                      ];
                      const noteVal = stockNote || null;
                      for (const tbl of historyCandidates) {
                        try {
                          await db.insert(tbl, {
                            product_id: stockCardProduct.id,
                            quantity: type === 'in' ? adj : -adj,
                            note: noteVal,
                            created_at: new Date().toISOString(),
                          });
                          break; // inserted to first available table
                        } catch (err) {
                          // ignore and try next
                        }
                      }
                    }
                  } catch (err: any) {
                    console.error('Persist stock error', err);
                    Swal.fire({ icon: 'error', title: 'Gagal', text: err?.message || 'Gagal menyimpan perubahan stok' });
                    return;
                  }

                  // reset controlled inputs
                  setStockAdj(0);
                  setStockAdjType('in');
                  setStockNote('');

                  setShowStockCard(false);
                  Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Stok diperbarui' });
                }}
                className="px-6 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid/List */}
      {productView === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Product Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                      product.category
                    )}`}
                  >
                    {product.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowEditForm(product.id)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleOpenStockCard(product)}
                      title="Kartu Stok"
                      className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                    >
                      {/* Using an SVG icon placeholder - you can replace with proper icon */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-4 w-4"
                      >
                        <path d="M3 3h18v2H3V3zm2 6h14v2H5V9zm0 6h8v2H5v-2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {product.description}
                </p>
              </div>

              {/* Product Details */}
              <div className="p-4">
                <div className="space-y-3">
                  {/* Price & Cost */}
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500">Harga Jual</p>
                      <p className="font-semibold text-green-600">
                        Rp {product.price.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Modal</p>
                      <p className="font-medium text-gray-700">
                        Rp {product.cost.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>

                  {/* Stock */}
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500">Stok Tersedia</p>
                      <p
                        className={`font-semibold ${
                          product.stock <= product.min_stock
                            ? "text-red-600"
                            : "text-blue-600"
                        }`}
                      >
                        {product.stock} unit
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Min. Stok</p>
                      <p className="font-medium text-gray-700">
                        {product.min_stock} unit
                      </p>
                    </div>
                  </div>

                  {/* Profit Margin */}
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        Margin Keuntungan
                      </span>
                      <span className="font-semibold text-purple-600">
                        {Math.round(
                          ((product.price - product.cost) / product.price) * 100
                        )}
                        %
                      </span>
                    </div>
                  </div>

                  {/* Barcode */}
                  {product.barcode && (
                    <div className="pt-2">
                      <p className="text-xs text-gray-500">Barcode</p>
                      <p className="font-mono text-sm text-gray-700">
                        {product.barcode}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nama
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Kategori
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Harga Jual
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Modal
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Stok
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Min. Stok
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Barcode
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                        product.category
                      )}`}
                    >
                      {product.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-green-600 font-semibold">
                    Rp {product.price.toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    Rp {product.cost.toLocaleString("id-ID")}
                  </td>
                  <td
                    className={`px-4 py-3 font-semibold ${
                      product.stock <= product.min_stock
                        ? "text-red-600"
                        : "text-blue-600"
                    }`}
                  >
                    {product.stock}
                  </td>
                  <td className="px-4 py-3">{product.min_stock}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">
                    {product.barcode || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShowEditForm(product.id)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenStockCard(product)}
                        title="Kartu Stok"
                        className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-4 w-4"
                        >
                          <path d="M3 3h18v2H3V3zm2 6h14v2H5V9zm0 6h8v2H5v-2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  

  // const paginatedPurchases = purchases.slice((purchasePage - 1) * purchasesPerPage, purchasePage * purchasesPerPage);
  // const totalPages = Math.ceil(totalPurchases / purchasesPerPage);

  const renderPurchasesTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pembelian Stok</h2>
          <p className="text-gray-600">
            Kelola purchase order dan pembelian produk
          </p>
        </div>
        <button
          onClick={() => {
            setShowPurchaseForm(true);
            setNewPurchase({
              supplierId: "",
              items: [],
              notes: "",
              expectedDate: new Date().toISOString().split("T")[0],
              orderDate: new Date().toISOString(),
            });
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <ShoppingBag className="h-5 w-5" />
          Buat Purchase Order
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Cari PO atau supplier..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Purchase Orders List */}
      <div className="space-y-4">
                  {filteredPurchaseOrders.map((purchase) => {
          const supplier = suppliers.find((s) => s.id === purchase.supplier_id);
          return (
            <div
              key={purchase.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {purchase.po_number}
                    </h3>
                    <p className="text-gray-600">{supplier?.name}</p>
                  </div>
                </div>
                {/* <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      purchase.status
                    )}`}
                  >
                    {getStatusIcon(purchase.status)}
                    {purchase.status?.toUpperCase()}
                  </span>
                </div> */}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <div>
                    <p className="text-xs">Tanggal Order</p>
                    <p className="font-medium text-gray-900">
                      {purchase.order_date
                        ? new Date(purchase.order_date).toLocaleDateString(
                            "id-ID"
                          )
                        : "-"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Truck className="h-4 w-4" />
                  <div>
                    <p className="text-xs">Estimasi Tiba</p>
                    <p className="font-medium text-gray-900">
                      {purchase.expected_date
                        ? new Date(purchase.expected_date).toLocaleDateString(
                            "id-ID"
                          )
                        : "-"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Package className="h-4 w-4" />
                  <div>
                    <p className="text-xs">Total Item</p>
                    <p className="font-medium text-gray-900">
                      {selectedPurchase === purchase.id
                        ? loadingPurchaseItems
                          ? "-"
                          : `${purchaseOrderItems.length} / ${purchaseOrderItems.reduce(
                              (sum, item) => sum + Number(item.quantity || 0),
                              0
                            )}`
                        : "-"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <TrendingUp className="h-4 w-4" />
                  <div>
                    <p className="text-xs">Total Nilai</p>
                    <p className="font-medium text-gray-900">
                      Rp {Number(purchase.total_amount).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setSelectedPurchase(
                      selectedPurchase === purchase.id ? null : purchase.id
                    )
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Lihat Detail
                </button>
              </div>

              {/* Extended Details */}
              {selectedPurchase === purchase.id && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Detail Purchase Order
                  </h4>
                  {/* Items List - tampilkan jika sudah fetch item */}
                  <div className="mb-4">
                    {loadingPurchaseItems ? (
                      <div className="text-gray-500 text-sm">
                        Memuat item PO...
                      </div>
                    ) : purchaseItemsError ? (
                      <div className="text-red-500 text-sm">
                        {purchaseItemsError}
                      </div>
                    ) : purchaseOrderItems.length === 0 ? (
                      <div className="text-gray-400 text-sm">
                        Tidak ada item pada PO ini.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium text-gray-600">
                                Produk
                              </th>
                              <th className="px-3 py-2 text-right font-medium text-gray-600">
                                Qty
                              </th>
                              <th className="px-3 py-2 text-right font-medium text-gray-600">
                                Harga Satuan
                              </th>
                              <th className="px-3 py-2 text-right font-medium text-gray-600">
                                Total
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {purchaseOrderItems.map((item, idx) => {
                              // Cari nama produk dari products jika product_name kosong
                              let productName = item.product_name;
                              if (!productName) {
                                const prod = products.find(
                                  (p) => p.id === item.product_id
                                );
                                productName = prod ? prod.name : "-";
                              }
                              return (
                                <tr key={item.id || idx}>
                                  <td className="px-3 py-2">{productName}</td>
                                  <td className="px-3 py-2 text-right">
                                    {item.quantity}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    Rp{" "}
                                    {Number(item.unit_cost).toLocaleString(
                                      "id-ID"
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    Rp{" "}
                                    {Number(item.total).toLocaleString("id-ID")}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                  {/* Supplier Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">
                        Informasi Supplier
                      </h5>
                      <div className="text-sm space-y-1">
                        <div>
                          <strong>Nama:</strong> {supplier?.name}
                        </div>
                        <div>
                          <strong>Kontak:</strong> {supplier?.contact_person}
                        </div>
                        <div>
                          <strong>Telepon:</strong> {supplier?.phone}
                        </div>
                        <div>
                          <strong>Email:</strong> {supplier?.email}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">
                        Detail Order
                      </h5>
                      <div className="text-sm space-y-1">
                        <div>
                          <strong>PO Number:</strong> {purchase.po_number}
                        </div>
                        {/* <div>
                          <strong>Status:</strong> {purchase.status}
                        </div> */}
                        <div>
                          <strong>Total:</strong> Rp{" "}
                          {Number(purchase.total_amount).toLocaleString(
                            "id-ID"
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {purchase.notes && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <strong className="text-blue-800">Catatan:</strong>
                      <p className="text-blue-700 mt-1">{purchase.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {filteredPurchaseOrders.length === 0 && (
          <div className="text-center text-gray-400 py-6">
            Tidak ada data purchase order ditemukan.
          </div>
        )}
      </div>
    </div>
  );

  // Form/Content untuk tab Daftar Pembelian
  const renderPurchaseListTab = () => {
    return (
      <div className="space-y-6">
        {/* Subtabs for Daftar Pembelian */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPurchaseTabView('daftar')}
            className={`px-3 py-2 text-sm rounded ${purchaseTabView === 'daftar' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-gray-600 hover:text-gray-800'}`}
          >
            Daftar Pembelian
          </button>
          <button
            onClick={() => setPurchaseTabView('rekapTanggalBarang')}
            className={`px-3 py-2 text-sm rounded ${purchaseTabView === 'rekapTanggalBarang' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-gray-600 hover:text-gray-800'}`}
          >
            Rekap Pembelian (Per tanggal - Per Barang)
          </button>
          <button
            onClick={() => setPurchaseTabView('rekapPerBarang')}
            className={`px-3 py-2 text-sm rounded ${purchaseTabView === 'rekapPerBarang' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-gray-600 hover:text-gray-800'}`}
          >
            Rekap Per Barang
          </button>
        </div>

        {/* Daftar PO view */}
        {purchaseTabView === 'daftar' && (
          <>
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Cari PO / Supplier</label>
                <input
                  type="text"
                  placeholder="Cari PO number atau nama supplier..."
                  value={daftarSearch}
                  onChange={(e) => setDaftarSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Periode</label>
                <select value={daftarPeriod} onChange={(e) => setDaftarPeriod(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="today">Hari Ini</option>
                  <option value="yesterday">Kemarin</option>
                  <option value="week">Minggu Ini</option>
                  <option value="month">Bulan Ini</option>
                  <option value="range">Rentang Waktu</option>
                </select>
              </div>
              <PurchaseFilters
                search={daftarSearch}
                onSearch={setDaftarSearch}
                period={daftarPeriod}
                onPeriodChange={setDaftarPeriod}
                dateRange={daftarDateRange}
                onDateRangeChange={setDaftarDateRange}
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto mt-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO Number</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Order</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredPurchaseOrdersForDaftar.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center text-gray-400 py-6">Tidak ada data purchase order ditemukan.</td>
                    </tr>
                  )}
                  {filteredPurchaseOrdersForDaftar.map((po) => {
                    const supplier = suppliers.find((s) => s.id === po.supplier_id);
                    return (
                      <React.Fragment key={po.id}>
                        <tr>
                          <td className="px-4 py-3 font-mono text-xs text-gray-900">
                            <button onClick={() => openPoDetail(po)} className="text-blue-600 hover:underline">{po.po_number}</button>
                          </td>
                          <td className="px-4 py-3">{po.order_date ? new Date(po.order_date).toLocaleDateString("id-ID") : "-"}</td>
                          <td className="px-4 py-3">{supplier?.name || "-"}</td>
                          <td className="px-4 py-3 font-semibold text-blue-700 text-right">Rp {Number(po.total_amount).toLocaleString("id-ID")}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button onClick={async () => {
                                try {
                                  const items = await db.select("purchase_order_items", "*", { po_id: po.id });
                                  setNewPurchase({ supplierId: po.supplier_id, items: (items || []).map((it: any) => ({ id: it.id, productId: it.product_id, productName: it.product_name, quantity: Number(it.quantity) || 0, unitCost: Number(it.unit_cost) || 0, total: Number(it.total) || 0 })), notes: po.notes || "", expectedDate: po.expected_date ? new Date(po.expected_date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0], orderDate: po.order_date ? new Date(po.order_date).toISOString() : new Date().toISOString() });
                                  setEditingPoId(po.id);
                                  setShowPurchaseForm(true);
                                } catch (err: any) {
                                  Swal.fire({ icon: "error", title: "Gagal membuka edit", text: (err?.message || "") + (err?.details ? "\n" + err.details : "") });
                                }
                              }} className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"><Edit className="h-4 w-4" /></button>
                              <button onClick={async () => {
                                const confirm = await Swal.fire({ title: "Hapus Purchase Order?", text: "Tindakan ini akan menghapus transaksi pembelian dan mengembalikan stok produk.", icon: "warning", showCancelButton: true, confirmButtonColor: "#d33", cancelButtonColor: "#6b7280", confirmButtonText: "Ya, hapus", cancelButtonText: "Batal" });
                                if (!confirm.isConfirmed) return;
                                try { await db.purchases.delete(po.id); await Swal.fire({ icon: "success", title: "Berhasil", text: "Purchase Order telah dihapus dan stok dikembalikan." }); if ((window as any).refreshPurchases) { await (window as any).refreshPurchases(); } } catch (err: any) { await Swal.fire({ icon: "error", title: "Gagal menghapus", text: (err?.message || "") + (err?.details ? "\n" + err.details : "") }); }
                              }} className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </td>
                        </tr>
                        {expandedPoId === po.id && poDetail && (
                          <tr>
                            <td colSpan={5} className="bg-gray-50 p-0">
                              <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-gray-200 p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div>
                                    <div className="text-sm text-gray-500">PO Number</div>
                                    <div className="font-semibold text-gray-900">{poDetail.po_number}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm text-gray-500">Tanggal Order</div>
                                    <div className="font-semibold">{poDetail.order_date ? new Date(poDetail.order_date).toLocaleDateString('id-ID') : '-'}</div>
                                  </div>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Harga</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total (Rp)</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                      {((poDetail.items || []) as any[]).map((it:any) => (
                                        <tr key={it.id}>
                                          <td className="px-4 py-2">{it.product_name || it.productName || 'Unknown'}</td>
                                          <td className="px-4 py-2 text-right">{Number(it.quantity||it.qty||0)}</td>
                                          <td className="px-4 py-2 text-right">{it.unit_cost ? Number(it.unit_cost).toLocaleString('id-ID') : (it.unitPrice ? Number(it.unitPrice).toLocaleString('id-ID') : '-')}</td>
                                          <td className="px-4 py-2 text-right">{Number(it.total||0).toLocaleString('id-ID')}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                <div className="mt-4 text-right font-semibold">Total: Rp {Number(poDetail.total_amount || poDetail.subtotal || ((poDetail.items || []).reduce((s:any,it:any)=> s + (Number(it.total)||0),0))).toLocaleString('id-ID')}</div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} />
                    <td className="px-4 py-3 font-semibold text-blue-700 text-right">Grand Total: Rp {Number(filteredPurchaseOrdersForDaftar.reduce((s:any, it:any) => s + (Number(it.total_amount) || 0), 0)).toLocaleString('id-ID')}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
            
          </>
        )}

        {/* Rekap per tanggal view */}
        {purchaseTabView === 'rekapTanggalBarang' && (
          <>
            <PurchaseFilters
              search={rekapTanggalSearch}
              onSearch={setRekapTanggalSearch}
              period={rekapTanggalPeriod}
              onPeriodChange={setRekapTanggalPeriod}
              dateRange={rekapTanggalDateRange}
              onDateRangeChange={setRekapTanggalDateRange}
            />
            <div className="mt-4">{renderRekapTanggalTab()}</div>
          </>
        )}

        {/* Rekap per barang view */}
        {purchaseTabView === 'rekapPerBarang' && (
          <>
            <PurchaseFilters
              search={rekapPerBarangSearch}
              onSearch={setRekapPerBarangSearch}
              period={rekapPerBarangPeriod}
              onPeriodChange={setRekapPerBarangPeriod}
              dateRange={rekapPerBarangDateRange}
              onDateRangeChange={setRekapPerBarangDateRange}
            />
            <div className="mt-4">{renderRekapPerBarangTab()}</div>
          </>
        )}
      </div>
    );
  };

  // Helper to open a PO detail (used by PO number link and Edit button)
  const openPoDetail = async (po: any) => {
    try {
      const items = await db.select("purchase_order_items", "*", { po_id: po.id });
      const detail = { ...po, items: items || [] };
      setPoDetail(detail);
      setExpandedPoId((prev) => (prev === po.id ? null : po.id));
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "Gagal memuat detail PO", text: (err?.message || "") + (err?.details ? "\n" + err.details : "") });
    }
  };

  // Render tab for sales report aggregated per date and per product
  const renderSalesListTab = () => {
    const parseItems = (details: any) => {
      if (!details) return [];
      let doc = details;
      if (typeof doc === "string") {
        try {
          doc = JSON.parse(doc);
        } catch (e) {
          return [];
        }
      }
      if (Array.isArray(doc)) return doc;
      if (doc.items && Array.isArray(doc.items)) return doc.items;
      if (doc.lines && Array.isArray(doc.lines)) return doc.lines;
      if (doc.cart && Array.isArray(doc.cart)) return doc.cart;
      if (doc.products && Array.isArray(doc.products)) return doc.products;
      for (const k of Object.keys(doc || {})) {
        if (Array.isArray((doc as any)[k])) return (doc as any)[k];
      }
      return [];
    };

  const groups: Record<string, { productMap: Record<string, { productId?: string; name: string; qty: number; total: number; lines?: Array<any> }>; dateTotal: number }> = {};

    for (const txn of sales) {
      // prefer timestamp column from cashier_transactions per schema
      const tsVal = txn.timestamp ?? txn.created_at ?? txn.inserted_at ?? txn.date ?? null;
      const dateKey = tsVal ? new Date(tsVal).toISOString().slice(0, 10) : 'unknown';
      const items = parseItems(txn.details ?? txn.items ?? txn.lines ?? []);
  if (!groups[dateKey]) groups[dateKey] = { productMap: {}, dateTotal: 0 };
      for (const it of items) {
        const productId = it.product_id ?? it.productId ?? it.id ?? it.item_id ?? it.sku ?? null;
        // prefer product name from products table when available
        const prod = productId ? products.find((p) => String(p.id) === String(productId)) : null;
        const name = prod?.name || it.product_name || it.name || it.title || it.productName || (it.product && it.product.name) || String(it.sku || it.code || productId || '-');
        const qtyRaw = it.quantity ?? it.qty ?? it.qty_sold ?? it.q ?? 0;
        const qty = Number(qtyRaw) || 0;
        let totalRaw = 0;
        if (it.total !== undefined) totalRaw = it.total;
        else if (it.subtotal !== undefined) totalRaw = it.subtotal;
        else if (it.amount !== undefined) totalRaw = it.amount;
        else if (it.price_total !== undefined) totalRaw = it.price_total;
        else if (it.unit_price !== undefined) totalRaw = qty * Number(it.unit_price);
        const total = Number(totalRaw) || 0;

        const key = String(productId ?? name);
        if (!groups[dateKey].productMap[key]) groups[dateKey].productMap[key] = { productId, name, qty: 0, total: 0, lines: [] };
        groups[dateKey].productMap[key].qty += qty;
        groups[dateKey].productMap[key].total += total;
        // store line for possible expansion in per-date view
        groups[dateKey].productMap[key].lines!.push({ txId: txn.id ?? txn.transaction_id ?? null, ts: tsVal, qty, total, unitPrice: qty ? (total / qty) : 0 });
        groups[dateKey].dateTotal += total;
      }
    }

    const dateKeys = Object.keys(groups).sort((a, b) => (a < b ? 1 : -1));
    // apply period filter similar to purchasePeriod logic
    let start: Date | null = null;
    let end: Date | null = null;
    const now = new Date();
    switch (salesPeriod) {
      case "today":
        start = new Date(); start.setHours(0,0,0,0);
        end = new Date(); end.setHours(23,59,59,999);
        break;
      case "yesterday":
        start = new Date(); start.setDate(start.getDate() - 1); start.setHours(0,0,0,0);
        end = new Date(start); end.setHours(23,59,59,999);
        break;
      case "week":
        start = new Date();
        const day = start.getDay();
        const diff = (day === 0 ? -6 : 1) - day;
        start.setDate(start.getDate() + diff);
        start.setHours(0,0,0,0);
        end = new Date(); end.setHours(23,59,59,999);
        break;
      case "month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0); end.setHours(23,59,59,999);
        break;
      case "range":
        if (salesDateRange.start) { start = new Date(salesDateRange.start); start.setHours(0,0,0,0); }
        if (salesDateRange.end) { end = new Date(salesDateRange.end); end.setHours(23,59,59,999); }
        break;
    }

    const filteredDateKeys = dateKeys.filter((dk) => {
      const dkDate = dk === 'unknown' ? null : new Date(dk + 'T00:00:00');
      if (dkDate && start && dkDate < start) return false;
      if (dkDate && end && dkDate > end) return false;
      if (!salesSearch) return true;
      const st = salesSearch.toLowerCase();
      if (dk.includes(st)) return true;
      return Object.values(groups[dk].productMap).some((p) => p.name.toLowerCase().includes(st));
    });

    // compute footer totals based on currently filtered dates
    const footerTotals = filteredDateKeys.reduce((acc: any, dk: string) => {
      const day = groups[dk];
      acc.days += 1;
      acc.amount += Number(day.dateTotal || 0);
      return acc;
    }, { days: 0, amount: 0 });

    const averagePerDay = footerTotals.days ? Math.round(footerTotals.amount / footerTotals.days) : 0;

    // build human-friendly period label for this tab too
    const periodLabel = (() => {
      if (salesPeriod === 'range') {
        if (salesDateRange.start && salesDateRange.end) {
          const s = new Date(salesDateRange.start).toLocaleDateString();
          const e = new Date(salesDateRange.end).toLocaleDateString();
          return `${s} s.d. ${e}`;
        }
        if (salesDateRange.start) return `Mulai ${new Date(salesDateRange.start).toLocaleDateString()}`;
        return 'Rentang waktu (tidak lengkap)';
      }
      switch (salesPeriod) {
        case 'today': {
          const d = new Date();
          return `Hari Ini (${d.toLocaleDateString()})`;
        }
        case 'yesterday': {
          const d = new Date(); d.setDate(d.getDate() - 1);
          return `Kemarin (${d.toLocaleDateString()})`;
        }
        case 'week': {
          const d0 = new Date();
          const dd = new Date(d0);
          const day = dd.getDay();
          const diff = (day === 0 ? -6 : 1) - day;
          dd.setDate(dd.getDate() + diff);
          return `Minggu Ini (${dd.toLocaleDateString()} - ${new Date().toLocaleDateString()})`;
        }
        case 'month': {
          const now = new Date();
          const start = new Date(now.getFullYear(), now.getMonth(), 1);
          const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          return `Bulan Ini (${start.toLocaleDateString()} - ${end.toLocaleDateString()})`;
        }
        default:
          return 'Semua Waktu';
      }
    })();

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Laporan Penjualan (Per Tanggal & Per Barang)</h2>
            <p className="text-gray-600">Rekap penjualan teragregasi per tanggal, lalu per produk.</p>
              <div className="mt-2 text-sm text-gray-500">Periode: <span className="font-medium text-gray-700">{periodLabel}</span></div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { if ((window as any).refreshSales) (window as any).refreshSales(); }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Filter by tanggal (YYYY-MM-DD) atau nama produk..."
                value={salesSearch}
                onChange={(e) => setSalesSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Periode</label>
            <select
              value={salesPeriod}
              onChange={(e) => setSalesPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="today">Hari Ini</option>
              <option value="yesterday">Kemarin</option>
              <option value="week">Minggu Ini</option>
              <option value="month">Bulan Ini</option>
              <option value="range">Rentang Waktu</option>
            </select>
          </div>
          {salesPeriod === 'range' && (
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={salesDateRange.start}
                onChange={(e) => setSalesDateRange((r) => ({ ...r, start: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
              <span className="self-center">-</span>
              <input
                type="date"
                value={salesDateRange.end}
                onChange={(e) => setSalesDateRange((r) => ({ ...r, end: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          )}
        </div>

        {filteredDateKeys.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center text-gray-500">Tidak ada data penjualan untuk filter ini.</div>
        )}

        {filteredDateKeys.map((dk) => {
          const day = groups[dk];
          const productsArr = Object.values(day.productMap).sort((a, b) => b.total - a.total);
          const dateExpanded = expandedDates.has(dk);
          return (
            <div key={dk} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                      <div className="text-sm text-gray-500">{new Date(dk).toLocaleDateString('id-ID', { weekday: 'long' })}</div>
                      <button
                        onClick={() => setExpandedDates((prev) => {
                          const s = new Set(prev);
                          if (s.has(dk)) s.delete(dk);
                          else s.add(dk);
                          return s;
                        })}
                        className="font-semibold text-left text-blue-600 hover:underline"
                      >
                        {new Date(dk).toLocaleDateString('id-ID')}
                      </button>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Total</div>
                    <div className="font-semibold text-green-700">Rp {Number(day.dateTotal || 0).toLocaleString('id-ID')}</div>
                </div>
              </div>

              {dateExpanded && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Harga (Rp)</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total (Rp)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {productsArr.map((p) => {
                        const productKey = String(p.productId ?? p.name);
                        const compoundKey = `${dk}::${productKey}`;
                        const detailCount = (p.lines || []).length;
                        const expanded = expandedDateProducts.has(compoundKey);
                        const unit = p.qty ? Math.round((p.total || 0) / p.qty) : 0;
                        return (
                          <React.Fragment key={productKey}>
                            <tr>
                              <td className="px-4 py-2">
                                <button onClick={() => {
                                  setExpandedDateProducts((prev) => {
                                    const s = new Set(prev);
                                    if (s.has(compoundKey)) s.delete(compoundKey);
                                    else s.add(compoundKey);
                                    return s;
                                  });
                                }} className="text-left text-blue-600 hover:underline flex items-center gap-2" aria-expanded={expandedDateProducts.has(compoundKey)}>
                                  <span>{p.name}</span>
                                  <span className="text-xs text-gray-500">({detailCount})</span>
                                  <svg className={`h-4 w-4 transform ${expandedDateProducts.has(compoundKey) ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                                </button>
                              </td>
                              <td className="px-4 py-2 text-right">{unit ? Number(unit).toLocaleString('id-ID') : '-'}</td>
                              <td className="px-4 py-2 text-right font-medium">{p.qty}</td>
                              <td className="px-4 py-2 text-right font-semibold">{Number(p.total || 0).toLocaleString('id-ID')}</td>
                            </tr>
                            {expanded && (
                              <tr>
                                <td colSpan={4} className="px-0 py-0 bg-gray-50">
                                  <div className="w-full overflow-x-auto">
                                    <table className="min-w-full text-sm text-gray-700">
                                      <thead>
                                        <tr>
                                          <th className="px-4 py-2 text-left text-xs text-gray-500">Waktu</th>
                                          <th className="px-4 py-2 text-right text-xs text-gray-500">Harga (Rp)</th>
                                          <th className="px-4 py-2 text-right text-xs text-gray-500">Qty</th>
                                          <th className="px-4 py-2 text-right text-xs text-gray-500">Total (Rp)</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(p.lines || []).sort((a,b)=> (a.ts < b.ts ? 1 : -1)).map((ln: any, i: number) => (
                                          <tr key={i} className="border-t">
                                            <td className="px-4 py-1">{ln.ts ? new Date(ln.ts).toLocaleString('id-ID') : (ln.txId || '-')}</td>
                                            <td className="px-4 py-1 text-right">{ln.unitPrice ? Number(Math.round(ln.unitPrice)).toLocaleString('id-ID') : '-'}</td>
                                            <td className="px-4 py-1 text-right">{ln.qty}</td>
                                            <td className="px-4 py-1 text-right">{ln.total ? Number(ln.total).toLocaleString('id-ID') : '-'}</td>
                                          </tr>
                                        ))}
                                        {/* subtotal for this product on this date */}
                                        {(() => {
                                          const subtotalQty = (p.lines || []).reduce((s: number, d: any) => s + (d.qty || 0), 0);
                                          const subtotalAmount = (p.lines || []).reduce((s: number, d: any) => s + (d.total || 0), 0);
                                          return (
                                            <tr className="border-t bg-gray-100 font-semibold">
                                              <td className="px-4 py-1">Subtotal</td>
                                              <td className="px-4 py-1 text-right">-</td>
                                              <td className="px-4 py-1 text-right">{subtotalQty}</td>
                                              <td className="px-4 py-1 text-right">{Number(subtotalAmount).toLocaleString('id-ID')}</td>
                                            </tr>
                                          );
                                        })()}
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
          {/* Footer summary: total days, period label, grand total, average per day */}
          {filteredDateKeys.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Total {footerTotals.days}-Hari</div>
                  <div className="font-semibold text-gray-900">{periodLabel}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Grand Total</div>
                  <div className="font-semibold text-green-700">Rp {Number(footerTotals.amount).toLocaleString('id-ID')}</div>
                  <div className="flex items-center justify-end gap-4 mt-2 text-sm text-gray-600">
                    <div className="text-gray-500">Rata-rata / hari</div>
                    <div className="font-medium text-gray-900">Rp {Number(averagePerDay).toLocaleString('id-ID')}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>
    );
  };

  // Function to print selected products price list
  const handlePrintPriceList = async () => {
    if (selectedProductsForPrint.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Pilih Produk', text: 'Silakan pilih produk yang akan dicetak' });
      return;
    }
    const selectedProducts: ProductPriceList[] = products
      .filter((p) => selectedProductsForPrint.includes(p.id))
      .map((p) => ({ id: p.id, name: p.name, category: p.category, price: p.price }));
    try {
      await printPriceList(selectedProducts);
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err?.message || String(err) });
    }
  };

  // Render tab for sales summary (aggregate per product across sales)
  const renderSalesSummaryTab = () => {
    // Helper to compute date window from summary period
    const computeWindow = (period: string, range: { start: string; end: string }) => {
      let start: Date | null = null;
      let end: Date | null = null;
      const now = new Date();
      switch (period) {
        case 'today': { start = new Date(); start.setHours(0,0,0,0); end = new Date(); end.setHours(23,59,59,999); break; }
        case 'yesterday': { start = new Date(); start.setDate(start.getDate()-1); start.setHours(0,0,0,0); end = new Date(start); end.setHours(23,59,59,999); break; }
        case 'week': { start = new Date(); const d = start.getDay(); const diff = (d === 0 ? -6 : 1) - d; start.setDate(start.getDate() + diff); start.setHours(0,0,0,0); end = new Date(); end.setHours(23,59,59,999); break; }
        case 'month': { start = new Date(now.getFullYear(), now.getMonth(), 1); end = new Date(now.getFullYear(), now.getMonth()+1, 0); end.setHours(23,59,59,999); break; }
        case 'range': { if (range.start) { start = new Date(range.start); start.setHours(0,0,0,0); } if (range.end) { end = new Date(range.end); end.setHours(23,59,59,999); } break; }
      }
      return { start, end };
    };
    const parseItems = (details: any) => {
      if (!details) return [];
      let doc = details;
      if (typeof doc === 'string') {
        try { doc = JSON.parse(doc); } catch (e) { return []; }
      }
      if (Array.isArray(doc)) return doc;
      if (doc.items && Array.isArray(doc.items)) return doc.items;
      if (doc.lines && Array.isArray(doc.lines)) return doc.lines;
      if (doc.cart && Array.isArray(doc.cart)) return doc.cart;
      if (doc.products && Array.isArray(doc.products)) return doc.products;
      for (const k of Object.keys(doc || {})) if (Array.isArray((doc as any)[k])) return (doc as any)[k];
      return [];
    };

    // apply salesSummary filters (period + search)
    const { start: ssStart, end: ssEnd } = computeWindow(salesSummaryPeriod, salesSummaryDateRange);
    const map: Record<string, any> = {};
    for (const txn of sales) {
      const tsVal = txn.timestamp ?? txn.created_at ?? txn.inserted_at ?? txn.date ?? null;
      const txnDate = tsVal ? new Date(tsVal) : null;
      if (txnDate) {
        if (ssStart && txnDate < ssStart) continue;
        if (ssEnd && txnDate > ssEnd) continue;
      }
      const items = parseItems(txn.details ?? txn.items ?? txn.lines ?? []);
      for (const it of items) {
        const productId = it.product_id ?? it.productId ?? it.id ?? it.item_id ?? null;
        const name = productId ? (products.find((p) => String(p.id) === String(productId))?.name) ?? it.product_name ?? it.name : it.product_name || it.name || String(it.sku || it.code || productId || '-');
        if (salesSummarySearch) {
          const st = salesSummarySearch.toLowerCase();
          if (!String(name).toLowerCase().includes(st)) continue;
        }
        const qty = Number(it.quantity ?? it.qty ?? it.q ?? 0) || 0;
        const total = Number(it.total ?? it.subtotal ?? it.amount ?? (it.unit_price ? qty * Number(it.unit_price) : 0)) || 0;
        const key = String(productId ?? name);
        if (!map[key]) map[key] = { productId: productId ?? null, name, qty: 0, total: 0 };
        map[key].qty += qty;
        map[key].total += total;
      }
    }

    const keys = Object.keys(map).sort((a,b) => (map[b].total || 0) - (map[a].total || 0));
    if (keys.length === 0) return <div className="text-sm text-gray-500">Belum ada data penjualan.</div>;
    return (
      <div>
        <div className="mb-4">
          <PurchaseFilters
            search={salesSummarySearch}
            onSearch={setSalesSummarySearch}
            period={salesSummaryPeriod}
            onPeriodChange={setSalesSummaryPeriod}
            dateRange={salesSummaryDateRange}
            onDateRangeChange={setSalesSummaryDateRange}
            placeholder="Cari produk..."
          />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Harga</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total (Rp)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {keys.map(k => {
              const item = map[k];
              const unitPrice = item.qty ? Math.round((Number(item.total) || 0) / item.qty) : 0;
              const isExpanded = expandedSalesProductKey === k;
              return (
                <React.Fragment key={k}>
                  <tr>
                    <td className="px-4 py-2">
                      <button onClick={() => setExpandedSalesProductKey(isExpanded ? null : k)} className="text-blue-600 hover:underline text-left flex items-center gap-2" aria-expanded={isExpanded}><span>{item.name}</span><svg className={`h-4 w-4 transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg></button>
                    </td>
                    <td className="px-4 py-2 text-right font-medium">{item.qty}</td>
                    <td className="px-4 py-2 text-right font-medium">{unitPrice ? unitPrice.toLocaleString('id-ID') : '-'}</td>
                    <td className="px-4 py-2 text-right font-semibold">{Number(item.total||0).toLocaleString('id-ID')}</td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={4} className="bg-gray-50 p-0">
                        <div className="p-4">
                          <div className="text-sm text-gray-600 mb-2">Detail penjualan per tanggal</div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-white">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs text-gray-500">Tanggal</th>
                                  <th className="px-4 py-2 text-right text-xs text-gray-500">Harga (Rp)</th>
                                  <th className="px-4 py-2 text-right text-xs text-gray-500">Qty</th>
                                  <th className="px-4 py-2 text-right text-xs text-gray-500">Total (Rp)</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-100">
                                {(() => {
                                  // compute per-date breakdown for product key k
                                  const perDate: Record<string, { qty: number; total: number }> = {};
                                  for (const txn of sales) {
                                    const tsVal = txn.timestamp ?? txn.created_at ?? txn.inserted_at ?? txn.date ?? null;
                                    const txnDate = tsVal ? new Date(tsVal) : null;
                                    if (txnDate) {
                                      if (ssStart && txnDate < ssStart) continue;
                                      if (ssEnd && txnDate > ssEnd) continue;
                                    }
                                    const items = parseItems(txn.details ?? txn.items ?? txn.lines ?? []);
                                    for (const it of items) {
                                      const productId = it.product_id ?? it.productId ?? it.id ?? it.item_id ?? null;
                                      let name = productId ? (products.find((p) => String(p.id) === String(productId))?.name) ?? it.product_name ?? it.name : it.product_name || it.name || String(it.sku || it.code || productId || '-');
                                      name = String(name || '').trim();
                                      // build the same key used in the sales-summary map: String(productId ?? name)
                                      const keyMatch = String(productId ?? name);
                                      if (keyMatch !== k) continue;
                                      const qty = Number(it.quantity ?? it.qty ?? 0) || 0;
                                      const ttl = Number(it.total ?? it.subtotal ?? it.amount ?? (it.unit_price ? qty * Number(it.unit_price) : 0)) || 0;
                                      const dkey = txnDate ? txnDate.toISOString().slice(0,10) : 'unknown';
                                      if (!perDate[dkey]) perDate[dkey] = { qty: 0, total: 0 };
                                      perDate[dkey].qty += qty;
                                      perDate[dkey].total += ttl;
                                    }
                                  }
                                  const dateKeys = Object.keys(perDate).sort((a,b) => a < b ? 1 : -1);
                                  if (dateKeys.length === 0) return <tr><td colSpan={3} className="text-sm text-gray-500 py-3">Tidak ada data.</td></tr>;
                                  const rows = dateKeys.map(dk => {
                                    const qty = perDate[dk].qty || 0;
                                    const totalAmt = perDate[dk].total || 0;
                                    const unit = qty ? Math.round(totalAmt / qty) : 0;
                                    return (
                                    <tr key={dk}>
                                      <td className="px-4 py-2">{new Date(dk).toLocaleDateString('id-ID')}</td>
                                      <td className="px-4 py-2 text-right">{unit ? Number(unit).toLocaleString('id-ID') : '-'}</td>
                                      <td className="px-4 py-2 text-right font-medium">{qty}</td>
                                      <td className="px-4 py-2 text-right font-semibold">{Number(totalAmt||0).toLocaleString('id-ID')}</td>
                                    </tr>
                                  );
                                  });

                                  // compute footer totals for this product across dates
                                  const footerQty = dateKeys.reduce((s, dk) => s + (perDate[dk].qty || 0), 0);
                                  const footerAmount = dateKeys.reduce((s, dk) => s + (perDate[dk].total || 0), 0);
                                  // Better transaction count: count number of sales lines across all sales that match key k
                                  let realTxCount = 0;
                                  for (const txn of sales) {
                                    const items = parseItems(txn.details ?? txn.items ?? txn.lines ?? []);
                                    for (const it of items) {
                                      const pid = it.product_id ?? it.productId ?? it.id ?? it.item_id ?? null;
                                      const nm = pid ? (products.find((pp) => String(pp.id) === String(pid))?.name) ?? it.product_name ?? it.name : it.product_name || it.name || String(it.sku || it.code || pid || '-');
                                      const keyMatch2 = String(pid ?? String(nm || '').trim());
                                      if (keyMatch2 === k) realTxCount++;
                                    }
                                  }

                                  return (
                                    <>
                                      {rows}
                                      <tr className="bg-gray-50 font-semibold">
                                        <td className="px-4 py-2">Subtotal</td>
                                        <td className="px-4 py-2 text-right">-</td>
                                        <td className="px-4 py-2 text-right">{String(footerQty)}</td>
                                        <td className="px-4 py-2 text-right">Rp {Number(footerAmount).toLocaleString('id-ID')}</td>
                                      </tr>
                                      <tr className="bg-white">
                                        <td colSpan={4} className="px-4 py-2 text-sm text-gray-600">Jumlah transaksi: {realTxCount}</td>
                                      </tr>
                                    </>
                                  );
                                })()}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
    );
  };

  // Render tab for suppliers
  const renderSuppliersTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Manajemen Supplier
          </h2>
          <p className="text-gray-600">Kelola data supplier produk</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSupplierView("card")}
            className={`p-2 rounded-lg border ${
              supplierView === "card"
                ? "bg-purple-100 border-purple-400 text-purple-600"
                : "border-gray-200 text-gray-400 hover:text-purple-600"
            }`}
            aria-label="Tampilan Card"
          >
            <LayoutGrid className="h-5 w-5" />
          </button>
          <button
            onClick={() => setSupplierView("list")}
            className={`p-2 rounded-lg border ${
              supplierView === "list"
                ? "bg-purple-100 border-purple-400 text-purple-600"
                : "border-gray-200 text-gray-400 hover:text-purple-600"
            }`}
            aria-label="Tampilan List"
          >
            <ListIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowSupplierForm(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Tambah Supplier
          </button>
        </div>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Cari supplier atau kontak person..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>
      {supplierView === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSuppliers.length === 0 && (
            <div className="col-span-full text-center text-gray-400 py-6">
              Tidak ada data supplier ditemukan.
            </div>
          )}
          {filteredSuppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {supplier.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowEditSupplierForm(supplier.id)}
                      className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSupplier(supplier)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {supplier.name}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {supplier.address}
                </p>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="font-medium">Kontak:</span>{" "}
                    {supplier.contact_person}
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="font-medium">Telepon:</span>{" "}
                    {supplier.phone || "-"}
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="font-medium">Email:</span>{" "}
                    {supplier.email || "-"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nama
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Kontak Person
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Telepon
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Kategori
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredSuppliers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-6">
                    Tidak ada data supplier ditemukan.
                  </td>
                </tr>
              )}
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {supplier.name}
                  </td>
                  <td className="px-4 py-3">{supplier.contact_person}</td>
                  <td className="px-4 py-3">{supplier.phone || "-"}</td>
                  <td className="px-4 py-3">{supplier.email || "-"}</td>
                  <td className="px-4 py-3">{supplier.category}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShowEditSupplierForm(supplier.id)}
                        className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSupplier(supplier)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      
    </div>
  );

  return (
    <>
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Manajemen Produk & Pembelian
          </h1>
          <p className="text-gray-600">
            Kelola produk, pembelian stok, dan supplier
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: "products", label: "Produk", icon: Package },
                { id: "purchases", label: "Pembelian", icon: ShoppingBag },
                {
                  id: "purchaseList",
                  label: "Daftar Pembelian",
                  icon: FileText,
                },
                {
                  id: "reports",
                  label: "Laporan Penjualan",
                  icon: DollarSign,
                  children: [
                    { id: "sales", label: "Laporan Penjualan (Per Tanggal & Per Barang)" },
                    { id: "salesSummary", label: "Laporan Rekap Per Barang" },
                  ],
                },
                { id: "suppliers", label: "Supplier", icon: Truck },
              ].map((tab: any) => {
                if (tab.children && Array.isArray(tab.children)) {
                  const Icon = tab.icon as any;
                  const isParentActive = activeTab === 'reports';
                  // Render only the parent tab in the main nav. Sub-tabs will appear inside the reports content.
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab('reports' as any);
                        setReportTab('sales');
                        setSearchTerm("");
                      }}
                      className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                        isParentActive
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                }

                const Icon = tab.icon as any;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setSearchTerm("");
                    }}
                    className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
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
  {activeTab === "products" && renderProductsTab()}
  {activeTab === "purchases" && renderPurchasesTab()}
  {activeTab === "purchaseList" && renderPurchaseListTab()}
  {/* Reports parent: sub-nav + child content */}
  {activeTab === "reports" && (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setReportTab('sales')}
          className={`px-3 py-2 text-sm rounded ${reportTab === 'sales' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-gray-600 hover:text-gray-800'}`}
        >
          Laporan Penjualan (Per Tanggal & Per Barang)
        </button>
        <button
          onClick={() => setReportTab('salesSummary')}
          className={`px-3 py-2 text-sm rounded ${reportTab === 'salesSummary' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-gray-600 hover:text-gray-800'}`}
        >
          Laporan Rekap Per Barang
        </button>
      </div>

      <div>
        {reportTab === 'sales' ? renderSalesListTab() : renderSalesSummaryTab()}
      </div>
    </div>
  )}
  {activeTab === "suppliers" && renderSuppliersTab()}

        {/* Add Product Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Tambah Produk Baru
                </h2>

                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Produk *
                    </label>
                    <input
                      type="text"
                      value={newProduct.name}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Masukkan nama produk"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kategori
                    </label>
                    <select
                      value={newProduct.category}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          category: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="beverage">Minuman</option>
                      <option value="food">Makanan</option>
                      <option value="snack">Snack</option>
                      <option value="other">Lainnya</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Harga Modal *
                      </label>
                      <input
                        type="number"
                        value={newProduct.cost}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            cost: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Harga Jual *
                      </label>
                      <input
                        type="number"
                        value={newProduct.price}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            price: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stok Awal
                      </label>
                      <input
                        type="number"
                        value={newProduct.stock}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            stock: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min. Stok
                      </label>
                      <input
                        type="number"
                        value={newProduct.min_stock}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            min_stock: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Barcode (Opsional)
                    </label>
                    <input
                      type="text"
                      value={newProduct.barcode}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          barcode: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Scan atau masukkan barcode"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deskripsi
                    </label>
                    <textarea
                      value={newProduct.description}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Deskripsi produk"
                    />
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
                    onClick={handleAddProduct}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Simpan Produk
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Purchase Order Modal */}
        {showPurchaseForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {editingPoId ? "Edit Purchase Order" : "Buat Purchase Order"}
                </h2>

                <form className="space-y-6">
                  {/* Supplier Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Supplier *
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowSupplierSelectModal(true)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left flex items-center justify-between"
                      >
                        <span>
                          {newPurchase.supplierId
                            ? suppliers.find(
                                (s) => s.id === newPurchase.supplierId
                              )?.name || "Pilih Supplier"
                            : "Pilih Supplier"}
                        </span>
                        <Search className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tanggal Diharapkan
                      </label>
                      <input
                        type="date"
                        value={newPurchase.expectedDate}
                        onChange={(e) =>
                          setNewPurchase({
                            ...newPurchase,
                            expectedDate: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Items Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        Item Pembelian
                      </h3>
                      <button
                        type="button"
                        onClick={addItemToPurchase}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Tambah Item
                      </button>
                    </div>

                    <div className="space-y-3">
                      {newPurchase.items.map((item, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-12 gap-3 items-end p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="col-span-4">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Produk
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                setShowProductSelectModal({ open: true, index })
                              }
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left flex items-center justify-between"
                            >
                              <span>
                                {item.productId
                                  ? products.find(
                                      (p) => p.id === item.productId
                                    )?.name ||
                                    item.productName ||
                                    "Pilih Produk"
                                  : "Pilih Produk"}
                              </span>
                              <Search className="h-4 w-4 text-gray-400" />
                            </button>
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Qty
                            </label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                updatePurchaseItem(
                                  index,
                                  "quantity",
                                  Number(e.target.value)
                                )
                              }
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              min="1"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Harga Satuan
                            </label>
                            <input
                              type="number"
                              value={item.unitCost}
                              onChange={(e) =>
                                updatePurchaseItem(
                                  index,
                                  "unitCost",
                                  Number(e.target.value)
                                )
                              }
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div className="col-span-3">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Total
                            </label>
                            <div className="px-2 py-1 bg-gray-100 rounded text-sm font-medium">
                              Rp {item.total.toLocaleString("id-ID")}
                            </div>
                          </div>
                          <div className="col-span-1">
                            <button
                              type="button"
                              onClick={() => removePurchaseItem(index)}
                              className="w-full p-1 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Real-time Total Calculation */}
                    {newPurchase.items.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-3">
                          Ringkasan Purchase Order
                        </h4>
                        <div className="space-y-2">
                          {(() => {
                            const total = newPurchase.items.reduce(
                              (sum, item) =>
                                sum + item.quantity * item.unitCost,
                              0
                            );
                            return (
                              <>
                                {/* <div className="flex justify-between items-center">
                                  <span className="text-blue-800">
                                    Subtotal:
                                  </span>
                                  <span className="font-medium text-blue-900">
                                    Rp {subtotal.toLocaleString("id-ID")}
                                  </span>
                                </div> */}
                                {newPurchase.items.map((item, index) => (
                                  <div
                                    key={index}
                                    className="flex justify-between items-center"
                                  >
                                    <div className="text-blue-800">
                                      {item.productName} ({item.quantity} x Rp{" "}
                                      {item.unitCost.toLocaleString("id-ID")})
                                    </div>
                                    <div className="font-medium text-blue-900">
                                      Rp{" "}
                                      {(
                                        item.quantity * item.unitCost
                                      ).toLocaleString("id-ID")}
                                    </div>
                                  </div>
                                ))}
                                {/* <div className="flex justify-between items-center">
                                  <span className="text-blue-800">
                                    Pajak (10%):
                                  </span>
                                  <span className="font-medium text-blue-900">
                                    Rp {tax.toLocaleString("id-ID")}
                                  </span>
                                </div> */}
                                <div className="flex justify-between items-center border-t border-blue-300 pt-2">
                                  <span className="font-bold text-blue-900">
                                    Total:
                                  </span>
                                  <span className="text-xl font-bold text-blue-900">
                                    Rp {total.toLocaleString("id-ID")}
                                  </span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Catatan (Opsional)
                    </label>
                    <textarea
                      value={newPurchase.notes}
                      onChange={(e) =>
                        setNewPurchase({
                          ...newPurchase,
                          notes: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Catatan untuk supplier"
                    />
                  </div>
                </form>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      if (isSavingPurchase) return;
                      setShowPurchaseForm(false);
                      setEditingPoId(null);
                    }}
                    disabled={isSavingPurchase}
                    className={`flex-1 px-4 py-2 border rounded-lg font-medium transition-colors ${
                      isSavingPurchase
                        ? "border-gray-200 text-gray-400 cursor-not-allowed"
                        : "border-gray-300 hover:border-gray-400 text-gray-700"
                    }`}
                  >
                    Batal
                  </button>
                  <button
                    onClick={async () => {
                      if (isSavingPurchase) return;
                      setIsSavingPurchase(true);
                      try {
                        if (editingPoId) {
                          await db.purchases.update(editingPoId, {
                            supplier_id: newPurchase.supplierId,
                            items: newPurchase.items,
                            notes: newPurchase.notes,
                            expected_date: newPurchase.expectedDate,
                            order_date: newPurchase.orderDate,
                            subtotal: purchaseSubtotal,
                            total_amount: purchaseTotal,
                          });
                          Swal.fire({
                            icon: "success",
                            title: "Berhasil!",
                            text: `Purchase Order berhasil diperbarui.`,
                          });
                        } else {
                          await db.purchases.create({
                            supplier_id: newPurchase.supplierId,
                            items: newPurchase.items,
                            notes: newPurchase.notes,
                            expected_date: newPurchase.expectedDate,
                            order_date: newPurchase.orderDate,
                            subtotal: purchaseSubtotal,
                            total_amount: purchaseTotal,
                          });
                          Swal.fire({
                            icon: "success",
                            title: "Berhasil!",
                            text: `Purchase Order berhasil dibuat dengan total Rp ${purchaseTotal.toLocaleString(
                              "id-ID"
                            )}`,
                          });
                        }

                        setShowPurchaseForm(false);
                        setEditingPoId(null);
                        setNewPurchase({
                          supplierId: "",
                          items: [],
                          notes: "",
                          expectedDate: new Date().toISOString().split("T")[0],
                          orderDate: new Date().toISOString(),
                        });
                        if ((window as any).refreshPurchases)
                          await (window as any).refreshPurchases();
                        if ((window as any).refreshProducts)
                          await (window as any).refreshProducts();
                      } catch (error: any) {
                        Swal.fire({
                          icon: "error",
                          title: editingPoId
                            ? "Gagal memperbarui PO"
                            : "Gagal tambah PO",
                          text:
                            (error?.message || "") +
                            (error?.details ? "\n" + error.details : ""),
                        });
                         
                        console.error("PO Error:", error);
                      } finally {
                        setIsSavingPurchase(false);
                      }
                    }}
                    disabled={isSavingPurchase}
                    className={`flex-1 text-white px-4 py-2 rounded-lg font-medium transition-colors ${
                      isSavingPurchase
                        ? "bg-green-400 cursor-wait"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {isSavingPurchase
                      ? editingPoId
                        ? "Menyimpan..."
                        : "Membuat..."
                      : editingPoId
                      ? "Simpan Perubahan"
                      : "Buat Purchase Order"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inline PO Detail panel removed - details are shown as expanded row within the table */}

        {/* Add Supplier Modal */}
        {showSupplierForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Tambah Supplier Baru
                </h2>
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Supplier *
                    </label>
                    <input
                      type="text"
                      value={newSupplier.name}
                      onChange={(e) =>
                        setNewSupplier({ ...newSupplier, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Nama perusahaan supplier"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kontak Person *
                    </label>
                    <input
                      type="text"
                      value={newSupplier.contact_person}
                      onChange={(e) =>
                        setNewSupplier({
                          ...newSupplier,
                          contact_person: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Nama kontak person"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telepon
                      </label>
                      <input
                        type="text"
                        value={newSupplier.phone}
                        onChange={(e) =>
                          setNewSupplier({
                            ...newSupplier,
                            phone: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="+62 8xx-xxxx-xxxx"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kategori
                      </label>
                      <select
                        value={newSupplier.category}
                        onChange={(e) =>
                          setNewSupplier({
                            ...newSupplier,
                            category: e.target.value as any,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="beverage">Minuman</option>
                        <option value="food">Makanan</option>
                        <option value="snack">Snack</option>
                        <option value="other">Lainnya</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newSupplier.email}
                      onChange={(e) =>
                        setNewSupplier({
                          ...newSupplier,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="email@supplier.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alamat
                    </label>
                    <textarea
                      value={newSupplier.address}
                      onChange={(e) =>
                        setNewSupplier({
                          ...newSupplier,
                          address: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Alamat lengkap supplier"
                      rows={2}
                    />
                  </div>
                </form>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowSupplierForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleAddSupplier}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Tambah Supplier
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Product Modal */}
        {showEditForm && editProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Edit Produk
                </h2>
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleEditProduct();
                  }}
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Produk *
                    </label>
                    <input
                      type="text"
                      value={editProduct.name}
                      onChange={(e) =>
                        setEditProduct({ ...editProduct, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Masukkan nama produk"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kategori
                    </label>
                    <select
                      value={editProduct.category}
                      onChange={(e) =>
                        setEditProduct({
                          ...editProduct,
                          category: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="beverage">Minuman</option>
                      <option value="food">Makanan</option>
                      <option value="snack">Snack</option>
                      <option value="other">Lainnya</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Harga Modal *
                      </label>
                      <input
                        type="number"
                        value={editProduct.cost}
                        onChange={(e) =>
                          setEditProduct({
                            ...editProduct,
                            cost: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Harga Jual *
                      </label>
                      <input
                        type="number"
                        value={editProduct.price}
                        onChange={(e) =>
                          setEditProduct({
                            ...editProduct,
                            price: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stok
                      </label>
                      <input
                        type="number"
                        value={editProduct.stock}
                        onChange={(e) =>
                          setEditProduct({
                            ...editProduct,
                            stock: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min. Stok
                      </label>
                      <input
                        type="number"
                        value={editProduct.min_stock}
                        onChange={(e) =>
                          setEditProduct({
                            ...editProduct,
                            min_stock: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Barcode (Opsional)
                    </label>
                    <input
                      type="text"
                      value={editProduct.barcode || ""}
                      onChange={(e) =>
                        setEditProduct({
                          ...editProduct,
                          barcode: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Scan atau masukkan barcode"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deskripsi
                    </label>
                    <textarea
                      value={editProduct.description || ""}
                      onChange={(e) =>
                        setEditProduct({
                          ...editProduct,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Deskripsi produk"
                    />
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowEditForm(null)}
                      className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Product Select Modal for Purchase Items */}
        {showProductSelectModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex">
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Pilih Produk
                  </h3>
                  <button
                    onClick={() => {
                      setShowProductSelectModal({ open: false, index: null });
                      setProductSearchTerm("");
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Cari produk berdasarkan nama, kategori, atau barcode..."
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-100">
                  {filteredProductsForSelect.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      {productSearchTerm
                        ? "Tidak ada produk yang cocok"
                        : "Belum ada produk"}
                    </div>
                  ) : (
                    filteredProductsForSelect.map((p: any) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          if (showProductSelectModal.index !== null) {
                            updatePurchaseItem(
                              showProductSelectModal.index,
                              "productId",
                              p.id
                            );
                          }
                          setShowProductSelectModal({
                            open: false,
                            index: null,
                          });
                          setProductSearchTerm("");
                        }}
                        className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              {p.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              Kategori: {p.category || "-"}
                              {p.barcode ? ` • Barcode: ${p.barcode}` : ""}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-700">
                              Stok: {p.stock}
                            </div>
                            <div className="text-xs text-gray-500">
                              Modal: Rp{" "}
                              {Number(p.cost || 0).toLocaleString("id-ID")}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProductSelectModal({ open: false, index: null });
                      setProductSearchTerm("");
                    }}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Supplier Select Modal for Purchase Order */}
        {showSupplierSelectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex">
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Pilih Supplier
                  </h3>
                  <button
                    onClick={() => {
                      setShowSupplierSelectModal(false);
                      setSupplierSearchTerm("");
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Cari supplier berdasarkan nama, kontak, atau telepon..."
                    value={supplierSearchTerm}
                    onChange={(e) => setSupplierSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-100">
                  {filteredSuppliersForSelect.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      {supplierSearchTerm
                        ? "Tidak ada supplier yang cocok"
                        : "Belum ada supplier"}
                    </div>
                  ) : (
                    filteredSuppliersForSelect.map((s: any) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setNewPurchase({ ...newPurchase, supplierId: s.id });
                          setShowSupplierSelectModal(false);
                          setSupplierSearchTerm("");
                        }}
                        className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              {s.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {s.contact_person || ""}
                              {s.phone ? ` • ${s.phone}` : ""}
                            </div>
                          </div>
                          <div className="text-right text-xs text-gray-400">
                            {s.email || ""}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSupplierSelectModal(false);
                      setSupplierSearchTerm("");
                    }}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Tutup
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
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {products.length}
            </h3>
            <p className="text-gray-600 text-sm">Total Produk</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {purchaseOrders?.length || 0}
            </h3>
            <p className="text-gray-600 text-sm">Purchase Order</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Truck className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {suppliers?.length || 0}
            </h3>
            <p className="text-gray-600 text-sm">Supplier</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {lowStockProducts.length}
            </h3>
            <p className="text-gray-600 text-sm">Stok Menipis</p>
          </div>
        </div>
      </div>
      {/* Modal Edit Supplier */}
      {showEditSupplierForm && editSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Edit Supplier
              </h2>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Supplier *
                  </label>
                  <input
                    type="text"
                    value={editSupplier.name}
                    onChange={(e) =>
                      setEditSupplier({ ...editSupplier, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Nama perusahaan supplier"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kontak Person *
                  </label>
                  <input
                    type="text"
                    value={editSupplier.contact_person}
                    onChange={(e) =>
                      setEditSupplier({
                        ...editSupplier,
                        contact_person: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Nama kontak person"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telepon
                    </label>
                    <input
                      type="text"
                      value={editSupplier.phone}
                      onChange={(e) =>
                        setEditSupplier({
                          ...editSupplier,
                          phone: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="+62 8xx-xxxx-xxxx"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kategori
                    </label>
                    <select
                      value={editSupplier.category}
                      onChange={(e) =>
                        setEditSupplier({
                          ...editSupplier,
                          category: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="beverage">Minuman</option>
                      <option value="food">Makanan</option>
                      <option value="snack">Snack</option>
                      <option value="other">Lainnya</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editSupplier.email}
                    onChange={(e) =>
                      setEditSupplier({
                        ...editSupplier,
                        email: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="email@supplier.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alamat
                  </label>
                  <textarea
                    value={editSupplier.address}
                    onChange={(e) =>
                      setEditSupplier({
                        ...editSupplier,
                        address: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Alamat lengkap supplier"
                    rows={2}
                  />
                </div>
              </form>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEditSupplierForm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleEditSupplier}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Price List Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Print Product List
                </h2>
                <button
                  onClick={() => {
                    setShowPrintModal(false);
                    setSelectedProductsForPrint([]);
                    setSelectAllProducts(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Pilih produk yang akan dicetak dalam daftar harga
              </p>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Select All Checkbox */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectAllProducts}
                    onChange={(e) => {
                      setSelectAllProducts(e.target.checked);
                      if (e.target.checked) {
                        setSelectedProductsForPrint(products.map((p) => p.id));
                      } else {
                        setSelectedProductsForPrint([]);
                      }
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-900">
                    Pilih Semua Produk ({products.length})
                  </span>
                </label>
              </div>

              {/* Select Low Stock Checkbox */}
              <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectLowStockProducts}
                    onChange={(e) => {
                      const lowStockProducts = products.filter(
                        (p) => p.stock <= p.min_stock
                      );
                      setSelectLowStockProducts(e.target.checked);
                      if (e.target.checked) {
                        setSelectedProductsForPrint((prev) => [
                          ...prev,
                          ...lowStockProducts
                            .map((p) => p.id)
                            .filter((id) => !prev.includes(id)),
                        ]);
                      } else {
                        setSelectedProductsForPrint((prev) =>
                          prev.filter(
                            (id) => !lowStockProducts.some((p) => p.id === id)
                          )
                        );
                      }
                    }}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="font-medium text-orange-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Pilih Produk Stok Rendah (
                    {products.filter((p) => p.stock <= p.min_stock).length})
                  </span>
                </label>
              </div>

              <div className="space-y-2">
                {products
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedProductsForPrint.includes(product.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProductsForPrint((prev) => [
                              ...prev,
                              product.id,
                            ]);
                          } else {
                            setSelectedProductsForPrint((prev) =>
                              prev.filter((id) => id !== product.id)
                            );
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {product.category} • Rp{" "}
                          {product.price.toLocaleString("id-ID")}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {selectedProductsForPrint.length} produk dipilih
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowPrintModal(false);
                      setSelectedProductsForPrint([]);
                      setSelectAllProducts(false);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handlePrintPriceList}
                    disabled={selectedProductsForPrint.length === 0}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                      selectedProductsForPrint.length === 0
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    <Printer className="h-4 w-4" />
                    Print ({selectedProductsForPrint.length})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Products;
