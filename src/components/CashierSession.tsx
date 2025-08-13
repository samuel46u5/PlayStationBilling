import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db, supabase } from "../lib/supabase";

import {
  DollarSign,
  Clock,
  Calculator,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  User,
  Receipt,
  CreditCard,
  Banknote,
  ArrowUpCircle,
  ArrowDownCircle,
  FileText,
  Printer,
  Eye,
  EyeOff,
  Calendar,
  ShoppingCart,
} from "lucide-react";
import { CashierSession, CashierTransaction, CashFlow } from "../types";

function mapDbSession(row: any): CashierSession {
  if (!row) return null as any;
  return {
    id: row.id,
    cashierId: row.cashier_id,
    cashierName: row.cashier_name || "",
    startTime: row.start_time,
    endTime: row.end_time || undefined,
    openingCash: row.opening_cash,
    closingCash: row.closing_cash || undefined,
    expectedCash: row.expected_cash || undefined,
    variance: row.variance || undefined,
    totalSales: row.total_sales || 0,
    totalCash: row.total_cash || 0,
    totalCard: row.total_card || 0,
    totalTransfer: row.total_transfer || 0,
    totalTransactions: row.total_transactions || 0,
    status: row.status,
    notes: row.notes || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const CashierSessionComponent: React.FC = () => {
  const [currentSession, setCurrentSession] = useState<CashierSession | null>(
    null
  );
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [openingCash, setOpeningCash] = useState<number>(0);
  const [closingCash, setClosingCash] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [currentTime, setCurrentTime] = useState(new Date());

  const [todayTransactions, setTodayTransactions] = useState<any[]>([]);
  const [todaySales, setTodaySales] = useState<any[]>([]);
  const [todayRentals, setTodayRentals] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  // Get current user (in real app, this would come from auth context)
  const { user } = useAuth();

  // Check if there's an active session for current user
  useEffect(() => {
    const fetchSession = async () => {
      if (user) {
        try {
          const session = await db.cashierSessions.getCurrent(user.id);
          setCurrentSession(mapDbSession(session));
        } catch (error) {
          setCurrentSession(null);
        }
      } else {
        setCurrentSession(null);
      }
    };
    fetchSession();
  }, [user]);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    (async () => {
      if (!user || !currentSession?.id || !currentSession.startTime) {
        setTodayTransactions([]);
        setTodaySales([]);
        setTodayRentals([]);
        return;
      }

      const start = new Date(currentSession.startTime);
      const end = currentSession.endTime
        ? new Date(currentSession.endTime)
        : new Date();

      const [trxRes] = await Promise.all([
        supabase
          .from("cashier_transactions")
          .select("*")
          .eq("session_id", currentSession.id)
          .gte("timestamp", start.toISOString())
          .lt("timestamp", end.toISOString())
          .order("timestamp", { ascending: false }),
      ]);

      if (trxRes.error) throw trxRes.error;

      setTodayTransactions(trxRes.data || []);
      setTodaySales(trxRes.data.filter((t: any) => t.type === "sale"));
      setTodayRentals(trxRes.data.filter((t: any) => t.type === "rental"));
    })();
  }, [
    user,
    currentSession?.id,
    currentSession?.startTime,
    currentSession?.endTime,
  ]);

  // Calculate session duration
  const getSessionDuration = (session: CashierSession) => {
    const start = new Date(session.startTime);
    const end = session.endTime ? new Date(session.endTime) : currentTime;
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const expectedCash = useMemo(() => {
    if (!currentSession) return 0;

    const retailCashNet = (todaySales || [])
      .filter((s: any) => s.payment_method === "cash")
      .reduce((sum: number, s: any) => {
        const paid = Number(s.payment_amount ?? s.amount) || 0;
        const change = Number(s.change_amount) || 0;
        return sum + (paid - change);
      }, 0);

    const rentalCash = (todayRentals || [])
      .filter((r: any) => r.payment_method === "cash")
      .reduce((sum: number, r: any) => sum + (Number(r.total_amount) || 0), 0);

    return currentSession.openingCash + retailCashNet + rentalCash;
  }, [currentSession, todaySales, todayRentals]);

  const getTransactionItems = (t: any) => {
    const d = t?.details ?? t?.metadata ?? {};
    const items = t?.items ?? d?.items ?? d?.line_items ?? [];
    return Array.isArray(items) ? items : [];
  };

  const handleOpenSession = async () => {
    if (openingCash <= 0) {
      alert("Saldo awal harus lebih dari 0");
      return;
    }

    if (!user) return;
    //   id: `CS${Date.now()}`,
    //   cashierId: user?.id,
    //   cashierName: user?.full_name || user?.username,
    //   startTime: new Date().toISOString(),
    //   openingCash: openingCash,
    //   totalSales: 0,
    //   totalCash: 0,
    //   totalCard: 0,
    //   totalTransfer: 0,
    //   totalTransactions: 0,
    //   status: "active",
    //   notes: notes,
    //   createdAt: new Date().toISOString(),
    //   updatedAt: new Date().toISOString(),
    // };

    const nowIso = new Date().toISOString();
    const row = await db.cashierSessions.create({
      start_time: nowIso,
      opening_cash: openingCash,
      status: "active",
      notes,
      created_at: nowIso,
      updated_at: nowIso,
      cashier_name: user?.full_name,
    });

    setCurrentSession(mapDbSession(row));
    setShowOpenModal(false);
    setNotes("");

    alert(
      `Sesi kasir berhasil dibuka!\nSaldo awal: Rp ${openingCash.toLocaleString(
        "id-ID"
      )}`
    );
  };

  const handleCloseSession = async () => {
    if (!currentSession) return;

    if (closingCash <= 0) {
      alert("Jumlah setoran harus lebih dari 0");
      return;
    }

    // const expectedCash = calculateExpectedCash(currentSession);
    const variance = closingCash - expectedCash;

    await db.cashierSessions.close(currentSession.id, {
      closing_cash: closingCash,
      expected_cash: expectedCash,
      variance,
      end_time: new Date().toISOString(),
      notes,
      updated_at: new Date().toISOString(),
    });

    // alert(
    //   `Sesi kasir berhasil ditutup!\n\nRingkasan:\n- Saldo Awal: Rp ${currentSession.openingCash.toLocaleString(
    //     "id-ID"
    //   )}\n- Setoran: Rp ${closingCash.toLocaleString(
    //     "id-ID"
    //   )}\n- Expected: Rp ${expectedCash.toLocaleString(
    //     "id-ID"
    //   )}\n- Selisih: Rp ${Math.abs(variance).toLocaleString("id-ID")} ${
    //     variance >= 0 ? "(Lebih)" : "(Kurang)"
    //   }`
    // );
    alert(
      `Sesi kasir berhasil ditutup!\n\nRingkasan:\n- Saldo Awal: Rp ${
        currentSession.openingCash
      }\n- Setoran: Rp ${closingCash.toLocaleString(
        "id-ID"
      )}\n- Expected: Rp ${expectedCash.toLocaleString(
        "id-ID"
      )}\n- Selisih: Rp ${Math.abs(variance).toLocaleString("id-ID")} ${
        variance >= 0 ? "(Lebih)" : "(Kurang)"
      }`
    );

    setCurrentSession(null);
    setShowCloseModal(false);
    setClosingCash(0);
    setNotes("");
  };

  // Calculate today's totals
  const todayTotalSales = todaySales.reduce(
    (sum, sale) => sum + (Number(sale.amount) || 0),
    0
  );
  const todayTotalRentals = todayRentals.reduce(
    (sum, rental) => sum + (Number(rental.amount) || 0),
    0
  );

  const todayTotalRevenue = todayTotalSales + todayTotalRentals;

  const todayCashSales =
    (todaySales || [])
      .filter((s: any) => s.payment_method === "cash")
      .reduce((sum, s: any) => sum + (Number(s.amount) || 0), 0) +
    (todayRentals || [])
      .filter((r: any) => r.payment_method === "cash")
      .reduce((sum, r: any) => sum + (Number(r.amount) || 0), 0);

  const todayCardSales =
    (todaySales || [])
      .filter((s: any) => s.payment_method === "card")
      .reduce((sum, s: any) => sum + (Number(s.amount) || 0), 0) +
    (todayRentals || [])
      .filter((r: any) => r.payment_method === "card")
      .reduce((sum, r: any) => sum + (Number(r.amount) || 0), 0);

  const todayTransferSales =
    (todaySales || [])
      .filter((s: any) => s.payment_method === "transfer")
      .reduce((sum, s: any) => sum + (Number(s.amount) || 0), 0) +
    (todayRentals || [])
      .filter((r: any) => r.payment_method === "transfer")
      .reduce((sum, r: any) => sum + (Number(r.amount) || 0), 0);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Transaksi Harian Kasir
            </h1>
            <p className="text-gray-600">
              Data transaksi untuk kasir yang sedang bertugas hari ini
            </p>
          </div>

          {/* Session Controls */}
          <div className="flex gap-3">
            {!currentSession ? (
              <button
                onClick={() => setShowOpenModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <ArrowUpCircle className="h-5 w-5" />
                Buka Kasir
              </button>
            ) : (
              <button
                onClick={() => setShowCloseModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <ArrowDownCircle className="h-5 w-5" />
                Tutup Kasir
              </button>
            )}
          </div>
        </div>

        {/* Current Session Alert */}
        {currentSession && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-green-800">Sesi Kasir Aktif</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-green-700">
                  <strong>Kasir:</strong> {currentSession.cashierName}
                </p>
              </div>
              <div>
                <p className="text-green-700">
                  <strong>Mulai:</strong>{" "}
                  {new Date(currentSession.startTime).toLocaleString("id-ID")}
                </p>
              </div>
              <div>
                <p className="text-green-700">
                  <strong>Durasi:</strong> {getSessionDuration(currentSession)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* No Active Session */}
        {!currentSession && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <h3 className="font-semibold text-yellow-800">
                Tidak Ada Sesi Aktif
              </h3>
            </div>
            <p className="text-yellow-700 text-sm">
              Silakan buka sesi kasir terlebih dahulu untuk memulai transaksi
              hari ini.
            </p>
          </div>
        )}
      </div>

      {/* Today's Summary - Only show if session is active */}
      {currentSession && (
        <>
          {/* Revenue Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                Rp {todayTotalRevenue.toLocaleString("id-ID")}
              </h3>
              <p className="text-gray-600 text-sm">Total Revenue Hari Ini</p>
              <p className="text-xs text-gray-500 mt-1">
                Cafe: Rp {todayTotalSales.toLocaleString("id-ID")} | Rental: Rp{" "}
                {todayTotalRentals.toLocaleString("id-ID")}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Receipt className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {todayTransactions.length}
              </h3>
              <p className="text-gray-600 text-sm">Total Transaksi</p>
              <p className="text-xs text-gray-500 mt-1">
                Cafe: {todaySales.length} | Rental: {todayRentals.length}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Banknote className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                Rp {currentSession.openingCash}
              </h3>
              <p className="text-gray-600 text-sm">Saldo Awal</p>
              <p className="text-xs text-gray-500 mt-1">
                Expected: Rp{" "}
                {/* {calculateExpectedCash(currentSession).toLocaleString("id-ID")} */}
                {expectedCash.toLocaleString("id-ID")}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {getSessionDuration(currentSession)}
              </h3>
              <p className="text-gray-600 text-sm">Durasi Shift</p>
              <p className="text-xs text-gray-500 mt-1">
                Mulai:{" "}
                {new Date(currentSession.startTime).toLocaleTimeString(
                  "id-ID",
                  { hour: "2-digit", minute: "2-digit" }
                )}
              </p>
            </div>
          </div>

          {/* Payment Method Breakdown */}
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
                  {todaySales.filter((s) => s.payment_method === "cash")
                    .length +
                    todayRentals.filter((r) => r.payment_method === "cash")
                      .length}{" "}
                  transaksi hari ini
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
                  {todaySales.filter((s) => s.payment_method === "card")
                    .length +
                    todayRentals.filter((r) => r.payment_method === "card")
                      .length}{" "}
                  transaksi hari ini
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
                  {todaySales.filter((s) => s.payment_method === "transfer")
                    .length +
                    todayRentals.filter((r) => r.payment_method === "transfer")
                      .length}{" "}
                  transaksi hari ini
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

          {/* Today's Transactions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Transaksi Hari Ini
              </h2>
              <p className="text-gray-600 text-sm">
                Riwayat transaksi untuk sesi kasir aktif
              </p>
            </div>

            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {todayTransactions.length === 0 ? (
                <div className="p-8 text-center">
                  <Receipt className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Belum ada transaksi hari ini</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Transaksi akan muncul di sini setelah ada penjualan
                  </p>
                </div>
              ) : (
                todayTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            transaction.type === "sale"
                              ? "bg-green-100"
                              : "bg-blue-100"
                          }`}
                        >
                          {transaction.type === "sale" ? (
                            <ShoppingCart className="h-5 w-5 text-green-600" />
                          ) : (
                            <Receipt className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {transaction.description}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                transaction.payment_method === "cash"
                                  ? "bg-green-100 text-green-800"
                                  : transaction.payment_method === "card"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-purple-100 text-purple-800"
                              }`}
                            >
                              {transaction.payment_method.toUpperCase()}
                            </span>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Clock className="h-4 w-4" />
                              {new Date(
                                transaction.timestamp
                              ).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                            <span className="text-sm text-gray-500">
                              Ref: {transaction.reference_id}
                            </span>

                            {!transaction.details.action && (
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
                                  selectedItem === String(transaction.id)
                                    ? "Sembunyikan detail"
                                    : "Lihat detail"
                                }
                              >
                                {selectedItem === String(transaction.id)
                                  ? "Tutup"
                                  : "Detail"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          +Rp {transaction.amount.toLocaleString("id-ID")}
                        </p>
                        <p className="text-sm text-gray-600 capitalize">
                          {transaction.type}
                        </p>
                      </div>
                    </div>

                    {selectedItem === String(transaction.id) &&
                      getTransactionItems(transaction).length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="font-medium text-gray-900 mb-3">
                            Detail
                          </h4>
                          <div className="space-y-2">
                            {getTransactionItems(transaction).map(
                              (it: any, idx: number) => {
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
                                      {name} x {qty}
                                    </span>
                                    <span className="font-medium text-gray-900">
                                      Rp {total.toLocaleString("id-ID")}
                                    </span>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Open Cashier Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ArrowUpCircle className="h-5 w-5 text-green-600" />
                Buka Sesi Kasir
              </h2>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Kasir</span>
                  </div>
                  <p className="text-blue-800">{user?.full_name}</p>
                  <p className="text-sm text-blue-600">
                    {new Date().toLocaleString("id-ID")}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Saldo Awal dari Bos *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      Rp
                    </span>
                    <input
                      type="number"
                      value={openingCash}
                      onChange={(e) => setOpeningCash(Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg font-mono"
                      placeholder="500000"
                      min="0"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Masukkan jumlah uang yang diberikan bos untuk modal kasir
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catatan (Opsional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                    placeholder="Catatan untuk sesi kasir ini..."
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Penting:</strong> Pastikan jumlah saldo awal sudah
                    benar. Saldo ini akan digunakan untuk perhitungan setoran di
                    akhir shift.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowOpenModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleOpenSession}
                  disabled={openingCash <= 0}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Buka Kasir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close Cashier Modal */}
      {showCloseModal && currentSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ArrowDownCircle className="h-5 w-5 text-red-600" />
                Tutup Sesi Kasir
              </h2>

              <div className="space-y-4">
                {/* Session Summary */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">
                    Ringkasan Sesi Hari Ini
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Saldo Awal:</span>
                      <span className="font-medium">
                        Rp {currentSession.openingCash}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Penjualan:</span>
                      <span className="font-medium">
                        Rp {todayTotalRevenue.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Penjualan Tunai:</span>
                      <span className="font-medium">
                        Rp {todayCashSales.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Durasi:</span>
                      <span className="font-medium">
                        {getSessionDuration(currentSession)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-gray-300 pt-2">
                      <span className="text-gray-600">Expected Cash:</span>
                      <span className="font-bold text-blue-600">
                        Rp{" "}
                        {/* {calculateExpectedCash(currentSession).toLocaleString(
                          "id-ID"
                        )} */}
                        {expectedCash.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jumlah Setoran ke Bos *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      Rp
                    </span>
                    <input
                      type="number"
                      value={closingCash}
                      onChange={(e) => setClosingCash(Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-lg font-mono"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Masukkan jumlah uang yang akan disetor ke bos
                  </p>
                </div>

                {/* Variance Preview */}
                {closingCash > 0 && (
                  <div
                    className={`rounded-lg p-3 ${
                      closingCash === expectedCash
                        ? "bg-green-50 border border-green-200"
                        : closingCash > expectedCash
                        ? "bg-blue-50 border border-blue-200"
                        : "bg-red-50 border border-red-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Selisih:</span>
                      <span
                        className={`font-bold ${
                          closingCash === expectedCash
                            ? "text-green-600"
                            : closingCash > expectedCash
                            ? "text-blue-600"
                            : "text-red-600"
                        }`}
                      >
                        {closingCash === expectedCash
                          ? "Pas"
                          : `${
                              closingCash > expectedCash ? "+" : ""
                            }Rp ${Math.abs(
                              closingCash - expectedCash
                            ).toLocaleString("id-ID")}`}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catatan Penutupan (Opsional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={3}
                    placeholder="Catatan untuk penutupan sesi..."
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Perhatian:</strong> Setelah sesi ditutup, Anda tidak
                    dapat mengubah data ini. Pastikan jumlah setoran sudah
                    benar.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCloseModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleCloseSession}
                  disabled={closingCash <= 0}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Tutup Kasir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierSessionComponent;
