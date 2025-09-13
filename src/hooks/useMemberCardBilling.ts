import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { getTabLockManager } from '../utils/tabLock';

interface MemberCardSession {
  id: string;
  customer_id: string;
  console_id: string;
  start_time: string;
  hourly_rate_snapshot: number;
  per_minute_rate_snapshot: number;
  total_points_deducted: number;
}

async function getMinimumMinutesByConsole(consoleIds: string[]) {
  if (!consoleIds.length) return {};
  const { data, error } = await supabase
    .from('consoles')
    .select('id, rate_profiles(minimum_minutes)')
    .in('id', consoleIds);
  if (error || !data) return {};
  const map: Record<string, number> = {};
  for (const row of data) {
    const min = Number(row?.rate_profiles[0]?.minimum_minutes) || 60;
    map[row.id] = min;
  }
  return map;
}


export const useMemberCardBilling = (activeSessions: any[]) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const tabLock = getTabLockManager();

  useEffect(() => {
    // Hanya leader tab yang menjalankan billing
    if (!tabLock.isCurrentLeader()) {
      return;
    }

    const processMemberCardBilling = async () => {
      try {
        // Ambil semua sesi member-card aktif
        const memberCardSessions = activeSessions.filter(
          (session) => 
            session.status === 'active' && 
            session.is_voucher_used && 
            session.start_time &&
            session.customer_id
        ) as MemberCardSession[];

        if (memberCardSessions.length === 0) {
          return;
        }

        const now = new Date();
        
        // Ambil minimum_minutes untuk semua console di batch ini
        const consoleIds = Array.from(
          new Set(memberCardSessions.map((s) => s.console_id).filter(Boolean))
        ) as string[];
        const minMinutesMap = await getMinimumMinutesByConsole(consoleIds);

        for (const session of memberCardSessions) {
          try {
            await processSessionBilling(session, now, minMinutesMap);
          } catch (error) {
            console.error(`Error processing session ${session.id}:`, error);
            // Continue dengan session lain meski ada error
          }
        }
      } catch (error) {
        console.error('Error in member card billing:', error);
      }
    };

    // Jalankan billing setiap 60 detik
    intervalRef.current = setInterval(processMemberCardBilling, 30000);

    // Jalankan sekali saat mount
    processMemberCardBilling();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeSessions]);

  const processSessionBilling = async (session: MemberCardSession, now: Date, minMinutesMap: Record<string, number>) => {
    const startTime = new Date(session.start_time);
    const elapsedMinutes = Math.ceil((now.getTime() - startTime.getTime()) / 60000);
    const minimumMinutes = minMinutesMap[session.console_id] || 60;

    // Hitung expected points berdasarkan waktu berjalan
    let expectedPoints = 0;
    if (elapsedMinutes <= minimumMinutes) {
      // Minimal 1 jam
      expectedPoints = session.hourly_rate_snapshot;
    } else {
      // 1 jam + menit tambahan
      const extraMinutes = elapsedMinutes - 60;
      expectedPoints = session.hourly_rate_snapshot + (extraMinutes * session.per_minute_rate_snapshot);
    }

    // Hitung delta yang perlu dipotong
    const deltaPoints = expectedPoints - session.total_points_deducted;
    
    if (deltaPoints <= 0) {
      return; // Tidak ada yang perlu dipotong
    }

    // Ambil saldo customer saat ini (guarded) & current session counters (fresh)
    const [{ data: customerData, error: customerError }, { data: freshSessionRows, error: freshSessErr }] = await Promise.all([
      supabase
        .from('customers')
        .select('balance_points')
        .eq('id', session.customer_id)
        .single(),
      supabase
        .from('rental_sessions')
        .select('id,total_points_deducted')
        .eq('id', session.id)
        .limit(1)
    ]);

    if (customerError || !customerData) {
      console.error(`Error fetching customer balance for session ${session.id}:`, customerError);
      return;
    }
    if (freshSessErr || !freshSessionRows || freshSessionRows.length === 0) {
      console.error(`Error fetching fresh session for ${session.id}:`, freshSessErr);
      return;
    }
    const freshSession = freshSessionRows[0] as { total_points_deducted: number };

    const currentBalance = Number(customerData.balance_points) || 0;
    const currentTotal = Number(freshSession.total_points_deducted) || 0;
    const computedDelta = expectedPoints - currentTotal;
    if (computedDelta <= 0) {
      // Sudah dipotong oleh klien lain
      return;
    }

    // Cek apakah saldo cukup
    if (currentBalance < computedDelta) {
      // Jika belum mencapai minimum, jangan akhiri sesi. Biarkan berjalan hingga minimum.
      if (elapsedMinutes < minimumMinutes) {
        return; // tunggu hingga minimum tercapai untuk evaluasi ulang
      }
      // Setelah melewati minimum dan saldo tetap kurang untuk selisih yang dibutuhkan, akhiri sesi
      await endSessionDueToInsufficientBalance(session);
      return;
    }

    // Lakukan pemotongan points
    const newBalance = currentBalance - computedDelta;

    // Guarded balance update (only if balance_points still >= computedDelta)
    const { data: updatedCustRows, error: updateBalanceError } = await supabase
      .from('customers')
      .update({ balance_points: newBalance })
      .eq('id', session.customer_id)
      .gte('balance_points', computedDelta)
      .select('id');
    if (updateBalanceError || !updatedCustRows || updatedCustRows.length === 0) {
      // Guard gagal karena race condition/saldo berubah. Re-evaluate secara konservatif tanpa mengakhiri sesi.
      // Hanya akhiri jika sudah melewati minimum dan tetap tidak cukup di iterasi berikutnya.
      return;
    }

    // Guarded session counters update (optimistic concurrency)
    const { data: updatedSessRows, error: updateSessionError } = await supabase
      .from('rental_sessions')
      .update({
        total_points_deducted: currentTotal + computedDelta
      })
      .eq('id', session.id)
      .eq('total_points_deducted', currentTotal)
      .select('id');

    if (updateSessionError || !updatedSessRows || updatedSessRows.length === 0) {
      // Session sudah diupdate pihak lain → rollback saldo
      await supabase
        .from('customers')
        .update({ balance_points: currentBalance })
        .eq('id', session.customer_id);
      return;
    }

    // Log pemotongan points
    const { error: logError } = await supabase
      .from('point_usage_logs')
      .insert({
        session_id: session.id,
        customer_id: session.customer_id,
        points_deducted: computedDelta,
        sisa_balance: newBalance,
        minutes_billed: computedDelta / (session.per_minute_rate_snapshot || (session.hourly_rate_snapshot / 60))
      });

    if (logError) {
      console.error(`Error logging point usage for session ${session.id}:`, logError);
    }

    console.log(`Deducted ${deltaPoints} points for session ${session.id}. New balance: ${newBalance}`);
    
    // Trigger UI update untuk sinkronisasi real-time
    window.dispatchEvent(new CustomEvent('memberCardBillingUpdate', {
      detail: { 
        sessionId: session.id, 
        pointsDeducted: computedDelta,
        newTotalDeducted: currentTotal + computedDelta,
        customerBalance: newBalance
      }
    }));
  };

  async function logCashierTransaction(params: {
    type: 'sale' | 'rental' | 'voucher';
    amount: number;
    paymentMethod: 'cash' | 'qris' | 'card' | 'transfer';
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
          .from('cashier_sessions')
          .select('id')
          .eq('cashier_id', cashierId)
          .eq('status', 'active')
          .order('start_time', { ascending: false })
          .limit(1);
        if (Array.isArray(sessions) && sessions.length > 0) {
          sessionId = sessions[0].id;
        }
      }

      const pm = params.paymentMethod === 'qris' ? 'transfer' : params.paymentMethod;

      await supabase.from('cashier_transactions').insert({
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
      console.error('logCashierTransaction error:', err);
    }
  }

  const endSessionDueToInsufficientBalance = async (session: MemberCardSession) => {
    try {
      const endTime = new Date().toISOString();
      
      // Hitung menit yang terpakai
      const startTime = session.start_time ? new Date(session.start_time) : new Date();
      const endTimeDate = new Date();
      const elapsedMinutes = Math.ceil((endTimeDate.getTime() - startTime.getTime()) / (1000 * 60));

      // Ambil total points terbaru dari database dan hitung balance yang benar
      const { data: freshSessionData } = await supabase
        .from('rental_sessions')
        .select('total_points_deducted')
        .eq('id', session.id)
        .single();
      
      const totalPoints = freshSessionData?.total_points_deducted || 0;
      
      

      // Ambil data customer dan console untuk details
      const [{ data: customerData }, { data: consoleData }] = await Promise.all([
        supabase
          .from('customers')
          .select('name, balance_points')
          .eq('id', session.customer_id)
          .single(),
        supabase
          .from('consoles')
          .select('name, power_tv_command, relay_command_off')
          .eq('id', session.console_id)
          .single()
      ]);

      // Update session status
      await supabase
        .from('rental_sessions')
        .update({ 
          status: 'completed', 
          end_time: endTime 
        })
        .eq('id', session.id);

      // Set console available
      await supabase
        .from('consoles')
        .update({ status: 'available' })
        .eq('id', session.console_id);

      // Matikan console jika ada perintah
      if (consoleData) {
        if (consoleData.power_tv_command) {
          fetch(consoleData.power_tv_command).catch(() => {});
        }
        if (consoleData.relay_command_off) {
          fetch(consoleData.relay_command_off).catch(() => {});
        }
      }

      const originalBalance = Number(customerData?.balance_points) || 0;
      const correctRemainingBalance = originalBalance - (totalPoints - session.hourly_rate_snapshot);

      // Log transaksi kasir dengan struktur yang kompatibel untuk print receipt
      await logCashierTransaction({
        type: 'rental',
        amount: 0,
        paymentMethod: 'cash',
        referenceId: `AUTO_END-${session.id}-${Date.now()}`,
        description: `Auto end (member card) - saldo habis - ${customerData?.name || 'Unknown'}`,
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
              product_name: `Rental ${consoleData?.name || "Console"}`,
            }
          ],
          breakdown: {
            rental_cost: totalPoints,
            products_total: 0,
          },
          customer: {
            name: customerData?.name || "Unknown",
            id: session.customer_id,
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
            points_remaining: correctRemainingBalance,
            points_deducted_final: totalPoints,
            hourly_rate_snapshot: session.hourly_rate_snapshot,
            per_minute_rate_snapshot: session.per_minute_rate_snapshot,
            auto_end_reason: "insufficient_balance",
          },
          payment: {
            method: "member_card",
            amount: totalPoints,
            change: 0,
          },
          action: 'auto_end_insufficient_balance',
          customer_id: session.customer_id,
          console_id: session.console_id,
          elapsed_minutes: elapsedMinutes,
        },
      });

      // Trigger UI refresh dengan custom event
      window.dispatchEvent(new CustomEvent('memberCardSessionEnded', {
        detail: { sessionId: session.id, reason: 'insufficient_balance' }
      }));

      console.log(`Session ${session.id} ended due to insufficient balance`);
    } catch (error) {
      console.error(`Error ending session ${session.id}:`, error);
    }
  };

  return {
    processSessionBilling,
    endSessionDueToInsufficientBalance
  };
};

