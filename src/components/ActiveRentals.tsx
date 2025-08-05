

  // ...existing code...

  // ...existing code...
import { Power } from 'lucide-react';
import { deleteSaleItem } from "../lib/deleteSaleItem";
import React, { useState, useEffect } from "react";

interface SaleItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  total?: number;
}

interface RentalSession {
  // ...existing properties...
  sale_items?: SaleItem[];
}
import {
  Clock,
  User,
  Gamepad2,
  DollarSign,
  Play,
  Pause,
  Square,
  Plus,
  ShoppingCart,
  Minus,
  X,
  Calculator,
  CreditCard,
  UserPlus,
  Users,
  MapPin,
  Wrench,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import Swal from "sweetalert2";

interface Console {
  id: string;
  name: string;
  equipment_type_id: string;
  rate_profile_id: string | null;
  status: "available" | "rented" | "maintenance";
  location?: string;
  serial_number?: string;
  is_active: boolean;
  relay_command_on?: string;
  relay_command_off?: string;
  power_tv_command?: string;
  relay_command_status?: string;
  perintah_cek_power_tv?: string;
}

interface RateProfile {
  id: string;
  name: string;
  hourly_rate: number;
}

interface RentalSession {
  id: string;
  customer_id: string;
  console_id: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  total_amount: number;
  status: "active" | "completed" | "overdue";
  payment_status: "pending" | "partial" | "paid";
  paid_amount: number;
  customers?: {
    name: string;
    phone: string;
  };
  consoles?: {
    name: string;
    location: string;
  };
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  is_active: boolean;
}

interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  total: number;
}




const ActiveRentals: React.FC = () => {

  // Untuk interface pembayaran mirip Cashier
  const [isManualInput, setIsManualInput] = useState(false);
  // State untuk status relay dan TV
  const [relayStatus, setRelayStatus] = useState<string>('OFF');
  const [tvStatus, setTvStatus] = useState<'ON' | 'OFF'>('OFF');
  const [consoles, setConsoles] = useState<Console[]>([]);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [consoleFilter, setConsoleFilter] = useState<
    "all" | "available" | "rented" | "maintenance"
  >("all");
  const [searchConsole, setSearchConsole] = useState("");
  const [rateProfiles, setRateProfiles] = useState<RateProfile[]>([]);
  const [activeSessions, setActiveSessions] = useState<RentalSession[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [showProductModal, setShowProductModal] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [billingProducts, setBillingProducts] = useState<any[]>([]);
  const [searchProduct, setSearchProduct] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showStartRentalModal, setShowStartRentalModal] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerType, setCustomerType] = useState<"member" | "non-member">("member");
  const [rentalType, setRentalType] = useState<"pay-as-you-go" | "prepaid">("pay-as-you-go");
  const [rentalDurationHours, setRentalDurationHours] = useState<number>(1);
  const [rentalDurationMinutes, setRentalDurationMinutes] = useState<number>(0);

  // --- TV Status JSON and selectedConsole hooks must be after all state declarations ---
  const [tvStatusJson, setTvStatusJson] = React.useState<string>("");
  const selectedConsole = React.useMemo(() =>
    showStartRentalModal ? consoles.find((c: any) => c.id === showStartRentalModal) : undefined,
    [showStartRentalModal, consoles]
  );

  React.useEffect(() => {
    if (showStartRentalModal && selectedConsole?.perintah_cek_power_tv) {
      setTvStatusJson("");
      fetch(String(selectedConsole.perintah_cek_power_tv))
        .then(res => res.text())
        .then(text => setTvStatusJson(text))
        .catch(() => setTvStatusJson("Gagal cek status"));
    } else {
      setTvStatusJson("");
    }
  }, [showStartRentalModal, selectedConsole?.perintah_cek_power_tv]);

  // Polling status TV & relay secara real-time saat modal Start Rental tampil
  const [statusIntervalId, setStatusIntervalId] = React.useState<NodeJS.Timeout | null>(null);
  React.useEffect(() => {
    if (!showStartRentalModal || !selectedConsole) {
      if (statusIntervalId) clearInterval(statusIntervalId);
      setStatusIntervalId(null);
      return;
    }
    // Interval pengecekan status setiap 3 detik
    const interval = setInterval(() => {
      if (selectedConsole.perintah_cek_power_tv) {
        fetch(selectedConsole.perintah_cek_power_tv)
          .then(res => res.text())
          .then(text => setTvStatusJson(text))
          .catch(() => setTvStatusJson("Gagal cek status"));
      }
      if (selectedConsole.relay_command_status) {
        fetch(selectedConsole.relay_command_status)
          .then(res => res.text())
          .then(text => setRelayStatus(text))
          .catch(() => setRelayStatus("-"));
      }
    }, 3000);
    setStatusIntervalId(interval);
    return () => clearInterval(interval);
  }, [showStartRentalModal, selectedConsole]);
  // Fetch cart items from rental_session_products when product modal is opened
  useEffect(() => {
    // Ambil produk billing (pending payment) dan produk keranjang terpisah
    const fetchProductData = async () => {
      if (!showProductModal) return;
      // Produk billing (pending payment)
      const { data: billingData, error: billingError } = await supabase
        .from("rental_session_products")
        .select("*")
        .eq("session_id", showProductModal)
        .eq("status", "pending");
      if (!billingError && Array.isArray(billingData)) {
        setBillingProducts(billingData);
      } else {
        setBillingProducts([]);
      }
      // Produk keranjang tetap dari state cart
    };
    fetchProductData();
  }, [showProductModal]);
  // Produk billing (pending payment)

  // Jalankan perintah cek status relay saat modal Start Rental dibuka
  useEffect(() => {
    if (!showStartRentalModal) return;
    const console = consoles.find((c) => c.id === showStartRentalModal);
    if (!console) return;
    // Cek status relay (jika ada endpoint relay_command_status)
    if (console.relay_command_status) {
      fetch(console.relay_command_status)
        .then((res) => res.text())
        .then((text) => {
          setRelayStatus(text.trim().toUpperCase() === 'ON' ? 'ON' : 'OFF');
        })
        .catch(() => setRelayStatus('OFF'));
    } else {
      setRelayStatus('OFF');
    }
  }, [showStartRentalModal, consoles]);
  const [nonMemberName, setNonMemberName] = useState<string>("");
  const [nonMemberPhone, setNonMemberPhone] = useState<string>("");
  const [countdownTimers, setCountdownTimers] = useState<
    Record<string, number>
  >({});
  // Toggle view mode: 'simple' | 'detail' | 'list'
  const [viewMode, setViewMode] = useState<"simple" | "detail" | "list">(
    "simple"
  );
  // Tambahan: countdown detik
  const [countdownSeconds, setCountdownSeconds] = useState<
    Record<string, number>
  >({});
  const [elapsedTimers, setElapsedTimers] = useState<Record<string, number>>(
    {}
  );
  const [countdownIntervals, setCountdownIntervals] = useState<
    Record<string, NodeJS.Timeout>
  >({});
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historySessions, setHistorySessions] = useState<RentalSession[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyStartDate, setHistoryStartDate] = useState<string>("");
  const [historyEndDate, setHistoryEndDate] = useState<string>("");
  // Pagination states for history
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [showPaymentModal, setShowPaymentModal] = useState<null | {
    session: RentalSession;
    productsTotal: number;
  }>(null);
  // Mapping sessionId -> total produk
  const [productsTotalMap, setProductsTotalMap] = useState<Record<string, number>>({});
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris">("cash");
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [changeAmount, setChangeAmount] = useState<number>(0);

  // Reset paymentAmount ke 0 setiap kali showPaymentModal berubah (end rental)
  React.useEffect(() => {
    if (showPaymentModal) setPaymentAmount(0);
  }, [showPaymentModal]);

  // Load history sessions
  const loadHistorySessions = async (startDate?: string, endDate?: string) => {
    setLoadingHistory(true);
    try {
      // Get total count for pagination
      let countQuery = supabase
        .from("rental_sessions")
        .select("id", { count: "exact", head: true })
        .in("status", ["completed", "overdue"]);
      if (startDate) {
        countQuery = countQuery.gte("end_time", startDate + "T00:00:00");
      }
      if (endDate) {
        countQuery = countQuery.lte("end_time", endDate + "T23:59:59");
      }
      const { count, error: countError } = await countQuery;
      if (countError) throw countError;
      setTotalItems(count || 0);
      setTotalPages(Math.max(1, Math.ceil((count || 0) / 10)));

      // Fetch paginated data
      const startIdx = (currentPage - 1) * 10;
      const endIdx = startIdx + 9;
      let query = supabase
        .from("rental_sessions")
        .select(`*, customers(name, phone), consoles(name, location)`)
        .in("status", ["completed", "overdue"])
        .order("end_time", { ascending: false })
        .range(startIdx, endIdx);
      if (startDate) {
        query = query.gte("end_time", startDate + "T00:00:00");
      }
      if (endDate) {
        query = query.lte("end_time", endDate + "T23:59:59");
      }
      const { data, error } = await query;
      if (error) throw error;
      setHistorySessions(data || []);
    } catch (error) {
      Swal.fire("Error", "Gagal memuat history rental", "error");
    } finally {
      setLoadingHistory(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Real-time clock for header
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Set up countdown timers for prepaid sessions
  useEffect(() => {
    // Clear previous intervals
    Object.values(countdownIntervals).forEach((interval) =>
      clearInterval(interval)
    );
    setCountdownIntervals({});

    const newElapsedTimers: Record<string, number> = {};
    const newCountdownTimers: Record<string, number> = {};
    const newCountdownSeconds: Record<string, number> = {};
    const newIntervals: Record<string, NodeJS.Timeout> = {};

    activeSessions.forEach((session) => {
      const startTime = new Date(session.start_time).getTime();
      const now = new Date().getTime();
      const elapsedMs = now - startTime;
      const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));

      // For all sessions, track elapsed time
      newElapsedTimers[session.id] = elapsedMinutes;

      // Untuk prepaid (BAYAR DIMUKA), cek apakah waktu sudah habis
      if (session.duration_minutes) {
        const durationMs = session.duration_minutes * 60 * 1000;
        const endTime = startTime + durationMs;
        const remainingMs = Math.max(0, endTime - now);
        const remainingMinutes = Math.floor(remainingMs / (1000 * 60));
        newCountdownTimers[session.id] = remainingMinutes;
        newCountdownSeconds[session.id] = Math.floor(remainingMs / 1000);

        // Otomatis end rental jika prepaid dan waktu habis
        if (
          remainingMs <= 0 &&
          session.status === "active" &&
          session.payment_status === "paid"
        ) {
          // End rental otomatis tanpa interaksi user
          handleEndSession(session.id);
        } else if (remainingMs > 0) {
          // Set up interval to update countdown per second
          const interval = setInterval(() => {
            setCountdownSeconds((prev) => {
              const current =
                prev[session.id] ?? Math.floor((endTime - Date.now()) / 1000);
              if (current <= 1) {
                clearInterval(newIntervals[session.id]);
                delete newIntervals[session.id];
                // Otomatis end rental jika prepaid dan waktu habis
                if (
                  session.duration_minutes &&
                  session.status === "active" &&
                  session.payment_status === "paid"
                ) {
                  handleEndSession(session.id);
                }
                return { ...prev, [session.id]: 0 };
              }
              return { ...prev, [session.id]: current - 1 };
            });
          }, 1000); // Update every second
          newIntervals[session.id] = interval;
        }
      }
    });

    setElapsedTimers(newElapsedTimers);
    setCountdownTimers(newCountdownTimers);
    setCountdownSeconds(newCountdownSeconds);
    setCountdownIntervals(newIntervals);

    // Set up interval to update elapsed time for all sessions
    const elapsedInterval = setInterval(() => {
      setElapsedTimers((prev) => {
        const newTimers = { ...prev };
        activeSessions.forEach((session) => {
          const startTime = new Date(session.start_time).getTime();
          const now = new Date().getTime();
          const elapsedMs = now - startTime;
          const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
          newTimers[session.id] = elapsedMinutes;
        });
        return newTimers;
      });
    }, 60000); // Update every minute

    return () => {
      clearInterval(elapsedInterval);
      Object.values(newIntervals).forEach((interval) =>
        clearInterval(interval)
      );
    };
  }, [activeSessions]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch consoles
      const { data: consoleData, error: consoleError } = await supabase
        .from("consoles")
        .select("*")
        .eq("is_active", true);

      if (consoleError) throw consoleError;

      // Fetch rate profiles
      const { data: rateData, error: rateError } = await supabase
        .from("rate_profiles")
        .select("id, name, hourly_rate");

      if (rateError) throw rateError;

      // Fetch active rental sessions
      const { data: rentalData, error: rentalError } = await supabase
        .from("rental_sessions")
        .select(
          `
          *,
          customers(name, phone),
          consoles(name, location)
        `
        )
        .eq("status", "active");

      if (rentalError) throw rentalError;

      // Fetch products from database
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .gt("stock", 0);

      if (productError) {
        console.error("Error fetching products:", productError);
        throw productError;
      }

      // Fetch customers
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("status", "active");

      if (customerError) throw customerError;

      // Fetch total produk per session aktif
      let productsTotalMap: Record<string, number> = {};
      if (Array.isArray(rentalData)) {
        const sessionIds = rentalData.map((s) => s.id);
        if (sessionIds.length > 0) {
          const { data: productRows, error: productRowsError } = await supabase
            .from("rental_session_products")
            .select("session_id, quantity, price")
            .in("session_id", sessionIds)
            .in("status", ["pending", "completed"]);
          if (!productRowsError && Array.isArray(productRows)) {
            for (const sessionId of sessionIds) {
              const items = productRows.filter((row) => row.session_id === sessionId);
              productsTotalMap[sessionId] = items.reduce(
                (sum, item) => sum + (item.quantity || 0) * (item.price || 0),
                0
              );
            }
          }
        }
      }

      setConsoles(consoleData || []);
      setRateProfiles(rateData || []);
      setActiveSessions(rentalData || []);
      setProducts(productData || []);
      setCustomers(customerData || []);
      setProductsTotalMap(productsTotalMap);
    } catch (error) {
      console.error("Error loading data:", error);
      Swal.fire("Error", "Gagal memuat data", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const formatCountdown = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Format countdown in HH:MM:SS for Live Timer Display
  const formatCountdownHMS = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    // Pad with zero
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `Sisa Waktu : ${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  };

  // Format elapsed time in HH:MM:SS for PAY AS YOU GO
  const formatElapsedHMS = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    let diff = Math.floor((now.getTime() - start.getTime()) / 1000); // in seconds
    if (diff < 0) diff = 0;
    const hours = Math.floor(diff / 3600);
    const mins = Math.floor((diff % 3600) / 60);
    const secs = diff % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `Durasi : ${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  };

  const calculateCurrentCost = (session: RentalSession) => {
    const start = new Date(session.start_time);
    const now = new Date();
    let totalMinutes = 0;
    if (session.duration_minutes) {
      totalMinutes = session.duration_minutes;
    } else {
      const diffMs = now.getTime() - start.getTime();
      totalMinutes = Math.ceil(diffMs / (1000 * 60));
    }
    const console = consoles.find((c) => c.id === session.console_id);
    const rateProfile = rateProfiles.find(
      (r) => r.id === console?.rate_profile_id
    );
    const hourlyRate = rateProfile?.hourly_rate || 15000;
    if (totalMinutes <= 60) {
      return hourlyRate;
    } else {
      const extraMinutes = totalMinutes - 60;
      const perMinuteRate = hourlyRate / 60;
      return hourlyRate + Math.ceil(extraMinutes * perMinuteRate);
    }
  };

  const handleEndSession = async (sessionId: string) => {
    try {
      const session = activeSessions.find((s) => s.id === sessionId);
      if (!session) return;

      // Untuk BAYAR DIMUKA (prepaid), relay_command_off dijalankan di sini
      let isPrepaid =
        session.duration_minutes && session.payment_status === "paid";
      if (isPrepaid) {
        const consoleObj = consoles.find((c) => c.id === session.console_id);
        if (consoleObj?.relay_command_off) {
          fetch(consoleObj.relay_command_off).catch(() => {});
        }
        if (consoleObj?.power_tv_command) {
          fetch(consoleObj.power_tv_command).catch(() => {});
        }
      }

      // Jika prepaid (bayar dimuka), langsung update status tanpa modal pembayaran
      if (session.duration_minutes && session.payment_status === "paid") {
        // Update rental session
        await supabase
          .from("rental_sessions")
          .update({
            end_time: new Date().toISOString(),
            status: "completed",
          })
          .eq("id", session.id);

        // Update console status
        await supabase
          .from("consoles")
          .update({ status: "available" })
          .eq("id", session.console_id);

        await loadData();
        Swal.fire(
          "Berhasil",
          "Rental telah diakhiri otomatis (bayar dimuka)",
          "success"
        );
        return;
      }

      // Untuk pay-as-you-go, buka modal pembayaran seperti biasa
      // Hitung total biaya rental
      const totalCost = calculateCurrentCost(session);

      // Ambil total produk dari rental_session_products
      let productsTotal = 0;
      try {
        const { data: productRows, error: productErr } = await supabase
          .from("rental_session_products")
          .select("quantity, price")
          .eq("session_id", session.id)
          .in("status", ["pending", "completed"]);
        if (!productErr && Array.isArray(productRows)) {
          productsTotal = productRows.reduce(
            (sum, item) => sum + (item.quantity || 0) * (item.price || 0),
            0
          );
        }
      } catch (e) {
        // Jika error, biarkan productsTotal = 0
      }

      // Tampilkan modal pembayaran kasir
      setShowPaymentModal({ session, productsTotal });
      setPaymentAmount(totalCost + productsTotal);
      setChangeAmount(0);
      // Proses update status rental & console dilakukan setelah pembayaran di modal
    } catch (error) {
      console.error("Error ending session:", error);
      Swal.fire("Error", "Gagal mengakhiri sesi rental", "error");
    }
  };

  // Fungsi proses pembayaran kasir
  const handleProcessPayment = async () => {
    if (!showPaymentModal) return;
    const { session, productsTotal } = showPaymentModal;
    const totalCost = calculateCurrentCost(session);
    const total = totalCost + productsTotal;

    if (paymentAmount < total) {
      Swal.fire("Error", "Nominal pembayaran kurang dari total", "warning");
      return;
    }

    try {
      // Jalankan relay_command_off untuk PAY AS YOU GO
      if (!session.duration_minutes) {
        const consoleObj = consoles.find((c) => c.id === session.console_id);
        if (consoleObj?.relay_command_off) {
          fetch(consoleObj.relay_command_off).catch(() => {});
        }
        if (consoleObj?.power_tv_command) {
          fetch(consoleObj.power_tv_command).catch(() => {});
        }
      }

      // Catat transaksi pembayaran ke sales/payments
      await supabase.from("sales").insert({
        customer_id: session.customer_id,
        subtotal: totalCost,
        tax: 0,
        discount: 0,
        total: total,
        payment_method: paymentMethod,
        payment_amount: paymentAmount,
        change_amount: paymentAmount - total,
        sale_date: new Date().toISOString(),
        cashier_id: null,
        session_id: null,
      });

      // Update rental session
      await supabase
        .from("rental_sessions")
        .update({
          end_time: new Date().toISOString(),
          total_amount: totalCost,
          status: "completed",
        })
        .eq("id", session.id);

      // Update console status
      await supabase
        .from("consoles")
        .update({ status: "available" })
        .eq("id", session.console_id);

      setShowPaymentModal(null);
      await loadData();
      Swal.fire(
        "Berhasil",
        "Pembayaran berhasil, rental telah diakhiri",
        "success"
      );
    } catch (error) {
      console.error("Error processing payment:", error);
      Swal.fire("Error", "Gagal memproses pembayaran", "error");
    }
  };

  const handleStartRental = async (consoleId: string) => {
    if (customerType === "member" && !selectedCustomerId) {
      Swal.fire("Error", "Silakan pilih customer terlebih dahulu", "warning");
      return;
    }
    if (customerType === "non-member" && !nonMemberName) {
      Swal.fire("Error", "Nama wajib diisi untuk non-member", "warning");
      return;
    }

    try {
      // Ambil data console terbaru dari database
      const { data: latestConsole, error: latestConsoleError } = await supabase
        .from("consoles")
        .select("*")
        .eq("id", consoleId)
        .single();
      if (latestConsoleError || !latestConsole) {
        Swal.fire("Error", "Gagal mengambil data console terbaru", "error");
        return;
      }

      // --- Cek status TV dan relay sebelum mulai rental, matikan otomatis jika masih ON ---
      let tvStatusNow = tvStatusJson?.toUpperCase?.() || "";
      let relayStatusNow = relayStatus?.toUpperCase?.() || "";
      if ((tvStatusNow === "ON" || relayStatusNow === "ON") && (latestConsole.power_tv_command || latestConsole.relay_command_off)) {
        // Matikan otomatis tanpa konfirmasi
        if (latestConsole.power_tv_command && tvStatusNow === "ON") {
          await fetch(latestConsole.power_tv_command).catch(() => {});
        }
        if (latestConsole.relay_command_off && relayStatusNow === "ON") {
          await fetch(latestConsole.relay_command_off).catch(() => {});
        }
        // Tunggu beberapa detik agar benar-benar OFF
        await new Promise((res) => setTimeout(res, 2000));
        // (Opsional) bisa fetch ulang status TV/relay jika ingin lebih akurat
      }

      // Jalankan power_tv_command jika ada (untuk TV)
      if (latestConsole.power_tv_command) {
        fetch(latestConsole.power_tv_command).catch(() => {});
      }
      // Jalankan relay_command_on jika ada (untuk relay)
      if (latestConsole.relay_command_on) {
        fetch(latestConsole.relay_command_on).catch(() => {});
      }

      let customerId = selectedCustomerId;

      // Jika non-member, buat customer baru
      if (customerType === "non-member") {
        // Prepare customer data
        const customerData: any = {
          name: nonMemberName,
          status: "active",
          join_date: new Date().toISOString().split("T")[0],
        };
        if (nonMemberPhone) {
          customerData.phone = nonMemberPhone;
        }
        const { data: insertedCustomer, error: insertError } = await supabase
          .from("customers")
          .insert(customerData)
          .select()
          .single();
        if (insertError) throw insertError;
        customerId = insertedCustomer.id;
      }

      // Hitung biaya jika prepaid
      let totalAmount = 0;
      let paidAmount = 0;
      let paymentStatus = "pending";

      let totalDurationMinutes =
        rentalType === "prepaid"
          ? rentalDurationHours * 60 + rentalDurationMinutes
          : null;

      if (rentalType === "prepaid") {
        const rateProfile = rateProfiles.find(
          (r) => r.id === latestConsole.rate_profile_id
        );
        const hourlyRate = rateProfile?.hourly_rate || 0;

        // Billing rule: minimal 1 jam, setelah itu per menit
        if (totalDurationMinutes! <= 60) {
          totalAmount = hourlyRate;
        } else {
          const extraMinutes = totalDurationMinutes! - 60;
          const perMinuteRate = hourlyRate / 60;
          totalAmount = hourlyRate + Math.ceil(extraMinutes * perMinuteRate);
        }
        paidAmount = totalAmount;
        paymentStatus = "paid";

        // Konfirmasi pembayaran
        const paymentResult = await Swal.fire({
          title: "Konfirmasi Pembayaran",
          html: `
            <div class="text-left">
              <p><strong>Durasi:</strong> ${rentalDurationHours} jam ${rentalDurationMinutes} menit</p>
              <p><strong>Tarif per jam:</strong> Rp ${hourlyRate.toLocaleString(
                "id-ID"
              )}</p>
              <p><strong>Total:</strong> Rp ${totalAmount.toLocaleString(
                "id-ID"
              )}</p>
            </div>
          `,
          icon: "info",
          showCancelButton: true,
          confirmButtonText: "Bayar",
          cancelButtonText: "Batal",
        });

        if (!paymentResult.isConfirmed) {
          return;
        }
      }

      // Create new rental session
      const { error: rentalError } = await supabase
        .from("rental_sessions")
        .insert({
          customer_id: customerId,
          console_id: consoleId,
          status: "active",
          payment_status: paymentStatus,
          total_amount: totalAmount,
          paid_amount: paidAmount,
          start_time: new Date().toISOString(),
          duration_minutes:
            rentalType === "prepaid" ? totalDurationMinutes : null,
        });
      if (rentalError) throw rentalError;

      // Update console status
      const { error: consoleError } = await supabase
        .from("consoles")
        .update({ status: "rented" })
        .eq("id", consoleId);
      if (consoleError) throw consoleError;

      setShowStartRentalModal(null);
      setSelectedCustomerId("");
      setCustomerType("member");
      setRentalType("pay-as-you-go");
      setRentalDurationHours(1);
      setRentalDurationMinutes(0);
      setNonMemberName("");
      setNonMemberPhone("");
      await loadData();
      Swal.fire("Berhasil", "Sesi rental berhasil dimulai", "success");
    } catch (error) {
      console.error("Error starting rental:", error);
      Swal.fire("Error", "Gagal memulai sesi rental", "error");
    }
  };

  // Product cart functions
  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.productId === product.id);
    let newQuantity = 1;
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        Swal.fire(
          "Stok Tidak Cukup",
          `Stok ${product.name} hanya tersisa ${product.stock}`,
          "warning"
        );
        return;
      }
      newQuantity = existingItem.quantity + 1;
      setCart(
        cart.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: newQuantity,
                total: newQuantity * item.price,
              }
            : item
        )
      );
    } else {
      const newItem: CartItem = {
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: 1,
        total: product.price,
      };
      setCart([...cart, newItem]);
    }

    // Simpan ke database sebagai pending jika sedang menambahkan produk pada sesi rental aktif
    if (showProductModal) {
      const sessionId = showProductModal;
      const cartItem = existingItem
        ? {
            ...existingItem,
            quantity: newQuantity,
            total: newQuantity * product.price,
          }
        : {
            productId: product.id,
            productName: product.name,
            price: product.price,
            quantity: 1,
            total: product.price,
          };

      // Cek apakah sudah ada data untuk session_id dan product_id
      supabase
        .from("rental_session_products")
        .select("id")
        .eq("session_id", sessionId)
        .eq("product_id", cartItem.productId)
        .single()
        .then(async ({ data, error }) => {
          if (error && error.code !== "PGRST116") {
            // Error selain not found
            console.error("Error checking pending product:", error);
            Swal.fire("Error", "Gagal cek produk pending", "error");
            return;
          }
          if (data) {
            // Sudah ada, update quantity dan total
            const { id } = data;
            const { quantity, total } = cartItem;
            const { price, product_name } = cartItem;
            const { productId } = cartItem;
            await supabase
              .from("rental_session_products")
              .update({ quantity, total, price, product_name })
              .eq("id", id);
          } else {
            // Belum ada, insert baru
            await supabase.from("rental_session_products").insert({
              session_id: sessionId,
              product_id: cartItem.productId,
              product_name: cartItem.productName,
              price: cartItem.price,
              quantity: cartItem.quantity,
              total: cartItem.total,
              status: "pending",
            });
          }
        });
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find((p) => p.id === productId);
    if (product && newQuantity > product.stock) {
      Swal.fire(
        "Stok Tidak Cukup",
        `Stok ${product.name} hanya tersisa ${product.stock}`,
        "warning"
      );
      return;
    }

    setCart(
      cart.map((item) =>
        item.productId === productId
          ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const handleCheckoutProducts = async (sessionId: string) => {
    if (cart.length === 0) {
      Swal.fire(
        "Keranjang Kosong",
        "Silakan pilih produk terlebih dahulu",
        "warning"
      );
      return;
    }

    try {
      const session = activeSessions.find((s) => s.id === sessionId);
      if (!session) return;

      // Calculate totals
      const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
      const total = subtotal;

      // Create sale in database
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
          customer_id: session.customer_id,
          subtotal: subtotal,
          tax: 0,
          discount: 0,
          total: total,
          payment_method: "cash",
          payment_amount: total,
          change_amount: 0,
          sale_date: new Date().toISOString(),
          cashier_id: null, // Will be updated when auth is implemented
          session_id: null, // Optional: link to cashier session if needed
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const saleItems = cart.map((item) => ({
        sale_id: sale.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      }));

      const { error: itemsError } = await supabase
        .from("sale_items")
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Update product stock
      for (const item of cart) {
        const { error: stockError } = await supabase
          .from("products")
          .select("stock")
          .eq("id", item.productId)
          .single()
          .then(({ data, error }) => {
            if (error) throw error;
            return supabase
              .from("products")
              .update({ stock: data.stock - item.quantity })
              .eq("id", item.productId);
          });

        if (stockError) throw stockError;
      }

      clearCart();
      setShowProductModal(null);
      await loadData();

      Swal.fire(
        "Berhasil",
        `Penjualan produk berhasil dicatat. Total: Rp ${total.toLocaleString(
          "id-ID"
        )}`,
        "success"
      );
    } catch (error) {
      console.error("Error processing sale:", error);
      Swal.fire("Error", "Gagal memproses penjualan produk", "error");
    }
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchProduct.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory && product.stock > 0;
  });

  const categories = [...new Set(products.map((p) => p.category))];
  const cartTotal = cart.reduce((sum, item) => sum + item.total, 0);

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

  const getConsoleRateProfile = (consoleId: string) => {
    const console = consoles.find((c) => c.id === consoleId);
    if (!console || !console.rate_profile_id) return null;
    return rateProfiles.find((r) => r.id === console.rate_profile_id);
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Console Management
        </h1>
        <p className="text-gray-600">
          Monitor all consoles and manage rental sessions
        </p>
      </div>

      {/* Time Display, Filter & View Mode Toggle */}
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600 animate-pulse" />
            <span className="text-xl font-bold font-mono">
              {currentTime.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          </div>
          {/* Search Console */}
          <input
            type="text"
            placeholder="Cari nama console..."
            value={searchConsole}
            onChange={(e) => setSearchConsole(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{ minWidth: 180 }}
          />
        </div>

        {/* Filter Buttons, View Mode Toggle & History Button */}
        <div className="flex gap-2 flex-wrap items-center">
          <button
            className={`px-4 py-2 rounded-lg font-medium border transition-colors ${
              consoleFilter === "all"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"
            }`}
            onClick={() => setConsoleFilter("all")}
          >
            Semua
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium border transition-colors ${
              consoleFilter === "available"
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-green-50"
            }`}
            onClick={() => setConsoleFilter("available")}
          >
            Available ({consoles.filter((c) => c.status === "available").length}
            )
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium border transition-colors ${
              consoleFilter === "rented"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"
            }`}
            onClick={() => setConsoleFilter("rented")}
          >
            Active ({consoles.filter((c) => c.status === "rented").length})
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium border transition-colors ${
              consoleFilter === "maintenance"
                ? "bg-red-600 text-white border-red-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-red-50"
            }`}
            onClick={() => setConsoleFilter("maintenance")}
          >
            Maintenance (
            {consoles.filter((c) => c.status === "maintenance").length})
          </button>
          <button
            className="px-4 py-2 rounded-lg font-medium border border-gray-400 bg-white text-gray-700 hover:bg-gray-100 ml-2"
            onClick={() => {
              setShowHistoryModal(true);
              loadHistorySessions(historyStartDate, historyEndDate);
            }}
            type="button"
          >
            Lihat History
          </button>
          {/* View Mode Toggle */}
          <div className="ml-2 flex gap-1">
            <button
              type="button"
              className={`px-3 py-2 rounded-lg font-medium border text-xs transition-colors ${
                viewMode === "simple"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"
              }`}
              onClick={() => setViewMode("simple")}
            >
              Simple
            </button>
            <button
              type="button"
              className={`px-3 py-2 rounded-lg font-medium border text-xs transition-colors ${
                viewMode === "detail"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"
              }`}
              onClick={() => setViewMode("detail")}
            >
              Detail
            </button>
            <button
              type="button"
              className={`px-3 py-2 rounded-lg font-medium border text-xs transition-colors ${
                viewMode === "list"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"
              }`}
              onClick={() => setViewMode("list")}
            >
              List
            </button>
          </div>
        </div>
      </div>
      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  History Active Rentals
                </h2>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              {/* Filter tanggal */}
              <form
                className="flex flex-wrap gap-4 mb-4 items-end"
                onSubmit={(e) => {
                  e.preventDefault();
                  setCurrentPage(1);
                  loadHistorySessions(historyStartDate, historyEndDate);
                }}
              >
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={historyStartDate}
                    onChange={(e) => setHistoryStartDate(e.target.value)}
                    className="border px-2 py-1 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    value={historyEndDate}
                    onChange={(e) => setHistoryEndDate(e.target.value)}
                    className="border px-2 py-1 rounded"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700"
                >
                  Filter
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-medium hover:bg-gray-300"
                  onClick={() => {
                    setHistoryStartDate("");
                    setHistoryEndDate("");
                    setCurrentPage(1);
                    loadHistorySessions();
                  }}
                >
                  Reset
                </button>
              </form>
              {loadingHistory ? (
                <div className="text-center py-8 text-gray-500">
                  Memuat data...
                </div>
              ) : historySessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Tidak ada history rental ditemukan.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-3 py-2 border">Waktu Mulai</th>
                          <th className="px-3 py-2 border">Waktu Selesai</th>
                          <th className="px-3 py-2 border">Customer</th>
                          <th className="px-3 py-2 border">Console</th>
                          <th className="px-3 py-2 border">Durasi</th>
                          <th className="px-3 py-2 border">Total</th>
                          <th className="px-3 py-2 border">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historySessions.map((session) => {
                          const start = new Date(session.start_time);
                          const end = session.end_time
                            ? new Date(session.end_time)
                            : null;
                          const duration = end
                            ? Math.round(
                                (end.getTime() - start.getTime()) / 60000
                              )
                            : null;
                          return (
                            <tr
                              key={session.id}
                              className="border-b hover:bg-gray-50"
                            >
                              <td className="px-3 py-2 border font-mono">
                                {start.toLocaleString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "2-digit",
                                })}
                              </td>
                              <td className="px-3 py-2 border font-mono">
                                {end
                                  ? end.toLocaleString("id-ID", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "2-digit",
                                    })
                                  : "-"}
                              </td>
                              <td className="px-3 py-2 border">
                                {session.customers?.name || "-"}
                              </td>
                              <td className="px-3 py-2 border">
                                {session.consoles?.name || "-"}
                              </td>
                              <td className="px-3 py-2 border">
                                {duration !== null
                                  ? `${Math.floor(duration / 60)}j ${
                                      duration % 60
                                    }m`
                                  : "-"}
                              </td>
                              <td className="px-3 py-2 border">
                                Rp{" "}
                                {session.total_amount.toLocaleString("id-ID")}
                              </td>
                              <td className="px-3 py-2 border">
                                {session.status.toUpperCase()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination Controls */}
                  <div className="flex justify-between items-center mt-4">
                    <button
                      className="px-3 py-1 rounded bg-gray-200 text-gray-700 font-medium hover:bg-gray-300"
                      disabled={currentPage === 1}
                      onClick={() => {
                        if (currentPage > 1) {
                          setCurrentPage(currentPage - 1);
                          loadHistorySessions(historyStartDate, historyEndDate);
                        }
                      }}
                    >
                      Previous
                    </button>
                    <div className="flex gap-1 items-center">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <button
                            key={page}
                            className={`px-2 py-1 rounded ${
                              page === currentPage
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-blue-100"
                            }`}
                            onClick={() => {
                              setCurrentPage(page);
                              loadHistorySessions(
                                historyStartDate,
                                historyEndDate
                              );
                            }}
                            disabled={page === currentPage}
                          >
                            {page}
                          </button>
                        )
                      )}
                    </div>
                    <button
                      className="px-3 py-1 rounded bg-gray-200 text-gray-700 font-medium hover:bg-gray-300"
                      disabled={currentPage === totalPages}
                      onClick={() => {
                        if (currentPage < totalPages) {
                          setCurrentPage(currentPage + 1);
                          loadHistorySessions(historyStartDate, historyEndDate);
                        }
                      }}
                    >
                      Next
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Console Grid */}
      {viewMode === "simple" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {(consoleFilter === "all"
            ? consoles
            : consoles.filter((c) => c.status === consoleFilter)
          )
            .filter((c) =>
              c.name.toLowerCase().includes(searchConsole.toLowerCase())
            )
            .map((console) => {
              const isActive = console.status === "rented";
              const activeSession = activeSessions.find(
                (s) => s.console_id === console.id
              );
              const rateProfile = getConsoleRateProfile(console.id);
              return (
                <div
                  key={console.id}
                  className={`rounded-lg shadow border text-xs p-2 flex flex-col items-stretch min-w-0 ${
                    console.status === "available"
                      ? "border-green-200 bg-white"
                      : console.status === "rented"
                      ? "border-blue-200 bg-white"
                      : "border-red-200 bg-white"
                  }`}
                  style={{ minWidth: 0 }}
                >
                  {/* Header */}
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-t-lg ${
                      console.status === "available"
                        ? "bg-purple-600"
                        : console.status === "rented"
                        ? "bg-purple-600"
                        : "bg-purple-600"
                    } text-white`}
                    style={{ fontSize: "0.95em" }}
                  >
                    <Gamepad2 className="h-4 w-4" />
                    <span className="font-semibold truncate">
                      {console.name}
                    </span>
                    {console.location && (
                      <span className="text-[10px] opacity-80 ml-auto">
                        {console.location}
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 flex flex-col gap-1 p-2">
                    {/* Tarif & Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {rateProfile
                          ? rateProfile.hourly_rate.toLocaleString("id-ID")
                          : "0"}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          console.status === "available"
                            ? "bg-green-500 text-white"
                            : console.status === "rented"
                            ? "bg-blue-500 text-white"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        {console.status === "available"
                          ? "READY"
                          : console.status === "rented"
                          ? "ACTIVE"
                          : "MAINT."}
                      </span>
                    </div>

                    {/* Active Session Info (simple) */}
                    {isActive && activeSession && (
                      <div className="mt-1 mb-1 p-1 bg-blue-50 rounded border border-blue-100 flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-blue-600" />
                          <span className="truncate font-semibold text-blue-800">
                            {activeSession.customers?.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px]">
                          <Clock className="h-3 w-3 text-purple-600 animate-pulse" />
                          {activeSession.duration_minutes
                            ? formatCountdownHMS(
                                countdownSeconds[activeSession.id] ?? 0
                              )
                            : formatElapsedHMS(activeSession.start_time)}
                        </div>
                        <div className="flex items-center gap-1 text-[11px]">
                          <span>
                            Rp{" "}
                            {calculateCurrentCost(activeSession).toLocaleString(
                              "id-ID"
                            )}
                          </span>
                          <span
                            className={`ml-auto font-bold text-[10px] px-2 py-0.5 rounded-full ${
                              activeSession.duration_minutes
                                ? "bg-purple-100 text-purple-700 border border-purple-300"
                                : "bg-green-100 text-green-700 border border-green-300"
                            }`}
                          >
                            {activeSession.duration_minutes
                              ? "BAYAR DIMUKA"
                              : "PAY AS YOU GO"}
                          </span>
                        </div>
                        {/* Status Relay dan power tv command */}
                   
                      </div>
                    )}

                    {/* Action Buttons (icon only, tooltip) */}
                    <div className="flex gap-1 mt-auto">
                      {console.status === "available" ? (
                        <button
                          onClick={() => setShowStartRentalModal(console.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1 rounded flex items-center justify-center text-xs"
                          title="Start Rental"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                      ) : console.status === "rented" && activeSession ? (
                        <button
                          onClick={() => handleEndSession(activeSession.id)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1 rounded flex items-center justify-center text-xs"
                          title="End Rental"
                        >
                          <Square className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          disabled
                          className="flex-1 bg-gray-400 text-white py-1 rounded flex items-center justify-center text-xs cursor-not-allowed"
                          title="In Maintenance"
                        >
                          <Wrench className="h-4 w-4" />
                        </button>
                      )}
                      {/* Tombol Tes TV */}
                      <button
                        onClick={async () => {
                          if (console.power_tv_command) {
                            try {
                              const response = await fetch(console.power_tv_command);
                              if (response.ok) {
                                Swal.fire('Tes TV', 'Perintah power ON dikirim ke TV.', 'success');
                              } else {
                                const text = await response.text();
                                console.error('Tes TV error:', response.status, text);
                                Swal.fire('Tes TV', `Gagal mengirim perintah ke TV. Status: ${response.status}`, 'error');
                              }
                            } catch (err) {
                              console.error('Tes TV fetch error:', err);
                              Swal.fire('Tes TV', 'Gagal mengirim perintah ke TV (fetch error).', 'error');
                            }
                          } else {
                            Swal.fire('Tes TV', 'Perintah power ON tidak tersedia.', 'info');
                          }
                        }}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-1 rounded flex items-center justify-center text-xs"
                        title="Tes TV (Power ON)"
                      >
                        <Power className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (console.status === "rented" && activeSession) {
                            setShowProductModal(activeSession.id);
                          } else {
                            Swal.fire(
                              "Info",
                              "Konsol harus dalam status aktif untuk menambahkan produk",
                              "info"
                            );
                          }
                        }}
                        className={`flex-1 ${
                          console.status === "rented"
                            ? "bg-orange-500 hover:bg-orange-600"
                            : "bg-gray-400 cursor-not-allowed"
                        } text-white py-1 rounded flex items-center justify-center text-xs`}
                        disabled={console.status !== "rented"}
                        title="Add Products"
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      ) : viewMode === "list" ? (
        // LIST MODE: Tampilkan dalam bentuk list
        <div className="divide-y divide-gray-200">
          {(consoleFilter === "all"
            ? consoles
            : consoles.filter((c) => c.status === consoleFilter)
          )
            .filter((c) =>
              c.name.toLowerCase().includes(searchConsole.toLowerCase())
            )
            .map((console) => {
              const isActive = console.status === "rented";
              const activeSession = activeSessions.find(
                (s) => s.console_id === console.id
              );
              const rateProfile = getConsoleRateProfile(console.id);
              return (
                <div
                  key={console.id}
                  className={`py-4 px-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 ${
                    console.status === "available"
                      ? "bg-green-50"
                      : console.status === "rented"
                      ? "bg-blue-50"
                      : "bg-red-50"
                  } rounded-lg transition-all`}
                >
                  {/* Left: Status & Console Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          console.status === "available"
                            ? "bg-green-500"
                            : console.status === "rented"
                            ? "bg-blue-500"
                            : "bg-red-500"
                        }`}
                      ></div>
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {console.name}
                      </h3>
                    </div>
                    <div className="text-sm text-gray-600 flex flex-wrap gap-4">
                      <div className="flex items-center gap-1">
                        <Gamepad2 className="h-4 w-4 text-gray-500" />
                        <span>{console.equipment_type_id}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span>
                          {rateProfile
                            ? rateProfile.hourly_rate.toLocaleString("id-ID")
                            : "0"}
                          /jam
                        </span>
                      </div>
                      {console.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span>{console.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Action & Status */}
                  <div className="shrink-0">
                    {isActive && activeSession ? (
                      <div className="flex flex-col items-end">
                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-bold rounded-full py-1 px-3 mb-2 border ${
                            activeSession.duration_minutes
                              ? "bg-purple-100 text-purple-800 border-purple-300"
                              : "bg-green-100 text-green-800 border-green-300"
                          }`}
                        >
                          {activeSession.duration_minutes
                            ? "BAYAR DIMUKA"
                            : "PAY AS YOU GO"}
                        </span>

                        {/* End Session Button */}
                        <button
                          onClick={() => handleEndSession(activeSession.id)}
                          className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2"
                          title="Akhiri Sesi"
                        >
                          <Square className="h-5 w-5" />
                          Akhiri Sesi
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowStartRentalModal(console.id)}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2"
                        title="Mulai Rental"
                      >
                        <Play className="h-5 w-5" />
                        Mulai Rental
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      ) : (
        // DETAIL MODE: Card besar (seperti sebelumnya)
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(consoleFilter === "all"
            ? consoles
            : consoles.filter((c) => c.status === consoleFilter)
          )
            .filter((c) =>
              c.name.toLowerCase().includes(searchConsole.toLowerCase())
            )
            .map((console) => {
              const isActive = console.status === "rented";
              const activeSession = activeSessions.find(
                (s) => s.console_id === console.id
              );
              const rateProfile = getConsoleRateProfile(console.id);
              return (
                <div
                  key={console.id}
                  className={`rounded-xl overflow-hidden shadow-sm border ${
                    console.status === "available"
                      ? "border-green-200 bg-white"
                      : console.status === "rented"
                      ? "border-blue-200 bg-white"
                      : "border-red-200 bg-white"
                  }`}
                >
                  {/* Header */}
                  <div
                    className={`p-4 ${
                      console.status === "available"
                        ? "bg-purple-600"
                        : console.status === "rented"
                        ? "bg-purple-600"
                        : "bg-purple-600"
                    } text-white`}
                  >
                    <div className="flex items-center gap-3">
                      <Gamepad2 className="h-6 w-6" />
                      <h3 className="font-semibold text-lg">{console.name}</h3>
                      {console.location && (
                        <span className="text-sm opacity-80">
                          {console.location}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          console.status === "available"
                            ? "bg-green-500 text-white"
                            : console.status === "rented"
                            ? "bg-blue-500 text-white"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        {console.status === "available"
                          ? "AVAILABLE"
                          : console.status === "rented"
                          ? "ACTIVE"
                          : "MAINTENANCE"}
                      </span>
                      {console.location && (
                        <span className="text-sm opacity-80">
                          {console.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4">
                    {/* Rate Info */}
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Tarif per Jam
                      </h4>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Per Jam</span>
                        <span className="font-semibold text-blue-600">
                          Rp{" "}
                          {rateProfile
                            ? rateProfile.hourly_rate.toLocaleString("id-ID")
                            : "0"}
                        </span>
                      </div>
                    </div>

                    {/* Active Session Info */}
                    {isActive && activeSession && (
                      <div
                        className={`mb-4 p-3 rounded-lg border ${
                          activeSession.duration_minutes
                            ? "bg-purple-50 border-purple-100"
                            : "bg-green-50 border-green-100"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-800">
                              {activeSession.customers?.name}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${
                              activeSession.duration_minutes
                                ? "bg-purple-100 text-purple-800 border-purple-300"
                                : "bg-green-100 text-green-800 border-green-300"
                            }`}
                          >
                            {activeSession.duration_minutes
                              ? "BAYAR DIMUKA"
                              : "PAY AS YOU GO"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-blue-600">Mulai:</span>
                            <p className="font-medium">
                              {new Date(
                                activeSession.start_time
                              ).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <div>
                            <span className="text-blue-600">Durasi:</span>
                            <p className="font-medium">
                              {activeSession.duration_minutes ? (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-purple-600 animate-pulse" />
                                  <span className="font-bold text-purple-700">
                                    {formatCountdown(
                                      countdownTimers[activeSession.id] || 0
                                    )}{" "}
                                    tersisa
                                  </span>
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-green-600 animate-pulse" />
                                  <span className="font-bold text-green-700">
                                    {formatElapsedHMS(activeSession.start_time)}
                                  </span>
                                </span>
                              )}
                            </p>
                          </div>
                          <div>
                            <span className="text-blue-600">Biaya:</span>
                            <p className="font-medium">
                              Rp{" "}
                              {calculateCurrentCost(
                                activeSession
                              ).toLocaleString("id-ID")}
                            </p>
                          </div>
                          <div>
                            <span className="text-green-700">Total Produk:</span>
                            <p className="font-medium">
                              Rp{" "}
                              {productsTotalMap[activeSession.id]?.toLocaleString("id-ID") ?? "0"}
                            </p>
                          </div>
                          <div>
                            <span className="text-blue-600">Status:</span>
                            <p className="font-medium">
                              {activeSession.payment_status.toUpperCase()}
                            </p>
                          </div>
                        </div>

                        {/* Live Timer Display */}
                        <div className="mt-2 pt-2 border-t border-blue-200">
                          <div className="text-center font-mono text-lg font-bold text-blue-700">
                            {activeSession.duration_minutes
                              ? formatCountdownHMS(
                                  countdownSeconds[activeSession.id] ?? 0
                                )
                              : formatElapsedHMS(activeSession.start_time)}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {console.status === "available" ? (
                      <button
                        onClick={() => setShowStartRentalModal(console.id)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mb-2"
                      >
                        <Play className="h-5 w-5" />
                        Start Rental
                      </button>
                    ) : console.status === "rented" && activeSession ? (
                      <button
                        onClick={() => handleEndSession(activeSession.id)}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mb-2"
                      >
                        <Square className="h-5 w-5" />
                        End Rental
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full bg-gray-400 text-white py-3 rounded-lg font-medium mb-2 cursor-not-allowed"
                      >
                        <Wrench className="h-5 w-5 inline mr-2" />
                        In Maintenance
                      </button>
                    )}

                    {/* Add Products Button */}
                    {!activeSession?.duration_minutes && (
                      <button
                        onClick={() => {
                          if (console.status === "rented" && activeSession) {
                            setShowProductModal(activeSession.id);
                          } else {
                            Swal.fire(
                              "Info",
                              "Konsol harus dalam status aktif untuk menambahkan produk",
                              "info"
                            );
                          }
                        }}
                        className={`w-full ${
                          console.status === "rented"
                            ? "bg-orange-500 hover:bg-orange-600"
                            : "bg-gray-400 cursor-not-allowed"
                        } text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2`}
                        disabled={console.status !== "rented"}
                      >
                        <ShoppingCart className="h-5 w-5" />
                        Add Products
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* No Consoles */}
      {consoles.length === 0 && (
        <div className="text-center py-12">
          <Gamepad2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Consoles Found
          </h3>
          <p className="text-gray-600">
            Add consoles to start managing rentals
          </p>
        </div>
      )}

      {/* Start Rental Modal */}
      {showStartRentalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Start New Rental
              </h2>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jenis Customer
                  </label>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => setCustomerType("member")}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border ${
                        customerType === "member"
                          ? "bg-blue-50 border-blue-500 text-blue-700"
                          : "bg-white border-gray-300 text-gray-700"
                      }`}
                    >
                      <Users className="h-5 w-5" />
                      <span className="font-medium">Member</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerType("non-member")}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border ${
                        customerType === "non-member"
                          ? "bg-blue-50 border-blue-500 text-blue-700"
                          : "bg-white border-gray-300 text-gray-700"
                      }`}
                    >
                      <UserPlus className="h-5 w-5" />
                      <span className="font-medium">Non-Member</span>
                    </button>
                  </div>

                  {customerType === "member" ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pilih Member
                      </label>
                      <select
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">-- Pilih Member --</option>
                        {customers.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name} - {customer.phone}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nama Non-Member
                        </label>
                        <input
                          type="text"
                          value={nonMemberName}
                          onChange={(e) => setNonMemberName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Masukkan nama customer"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nomor Telepon
                        </label>
                        <input
                          type="tel"
                          value={nonMemberPhone}
                          onChange={(e) => setNonMemberPhone(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Opsional"
                        />
                        <p className="text-xs text-gray-500 mt-1">Opsional</p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jenis Rental
                  </label>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => setRentalType("pay-as-you-go")}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border ${
                        rentalType === "pay-as-you-go"
                          ? "bg-green-50 border-green-500 text-green-700"
                          : "bg-white border-gray-300 text-gray-700"
                      }`}
                    >
                      <Clock className="h-5 w-5" />
                      <span className="font-medium">Pay As You Go</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRentalType("prepaid")}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border ${
                        rentalType === "prepaid"
                          ? "bg-green-50 border-green-500 text-green-700"
                          : "bg-white border-gray-300 text-gray-700"
                      }`}
                    >
                      <DollarSign className="h-5 w-5" />
                      <span className="font-medium">Bayar Dimuka</span>
                    </button>
                  </div>

                  {rentalType === "prepaid" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Durasi Rental
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="0"
                          value={rentalDurationHours}
                          onChange={(e) => {
                            const val = Math.max(
                              0,
                              parseInt(e.target.value) || 0
                            );
                            setRentalDurationHours(val);
                          }}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Jam"
                        />
                        <span className="self-center">jam</span>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={rentalDurationMinutes}
                          onChange={(e) => {
                            let val = Math.max(
                              0,
                              Math.min(59, parseInt(e.target.value) || 0)
                            );
                            setRentalDurationMinutes(val);
                          }}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Menit"
                        />
                        <span className="self-center">menit</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Jam dan menit akan digabung sebagai total durasi.
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Console Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Console:</span>
                      <span className="font-medium">{selectedConsole?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium">{selectedConsole?.location || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hourly Rate:</span>
                      <span className="font-medium">Rp {selectedConsole?.rate_profile_id ? (rateProfiles.find((r) => r.id === selectedConsole.rate_profile_id)?.hourly_rate.toLocaleString("id-ID") ?? "0") : "0"}/jam</span>
                    </div>
                    {/* Status TV & Relay */}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status TV:</span>
                      <span className="font-medium flex items-center gap-2">
                        {/* Metode pembacaan status TV dan relay disamakan */}
                        {tvStatusJson ? (
                          <span>{(() => {
                            try {
                              const obj = typeof tvStatusJson === 'string' ? JSON.parse(tvStatusJson) : tvStatusJson;
                              const status = typeof obj === 'object' && obj !== null && 'status' in obj ? obj.status : undefined;
                              if (typeof status === 'string') {
                                return status.trim().toUpperCase() === 'ON' ? 'ON' : 'OFF';
                              }
                              return '-';
                            } catch {
                              return '-';
                            }
                          })()}</span>
                        ) : (
                          <span>-</span>
                        )}
                        {selectedConsole?.perintah_cek_power_tv && (
                          <>
                            <button
                              type="button"
                              className="ml-2 px-2 py-0.5 text-xs rounded bg-gray-200 hover:bg-gray-300 border border-gray-300 text-gray-700"
                              onClick={() => {
                                Swal.fire('Isi Perintah perintah_cek_power_tv', `<pre style='text-align:left'>${selectedConsole.perintah_cek_power_tv}</pre>`, 'info');
                              }}
                            >
                              Lihat
                            </button>
                            <button
                              type="button"
                              className="ml-1 px-2 py-0.5 text-xs rounded bg-blue-200 hover:bg-blue-300 border border-blue-300 text-blue-700"
                              title="Refresh Status TV"
                              onClick={async () => {
                                if (selectedConsole?.perintah_cek_power_tv) {
                                  try {
                                    const res = await fetch(selectedConsole.perintah_cek_power_tv);
                                    const data = await res.json();
                                    setTvStatusJson(data);
                                  } catch (err) {
                                    setTvStatusJson('-');
                                  }
                                }
                              }}
                            >
                              &#x21bb;
                            </button>
                          </>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status Relay:</span>
                      <span className="font-medium flex items-center gap-2">
                        {/* Metode pembacaan status relay sesuai output baru */}
                        {relayStatus ? (
                          <span>{(() => {
                            try {
                              // Jika respons langsung 'ON' atau 'OFF'
                              if (typeof relayStatus === 'string') {
                                const trimmed = relayStatus.trim().toUpperCase();
                                if (trimmed === 'ON' || trimmed === 'OFF') {
                                  return trimmed;
                                }
                                // Coba parse JSON jika bukan string ON/OFF
                                const obj = JSON.parse(relayStatus);
                                if (typeof obj === 'object' && obj !== null && 'POWER' in obj && typeof obj.POWER === 'string') {
                                  const power = obj.POWER.trim().toUpperCase();
                                  if (power === 'ON' || power === 'OFF') {
                                    return power;
                                  }
                                }
                              }
                              // Jika relayStatus sudah object
                              if (typeof relayStatus === 'object' && relayStatus !== null && 'POWER' in relayStatus && typeof relayStatus.POWER === 'string') {
                                const power = relayStatus.POWER.trim().toUpperCase();
                                if (power === 'ON' || power === 'OFF') {
                                  return power;
                                }
                              }
                              return '-';
                            } catch {
                              return '-';
                            }
                          })()}</span>
                        ) : (
                          <span>-</span>
                        )}
                        {selectedConsole?.relay_command_status && (
                          <>
                            <button
                              type="button"
                              className="ml-2 px-2 py-0.5 text-xs rounded bg-gray-200 hover:bg-gray-300 border border-gray-300 text-gray-700"
                              onClick={() => {
                                Swal.fire('Isi Perintah relay_command_status', `<pre style='text-align:left'>${selectedConsole.relay_command_status}</pre>`, 'info');
                              }}
                            >
                              Lihat
                            </button>
                            <button
                              type="button"
                              className="ml-1 px-2 py-0.5 text-xs rounded bg-blue-200 hover:bg-blue-300 border border-blue-300 text-blue-700"
                              title="Refresh Status Relay"
                              onClick={async () => {
                                if (selectedConsole?.relay_command_status) {
                                  try {
                                    const res = await fetch(selectedConsole.relay_command_status);
                                    const data = await res.json();
                                    setRelayStatus(data);
                                  } catch (err) {
                                    setRelayStatus('-');
                                  }
                                }
                              }}
                            >
                              &#x21bb;
                            </button>
                          </>
                        )}
                      </span>
                    </div>
                    {/* Power TV Command */}
                    <div className="flex justify-between">
                      <span className="text-gray-600">power tv command:</span>
                      <span className="font-medium break-all">{selectedConsole?.power_tv_command || <span className="italic text-gray-400">(tidak ada)</span>}</span>
                    </div>
                    {/* Tombol Reset Status hanya muncul jika status TV atau Relay ON */}
                    {(() => {
                      // Cek status TV
                      let tvOn = false;
                      try {
                        if (tvStatusJson) {
                          const obj = typeof tvStatusJson === 'string' ? JSON.parse(tvStatusJson) : tvStatusJson;
                          const status = typeof obj === 'object' && obj !== null && 'status' in obj ? obj.status : undefined;
                          if (typeof status === 'string') {
                            tvOn = status.trim().toUpperCase() === 'ON';
                          }
                        }
                      } catch {}
                      // Cek status relay
                      let relayOn = false;
                      try {
                        if (relayStatus) {
                          if (typeof relayStatus === 'string') {
                            const trimmed = relayStatus.trim().toUpperCase();
                            if (trimmed === 'ON') relayOn = true;
                            else if (trimmed !== 'OFF') {
                              const obj = JSON.parse(relayStatus);
                              if (typeof obj === 'object' && obj !== null && 'POWER' in obj && typeof obj.POWER === 'string') {
                                relayOn = obj.POWER.trim().toUpperCase() === 'ON';
                              }
                            }
                          } else if (typeof relayStatus === 'object' && relayStatus !== null && 'POWER' in (relayStatus as any) && typeof (relayStatus as any).POWER === 'string') {
                            relayOn = (relayStatus as any).POWER.trim().toUpperCase() === 'ON';
                          }
                        }
                      } catch {}
                      if (!tvOn && !relayOn) return null;
                      return (
                        <div className="flex justify-center mt-6">
                          <button
                            type="button"
                            className="px-4 py-2 rounded bg-red-100 hover:bg-red-200 border border-red-300 text-red-700 font-semibold shadow-sm"
                            onClick={async () => {
                              // Matikan TV jika ON
                              if (tvOn && selectedConsole?.power_tv_command) {
                                try { await fetch(selectedConsole.power_tv_command); } catch {}
                              }
                              // Matikan relay jika ON
                              if (relayOn && selectedConsole?.relay_command_off) {
                                try { await fetch(selectedConsole.relay_command_off); } catch {}
                              }
                              // Refresh status TV
                              if (selectedConsole?.perintah_cek_power_tv) {
                                try {
                                  const res = await fetch(selectedConsole.perintah_cek_power_tv);
                                  const data = await res.json();
                                  setTvStatusJson(data);
                                } catch { setTvStatusJson('-'); }
                              }
                              // Refresh status relay
                              if (selectedConsole?.relay_command_status) {
                                try {
                                  const res = await fetch(selectedConsole.relay_command_status);
                                  const data = await res.json();
                                  setRelayStatus(data);
                                } catch { setRelayStatus('-'); }
                              }
                            }}
                          >
                            Reset Status
                          </button>
                        </div>
                      );
                    })()}
                    {rentalType === "prepaid" && (
                      <div className="flex justify-between border-t border-gray-200 pt-2 mt-2 font-medium">
                        <span className="text-gray-800">Total ({rentalDurationHours} jam {rentalDurationMinutes} menit):</span>
                        <span className="text-green-600">
                          {(() => {
                            const hourlyRate = selectedConsole?.rate_profile_id ? (rateProfiles.find((r) => r.id === selectedConsole.rate_profile_id)?.hourly_rate ?? 0) : 0;
                            const totalDurationMinutes = rentalDurationHours * 60 + rentalDurationMinutes;
                            let totalAmount = 0;
                            if (totalDurationMinutes <= 60) {
                              totalAmount = hourlyRate;
                            } else {
                              const extraMinutes = totalDurationMinutes - 60;
                              const perMinuteRate = hourlyRate / 60;
                              totalAmount = hourlyRate + Math.ceil(extraMinutes * perMinuteRate);
                            }
                            return `Rp ${totalAmount.toLocaleString("id-ID")}`;
                          })()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </form>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowStartRentalModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleStartRental(showStartRentalModal)}
                  disabled={
                    (customerType === "member" && !selectedCustomerId) ||
                    (customerType === "non-member" && !nonMemberName)
                  }
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {rentalType === "prepaid" ? "Bayar & Mulai" : "Mulai Rental"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Selection Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden flex">
            {/* Product List */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Select Products
                </h2>
                <button
                  onClick={() => {
                    setShowProductModal(null);
                    clearCart();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Produk Sudah Ditambahkan (Pending Payment) */}
              {billingProducts.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-md font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Produk Sudah Ditambahkan (Pending Payment)
                  </h3>
                  <div className="space-y-2">
                    {billingProducts.map((prod, idx) => (
                      <div
                        key={prod.product_id || idx}
                        className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2"
                      >
                        <div>
                          <span className="font-medium text-gray-900">
                            {prod.product_name}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            x{prod.quantity}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-yellow-700">
                            Rp {prod.price.toLocaleString("id-ID")}
                          </span>
                          <span className="ml-2 px-2 py-0.5 rounded-full bg-yellow-200 text-yellow-800 text-xs font-semibold">
                            Pending Payment
                          </span>
                          <button
                            onClick={async () => {
                              const result = await Swal.fire({
                                title: "Konfirmasi",
                                text: `Hapus produk ${prod.product_name} dari billing?`,
                                icon: "warning",
                                showCancelButton: true,
                                confirmButtonText: "Ya, hapus",
                                cancelButtonText: "Batal",
                              });
                              if (result.isConfirmed) {
                                try {
                                  await deleteSaleItem(
                                    prod.product_id,
                                    prod.session_id
                                  );
                                  await loadData();
                                  // Refresh billingProducts
                                  const { data: billingData } = await supabase
                                    .from("rental_session_products")
                                    .select("*")
                                    .eq("session_id", prod.session_id)
                                    .eq("status", "pending");
                                  setBillingProducts(billingData || []);
                                  Swal.fire(
                                    "Berhasil",
                                    "Produk berhasil dihapus dari billing.",
                                    "success"
                                  );
                                } catch (err) {
                                  Swal.fire(
                                    "Gagal",
                                    "Gagal menghapus produk dari database.",
                                    "error"
                                  );
                                }
                              }
                            }}
                            className="ml-2 text-red-500 hover:text-red-700 px-2 py-1 rounded"
                            title="Hapus produk dari billing"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Total Produk Pending Payment */}
                  <div className="flex justify-between items-center mt-4 px-3 py-2 bg-yellow-100 rounded-lg font-bold text-yellow-800">
                    <span>Total Produk Pending Payment:</span>
                    <span>
                      Rp{" "}
                      {billingProducts
                        .reduce(
                          (total, prod) => total + prod.price * prod.quantity,
                          0
                        )
                        .toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              )}

              {/* Search and Filter */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="mb-3">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                          product.category
                        )}`}
                      >
                        {product.category}
                      </span>
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-2">
                      {product.name}
                    </h3>

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-blue-600">
                        Rp {product.price.toLocaleString("id-ID")}
                      </span>
                      <span className="text-sm text-gray-500">
                        Stock: {product.stock}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-8">
                  <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Tidak ada produk ditemukan</p>
                </div>
              )}
            </div>

            {/* Cart Sidebar */}
            <div className="w-96 bg-gray-50 border-l border-gray-200 flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Keranjang ({cart.length})
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {cart.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Keranjang kosong</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div
                        key={item.productId}
                        className="bg-white rounded-lg p-4 border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">
                            {item.productName}
                          </h4>
                          <button
                            onClick={async () => {
                              const result = await Swal.fire({
                                title: "Konfirmasi",
                                text: `Hapus produk ${item.productName} dari keranjang?`,
                                icon: "warning",
                                showCancelButton: true,
                                confirmButtonText: "Ya, hapus",
                                cancelButtonText: "Batal",
                              });
                              if (result.isConfirmed) {
                                setCart((prev) =>
                                  prev.filter(
                                    (cartItem) =>
                                      cartItem.productId !== item.productId
                                  )
                                );
                                Swal.fire(
                                  "Berhasil",
                                  "Produk dihapus dari keranjang.",
                                  "success"
                                );
                              }
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-700">
                              x{item.quantity}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-blue-700">
                              Rp {item.price.toLocaleString("id-ID")}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="border-t border-gray-200 p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>Rp {cartTotal.toLocaleString("id-ID")}</span>
                    </div>
                    <div className="space-y-2">
                      {/* Tombol Tambahkan ke Billing hanya muncul untuk Pay As You Go dan billing belum dibayar */}
                      {(() => {
                        const session = activeSessions.find(
                          (s) => s.id === showProductModal
                        );
                        if (
                          session &&
                          !session.duration_minutes &&
                          session.payment_status !== "paid"
                        ) {
                          return (
                            <button
                              onClick={async () => {
                                try {
                                  for (const item of cart) {
                                    const existing = billingProducts.find(
                                      (bp) => bp.product_id === item.productId
                                    );
                                    if (existing) {
                                      // Update quantity jika sudah ada
                                      await supabase
                                        .from("rental_session_products")
                                        .update({
                                          quantity: existing.quantity + item.quantity,
                                          total: (existing.quantity + item.quantity) * item.price,
                                        })
                                        .eq("session_id", session.id)
                                        .eq("product_id", item.productId)
                                        .eq("status", "pending");
                                    } else {
                                      // Insert baru jika belum ada
                                      await supabase
                                        .from("rental_session_products")
                                        .insert({
                                          session_id: session.id,
                                          product_id: item.productId,
                                          product_name: item.productName,
                                          quantity: item.quantity,
                                          price: item.price,
                                          total: item.price * item.quantity,
                                          status: "pending",
                                        });
                                    }
                                  }
                                  clearCart();
                                  await loadData();
                                  // Refresh billingProducts
                                  const { data: billingData } = await supabase
                                    .from("rental_session_products")
                                    .select("*")
                                    .eq("session_id", session.id)
                                    .eq("status", "pending");
                                  setBillingProducts(billingData || []);
                                  Swal.fire(
                                    "Berhasil",
                                    "Produk berhasil ditambahkan ke billing.",
                                    "success"
                                  );
                                } catch (err) {
                                  Swal.fire(
                                    "Gagal",
                                    "Gagal menambahkan produk ke billing.",
                                    "error"
                                  );
                                }
                              }}
                              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mb-2"
                            >
                              <ShoppingCart className="h-5 w-5" />
                              Tambahkan ke Billing
                            </button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Pembayaran Kasir Style (Cashier) */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              {/* Header Total */}
              <div className="flex items-center justify-between mb-6">
                <div className="text-xl font-bold text-gray-700">Total:</div>
                <div className="text-2xl font-bold text-right text-blue-700">Rp {(calculateCurrentCost(showPaymentModal.session) + (showPaymentModal.productsTotal ?? 0)).toLocaleString("id-ID")}</div>
              </div>
              {/* Metode Pembayaran */}
              <div className="mb-4">
                <div className="mb-2 font-medium text-gray-700">Metode Pembayaran</div>
                <div className="flex gap-2 mb-2">
                  {[
                    { key: 'cash', label: 'Cash', icon: <span className="inline-block mr-1">💵</span> },
                    { key: 'card', label: 'Card', icon: <span className="inline-block mr-1">💳</span> },
                    { key: 'transfer', label: 'Transfer', icon: <span className="inline-block mr-1">🏦</span> },
                  ].map((method) => (
                    <button
                      key={method.key}
                      type="button"
                      className={`flex-1 py-2 rounded-md font-semibold border text-base transition-colors flex items-center justify-center gap-2 ${paymentMethod === method.key ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                      onClick={() => setPaymentMethod(method.key as typeof paymentMethod)}
                    >
                      {method.icon} {method.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Customer & Rental Info */}
              <div className="mb-4 text-sm text-gray-600">
                <div className="flex justify-between"><span>Customer:</span><span className="font-medium">{showPaymentModal.session.customers?.name}</span></div>
                <div className="flex justify-between"><span>Durasi:</span><span className="font-medium">{formatElapsedHMS(showPaymentModal.session.start_time)}</span></div>
                <div className="flex justify-between"><span>Total Rental:</span><span className="font-medium">Rp {calculateCurrentCost(showPaymentModal.session).toLocaleString("id-ID")}</span></div>
                <div className="flex justify-between"><span>Total Produk:</span><span className="font-medium">Rp {(showPaymentModal.productsTotal ?? 0).toLocaleString("id-ID")}</span></div>
              </div>
              {/* Jumlah Bayar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-700">Jumlah Bayar</div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={`text-xs px-2 py-1 rounded border ${!isManualInput ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-700'}`}
                      onClick={() => { setIsManualInput(false); setPaymentAmount(0); }}
                    >
                      Quick
                    </button>
                    <button
                      type="button"
                      className={`text-xs px-2 py-1 rounded border ${isManualInput ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-700'}`}
                      onClick={() => { setIsManualInput(true); setPaymentAmount(0); }}
                    >
                      Manual
                    </button>
                    <button
                      type="button"
                      className="text-xs px-2 py-1 rounded border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 ml-2"
                      onClick={() => setPaymentAmount(0)}
                    >
                      × Clear
                    </button>
                  </div>
                </div>
                {!isManualInput ? (
                  <>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {[1000, 5000, 10000, 20000, 50000, 100000].map((nom) => (
                        <button
                          key={nom}
                          type="button"
                          className="py-3 rounded font-bold border border-green-200 text-green-800 text-base bg-green-50 hover:bg-green-100"
                          onClick={() => setPaymentAmount((prev) => prev + nom)}
                        >
                          {nom >= 1000 ? `${nom/1000}K` : nom}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="w-full py-2 rounded bg-blue-100 border border-blue-200 text-blue-800 font-bold text-base hover:bg-blue-200 mb-2"
                    onClick={() => setPaymentAmount(calculateCurrentCost(showPaymentModal.session) + (showPaymentModal.productsTotal ?? 0))}
                    >
                      LUNAS (Rp {(calculateCurrentCost(showPaymentModal.session) + (showPaymentModal.productsTotal ?? 0)).toLocaleString("id-ID")})
                    </button>
                  </>
                ) : (
                  <input
                    type="number"
                    min={0}
                    value={paymentAmount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setPaymentAmount(val);
                    }}
                    className="w-full px-3 py-3 border rounded text-center text-2xl font-mono mb-2"
                    placeholder="Masukkan nominal bayar"
                  />
                )}
                <div className="text-center text-3xl font-mono font-bold py-2 border-b border-gray-200 mb-2">
                  Rp {paymentAmount.toLocaleString("id-ID")}
                </div>
              </div>
              {/* Change */}
              <div className="mb-4">
                <div className="font-medium text-gray-700 mb-1">Kembalian</div>
                <div className="text-2xl font-mono font-bold text-green-700 text-center">
                  Rp {(paymentAmount - (calculateCurrentCost(showPaymentModal.session) + (showPaymentModal.productsTotal ?? 0)) > 0 ? (paymentAmount - (calculateCurrentCost(showPaymentModal.session) + (showPaymentModal.productsTotal ?? 0))).toLocaleString("id-ID") : 0)}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowPaymentModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleProcessPayment}
                  className={`flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors ${paymentAmount < (calculateCurrentCost(showPaymentModal.session) + (showPaymentModal.productsTotal ?? 0)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={paymentAmount < (calculateCurrentCost(showPaymentModal.session) + (showPaymentModal.productsTotal ?? 0))}
                >
                  Bayar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Panel summary stats di bawah dihapus sesuai permintaan */}
    </div>
  );
};

export default ActiveRentals;
