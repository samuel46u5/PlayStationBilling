import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { isAuthorizedDeviceForBilling, ensureFingerprintReady } from '../utils/deviceFingerprint.ts';

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

async function getMinimumMinutesByConsole(consoleIds: string[]) {
  if (!consoleIds.length) return {};
  const { data, error } = await supabase
    .from('consoles')
    .select('id, rate_profiles(minimum_minutes_member)')
    .in('id', consoleIds);
  if (error || !data) return {};
  const map: Record<string, number> = {};
  for (const row of data) {
    const min = Number(row?.rate_profiles[0]?.minimum_minutes_member) || 0;
    map[row.id] = min;
  }
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

async function pingESP32(ipAddress: string, timeout: number = 5000): Promise<boolean> {
  try {
    // Validasi IP address
    if (!ipAddress || ipAddress.trim() === '') {
      console.warn('IP address kosong');
      return false;
    }

    // Validasi format IP address sederhana
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
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
        method: 'GET',
        mode: 'cors',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      clearTimeout(timeoutId);
      
      // Jika response OK, ESP32 aktif
      if (response.ok) {
        console.log(`ESP32 ping berhasil untuk IP ${ipAddress}`);
        return true;
      } else {
        console.warn(`ESP32 ping gagal untuk IP ${ipAddress}, status: ${response.status}`);
        return false;
      }
    } catch (corsError) {
      // Jika CORS error, coba dengan mode no-cors sebagai fallback
      console.log(`CORS error untuk IP ${ipAddress}, mencoba mode no-cors...`);
      
      try {
        await fetch(`http://${ipAddress}`, {
          method: 'GET',
          mode: 'no-cors',
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache',
          },
        });

        clearTimeout(timeoutId);
        
        // Dengan mode no-cors, jika tidak ada error berarti koneksi berhasil
        console.log(`ESP32 ping berhasil (no-cors) untuk IP ${ipAddress}`);
        return true;
      } catch (noCorsError) {
        clearTimeout(timeoutId);
        console.warn(`ESP32 ping gagal (no-cors) untuk IP ${ipAddress}:`, noCorsError);
        return false;
      }
    }
  } catch (error) {
    console.warn(`ESP32 ping error untuk IP ${ipAddress}:`, error);
    return false;
  }
}


export const useMemberCardBilling = (activeSessions: any[]) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    ensureFingerprintReady();
    const processMemberCardBilling = async () => {
      try {
        // Check apakah device ini yang authorized untuk melakukan billing
        const isAuthorized = await isAuthorizedDeviceForBilling();
        
        if (!isAuthorized) {
          console.log('Device tidak authorized untuk melakukan billing, skip...');
          return;
        }

        // Ambil semua sesi member-card aktif
        const memberCardSessions = activeSessions.filter(
          (session) => 
            session.status === 'active' && 
            session.is_voucher_used && 
            session.start_time &&
            session.card_uid 
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

    // Jalankan billing setiap 30 detik
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
      expectedPoints = session.hourly_rate_snapshot + (extraMinutes * session.per_minute_rate_snapshot);
    }

    // Hitung delta yang perlu dipotong
    const deltaPoints = expectedPoints - session.total_points_deducted;
    
    if (deltaPoints <= 0) {
      return; // Tidak ada yang perlu dipotong
    }

    // Ambil saldo kartu saat ini (guarded) & current session counters (fresh)
    const [{ data: cardData, error: cardError }, { data: freshSessionRows, error: freshSessErr }] = await Promise.all([
      supabase
        .from('rfid_cards')
        .select('balance_points, status')
        .eq('uid', session.card_uid)
        .single(),
      supabase
        .from('rental_sessions')
        .select('id,total_points_deducted,is_mode_esp32')
        .eq('id', session.id)
        .limit(1)
    ]);

    if (cardError || !cardData) {
      console.error(`Error fetching card balance for session ${session.id}:`, cardError);
      return;
    }

    if (cardData.status !== 'active') {
      console.error(`Card ${session.card_uid} is not active for session ${session.id}`);
      return;
    }
    if (freshSessErr || !freshSessionRows || freshSessionRows.length === 0) {
      console.error(`Error fetching fresh session for ${session.id}:`, freshSessErr);
      return;
    }
    const freshSession = freshSessionRows[0] as { total_points_deducted: number; is_mode_esp32?: boolean };

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
      const { data: updatedCardRows, error: updateBalanceError } = await supabase
        .from('rfid_cards')
        .update({ balance_points: newBalance })
        .eq('uid', session.card_uid)
        .eq('status', 'active')
        .gte('balance_points', computedDelta)
        .select('id');
      if (updateBalanceError || !updatedCardRows || updatedCardRows.length === 0) {
        // Guard gagal karena race condition/saldo berubah.
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
          .from('rfid_cards')
          .update({ balance_points: currentBalance })
          .eq('uid', session.card_uid);
        return;
      }

      // Log pemotongan points ke card_usage_logs
      const { error: logError } = await supabase
        .from('card_usage_logs')
        .insert({
          card_uid: session.card_uid,
          session_id: session.id,
          action_type: 'balance_deduct',
          points_amount: computedDelta,
          balance_before: currentBalance,
          balance_after: newBalance,
          notes: `Automatic deduction for rental session - ${computedDelta / (session.per_minute_rate_snapshot || (session.hourly_rate_snapshot / 60))} minutes`
        });

      if (logError) {
        console.error(`Error logging point usage for session ${session.id}:`, logError);
      }

      console.log(`Deducted ${computedDelta} points for session ${session.id}. New balance: ${newBalance}`);
      
      // Trigger UI update untuk sinkronisasi real-time
      window.dispatchEvent(new CustomEvent('memberCardBillingUpdate', {
        detail: { 
          sessionId: session.id, 
          cardUid: session.card_uid,
          pointsDeducted: computedDelta,
          newTotalDeducted: currentTotal + computedDelta,
          cardBalance: newBalance
        }
      }));
    } else {
      // Saldo tidak cukup: kurangi semua saldo yang tersisa hingga 0 dan akhiri sesi
      const partialDelta = currentBalance;
      if (partialDelta <= 0) {
        return;
      }

      // Guarded: set balance ke 0 hanya jika masih sama dengan currentBalance
      const { data: updatedCardRows2, error: updateBalanceError2 } = await supabase
        .from('rfid_cards')
        .update({ balance_points: 0 })
        .eq('uid', session.card_uid)
        .eq('status', 'active')
        .eq('balance_points', currentBalance)
        .select('id');
      if (updateBalanceError2 || !updatedCardRows2 || updatedCardRows2.length === 0) {
        return;
      }

      // Update counters dengan partialDelta (optimistic concurrency)
      const { data: updatedSessRows2, error: updateSessionError2 } = await supabase
        .from('rental_sessions')
        .update({
          total_points_deducted: currentTotal + partialDelta
        })
        .eq('id', session.id)
        .eq('total_points_deducted', currentTotal)
        .select('id');

      if (updateSessionError2 || !updatedSessRows2 || updatedSessRows2.length === 0) {
        // Rollback saldo jika gagal update session
        await supabase
          .from('rfid_cards')
          .update({ balance_points: currentBalance })
          .eq('uid', session.card_uid);
        return;
      }

      // Log partial deduction
      const { error: logError2 } = await supabase
        .from('card_usage_logs')
        .insert({
          card_uid: session.card_uid,
          session_id: session.id,
          action_type: 'balance_deduct',
          points_amount: partialDelta,
          balance_before: currentBalance,
          balance_after: 0,
          notes: 'Partial deduction due to insufficient balance; auto ending session'
        });
      if (logError2) {
        console.error(`Error logging partial point usage for session ${session.id}:`, logError2);
      }

      console.log(`Partially deducted ${partialDelta} points (to zero) for session ${session.id}. New balance: 0`);

      // Trigger UI update
      window.dispatchEvent(new CustomEvent('memberCardBillingUpdate', {
        detail: {
          sessionId: session.id,
          cardUid: session.card_uid,
          pointsDeducted: partialDelta,
          newTotalDeducted: currentTotal + partialDelta,
          cardBalance: 0
        }
      }));

      // Akhiri sesi karena saldo habis
      // await endSessionDueToInsufficientBalance(session);
      await endSessionWithESP32Check(session, freshSession.is_mode_esp32);
    }
  };

  const endSessionWithESP32Check = async (session: MemberCardSession, isModeESP32?: boolean) => {
    try {
      // Cek apakah session menggunakan mode ESP32
      if (!isModeESP32) {
        console.log(`Session ${session.id} tidak menggunakan mode ESP32, langsung mengakhiri sesi.`);
        await endSessionDueToInsufficientBalance(session);
        return;
      }

      // Ambil data console untuk mendapatkan IP ESP32
      const { data: consoleData, error: consoleError } = await supabase
        .from('consoles')
        .select('ip_esp32')
        .eq('id', session.console_id)
        .single();

      if (consoleError || !consoleData) {
        console.error(`Error fetching console data for session ${session.id}:`, consoleError);
        await endSessionDueToInsufficientBalance(session);
        return;
      }

      // Jika ada IP ESP32, cek konektivitas
      if (consoleData.ip_esp32 && consoleData.ip_esp32.trim() !== '') {
        console.log(`Mengecek konektivitas ESP32 di IP ${consoleData.ip_esp32}...`);
        const isESP32Active = await pingESP32(consoleData.ip_esp32.trim(), 3000);

        if (!isESP32Active) {
          console.warn(`ESP32 di IP ${consoleData.ip_esp32} tidak aktif/timeout untuk session ${session.id}. Mengakhiri sesi.`);
          await endSessionDueToInsufficientBalance(session);
        } else {
          console.log(`ESP32 di IP ${consoleData.ip_esp32} aktif. Sesi tetap berjalan untuk session ${session.id}.`);
        }
      } else {
        console.warn(`Tidak ada IP ESP32 yang dikonfigurasi untuk console ${session.console_id}. Mengakhiri sesi.`);
        await endSessionDueToInsufficientBalance(session);
      }
    } catch (error) {
      console.error(`Error dalam endSessionWithESP32Check untuk session ${session.id}:`, error);
      try {
        await endSessionDueToInsufficientBalance(session);
      } catch (endError) {
        console.error(`Error mengakhiri sesi ${session.id}:`, endError);
      }
    }
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
      
      // Ambil data kartu dan console untuk details
      const [{ data: cardData }, { data: consoleData }] = await Promise.all([
        supabase
          .from('rfid_cards')
          .select('uid, balance_points')
          .eq('uid', session.card_uid)
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

      // Note: Final logging removed - already handled by partial deduction logging above

      const { data: cardInfo } = await supabase
        .from('rfid_cards')
        .select('avg_nilai_point')
        .eq('uid', session.card_uid)
        .single();

      const avgNilaiPoint = cardInfo?.avg_nilai_point ?? 0;
      const { data: capitalRow } = await supabase
        .from('consoles')
        .select('rate_profiles(capital)')
        .eq('id', session.console_id)
        .single();
      const capitalPerHour = (capitalRow as any)?.rate_profiles?.capital ?? 0;
      const durationHours = elapsedMinutes / 60;
      const totalCapitalCost = capitalPerHour * durationHours;
      const profit = (avgNilaiPoint * totalPoints) - totalCapitalCost;

      // Log transaksi kasir dengan struktur yang kompatibel untuk print receipt
      await logCashierTransaction({
        type: 'rental',
        amount: 0,
        paymentMethod: 'cash',
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
            }
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
          action: 'auto_end_insufficient_balance',
          customer_id: null,
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

