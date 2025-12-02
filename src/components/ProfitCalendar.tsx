import React, { useState, useEffect } from "react";
import { Calendar, TrendingUp, Coffee, Gamepad } from "lucide-react";
import { supabase } from "../lib/supabase";

interface ProfitData {
  date: string;
  rentalProfit: number;
  cafeProfit: number;
  totalProfit: number;
  count: number;
}

const ProfitCalendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [profitData, setProfitData] = useState<Record<string, ProfitData>>({});
  const [loading, setLoading] = useState(true);

  // Load profit data from transactions
  useEffect(() => {
    const loadProfitData = async () => {
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
          .or("type.eq.rental,type.eq.sale,type.eq.voucher")
          .gte("timestamp", startOfMonth.toISOString())
          .lte("timestamp", endOfMonth.toISOString());

        if (error) throw error;

        const profitByDate: Record<string, ProfitData> = {};

        transactions?.forEach((transaction: any) => {
          const dateKey = new Date(transaction.timestamp)
            .toISOString()
            .split("T")[0];

          if (!profitByDate[dateKey]) {
            profitByDate[dateKey] = {
              date: dateKey,
              rentalProfit: 0,
              cafeProfit: 0,
              totalProfit: 0,
              count: 0,
            };
          }

          const profit = (transaction?.details?.items || []).reduce(
            (s: number, it: any) => s + (Number(it?.profit) || 0),
            0
          );

          if (transaction.type === "rental") {
            profitByDate[dateKey].rentalProfit += profit;
          } else if (transaction.type === "sale") {
            profitByDate[dateKey].cafeProfit += profit;
          }

          profitByDate[dateKey].totalProfit += profit;
          profitByDate[dateKey].count += 1;
        });

        setProfitData(profitByDate);
      } catch (error) {
        console.error("Error loading profit data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfitData();
  }, [selectedDate]);

  const getProfitColor = (rentalProfit: number, cafeProfit: number) => {
    const total = rentalProfit + cafeProfit;
    if (total >= 500_000) return "bg-emerald-500"; // High profit
    if (total >= 300_000) return "bg-lime-500"; // Medium-high
    if (total >= 100_000) return "bg-amber-500"; // Medium
    if (total >= 50_000) return "bg-red-500"; // Low-medium
    return "bg-gray-200";
  };

  const getProfitTextColor = (rentalProfit: number, cafeProfit: number) => {
    const total = rentalProfit + cafeProfit;
    if (total >= 100000) return "text-white";
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
        profitData: null,
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${currentYear}-${String(currentMonth + 1).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}`;
      const date = new Date(currentYear, currentMonth, day);
      const dayProfit = profitData[dateString];

      calendarDays.push({
        date,
        isCurrentMonth: true,
        profitData: dayProfit,
      });
    }

    const remainingDays = 42 - calendarDays.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(currentYear, currentMonth + 1, day);
      calendarDays.push({
        date: nextDate,
        isCurrentMonth: false,
        profitData: null,
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
            const rentalProfit = day.profitData?.rentalProfit || 0;
            const cafeProfit = day.profitData?.cafeProfit || 0;
            const totalProfit = rentalProfit + cafeProfit;
            const hasData = day.profitData !== null;

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

                {/* Profit Indicator */}
                {hasData && day.isCurrentMonth && (
                  <div className="space-y-1">
                    <div
                      className={`text-sm px-2 py-1 rounded text-center font-medium ${getProfitColor(
                        rentalProfit,
                        cafeProfit
                      )} ${getProfitTextColor(rentalProfit, cafeProfit)}`}
                    >
                      Rp {Math.round(totalProfit).toLocaleString("id-ID")}
                    </div>

                    <div className="text-sm text-gray-600 text-center">
                      <div>
                        Rental: Rp{" "}
                        {Math.round(rentalProfit).toLocaleString("id-ID")}
                      </div>
                      <div>
                        Cafe: Rp{" "}
                        {Math.round(cafeProfit).toLocaleString("id-ID")}
                      </div>
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
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {Object.keys(profitData).length}
            </h3>
            <p className="text-gray-600 text-sm">Hari Aktif</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              Rp{" "}
              {Math.round(
                Object.values(profitData).reduce(
                  (sum, d) => sum + d.rentalProfit + d.cafeProfit,
                  0
                )
              ).toLocaleString("id-ID")}
            </h3>
            <p className="text-gray-600 text-sm">Total Profit Bulan Ini</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Gamepad className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              Rp{" "}
              {Math.round(
                Object.values(profitData).reduce(
                  (sum, d) => sum + d.rentalProfit,
                  0
                )
              ).toLocaleString("id-ID")}
            </h3>
            <p className="text-gray-600 text-sm">Profit Rental</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Coffee className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              Rp{" "}
              {Math.round(
                Object.values(profitData).reduce(
                  (sum, d) => sum + d.cafeProfit,
                  0
                )
              ).toLocaleString("id-ID")}
            </h3>
            <p className="text-gray-600 text-sm">Profit Cafe</p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Memuat data profit...</div>
      </div>
    );
  }

  return <div className="space-y-6">{renderCalendarView()}</div>;
};

export default ProfitCalendar;
