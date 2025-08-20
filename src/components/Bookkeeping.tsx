import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  FileText,
  Filter,
  Search,
  Loader2,
  AlertCircle,
  SquarePen,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { BookkeepingEntry } from "../types";
import Swal from "sweetalert2";

const Bookkeeping: React.FC = () => {
  // State management
  const [entries, setEntries] = useState<BookkeepingEntry[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedPeriod, setSelectedPeriod] = useState("month");

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
  const [activeView, setActiveView] = useState<"jurnal" | "laba_rugi">(
    "jurnal"
  );
  const [activeTab, setActiveTab] = useState<"all" | "income" | "expense">(
    "all"
  );

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(20);

  // Constants
  const periods = [
    { value: "today", label: "Hari Ini" },
    { value: "week", label: "Minggu Ini" },
    { value: "month", label: "Bulan Ini" },
    { value: "year", label: "Tahun Ini" },
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

  const fetchTransaction = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("cashier_transactions")
        .select("*")
        .order("timestamp", { ascending: false });

      if (selectedPeriod !== "all") {
        const now = new Date();
        let startDate = new Date();
        switch (selectedPeriod) {
          case "today":
            startDate.setHours(0, 0, 0, 0);
            break;
          case "week":
            startDate.setDate(now.getDate() - 7);
            break;
          case "month":
            startDate.setMonth(now.getMonth() - 1);
            break;
          case "year":
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        }
        query = query.gte("timestamp", startDate.toISOString());
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
      if (selectedPeriod !== "all") {
        const now = new Date();
        let startDate = new Date();

        switch (selectedPeriod) {
          case "today":
            startDate.setHours(0, 0, 0, 0);
            break;
          case "week":
            startDate.setDate(now.getDate() - 7);
            break;
          case "month":
            startDate.setMonth(now.getMonth() - 1);
            break;
          case "year":
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        }

        query = query.gte("entry_date", startDate.toISOString().split("T")[0]);
        // const { data: transactions } = await supabase
        //   .from("cashier_transactions")
        //   .select("*")
        //   .gte("entry_date", startDate.toISOString().split("T")[0])
        //   .order("timestamp", { ascending: false });
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
    } else {
      fetchEntries();
    }
  }, [selectedPeriod, activeView]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, activeView]);

  // Pagination
  const sourceList = useMemo(
    () => (activeView === "laba_rugi" ? transactions : entries),
    [activeView, transactions, entries]
  );

  const filteredByTab = useMemo(() => {
    if (activeTab === "income")
      return sourceList.filter(
        (e) => e.type === "income" || e.type === "sale" || e.type === "rental"
      );
    if (activeTab === "expense")
      return sourceList.filter((e) => e.type === "expense");
    return sourceList;
  }, [sourceList, activeTab, activeView]);

  const incomeCount = useMemo(
    () =>
      sourceList.filter(
        (e) => e.type === "income" || e.type === "sale" || e.type === "rental"
      ).length,
    [activeView, sourceList]
  );
  const expenseCount = useMemo(
    () => sourceList.filter((e) => e.type === "expense").length,
    [activeView, sourceList]
  );

  const totalPages = Math.ceil(filteredByTab.length / entriesPerPage);
  const paginatedData = filteredByTab.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  //Transaction profit calculation
  const profitSummary = useMemo(() => {
    const incomeTypes = new Set(["sale", "rental", "income"]);
    const totalIncome = transactions
      .filter((t: any) => incomeTypes.has(t.type))
      .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);

    const totalExpense = transactions
      .filter((t: any) => t.type === "expense")
      .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);

    const profitFromDetails = transactions.reduce(
      (sum: number, t: any) => sum + (Number(t?.details?.profit) || 0),
      0
    );

    const netProfit = profitFromDetails || totalIncome - totalExpense;
    return { totalIncome, totalExpense, netProfit };
  }, [transactions]);

  // const isProfitView = activeView === "laba_rugi";

  // Financial calculations
  const financialSummary = useMemo(() => {
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
            {/* Period Filter */}
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
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {activeView === "laba_rugi"
                  ? "Laporan Laba Rugi"
                  : "Riwayat Transaksi"}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Menampilkan {paginatedData.length} transaksi dari{" "}
                {filteredByTab.length}
              </p>
            </div>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveView("jurnal")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeView !== "laba_rugi"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Jurnal Umum
              </button>
              <button
                onClick={() => setActiveView("laba_rugi")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeView === "laba_rugi"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Laba Rugi
              </button>
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
                onClick={() => setActiveTab("income")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                  activeTab === "income"
                    ? "bg-white text-green-600 shadow-sm"
                    : "text-gray-600 hover:text-green-600"
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                Pemasukan ({incomeCount})
              </button>
              <button
                onClick={() => setActiveTab("expense")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                  activeTab === "expense"
                    ? "bg-white text-red-600 shadow-sm"
                    : "text-gray-600 hover:text-red-600"
                }`}
              >
                <TrendingDown className="h-4 w-4" />
                Pengeluaran ({expenseCount})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-800">
                  Total Pemasukan:
                </span>
                <span className="text-lg font-bold text-green-600">
                  Rp {summary.totalIncome.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-red-800">
                  Total Pengeluaran:
                </span>
                <span className="text-lg font-bold text-red-600">
                  Rp {summary.totalExpense.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800">
                  {activeView === "jurnal" ? "Profit" : "Laba Bersih"}
                </span>
                <span
                  className={`text-lg font-bold ${
                    summary.netProfit >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  Rp {summary.netProfit.toLocaleString("id-ID")}
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
                const isIncome =
                  t.type === "income" ||
                  t.type === "sale" ||
                  t.type === "rental";
                return (
                  <div
                    key={t.id}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isIncome ? "bg-green-100" : "bg-red-100"
                          }`}
                        >
                          {isIncome ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {t.description}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800  ${
                                t.type === "income" ||
                                t.type === "sale" ||
                                t.type === "rental"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
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
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-lg font-bold ${
                            isIncome ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {isIncome ? "+" : "-"}Rp{" "}
                          {Number(t.amount || 0).toLocaleString("id-ID")}
                        </p>
                        {t?.details?.profit != null && (
                          <p className="text-xs text-gray-500">
                            Profit: Rp{" "}
                            {Number(t.details.profit).toLocaleString("id-ID")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
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
