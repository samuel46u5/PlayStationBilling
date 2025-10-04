import React from 'react';

type Props = {
  search: string;
  onSearch: (v: string) => void;
  period: string;
  onPeriodChange: (v: string) => void;
  dateRange: { start: string; end: string };
  onDateRangeChange: (r: { start: string; end: string }) => void;
  placeholder?: string;
};

const PurchaseFilters: React.FC<Props> = ({ search, onSearch, period, onPeriodChange, dateRange, onDateRangeChange, placeholder }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end gap-4">
      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-700 mb-1">Cari PO / Supplier</label>
        <input
          type="text"
          placeholder={placeholder || "Cari PO number atau nama supplier..."}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Periode</label>
        <select value={period} onChange={(e) => onPeriodChange(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <option value="today">Hari Ini</option>
          <option value="yesterday">Kemarin</option>
          <option value="week">Minggu Ini</option>
          <option value="month">Bulan Ini</option>
          <option value="range">Rentang Waktu</option>
        </select>
      </div>
      {period === 'range' && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal Order</label>
          <div className="flex gap-2 items-center">
            <input type="date" value={dateRange.start} onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            <span className="self-center">-</span>
            <input type="date" value={dateRange.end} onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseFilters;
