import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { supabase } from "../lib/supabase";
import Swal from "sweetalert2";

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
  pause_start_time?: string;
  total_pause_minutes?: number;
  customers?: {
    name: string;
    phone: string;
  };
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
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Fetch active sessions from database
  const fetchActiveSessions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("rental_sessions")
        .select(
          `
          *,
          customers(name, phone),
          consoles(name, location, rate_profiles(capital))
        `
        )
        .in("status", ["active", "paused"]);

      if (error) {
        console.error("Error fetching active sessions:", error);
        return;
      }

      setActiveSessions(data || []);
    } catch (error) {
      console.error("Error in fetchActiveSessions:", error);
    }
  }, []);

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
            .select("*")
            .eq("id", session.console_id)
            .single();

          // Execute relay commands if available
          if (consoleData) {
            if (consoleData.power_tv_command) {
              fetch(consoleData.power_tv_command).catch(() => {});
            }
            if (consoleData.relay_command_off) {
              fetch(consoleData.relay_command_off).catch(() => {});
            }
          }

          // Update rental session
          await supabase
            .from("rental_sessions")
            .update({
              end_time: now.toISOString(),
              status: "completed",
            })
            .eq("id", session.id);

          // Update console status
          await supabase
            .from("consoles")
            .update({ status: "available" })
            .eq("id", session.console_id);

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
      for (const product of products || []) {
        const used = qtyByProduct[product.id] || 0;
        const current = Number(product.stock) || 0;
        const newStock = current - used;
        const { error: updStockErr } = await supabase
          .from("products")
          .update({ stock: newStock })
          .eq("id", product.id);
        if (updStockErr) throw updStockErr;
      }
    } catch (error) {
      console.error("finalizeProductsAndStock error:", error);
    }
  };

  // Check all active sessions for timeout
  const checkAllSessions = useCallback(async () => {
    const prepaidSessions = activeSessions.filter(
      (session) => session.duration_minutes && session.status === "active"
    );

    for (const session of prepaidSessions) {
      await checkSessionTimeout(session.id);
    }
  }, [activeSessions, checkSessionTimeout]);

  // Refresh active sessions (public method)
  const refreshActiveSessions = useCallback(async () => {
    await fetchActiveSessions();
  }, [fetchActiveSessions]);

  // Initialize timer on mount
  useEffect(() => {
    fetchActiveSessions();
  }, [fetchActiveSessions]);

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

  const value: TimerContextType = {
    activeSessions,
    checkSessionTimeout,
    refreshActiveSessions,
    isTimerRunning,
  };

  return (
    <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
  );
};
