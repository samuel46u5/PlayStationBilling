import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { supabase } from "../lib/supabase";
import type { RFIDCard } from "../types";
import {
  Plus,
  CreditCard,
  Shield,
  Users,
  Settings,
  UserCheck,
  UserX,
  Trash2,
} from "lucide-react";

const RFIDCards: React.FC = () => {
  const [cards, setCards] = useState<RFIDCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [uidInput, setUidInput] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [onlyAdmin, setOnlyAdmin] = useState<"all" | "admin" | "customer">(
    "all"
  );

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
        *,
        customers!primary_card_id(name, phone)
      `
      )
      .order("created_at", { ascending: false });
    if (!error && Array.isArray(data)) {
      setCards(
        data as (RFIDCard & {
          customers?: { name: string; phone: string } | null;
        })[]
      );
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
  console.log(cards);

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

  const toggleAdmin = async (card: RFIDCard) => {
    try {
      await supabase
        .from("rfid_cards")
        .update({ is_admin: !card.is_admin })
        .eq("id", card.id);
      Swal.fire(
        "Berhasil",
        `Status admin kartu berhasil diubah menjadi ${
          !card.is_admin ? "Admin" : "Customer"
        }`,
        "success"
      );
      load();
    } catch (e: any) {
      Swal.fire("Gagal", e?.message || String(e), "error");
    }
  };

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
  // const [editCard, setEditCard] = useState<
  //   (RFIDCard & { customers?: { name: string; phone: string } | null }) | null
  // >(null);
  // const [editIsAdmin, setEditIsAdmin] = useState(false);
  // const [savingEdit, setSavingEdit] = useState(false);

  // const openEdit = (
  //   card: RFIDCard & { customers?: { name: string; phone: string } | null }
  // ) => {
  //   setEditCard(card);
  //   setEditIsAdmin(card.is_admin);
  // };

  // const saveEdit = async () => {
  //   if (!editCard) return;
  //   setSavingEdit(true);
  //   try {
  //     await supabase
  //       .from("rfid_cards")
  //       .update({ is_admin: editIsAdmin })
  //       .eq("id", editCard.id);
  //     setEditCard(null);
  //     Swal.fire("Berhasil", "Kartu berhasil diperbarui", "success");
  //     load();
  //   } catch (e: any) {
  //     Swal.fire("Gagal", e?.message || String(e), "error");
  //   } finally {
  //     setSavingEdit(false);
  //   }
  // };

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
            {
              cards.filter(
                (c) => Array.isArray(c.customers) && c.customers.length > 0
              ).length
            }
          </h3>
          <p className="text-gray-600 text-sm">Kartu Ter-assign</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Settings className="h-6 w-6 text-orange-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {
              cards.filter(
                (c) => Array.isArray(c.customers) && c.status === "active"
              ).length
            }
          </h3>
          <p className="text-gray-600 text-sm">Kartu Aktif</p>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Master Kartu RFID
            </h1>
            <p className="text-gray-600">
              Kelola kartu RFID untuk customer dan admin
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Tambah Kartu
          </button>
        </div>
      </div>

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
          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((card) => {
              const assigned =
                Array.isArray(card.customers) && card.customers.length > 0;
              const customer = assigned ? card.customers[0] : null;
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
                          <span className="text-sm opacity-90">
                            {card.customers
                              ? "Ter-assign ke customer"
                              : "Belum ter-assign"}
                          </span>
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
                        {assigned ? (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">
                                Nama
                              </span>
                              <span className="font-semibold text-blue-600">
                                {customer.name}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">
                                Phone
                              </span>
                              <span className="font-medium text-gray-700">
                                {customer.phone}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">
                                Status
                              </span>
                              <span className="font-medium text-green-600">
                                Sudah ter-assign ke customer
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm text-gray-500 italic">
                              Kartu belum ter-assign ke customer
                            </p>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-sm text-gray-600">
                                Status
                              </span>
                              <span className="font-medium text-red-600">
                                Belum ter-assign
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleAdmin(card)}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                              !card.is_admin
                                ? "bg-amber-500 hover:bg-amber-600 text-white"
                                : "bg-gray-500 hover:bg-gray-600 text-white"
                            }`}
                          >
                            <Shield className="h-4 w-4" />
                            {card.is_admin ? "Remove Admin" : "Make Admin"}
                          </button>
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
                          {/* <button
                            onClick={() => openEdit(card as any)}
                            className="p-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg transition-colors flex items-center justify-center"
                          >
                            <Edit className="h-4 w-4" />
                          </button> */}
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
          {/* {editCard && (
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
          )} */}
        </>
      )}
    </div>
  );
};

export default RFIDCards;
