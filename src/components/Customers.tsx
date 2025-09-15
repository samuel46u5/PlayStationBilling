import React, { useState } from "react";
import {
  Plus,
  Search,
  User,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  MessageCircle,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  LayoutGrid,
  List as ListIcon,
  Gamepad2,
  HistoryIcon,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Customer } from "../types";
import Swal from "sweetalert2";

const Customers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState<string | null>(null);
  // removed unused selectedCustomer state
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    whatsapp: "",
    email: "",
    address: "",
  });
  const [customerView, setCustomerView] = useState<"card" | "list">("card");
  const [customers, setCustomers] = useState<Customer[]>([]);

  // State untuk histori points (lazy per customer)
  const [showHistoryForCustomer, setShowHistoryForCustomer] = useState<
    string | null
  >(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [customerHistories, setCustomerHistories] = useState<
    Record<
      string,
      Array<{
        id: string;
        type: "add" | "deduct";
        points: number;
        timestamp: string;
        description?: string;
        sisa_balance?: number;
      }>
    >
  >({});

  // OTP States
  const [otpStep, setOtpStep] = useState<"input" | "verify" | "verified">(
    "input"
  );
  const [otpCode, setOtpCode] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Edit OTP States
  const [editPhone, setEditPhone] = useState("");
  const [otpStepEdit, setOtpStepEdit] = useState<
    "input" | "verify" | "verified"
  >("input");
  const [otpCodeEdit, setOtpCodeEdit] = useState("");
  const [generatedOtpEdit, setGeneratedOtpEdit] = useState("");
  const [otpTimerEdit, setOtpTimerEdit] = useState(0);
  const [isVerifyingEdit, setIsVerifyingEdit] = useState(false);
  const [isSendingOtpEdit, setIsSendingOtpEdit] = useState(false);

  // State tambahan untuk menyimpan nomor WhatsApp lama saat edit
  const [oldPhone, setOldPhone] = useState("");

  // State untuk checkbox OTP edit
  const [useOtpEdit, setUseOtpEdit] = useState(false);

  // State untuk checkbox OTP tambah customer
  const [useOtpAdd, setUseOtpAdd] = useState(false); // default: unchecked

  // Fetch customers from Supabase
  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      Swal.fire("Gagal mengambil data customer", error.message, "error");
      setCustomers([]);
    } else {
      // Mapping agar field konsisten dengan tipe Customer
      setCustomers(
        (data as any[]).map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          address: c.address,
          totalSpent: c.total_spent ?? 0,
          balancePoints: c.balance_points ?? 0,
          joinDate: c.join_date ? c.join_date : c.created_at,
          status: c.status ?? "active",
        }))
      );
    }
  };

  React.useEffect(() => {
    fetchCustomers();
  }, []);

  React.useEffect(() => {
    if (showEditForm) {
      const cust = customers.find((c) => c.id === showEditForm);
      setEditPhone(cust?.phone || "");
      setOldPhone(cust?.phone || "");
      setOtpStepEdit("input");
      setOtpCodeEdit("");
      setGeneratedOtpEdit("");
      setOtpTimerEdit(0);
      setUseOtpEdit(false);
    }
  }, [showEditForm]);

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm)
  );

  // Ambil histori points: potongan per sesi rental (member-card)
  const fetchPointHistory = async (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;
    // Hindari refetch jika sudah ada
    if (customerHistories[customerId]?.length) {
      return;
    }
    setHistoryLoading(true);
    try {
      // Potongan points PER SESI dari rental_sessions
      const { data: sessions, error: sessErr } = await supabase
        .from("rental_sessions")
        .select(
          "id, start_time, end_time, status, total_points_deducted, duration_minutes, console_id"
        )
        .eq("customer_id", customerId)
        .eq("is_voucher_used", true)
        .order("start_time", { ascending: false });

      if (sessErr) throw sessErr;

      const sessionIds = (sessions || []).map((s: any) => s.id);
      const consoleIds = Array.from(
        new Set((sessions || []).map((s: any) => s.console_id).filter(Boolean))
      );

      // Map console_id -> name
      let consoleNameById: Record<string, string> = {};
      if (consoleIds.length > 0) {
        const { data: consoles, error: consoleErr } = await supabase
          .from("consoles")
          .select("id, name")
          .in("id", consoleIds);
        if (consoleErr) throw consoleErr;
        for (const c of consoles || []) {
          if (c?.id) consoleNameById[c.id] = c.name || "";
        }
      }
      let latestSisaBySession: Record<string, number> = {};
      if (sessionIds.length > 0) {
        const { data: usageLogs, error: usageErr } = await supabase
          .from("point_usage_logs")
          .select("session_id, timestamp, sisa_balance")
          .in("session_id", sessionIds)
          .order("timestamp", { ascending: false });
        if (usageErr) throw usageErr;
        for (const row of usageLogs || []) {
          if (latestSisaBySession[row.session_id] == null) {
            latestSisaBySession[row.session_id] =
              row.sisa_balance != null
                ? Number(row.sisa_balance)
                : (undefined as any);
          }
        }
      }

      const mappedDeduct = (sessions || []).map((s: any) => {
        const points = Number(s.total_points_deducted) || 0;
        const when = s.end_time || s.start_time;
        const sisa = latestSisaBySession[s.id];
        const dur =
          s.duration_minutes != null ? Number(s.duration_minutes) : undefined;
        const consoleName = s.console_id
          ? consoleNameById[s.console_id]
          : undefined;
        return {
          id: `session-${s.id}`,
          type: "deduct" as const,
          points,
          timestamp: when,
          sisa_balance: sisa,
          description:
            `${consoleName ? `[${consoleName}] ` : ""}` +
            (dur != null
              ? `Pemotongan points (member-card) - ${dur} menit`
              : "Pemotongan points (member-card) - Sesi"),
        };
      });

      let addLogs: any[] = [];
      {
        const phone = customer.phone || "";
        if (phone) {
          const { data: txRows, error: txErr } = await supabase
            .from("cashier_transactions")
            .select("id, timestamp, description, details")
            .eq("type", "voucher")
            .contains("details", { customer: { phone } })
            .order("timestamp", { ascending: false });
          if (txErr) throw txErr;
          addLogs = txRows || [];
        }
      }

      const mappedAdd = (addLogs || []).map((tx: any) => {
        const pts = Number(tx?.details?.voucher?.total_points) || 0;
        return {
          id: `add-${tx.id}`,
          type: "add" as const,
          points: pts,
          timestamp: tx.timestamp,
          description: tx.description || "Penjualan voucher (tambah points)",
        };
      });

      const merged = [...mappedDeduct, ...mappedAdd].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setCustomerHistories((prev) => ({ ...prev, [customerId]: merged }));
    } catch (e: any) {
      console.error("fetchPointHistory error:", e);
      Swal.fire(
        "Gagal mengambil histori points",
        e?.message || String(e),
        "error"
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  // Generate random 6-digit OTP
  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Start OTP timer countdown
  const startOtpTimer = () => {
    setOtpTimer(120); // 2 minutes
    const interval = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Format timer display
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Send OTP via WhatsApp
  const handleSendOtp = async () => {
    if (!newCustomer.whatsapp) {
      Swal.fire("Error", "Nomor WhatsApp wajib diisi", "warning");
      return;
    }

    // Validate WhatsApp number format
    const whatsappRegex = /^(\+62|62|0)[0-9]{9,13}$/;
    if (!whatsappRegex.test(newCustomer.whatsapp)) {
      Swal.fire(
        "Error",
        "Format nomor WhatsApp tidak valid. Gunakan format: +62xxx, 62xxx, atau 0xxx",
        "warning"
      );
      return;
    }

    setIsSendingOtp(true);

    try {
      // Generate OTP
      const otp = generateOTP();
      setGeneratedOtp(otp);

      // Simulate API call to WhatsApp service
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In real implementation, you would call your WhatsApp API here
      console.log(`Sending OTP ${otp} to WhatsApp: ${newCustomer.whatsapp}`);

      setOtpStep("verify");
      startOtpTimer();

      // Show success message
      Swal.fire(
        "Sukses",
        `Kode OTP telah dikirim ke WhatsApp ${newCustomer.whatsapp}. Silakan cek pesan masuk.`,
        "success"
      );
    } catch (error) {
      Swal.fire("Gagal mengirim OTP. Silakan coba lagi.", "", "error");
      console.error("OTP send error:", error);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      Swal.fire("Error", "Masukkan kode OTP 6 digit", "warning");
      return;
    }

    setIsVerifying(true);

    try {
      // Simulate API verification
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (otpCode === generatedOtp) {
        setOtpStep("verified");
        Swal.fire("Sukses", "Nomor WhatsApp berhasil diverifikasi!", "success");
      } else {
        Swal.fire("Error", "Kode OTP salah. Silakan coba lagi.", "error");
        setOtpCode("");
      }
    } catch (error) {
      Swal.fire("Gagal memverifikasi OTP. Silakan coba lagi.", "", "error");
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend OTP
  const handleResendOtp = () => {
    if (otpTimer > 0) {
      Swal.fire(
        "Info",
        `Tunggu ${formatTimer(otpTimer)} sebelum mengirim ulang`,
        "info"
      );
      return;
    }

    setOtpCode("");
    handleSendOtp();
  };

  // Fungsi OTP untuk edit customer
  const handleSendOtpEdit = async () => {
    if (!editPhone) {
      Swal.fire("Error", "Nomor WhatsApp wajib diisi", "warning");
      return;
    }
    const whatsappRegex = /^(\+62|62|0)[0-9]{9,13}$/;
    if (!whatsappRegex.test(editPhone)) {
      Swal.fire(
        "Error",
        "Format nomor WhatsApp tidak valid. Gunakan format: +62xxx, 62xxx, atau 0xxx",
        "warning"
      );
      return;
    }
    setIsSendingOtpEdit(true);
    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtpEdit(otp);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setOtpStepEdit("verify");
      setOtpTimerEdit(120);
      const interval = setInterval(() => {
        setOtpTimerEdit((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      Swal.fire(
        "Sukses",
        `Kode OTP telah dikirim ke WhatsApp ${editPhone}. Silakan cek pesan masuk.`,
        "success"
      );
    } catch (error) {
      Swal.fire(
        "Gagal mengirim OTP. Silakan coba lagi.",
        String(error),
        "error"
      );
    } finally {
      setIsSendingOtpEdit(false);
    }
  };

  const handleVerifyOtpEdit = async () => {
    if (!otpCodeEdit || otpCodeEdit.length !== 6) {
      Swal.fire("Error", "Masukkan kode OTP 6 digit", "warning");
      return;
    }
    setIsVerifyingEdit(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (otpCodeEdit === generatedOtpEdit) {
        setOtpStepEdit("verified");
        Swal.fire("Sukses", "Nomor WhatsApp berhasil diverifikasi!", "success");
      } else {
        Swal.fire("Error", "Kode OTP salah. Silakan coba lagi.", "error");
        setOtpCodeEdit("");
      }
    } catch (error) {
      Swal.fire(
        "Gagal memverifikasi OTP. Silakan coba lagi.",
        String(error),
        "error"
      );
    } finally {
      setIsVerifyingEdit(false);
    }
  };

  const handleResendOtpEdit = () => {
    if (otpTimerEdit > 0) {
      Swal.fire(
        "Info",
        `Tunggu ${formatTimer(otpTimerEdit)} sebelum mengirim ulang`,
        "info"
      );
      return;
    }
    setOtpCodeEdit("");
    handleSendOtpEdit();
  };

  // Tambah customer ke database
  const handleAddCustomer = async () => {
    // Validasi nama wajib diisi
    if (!newCustomer.name) {
      Swal.fire("Error", "Nama wajib diisi", "warning");
      return;
    }
    // Jika cek OTP dicentang, nomor WhatsApp wajib diisi
    if (useOtpAdd && !newCustomer.whatsapp) {
      Swal.fire(
        "Error",
        "Nomor WhatsApp wajib diisi jika Cek OTP dicentang",
        "warning"
      );
      return;
    }
    // Duplicate check
    const duplicate = customers.find(
      (c) =>
        c.name.trim().toLowerCase() === newCustomer.name.trim().toLowerCase() ||
        (newCustomer.whatsapp && c.phone === newCustomer.whatsapp)
    );
    if (duplicate) {
      Swal.fire("Error", "Nama atau nomor WhatsApp sudah terdaftar", "error");
      return;
    }
    if (useOtpAdd && otpStep !== "verified") {
      Swal.fire(
        "Error",
        "Silakan verifikasi nomor WhatsApp terlebih dahulu",
        "warning"
      );
      return;
    }
    const { error } = await supabase.from("customers").insert([
      {
        name: newCustomer.name,
        phone: newCustomer.whatsapp || "", // WA opsional, kirim string kosong jika tidak diisi
        email: newCustomer.email,
        address: newCustomer.address,
        total_spent: 0,
        join_date: new Date().toISOString().slice(0, 10),
        status: "active",
      },
    ]);
    if (error) {
      Swal.fire("Gagal menambah customer", error.message, "error");
    } else {
      await Swal.fire("Sukses", "Customer berhasil ditambahkan!", "success");
      setShowAddForm(false);
      setNewCustomer({ name: "", whatsapp: "", email: "", address: "" });
      setOtpStep("input");
      setOtpCode("");
      setGeneratedOtp("");
      setOtpTimer(0);
      fetchCustomers();
    }
  };

  // Edit customer di database
  const handleEditCustomer = async (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;
    const name =
      (document.getElementById("edit-name") as HTMLInputElement)?.value ||
      customer.name;
    const phone = editPhone;
    const email =
      (document.getElementById("edit-email") as HTMLInputElement)?.value ||
      customer.email;
    const address =
      (document.getElementById("edit-address") as HTMLInputElement)?.value ||
      customer.address;
    // Duplicate check (exclude self)
    const duplicate = customers.find(
      (c) =>
        c.id !== customerId &&
        (c.name.trim().toLowerCase() === name.trim().toLowerCase() ||
          (phone && c.phone === phone))
    );
    if (duplicate) {
      Swal.fire("Error", "Nama atau nomor WhatsApp sudah terdaftar", "error");
      return;
    }
    if (useOtpEdit && phone !== oldPhone && otpStepEdit !== "verified") {
      Swal.fire(
        "Error",
        "Nomor WhatsApp baru harus diverifikasi OTP",
        "warning"
      );
      return;
    }
    const { error } = await supabase
      .from("customers")
      .update({ name, phone, email, address })
      .eq("id", customerId);
    if (error) {
      Swal.fire("Gagal memperbarui customer", error.message, "error");
    } else {
      await Swal.fire("Sukses", `Customer berhasil diperbarui!`, "success");
      setShowEditForm(null);
      fetchCustomers();
    }
  };

  // Hapus customer di database
  const handleDeleteCustomer = async (customerId: string) => {
    const result = await Swal.fire({
      title: "Hapus Customer?",
      text: "Apakah Anda yakin ingin menghapus customer ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
    });
    if (result.isConfirmed) {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", customerId);
      if (error) {
        Swal.fire("Gagal menghapus customer", error.message, "error");
      } else {
        await Swal.fire("Sukses", "Customer berhasil dihapus!", "success");
        fetchCustomers();
      }
    }
  };

  // removed unused handleStartRental

  const resetForm = () => {
    setNewCustomer({ name: "", whatsapp: "", email: "", address: "" });
    setOtpStep("input");
    setOtpCode("");
    setGeneratedOtp("");
    setOtpTimer(0);
    setShowAddForm(false);
  };

  // Ambil data riwayat rental customer dari Supabase
  const getCustomerStats = async (customerId: string) => {
    // Ambil data rental/sesi dari tabel rentals (atau sessions jika ada)
    const { data, error } = await supabase
      .from("rental_sessions")
      .select("id, customer_id, console_type, duration_minutes, start_time")
      .eq("customer_id", customerId);
    if (error || !data)
      return {
        totalKunjungan: 0,
        rataSesi: 0,
        consoleFavorit: "-",
        lastVisit: "-",
      };
    const totalKunjungan = data.length;
    const rataSesi =
      totalKunjungan > 0
        ? data.reduce((sum, r) => sum + (r.duration_minutes || 0), 0) /
          totalKunjungan
        : 0;
    // Hitung console favorit
    const consoleCount: Record<string, number> = {};
    data.forEach((r) => {
      if (r.console_type) {
        consoleCount[r.console_type] = (consoleCount[r.console_type] || 0) + 1;
      }
    });
    const consoleFavorit =
      Object.entries(consoleCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
    // Kunjungan terakhir
    const lastVisit =
      data.length > 0
        ? new Date(
            Math.max(...data.map((r) => new Date(r.start_time).getTime()))
          )
        : null;
    return {
      totalKunjungan,
      rataSesi,
      consoleFavorit,
      lastVisit: lastVisit
        ? `${lastVisit.toLocaleDateString(
            "id-ID"
          )} ${lastVisit.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })}`
        : "-",
    };
  };

  // Komponen Riwayat Customer dengan data real
  const CustomerHistory: React.FC<{ customerId: string }> = ({
    customerId,
  }) => {
    const [stats, setStats] = useState({
      totalKunjungan: 0,
      rataSesi: 0,
      consoleFavorit: "-",
      lastVisit: "-",
    });
    React.useEffect(() => {
      getCustomerStats(customerId).then((result) =>
        setStats({
          totalKunjungan: result.totalKunjungan,
          rataSesi: typeof result.rataSesi === "number" ? result.rataSesi : 0,
          consoleFavorit: result.consoleFavorit,
          lastVisit: result.lastVisit,
        })
      );
    }, [customerId]);
    return (
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Customer ID:</span>
          <span className="font-medium">{customerId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Total Kunjungan:</span>
          <span className="font-medium">{stats.totalKunjungan} sesi</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Total Points:</span>
          <span className="font-medium text-green-600">
            {customers.find((c) => c.id === customerId)?.balancePoints}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Rata-rata Sesi:</span>
          <span className="font-medium">{stats.rataSesi.toFixed(2)} jam</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Console Favorit:</span>
          <span className="font-medium">{stats.consoleFavorit}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Kunjungan Terakhir:</span>
          <span className="font-medium">{stats.lastVisit}</span>
        </div>
      </div>
    );
  };

  // Komponen untuk menampilkan kunjungan terakhir di tabel list
  const CustomerLastVisit: React.FC<{ customerId: string }> = ({
    customerId,
  }) => {
    const [lastVisit, setLastVisit] = useState("-");
    React.useEffect(() => {
      getCustomerStats(customerId).then((result) =>
        setLastVisit(result.lastVisit)
      );
    }, [customerId]);
    return <>{lastVisit}</>;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Gamepad2 className="h-10 w-10 text-blue-700" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Manajemen Customer
              </h1>
              <p className="text-gray-600">
                Kelola database customer dan riwayat rental
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCustomerView("card")}
              className={`p-2 rounded-lg border ${
                customerView === "card"
                  ? "bg-blue-100 border-blue-400 text-blue-600"
                  : "border-gray-200 text-gray-400 hover:text-blue-600"
              }`}
              aria-label="Tampilan Card"
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCustomerView("list")}
              className={`p-2 rounded-lg border ${
                customerView === "list"
                  ? "bg-blue-100 border-blue-400 text-blue-600"
                  : "border-gray-200 text-gray-400 hover:text-blue-600"
              }`}
              aria-label="Tampilan List"
            >
              <ListIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Tambah Customer
            </button>
          </div>
        </div>
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Cari customer berdasarkan nama atau nomor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Customer Grid/List */}
      {customerView === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{customer.name}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-4 py-1 rounded-full text-xs font-semibold ${
                        customer.status === "active"
                          ? "bg-green-600 text-white"
                          : "bg-gray-400 text-white"
                      }`}
                    >
                      {customer.status === "active" ? "AKTIF" : "TIDAK AKTIF"}
                    </span>
                    <button
                      onClick={() => setShowEditForm(customer.id)}
                      className="flex items-center justify-center px-3 py-1 rounded-full border border-gray-200 text-white bg-white bg-opacity-10 hover:bg-gray-100 hover:text-slate-800 font-medium text-sm transition-colors"
                      aria-label="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(customer.id)}
                      className="flex items-center justify-center px-3 py-1 rounded-full border border-gray-200 text-white bg-white bg-opacity-10 hover:bg-gray-100 hover:text-red-600 font-medium text-sm transition-colors"
                      aria-label="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={async () => {
                        setShowHistoryForCustomer(customer.id);
                        await fetchPointHistory(customer.id);
                      }}
                      className="flex items-center justify-center px-3 py-1 rounded-full border border-gray-200 text-white bg-white bg-opacity-10 hover:bg-gray-100 hover:text-blue-600 font-medium text-sm transition-colors"
                      aria-label="Histori Points"
                    >
                      <HistoryIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-4">
                <div className="space-y-3">
                  {/* Contact Info */}
                  <div className="flex items-center gap-3 text-gray-600">
                    <MessageCircle className="h-4 w-4 flex-shrink-0 text-green-600" />
                    <span className="text-sm">{customer.phone}</span>
                  </div>

                  {customer.email && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm">{customer.email}</span>
                    </div>
                  )}

                  {customer.address && (
                    <div className="flex items-start gap-3 text-gray-600">
                      <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{customer.address}</span>
                    </div>
                  )}

                  {/* Member Sejak */}
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">Member Sejak</span>
                      </div>
                      <span className="text-sm text-gray-900">
                        {customer.joinDate
                          ? new Date(customer.joinDate).toLocaleDateString(
                              "id-ID"
                            )
                          : "-"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detail langsung tampil tanpa tombol dan tanpa total belanja */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <CustomerHistory customerId={customer.id} />
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
                  WhatsApp
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Alamat
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Member Sejak
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Kunjungan Terakhir
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-gray-400 py-6">
                    Tidak ada data customer ditemukan.
                  </td>
                </tr>
              )}
              {filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {customer.name}
                  </td>
                  <td className="px-4 py-3">{customer.phone}</td>
                  <td className="px-4 py-3">{customer.email || "-"}</td>
                  <td className="px-4 py-3">{customer.address || "-"}</td>
                  <td className="px-4 py-3">
                    {customer.joinDate
                      ? new Date(customer.joinDate).toLocaleDateString("id-ID")
                      : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        customer.status === "active"
                          ? "bg-green-500 text-white"
                          : "bg-gray-400 text-white"
                      }`}
                    >
                      {customer.status || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <CustomerLastVisit customerId={customer.id} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShowEditForm(customer.id)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(customer.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={async () => {
                          setShowHistoryForCustomer(customer.id);
                          await fetchPointHistory(customer.id);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Histori Points"
                      >
                        <DollarSign className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Histori Points */}
      {showHistoryForCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-gray-900">
                  Histori Points
                </h2>
                <button
                  onClick={() => setShowHistoryForCustomer(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              {historyLoading ? (
                <div className="py-6 text-center text-gray-500">Memuat...</div>
              ) : (
                <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                  {(customerHistories[showHistoryForCustomer] || []).length ===
                  0 ? (
                    <div className="py-6 text-center text-gray-400">
                      Belum ada histori
                    </div>
                  ) : (
                    (customerHistories[showHistoryForCustomer] || []).map(
                      (h) => (
                        <div
                          key={h.id}
                          className="py-3 flex items-start justify-between"
                        >
                          <div>
                            <div
                              className={`text-sm font-medium ${
                                h.type === "add"
                                  ? "text-green-700"
                                  : "text-red-700"
                              }`}
                            >
                              {h.type === "add"
                                ? `+${h.points} points`
                                : `-${h.points} points`}
                            </div>
                            {h.sisa_balance != null && (
                              <div className="text-xs text-gray-500">
                                Sisa balance:{" "}
                                {Number(h.sisa_balance).toLocaleString("id-ID")}
                              </div>
                            )}
                            {h.description && (
                              <div className="text-xs text-gray-500">
                                {h.description}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 ml-4 whitespace-nowrap">
                            {new Date(h.timestamp).toLocaleString("id-ID")}
                          </div>
                        </div>
                      )
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Tambah Customer Baru
              </h2>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    value={newCustomer.name}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Masukkan nama customer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor WhatsApp{useOtpAdd ? " *" : " (Opsional)"}
                    {otpStep === "verified" && (
                      <span className="ml-2 inline-flex items-center gap-1 text-green-600 text-xs">
                        <CheckCircle className="h-3 w-3" />
                        Terverifikasi
                      </span>
                    )}
                  </label>
                  <div className="mb-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={useOtpAdd}
                      onChange={(e) => setUseOtpAdd(e.target.checked)}
                      className="accent-blue-600"
                      id="cek-otp-add"
                    />
                    <label
                      htmlFor="cek-otp-add"
                      className="text-sm text-gray-700 select-none"
                    >
                      Cek OTP
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={newCustomer.whatsapp}
                      onChange={(e) => {
                        setNewCustomer({
                          ...newCustomer,
                          whatsapp: e.target.value,
                        });
                        if (otpStep !== "input") {
                          setOtpStep("input");
                          setOtpCode("");
                          setGeneratedOtp("");
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+62 8xx-xxxx-xxxx"
                      disabled={otpStep === "verified"}
                    />
                    {useOtpAdd && otpStep === "input" && (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isSendingOtp || !newCustomer.whatsapp}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                      >
                        {isSendingOtp ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <MessageCircle className="h-4 w-4" />
                        )}
                        {isSendingOtp ? "Mengirim..." : "Kirim OTP"}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Format: +62xxx, 62xxx, atau 0xxx
                  </p>
                </div>

                {/* OTP Verification Section */}
                {useOtpAdd && otpStep === "verify" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <h4 className="font-medium text-blue-900">
                        Verifikasi WhatsApp
                      </h4>
                    </div>

                    <p className="text-sm text-blue-800 mb-3">
                      Kode OTP telah dikirim ke WhatsApp{" "}
                      <strong>{newCustomer.whatsapp}</strong>
                    </p>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-1">
                          Masukkan Kode OTP (6 digit)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={otpCode}
                            onChange={(e) =>
                              setOtpCode(
                                e.target.value.replace(/\D/g, "").slice(0, 6)
                              )
                            }
                            className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-mono text-lg"
                            placeholder="000000"
                            maxLength={6}
                          />
                          <button
                            type="button"
                            onClick={handleVerifyOtp}
                            disabled={isVerifying || otpCode.length !== 6}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                          >
                            {isVerifying ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              "Verifikasi"
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-blue-600">
                          <Clock className="h-4 w-4" />
                          <span>
                            {otpTimer > 0
                              ? `Kirim ulang dalam ${formatTimer(otpTimer)}`
                              : "Kode expired"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={otpTimer > 0}
                          className="text-blue-600 hover:text-blue-700 disabled:text-gray-400 font-medium"
                        >
                          Kirim Ulang
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success Verification */}
                {otpStep === "verified" && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-900">
                        WhatsApp Terverifikasi
                      </span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Nomor WhatsApp {newCustomer.whatsapp} telah berhasil
                      diverifikasi
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email (Opsional)
                  </label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="customer@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alamat (Opsional)
                  </label>
                  <textarea
                    value={newCustomer.address}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        address: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Masukkan alamat customer"
                  />
                </div>
              </form>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    if (useOtpAdd && otpStep !== "verified") {
                      Swal.fire(
                        "Error",
                        "Nomor WhatsApp harus diverifikasi OTP",
                        "warning"
                      );
                      return;
                    }
                    handleAddCustomer();
                  }}
                  disabled={useOtpAdd ? otpStep !== "verified" : false}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Tambah Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Edit Customer
              </h2>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    id="edit-name"
                    defaultValue={
                      customers.find((c) => c.id === showEditForm)?.name
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor WhatsApp
                  </label>
                  {/* Checkbox Cek OTP di atas input nomor WhatsApp */}
                  <div className="mb-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={useOtpEdit}
                      onChange={(e) => setUseOtpEdit(e.target.checked)}
                      className="accent-blue-600"
                      id="cek-otp-edit"
                    />
                    <label
                      htmlFor="cek-otp-edit"
                      className="text-sm text-gray-700 select-none"
                    >
                      Cek OTP
                    </label>
                  </div>
                  <div className="flex gap-2 items-center">
                    <input
                      type="tel"
                      id="edit-phone"
                      value={editPhone}
                      onChange={(e) => {
                        setEditPhone(e.target.value);
                        if (useOtpEdit && e.target.value !== oldPhone) {
                          if (otpStepEdit !== "input") {
                            setOtpStepEdit("input");
                            setOtpCodeEdit("");
                            setGeneratedOtpEdit("");
                          }
                        } else {
                          setOtpStepEdit("input");
                          setOtpCodeEdit("");
                          setGeneratedOtpEdit("");
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {useOtpEdit && (
                      <button
                        type="button"
                        onClick={handleSendOtpEdit}
                        disabled={
                          isSendingOtpEdit ||
                          !editPhone ||
                          editPhone === oldPhone
                        }
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                      >
                        {isSendingOtpEdit ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <MessageCircle className="h-4 w-4" />
                        )}
                        {isSendingOtpEdit ? "Mengirim..." : "Kirim OTP"}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Format: +62xxx, 62xxx, atau 0xxx
                  </p>
                </div>
                {/* OTP Verification Section for Edit */}
                {useOtpEdit &&
                  editPhone !== oldPhone &&
                  otpStepEdit === "verify" && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-2">
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="h-5 w-5 text-blue-600" />
                        <h4 className="font-medium text-blue-900">
                          Verifikasi WhatsApp
                        </h4>
                      </div>
                      <p className="text-sm text-blue-800 mb-3">
                        Kode OTP telah dikirim ke WhatsApp{" "}
                        <strong>{editPhone}</strong>
                      </p>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-blue-700 mb-1">
                            Masukkan Kode OTP (6 digit)
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={otpCodeEdit}
                              onChange={(e) =>
                                setOtpCodeEdit(
                                  e.target.value.replace(/\D/g, "").slice(0, 6)
                                )
                              }
                              className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-mono text-lg"
                              placeholder="000000"
                              maxLength={6}
                            />
                            <button
                              type="button"
                              onClick={handleVerifyOtpEdit}
                              disabled={
                                isVerifyingEdit || otpCodeEdit.length !== 6
                              }
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                            >
                              {isVerifyingEdit ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                "Verifikasi"
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-blue-600">
                            <Clock className="h-4 w-4" />
                            <span>
                              {otpTimerEdit > 0
                                ? `Kirim ulang dalam ${formatTimer(
                                    otpTimerEdit
                                  )}`
                                : "Kode expired"}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleResendOtpEdit}
                            disabled={otpTimerEdit > 0}
                            className="text-blue-600 hover:text-blue-700 disabled:text-gray-400 font-medium"
                          >
                            Kirim Ulang
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                {useOtpEdit &&
                  editPhone !== oldPhone &&
                  otpStepEdit === "verified" && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-900">
                          WhatsApp Terverifikasi
                        </span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        Nomor WhatsApp {editPhone} telah berhasil diverifikasi
                      </p>
                    </div>
                  )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="edit-email"
                    defaultValue={
                      customers.find((c) => c.id === showEditForm)?.email
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alamat
                  </label>
                  <textarea
                    id="edit-address"
                    defaultValue={
                      customers.find((c) => c.id === showEditForm)?.address
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
              </form>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditForm(null);
                    setOtpStepEdit("input");
                    setOtpCodeEdit("");
                    setGeneratedOtpEdit("");
                    setOtpTimerEdit(0);
                    setEditPhone("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    if (
                      useOtpEdit &&
                      editPhone !== oldPhone &&
                      otpStepEdit !== "verified"
                    ) {
                      Swal.fire(
                        "Error",
                        "Nomor WhatsApp baru harus diverifikasi OTP",
                        "warning"
                      );
                      return;
                    }
                    handleEditCustomer(showEditForm);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Perbarui Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
