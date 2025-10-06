import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { supabase } from "../lib/supabase";
import type { RFIDCard } from "../types";
import type { CardUsageLog } from "../types";
import {
  Plus,
  CreditCard,
  Shield,
  Users,
  Settings,
  UserCheck,
  UserX,
  Trash2,
  Edit,
  History,
  LayoutGrid,
  List as ListIcon,
} from "lucide-react";

const RFIDCards: React.FC = () => {
  const [cards, setCards] = useState<RFIDCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [editAlias, setEditAlias] = useState("");
  const [uidInput, setUidInput] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [onlyAdmin, setOnlyAdmin] = useState<"all" | "admin" | "customer">(
    "all"
  );
  // keep setter referenced to avoid unused-local TypeScript diagnostic when it's intentionally unused
  void setOnlyAdmin;
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [activeTab, setActiveTab] = useState<"management" | "laporan">(
    (localStorage.getItem("rfid_active_tab") as "management" | "laporan") || "management"
  );

  useEffect(() => {
    try {
      localStorage.setItem("rfid_active_tab", activeTab);
    } catch {}
  }, [activeTab]);

  const [laporanSample, setLaporanSample] = useState<any[]>([]);
  // keep setter referenced to avoid unused-local TypeScript diagnostic when it's intentionally unused
  void setLaporanSample;
  const [searchTerm, setSearchTerm] = useState("");
  const [purchasePeriod, setPurchasePeriod] = useState<string>("today");

  const filtered = useMemo(() => {
    if (onlyAdmin === "all") return cards;
    if (onlyAdmin === "admin") return cards.filter((c) => c.is_admin);
    return cards.filter((c) => !c.is_admin);
  }, [cards, onlyAdmin]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("rfid_cards")
      .select(
        `
        id, alias, is_admin, uid, status, created_at, balance_points
      `
      )
      .order("created_at", { ascending: false });
    if (!error && Array.isArray(data)) {
      setCards(data as RFIDCard[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("rfid_cards_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rfid_cards" },
        load
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addCard = async () => {
    if (!uidInput.trim()) return;
    try {
      await supabase.from("rfid_cards").insert({
        uid: uidInput.trim(),
        status: "active",
        is_admin: false,
      });
      setUidInput("");
    } catch (error: any) {
      if (
        error.code === "23505" &&
        error.message.includes("unique_customer_card")
      ) {
        alert(
          "Customer ini sudah memiliki kartu. Silakan unassign kartu lama terlebih dahulu."
        );
      } else {
        alert("Error: " + (error.message || "Gagal menambah kartu"));
      }
    }
  };

  // const toggleAdmin = async (card: RFIDCard) => {
  //   try {
  //     await supabase
  //       .from("rfid_cards")
  //       .update({ is_admin: !card.is_admin })
  //       .eq("id", card.id);
  //     Swal.fire(
  //       "Berhasil",
  //       `Status admin kartu berhasil diubah menjadi ${
  //         !card.is_admin ? "Admin" : "Customer"
  //       }`,
  //       "success"
  //     );
  //     load();
  //   } catch (e: any) {
  //     Swal.fire("Gagal", e?.message || String(e), "error");
  //   }
  // };

  const blockCard = async (card: RFIDCard) => {
    await supabase
      .from("rfid_cards")
      .update({ status: card.status === "active" ? "blocked" : "active" })
      .eq("id", card.id);
    Swal.fire(
      "Berhasil",
      `Kartu berhasil diubah menjadi status "${
        card.status === "active" ? "blocked" : "active".toUpperCase()
      }"`,
      "success"
    );

    load();
  };

  // Edit/Delete state & handlers
  const [editCard, setEditCard] = useState<
    (RFIDCard & { customers?: { name: string; phone: string } | null }) | null
  >(null);
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // History modal state
  const [historyCard, setHistoryCard] = useState<RFIDCard | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<CardUsageLog[]>([]);

  function groupDeductLogsBySession(logs: CardUsageLog[]) {
    const grouped: Record<
      string,
      {
        total_points: number;
        firstTimestamp: string;
        lastTimestamp: string;
        session_id: string;
        balance_before?: number;
        balance_after?: number;
        notes?: string;
      }
    > = {};

    logs.forEach((log) => {
      if (log.action_type !== "balance_deduct") return;

      const sid = log.session_id || "no-session";

      if (!grouped[sid]) {
        grouped[sid] = {
          total_points: log.points_amount,
          firstTimestamp: log.timestamp,
          lastTimestamp: log.timestamp,
          session_id: sid,
          balance_before: log.balance_before,
          balance_after: log.balance_after,
          notes: log.notes,
        };
      } else {
        grouped[sid].total_points += log.points_amount;

        // Update waktu awal dan akhir sesi
        if (new Date(log.timestamp) < new Date(grouped[sid].firstTimestamp)) {
          grouped[sid].firstTimestamp = log.timestamp;
          grouped[sid].balance_before = log.balance_before;
        }
        if (new Date(log.timestamp) > new Date(grouped[sid].lastTimestamp)) {
          grouped[sid].lastTimestamp = log.timestamp;
          grouped[sid].balance_after = log.balance_after;
        }
      }
    });

    Object.values(grouped).forEach((session) => {
      const start = new Date(session.firstTimestamp);
      const end = new Date(session.lastTimestamp);
      const diffMs = end.getTime() - start.getTime();
      const diffMinutes = Math.ceil(diffMs / 60000);
      session.notes = `Automatic deduction for rental session - ${diffMinutes} minutes`;
    });

    return Object.values(grouped);
  }

  const openHistory = async (card: RFIDCard) => {
    setHistoryCard(card);
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from("card_usage_logs")
        .select(
          "id, card_uid, session_id, action_type, points_amount, balance_before, balance_after, timestamp, notes"
        )
        .eq("card_uid", card.uid)
        .order("timestamp", { ascending: false });
      if (error) throw error;

      setHistoryLogs((data || []) as unknown as CardUsageLog[]);
      console.log(data);
    } catch (e) {
      console.error("load card history error", e);
      setHistoryLogs([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openEdit = (
    card: RFIDCard & { customers?: { name: string; phone: string } | null }
  ) => {
    setEditCard(card);
    setEditIsAdmin(card.is_admin);
    setEditAlias(card.alias || "");
  };

  const saveEdit = async () => {
    if (!editCard) return;
    setSavingEdit(true);
    try {
      await supabase
        .from("rfid_cards")
        .update({ is_admin: editIsAdmin, alias: editAlias.trim() || null })
        .eq("id", editCard.id);
      Swal.fire("Berhasil", "Kartu berhasil diperbarui", "success");
      load();
      setEditCard(null);
    } catch (e: any) {
      Swal.fire("Gagal", e?.message || String(e), "error");
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteCard = async (
    card: RFIDCard & { customers?: { name: string; phone: string } | null }
  ) => {
    if (card.customers) {
      Swal.fire(
        "Tidak bisa menghapus",
        "Kartu sedang ter-assign ke customer. Unassign terlebih dahulu.",
        "warning"
      );
      return;
    }
    const confirmRes = await Swal.fire({
      title: "Hapus kartu?",
      text: `Kartu UID ${card.uid} akan dihapus permanen`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
    });
    if (!confirmRes.isConfirmed) return;
    try {
      await supabase.from("rfid_cards").delete().eq("id", card.id);
      Swal.fire("Berhasil", "Kartu berhasil dihapus", "success");
    } catch (e: any) {
      Swal.fire("Gagal", e?.message || String(e), "error");
    }
  };

  // const unassignFromCustomer = async (card: RFIDCard) => {
  //   // Get customer ID first
  //   const customerId = card.assigned_customer_id;
  //   if (customerId) {
  //     // Remove from customer's primary_card_id
  //     await supabase
  //       .from("customers")
  //       .update({ primary_card_id: null })
  //       .eq("id", customerId);
  //   }

  //   // Remove from card's assigned_customer_id
  //   await supabase
  //     .from("rfid_cards")
  //     .update({ assigned_customer_id: null })
  //     .eq("id", card.id);
  // };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Summary Stats */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CreditCard className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {cards.length}
          </h3>
          <p className="text-gray-600 text-sm">Total Kartu RFID</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Shield className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {cards.filter((c) => c.is_admin).length}
          </h3>
          <p className="text-gray-600 text-sm">Kartu Admin</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {cards.filter((c) => !c.is_admin).length}
          </h3>
          <p className="text-gray-600 text-sm">Kartu Member</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Settings className="h-6 w-6 text-orange-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {cards.filter((c) => c.status === "active").length}
          </h3>
          <p className="text-gray-600 text-sm">Kartu Aktif</p>
        </div>
      </div>

      {/* Main Tabs (moved to top-level) */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6">
            {[              
              { id: "management", label: "Management Kartu", icon: CreditCard },
              { id: "laporan", label: "Laporan", icon: History },
            ].map((tab) => {
              const Icon = (tab as any).icon as any;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {Icon ? <Icon className="h-4 w-4" /> : null}
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {activeTab === "management" && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Master Kartu RFID
              </h1>
              <p className="text-gray-600">
              Kelola kartu RFID untuk customer dan admin
              </p>
            </div>
            )}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {activeTab !== "laporan" && (
              <>
                <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
                  <button
                    onClick={() => setViewMode("card")}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                      viewMode === "card"
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                    Card
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                      viewMode === "list"
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <ListIcon className="h-4 w-4" />
                    List
                  </button>
                </div>

                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 justify-center"
                >
                  <Plus className="h-5 w-5" />
                  Tambah Kartu
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {activeTab === "management" ? (
        <>
          {loading && (
            <div className="text-center text-gray-500">Memuat data...</div>
          )}
          {!loading && cards.length === 0 && (
            <div className="text-center text-gray-400 py-10">
              Tidak ada data kartu RFID ditemukan.
            </div>
          )}
          {!loading && cards.length > 0 && (
            <>
              {filtered.length === 0 ? (
                <div className="text-center text-gray-400 py-10">
                  Tidak ada kartu sesuai filter.
                </div>
              ) : viewMode === "card" ? (
            <div
              key={cards.map((c) => c.id).join(",")}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {/* Cards Grid */}
              {filtered.map((card) => {
                // const assigned =
                //   Array.isArray(card.customers) && card.customers.length > 0;
                // const customer = assigned ? card.customers[0] : null;
                return (
                  <div
                    key={card.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Header */}
                    <div
                      className={`p-4 text-white ${
                        !card.is_admin
                          ? "bg-gradient-to-r from-gray-600 to-gray-700"
                          : "bg-gradient-to-r from-blue-600 to-blue-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <CreditCard className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg font-mono">
                              {card.uid}
                            </h3>
                            {card.alias && (
                              <span className="text-sm opacity-90">
                                {card.alias}
                              </span>
                            )}
                            {/* <span className="text-sm opacity-90">
                              {assigned
                                ? "Ter-assign ke customer"
                                : "Belum ter-assign"}
                            </span> */}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            card.status === "active"
                              ? "bg-green-500 text-white"
                              : card.status === "blocked"
                              ? "bg-red-500 text-white"
                              : "bg-gray-400 text-white"
                          }`}
                        >
                          {card.status.toUpperCase()}
                        </span>
                        {card.is_admin && (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-yellow-500 text-white">
                            ADMIN
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-4">
                      <div className="space-y-4">
                        {/* Customer Info */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Informasi Customer
                          </h4>
                          <div className="flex flex-col gap-1 text-md text-gray-700">
                            <div className="flex justify-between">
                              <span className="font-medium">Points:</span>
                              <span className="font-mono">
                                {card.balance_points}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Status:</span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-sm font-semibold ${
                                  card.status === "active"
                                    ? "bg-green-100 text-green-700"
                                    : card.status === "blocked"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {card.status.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-4 border-t border-gray-100">
                          <div className="flex gap-2 justify-end">
                            {/* <button
                              onClick={() => toggleAdmin(card)}
                              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                                !card.is_admin
                                  ? "bg-amber-500 hover:bg-amber-600 text-white"
                                  : "bg-gray-500 hover:bg-gray-600 text-white"
                              }`}
                            >
                              <Shield className="h-4 w-4" />
                              {card.is_admin ? "Remove Admin" : "Make Admin"}
                            </button> */}
                            <button
                              onClick={() => blockCard(card)}
                              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                                card.status === "active"
                                  ? "bg-red-500 hover:bg-red-600 text-white"
                                  : "bg-green-500 hover:bg-green-600 text-white"
                              }`}
                            >
                              {card.status === "active" ? (
                                <>
                                  <UserX className="h-4 w-4" />
                                  Block
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4" />
                                  Unblock
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => openEdit(card as any)}
                              className="p-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg transition-colors flex items-center justify-center"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openHistory(card)}
                              className="p-2 border border-blue-300 hover:border-blue-400 text-blue-600 rounded-lg transition-colors flex items-center justify-center"
                            >
                              <History className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteCard(card as any)}
                              className="p-2 border border-red-300 hover:border-red-400 text-red-600 rounded-lg transition-colors flex items-center justify-center"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        UID & Alias
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipe
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Points
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filtered.map((card) => (
                      <tr key={card.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900 font-mono">
                            {card.uid}
                          </div>
                          {card.alias && (
                            <div className="text-sm text-gray-500">
                              {card.alias}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              card.is_admin
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {card.is_admin ? "Admin" : "Member"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                              card.status === "active"
                                ? "bg-green-100 text-green-700"
                                : card.status === "blocked"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {card.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm text-gray-900">
                            {typeof card.balance_points === "number"
                              ? card.balance_points.toLocaleString()
                              : card.balance_points ?? "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => blockCard(card)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                                card.status === "active"
                                  ? "bg-red-500 hover:bg-red-600 text-white"
                                  : "bg-green-500 hover:bg-green-600 text-white"
                              }`}
                            >
                              {card.status === "active" ? (
                                <>
                                  <UserX className="h-4 w-4" />
                                  Block
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4" />
                                  Unblock
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => openEdit(card as any)}
                              className="p-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg transition-colors flex items-center justify-center"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openHistory(card)}
                              className="p-2 border border-blue-300 hover:border-blue-400 text-blue-600 rounded-lg transition-colors flex items-center justify-center"
                            >
                              <History className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteCard(card as any)}
                              className="p-2 border border-red-300 hover:border-red-400 text-red-600 rounded-lg transition-colors flex items-center justify-center"
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
            </div>
          )}

          {/* Add Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Tambah Kartu RFID
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        UID Kartu
                      </label>
                      <input
                        value={uidInput}
                        onChange={(e) => setUidInput(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Masukkan UID kartu"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      onClick={async () => {
                        setUidInput(uidInput);
                        await addCard();
                        setShowAddModal(false);
                        setUidInput("");
                        Swal.fire(
                          "Berhasil",
                          "Kartu berhasil ditambahkan!",
                          "success"
                        );
                        load();
                      }}
                      disabled={!uidInput.trim()}
                      className={`flex-1 ${
                        !uidInput.trim()
                          ? "bg-blue-400"
                          : "bg-blue-600 hover:bg-blue-700"
                      } text-white px-4 py-2 rounded-lg font-medium transition-colors`}
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit Modal */}
          {editCard && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Edit Kartu
                    </h2>
                    <button
                      onClick={() => setEditCard(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        UID
                      </label>
                      <input
                        value={editCard.uid}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Alias / Nama Kartu
                      </label>
                      <input
                        value={editAlias}
                        onChange={(e) => setEditAlias(e.target.value)}
                        placeholder="Contoh: Kartu Admin Utama"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Alias memudahkan identifikasi kartu
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="edit-admin-only"
                        type="checkbox"
                        checked={editIsAdmin}
                        onChange={(e) => setEditIsAdmin(e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="edit-admin-only" className="text-sm">
                        Kartu Admin
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setEditCard(null)}
                      className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      onClick={saveEdit}
                      disabled={savingEdit}
                      className={`flex-1 ${
                        savingEdit
                          ? "bg-blue-400"
                          : "bg-blue-600 hover:bg-blue-700"
                      } text-white px-4 py-2 rounded-lg font-medium transition-colors`}
                    >
                      {savingEdit ? "Menyimpan..." : "Simpan"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* History Modal */}
          {historyCard && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Riwayat Points - UID {historyCard.uid}
                    </h2>
                    <button
                      onClick={() => {
                        setHistoryCard(null);
                        setHistoryLogs([]);
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </div>
                  {historyLoading ? (
                    <div className="text-gray-500">Memuat riwayat...</div>
                  ) : historyLogs.length === 0 ? (
                    <div className="text-gray-500">
                      Tidak ada riwayat untuk kartu ini.
                    </div>
                  ) : (
                    <div className="max-h-[60vh] overflow-auto divide-y divide-gray-100">
                      {(() => {
                        // Filter logs penambahan dan group pemakaian
                        const addLogs = historyLogs.filter(
                          (log) => log.action_type === "balance_add"
                        );
                        const deductGrouped =
                          groupDeductLogsBySession(historyLogs);

                        // Gabungkan dan urutkan semua logs
                        const combined = [
                          ...addLogs.map((log) => ({
                            type: "balance_add" as const,
                            id: log.id,
                            timestamp: log.timestamp,
                            points: log.points_amount,
                            notes: log.notes,
                            used_by_name: log.used_by_name,
                            balance_before: log.balance_before,
                            balance_after: log.balance_after,
                          })),
                          ...deductGrouped.map((g) => ({
                            type: "balance_deduct" as const,
                            session_id: g.session_id,
                            points: g.total_points,
                            timestamp: g.firstTimestamp,
                            balance_before: g.balance_before,
                            balance_after: g.balance_after,
                            notes: g.notes,
                          })),
                        ].sort(
                          (a, b) =>
                            new Date(b.timestamp).getTime() -
                            new Date(a.timestamp).getTime()
                        );

                        if (combined.length === 0) {
                          return (
                            <div className="text-gray-500">
                              Tidak ada riwayat poin.
                            </div>
                          );
                        }

                        return combined.map((item) =>
                          item.type === "balance_add" ? (
                            <div
                              key={item.id}
                              className="py-3 flex items-start gap-3"
                            >
                              <div className="mt-1 w-2 h-2 rounded-full bg-green-500"></div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-medium text-gray-900">
                                    Penambahan Poin
                                  </div>
                                  <div className="text-sm font-mono text-green-600">
                                    +{item.points.toLocaleString()} points
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(item.timestamp).toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Saldo: {item.balance_before?.toLocaleString()}{" "}
                                  → {item.balance_after?.toLocaleString()}
                                </div>
                                {item.notes && (
                                  <div className="text-xs text-gray-700 mt-1">
                                    {item.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div
                              key={item.session_id}
                              className="py-3 flex items-start gap-3"
                              title={`Sesi ID: ${item.session_id}`}
                            >
                              <div className="mt-1 w-2 h-2 rounded-full bg-red-500"></div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-medium text-gray-900">
                                    Pemakaian Poin
                                  </div>
                                  <div className="text-sm font-mono text-red-600">
                                    -{item.points.toLocaleString()} points
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(item.timestamp).toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Saldo: {item.balance_before?.toLocaleString()}{" "}
                                  → {item.balance_after?.toLocaleString()}
                                </div>
                                {item.notes && (
                                  <div className="text-xs text-gray-700 mt-1">
                                    {item.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
              )}
            </>
          )}
        </>
      ) : (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Laporan</h2>
              <p className="text-gray-600">Laporan terkait kartu RFID (sementara placeholder)</p>
            </div>
            <div>
             
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Cari PO / Supplier
                  </label>
                  <input
                    type="text"
                    placeholder="Cari PO number atau nama supplier..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Periode
                  </label>
                  <select
                    value={purchasePeriod}
                    onChange={(e) => setPurchasePeriod(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                  >
                    <option value="today">Hari Ini</option>
                    <option value="yesterday">Kemarin</option>
                    <option value="week">Minggu Ini</option>
                    <option value="month">Bulan Ini</option>
                    <option value="range">Rentang Waktu</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">Cari</button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis Laporan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deskripsi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {laporanSample.length === 0 ? (
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-500" colSpan={4}>
                        Belum ada data laporan.
                      </td>
                    </tr>
                  ) : (
                    laporanSample.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-700">{r.date}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{r.type}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{r.desc}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">-</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RFIDCards;
