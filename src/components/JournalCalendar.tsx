import React, { useState, useEffect } from "react";
import { Calendar, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { supabase } from "../lib/supabase";

interface JournalData {
  date: string;
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  transactionCount: number;
  entries: Array<{
    id: string;
    description: string;
    type: "income" | "expense";
    category: string;
    amount: number;
    reference?: string;
  }>;
}

const JournalCalendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [journalData, setJournalData] = useState<Record<string, JournalData>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Load journal data from bookkeeping_entries
  useEffect(() => {
    const loadJournalData = async () => {
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

        const { data: entries, error } = await supabase
          .from("bookkeeping_entries")
          .select("*")
          .gte("entry_date", getLocalDateString(startOfMonth))
          .lte("entry_date", getLocalDateString(endOfMonth));

        if (error) throw error;

        const journalByDate: Record<string, JournalData> = {};

        entries?.forEach((entry: any) => {
          const dateKey = entry.entry_date;

          if (!journalByDate[dateKey]) {
            journalByDate[dateKey] = {
              date: dateKey,
              totalIncome: 0,
              totalExpense: 0,
              netProfit: 0,
              transactionCount: 0,
              entries: [],
            };
          }

          journalByDate[dateKey].entries.push({
            id: entry.id,
            description: entry.description,
            type: entry.type,
            category: entry.category,
            amount: entry.amount,
            reference: entry.reference,
          });

          if (entry.type === "income") {
            journalByDate[dateKey].totalIncome += entry.amount;
          } else {
            journalByDate[dateKey].totalExpense += entry.amount;
          }

          journalByDate[dateKey].netProfit =
            journalByDate[dateKey].totalIncome -
            journalByDate[dateKey].totalExpense;
          journalByDate[dateKey].transactionCount += 1;
        });

        setJournalData(journalByDate);
      } catch (error) {
        console.error("Error loading journal data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadJournalData();
  }, [selectedDate]);

  const getJournalColor = (netProfit: number) => {
    if (netProfit > 500000) return "bg-emerald-500"; // High profit
    if (netProfit > 200000) return "bg-lime-500"; // Medium-high
    if (netProfit > 0) return "bg-amber-500"; // Positive
    if (netProfit === 0) return "bg-gray-300"; // Break even
    if (netProfit > -200000) return "bg-red-400"; // Small loss
    return "bg-red-600";
  };

  const getJournalTextColor = (netProfit: number) => {
    if (netProfit >= 200000 || netProfit < -200000) return "text-white";
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
        journalData: null,
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${currentYear}-${String(currentMonth + 1).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}`;
      const date = new Date(currentYear, currentMonth, day);
      const dayJournal = journalData[dateString];

      calendarDays.push({
        date,
        isCurrentMonth: true,
        journalData: dayJournal,
      });
    }

    const remainingDays = 42 - calendarDays.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(currentYear, currentMonth + 1, day);
      calendarDays.push({
        date: nextDate,
        isCurrentMonth: false,
        journalData: null,
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
            const totalIncome = day.journalData?.totalIncome || 0;
            const totalExpense = day.journalData?.totalExpense || 0;
            const netProfit = day.journalData?.netProfit || 0;
            const transactionCount = day.journalData?.transactionCount || 0;
            const hasData = day.journalData !== null;

            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border border-gray-100 ${
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

                {/* Journal Indicator */}
                {hasData && day.isCurrentMonth && (
                  <div className="space-y-1">
                    <div
                      className={`text-xs px-2 py-1 rounded text-center font-medium ${getJournalColor(
                        netProfit
                      )} ${getJournalTextColor(netProfit)}`}
                    >
                      Rp {Math.round(netProfit).toLocaleString("id-ID")}
                    </div>

                    <div className="text-xs text-gray-600 text-center">
                      <div className="text-green-600">
                        +Rp {Math.round(totalIncome).toLocaleString("id-ID")}
                      </div>
                      <div className="text-red-600">
                        -Rp {Math.round(totalExpense).toLocaleString("id-ID")}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {transactionCount} transaksi
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
              {Object.keys(journalData).length}
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
                Object.values(journalData).reduce(
                  (sum, d) => sum + d.totalIncome,
                  0
                )
              ).toLocaleString("id-ID")}
            </h3>
            <p className="text-gray-600 text-sm">Total Pemasukan</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              Rp{" "}
              {Math.round(
                Object.values(journalData).reduce(
                  (sum, d) => sum + d.totalExpense,
                  0
                )
              ).toLocaleString("id-ID")}
            </h3>
            <p className="text-gray-600 text-sm">Total Pengeluaran</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              Rp{" "}
              {Math.round(
                Object.values(journalData).reduce(
                  (sum, d) => sum + d.netProfit,
                  0
                )
              ).toLocaleString("id-ID")}
            </h3>
            <p className="text-gray-600 text-sm">Profit</p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Memuat data jurnal...</div>
      </div>
    );
  }

  return <div className="space-y-6">{renderCalendarView()}</div>;
};

export default JournalCalendar;
