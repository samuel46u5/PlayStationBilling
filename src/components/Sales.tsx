import React, { useState } from 'react';
import { Calendar, DollarSign, ShoppingCart, TrendingUp, User, Receipt } from 'lucide-react';
import { mockSales, mockProducts } from '../data/mockData';

const Sales: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [selectedSale, setSelectedSale] = useState<string | null>(null);

  const periods = [
    { value: 'today', label: 'Hari Ini' },
    { value: 'week', label: 'Minggu Ini' },
    { value: 'month', label: 'Bulan Ini' },
    { value: 'year', label: 'Tahun Ini' }
  ];

  const totalSales = mockSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalTransactions = mockSales.length;
  const averageTransaction = totalSales / totalTransactions || 0;

  // Top selling products
  const productSales = mockSales.reduce((acc, sale) => {
    sale.items.forEach(item => {
      if (!acc[item.productId]) {
        acc[item.productId] = {
          productName: item.productName,
          quantity: 0,
          revenue: 0
        };
      }
      acc[item.productId].quantity += item.quantity;
      acc[item.productId].revenue += item.total;
    });
    return acc;
  }, {} as Record<string, { productName: string; quantity: number; revenue: number }>);

  const topProducts = Object.entries(productSales)
    .sort(([,a], [,b]) => b.quantity - a.quantity)
    .slice(0, 5);

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'cash': return 'bg-green-100 text-green-800';
      case 'card': return 'bg-blue-100 text-blue-800';
      case 'transfer': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Laporan Penjualan</h1>
            <p className="text-gray-600">Analisis penjualan produk cafe</p>
          </div>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {periods.map(period => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sales Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            Rp {totalSales.toLocaleString('id-ID')}
          </h3>
          <p className="text-gray-600 text-sm">Total Penjualan</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <ShoppingCart className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{totalTransactions}</h3>
          <p className="text-gray-600 text-sm">Total Transaksi</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            Rp {Math.round(averageTransaction).toLocaleString('id-ID')}
          </h3>
          <p className="text-gray-600 text-sm">Rata-rata Transaksi</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Receipt className="h-6 w-6 text-orange-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {mockSales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)}
          </h3>
          <p className="text-gray-600 text-sm">Total Item Terjual</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Produk Terlaris</h2>
          <div className="space-y-4">
            {topProducts.map(([productId, data], index) => (
              <div key={productId} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{data.productName}</p>
                    <p className="text-sm text-gray-600">{data.quantity} unit terjual</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    Rp {data.revenue.toLocaleString('id-ID')}
                  </p>
                  <p className="text-sm text-gray-600">Revenue</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Metode Pembayaran</h2>
          <div className="space-y-4">
            {['cash', 'card', 'transfer'].map(method => {
              const methodSales = mockSales.filter(sale => sale.paymentMethod === method);
              const methodTotal = methodSales.reduce((sum, sale) => sum + sale.total, 0);
              const percentage = totalSales > 0 ? (methodTotal / totalSales) * 100 : 0;
              
              return (
                <div key={method} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getPaymentMethodColor(method)}`}>
                      {method.toUpperCase()}
                    </span>
                    <span className="font-semibold text-gray-900">
                      Rp {methodTotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{methodSales.length} transaksi</span>
                    <span>{percentage.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Sales */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Transaksi Terbaru</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {mockSales.map((sale) => (
            <div key={sale.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Receipt className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">#{sale.id}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(sale.saleDate).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    Rp {sale.total.toLocaleString('id-ID')}
                  </p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPaymentMethodColor(sale.paymentMethod)}`}>
                    {sale.paymentMethod.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{sale.items.length} item</span>
                  {sale.customerId && (
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>Customer</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSelectedSale(selectedSale === sale.id ? null : sale.id)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {selectedSale === sale.id ? 'Tutup' : 'Detail'}
                </button>
              </div>

              {/* Sale Details */}
              {selectedSale === sale.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">Detail Pembelian</h4>
                  <div className="space-y-2">
                    {sale.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">
                          {item.productName} x {item.quantity}
                        </span>
                        <span className="font-medium text-gray-900">
                          Rp {item.total.toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span>Rp {sale.subtotal.toLocaleString('id-ID')}</span>
                    </div>
                    {sale.discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Diskon:</span>
                        <span className="text-red-600">-Rp {sale.discount.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium">
                      <span>Total:</span>
                      <span>Rp {sale.total.toLocaleString('id-ID')}</span>
                    </div>
                    {sale.paymentMethod === 'cash' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Bayar:</span>
                          <span>Rp {sale.paymentAmount.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Kembalian:</span>
                          <span>Rp {sale.changeAmount.toLocaleString('id-ID')}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sales;