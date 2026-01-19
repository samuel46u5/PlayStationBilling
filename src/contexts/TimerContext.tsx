import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { supabase } from "../lib/supabase";
import Swal from "sweetalert2";
// import { useMemberCardBilling } from "../hooks/useMemberCardBilling";
import { isAuthorizedDeviceForBilling } from "../utils/deviceFingerprint.ts";

interface MemberCardSession {
  id: string;
  customer_id?: string;
  console_id: string;
  card_uid?: string;
  start_time: string;
  hourly_rate_snapshot: number;
  per_minute_rate_snapshot: number;
  total_points_deducted: number;
  is_mode_esp32?: boolean;
}

interface RentalSession {
  id: string;
  customer_id?: string;
  console_id?: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  total_amount: number;
  status: "active" | "completed" | "paused";
  payment_status: "pending" | "partial" | "paid";
  paid_amount: number;
  is_voucher_used?: boolean;
  hourly_rate_snapshot?: number;
  per_minute_rate_snapshot?: number;
  total_points_deducted?: number;
  // pause_start_time?: string;
  // total_pause_minutes?: number;
  consoles?: {
    name: string;
    location: string;
    rate_profiles?: {
      capital?: number;
    };
  };
}

interface TimerContextType {
  activeSessions: RentalSession[];
  checkSessionTimeout: (sessionId: string) => void;
  refreshActiveSessions: () => Promise<void>;
  isTimerRunning: boolean;
  triggerUnusedConsolesCheck: () => Promise<void>;
  isAuthorizedDevice: boolean;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error("useTimer must be used within a TimerProvider");
  }
  return context;
};

interface TimerProviderProps {
  children: React.ReactNode;
}

export const TimerProvider: React.FC<TimerProviderProps> = ({ children }) => {
  const [activeSessions, setActiveSessions] = useState<RentalSession[]>([]);
  const [isCheckingSessions, setIsCheckingSessions] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isAuthorizedDevice, setIsAuthorizedDevice] = useState(false);

  const [billingLock, setBillingLock] = useState(false);
  const [lastBillingTime, setLastBillingTime] = useState(0);
  const BILLING_INTERVAL = 60 * 1000;
  const MIN_BILLING_INTERVAL = 30 * 1000;

  // Member card billing hook
  // useMemberCardBilling(activeSessions);

  // Fetch active sessions from database
  const fetchActiveSessions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("rental_sessions")
        .select(
          `
          *,
          consoles(name, location, rate_profiles(capital))
        `
        )
        .in("status", ["active"]);

      if (error) {
        console.error("Error fetching active sessions:", error);
        return;
      }

      setActiveSessions(data || []);
    } catch (error) {
      console.error("Error in fetchActiveSessions:", error);
    }
  }, []);

  const retryFetch = async (
    url: string,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<boolean> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          console.log(
            `Berhasil mengirim perintah ke ${url} pada percobaan ${attempt}`
          );
          return true;
        } else {
          console.warn(
            `Percobaan ${attempt} gagal untuk ${url}: HTTP ${response.status}`
          );
        }
      } catch (error) {
        console.warn(`Percobaan ${attempt} gagal untuk ${url}:`, error);
      }

      // Jangan tunggu setelah percobaan terakhir
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    console.error(
      `Gagal mengirim perintah ke ${url} setelah ${maxRetries} percobaan`
    );
    return false;
  };

  // Check if a session has expired and end it automatically
  const checkSessionTimeout = useCallback(
    async (sessionId: string) => {
      try {
        const session = activeSessions.find((s) => s.id === sessionId);
        if (!session || !session.start_time || !session.duration_minutes) {
          return;
        }

        const startTime = new Date(session.start_time);
        const endTime = new Date(
          startTime.getTime() + session.duration_minutes * 60 * 1000
        );
        const now = new Date();

        // If session has expired
        if (now >= endTime) {
          console.log(
            `Session ${sessionId} has expired, ending automatically...`
          );

          // Find console for relay commands
          const { data: consoleData } = await supabase
            .from("consoles")
            .select("id, name, power_tv_command, relay_command_off")
            .eq("id", session.console_id)
            .single();

          // Execute relay commands if available
          // if (consoleData) {
          //   if (consoleData.power_tv_command) {
          //     fetch(consoleData.power_tv_command).catch(() => {});
          //   }
          //   if (consoleData.relay_command_off) {
          //     fetch(consoleData.relay_command_off).catch(() => {});
          //   }
          // }

          if (consoleData) {
            if (consoleData.power_tv_command) {
              await retryFetch(consoleData.power_tv_command, 3, 2000);
            }
            if (consoleData.relay_command_off) {
              await retryFetch(consoleData.relay_command_off, 3, 2000);
            }
          }

          // Update rental session
          // await supabase
          //   .from("rental_sessions")
          //   .update({
          //     end_time: now.toISOString(),
          //     status: "completed",
          //   })
          //   .eq("id", session.id);

          const updateRentalSession = supabase
            .from("rental_sessions")
            .update({
              end_time: now.toISOString(),
              status: "completed",
            })
            .eq("id", session.id);

          // Update console status with guard: only if no other active sessions exist for this console
          const { data: otherActiveSessions, error: activeErr } = await supabase
            .from("rental_sessions")
            .select("id")
            .eq("console_id", session.console_id)
            .eq("status", "active")
            .neq("id", session.id) 
            .limit(1);

          // const updateConsoleStatus = supabase
          //   .from("consoles")
          //   .update({ status: "available" })
          //   .eq("id", session.console_id);

          // await Promise.all([updateRentalSession, updateConsoleStatus]);

          const updates = [updateRentalSession];
          if (!activeErr && Array.isArray(otherActiveSessions) && otherActiveSessions.length === 0) {
            const updateConsoleStatus = supabase
              .from("consoles")
              .update({ status: "available" })
              .eq("id", session.console_id);
            updates.push(updateConsoleStatus);
          }

          await Promise.all(updates);

          // if (
          //   !activeErr &&
          //   Array.isArray(otherActiveSessions) &&
          //   otherActiveSessions.length === 0
          // ) {
          //   await supabase
          //     .from("consoles")
          //     .update({ status: "available" })
          //     .eq("id", session.console_id);
          // }

          // Finalize products and stock
          await finalizeProductsAndStock(session.id);

          // Show notification
          Swal.fire({
            title: "Session Berakhir",
            text: `Session ${
              session.consoles?.name || "Console"
            } telah berakhir otomatis`,
            icon: "info",
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 3000,
          });

          // Refresh active sessions
          await fetchActiveSessions();
        }
      } catch (error) {
        console.error("Error checking session timeout:", error);
      }
    },
    [activeSessions, fetchActiveSessions]
  );

  // Finalize products and stock (helper function)
  const finalizeProductsAndStock = async (sessionId: string) => {
    try {
      // Get pending product items for this session
      const { data: pendingItems, error: itemsErr } = await supabase
        .from("rental_session_products")
        .select("product_id, quantity, status")
        .eq("session_id", sessionId)
        .eq("status", "pending");

      if (itemsErr) throw itemsErr;
      if (!pendingItems || pendingItems.length === 0) return;

      // Mark pending items as completed
      const { error: updErr } = await supabase
        .from("rental_session_products")
        .update({ status: "completed" })
        .eq("session_id", sessionId)
        .eq("status", "pending");

      if (updErr) throw updErr;

      // Group quantities by product_id
      const qtyByProduct: Record<string, number> = {};
      for (const item of pendingItems) {
        const qty = Number(item.quantity) || 0;
        qtyByProduct[item.product_id] =
          (qtyByProduct[item.product_id] || 0) + qty;
      }

      const productIds = Object.keys(qtyByProduct);
      if (productIds.length === 0) return;

      // Get current stock
      const { data: products, error: prodErr } = await supabase
        .from("products")
        .select("id, stock")
        .in("id", productIds);

      if (prodErr) throw prodErr;

      // Reduce stock according to quantities
      // for (const product of products || []) {
      //   const used = qtyByProduct[product.id] || 0;
      //   const current = Number(product.stock) || 0;
      //   const newStock = current - used;
      //   const { error: updStockErr } = await supabase
      //     .from("products")
      //     .update({ stock: newStock })
      //     .eq("id", product.id);
      //   if (updStockErr) throw updStockErr;
      // }

      const updates = products.map((product) => ({
        id: product.id,
        stock: product.stock - qtyByProduct[product.id],
      }));
      await Promise.all(
        updates.map((update) =>
          supabase
            .from("products")
            .update({ stock: update.stock })
            .eq("id", update.id)
        )
      );
    } catch (error) {
      console.error("finalizeProductsAndStock error:", error);
    }
  };

  // Member card billing functions
  const processMemberCardBilling = useCallback(async () => {
    const now = new Date();
    
    // Instance-based period lock
    if (now.getTime() - lastBillingTime < MIN_BILLING_INTERVAL) {
      console.log(`[TIMER_BILLING] Skipped - too soon since last billing (${(now.getTime() - lastBillingTime)/1000}s ago)`);
      return;
    }
    
    // Instance-based global lock
    if (billingLock) {
      console.log("[TIMER_BILLING] Skipped - another billing process is running");
      return;
    }
    
    setBillingLock(true);
    setLastBillingTime(now.getTime());
    
    try {
      // Check device authorization
      const isAuthorized = await isAuthorizedDeviceForBilling();
      if (!isAuthorized) {
        console.log("Device tidak authorized untuk melakukan billing, skip...");
        return;
      }

      // Get fresh active sessions with member card
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

      // Filter member card sessions
      const memberCardSessions = freshActiveSessions.filter(
        (session) =>
          session.status === "active" &&
          session.start_time &&
          session.card_uid
      ) as MemberCardSession[];

      if (memberCardSessions.length === 0) {
        return;
      }

      console.log(`[TIMER_BILLING] Processing ${memberCardSessions.length} sessions`);

      // Group by console and process
      const sessionsByConsole = memberCardSessions.reduce((acc, session) => {
        const consoleId = session.console_id;
        if (!acc[consoleId]) {
          acc[consoleId] = [];
        }
        acc[consoleId].push(session);
        return acc;
      }, {} as Record<string, MemberCardSession[]>);

      // Process each console
      const consolePromises = Object.entries(sessionsByConsole).map(
        async ([consoleId, sessions]) => {
          try {
            await processConsoleBilling(consoleId, sessions, now);
          } catch (error) {
            console.error(`[TIMER_BILLING] Error processing console ${consoleId}:`, error);
          }
        }
      );

      await Promise.allSettled(consolePromises);
      
    } catch (error) {
      console.error("Error in member card billing:", error);
    } finally {
      setBillingLock(false);
    }
  }, [billingLock, lastBillingTime]);

  const processConsoleBilling = async (
    consoleId: string,
    sessions: MemberCardSession[],
    now: Date
  ) => {
    console.log(`[CONSOLE ${consoleId}] Processing ${sessions.length} sessions`);
    
    try {
      // Get minimum minutes for console
      const { data: consoleData } = await supabase
        .from("consoles")
        .select("rate_profiles(minimum_minutes_member)")
        .eq("id", consoleId)
        .single();
      
      const minMinutesMap: Record<string, number> = {};
      minMinutesMap[consoleId] = consoleData?.rate_profiles?.[0]?.minimum_minutes_member || 0;

      // Process each session
      const sessionPromises = sessions.map(session =>
        processSessionBilling(session, now, minMinutesMap)
      );

      const results = await Promise.allSettled(sessionPromises);
      
      // Collect logs from successful results
      const successfulResults: any[] = [];
      results.forEach((result, index) => {
        const session = sessions[index];
        if (result.status === 'fulfilled') {
          const sessionResult = result.value;
          if (sessionResult && sessionResult.success) {
            successfulResults.push(sessionResult);
          }
        }
      });

      // Bulk insert logs if any
      if (successfulResults.length > 0) {
        const allLogs = successfulResults.flatMap(result => result.logs || []);
        if (allLogs.length > 0) {
          await supabase.from("card_usage_logs").insert(allLogs);
          console.log(`[CONSOLE ${consoleId}] Bulk inserted ${allLogs.length} logs`);
        }
      }

    } catch (error) {
      console.error(`[CONSOLE ${consoleId}] Console billing failed:`, error);
    }
  };

  const processSessionBilling = async (
    session: MemberCardSession,
    now: Date,
    minMinutesMap: Record<string, number>
  ) => {
    // Database-level idempotency check
    const sessionBillingCheck = await supabase
      .from("rental_sessions")
      .select("last_billing_at, total_points_deducted")
      .eq("id", session.id)
      .single();

    if (sessionBillingCheck.data?.last_billing_at) {
      const timeSinceLastBilling = now.getTime() - new Date(sessionBillingCheck.data.last_billing_at).getTime();
      if (timeSinceLastBilling < MIN_BILLING_INTERVAL) {
        return;
      }
    }

    const startTime = new Date(session.start_time);
    const elapsedMinutes = Math.ceil((now.getTime() - startTime.getTime()) / 60000);
    const minimumMinutes = minMinutesMap[session.console_id] || 0;

    // Calculate expected points
    let expectedPoints = 0;
    if (minimumMinutes === 0) {
      expectedPoints = elapsedMinutes * session.per_minute_rate_snapshot;
    } else if (elapsedMinutes <= minimumMinutes) {
      expectedPoints = session.hourly_rate_snapshot;
    } else {
      const extraMinutes = elapsedMinutes - minimumMinutes;
      expectedPoints = session.hourly_rate_snapshot + extraMinutes * session.per_minute_rate_snapshot;
    }

    const deltaPoints = expectedPoints - session.total_points_deducted;
    if (deltaPoints <= 0) return;

    // Get current card balance & session counters
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
        .select("id, total_points_deducted, is_mode_esp32")
        .eq("id", session.id)
        .limit(1),
    ]);

    if (cardError || !cardData || cardData.status !== "active") return;
    if (freshSessErr || !freshSessionRows || freshSessionRows.length === 0) return;

    const currentBalance = Number(cardData.balance_points) || 0;
    const currentTotal = Number(freshSessionRows[0].total_points_deducted) || 0;
    const computedDelta = expectedPoints - currentTotal;
    
    if (computedDelta <= 0) return;

    // Process deduction based on balance
    if (computedDelta <= currentBalance) {
      // Sufficient balance - deduct computedDelta
      const newBalance = currentBalance - computedDelta;
      
      // Guarded balance update
      const { data: updatedCardRows, error: updateBalanceError } =
        await supabase
          .from("rfid_cards")
          .update({ balance_points: newBalance })
          .eq("uid", session.card_uid)
          .eq("status", "active")
          .gte("balance_points", computedDelta)
          .select("id");
          
      if (updateBalanceError || !updatedCardRows || updatedCardRows.length === 0) {
        return;
      }

      // Guarded session counters update
      const { data: updatedSessRows, error: updateSessionError } =
        await supabase
          .from("rental_sessions")
          .update({ total_points_deducted: currentTotal + computedDelta })
          .eq("id", session.id)
          .eq("total_points_deducted", currentTotal)
          .select("id");

      if (updateSessionError || !updatedSessRows || updatedSessRows.length === 0) {
        // Rollback balance
        await supabase
          .from("rfid_cards")
          .update({ balance_points: currentBalance })
          .eq("uid", session.card_uid);
        return;
      }

      // Create log
      const logData = {
        card_uid: session.card_uid,
        session_id: session.id,
        action_type: "balance_deduct",
        points_amount: computedDelta,
        balance_before: currentBalance,
        balance_after: newBalance,
        notes: `Automatic deduction for rental session - ${Math.round(computedDelta / session.per_minute_rate_snapshot)} minutes`,
      };

      console.log(`[Session ${session.id}] Deduction completed: ${computedDelta} points, balance: ${newBalance}`);

      // Update last_billing_at
      await supabase
        .from("rental_sessions")
        .update({ last_billing_at: now.toISOString() })
        .eq("id", session.id);

      // Trigger UI update
      window.dispatchEvent(
        new CustomEvent("memberCardBillingUpdate", {
          detail: {
            sessionId: session.id,
            cardUid: session.card_uid,
            pointsDeducted: computedDelta,
            newTotalDeducted: currentTotal + computedDelta,
            cardBalance: newBalance,
          },
        })
      );

      return {
        success: true,
        sessionId: session.id,
        cardUid: session.card_uid,
        pointsDeducted: computedDelta,
        newTotalDeducted: currentTotal + computedDelta,
        cardBalance: newBalance,
        logs: [logData]
      };
      
    } else {
      // Insufficient balance - deduct all remaining balance and end session
      const partialDelta = currentBalance;
      if (partialDelta <= 0) return;

      // Guarded: set balance to 0
      const { data: updatedCardRows2, error: updateBalanceError2 } =
        await supabase
          .from("rfid_cards")
          .update({ balance_points: 0 })
          .eq("uid", session.card_uid)
          .eq("status", "active")
          .eq("balance_points", currentBalance)
          .select("id");
          
      if (updateBalanceError2 || !updatedCardRows2 || updatedCardRows2.length === 0) {
        return;
      }

      // Update session counters
      const { data: updatedSessRows2, error: updateSessionError2 } =
        await supabase
          .from("rental_sessions")
          .update({ total_points_deducted: currentTotal + partialDelta })
          .eq("id", session.id)
          .eq("total_points_deducted", currentTotal)
          .select("id");

      if (updateSessionError2 || !updatedSessRows2 || updatedSessRows2.length === 0) {
        // Rollback balance
        await supabase
          .from("rfid_cards")
          .update({ balance_points: currentBalance })
          .eq("uid", session.card_uid);
        return;
      }

      // Create partial deduction log
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

      // End session
      // await endSessionDueToInsufficientBalance(session);
      const isESP32Mode = freshSessionRows[0].is_mode_esp32 || session.is_mode_esp32;
      await endSessionWithESP32Check(session, isESP32Mode ?? false);

      // Update last_billing_at
      await supabase
        .from("rental_sessions")
        .update({ last_billing_at: now.toISOString() })
        .eq("id", session.id);

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

  const endSessionDueToInsufficientBalance = async (session: MemberCardSession) => {
    try {
      const endTime = new Date().toISOString();
      const startTime = new Date(session.start_time);
      const elapsedMinutes = Math.ceil((new Date().getTime() - startTime.getTime()) / (1000 * 60));

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
      const { data: consoleData } = await supabase
        .from("consoles")
        .select("power_tv_command, relay_command_off")
        .eq("id", session.console_id)
        .single();

      if (consoleData) {
        if (consoleData.power_tv_command) {
          fetch(consoleData.power_tv_command).catch(() => {});
        }
        if (consoleData.relay_command_off) {
          fetch(consoleData.relay_command_off).catch(() => {});
        }
      }

      // Trigger UI refresh
      window.dispatchEvent(
        new CustomEvent("memberCardSessionEnded", {
          detail: { sessionId: session.id, reason: "insufficient_balance" },
        })
      );

      console.log(`Session ${session.id} ended due to insufficient balance after ${elapsedMinutes} minutes`);
    } catch (error) {
      console.error(`Error ending session ${session.id}:`, error);
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

  // Check authorization status
  const checkAuthorization = useCallback(async () => {
    try {
      const authorized = await isAuthorizedDeviceForBilling();
      setIsAuthorizedDevice(authorized);
      console.log("Device authorization status:", authorized);
    } catch (error) {
      console.error("Error checking authorization:", error);
      setIsAuthorizedDevice(false);
    }
  }, []);

  // Check all active sessions for timeout
  const checkAllSessions = useCallback(async () => {
    if (isCheckingSessions) return;
    setIsCheckingSessions(true);

    const prepaidSessions = activeSessions.filter(
      (session) => session.duration_minutes && session.status === "active"
    );

    await Promise.all(
      prepaidSessions.map((session) => checkSessionTimeout(session.id))
    );

    setIsCheckingSessions(false);
  }, [activeSessions, checkSessionTimeout, isCheckingSessions]);

  // Refresh active sessions (public method)
  const refreshActiveSessions = useCallback(async () => {
    await fetchActiveSessions();
  }, [fetchActiveSessions]);

  // State untuk mencatat error shutdown per console
  const [shutdownErrorCount, setShutdownErrorCount] = useState<
    Record<string, number>
  >({});

  const showShutdownErrorNotification = useCallback((consoleId: string) => {
    Swal.fire({
      icon: "error",
      title: "Gagal Mematikan TV",
      text: `Gagal mematikan TV pada console ID: ${consoleId} lebih dari 1 kali. Mohon cek perangkat secara manual!`,
      toast: true,
      position: "top-end",
      timer: 4000,
      showConfirmButton: false,
    });
  }, []);

  // Fungsi pengecekan TV yang tidak rented
  const checkAndShutdownUnusedConsoles = useCallback(async () => {
    if (!isAuthorizedDevice) {
      console.log("Device tidak authorized untuk melakukan shutdown console");
      return;
    }

    try {
      const { data: consoles, error } = await supabase
        .from("consoles")
        .select(
          "id, status, power_tv_command, relay_command_off, perintah_cek_power_tv, auto_shutdown_enabled"
        )
        .eq("is_active", true)
        .eq("auto_shutdown_enabled", true);

      if (error || !consoles) return;

      const shutdownPromises = consoles
        .filter((c) => c.status !== "rented")
        .map(async (c) => {
          try {
            let tvIsOn = false;

            if (c.perintah_cek_power_tv) {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 detik timeout

              try {
                const res = await fetch(c.perintah_cek_power_tv, {
                  signal: controller.signal,
                });
                clearTimeout(timeoutId);

                const tvStatusJson = await res.json();
                const obj =
                  typeof tvStatusJson === "string"
                    ? JSON.parse(tvStatusJson)
                    : tvStatusJson;

                if (typeof obj?.status === "string") {
                  tvIsOn = obj.status.trim().toUpperCase() === "ON";
                }
              } catch (err) {
                clearTimeout(timeoutId);
                console.warn(`TV check timeout untuk console ${c.id}`);
              }
            }

            if (tvIsOn && c.power_tv_command) {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 5000);

              try {
                await fetch(c.power_tv_command, {
                  signal: controller.signal,
                });
                clearTimeout(timeoutId);
                console.log(`TV dimatikan untuk console ${c.id}`);

                setShutdownErrorCount((prev) => {
                  const copy = { ...prev };
                  delete copy[c.id];
                  return copy;
                });
              } catch (err) {
                clearTimeout(timeoutId);

                const newErrorCount = (shutdownErrorCount[c.id] || 0) + 1;
                setShutdownErrorCount((prev) => ({
                  ...prev,
                  [c.id]: newErrorCount,
                }));

                if (newErrorCount > 1) {
                  showShutdownErrorNotification(c.id);
                }
              }
            }
          } catch (err) {
            console.error(`Error processing console ${c.id}:`, err);
          }
        });

      await Promise.allSettled(shutdownPromises);
    } catch (err) {
      console.error("Error checkAndShutdownUnusedConsoles:", err);
    }
  }, [isAuthorizedDevice, shutdownErrorCount, showShutdownErrorNotification]);

  // Initialize timer on mount
  useEffect(() => {
    fetchActiveSessions();
    checkAuthorization(); // Check authorization saat mount
  }, [fetchActiveSessions, checkAuthorization]);

  // Set up interval untuk check authorization setiap 2 menit
  useEffect(() => {
    const authInterval = setInterval(() => {
      checkAuthorization();
    }, 120000); // Check setiap 2 menit

    return () => clearInterval(authInterval);
  }, [checkAuthorization]);

  // Set up interval untuk refresh active sessions setiap 30 detik
  useEffect(() => {
    const sessionRefreshInterval = setInterval(() => {
      fetchActiveSessions();
    }, 30000); // Refresh setiap 30 detik

    return () => clearInterval(sessionRefreshInterval);
  }, [fetchActiveSessions]);

  // Realtime sync for rental_sessions changes across devices
  useEffect(() => {
    const channel = supabase
      .channel("rental_sessions_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rental_sessions" },
        async () => {
          try {
            await fetchActiveSessions();
          } catch (e) {
            console.error("Realtime refresh error:", e);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchActiveSessions]);

  useEffect(() => {
    const consolesChannel = supabase
      .channel("consoles_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "consoles" },
        async (payload) => {
          try {
            console.log("Console change detected:", payload);
            if (payload.eventType === "UPDATE" && payload.new && payload.old) {
              const oldAutoShutdown = payload.old.auto_shutdown_enabled;
              const newAutoShutdown = payload.new.auto_shutdown_enabled;

              if (oldAutoShutdown !== newAutoShutdown) {
                console.log(
                  `auto_shutdown_enabled changed for console ${payload.new.id}: ${oldAutoShutdown} -> ${newAutoShutdown}`
                );
                setTimeout(() => {
                  checkAndShutdownUnusedConsoles();
                }, 1000);
              }
            }
          } catch (e) {
            console.error("Console realtime refresh error:", e);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(consolesChannel);
    };
  }, [checkAndShutdownUnusedConsoles]);

  // Set up interval to check sessions every 30 seconds
  useEffect(() => {
    setIsTimerRunning(true);
    const interval = setInterval(() => {
      checkAllSessions();
    }, 30000); // Check every 30 seconds

    return () => {
      clearInterval(interval);
      setIsTimerRunning(false);
    };
  }, [checkAllSessions]);

  useEffect(() => {
    const consoleInterval = setInterval(() => {
      checkAndShutdownUnusedConsoles();
    }, 120000);

    return () => clearInterval(consoleInterval);
  }, [checkAndShutdownUnusedConsoles]);

  // Member card billing interval - every 60 seconds
  useEffect(() => {
    const billingInterval = setInterval(() => {
      processMemberCardBilling();
    }, BILLING_INTERVAL);

    return () => clearInterval(billingInterval);
  }, [processMemberCardBilling]);

  const value: TimerContextType = {
    activeSessions,
    checkSessionTimeout,
    refreshActiveSessions,
    isTimerRunning,
    triggerUnusedConsolesCheck: checkAndShutdownUnusedConsoles,
    isAuthorizedDevice,
  };

  return (
    <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
  );
};
