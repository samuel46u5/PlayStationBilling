import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Ticket,
  Clock,
  DollarSign,
  User,
  Eye,
  Edit,
  ShoppingCart,
  TrendingUp,
  CheckCircle,
  XCircle,
  Printer,
  QrCode,
  CreditCard,
  AlertCircle,
  Trash2,
} from "lucide-react";

import { db } from "../lib/supabase";
import Swal from "sweetalert2";

type CashierDetailItem = {
  name?: string;
  type?: string;
  total?: number;
  profit?: number;
  capital?: number;
  description?: string;
};

type CashierDetails = {
  items?: CashierDetailItem[];
  voucher?: {
    voucher_id?: string;
    voucher_code?: string;
    total_points?: number;
    voucher_price?: number;
  };
  payment?: { amount?: number; method?: string };
  customer?: { name?: string; phone?: string };
  breakdown?: { voucher_price?: number };
};

const parseDetails = (raw: unknown): CashierDetails => {
  try {
    if (!raw) return {};
    return typeof raw === "string"
      ? (JSON.parse(raw) as CashierDetails)
      : (raw as CashierDetails) ?? {};
  } catch {
    return {};
  }
};

const VoucherManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"vouchers" | "purchase-history">(
    "vouchers"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showCreateVoucherForm, setShowCreateVoucherForm] = useState(false);
  const [showSellVoucherForm, setShowSellVoucherForm] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState<string | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<string | null>(null);
  const [showEditVoucherForm, setShowEditVoucherForm] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<any>(null);

  const [voucherPurchases, setVoucherPurchases] = useState<any[]>([]);
  const [newVoucher, setNewVoucher] = useState({
    name: "",
    description: "",
    totalPoints: 5000,
    capital: 10000,
    voucherPrice: 50000,
  });

  const [sellVoucher, setSellVoucher] = useState({
    voucherId: "",
    customerId: "",
    customerName: "",
    customerPhone: "",
    notes: "",
  });

  const [vouchers, setVouchers] = useState<any[]>([]);
  const [voucherUsages, setVoucherUsages] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const v = await db.select("vouchers", "*");
        const mapped = (v || []).map((it: any) => ({
          id: it.id,
          voucherCode: it.voucher_code ?? it.voucherCode,
          name: it.name,
          description: it.description,
          totalPoints: it.total_points ?? 0,
          capital: it.capital ?? 0,
          // hourlyRate: it.hourly_rate ?? 0,
          voucherPrice: it.voucher_price ?? 0,
          status: it.status,
          customerId: it.customer_id ?? it.customerId,
          customerName: it.customer_name ?? it.customerName,
          customerPhone: it.customer_phone ?? it.customerPhone,
          createdAt: it.created_at ?? null,
          updatedAt: it.updated_at ?? null,
        }));
        setVouchers(mapped);

        // voucher_usages tidak digunakan pada skema baru
        setVoucherUsages([]);

        const cs = await db.customers.getAll();
        setCustomers(cs || []);
      } catch {
        setVouchers([]);
        setVoucherUsages([]);
        setCustomers([]);
      }
    };
    fetchAll();
    // expose refresh
    (window as any).refreshVouchers = fetchAll;
    const fetchPurchases = async () => {
      try {
        const trx = await db.select("cashier_transactions", "*", {
          type: "voucher",
        });
        setVoucherPurchases(trx || []);
      } catch {
        setVoucherPurchases([]);
      }
    };
    fetchPurchases();
    (window as any).refreshVoucherPurchases = fetchPurchases;
  }, []);

  // Filter vouchers
  const filteredVouchers = vouchers.filter((voucher) => {
    const matchesSearch =
      voucher.voucherCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voucher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voucher.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voucher.customerPhone?.includes(searchTerm);
    const matchesStatus =
      selectedStatus === "all" || voucher.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // Filter for active vouchers
  const activeVouchers = filteredVouchers.filter((v) => v.status === "active");

  // Filter for expired/used vouchers
  // const expiredVouchers = filteredVouchers.filter(
  //   (v) => v.status === "expired" || v.status === "used-up"
  // );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      // case "expired":
      //   return "bg-red-100 text-red-800";
      case "used-up":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4" />;
      // case "expired":
      //   return <XCircle className="h-4 w-4" />;
      case "used-up":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // const calculateVoucherPrice = () => {
  //   if (!newVoucher.originalPrice || !newVoucher.discountPercentage)
  //     return { discounted: 0, savings: 0 };

  //   const discountAmount =
  //     (newVoucher.originalPrice * newVoucher.discountPercentage) / 100;
  //   const discountedPrice = newVoucher.originalPrice - discountAmount;

  //   return {
  //     discounted: discountedPrice,
  //     savings: discountAmount,
  //   };
  // };

  const generateVoucherCode = () => {
    const lastVoucher = vouchers[vouchers.length - 1];
    const lastNumber = parseInt(lastVoucher.voucherCode.replace("VCH", ""));
    return `VCH${(lastNumber + 1).toString().padStart(3, "0")}`;
  };

  // const handleCreateVoucher = () => {
  //   if (
  //     !newVoucher.name ||
  //     !newVoucher.totalHours ||
  //     !newVoucher.originalPrice
  //   ) {
  //     alert("Nama, total jam, dan harga original wajib diisi");
  //     return;
  //   }

  //   const voucherCode = generateVoucherCode();
  //   alert(`Voucher ${voucherCode} berhasil dibuat!`);
  //   setShowCreateVoucherForm(false);
  //   setNewVoucher({
  //     name: "",
  //     description: "",
  //     totalHours: 5,
  //     originalPrice: 50000,
  //     discountPercentage: 10,
  //     validityDays: 30,
  //   });
  // };

  const handleCreateVoucher = async () => {
    if (
      !newVoucher.name ||
      !newVoucher.totalPoints ||
      !newVoucher.voucherPrice
    ) {
      alert("Nama, total points, dan harga original wajib diisi");
      return;
    }

    try {
      // const totalMinutes = Math.max(
      //   Math.floor(Number(newVoucher.totalHours) * 60),
      //   1
      // );
      // const hourlyRate = Number(Number(newVoucher.hourlyRate).toFixed(2));
      // const voucherPrice = Number(
      //   (hourlyRate * Number(newVoucher.totalHours)).toFixed(2)
      // );

      const created = await db.vouchers.create({
        name: newVoucher.name,
        description: newVoucher.description,
        total_points: newVoucher.totalPoints,
        capital: Number(Number(newVoucher.capital)),
        // hourly_rate: hourlyRate,
        voucher_price: newVoucher.voucherPrice,
        status: "active",
      });
      alert(
        `Voucher ${
          created.voucher_code || created.voucherCode || ""
        } berhasil dibuat!`
      );
      (window as any).refreshVouchers?.();
    } catch (e: any) {
      alert(e?.message || "Gagal membuat voucher");
    }

    setShowCreateVoucherForm(false);
    setNewVoucher({
      name: "",
      description: "",
      totalPoints: 5000,
      voucherPrice: 50000,
      // validityDays: 30,
      capital: 10000,
    });
  };

  // const handleSellVoucher = () => {
  //   if (
  //     !sellVoucher.voucherId ||
  //     (!sellVoucher.customerId && !sellVoucher.customerName)
  //   ) {
  //     alert("Voucher dan customer wajib dipilih");
  //     return;
  //   }

  //   const voucher = mockVouchers.find((v) => v.id === sellVoucher.voucherId);
  //   alert(`Voucher ${voucher?.voucherCode} berhasil dijual!`);
  //   setShowSellVoucherForm(false);
  //   setSellVoucher({
  //     voucherId: "",
  //     customerId: "",
  //     customerName: "",
  //     customerPhone: "",
  //     notes: "",
  //   });
  // };

  const handleSellVoucher = async () => {
    if (
      !sellVoucher.voucherId ||
      (!sellVoucher.customerId && !sellVoucher.customerName)
    ) {
      alert("Voucher dan customer wajib dipilih");
      return;
    }

    try {
      const payload: any = {
        sold_date: new Date().toISOString(),
      };
      if (sellVoucher.customerId) {
        payload.customer_id = sellVoucher.customerId;
      } else {
        payload.customer_name = sellVoucher.customerName;
        payload.customer_phone = sellVoucher.customerPhone;
      }
      await db.update("vouchers", sellVoucher.voucherId, payload);
      alert("Voucher berhasil dijual!");
      (window as any).refreshVouchers?.();
    } catch (e: any) {
      alert(e?.message || "Gagal menjual voucher");
    }

    setShowSellVoucherForm(false);
    setSellVoucher({
      voucherId: "",
      customerId: "",
      customerName: "",
      customerPhone: "",
      notes: "",
    });
  };

  // const handleUseVoucher = (voucherId: string, hoursToUse: number) => {
  //   const voucher = mockVouchers.find((v) => v.id === voucherId);
  //   if (!voucher) return;

  //   if (hoursToUse > voucher.remainingHours) {
  //     alert("Jam yang digunakan melebihi sisa jam voucher");
  //     return;
  //   }

  //   alert(
  //     `Voucher ${
  //       voucher.voucherCode
  //     } berhasil digunakan untuk ${hoursToUse} jam. Sisa: ${
  //       voucher.remainingHours - hoursToUse
  //     } jam`
  //   );
  // };

  const handleUseVoucher = async (voucherId: string, hoursToUse: number) => {
    const voucher = vouchers.find((v) => v.id === voucherId);
    if (!voucher) return;

    if (hoursToUse > voucher.remainingHours) {
      alert("Jam yang digunakan melebihi sisa jam voucher");
      return;
    }

    try {
      const ok = await db.vouchers.use(voucherId, hoursToUse);
      if (ok) {
        alert(
          `Voucher ${voucher.voucherCode} berhasil digunakan untuk ${hoursToUse} jam.`
        );
        (window as any).refreshVouchers?.();
      } else {
        alert("Gagal menggunakan voucher");
      }
    } catch (e: any) {
      alert(e?.message || "Gagal menggunakan voucher");
    }
  };

  const renderPrintableVoucher = (voucher: any) => (
    <div className="w-[5.5cm] h-[9cm] bg-white border-2 border-dashed border-gray-400 p-3 text-xs font-mono relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="grid grid-cols-8 gap-1 h-full">
          {Array.from({ length: 64 }).map((_, i) => (
            <div key={i} className="bg-blue-500 rounded-full"></div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="text-center border-b border-gray-300 pb-2 mb-2">
          <div className="text-lg font-bold">GAMING VOUCHER</div>
          <div className="text-xs">PlayStation & Billiard Center</div>
        </div>

        {/* Voucher Code */}
        <div className="text-center mb-3">
          <div className="text-2xl font-bold tracking-wider">
            {voucher.voucherCode}
          </div>
          <div className="text-xs text-gray-600">Kode Voucher</div>
        </div>

        {/* QR Code Placeholder */}
        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 border-2 border-gray-400 flex items-center justify-center">
            <QrCode className="h-12 w-12 text-gray-400" />
          </div>
        </div>

        {/* Voucher Details */}
        <div className="space-y-1 mb-3">
          <div className="flex justify-between">
            <span>Nama:</span>
            <span className="font-bold">{voucher.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Points:</span>
            <span className="font-bold">{voucher.totalPoints} Points</span>
          </div>
          <div className="flex justify-between">
            <span>Harga:</span>
            <span className="font-bold">
              Rp {voucher.voucherPrice.toLocaleString("id-ID")}
            </span>
          </div>
          {/* <div className="flex justify-between">
            <span>Hemat:</span>
            <span className="font-bold text-green-600">
              Rp {voucher.discountAmount.toLocaleString("id-ID")}
            </span>
          </div> */}
          <div className="flex justify-between">
            <span>Berlaku:</span>
            <span className="font-bold">{voucher.validityDays} Hari</span>
          </div>
        </div>

        {/* Customer Info */}
        {voucher.customerName && (
          <div className="border-t border-gray-300 pt-2 mb-3">
            <div className="text-xs text-gray-600 mb-1">Customer:</div>
            <div className="font-bold">{voucher.customerName}</div>
            {voucher.customerPhone && (
              <div className="text-xs">{voucher.customerPhone}</div>
            )}
          </div>
        )}

        {/* Dates */}
        <div className="border-t border-gray-300 pt-2 space-y-1">
          <div className="flex justify-between text-xs">
            <span>Dibuat:</span>
            <span>
              {new Date(voucher.createdDate).toLocaleDateString("id-ID")}
            </span>
          </div>
          {/* <div className="flex justify-between text-xs">
            <span>Expired:</span>
            <span>
              {new Date(voucher.expiryDate).toLocaleDateString("id-ID")}
            </span>
          </div> */}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 mt-3 border-t border-gray-300 pt-2">
          <div>Voucher ini dapat digunakan berulang</div>
          <div>sampai jam habis atau expired</div>
          <div className="mt-1 font-bold">Terima Kasih!</div>
        </div>
      </div>
    </div>
  );

  // Tab Riwayat Pembelian
  const renderPurchaseHistoryTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Riwayat Pembelian Voucher
        </h2>
        <p className="text-gray-600">
          Daftar transaksi penjualan voucher ke customer
        </p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kode Voucher
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Voucher
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Bayar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Metode
                </th>
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin
                </th> */}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {voucherPurchases.map((trx) => {
                const d = parseDetails(trx.details);
                const items = d.items ?? [];
                const firstItem = items[0] ?? {};
                return (
                  <tr key={trx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {trx.timestamp
                        ? new Date(trx.timestamp).toLocaleString("id-ID")
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {d.customer?.name ?? "-"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {d.customer?.phone ?? ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {d.voucher?.voucher_code ??
                        (firstItem.description?.includes(":")
                          ? firstItem.description.split(":")[1]?.trim()
                          : "-")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {firstItem.name ?? "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      Rp {Number(trx.amount ?? 0).toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(
                        trx.payment_method ??
                        d.payment?.method ??
                        "-"
                      ).toUpperCase()}
                    </td>
                    {/* <td className="px-6 py-4 whitespace-nowrap">
                      {trx.cashier_id ?? "-"}
                    </td> */}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderVouchersTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Voucher Aktif</h2>
          <p className="text-gray-600">Kelola voucher yang masih berlaku</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowSellVoucherForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <ShoppingCart className="h-5 w-5" />
            Jual Voucher
          </button>
          <button
            onClick={() => setShowCreateVoucherForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Buat Voucher
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Cari kode voucher, nama, atau customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Semua Status</option>
          <option value="active">Aktif</option>
          {/* <option value="expired">Expired</option> */}
          <option value="used-up">Habis Terpakai</option>
        </select>
      </div>

      {/* Vouchers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeVouchers.map((voucher) => {
          // const totalHours = (voucher.totalMinutes ?? 0) / 60;
          // const totalCapital = Number(voucher.capital * totalHours || 0);
          // const capitalPerHour = Number(voucher.capital);
          // const totalPrice = Number(voucher.voucherPrice || 0);
          const bonusPct = voucher.voucherPrice
            ? ((voucher.totalPoints - voucher.voucherPrice) /
                voucher.voucherPrice) *
              100
            : 0;

          return (
            <div
              key={voucher.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <Ticket className="h-6 w-6" />
                    </div>
                    <div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {voucher.voucherCode}
                        </h3>
                        <span className="text-sm opacity-90">
                          {voucher.name}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      voucher.status
                    )}`}
                  >
                    {getStatusIcon(voucher.status)}
                    {voucher.status.toUpperCase()}
                  </span>
                  <h2 className="font-bold text-lg">
                    Rp {voucher.voucherPrice.toLocaleString("ID", "id")}
                  </h2>
                  {/* {isExpiringSoon && voucher.status === "active" && (
                    <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Segera Expired
                    </span>
                  )} */}
                </div>
              </div>

              {/* Body */}
              <div className="p-4">
                <div className="space-y-4">
                  {/* Customer Info */}
                  {voucher.customerName && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">
                          Customer
                        </span>
                      </div>
                      <p className="font-medium text-gray-900">
                        {voucher.customerName}
                      </p>
                      {voucher.customerPhone && (
                        <p className="text-sm text-gray-600">
                          {voucher.customerPhone}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Ringkasan points */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Total Points:</span>
                      <span className="font-medium">
                        {voucher.totalPoints} points
                      </span>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium text-purple-600">
                          Harga Voucher
                        </span>
                        <span className="font-bold text-purple-600">
                          Rp {voucher.voucherPrice.toLocaleString("id-ID")}
                        </span>
                      </div>
                      {/* <div className="flex justify-between">
                        <span className="text-gray-600">Modal Voucher</span>
                        <span className="font-medium">
                          Rp {voucher.capital.toLocaleString("id-ID")}
                        </span>
                      </div> */}

                      <div className="flex justify-between border-b border-gray-200 pb-1">
                        <span className="font-medium text-purple-600">
                          Total Points
                        </span>
                        <span className="font-bold text-purple-600">
                          {Number(voucher.totalPoints)} points
                        </span>
                      </div>
                      {/* <div className="flex justify-between">
                        <span className="text-gray-600">Harga Voucher</span>
                        <span className="font-bold text-green-600">
                          Rp {voucher.voucherPrice.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Modal</span>
                        <span className="font-medium">
                          Rp {voucher.capital.toLocaleString("id-ID")}
                        </span>
                      </div> */}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bonus (%)</span>
                        <span className="font-bold">
                          {bonusPct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tanggal Dibuat/Diupdate */}
                  {(voucher.createdAt || voucher.updatedAt) && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {voucher.createdAt && (
                        <div>
                          <span className="text-gray-600">Dibuat</span>
                          <p className="font-medium">
                            {new Date(voucher.createdAt).toLocaleDateString(
                              "id-ID"
                            )}
                          </p>
                        </div>
                      )}
                      {voucher.updatedAt && (
                        <div>
                          <span className="text-gray-600">Diupdate</span>
                          <p className="font-medium">
                            {new Date(voucher.updatedAt).toLocaleDateString(
                              "id-ID"
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <button
                      onClick={() =>
                        setSelectedVoucher(
                          selectedVoucher === voucher.id ? null : voucher.id
                        )
                      }
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Detail
                    </button>
                    <button
                      onClick={() => setShowPrintModal(voucher.id)}
                      className="p-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg transition-colors"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEditForm(voucher)}
                      className="p-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg transition-colors"
                      title="Edit Voucher"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteVoucher(voucher.id)}
                      className="p-2 border border-red-300 hover:border-red-400 text-red-600 hover:text-red-700 rounded-lg transition-colors"
                      title="Hapus Voucher"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Extended Details */}
                  {selectedVoucher === voucher.id && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Detail Voucher
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Kode Voucher:</span>
                          <span className="font-medium">
                            {voucher.voucherCode}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Deskripsi:</span>
                          <span className="font-medium">
                            {voucher.description}
                          </span>
                        </div>
                        {/* <div className="flex justify-between">
                          <span className="text-gray-600">Diskon:</span>
                          <span className="font-medium">
                            {voucher.discountPercentage}%
                          </span>
                        </div> */}
                        {/* Skema baru tidak memiliki masa berlaku */}
                        {/* {voucher.soldDate && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tanggal Jual:</span>
                            <span className="font-medium">
                              {new Date(voucher.soldDate).toLocaleDateString(
                                "id-ID"
                              )}
                            </span>
                          </div>
                        )} */}
                        {voucher.soldBy && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Dijual oleh:</span>
                            <span className="font-medium">
                              {voucher.soldBy}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4">
                        <button
                          onClick={() => setShowPrintModal(voucher.id)}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <Printer className="h-4 w-4" />
                          Cetak Ulang Voucher
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // const renderUsageHistoryTab = () => (
  //   <div className="space-y-6">
  //     <div>
  //       <h2 className="text-2xl font-bold text-gray-900">Riwayat Penggunaan</h2>
  //       <p className="text-gray-600">
  //         History penggunaan voucher oleh customer
  //       </p>
  //     </div>

  //     <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
  //       <div className="overflow-x-auto">
  //         <table className="w-full">
  //           <thead className="bg-gray-50">
  //             <tr>
  //               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  //                 Kode Voucher
  //               </th>
  //               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  //                 Customer
  //               </th>
  //               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  //                 Jam Digunakan
  //               </th>
  //               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  //                 Sisa Setelah
  //               </th>
  //               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  //                 Tanggal
  //               </th>
  //               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  //                 Diproses oleh
  //               </th>
  //             </tr>
  //           </thead>
  //           <tbody className="bg-white divide-y divide-gray-200">
  //             {voucherUsages.map((usage) => {
  //               const voucher = vouchers.find((v) => v.id === usage.voucherId);

  //               return (
  //                 <tr key={usage.id} className="hover:bg-gray-50">
  //                   <td className="px-6 py-4 whitespace-nowrap">
  //                     <div className="flex items-center">
  //                       <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
  //                         <Ticket className="h-4 w-4 text-purple-600" />
  //                       </div>
  //                       <div>
  //                         <div className="text-sm font-medium text-gray-900">
  //                           {usage.voucherCode}
  //                         </div>
  //                         <div className="text-sm text-gray-500">
  //                           {voucher?.name}
  //                         </div>
  //                       </div>
  //                     </div>
  //                   </td>
  //                   <td className="px-6 py-4 whitespace-nowrap">
  //                     <div>
  //                       <div className="text-sm font-medium text-gray-900">
  //                         {voucher?.customerName || "-"}
  //                       </div>
  //                       <div className="text-sm text-gray-500">
  //                         {voucher?.customerPhone || "-"}
  //                       </div>
  //                     </div>
  //                   </td>
  //                   <td className="px-6 py-4 whitespace-nowrap">
  //                     <div className="text-sm font-medium text-gray-900">
  //                       {usage.hoursUsed} jam
  //                     </div>
  //                   </td>
  //                   <td className="px-6 py-4 whitespace-nowrap">
  //                     <div className="text-sm font-medium text-gray-900">
  //                       {usage.remainingHoursAfter} jam
  //                     </div>
  //                   </td>
  //                   <td className="px-6 py-4 whitespace-nowrap">
  //                     <div className="text-sm text-gray-900">
  //                       {new Date(usage.usageDate).toLocaleDateString("id-ID")}
  //                     </div>
  //                   </td>
  //                   <td className="px-6 py-4 whitespace-nowrap">
  //                     <div className="text-sm text-gray-900">
  //                       {usage.usedBy || "-"}
  //                     </div>
  //                   </td>
  //                 </tr>
  //               );
  //             })}
  //           </tbody>
  //         </table>
  //       </div>
  //     </div>
  //   </div>
  // );

  // const renderExpiredTab = () => (
  //   <div className="space-y-6">
  //     <div>
  //       <h2 className="text-2xl font-bold text-gray-900">
  //         Voucher Expired/Habis
  //       </h2>
  //       <p className="text-gray-600">
  //         Riwayat voucher yang sudah tidak berlaku
  //       </p>
  //     </div>

  //     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  //       {expiredVouchers.map((voucher) => (
  //         <div
  //           key={voucher.id}
  //           className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden opacity-75"
  //         >
  //           {/* Header */}
  //           <div className="bg-gradient-to-r from-gray-500 to-gray-600 p-4 text-white">
  //             <div className="flex items-center justify-between mb-2">
  //               <div className="flex items-center gap-3">
  //                 <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
  //                   <Ticket className="h-6 w-6" />
  //                 </div>
  //                 <div>
  //                   <h3 className="font-semibold text-lg">
  //                     {voucher.voucherCode}
  //                   </h3>
  //                   <span className="text-sm opacity-90">{voucher.name}</span>
  //                 </div>
  //               </div>
  //             </div>

  //             <div className="flex items-center justify-between">
  //               <span
  //                 className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
  //                   voucher.status
  //                 )}`}
  //               >
  //                 {getStatusIcon(voucher.status)}
  //                 {voucher.status.toUpperCase()}
  //               </span>
  //             </div>
  //           </div>

  //           {/* Body */}
  //           <div className="p-4">
  //             <div className="space-y-3">
  //               {/* Customer Info */}
  //               {voucher.customerName && (
  //                 <div className="bg-gray-50 rounded-lg p-3">
  //                   <div className="flex items-center gap-2 mb-1">
  //                     <User className="h-4 w-4 text-gray-600" />
  //                     <span className="text-sm font-medium text-gray-700">
  //                       Customer
  //                     </span>
  //                   </div>
  //                   <p className="font-medium text-gray-900">
  //                     {voucher.customerName}
  //                   </p>
  //                   {voucher.customerPhone && (
  //                     <p className="text-sm text-gray-600">
  //                       {voucher.customerPhone}
  //                     </p>
  //                   )}
  //                 </div>
  //               )}

  //               {/* Final Stats */}
  //               <div className="grid grid-cols-2 gap-4 text-sm">
  //                 <div>
  //                   <span className="text-gray-600">Total Jam</span>
  //                   <p className="font-medium">{voucher.totalHours} jam</p>
  //                 </div>
  //                 <div>
  //                   <span className="text-gray-600">Jam Terpakai</span>
  //                   <p className="font-medium">{voucher.usedHours} jam</p>
  //                 </div>
  //                 <div>
  //                   <span className="text-gray-600">Harga Voucher</span>
  //                   <p className="font-medium">
  //                     Rp {voucher.voucherPrice.toLocaleString("id-ID")}
  //                   </p>
  //                 </div>
  //                 <div>
  //                   <span className="text-gray-600">Status</span>
  //                   <p className="font-medium">
  //                     {voucher.status === "expired"
  //                       ? "Expired"
  //                       : "Habis Terpakai"}
  //                   </p>
  //                 </div>
  //               </div>

  //               {/* Dates */}
  //               <div className="border-t border-gray-200 pt-3 grid grid-cols-2 gap-4 text-sm">
  //                 <div>
  //                   <span className="text-gray-600">Dibuat</span>
  //                   <p className="font-medium">
  //                     {new Date(voucher.createdDate).toLocaleDateString(
  //                       "id-ID"
  //                     )}
  //                   </p>
  //                 </div>
  //                 <div>
  //                   <span className="text-gray-600">Expired</span>
  //                   <p className="font-medium">
  //                     {new Date(voucher.expiryDate).toLocaleDateString("id-ID")}
  //                   </p>
  //                 </div>
  //               </div>
  //             </div>
  //           </div>
  //         </div>
  //       ))}
  //     </div>
  //   </div>
  // );

  const openEditForm = (voucher: any) => {
    setEditingVoucher({
      id: voucher.id,
      voucherCode: voucher.voucherCode,
      name: voucher.name,
      description: voucher.description,
      totalPoints: voucher.totalPoints,
      voucherPrice: voucher.voucherPrice,
      capital: voucher.capital,
    });
    setShowEditVoucherForm(true);
  };

  const handleEditVoucher = async () => {
    if (
      !editingVoucher ||
      !editingVoucher.name ||
      !editingVoucher.capital ||
      !editingVoucher.voucherPrice
    ) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Nama, modal voucher, dan harga voucher wajib diisi",
      });
      return;
    }

    try {
      // const totalMinutes = Math.max(
      //   Math.floor(Number(editingVoucher.totalHours) * 60),
      //   1
      // );
      // const hourlyRate = Number(Number(editingVoucher.hourlyRate).toFixed(2));
      // const voucherPrice = Number(
      //   (hourlyRate * Number(editingVoucher.totalHours)).toFixed(2)
      // );

      await db.update("vouchers", editingVoucher.id, {
        name: editingVoucher.name,
        description: editingVoucher.description,
        total_points: editingVoucher.totalPoints,
        capital: Number(Number(editingVoucher.capital)),
        // hourly_rate: hourlyRate,
        voucher_price: editingVoucher.voucherPrice,
      });

      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: `Voucher ${editingVoucher.voucherCode} berhasil diperbarui!`,
      });

      setShowEditVoucherForm(false);
      setEditingVoucher(null);
      (window as any).refreshVouchers?.();
    } catch (e: any) {
      await Swal.fire({
        icon: "error",
        title: "Gagal",
        text: e?.message || "Gagal memperbarui voucher",
      });
    }
  };

  const handleDeleteVoucher = async (voucherId: string) => {
    const voucher = vouchers.find((v) => v.id === voucherId);
    if (!voucher) return;

    const result = await Swal.fire({
      title: `Hapus Voucher ${voucher.voucherCode}?`,
      text: "Tindakan ini tidak bisa dibatalkan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      await db.delete("vouchers", voucherId);

      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: `Voucher ${voucher.voucherCode} berhasil dihapus!`,
      });

      (window as any).refreshVouchers?.();
    } catch (e: any) {
      await Swal.fire({
        icon: "error",
        title: "Gagal",
        text: e?.message || "Gagal menghapus voucher",
      });
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Manajemen Voucher
        </h1>
        <p className="text-gray-600">Kelola voucher dengan sistem kode unik</p>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "vouchers", label: "Voucher Aktif", icon: Ticket },
              // { id: "usage-history", label: "Riwayat Penggunaan", icon: Clock },
              // { id: "expired", label: "Expired/Habis", icon: XCircle },
              {
                id: "purchase-history",
                label: "Riwayat Pembelian Voucher",
                icon: ShoppingCart,
              },
            ].map((tab) => {
              const Icon = tab.icon;
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
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "vouchers" && renderVouchersTab()}
      {/* {activeTab === "usage-history" && renderUsageHistoryTab()} */}
      {/* {activeTab === "expired" && renderExpiredTab()} */}
      {activeTab === "purchase-history" && renderPurchaseHistoryTab()}

      {/* Create Voucher Modal */}
      {showCreateVoucherForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Buat Voucher Baru
              </h2>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Voucher *
                  </label>
                  <input
                    type="text"
                    value={newVoucher.name}
                    onChange={(e) =>
                      setNewVoucher({ ...newVoucher, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Voucher Gaming 5 Jam"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deskripsi
                  </label>
                  <textarea
                    value={newVoucher.description}
                    onChange={(e) =>
                      setNewVoucher({
                        ...newVoucher,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="Deskripsi voucher"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Points *
                    </label>
                    <input
                      type="number"
                      value={newVoucher.totalPoints}
                      onChange={(e) =>
                        setNewVoucher({
                          ...newVoucher,
                          totalPoints: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Harga Voucher *
                    </label>
                    <input
                      type="number"
                      value={newVoucher.voucherPrice}
                      onChange={(e) =>
                        setNewVoucher({
                          ...newVoucher,
                          voucherPrice: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Modal Voucher
                    </label>
                    <input
                      type="number"
                      value={newVoucher.capital}
                      onChange={(e) =>
                        setNewVoucher({
                          ...newVoucher,
                          capital: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                  </div>

                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Berlaku (hari)
                    </label>
                    <input
                      type="number"
                      value={newVoucher.validityDays}
                      onChange={(e) =>
                        setNewVoucher({
                          ...newVoucher,
                          validityDays: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      max="365"
                    />
                  </div> */}
                </div>

                {/* Price Preview */}
                {/* {newVoucher.hourlyRate && newVoucher.discountPercentage && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Preview Harga
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Harga Normal:</span>
                        <span>
                          Rp {newVoucher.hourlyRate.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Harga Voucher:</span>
                        <span className="font-bold text-green-600">
                          Rp{" "}
                          {calculateVoucherPrice().discounted.toLocaleString(
                            "id-ID"
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-gray-200 pt-1">
                        <span>Hemat:</span>
                        <span className="font-bold text-purple-600">
                          Rp{" "}
                          {calculateVoucherPrice().savings.toLocaleString(
                            "id-ID"
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )} */}
              </form>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateVoucherForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleCreateVoucher}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Buat Voucher
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sell Voucher Modal */}
      {showSellVoucherForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Jual Voucher
              </h2>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pilih Voucher *
                  </label>
                  <select
                    value={sellVoucher.voucherId}
                    onChange={(e) =>
                      setSellVoucher({
                        ...sellVoucher,
                        voucherId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Pilih Voucher</option>
                    {vouchers
                      .filter((v) => v.status === "active" && !v.customerId)
                      .map((voucher) => (
                        <option key={voucher.id} value={voucher.id}>
                          {voucher.voucherCode} - {voucher.name} (Rp{" "}
                          {voucher.voucherPrice.toLocaleString("id-ID")})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer (Opsional)
                  </label>
                  <select
                    value={sellVoucher.customerId}
                    onChange={(e) => {
                      const customer = customers.find(
                        (c) => c.id === e.target.value
                      );
                      setSellVoucher({
                        ...sellVoucher,
                        customerId: e.target.value,
                        customerName: customer?.name || "",
                        customerPhone: customer?.phone || "",
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Pilih Customer atau isi manual</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Manual Customer Input */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Customer
                    </label>
                    <input
                      type="text"
                      value={sellVoucher.customerName}
                      onChange={(e) =>
                        setSellVoucher({
                          ...sellVoucher,
                          customerName: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nama customer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      No. Telepon
                    </label>
                    <input
                      type="text"
                      value={sellVoucher.customerPhone}
                      onChange={(e) =>
                        setSellVoucher({
                          ...sellVoucher,
                          customerPhone: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="No. telepon"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catatan (Opsional)
                  </label>
                  <textarea
                    value={sellVoucher.notes}
                    onChange={(e) =>
                      setSellVoucher({ ...sellVoucher, notes: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Catatan penjualan"
                  />
                </div>

                {/* Sale Summary */}
                {sellVoucher.voucherId && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Ringkasan Penjualan
                    </h4>
                    {(() => {
                      const selectedVoucher = vouchers.find(
                        (v) => v.id === sellVoucher.voucherId
                      );

                      if (!selectedVoucher) return null;

                      return (
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Kode Voucher:</span>
                            <span>{selectedVoucher.voucherCode}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Nama Voucher:</span>
                            <span>{selectedVoucher.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Points:</span>
                            <span>{selectedVoucher.totalPoints} points</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Berlaku:</span>
                            <span>{selectedVoucher.validityDays} hari</span>
                          </div>
                          <div className="flex justify-between font-medium border-t border-gray-200 pt-2">
                            <span>Total Bayar:</span>
                            <span>
                              Rp{" "}
                              {selectedVoucher.voucherPrice.toLocaleString(
                                "id-ID"
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </form>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowSellVoucherForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSellVoucher}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Jual Voucher
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Voucher Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Cetak Voucher
                </h2>
                <button
                  onClick={() => setShowPrintModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="flex justify-center mb-6">
                {(() => {
                  const voucher = vouchers.find((v) => v.id === showPrintModal);
                  return voucher ? renderPrintableVoucher(voucher) : null;
                })()}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPrintModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    window.print();
                    setShowPrintModal(null);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Cetak Voucher
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Voucher Modal */}
      {showEditVoucherForm && editingVoucher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Edit Voucher {editingVoucher.voucherCode}
              </h2>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Voucher *
                  </label>
                  <input
                    type="text"
                    value={editingVoucher.name}
                    onChange={(e) =>
                      setEditingVoucher({
                        ...editingVoucher,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Voucher Gaming 5 Jam"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deskripsi
                  </label>
                  <textarea
                    value={editingVoucher.description}
                    onChange={(e) =>
                      setEditingVoucher({
                        ...editingVoucher,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="Deskripsi voucher"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Harga Voucher *
                    </label>
                    <input
                      type="number"
                      value={editingVoucher.voucherPrice}
                      onChange={(e) =>
                        setEditingVoucher({
                          ...editingVoucher,
                          voucherPrice: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Modal Voucher
                    </label>
                    <input
                      type="number"
                      value={editingVoucher.capital}
                      onChange={(e) =>
                        setEditingVoucher({
                          ...editingVoucher,
                          capital: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Points *
                  </label>
                  <input
                    type="number"
                    value={editingVoucher.totalPoints}
                    onChange={(e) =>
                      setEditingVoucher({
                        ...editingVoucher,
                        totalPoints: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                  />
                </div>

                {/* Preview Harga */}
                {editingVoucher.voucherPrice &&
                  editingVoucher.totalPoints > 0 &&
                  (() => {
                    // const totalHours = Number(editingVoucher.totalHours) || 0;
                    // const capitalPerHour = Number(editingVoucher.capital) || 0;
                    // const hourlyRate = Number(editingVoucher.hourlyRate) || 0;
                    // const totalPrice = Number(hourlyRate * totalHours) || 0;
                    // const totalCapital =
                    //   Number(capitalPerHour * totalHours) || 0;
                    const bonusPct = editingVoucher.voucherPrice
                      ? ((editingVoucher.totalPoints -
                          editingVoucher.voucherPrice) /
                          editingVoucher.voucherPrice) *
                        100
                      : 0;

                    return (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">
                          Preview Harga
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="font-medium text-purple-600">
                                Harga Voucher
                              </span>
                              <span className="font-bold text-purple-600">
                                Rp{" "}
                                {editingVoucher.voucherPrice.toLocaleString(
                                  "id-ID"
                                )}
                              </span>
                            </div>
                            {/* <div className="flex justify-between">
                              <span className="text-gray-600">
                                Modal Voucher
                              </span>
                              <span className="font-medium">
                                Rp{" "}
                                {editingVoucher.capital.toLocaleString("id-ID")}
                              </span>
                            </div> */}
                            <div className="flex justify-between border-b border-gray-200 pb-1">
                              <span className="font-medium text-purple-600">
                                Total Points
                              </span>
                              <span className="font-bold text-purple-600">
                                {editingVoucher.totalPoints} points
                              </span>
                            </div>
                            {/* <div className="flex justify-between">
                              <span className="text-gray-600">
                                Harga Voucher
                              </span>
                              <span className="font-bold text-green-600">
                                Rp{" "}
                                {editingVoucher.voucherPrice.toLocaleString(
                                  "id-ID"
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total Modal</span>
                              <span className="font-medium">
                                Rp{" "}
                                {editingVoucher.capital.toLocaleString("id-ID")}
                              </span>
                            </div> */}
                            <div className="flex justify-between">
                              <span className="text-gray-600">Bonus (%)</span>
                              <span className="font-bold">
                                {bonusPct.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
              </form>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditVoucherForm(false);
                    setEditingVoucher(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleEditVoucher}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Ticket className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {vouchers.length}
          </h3>
          <p className="text-gray-600 text-sm">Total Voucher</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {vouchers.filter((v) => v.status === "active").length}
          </h3>
          <p className="text-gray-600 text-sm">Voucher Aktif</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <DollarSign className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            Rp{" "}
            {vouchers
              .filter((v) => v.soldDate)
              .reduce((sum, v) => sum + v.voucherPrice, 0)
              .toLocaleString("id-ID")}
          </h3>
          <p className="text-gray-600 text-sm">Total Penjualan</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="h-6 w-6 text-orange-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {voucherUsages.length}
          </h3>
          <p className="text-gray-600 text-sm">Total Penggunaan</p>
        </div>
      </div>
    </div>
  );
};

export default VoucherManagement;
