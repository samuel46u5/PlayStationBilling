import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import {
  isAuthorizedDeviceForBilling,
  ensureFingerprintReady,
} from "../utils/deviceFingerprint.ts";

interface MemberCardSession {
  id: string;
  customer_id?: string; // Optional - for tracking only
  console_id: string;
  card_uid?: string;
  start_time: string;
  hourly_rate_snapshot: number;
  per_minute_rate_snapshot: number;
  total_points_deducted: number;
  is_mode_esp32?: boolean;
}

let minMinutesCache: Record<string, number> = {};
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function getMinimumMinutesByConsole(consoleIds: string[]) {
  if (!consoleIds.length) return {};

  const now = Date.now();
  if (now - cacheTimestamp < CACHE_TTL && Object.keys(minMinutesCache).length > 0) {
    const result: Record<string, number> = {};
    for (const id of consoleIds) {
      result[id] = minMinutesCache[id] || 0;
    }
    return result;
  }

  const { data, error } = await supabase
    .from("consoles")
    .select("id, rate_profiles(minimum_minutes_member)")
    .in("id", consoleIds);
  if (error || !data) return {};

  const map: Record<string, number> = {};
  for (const row of data) {
    const min = Number(row?.rate_profiles[0]?.minimum_minutes_member) || 0;
    map[row.id] = min;
  }

  minMinutesCache = { ...minMinutesCache, ...map };
  cacheTimestamp = now;

  return map;
}

// Fungsi untuk ping ESP32
// async function pingESP32(ipAddress: string, timeout: number = 5000): Promise<boolean> {
//   try {
//     const controller = new AbortController();
//     const timeoutId = setTimeout(() => controller.abort(), timeout);

//     // Menggunakan fetch untuk ping ke ESP32 dengan mode no-cors untuk menghindari CORS issues
//     const response = await fetch(`http://${ipAddress}`, {
//       method: 'GET',
//       mode: 'no-cors',
//       signal: controller.signal,
//       headers: {
//         'Cache-Control': 'no-cache',
//       },
//     });

//     clearTimeout(timeoutId);
//     return true;
//   } catch (error) {
//     console.warn(`ESP32 ping timeout atau gagal untuk IP ${ipAddress}:`, error);
//     return false;
//   }
// }

async function pingESP32(
  ipAddress: string,
  timeout: number = 5000
): Promise<boolean> {
  try {
    // Validasi IP address
    if (!ipAddress || ipAddress.trim() === "") {
      console.warn("IP address kosong");
      return false;
    }

    // Validasi format IP address sederhana
    const ipRegex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(ipAddress.trim())) {
      console.warn(`Format IP address tidak valid: ${ipAddress}`);
      return false;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    try {
      // Coba dengan mode cors terlebih dahulu untuk mendapatkan response status
      const response = await fetch(`http://${ipAddress}`, {
        method: "GET",
        mode: "cors",
        signal: controller.signal,
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      clearTimeout(timeoutId);

      // Jika response OK, ESP32 aktif
      if (response.ok) {
        console.log(`ESP32 ping berhasil untuk IP ${ipAddress}`);
        return true;
      } else {
        console.warn(
          `ESP32 ping gagal untuk IP ${ipAddress}, status: ${response.status}`
        );
        return false;
      }
    } catch (corsError) {
      // Jika CORS error, coba dengan mode no-cors sebagai fallback
      console.log(`CORS error untuk IP ${ipAddress}, mencoba mode no-cors...`);

      try {
        await fetch(`http://${ipAddress}`, {
          method: "GET",
          mode: "no-cors",
          signal: controller.signal,
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        clearTimeout(timeoutId);

        // Dengan mode no-cors, jika tidak ada error berarti koneksi berhasil
        console.log(`ESP32 ping berhasil (no-cors) untuk IP ${ipAddress}`);
        return true;
      } catch (noCorsError) {
        clearTimeout(timeoutId);
        console.warn(
          `ESP32 ping gagal (no-cors) untuk IP ${ipAddress}:`,
          noCorsError
        );
        return false;
      }
    }
  } catch (error) {
    console.warn(`ESP32 ping error untuk IP ${ipAddress}:`, error);
    return false;
  }
}

let globalBillingLock = false;
let lastBillingTime = 0;
const BILLING_INTERVAL = 60 * 1000; 
const MIN_BILLING_INTERVAL = 30 * 1000;

export const useMemberCardBilling = () => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedSessions = useRef<Set<string>>(new Set());
  useEffect(() => {
    ensureFingerprintReady();
    const processMemberCardBilling = async () => {
      const now = Date.now();
      
      // **PERIOD LOCK**: Cegah billing terlalu sering
      if (now - lastBillingTime < MIN_BILLING_INTERVAL) {
        console.log(`[BILLING] Skipped - too soon since last billing (${(now - lastBillingTime)/1000}s ago)`);
        return;
      }
      
      // **GLOBAL LOCK**: Cegah concurrent billing
      if (globalBillingLock) {
        console.log("[BILLING] Skipped - another billing process is running");
        return;
      }
      
      globalBillingLock = true;
      lastBillingTime = now;
      try {
        // Check apakah device ini yang authorized untuk melakukan billing
        const isAuthorized = await isAuthorizedDeviceForBilling();

        if (!isAuthorized) {
          console.log(
            "Device tidak authorized untuk melakukan billing, skip..."
          );
          return;
        }

        const { data: freshActiveSessions, error: sessionError } = await supabase
          .from("rental_sessions")
          .select(`
            *,
            consoles(name, location, rate_profiles(minimum_minutes_member))
          `)
          .eq("status", "active")
          .not("card_uid", "is", null);

        if (sessionError || !freshActiveSessions) {
          console.error("Error fetching fresh sessions:", sessionError);
          return;
        }

        // Ambil semua sesi member-card aktif
        const memberCardSessions = freshActiveSessions.filter(
          (session) =>
            session.status === "active" &&
            // session.is_voucher_used &&
            session.start_time &&
            session.card_uid
        ) as MemberCardSession[];

        if (memberCardSessions.length === 0) {
          return;
        }

        const currentSessionIds = new Set(memberCardSessions.map(s => s.id));
        const newSessions = [...currentSessionIds].filter(id => !lastProcessedSessions.current.has(id));
        
        if (newSessions.length === 0) {
          console.log(`[BILLING] No new sessions to process (${currentSessionIds.size} total)`);
          return;
        }

        console.log(`[BILLING] Processing ${memberCardSessions.length} sessions (${newSessions.length} new)`);
        lastProcessedSessions.current = currentSessionIds;

        const now = new Date();

        // Group sessions by console untuk bulk processing
        const sessionsByConsole = memberCardSessions.reduce((acc, session) => {
          const consoleId = session.console_id;
          if (!acc[consoleId]) {
            acc[consoleId] = [];
          }
          acc[consoleId].push(session);
          return acc;
        }, {} as Record<string, MemberCardSession[]>);

        console.log(`[BULK] Processing ${memberCardSessions.length} sessions across ${Object.keys(sessionsByConsole).length} consoles`);

        // Process per console secara parallel
        const consolePromises = Object.entries(sessionsByConsole).map(
          async ([consoleId, sessions]) => {
            try {
              await processConsoleBilling(consoleId, sessions, now);
            } catch (error) {
              console.error(`[BULK] Error processing console ${consoleId}:`, error);
              // Continue dengan console lain meski ada error
            }
          }
        );

        // Tunggu semua console selesai
        const consoleResults = await Promise.allSettled(consolePromises);

        // Log summary
        const successfulConsoles = consoleResults.filter(result => result.status === 'fulfilled').length;
        const failedConsoles = consoleResults.filter(result => result.status === 'rejected').length;

        console.log(`[BULK] Completed: ${successfulConsoles} consoles successful, ${failedConsoles} failed`);

        if (failedConsoles > 0) {
          console.warn(`[BULK] ${failedConsoles} consoles had errors - check logs above`);
        }
      } catch (error) {
        console.error("Error in member card billing:", error);
      } finally {
        globalBillingLock = false;
      }
    };

    // Jalankan billing setiap 60 detik
    intervalRef.current = setInterval(processMemberCardBilling, BILLING_INTERVAL);

    const initialTimeout = setTimeout(processMemberCardBilling, 5000);
    // Jalankan sekali saat mount
    // processMemberCardBilling();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      clearTimeout(initialTimeout);
      globalBillingLock = false;
    };
  }, []);

  const processSessionBilling = async (
    session: MemberCardSession,
    now: Date,
    minMinutesMap: Record<string, number>
  ) => {
    // **ENHANCED IDEMPOTENCY**: Database-level period lock
    const sessionBillingCheck = await supabase
    .from("rental_sessions")
    .select("last_billing_at, total_points_deducted")
    .eq("id", session.id)
    .single();

    if (sessionBillingCheck.data?.last_billing_at) {
      const timeSinceLastBilling = now.getTime() - new Date(sessionBillingCheck.data.last_billing_at).getTime();
      if (timeSinceLastBilling < MIN_BILLING_INTERVAL) {
        console.log(`[Session ${session.id}] Skipped - billed ${timeSinceLastBilling/1000}s ago`);
        return;
      }
    }

    const startTime = new Date(session.start_time);
    const elapsedMinutes = Math.ceil(
      (now.getTime() - startTime.getTime()) / 60000
    );
    const minimumMinutes = minMinutesMap[session.console_id] || 0;

    // Hitung expected points berdasarkan waktu berjalan
    let expectedPoints = 0;
    if (minimumMinutes === 0) {
      expectedPoints = elapsedMinutes * session.per_minute_rate_snapshot;
    } else if (elapsedMinutes <= minimumMinutes) {
      // Minimal 1 jam
      expectedPoints = session.hourly_rate_snapshot;
    } else {
      // 1 jam + menit tambahan
      const extraMinutes = elapsedMinutes - minimumMinutes;
      expectedPoints =
        session.hourly_rate_snapshot +
        extraMinutes * session.per_minute_rate_snapshot;
    }

    // Hitung delta yang perlu dipotong
    const deltaPoints = expectedPoints - session.total_points_deducted;

    if (deltaPoints <= 0) {
      return; // Tidak ada yang perlu dipotong
    }

    // Ambil saldo kartu saat ini (guarded) & current session counters (fresh)
    const [
      { data: cardData, error: cardError },
      { data: freshSessionRows, error: freshSessErr },
    ] = await Promise.all([
      supabase
        .from("rfid_cards")
        .select("balance_points, status")
        .eq("uid", session.card_uid)
        .single(),
      supabase
        .from("rental_sessions")
        .select("id,total_points_deducted,is_mode_esp32")
        .eq("id", session.id)
        .limit(1),
    ]);

    if (cardError || !cardData) {
      console.error(
        `Error fetching card balance for session ${session.id}:`,
        cardError
      );
      return;
    }

    if (cardData.status !== "active") {
      console.error(
        `Card ${session.card_uid} is not active for session ${session.id}`
      );
      return;
    }
    if (freshSessErr || !freshSessionRows || freshSessionRows.length === 0) {
      console.error(
        `Error fetching fresh session for ${session.id}:`,
        freshSessErr
      );
      return;
    }
    const freshSession = freshSessionRows[0] as {
      total_points_deducted: number;
      is_mode_esp32?: boolean;
    };

    const currentBalance = Number(cardData.balance_points) || 0;
    const currentTotal = Number(freshSession.total_points_deducted) || 0;
    const computedDelta = expectedPoints - currentTotal;
    if (computedDelta <= 0) {
      // Sudah dipotong oleh klien lain
      return;
    }

    // Lakukan pemotongan points
    if (computedDelta <= currentBalance) {
      // Cukup saldo: kurangi sebesar computedDelta seperti biasa
      const newBalance = currentBalance - computedDelta;

      // Guarded balance update (only if balance_points still >= computedDelta)
      const { data: updatedCardRows, error: updateBalanceError } =
        await supabase
          .from("rfid_cards")
          .update({ balance_points: newBalance })
          .eq("uid", session.card_uid)
          .eq("status", "active")
          .gte("balance_points", computedDelta)
          .select("id");
      if (
        updateBalanceError ||
        !updatedCardRows ||
        updatedCardRows.length === 0
      ) {
        // Guard gagal karena race condition/saldo berubah.
        return;
      }

      // Guarded session counters update (optimistic concurrency)
      const { data: updatedSessRows, error: updateSessionError } =
        await supabase
          .from("rental_sessions")
          .update({
            total_points_deducted: currentTotal + computedDelta,
          })
          .eq("id", session.id)
          .eq("total_points_deducted", currentTotal)
          .select("id");

      if (
        updateSessionError ||
        !updatedSessRows ||
        updatedSessRows.length === 0
      ) {
        // Session sudah diupdate pihak lain → rollback saldo
        await supabase
          .from("rfid_cards")
          .update({ balance_points: currentBalance })
          .eq("uid", session.card_uid);
        return;
      }

      // PENTING: Kode return harus di dalam while loop di tempat yang benar
      // Untuk sementara, kita return di luar loop tapi menggunakan variable yang tersedia
      const finalBalance = currentBalance - computedDelta;
      const finalTotalDeducted = currentTotal + computedDelta;

      const logData = {
        card_uid: session.card_uid,
        session_id: session.id,
        action_type: "balance_deduct",
        points_amount: computedDelta,
        balance_before: currentBalance,
        balance_after: finalBalance,
        notes: `Automatic deduction for rental session - ${Math.round(computedDelta / session.per_minute_rate_snapshot)} minutes`,
      };

      console.log(`[Session ${session.id}] Deduction completed: ${computedDelta} points, balance: ${finalBalance}`);

      await supabase
      .from("rental_sessions")
      .update({ last_billing_at: now.toISOString() })
      .eq("id", session.id);

      // Return data untuk bulk processing (tidak trigger UI update di sini)
      return {
        success: true,
        sessionId: session.id,
        cardUid: session.card_uid,
        pointsDeducted: computedDelta,
        newTotalDeducted: finalTotalDeducted,
        cardBalance: finalBalance,
        logs: [logData]
      };
    } else {
      // Saldo tidak cukup: kurangi semua saldo yang tersisa hingga 0 dan akhiri sesi
      const partialDelta = currentBalance;
      if (partialDelta <= 0) {
        return;
      }

      // Guarded: set balance ke 0 hanya jika masih sama dengan currentBalance
      const { data: updatedCardRows2, error: updateBalanceError2 } =
        await supabase
          .from("rfid_cards")
          .update({ balance_points: 0 })
          .eq("uid", session.card_uid)
          .eq("status", "active")
          .eq("balance_points", currentBalance)
          .select("id");
      if (
        updateBalanceError2 ||
        !updatedCardRows2 ||
        updatedCardRows2.length === 0
      ) {
        console.error(`[Session ${session.id}] Failed to update balance for partial deduction`);
        return {
          success: false,
          sessionId: session.id,
          error: "Failed to update balance"
        };
      }

      // Update counters dengan partialDelta (optimistic concurrency)
      const { data: updatedSessRows2, error: updateSessionError2 } =
        await supabase
          .from("rental_sessions")
          .update({
            total_points_deducted: currentTotal + partialDelta,
          })
          .eq("id", session.id)
          .eq("total_points_deducted", currentTotal)
          .select("id");

      if (
        updateSessionError2 ||
        !updatedSessRows2 ||
        updatedSessRows2.length === 0
      ) {
        // Rollback saldo jika gagal update session
        console.error(`[Session ${session.id}] Failed to update session total for partial deduction, rolling back`);
        await supabase
          .from("rfid_cards")
          .update({ balance_points: currentBalance })
          .eq("uid", session.card_uid);
        return {
          success: false,
          sessionId: session.id,
          error: "Failed to update session total"
        };
      }

      // Generate partial deduction log data untuk bulk insert
      const partialLogData = {
        card_uid: session.card_uid,
        session_id: session.id,
        action_type: "balance_deduct",
        points_amount: partialDelta,
        balance_before: currentBalance,
        balance_after: 0,
        notes: `Partial deduction due to insufficient balance; auto ending session (${elapsedMinutes} minutes)`,
      };

      console.log(`[Session ${session.id}] Partial deduction completed: ${partialDelta} points, balance now 0`);

      // Akhiri sesi karena saldo habis
      // await endSessionWithESP32Check(session, false);
      const isESP32Mode = freshSession.is_mode_esp32 || session.is_mode_esp32;
      await endSessionWithESP32Check(session, isESP32Mode ?? false);

      console.log(`[Session ${session.id}] Deduction completed: ${computedDelta} points, balance now 0`);

      // Update last_billing_at setelah successful billing
      await supabase
        .from("rental_sessions")
        .update({ last_billing_at: now.toISOString() })
        .eq("id", session.id);

      // Return data untuk bulk processing
      return {
        success: true,
        sessionId: session.id,
        cardUid: session.card_uid,
        pointsDeducted: partialDelta,
        newTotalDeducted: currentTotal + partialDelta,
        cardBalance: 0,
        logs: [partialLogData]
      };
    }
  };

  const endSessionWithESP32Check = async (
    session: MemberCardSession,
    isModeESP32?: boolean
  ) => {
    try {
      // Jika mode ESP32, JANGAN akhiri sesi otomatis
      if (isModeESP32) {
        console.log(
          `Session ${session.id} menggunakan mode ESP32, skip auto end karena saldo habis.`
        );
        return;
      }

      // Bukan mode ESP32, maka langsung akhiri sesi
      console.log(
        `Session ${session.id} tidak menggunakan mode ESP32, langsung mengakhiri sesi.`
      );
      await endSessionDueToInsufficientBalance(session);
    } catch (error) {
      console.error(
        `Error dalam endSessionWithESP32Check untuk session ${session.id}:`,
        error
      );
      try {
        await endSessionDueToInsufficientBalance(session);
      } catch (endError) {
        console.error(`Error mengakhiri sesi ${session.id}:`, endError);
      }
    }
  };

  async function logCashierTransaction(params: {
    type: "sale" | "rental" | "voucher";
    amount: number;
    paymentMethod: "cash" | "qris" | "card" | "transfer";
    referenceId: string;
    description: string;
    details?: any;
  }) {
    try {
      const { data } = await supabase.auth.getUser();
      const cashierId = data?.user?.id ?? null;

      let sessionId: string | null = null;
      if (cashierId) {
        const { data: sessions } = await supabase
          .from("cashier_sessions")
          .select("id")
          .eq("cashier_id", cashierId)
          .eq("status", "active")
          .order("start_time", { ascending: false })
          .limit(1);
        if (Array.isArray(sessions) && sessions.length > 0) {
          sessionId = sessions[0].id;
        }
      }

      const pm =
        params.paymentMethod === "qris" ? "transfer" : params.paymentMethod;

      await supabase.from("cashier_transactions").insert({
        session_id: sessionId,
        type: params.type,
        amount: params.amount,
        payment_method: pm,
        reference_id: params.referenceId,
        description: params.description,
        cashier_id: cashierId,
        details: params.details ?? null,
      });
    } catch (err) {
      console.error("logCashierTransaction error:", err);
    }
  }

  const endSessionDueToInsufficientBalance = async (
    session: MemberCardSession
  ) => {
    try {
      const endTime = new Date().toISOString();

      // Hitung menit yang terpakai
      const startTime = session.start_time
        ? new Date(session.start_time)
        : new Date();
      const endTimeDate = new Date();
      const elapsedMinutes = Math.ceil(
        (endTimeDate.getTime() - startTime.getTime()) / (1000 * 60)
      );

      // Ambil total points terbaru dari database dan hitung balance yang benar
      // const { data: freshSessionData } = await supabase
      //   .from("rental_sessions")
      //   .select("total_points_deducted")
      //   .eq("id", session.id)
      //   .single();

      const [
        { data: freshSessionData },
        { data: cardData },
        { data: consoleData },
        { data: cardInfo },
        { data: capitalRow }
      ] = await Promise.all([
        supabase.from("rental_sessions").select("total_points_deducted").eq("id", session.id).single(),
        supabase.from("rfid_cards").select("uid, balance_points").eq("uid", session.card_uid).single(),
        supabase.from("consoles").select("name, power_tv_command, relay_command_off").eq("id", session.console_id).single(),
        supabase.from("rfid_cards").select("avg_nilai_point").eq("uid", session.card_uid).single(),
        supabase.from("consoles").select("rate_profiles(capital)").eq("id", session.console_id).single()
      ]);

      const totalPoints = freshSessionData?.total_points_deducted || 0;

      // Ambil data kartu dan console untuk details
      // const [{ data: cardData }, { data: consoleData }] = await Promise.all([
      //   supabase
      //     .from("rfid_cards")
      //     .select("uid, balance_points")
      //     .eq("uid", session.card_uid)
      //     .single(),
      //   supabase
      //     .from("consoles")
      //     .select("name, power_tv_command, relay_command_off")
      //     .eq("id", session.console_id)
      //     .single(),
      // ]);

      // Update session status
      await supabase
        .from("rental_sessions")
        .update({
          status: "completed",
          end_time: endTime,
        })
        .eq("id", session.id);

      // Set console available
      await supabase
        .from("consoles")
        .update({ status: "available" })
        .eq("id", session.console_id);

      // Matikan console jika ada perintah
      if (consoleData) {
        if (consoleData.power_tv_command) {
          fetch(consoleData.power_tv_command).catch(() => {});
        }
        if (consoleData.relay_command_off) {
          fetch(consoleData.relay_command_off).catch(() => {});
        }
      }

      // Note: Final logging removed - already handled by partial deduction logging above

      // const { data: cardInfo } = await supabase
      //   .from("rfid_cards")
      //   .select("avg_nilai_point")
      //   .eq("uid", session.card_uid)
      //   .single();

      const avgNilaiPoint = cardInfo?.avg_nilai_point ?? 0;
      // const { data: capitalRow } = await supabase
      //   .from("consoles")
      //   .select("rate_profiles(capital)")
      //   .eq("id", session.console_id)
      //   .single();
      const capitalPerHour = (capitalRow as any)?.rate_profiles?.capital ?? 0;
      const durationHours = elapsedMinutes / 60;
      const totalCapitalCost = capitalPerHour * durationHours;
      const profit = avgNilaiPoint * totalPoints - totalCapitalCost;

      // Log transaksi kasir dengan struktur yang kompatibel untuk print receipt
      await logCashierTransaction({
        type: "rental",
        amount: 0,
        paymentMethod: "cash",
        referenceId: `AUTO_END-${session.id}-${Date.now()}`,
        description: `Auto end (member card)}`,
        details: {
          items: [
            {
              name: `Rental ${consoleData?.name || "Console"}`,
              type: "rental",
              quantity: 1,
              total: totalPoints,
              description: `Member Card - ${elapsedMinutes} menit (Auto End)`,
              qty: 1,
              price: totalPoints,
              profit: profit,
              capital: totalCapitalCost,
              product_name: `Rental ${consoleData?.name || "Console"}`,
            },
          ],
          breakdown: {
            rental_cost: totalPoints,
            products_total: 0,
          },
          customer: {
            name: `Card ${cardData?.uid}` || "Unknown",
            id: null,
          },
          rental: {
            session_id: session.id,
            console: consoleData?.name,
            duration_minutes: elapsedMinutes,
            start_time: session.start_time,
            end_time: endTime,
          },
          member_card: {
            points_used: totalPoints,
            points_remaining: 0, // Balance is 0 after partial deduction
            points_deducted_final: totalPoints,
            hourly_rate_snapshot: session.hourly_rate_snapshot,
            per_minute_rate_snapshot: session.per_minute_rate_snapshot,
            avg_nilai_point: avgNilaiPoint,
            auto_end_reason: "insufficient_balance",
          },
          payment: {
            method: "member_card",
            amount: totalPoints,
            change: 0,
          },
          action: "auto_end_insufficient_balance",
          customer_id: null,
          console_id: session.console_id,
          elapsed_minutes: elapsedMinutes,
        },
      });

      await supabase
      .from("rfid_cards")
      .update({ 
        avg_nilai_point: 0,
        total_poin_ever: 0,
        total_uang_ever: 0
      })
      .eq("uid", session.card_uid);

      // Trigger UI refresh dengan custom event
      window.dispatchEvent(
        new CustomEvent("memberCardSessionEnded", {
          detail: { sessionId: session.id, reason: "insufficient_balance" },
        })
      );

      console.log(`Session ${session.id} ended due to insufficient balance`);
    } catch (error) {
      console.error(`Error ending session ${session.id}:`, error);
    }
  };

  // Function untuk process billing per console dengan bulk insert
  const processConsoleBilling = async (
    consoleId: string,
    sessions: MemberCardSession[],
    now: Date
  ) => {
    console.log(`[CONSOLE ${consoleId}] Processing ${sessions.length} sessions`);

    try {
      // Ambil minimum_minutes untuk console ini
      const minMinutesMap = await getMinimumMinutesByConsole([consoleId]);

      // Process semua sessions di console ini secara parallel
      const sessionPromises = sessions.map(session =>
        processSessionBilling(session, now, minMinutesMap)
      );

      // Tunggu semua sessions selesai
      const results = await Promise.allSettled(sessionPromises);

      // Kumpulkan logs dari sessions yang berhasil
      const successfulResults: any[] = [];
      const failedSessionIds: string[] = [];

      results.forEach((result, index) => {
        const session = sessions[index];
        if (result.status === 'fulfilled') {
          const sessionResult = result.value;
          if (sessionResult && sessionResult.success) {
            successfulResults.push(sessionResult);
          } else {
            console.error(`[CONSOLE ${consoleId}] Session ${session.id} deduction failed:`, sessionResult?.error || 'Unknown error');
            failedSessionIds.push(session.id);
          }
        } else {
          console.error(`[CONSOLE ${consoleId}] Session ${session.id} promise rejected:`, result.reason);
          failedSessionIds.push(session.id);
        }
      });

      // Ekstrak semua log data dari successful results
      const allLogs = successfulResults.flatMap(result => result.logs || []);
      const successfulSessionIds = successfulResults.map(result => result.sessionId);

      console.log(`[CONSOLE ${consoleId}] ${successfulResults.length}/${sessions.length} sessions successful, collected ${allLogs.length} logs`);

      // Lakukan bulk insert jika ada logs
      if (allLogs.length > 0) {
        const bulkResult = await performBulkInsert(consoleId, allLogs);

        if (bulkResult.success) {
          console.log(`[CONSOLE ${consoleId}] Bulk inserted ${allLogs.length} logs successfully`);

          // Trigger UI updates untuk semua sessions yang berhasil
          successfulResults.forEach(result => {
            if (result.sessionId && result.pointsDeducted) {
              window.dispatchEvent(
                new CustomEvent("memberCardBillingUpdate", {
                  detail: {
                    sessionId: result.sessionId,
                    cardUid: result.cardUid,
                    pointsDeducted: result.pointsDeducted,
                    newTotalDeducted: result.newTotalDeducted,
                    cardBalance: result.cardBalance,
                  },
                })
              );
            }
          });
        } else {
          console.error(`[CONSOLE ${consoleId}] Bulk insert failed, fallback completed`);
        }
      }

      // Log summary untuk console ini
      console.log(`[CONSOLE ${consoleId}] Completed: ${successfulSessionIds.length} successful, ${failedSessionIds.length} failed`);

      if (failedSessionIds.length > 0) {
        console.warn(`[CONSOLE ${consoleId}] Failed sessions:`, failedSessionIds);
      }

    } catch (error) {
      console.error(`[CONSOLE ${consoleId}] Console billing failed:`, error);
      throw error;
    }
  };

  // Function untuk perform bulk insert dengan fallback
  const performBulkInsert = async (consoleId: string, logs: any[]) => {
    try {
      console.log(`[CONSOLE ${consoleId}] Attempting bulk insert of ${logs.length} logs`);

      // Bulk insert attempt
      const { error: bulkError } = await supabase
        .from("card_usage_logs")
        .insert(logs);

      if (!bulkError) {
        return { success: true, method: 'bulk' };
      }

      console.warn(`[CONSOLE ${consoleId}] Bulk insert failed:`, bulkError);

      // Fallback: individual inserts dengan retry
      console.log(`[CONSOLE ${consoleId}] Falling back to individual inserts`);
      const individualResults = await performIndividualInserts(consoleId, logs);

      return {
        success: individualResults.successful > 0,
        method: 'individual',
        successful: individualResults.successful,
        failed: individualResults.failed
      };

    } catch (error) {
      console.error(`[CONSOLE ${consoleId}] Bulk insert exception:`, error);

      // Emergency fallback
      const individualResults = await performIndividualInserts(consoleId, logs);
      return {
        success: individualResults.successful > 0,
        method: 'emergency_individual',
        successful: individualResults.successful,
        failed: individualResults.failed
      };
    }
  };

  // Function untuk individual inserts sebagai fallback
  const performIndividualInserts = async (consoleId: string, logs: any[]) => {
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      let logRetryCount = 0;
      const maxLogRetries = 3;
      let logInserted = false;

      while (logRetryCount < maxLogRetries && !logInserted) {
        try {
          const { error } = await supabase
            .from("card_usage_logs")
            .insert(log);

          if (!error) {
            logInserted = true;
            successful++;
          } else {
            console.warn(`[CONSOLE ${consoleId}] Individual insert ${i + 1} attempt ${logRetryCount + 1} failed:`, error);
            logRetryCount++;
          }
        } catch (exception) {
          console.error(`[CONSOLE ${consoleId}] Individual insert ${i + 1} exception:`, exception);
          logRetryCount++;
        }

        if (!logInserted && logRetryCount < maxLogRetries) {
          await new Promise(resolve => setTimeout(resolve, 500 * logRetryCount));
        }
      }

      if (!logInserted) {
        failed++;
        console.error(`[CONSOLE ${consoleId}] Failed to insert log after ${maxLogRetries} attempts:`, log);
      }
    }

    console.log(`[CONSOLE ${consoleId}] Individual inserts: ${successful} successful, ${failed} failed`);
    return { successful, failed };
  };

  // Recovery mechanism untuk inkonsistensi yang sudah terjadi
  const recoverMissingLogs = async () => {
    try {
      console.log("[RECOVERY] Starting log recovery process...");

      // Cari session aktif yang mungkin memiliki inkonsistensi
      const { data: sessions } = await supabase
        .from("rental_sessions")
        .select("id, total_points_deducted, card_uid")
        .eq("status", "active")
        .gt("total_points_deducted", 0);

      let recoveryCount = 0;

      for (const session of sessions || []) {
        try {
          // Hitung total dari logs
          const { data: logs } = await supabase
            .from("card_usage_logs")
            .select("points_amount")
            .eq("session_id", session.id)
            .eq("action_type", "balance_deduct");

          const totalFromLogs = logs?.reduce((sum, log) => sum + Math.abs(log.points_amount), 0) || 0;
          const missingAmount = session.total_points_deducted - totalFromLogs;

          if (missingAmount > 0) {
            console.warn(`[RECOVERY] Session ${session.id} missing ${missingAmount} points in logs (DB: ${session.total_points_deducted}, Logs: ${totalFromLogs})`);

            // Insert recovery log dengan amount yang missing
            const { error: recoveryError } = await supabase
              .from("card_usage_logs")
              .insert({
                card_uid: session.card_uid,
                session_id: session.id,
                action_type: "balance_deduct",
                points_amount: missingAmount,
                balance_before: 0, // Unknown historical data
                balance_after: 0,  // Unknown historical data
                notes: `SYSTEM RECOVERY: Missing log for ${missingAmount} points - inserted ${new Date().toISOString()}`,
              });

            if (recoveryError) {
              console.error(`[RECOVERY] Failed to insert recovery log for session ${session.id}:`, recoveryError);
            } else {
              console.log(`[RECOVERY] Successfully inserted recovery log for session ${session.id}: ${missingAmount} points`);
              recoveryCount++;
            }
          }
        } catch (sessionError) {
          console.error(`[RECOVERY] Error processing session ${session.id}:`, sessionError);
        }
      }

      if (recoveryCount > 0) {
        console.log(`[RECOVERY] Completed recovery process. Fixed ${recoveryCount} sessions with missing logs.`);
      } else {
        console.log("[RECOVERY] No sessions needed recovery.");
      }

    } catch (error) {
      console.error("[RECOVERY] Recovery process failed:", error);
    }
  };

  // Jalankan recovery setiap 10 menit
  useEffect(() => {
    const recoveryInterval = setInterval(recoverMissingLogs, 10 * 60 * 1000);

    // Jalankan sekali saat mount (dengan delay 30 detik)
    const initialRecoveryTimeout = setTimeout(recoverMissingLogs, 30000);

    return () => {
      clearInterval(recoveryInterval);
      clearTimeout(initialRecoveryTimeout);
    };
  }, []);

  return {
    processSessionBilling,
    endSessionDueToInsufficientBalance,
    processConsoleBilling,
    recoverMissingLogs, // Export untuk manual recovery jika diperlukan
  };
};
