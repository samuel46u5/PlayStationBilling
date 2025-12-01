import React, { useState, useEffect } from "react";
import { Calendar, TrendingUp, Gamepad2 } from "lucide-react";
import { supabase } from "../lib/supabase";

interface OccupancyData {
  date: string;
  totalRentalMinutes: number;
  totalConsoles: number;
  operatingMinutes: number;
  occupancyRate: number;
  consoleDetails: Record<string, { minutes: number; count: number }>;
}

const OccupancyCalendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [occupancyData, setOccupancyData] = useState<OccupancyData[]>([]);
  const [loading, setLoading] = useState(true);
  // Load occupancy data from transactions
  useEffect(() => {
    const loadOccupancyData = async () => {
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
          .eq("type", "rental")
          .gte("timestamp", startOfMonth.toISOString())
          .lte("timestamp", endOfMonth.toISOString())
          .not("reference_id", "ilike", "MOVE_RENTAL-%");

        if (error) throw error;

        const occupancyByDate: Record<string, OccupancyData> = {};

        transactions?.forEach((transaction: any) => {
          const dateKey = new Date(transaction.timestamp)
            .toISOString()
            .split("T")[0];

          if (!occupancyByDate[dateKey]) {
            occupancyByDate[dateKey] = {
              date: dateKey,
              totalRentalMinutes: 0,
              totalConsoles: 0,
              operatingMinutes: 0,
              occupancyRate: 0,
              consoleDetails: {},
            };
          }

          const durationMinutes =
            transaction.details?.rental?.duration_minutes ||
            transaction.details?.duration_minutes ||
            transaction.details?.additional_duration_minutes ||
            0;

          occupancyByDate[dateKey].totalRentalMinutes += durationMinutes;

          const consoleName =
            transaction.details?.rental?.console ||
            transaction.details?.items?.[0]?.name ||
            transaction.details?.items?.[0]?.product_name ||
            "Unknown Console";

          if (!occupancyByDate[dateKey].consoleDetails[consoleName]) {
            occupancyByDate[dateKey].consoleDetails[consoleName] = {
              minutes: 0,
              count: 0,
            };
          }
          occupancyByDate[dateKey].consoleDetails[consoleName].minutes +=
            durationMinutes;
          occupancyByDate[dateKey].consoleDetails[consoleName].count += 1;
        });

        Object.keys(occupancyByDate).forEach((dateKey) => {
          const dayData = occupancyByDate[dateKey];
          const consolesUsed = Object.keys(dayData.consoleDetails).length;
          dayData.totalConsoles = consolesUsed;

          const operatingMinutes = consolesUsed * 14 * 60;
          dayData.operatingMinutes = operatingMinutes;

          dayData.occupancyRate =
            operatingMinutes > 0
              ? Math.round(
                  (dayData.totalRentalMinutes / operatingMinutes) * 100
                )
              : 0;
        });

        setOccupancyData(Object.values(occupancyByDate));
      } catch (error) {
        console.error("Error loading occupancy data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadOccupancyData();
  }, [selectedDate]);

  const getOccupancyColor = (rate: number) => {
    if (rate >= 80) return "bg-red-500"; // High occupancy - red
    if (rate >= 60) return "bg-orange-500"; // Medium-high - orange
    if (rate >= 40) return "bg-yellow-500"; // Medium - yellow
    if (rate >= 20) return "bg-green-500"; // Low-medium - green
    return "bg-gray-200"; // Low - gray
  };

  const getOccupancyTextColor = (rate: number) => {
    if (rate >= 40) return "text-white";
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
        occupancyData: null,
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${currentYear}-${String(currentMonth + 1).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}`;
      const date = new Date(currentYear, currentMonth, day);
      const dayOccupancy = occupancyData.find((d) => d.date === dateString);

      calendarDays.push({
        date,
        isCurrentMonth: true,
        occupancyData: dayOccupancy,
      });
    }

    const remainingDays = 42 - calendarDays.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(currentYear, currentMonth + 1, day);
      calendarDays.push({
        date: nextDate,
        isCurrentMonth: false,
        occupancyData: null,
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

        {/* Occupancy Legend */}
        {/* <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <span className="text-sm text-gray-600">0-20% (Rendah)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-600">
              20-40% (Sedang Rendah)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-sm text-gray-600">40-60% (Sedang)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-sm text-gray-600">
              60-80% (Sedang Tinggi)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-600">80%+ (Tinggi)</span>
          </div>
        </div> */}

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
            const occupancyRate = day.occupancyData?.occupancyRate || 0;
            const hasData = day.occupancyData !== null;

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

                {/* Occupancy Indicator */}
                {hasData && day.isCurrentMonth && (
                  <div className="space-y-1">
                    <div
                      className={`text-xs px-2 py-1 rounded text-center font-medium ${getOccupancyColor(
                        occupancyRate
                      )} ${getOccupancyTextColor(occupancyRate)}`}
                    >
                      {occupancyRate}%
                    </div>

                    <div className="text-xs text-gray-600 text-center">
                      {day.occupancyData?.totalConsoles || 0} console
                    </div>

                    <div className="text-xs text-gray-500 text-center">
                      {Math.round(
                        (day.occupancyData?.totalRentalMinutes || 0) / 60
                      )}{" "}
                      jam
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
              {occupancyData.length}
            </h3>
            <p className="text-gray-600 text-sm">Hari Aktif</p>
          </div>

          {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {occupancyData.filter((d) => d.occupancyRate >= 80).length}
            </h3>
            <p className="text-gray-600 text-sm">Hari Overload</p>
          </div> */}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {occupancyData.length > 0
                ? Math.round(
                    occupancyData.reduce((sum, d) => sum + d.occupancyRate, 0) /
                      occupancyData.length
                  )
                : 0}
              %
            </h3>
            <p className="text-gray-600 text-sm">Rata-rata Okupansi</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Gamepad2 className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {occupancyData.reduce((sum, d) => sum + d.totalConsoles, 0)}
            </h3>
            <p className="text-gray-600 text-sm">
              Total Console yang Digunakan
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Memuat data okupansi...</div>
      </div>
    );
  }

  return <div className="space-y-6">{renderCalendarView()}</div>;
};

export default OccupancyCalendar;
