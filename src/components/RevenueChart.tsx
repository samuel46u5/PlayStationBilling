import React, { memo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export interface RevenueDataPoint {
  month: string;
  revenue: number;
}

interface RevenueChartProps {
  title?: string;
  data: RevenueDataPoint[];
  height?: number;
  showTooltip?: boolean;
  loading?: boolean;
  error?: string | null;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-blue-600">
          Omset:{" "}
          <span className="font-bold">
            Rp {(data.revenue * 1000000).toLocaleString("id-ID")}
          </span>
        </p>
        <p className="text-sm text-gray-500">
          {data.revenue.toFixed(1)} juta rupiah
        </p>
      </div>
    );
  }
  return null;
};

const RevenueChart = React.memo<RevenueChartProps>(
  ({
    title = "Omset Bulanan",
    data,
    height = 300,
    showTooltip = true,
    loading = false,
    error = null,
  }) => {
    if (loading) {
      return (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-center text-red-500">
            <p>Terjadi kesalahan saat memuat data chart</p>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
          </div>
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-center text-gray-500">
            <p>Tidak ada data untuk ditampilkan</p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        )}

        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}jt`}
            />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ fill: "#2563eb", strokeWidth: 2, r: 4 }}
              activeDot={{
                r: 6,
                stroke: "#2563eb",
                strokeWidth: 2,
                fill: "#fff",
              }}
              name="Omset (juta rupiah)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }
);

export default RevenueChart;
