import React, { useState, useEffect } from "react";
import { Calendar, DollarSign, TrendingUp } from "lucide-react";
import { supabase } from "../lib/supabase";

interface CashierData {
  date: string;
  totalAmount: number;
  sessionCount: number;
  transactionCount: number;
  sessions: Record<
    string,
    { totalAmount: number; count: number; cashierName?: string }
  >;
}

const CashierCalendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [cashierData, setCashierData] = useState<Record<string, CashierData>>(
    {}
  );
  const [loading, setLoading] = useState(true);

  // Load cashier data from transactions
  useEffect(() => {
    const loadCashierData = async () => {
      try {
        setLoading(true);

        const startOfMonth = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          1
        );
        const endOfMonth = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1,
          0
        );
        endOfMonth.setHours(23, 59, 59, 999);

        const { data: transactions, error } = await supabase
          .from("cashier_transactions")
          .select("*")
          .gte("timestamp", startOfMonth.toISOString())
          .lte("timestamp", endOfMonth.toISOString());

        if (error) throw error;

        const cashierByDate: Record<string, CashierData> = {};

        transactions?.forEach((transaction: any) => {
          const dateKey = new Date(transaction.timestamp)
            .toISOString()
            .split("T")[0];

          if (!cashierByDate[dateKey]) {
            cashierByDate[dateKey] = {
              date: dateKey,
              totalAmount: 0,
              sessionCount: 0,
              transactionCount: 0,
              sessions: {},
            };
          }

          const sid = String(transaction.session_id || "-");
          const amount =
            transaction.type === "expense"
              ? -Number(transaction.amount || 0)
              : Number(transaction.amount || 0);

          if (!cashierByDate[dateKey].sessions[sid]) {
            cashierByDate[dateKey].sessions[sid] = {
              totalAmount: 0,
              count: 0,
              cashierName: transaction.cashier_name || "Kasir",
            };
          }

          cashierByDate[dateKey].sessions[sid].totalAmount += amount;
          cashierByDate[dateKey].sessions[sid].count += 1;
          cashierByDate[dateKey].totalAmount += amount;
          cashierByDate[dateKey].transactionCount += 1;
        });

        Object.keys(cashierByDate).forEach((dateKey) => {
          const dayData = cashierByDate[dateKey];
          const sessionIds = Object.keys(dayData.sessions);
          const filteredSessionIds = sessionIds.filter(
            (sid) =>
              sid && String(sid).trim() !== "" && sid !== "-" && sid !== "null"
          );
          dayData.sessionCount = filteredSessionIds.length;
          dayData.transactionCount = filteredSessionIds.reduce(
            (total, sid) => total + dayData.sessions[sid].count,
            0
          );
        });

        setCashierData(cashierByDate);
      } catch (error) {
        console.error("Error loading cashier data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCashierData();
  }, [selectedDate]);

  const getAmountColor = (amount: number) => {
    if (amount >= 1000000) return "bg-green-500"; // High amount - green
    if (amount >= 500000) return "bg-yellow-500"; // Medium-high - yellow
    if (amount >= 100000) return "bg-orange-500"; // Medium - orange
    if (amount >= 50000) return "bg-red-500"; // Low-medium - red
    return "bg-gray-200"; // Low - gray
  };

  const getAmountTextColor = (amount: number) => {
    if (amount >= 100000) return "text-white";
    return "text-gray-700";
  };

  const renderCalendarView = () => {
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const calendarDays = [];

    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(currentYear, currentMonth, -i);
      calendarDays.push({
        date: prevDate,
        isCurrentMonth: false,
        cashierData: null,
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${currentYear}-${String(currentMonth + 1).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}`;
      const date = new Date(currentYear, currentMonth, day);
      const dayCashier = cashierData[dateString];

      calendarDays.push({
        date,
        isCurrentMonth: true,
        cashierData: dayCashier,
      });
    }

    const remainingDays = 42 - calendarDays.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(currentYear, currentMonth + 1, day);
      calendarDays.push({
        date: nextDate,
        isCurrentMonth: false,
        cashierData: null,
      });
    }

    const monthNames = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];

    const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {monthNames[currentMonth]} {currentYear}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() =>
                setSelectedDate(new Date(currentYear, currentMonth - 1, 1))
              }
              className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ‹
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Hari Ini
            </button>
            <button
              onClick={() =>
                setSelectedDate(new Date(currentYear, currentMonth + 1, 1))
              }
              className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ›
            </button>
          </div>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-gray-600"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const totalAmount = day.cashierData?.totalAmount || 0;
            const sessionCount = day.cashierData?.sessionCount || 0;
            const transactionCount = day.cashierData?.transactionCount || 0;
            const hasData = day.cashierData !== null;

            return (
              <div
                key={index}
                className={`min-h-[100px] p-2 border border-gray-100 ${
                  day.isCurrentMonth ? "bg-white" : "bg-gray-50"
                } ${
                  day.date.toDateString() === new Date().toDateString()
                    ? "bg-blue-50 border-blue-200"
                    : ""
                }`}
              >
                <div
                  className={`text-sm font-medium mb-1 ${
                    day.isCurrentMonth ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  {day.date.getDate()}
                </div>

                {/* Cashier Indicator */}
                {hasData && day.isCurrentMonth && (
                  <div className="space-y-1">
                    <div
                      className={`text-sm px-2 py-1 rounded text-center font-medium ${getAmountColor(
                        totalAmount
                      )} ${getAmountTextColor(totalAmount)}`}
                    >
                      Rp {totalAmount.toLocaleString("id-ID")}
                    </div>

                    <div className="text-sm text-gray-600 text-center">
                      <div>{sessionCount} sesi</div>
                      <div>{transactionCount} transaksi</div>
                    </div>
                  </div>
                )}

                {day.date.toDateString() === new Date().toDateString() && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {Object.keys(cashierData).length}
            </h3>
            <p className="text-gray-600 text-sm">Hari Aktif</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              Rp{" "}
              {Object.values(cashierData)
                .reduce((sum, d) => sum + d.totalAmount, 0)
                .toLocaleString("id-ID")}
            </h3>
            <p className="text-gray-600 text-sm">Total Transaksi Bulan Ini</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              Rp{" "}
              {(() => {
                const daysWithData = Object.values(cashierData).filter(
                  (d) => d.transactionCount > 0
                );
                const totalAmount = daysWithData.reduce(
                  (sum, d) => sum + d.totalAmount,
                  0
                );
                const avgAmount =
                  daysWithData.length > 0
                    ? Math.round(totalAmount / daysWithData.length)
                    : 0;
                return avgAmount.toLocaleString("id-ID");
              })()}
            </h3>
            <p className="text-gray-600 text-sm">Rata-rata Transaksi Harian</p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Memuat data kasir...</div>
      </div>
    );
  }

  return <div className="space-y-6">{renderCalendarView()}</div>;
};

export default CashierCalendar;
