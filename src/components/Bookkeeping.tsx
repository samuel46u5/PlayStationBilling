import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  FileText,
  Loader2,
  AlertCircle,
  SquarePen,
  Coffee,
  Gamepad,
  Clock,
  Receipt,
  X,
  Ticket,
  Trash,
  CreditCard,
  Banknote,
} from "lucide-react";
import { supabase, db } from "../lib/supabase";
import { BookkeepingEntry } from "../types";
import Swal from "sweetalert2";
import { printReceipt } from "../utils/receipt";

type Summary = {
  totalRental?: number;
  totalCafe?: number;
  totalIncome?: number;
  totalExpense?: number;
  netProfit: number;
};

const Bookkeeping: React.FC = () => {
  // State management
  const [entries, setEntries] = useState<BookkeepingEntry[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  // Filter states
  const [selectedPeriod, setSelectedPeriod] = useState("today");

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    type: "income" as "income" | "expense",
    category: "rental" as
      | "rental"
      | "cafe"
      | "inventory"
      | "operational"
      | "voucher"
      | "other",
    description: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    reference: "",
    notes: "",
  });

  const [showEditForm, setShowEditForm] = useState(false);
  const [editEntry, setEditEntry] = useState<BookkeepingEntry | null>(null);
  const [activeView, setActiveView] = useState<
    "jurnal" | "laba_rugi" | "laporan_kasir"
  >("jurnal");
  const [activeTab, setActiveTab] = useState<
    "all" | "income" | "expense" | "rental" | "sale" | "voucher"
  >("all");

  // Laporan Kasir states
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionPeriod, setSessionPeriod] = useState<string>("month");
  const [sessionStartDate, setSessionStartDate] = useState<string>("");
  const [sessionEndDate, setSessionEndDate] = useState<string>("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<
    "all" | "cash" | "non-cash"
  >("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(20);

  // Constants
  const periods = [
    { value: "today", label: "Hari Ini" },
    { value: "yesterday", label: "Kemarin" },
    { value: "week", label: "Minggu Ini" },
    { value: "month", label: "Bulan Ini" },
    { value: "range", label: "Rentang Waktu" },
  ];

  const types = [
    { value: "all", label: "Semua" },
    { value: "income", label: "Pemasukan" },
    { value: "expense", label: "Pengeluaran" },
  ];

  const categories = [
    { value: "all", label: "Semua Kategori" },
    { value: "rental", label: "Rental PlayStation" },
    { value: "cafe", label: "Penjualan Cafe" },
    { value: "inventory", label: "Pembelian Inventory" },
    { value: "operational", label: "Operasional" },
    { value: "voucher", label: "Penjualan Voucher" },
    { value: "other", label: "Lainnya" },
  ];

  const filteredSessions = useMemo(() => {
    if (!showSessionModal) return sessions;
    let start: Date | null = null;
    let end: Date | null = null;
    const now = new Date();
    switch (sessionPeriod) {
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
        if (sessionStartDate) {
          start = new Date(sessionStartDate);
          start.setHours(0, 0, 0, 0);
        }
        if (sessionEndDate) {
          end = new Date(sessionEndDate);
          end.setHours(23, 59, 59, 999);
        }
        break;
      }
    }
    return sessions.filter((s) => {
      const st = s.start_time ? new Date(s.start_time) : null;
      if (!st) return false;
      if (start && st < start) return false;
      if (end && st > end) return false;
      return true;
    });
  }, [
    sessions,
    sessionPeriod,
    sessionStartDate,
    sessionEndDate,
    showSessionModal,
  ]);

  const fetchTransaction = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("cashier_transactions")
        .select("*")
        // .or("type.eq.sale,type.eq.rental")
        .order("timestamp", { ascending: false });

      if (activeView === "laba_rugi") {
        query = query.or("type.eq.sale,type.eq.rental, type.eq.voucher");

        if (selectedPeriod !== "all") {
          const now = new Date();
          let startDateCalc = new Date();
          switch (selectedPeriod) {
            case "today":
              startDateCalc.setHours(0, 0, 0, 0);
              break;
            case "yesterday":
              startDateCalc.setDate(now.getDate() - 1);
              startDateCalc.setHours(0, 0, 0, 0);
              break;
            case "week":
              startDateCalc.setDate(now.getDate() - 7);
              break;
            case "month":
              startDateCalc.setMonth(now.getMonth() - 1);
              break;
            case "year":
              startDateCalc.setFullYear(now.getFullYear() - 1);
              break;
          }
          query = query.gte("timestamp", startDateCalc.toISOString());
        }
      } else if (activeView === "laporan_kasir") {
        if (selectedSessionId) {
          query = query.eq("session_id", selectedSessionId);
        }
        // if (startDate) {
        //   query = query.gte("timestamp", new Date(startDate).toISOString());
        // }
        // if (endDate) {
        //   const end = new Date(endDate);
        //   end.setHours(23, 59, 59, 999);
        //   query = query.lte("timestamp", end.toISOString());
        // }
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal mengambil data laba rugi"
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch data from database
  const fetchEntries = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("bookkeeping_entries")
        .select("*")
        .order("entry_date", { ascending: false });

      // Apply period filter
      if (selectedPeriod) {
        const now = new Date();
        let start: Date | null = null;
        let end: Date | null = null;

        switch (selectedPeriod) {
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
            const diff = (day === 0 ? -6 : 1) - day; // Senin sebagai awal minggu
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
            if (startDate) {
              start = new Date(startDate);
              start.setHours(0, 0, 0, 0);
            }
            if (endDate) {
              end = new Date(endDate);
              end.setHours(23, 59, 59, 999);
            }
            break;
          }
        }

        if (start) {
          query = query.gte("entry_date", start.toISOString().split("T")[0]);
        }
        if (end) {
          query = query.lte("entry_date", end.toISOString().split("T")[0]);
        }
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setEntries(data || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengambil data"
      );
      console.error("Gagal mengambil data pembukuan");
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and filter changes
  useEffect(() => {
    if (activeView === "laba_rugi") {
      fetchTransaction();
    } else if (activeView === "laporan_kasir") {
      if (selectedSessionId) {
        fetchTransaction();
      } else {
        setTransactions([]);
      }
    } else {
      fetchEntries();
    }
  }, [selectedPeriod, activeView, selectedSessionId, startDate, endDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, activeView]);

  // Ambil daftar sesi saat masuk tab laporan_kasir
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        if (activeView !== "laporan_kasir") return;
        setLoading(true);
        const { data, error } = await supabase
          .from("cashier_sessions")
          .select("*")
          .order("start_time", { ascending: false })
          .limit(100);
        if (error) throw error;
        setSessions(data || []);
        if (!selectedSessionId && (data || []).length > 0) {
          setSelectedSessionId((data as any[])[0].id);
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, [activeView, selectedSessionId, activeTab]);

  // Pagination
  const sourceList = useMemo(
    () =>
      activeView === "laba_rugi" || activeView === "laporan_kasir"
        ? transactions
        : entries,
    [activeView, transactions, entries]
  );

  // const filteredByTab = useMemo(() => {
  //   if (activeView === "jurnal" && activeTab === "income")
  //     return sourceList.filter(
  //       (e) => e.type === "income" || e.type === "sale" || e.type === "rental"
  //     );
  //   if (activeView === "jurnal" && activeTab === "expense")
  //     return sourceList.filter((e) => e.type === "expense");
  //   if (activeView === "laba_rugi" && activeTab === "rental")
  //     return sourceList.filter((e) => e.type === "rental");
  //   if (activeView === "laba_rugi" && activeTab === "sale")
  //     return sourceList.filter((e) => e.type === "sale");
  //   if (activeView === "laba_rugi" && activeTab === "voucher")
  //     return sourceList.filter((e) => e.type === "voucher");
  //   if (activeView === "laporan_kasir" && activeTab === "income")
  //     return sourceList.filter(
  //       (e) =>
  //         e.type === "income" ||
  //         e.type === "sale" ||
  //         e.type === "rental" ||
  //         e.type === "voucher"
  //     );
  //   // Filter berdasarkan metode pembayaran
  //   if (paymentMethodFilter === "cash") {
  //     sourceList = sourceList.filter((e) => (e.payment_method || "cash") === "cash");
  //   } else if (paymentMethodFilter === "non-cash") {
  //     sourceList = sourceList.filter((e) => (e.payment_method || "cash") !== "cash");
  //   }
  //   if (activeView === "laporan_kasir" && activeTab === "expense")
  //     return sourceList.filter((e) => e.type === "expense");
  //   return sourceList;
  // }, [sourceList, activeTab, activeView]);

  const filteredByTab = useMemo(() => {
    let list = sourceList;
    if (activeView === "jurnal" && activeTab === "income")
      list = list.filter(
        (e) => e.type === "income" || e.type === "sale" || e.type === "rental"
      );
    if (activeView === "jurnal" && activeTab === "expense")
      list = list.filter((e) => e.type === "expense");
    if (activeView === "laba_rugi" && activeTab === "rental")
      list = list.filter((e) => e.type === "rental");
    if (activeView === "laba_rugi" && activeTab === "sale")
      list = list.filter((e) => e.type === "sale");
    if (activeView === "laba_rugi" && activeTab === "voucher")
      list = list.filter((e) => e.type === "voucher");
    if (activeView === "laporan_kasir" && activeTab === "income") {
      list = list.filter(
        (e) =>
          e.type === "income" ||
          e.type === "sale" ||
          e.type === "rental" ||
          e.type === "voucher"
      );
      // Filter berdasarkan metode pembayaran
      if (paymentMethodFilter === "cash") {
        list = list.filter((e) => (e.payment_method || "cash") === "cash");
      } else if (paymentMethodFilter === "non-cash") {
        list = list.filter((e) => (e.payment_method || "cash") !== "cash");
      }
    }
    if (activeView === "laporan_kasir" && activeTab === "expense")
      list = list.filter((e) => e.type === "expense");
    return list;
  }, [sourceList, activeTab, activeView, paymentMethodFilter]);

  const incomeCount = useMemo(
    () =>
      sourceList.filter(
        (e) =>
          e.type === "income" ||
          e.type === "sale" ||
          e.type === "rental" ||
          e.type === "voucher"
      ).length,
    [activeView, sourceList]
  );
  const expenseCount = useMemo(
    () => sourceList.filter((e) => e.type === "expense").length,
    [activeView, sourceList]
  );
  const rentalCount = useMemo(
    () => sourceList.filter((e) => e.type === "rental").length,
    [activeView, sourceList]
  );
  const saleCount = useMemo(
    () => sourceList.filter((e) => e.type === "sale").length,
    [activeView, sourceList]
  );
  const voucherCount = useMemo(
    () => sourceList.filter((e) => e.type === "voucher").length,
    [activeView, sourceList]
  );
  // Ringkasan pembayaran untuk Laporan Kasir
  const paymentSummary = useMemo(() => {
    const incomeTypes = new Set(["sale", "rental", "voucher"]);
    const list = transactions.filter((t: any) => incomeTypes.has(t.type));

    const normalizeMethod = (method: any) => {
      const m = (method || "cash").toString().toLowerCase();
      if (m === "debit" || m === "kartu" || m === "card") return "card";
      if (m === "transfer" || m === "tf" || m === "bank") return "transfer";
      return m === "cash" ? "cash" : m;
    };

    let cashAmount = 0;
    let cardAmount = 0;
    let transferAmount = 0;
    let cashCount = 0;
    let cardCount = 0;
    let transferCount = 0;
    let totalRevenue = 0;

    for (const t of list) {
      const amount = Number(t.amount) || 0;
      totalRevenue += amount;
      const method = normalizeMethod(t.payment_method);
      if (method === "cash") {
        cashAmount += amount;
        cashCount += 1;
      } else if (method === "card") {
        cardAmount += amount;
        cardCount += 1;
      } else if (method === "transfer") {
        transferAmount += amount;
        transferCount += 1;
      }
    }

    return {
      cashAmount,
      cardAmount,
      transferAmount,
      totalRevenue,
      countsByMethod: {
        cash: cashCount,
        card: cardCount,
        transfer: transferCount,
      },
    };
  }, [transactions]);

  const todayCashSales = paymentSummary.cashAmount;
  const todayCardSales = paymentSummary.cardAmount;
  const todayTransferSales = paymentSummary.transferAmount;
  const todayTotalRevenue = paymentSummary.totalRevenue;
  const paymentCounts = paymentSummary.countsByMethod;
  const totalPages = Math.ceil(filteredByTab.length / entriesPerPage);
  const paginatedData = filteredByTab.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  //Transaction profit calculation
  const profitSummary: Summary = useMemo(() => {
    // const incomeTypes = new Set(["sale", "rental", "income"]);
    const totalRental = transactions
      .filter((t: any) => t.type === "rental")
      .reduce((sum: number, t: any) => {
        const itemProfits = (t.details?.items || []).reduce(
          (itemSum: number, item: any) => itemSum + (Number(item.profit) || 0),
          0
        );
        return sum + itemProfits;
      }, 0);

    const totalCafe = transactions
      .filter((t: any) => t.type === "sale")
      .reduce((sum: number, t: any) => {
        const itemProfits = (t.details?.items || []).reduce(
          (itemSum: number, item: any) => itemSum + (Number(item.profit) || 0),
          0
        );
        return sum + itemProfits;
      }, 0);

    const netProfit = totalRental + totalCafe;
    return { totalRental, totalCafe, netProfit };
  }, [transactions]);

  // Financial calculations
  const financialSummary: Summary = useMemo(() => {
    const totalIncome = entries
      .filter((entry) => entry.type === "income")
      .reduce((sum, entry) => sum + entry.amount, 0);

    const totalExpense = entries
      .filter((entry) => entry.type === "expense")
      .reduce((sum, entry) => sum + entry.amount, 0);

    const netProfit = totalIncome - totalExpense;

    return { totalIncome, totalExpense, netProfit };
  }, [entries]);

  const summary = activeView === "laba_rugi" ? profitSummary : financialSummary;

  // ===== Utilities untuk Laporan Kasir =====
  const getTransactionItems = (t: any) => {
    const d = t?.details ?? t?.metadata ?? {};
    const items = t?.items ?? d?.items ?? d?.line_items ?? [];
    const discount = d?.discount ?? 0;
    return Array.isArray(items) ? { items, discount } : { items: [], discount };
  };

  const convertTransactionToReceiptData = (transaction: any) => {
    const txItems = getTransactionItems(transaction);
    const items = txItems.items;
    const discount = txItems.discount;

    const receiptItems = items.map((item: any) => ({
      name: item.name || item.product_name || item.title || "Item",
      type:
        transaction.type === "sale"
          ? ("product" as const)
          : ("rental" as const),
      quantity: Number(item.qty || item.quantity || 1),
      total: Number(item.total || item.price || 0),
      description: item.description || "",
    }));

    if (receiptItems.length === 0) {
      receiptItems.push({
        name: transaction.description || "Transaksi",
        type:
          transaction.type === "sale"
            ? ("product" as const)
            : ("rental" as const),
        quantity: 1,
        total: Number(transaction.amount || 0),
        description: "",
      });
    }

    return {
      id: `COPY ${transaction.reference_id}` || `TXN-${transaction.id}`,
      timestamp: new Date(transaction.timestamp).toLocaleString("id-ID"),
      customer: { name: transaction.customer_name || "Customer" },
      items: receiptItems,
      subtotal: Number(transaction.amount || 0) + (discount?.amount || 0),
      tax: 0,
      discount: discount?.amount
        ? {
            type: "amount" as const,
            value: discount.amount,
            amount: discount.amount,
          }
        : undefined,
      total: Number(transaction.amount || 0),
      paymentMethod: transaction.payment_method || "cash",
      paymentAmount: transaction.details?.payment?.amount,
      change: transaction.details?.payment?.change,
      cashier: transaction.cashier_name || "Kasir",
    };
  };

  const handlePrintReceipt = (transaction: any) => {
    try {
      const receiptData = convertTransactionToReceiptData(transaction);
      printReceipt(receiptData);
    } catch (error) {
      console.error("Error printing receipt:", error);
      Swal.fire("Error", "Gagal mencetak struk. Silakan coba lagi.", "error");
    }
  };

  // Utility functions
  const getCategoryColor = (category: string) => {
    const colors = {
      rental: "bg-blue-100 text-blue-800",
      cafe: "bg-green-100 text-green-800",
      inventory: "bg-orange-100 text-orange-800",
      operational: "bg-red-100 text-red-800",
      voucher: "bg-purple-100 text-purple-800",
      other: "bg-gray-100 text-gray-800",
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  const getTypeIcon = (type: string) => {
    return type === "income" ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  // Handle form submission
  const handleAddEntry = async () => {
    // Validation
    if (!newEntry.description.trim()) {
      alert("Deskripsi transaksi harus diisi");
      return;
    }

    if (newEntry.amount <= 0) {
      alert("Jumlah transaksi harus lebih dari 0");
      return;
    }

    try {
      setSaving(true);

      const { error: insertError } = await supabase
        .from("bookkeeping_entries")
        .insert([
          {
            entry_date: newEntry.date,
            type: newEntry.type,
            category: newEntry.category,
            description: newEntry.description.trim(),
            amount: newEntry.amount,
            reference: newEntry.reference.trim() || null,
            notes: newEntry.notes.trim() || null,
          },
        ]);

      if (insertError) throw insertError;

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Transaksi berhasil ditambahkan!",
        confirmButtonColor: "#3b82f6",
      });
      setShowAddForm(false);

      // Reset form
      setNewEntry({
        type: "income",
        category: "rental",
        description: "",
        amount: 0,
        date: new Date().toISOString().split("T")[0],
        reference: "",
        notes: "",
      });

      // Refresh data
      await fetchEntries();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan";
      console.error(errorMessage);
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Handle entry edit
  const handleEditEntry = async () => {
    if (!editEntry) return;

    if (!editEntry.description.trim()) {
      alert("Deskripsi transaksi harus diisi");
      return;
    }

    if (editEntry.amount <= 0) {
      alert("Jumlah transaksi harus lebih dari 0");
      return;
    }

    try {
      setSaving(true);

      const { error: updateError } = await supabase
        .from("bookkeeping_entries")
        .update({
          entry_date: editEntry.entry_date,
          type: editEntry.type,
          category: editEntry.category,
          description: editEntry.description.trim(),
          amount: editEntry.amount,
          reference: editEntry.reference?.trim() || null,
          notes: editEntry.notes?.trim() || null,
        })
        .eq("id", editEntry.id);

      if (updateError) throw updateError;

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Transaksi berhasil diperbarui!",
        confirmButtonColor: "#3b82f6",
      });
      setShowEditForm(false);
      setEditEntry(null);

      await fetchEntries();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan";
      console.error(errorMessage);
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Handle entry deletion
  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) return;

    try {
      const { error: deleteError } = await supabase
        .from("bookkeeping_entries")
        .delete()
        .eq("id", entryId);

      if (deleteError) throw deleteError;

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Transaksi berhasil dihapus!",
        confirmButtonColor: "#3b82f6",
      });
      await fetchEntries();
    } catch (err) {
      console.error("Gagal menghapus transaksi");
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    const result = await Swal.fire({
      title: "Konfirmasi Hapus",
      text: "Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      setSaving(true);

      const { error: deleteError } = await supabase
        .from("cashier_transactions")
        .delete()
        .eq("id", transactionId);

      if (deleteError) throw deleteError;

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Transaksi berhasil dihapus!",
        confirmButtonColor: "#3b82f6",
      });

      // Refresh transaction data
      await fetchTransaction();
    } catch (err) {
      console.error("Gagal menghapus transaksi:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Gagal menghapus transaksi. Silakan coba lagi.",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setSaving(false);
    }
  };

  // ===== Edit Transaksi (Laporan Kasir) =====
  const [showEditTxModal, setShowEditTxModal] = useState(false);
  const [editTx, setEditTx] = useState<any | null>(null);
  const [editTxItems, setEditTxItems] = useState<any[]>([]);

  const openEditTransaction = (transaction: any) => {
    // Hanya izinkan edit untuk tipe sale (mempengaruhi stok)
    // if (transaction.type !== "sale") {
    //   Swal.fire(
    //     "Info",
    //     "Hanya transaksi penjualan (cafe) yang bisa diedit.",
    //     "info"
    //   );
    //   return;
    // }
    const d = transaction?.details ?? transaction?.metadata ?? {};
    const items = Array.isArray(d.items) ? d.items : [];
    // Siapkan field standar: id, productId, name, price, quantity, total
    const normalized = items.map((it: any, idx: number) => ({
      id: it.id ?? idx,
      productId: it.product_id ?? it.productId ?? it.id ?? null,
      name: it.name ?? it.product_name ?? it.title ?? it.description ?? "Item",
      price: Number(it.price ?? 0),
      quantity: Number(it.qty ?? it.quantity ?? 1),
      total: Number(
        it.total ?? Number(it.price ?? 0) * Number(it.qty ?? it.quantity ?? 1)
      ),
      type: it.type || "product",
    }));
    setEditTx(transaction);
    setEditTxItems(normalized);
    setShowEditTxModal(true);
  };

  const updateEditItemQuantity = (index: number, qty: number) => {
    setEditTxItems((prev) => {
      const next = [...prev];
      const it = { ...next[index] };
      const newQty = Math.max(0, Math.floor(Number(qty) || 0));
      it.quantity = newQty;
      it.total = Number(it.price || 0) * newQty;
      next[index] = it;
      return next;
    });
  };

  const removeEditItem = (index: number) => {
    setEditTxItems((prev) => prev.filter((_, i) => i !== index));
  };

  const saveEditedTransaction = async () => {
    if (!editTx) return;
    try {
      setSaving(true);

      // Ambil items lama untuk hitung delta stok
      const oldItemsRaw = (editTx?.details?.items ??
        editTx?.metadata?.items ??
        []) as any[];
      const oldItems = oldItemsRaw.map((it: any, idx: number) => ({
        productId: it.product_id ?? it.productId ?? it.id ?? null,
        quantity: Number(it.qty ?? it.quantity ?? 1),
        type: it.type || "product",
      }));

      // Hitung delta per productId untuk item type product (bukan rental)
      const deltaByProduct: Record<string, number> = {};
      for (const it of oldItems) {
        if (!it.productId || it.type === "rental") continue;
        const pid = String(it.productId);
        deltaByProduct[pid] =
          (deltaByProduct[pid] || 0) - Number(it.quantity || 0);
      }
      for (const it of editTxItems) {
        if (!it.productId || it.type === "rental") continue;
        const pid = String(it.productId);
        deltaByProduct[pid] =
          (deltaByProduct[pid] || 0) + Number(it.quantity || 0);
      }

      // Recalculate amount
      const newAmount = editTxItems.reduce(
        (sum, it) =>
          sum +
          (Number(it.total) ||
            Number(it.price || 0) * Number(it.quantity || 0)),
        0
      );

      // Susun details baru
      const newDetails = {
        ...(editTx.details || {}),
        items: editTxItems.map((it) => ({
          id: it.id,
          product_id: it.productId,
          name: it.name,
          price: it.price,
          qty: it.quantity,
          total: it.total,
          type: it.type,
        })),
      };

      // Update transaksi
      const { error: updErr } = await supabase
        .from("cashier_transactions")
        .update({ amount: newAmount, details: newDetails })
        .eq("id", editTx.id);
      if (updErr) throw updErr;

      // Terapkan penyesuaian stok per delta
      for (const [productId, delta] of Object.entries(deltaByProduct)) {
        if (!productId) continue;
        const d = Number(delta);
        if (d > 0) {
          // butuh stok tambahan
          await db.products.decreaseStock(productId, d);
        } else if (d < 0) {
          // kembalikan stok
          await db.products.increaseStock(productId, Math.abs(d));
        }
      }

      // Refresh
      await fetchTransaction();
      setShowEditTxModal(false);
      setEditTx(null);
      setEditTxItems([]);
      Swal.fire("Berhasil", "Transaksi berhasil diperbarui.", "success");
    } catch (e) {
      console.error(e);
      Swal.fire("Error", "Gagal memperbarui transaksi.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Memuat data pembukuan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Pembukuan</h1>
            <p className="text-gray-600">Kelola catatan keuangan bisnis</p>
          </div>

          <div className="flex gap-x-4">
            {/* Period Filter / Date range for laporan_kasir */}
            {activeView !== "laporan_kasir" ? (
              <div className="flex items-center gap-2">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {periods.map((period) => (
                    <option key={period.value} value={period.value}>
                      {period.label}
                    </option>
                  ))}
                </select>
                {selectedPeriod === "range" && (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="text-gray-500">s/d</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            ) : (
              // <div className="flex items-center gap-2">
              //   <input
              //     type="date"
              //     value={startDate}
              //     defaultValue={new Date().toISOString().split("T")[0]}
              //     onChange={(e) => setStartDate(e.target.value)}
              //     className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              //   />
              //   <span className="text-gray-500">s/d</span>
              //   <input
              //     type="date"
              //     value={endDate}
              //     onChange={(e) => setEndDate(e.target.value)}
              //     className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              //   />
              // </div>
              <div className="px-6 pb-4">
                <div className="flex flex-col">
                  <label className="text-sm text-gray-600 mb-1">
                    Pilih Sesi Kasir
                  </label>

                  <button
                    onClick={() => setShowSessionModal(true)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left bg-white hover:bg-gray-50 transition-colors"
                  >
                    {selectedSessionId
                      ? sessions.find((s) => s.id === selectedSessionId)
                        ? `${
                            sessions.find((s) => s.id === selectedSessionId)
                              ?.cashier_name || "Kasir"
                          } - ${new Date(
                            sessions.find(
                              (s) => s.id === selectedSessionId
                            )?.start_time
                          ).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })}`
                        : "Pilih Sesi Kasir"
                      : "Pilih Sesi Kasir"}
                  </button>
                </div>
                {/* {selectedSessionId && (
                  <div className="flex items-end text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Transaksi: {sourceList.length} entri</span>
                    </div>
                  </div>
                )} */}
              </div>
            )}
            {activeView === "jurnal" && (
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Tambah Transaksi
              </button>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        <div className="mt-4">
          <div className="grid grid-cols-3 bg-gray-100 rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setActiveView("jurnal")}
              className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === "jurnal"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Jurnal Umum
            </button>
            <button
              onClick={() => setActiveView("laba_rugi")}
              className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === "laba_rugi"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Laba Rugi
            </button>
            <button
              onClick={() => setActiveView("laporan_kasir")}
              className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === "laporan_kasir"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Laporan Transaksi Kasir
            </button>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {activeView === "laba_rugi"
                  ? "Laporan Laba Rugi"
                  : activeView === "laporan_kasir"
                  ? "Laporan Transaksi Kasir"
                  : "Riwayat Transaksi"}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Menampilkan {paginatedData.length} transaksi dari{" "}
                {filteredByTab.length}
              </p>
            </div>

            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "all"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Semua ({sourceList.length})
              </button>
              <button
                onClick={() =>
                  setActiveTab(
                    activeView === "jurnal"
                      ? "income"
                      : activeView === "laba_rugi"
                      ? "rental"
                      : "income"
                  )
                }
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                  activeTab === "income" || activeTab === "rental"
                    ? "bg-white text-green-600 shadow-sm"
                    : "text-gray-600 hover:text-green-600"
                }`}
              >
                {activeView === "jurnal" ? (
                  <TrendingUp className="h-4 w-4" />
                ) : activeView === "laba_rugi" ? (
                  <Gamepad className="h-4 w-4" />
                ) : (
                  <TrendingUp className="h-4 w-4" />
                )}
                {activeView === "jurnal"
                  ? "Pemasukan"
                  : activeView === "laba_rugi"
                  ? "Rental"
                  : "Pemasukan"}{" "}
                (
                {activeView === "jurnal"
                  ? incomeCount
                  : activeView === "laba_rugi"
                  ? rentalCount
                  : incomeCount}
                )
              </button>
              <button
                onClick={() =>
                  setActiveTab(
                    activeView === "jurnal"
                      ? "expense"
                      : activeView === "laba_rugi"
                      ? "sale"
                      : "expense"
                  )
                }
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                  activeTab === "expense" || activeTab === "sale"
                    ? "bg-white text-red-600 shadow-sm"
                    : "text-gray-600 hover:text-red-600"
                }`}
              >
                {activeView === "jurnal" ? (
                  <TrendingDown className="h-4 w-4" />
                ) : activeView === "laba_rugi" ? (
                  <Coffee className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {activeView === "jurnal"
                  ? "Pengeluaran"
                  : activeView === "laba_rugi"
                  ? "Cafe"
                  : "Pengeluaran"}{" "}
                (
                {activeView === "jurnal"
                  ? expenseCount
                  : activeView === "laba_rugi"
                  ? saleCount
                  : expenseCount}
                )
              </button>
              {activeView === "laba_rugi" && (
                <button
                  onClick={() => setActiveTab("voucher")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                    activeTab === "voucher"
                      ? "bg-white text-purple-600 shadow-sm"
                      : "text-gray-600 hover:text-purple-600"
                  }`}
                >
                  <Ticket className="h-4 w-4" />
                  Voucher ({voucherCount})
                </button>
              )}
              {activeView === "laporan_kasir" && activeTab === "income" && (
                <div className="flex items-center gap-2 ml-4">
                  <label className="text-sm text-gray-600">Pembayaran:</label>
                  <select
                    value={paymentMethodFilter}
                    onChange={(e) =>
                      setPaymentMethodFilter(e.target.value as any)
                    }
                    className="px-2 py-1 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="all">Semua</option>
                    <option value="cash">Tunai</option>
                    <option value="non-cash">Non Tunai</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {activeView === "laporan_kasir" && activeTab === "income" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Pembayaran Tunai
                  </h3>
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Banknote className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-gray-900">
                    Rp {todayCashSales.toLocaleString("id-ID")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {paymentCounts.cash} transaksi hari ini
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          todayTotalRevenue > 0
                            ? (todayCashSales / todayTotalRevenue) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Pembayaran Kartu
                  </h3>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-gray-900">
                    Rp {todayCardSales.toLocaleString("id-ID")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {paymentCounts.card} transaksi hari ini
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          todayTotalRevenue > 0
                            ? (todayCardSales / todayTotalRevenue) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Transfer
                  </h3>
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-gray-900">
                    Rp {todayTransferSales.toLocaleString("id-ID")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {paymentCounts.transfer} transaksi hari ini
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          todayTotalRevenue > 0
                            ? (todayTransferSales / todayTotalRevenue) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-800">
                  {activeView === "jurnal"
                    ? "Total Pemasukan"
                    : activeView === "laba_rugi"
                    ? "Total Rental"
                    : "Total Pemasukan"}
                </span>
                <span className="text-lg font-bold text-green-600">
                  Rp{" "}
                  {activeView === "jurnal"
                    ? summary.totalIncome?.toLocaleString("id-ID")
                    : activeView === "laba_rugi"
                    ? summary.totalRental?.toLocaleString("id-ID")
                    : sourceList
                        .filter(
                          (t: any) =>
                            t.type === "income" ||
                            t.type === "sale" ||
                            t.type === "rental" ||
                            t.type === "voucher"
                        )
                        .reduce(
                          (s: number, t: any) => s + (Number(t.amount) || 0),
                          0
                        )
                        .toLocaleString("id-ID")}
                </span>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-red-800">
                  {activeView === "jurnal"
                    ? "Total Pengeluaran"
                    : activeView === "laba_rugi"
                    ? "Total Cafe"
                    : "Total Pengeluaran"}
                </span>
                <span className="text-lg font-bold text-red-600">
                  Rp{" "}
                  {activeView === "jurnal"
                    ? summary.totalExpense?.toLocaleString("id-ID")
                    : activeView === "laba_rugi"
                    ? summary.totalCafe?.toLocaleString("id-ID")
                    : sourceList
                        .filter((t: any) => t.type === "expense")
                        .reduce(
                          (s: number, t: any) => s + (Number(t.amount) || 0),
                          0
                        )
                        .toLocaleString("id-ID")}
                </span>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800">
                  {activeView === "jurnal"
                    ? "Profit"
                    : activeView === "laba_rugi"
                    ? "Laba Bruto"
                    : "Saldo Net"}
                </span>
                <span
                  className={`text-lg font-bold ${
                    summary.netProfit >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  Rp{" "}
                  {(activeView === "laba_rugi"
                    ? summary.netProfit
                    : activeView === "jurnal"
                    ? summary.netProfit
                    : sourceList
                        .filter(
                          (t: any) =>
                            t.type === "income" ||
                            t.type === "sale" ||
                            t.type === "rental" ||
                            t.type === "voucher"
                        )
                        .reduce(
                          (s: number, t: any) => s + (Number(t.amount) || 0),
                          0
                        ) -
                      sourceList
                        .filter((t: any) => t.type === "expense")
                        .reduce(
                          (s: number, t: any) => s + (Number(t.amount) || 0),
                          0
                        )
                  ).toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {activeView === "laba_rugi" ? (
          <div className="divide-y divide-gray-200 max-h-screen overflow-y-auto">
            {paginatedData.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Tidak ada transaksi ditemukan</p>
              </div>
            ) : (
              paginatedData.map((t: any) => {
                const isSelected = selectedItem === String(t.id);
                return (
                  <div
                    key={t.id}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            t.type === "rental"
                              ? "bg-green-100"
                              : t.type === "sale"
                              ? "bg-red-100"
                              : "bg-purple-100"
                          }`}
                        >
                          {t.type === "rental" ? (
                            <Gamepad className="h-4 w-4 text-green-600" />
                          ) : t.type === "sale" ? (
                            <Coffee className="h-4 w-4 text-red-600" />
                          ) : (
                            <Ticket className="h-4 w-4 text-purple-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {t.description}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800  ${
                                t.type === "rental"
                                  ? "bg-green-100 text-green-800"
                                  : t.type === "sale"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-purple-100 text-purple-800"
                              }`}
                            >
                              {(t.type || "").toString().toUpperCase()}
                            </span>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              {new Date(t.timestamp).toLocaleDateString(
                                "id-ID"
                              )}
                            </div>
                            {t.reference_id && (
                              <span className="text-sm text-gray-500">
                                Ref: {t.reference_id}
                              </span>
                            )}

                            {!t?.details ||
                              (!t.details?.action && (
                                <button
                                  onClick={
                                    () =>
                                      setSelectedItem(
                                        isSelected ? null : String(t.id)
                                      ) // Toggle detail
                                  }
                                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                  title={
                                    isSelected
                                      ? "Sembunyikan detail"
                                      : "Lihat detail"
                                  }
                                >
                                  {isSelected ? "Tutup" : "Detail"}
                                </button>
                              ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          +{" "}
                          {(t.details?.items || [])
                            .reduce(
                              (sum: number, item: any) =>
                                sum + (Number(item.profit) || 0),
                              0
                            )
                            .toLocaleString("id-ID")}
                        </p>
                        <p className="text-sm text-gray-600 capitalize">
                          Profit
                        </p>
                      </div>
                    </div>
                    {isSelected && t.details?.items?.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-3">
                          Detail
                        </h4>
                        <div className="space-y-2">
                          {t.details.items.map((item: any, idx: number) => {
                            const name =
                              item.name ??
                              item.product_name ??
                              item.title ??
                              "Item";
                            const qty = Number(item.qty ?? item.quantity ?? 1);
                            const unit = Number(item.price ?? 0);
                            const total = Number(item.total ?? unit * qty) || 0;

                            return (
                              <div
                                key={idx}
                                className="flex justify-between items-center text-sm"
                              >
                                <span className="text-gray-700">
                                  {/* {name} x @{qty}{" "} */}
                                  {item.type === "rental"
                                    ? name
                                    : `${name} x @${qty}`}
                                  {t.details.discount?.amount &&
                                    t.details.discount.amount > 0 &&
                                    item.type === "rental" && (
                                      <span className="text-red-500">
                                        (Diskon{" "}
                                        {t.details.discount.amount.toLocaleString(
                                          "id-ID"
                                        )}
                                        )
                                      </span>
                                    )}
                                </span>
                                <span className="font-medium text-gray-900">
                                  Rp {item.profit.toLocaleString("id-ID")}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : activeView === "laporan_kasir" ? (
          <>
            <div className="divide-y divide-gray-200 max-h-screen overflow-y-auto">
              {paginatedData.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Tidak ada transaksi ditemukan</p>
                </div>
              ) : (
                paginatedData.map((transaction: any) => {
                  const isSelected = selectedItem === String(transaction.id);
                  return (
                    <div
                      key={transaction.id}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              transaction.type === "income"
                                ? "bg-emerald-100"
                                : transaction.type === "sale"
                                ? "bg-green-100"
                                : transaction.type === "rental"
                                ? "bg-blue-100"
                                : transaction.type === "voucher"
                                ? "bg-purple-100"
                                : "bg-red-100"
                            }`}
                          >
                            {transaction.type === "income" ? (
                              <DollarSign className="h-5 w-5 text-emerald-600" />
                            ) : transaction.type === "sale" ? (
                              <Coffee className="h-5 w-5 text-green-600" />
                            ) : transaction.type === "rental" ? (
                              <Gamepad className="h-5 w-5 text-blue-600" />
                            ) : transaction.type === "voucher" ? (
                              <Ticket className="h-5 w-5 text-purple-600" />
                            ) : (
                              <TrendingDown className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {transaction.description}
                            </h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span
                                className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                  transaction.type === "income"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : transaction.payment_method === "cash"
                                    ? "bg-green-100 text-green-800"
                                    : transaction.payment_method === "card"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-purple-100 text-purple-800"
                                }`}
                              >
                                {transaction.type === "income"
                                  ? "SALDO"
                                  : (
                                      transaction.payment_method || "cash"
                                    ).toUpperCase()}
                              </span>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Clock className="h-4 w-4" />
                                {new Date(transaction.timestamp).toLocaleString(
                                  "id-ID",
                                  {
                                    day: "numeric",
                                    month: "numeric",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: false,
                                  }
                                )}
                              </div>
                              {transaction.reference_id && (
                                <span className="text-sm text-gray-500">
                                  Ref: {transaction.reference_id}
                                </span>
                              )}

                              {!transaction?.details ||
                                (!transaction.details?.action && (
                                  <button
                                    onClick={() =>
                                      setSelectedItem((prev) =>
                                        prev === String(transaction.id)
                                          ? null
                                          : String(transaction.id)
                                      )
                                    }
                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                    title={
                                      isSelected
                                        ? "Sembunyikan detail"
                                        : "Lihat detail"
                                    }
                                  >
                                    {isSelected ? "Tutup" : "Detail"}
                                  </button>
                                ))}

                              {!(transaction.type === "expense") &&
                                transaction.reference_id &&
                                !String(transaction.reference_id)
                                  .toUpperCase()
                                  .includes("OPENING-CASH") &&
                                !String(transaction.reference_id)
                                  .toUpperCase()
                                  .includes("MOVE_RENTAL") &&
                                !String(transaction.reference_id)
                                  .toUpperCase()
                                  .includes("CANCELLED") && (
                                  <button
                                    onClick={() =>
                                      handlePrintReceipt(transaction)
                                    }
                                    className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
                                    title="Cetak struk"
                                  >
                                    <Receipt className="h-3 w-3" />
                                    Print
                                  </button>
                                )}

                              {/* Edit button */}
                              {!(
                                transaction.type === "expense" ||
                                transaction.type === "voucher" ||
                                transaction.type === "rental"
                              ) &&
                                transaction.reference_id &&
                                !String(transaction.reference_id)
                                  .toUpperCase()
                                  .includes("OPENING-CASH") && (
                                  <button
                                    onClick={() =>
                                      openEditTransaction(transaction)
                                    }
                                    className="text-amber-600 hover:text-amber-700 text-sm font-medium flex items-center gap-1"
                                    title="Edit transaksi"
                                  >
                                    <SquarePen className="h-3 w-3" />
                                    Edit
                                  </button>
                                )}

                              {/* Delete button */}
                              {transaction.type !== "expense" &&
                                transaction.reference_id &&
                                !String(transaction.reference_id)
                                  .toUpperCase()
                                  .includes("OPENING-CASH") &&
                                !String(transaction.reference_id)
                                  .toUpperCase()
                                  .includes("MOVE_RENTAL") && (
                                  <button
                                    onClick={() =>
                                      handleDeleteTransaction(transaction.id)
                                    }
                                    disabled={saving}
                                    className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Hapus transaksi"
                                  >
                                    <Trash className="h-3 w-3" />
                                    Hapus
                                  </button>
                                )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <p
                            className={`text-lg font-bold ${
                              transaction.type === "expense"
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {transaction.type === "expense" ? "-" : "+"}Rp{" "}
                            {Number(transaction.amount || 0).toLocaleString(
                              "id-ID"
                            )}
                          </p>
                          <p className="text-sm text-gray-600 capitalize">
                            {transaction.type}
                          </p>
                        </div>
                      </div>

                      {isSelected &&
                        (
                          transaction.details?.items ??
                          transaction.metadata?.items ??
                          []
                        ).length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h4 className="font-medium text-gray-900 mb-3">
                              Detail
                            </h4>
                            <div className="space-y-2">
                              {(
                                (transaction.details?.items ??
                                  transaction.metadata?.items) ||
                                []
                              ).map((it: any, idx: number) => {
                                const name =
                                  it.name ??
                                  it.product_name ??
                                  it.title ??
                                  "Item";
                                const qty = Number(it.qty ?? it.quantity ?? 1);
                                const unit = Number(it.price ?? 0);
                                const total =
                                  Number(it.total ?? unit * qty) || 0;
                                return (
                                  <div
                                    key={idx}
                                    className="flex justify-between items-center text-sm"
                                  >
                                    <span className="text-gray-700">
                                      {/* {name} x @{qty} */}
                                      {it.type === "rental"
                                        ? name
                                        : `${name} x @${qty}`}
                                    </span>
                                    <span className="font-medium text-gray-900">
                                      Rp {total.toLocaleString("id-ID")}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
              {paginatedData.map((entry) => (
                <div
                  key={entry.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          entry.type === "income"
                            ? "bg-green-100"
                            : "bg-red-100"
                        }`}
                      >
                        {getTypeIcon(entry.type)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {entry.description}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                              entry.category
                            )}`}
                          >
                            {categories.find((c) => c.value === entry.category)
                              ?.label || entry.category}
                          </span>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            {new Date(entry.entry_date).toLocaleDateString(
                              "id-ID"
                            )}
                          </div>
                          {entry.reference && (
                            <span className="text-sm text-gray-500">
                              Ref: {entry.reference}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p
                          className={`text-lg font-bold ${
                            entry.type === "income"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {entry.type === "income" ? "+" : "-"}Rp{" "}
                          {entry.amount.toLocaleString("id-ID")}
                        </p>
                        <p className="text-sm text-gray-600 capitalize">
                          {types.find((t) => t.value === entry.type)?.label ||
                            entry.type}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <button
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          onClick={() => {
                            setEditEntry(entry);
                            setShowEditForm(true);
                          }}
                          title="Edit transaksi"
                        >
                          <SquarePen className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus transaksi"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H9a1 1 0 00-1-1H6a1 1 0 00-1-1z"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {entry.notes && (
                    <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      <strong>Catatan:</strong> {entry.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Halaman {currentPage} dari {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Sebelumnya
              </button>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </div>
      )}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Tambah Transaksi
              </h2>

              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddEntry();
                }}
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipe Transaksi <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newEntry.type}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, type: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="income">Pemasukan</option>
                    <option value="expense">Pengeluaran</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newEntry.category}
                    onChange={(e) =>
                      setNewEntry({
                        ...newEntry,
                        category: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {categories
                      .filter((c) => c.value !== "all")
                      .map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deskripsi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newEntry.description}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Deskripsi transaksi"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jumlah <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={newEntry.amount}
                    onChange={(e) =>
                      setNewEntry({
                        ...newEntry,
                        amount: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                    step="1000"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={newEntry.date}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Referensi (Opsional)
                  </label>
                  <input
                    type="text"
                    value={newEntry.reference}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, reference: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nomor referensi"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catatan (Opsional)
                  </label>
                  <textarea
                    value={newEntry.notes}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, notes: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Catatan tambahan"
                  />
                </div>
              </form>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddForm(false)}
                  disabled={saving}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleAddEntry}
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pilih Sesi Kasir */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Pilih Sesi Kasir
                </h2>

                <button
                  onClick={() => setShowSessionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Filters */}
              <div className="mb-4 flex items-center gap-2">
                <select
                  value={sessionPeriod}
                  onChange={(e) => setSessionPeriod(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {periods.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                {sessionPeriod === "range" && (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={sessionStartDate}
                      onChange={(e) => setSessionStartDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="text-gray-500">s/d</span>
                    <input
                      type="date"
                      value={sessionEndDate}
                      onChange={(e) => setSessionEndDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>

              <div className="mb-4">
                {(() => {
                  const totalIncome = filteredSessions.reduce(
                    (sum: number, s: any) => sum + Number(s.total_revenue || 0),
                    0
                  );
                  const totalExpense = filteredSessions.reduce(
                    (sum: number, s: any) => sum + Number(s.total_expense || 0),
                    0
                  );

                  const cashAmount = filteredSessions.reduce(
                    (sum: number, s: any) => sum + Number(s.total_cash || 0),
                    0
                  );
                  const cardAmount = filteredSessions.reduce(
                    (sum: number, s: any) => sum + Number(s.total_card || 0),
                    0
                  );
                  const transferAmount = filteredSessions.reduce(
                    (sum: number, s: any) =>
                      sum + Number(s.total_transfer || 0),
                    0
                  );
                  // const cashCount = filteredSessions.reduce(
                  //   (sum: number, s: any) =>
                  //     sum + Number(s.cash_transactions || 0),
                  //   0
                  // );
                  // const cardCount = filteredSessions.reduce(
                  //   (sum: number, s: any) =>
                  //     sum + Number(s.card_transactions || 0),
                  //   0
                  // );
                  // const transferCount = filteredSessions.reduce(
                  //   (sum: number, s: any) =>
                  //     sum + Number(s.transfer_transactions || 0),
                  //   0
                  // );
                  const paymentTotal = cashAmount + cardAmount + transferAmount;

                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="text-sm text-green-700">
                            Total Pemasukan
                          </div>
                          <div className="mt-1 text-2xl font-bold text-green-800">
                            {`Rp ${totalIncome.toLocaleString("id-ID")}`}
                          </div>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="text-sm text-red-700">
                            Total Pengeluaran
                          </div>
                          <div className="mt-1 text-2xl font-bold text-red-800">
                            {`Rp ${totalExpense.toLocaleString("id-ID")}`}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium text-gray-700">
                              Pembayaran Tunai
                            </div>
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <Banknote className="h-4 w-4 text-green-600" />
                            </div>
                          </div>
                          <div className="text-xl font-bold text-gray-900">{`Rp ${cashAmount.toLocaleString(
                            "id-ID"
                          )}`}</div>
                          {/* <div className="text-xs text-gray-600 mt-1">
                            {cashCount} transaksi
                          </div> */}
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                            <div
                              className="bg-green-600 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${
                                  paymentTotal > 0
                                    ? (cashAmount / paymentTotal) * 100
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium text-gray-700">
                              Pembayaran Kartu
                            </div>
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <CreditCard className="h-4 w-4 text-blue-600" />
                            </div>
                          </div>
                          <div className="text-xl font-bold text-gray-900">{`Rp ${cardAmount.toLocaleString(
                            "id-ID"
                          )}`}</div>
                          {/* <div className="text-xs text-gray-600 mt-1">
                            {cardCount} transaksi
                          </div> */}
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${
                                  paymentTotal > 0
                                    ? (cardAmount / paymentTotal) * 100
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium text-gray-700">
                              Transfer
                            </div>
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <CreditCard className="h-4 w-4 text-purple-600" />
                            </div>
                          </div>
                          <div className="text-xl font-bold text-gray-900">{`Rp ${transferAmount.toLocaleString(
                            "id-ID"
                          )}`}</div>
                          {/* <div className="text-xs text-gray-600 mt-1">
                            {transferCount} transaksi
                          </div> */}
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                            <div
                              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${
                                  paymentTotal > 0
                                    ? (transferAmount / paymentTotal) * 100
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Sessions List */}
              <div className="space-y-3">
                {filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedSessionId === session.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => {
                      setSelectedSessionId(session.id);
                      setShowSessionModal(false);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Clock className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {session.cashier_name || "Kasir"}
                            </h3>
                            <p className="text-sm text-gray-500">
                              ID: {session.id}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Mulai:</span>
                            <p className="font-medium">
                              {new Date(session.start_time).toLocaleString(
                                "id-ID",
                                {
                                  day: "numeric",
                                  month: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                }
                              )}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">Status:</span>
                            <p
                              className={`font-medium ${
                                session.status === "active"
                                  ? "text-green-600"
                                  : "text-gray-600"
                              }`}
                            >
                              {session.status === "active"
                                ? "Aktif"
                                : "Selesai"}
                            </p>
                          </div>
                          {session.end_time && (
                            <div>
                              <span className="text-gray-600">Selesai:</span>
                              <p className="font-medium">
                                {new Date(session.end_time).toLocaleString(
                                  "id-ID"
                                )}
                              </p>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-600">Saldo Awal:</span>
                            <p className="font-medium">
                              Rp{" "}
                              {Number(session.opening_cash || 0).toLocaleString(
                                "id-ID"
                              )}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">
                              Total Pemasukan:
                            </span>
                            <p className="font-medium text-green-600">
                              Rp{" "}
                              {Number(
                                session.total_revenue || 0
                              ).toLocaleString("id-ID")}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">
                              Total Pengeluaran:
                            </span>
                            <p className="font-medium text-red-600">
                              Rp{" "}
                              {Number(
                                session.total_expense || 0
                              ).toLocaleString("id-ID")}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <button
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            selectedSessionId === session.id
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {selectedSessionId === session.id
                            ? "Dipilih"
                            : "Pilih"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {sessions.length === 0 && (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Tidak ada sesi kasir ditemukan
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Transaksi Kasir (Sale) */}
      {showEditTxModal && editTx && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Edit Transaksi
                </h2>
                <button
                  onClick={() => setShowEditTxModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  <div>Ref: {editTx.reference_id || "-"}</div>
                  <div>
                    Metode: {(editTx.payment_method || "cash").toUpperCase()}
                  </div>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-12 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    <div className="col-span-6">Item</div>
                    <div className="col-span-2 text-right">Harga</div>
                    <div className="col-span-2 text-right">Qty</div>
                    <div className="col-span-2 text-right">Total</div>
                  </div>
                  {editTxItems.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      Tidak ada item
                    </div>
                  ) : (
                    editTxItems.map((it, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-12 px-4 py-2 border-t text-sm items-center"
                      >
                        <div className="col-span-6">
                          <div className="font-medium text-gray-900">
                            {it.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            PID: {it.productId || "-"}
                          </div>
                        </div>
                        <div className="col-span-2 text-right">
                          Rp {Number(it.price || 0).toLocaleString("id-ID")}
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            value={it.quantity}
                            min={0}
                            onChange={(e) =>
                              updateEditItemQuantity(
                                idx,
                                Number(e.target.value)
                              )
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-right"
                          />
                        </div>
                        <div className="col-span-2 text-right flex items-center justify-end gap-2">
                          <span>
                            Rp {Number(it.total || 0).toLocaleString("id-ID")}
                          </span>
                          <button
                            onClick={() => removeEditItem(idx)}
                            className="text-red-600 hover:text-red-700"
                            title="Hapus item"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div />
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Subtotal</div>
                    <div className="text-2xl font-bold text-gray-900">
                      Rp{" "}
                      {editTxItems
                        .reduce((s, it) => s + (Number(it.total) || 0), 0)
                        .toLocaleString("id-ID")}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowEditTxModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={saveEditedTransaction}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {showEditForm && editEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Edit Transaksi
              </h2>

              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleEditEntry();
                }}
              >
                {/* Tipe Transaksi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipe Transaksi <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editEntry.type}
                    onChange={(e) =>
                      setEditEntry({
                        ...editEntry,
                        type: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="income">Pemasukan</option>
                    <option value="expense">Pengeluaran</option>
                  </select>
                </div>

                {/* Kategori */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editEntry.category}
                    onChange={(e) =>
                      setEditEntry({
                        ...editEntry,
                        category: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {categories
                      .filter((c) => c.value !== "all")
                      .map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Deskripsi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deskripsi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editEntry.description}
                    onChange={(e) =>
                      setEditEntry({
                        ...editEntry,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Deskripsi transaksi"
                    required
                  />
                </div>

                {/* Jumlah */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jumlah <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={editEntry.amount}
                    onChange={(e) =>
                      setEditEntry({
                        ...editEntry,
                        amount: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                    step="1000"
                    required
                  />
                </div>

                {/* Tanggal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={editEntry.entry_date}
                    onChange={(e) =>
                      setEditEntry({ ...editEntry, entry_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Referensi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Referensi (Opsional)
                  </label>
                  <input
                    type="text"
                    value={editEntry.reference || ""}
                    onChange={(e) =>
                      setEditEntry({ ...editEntry, reference: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nomor referensi"
                  />
                </div>

                {/* Catatan */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catatan (Opsional)
                  </label>
                  <textarea
                    value={editEntry.notes || ""}
                    onChange={(e) =>
                      setEditEntry({ ...editEntry, notes: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Catatan tambahan"
                  />
                </div>
              </form>

              {/* Tombol Aksi */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditForm(false);
                    setEditEntry(null);
                  }}
                  disabled={saving}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleEditEntry}
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Perubahan"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookkeeping;
