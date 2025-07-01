import React from 'react';
import { DollarSign, Users, Gamepad2, Clock, TrendingUp, AlertCircle, ShoppingCart, Package } from 'lucide-react';
import { mockCustomers, mockConsoles, mockRentalSessions, mockSales, mockProducts, mockRateProfiles } from '../data/mockData';

const Dashboard: React.FC = () => {
  const activeRentals = mockRentalSessions.filter(session => session.status === 'active').length;
  const availableConsoles = mockConsoles.filter(console => console.status === 'available').length;
  const rentalRevenue = mockRentalSessions.reduce((sum, session) => sum + session.paidAmount, 0);
  const cafeRevenue = mockSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalRevenue = rentalRevenue + cafeRevenue;
  const pendingPayments = mockRentalSessions.filter(session => session.paymentStatus === 'pending').length;
  const lowStockProducts = mockProducts.filter(p => p.stock <= p.minStock).length;

  const stats = [
    {
      title: 'Total Revenue Hari Ini',
      value: `Rp ${totalRevenue.toLocaleString('id-ID')}`,
      icon: DollarSign,
      color: 'bg-green-500',
      trend: '+12%',
      subtitle: `Rental: Rp ${rentalRevenue.toLocaleString('id-ID')} | Cafe: Rp ${cafeRevenue.toLocaleString('id-ID')}`
    },
    {
      title: 'Active Rentals',
      value: activeRentals.toString(),
      icon: Gamepad2,
      color: 'bg-blue-500',
      trend: '+3'
    },
    {
      title: 'Penjualan Cafe',
      value: mockSales.length.toString(),
      icon: ShoppingCart,
      color: 'bg-purple-500',
      trend: `Rp ${cafeRevenue.toLocaleString('id-ID')}`
    },
    {
      title: 'Stok Menipis',
      value: lowStockProducts.toString(),
      icon: AlertCircle,
      color: lowStockProducts > 0 ? 'bg-red-500' : 'bg-green-500',
      trend: lowStockProducts > 0 ? 'Perlu restok' : 'Stok aman'
    }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Selamat datang! Berikut ringkasan bisnis hari ini.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-green-600 font-medium">{stat.trend}</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-gray-600 text-sm">{stat.title}</p>
              {stat.subtitle && (
                <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Rentals */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Rental Terbaru</h2>
          <div className="space-y-4">
            {mockRentalSessions.slice(0, 3).map((session) => {
              const customer = mockCustomers.find(c => c.id === session.customerId);
              const console = mockConsoles.find(c => c.id === session.consoleId);
              return (
                <div key={session.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Gamepad2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{customer?.name}</p>
                      <p className="text-sm text-gray-600">{console?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">Rp {session.totalAmount.toLocaleString('id-ID')}</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      session.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {session.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Cafe Sales */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Penjualan Cafe Terbaru</h2>
          <div className="space-y-4">
            {mockSales.slice(0, 3).map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">#{sale.id}</p>
                    <p className="text-sm text-gray-600">
                      {sale.items.length} item - {new Date(sale.saleDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">Rp {sale.total.toLocaleString('id-ID')}</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    sale.paymentMethod === 'cash' ? 'bg-green-100 text-green-800' :
                    sale.paymentMethod === 'card' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {sale.paymentMethod.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Console Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Status Konsol</h2>
          <div className="space-y-4">
            {mockConsoles.map((console) => {
              const rateProfile = mockRateProfiles.find(rp => rp.id === console.rateProfileId);
              return (
                <div key={console.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      console.status === 'available' ? 'bg-green-100' :
                      console.status === 'rented' ? 'bg-blue-100' : 'bg-red-100'
                    }`}>
                      <Gamepad2 className={`h-5 w-5 ${
                        console.status === 'available' ? 'text-green-600' :
                        console.status === 'rented' ? 'text-blue-600' : 'text-red-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{console.name}</p>
                      <p className="text-sm text-gray-600">
                        Rp {rateProfile?.hourlyRate?.toLocaleString('id-ID') || '0'}/jam
                      </p>
                    </div>
                  </div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    console.status === 'available' ? 'bg-green-100 text-green-800' :
                    console.status === 'rented' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {console.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Produk Terlaris</h2>
          <div className="space-y-4">
            {mockProducts.slice(0, 5).map((product, index) => (
              <div key={product.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-purple-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">Stok: {product.stock}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    Rp {product.price.toLocaleString('id-ID')}
                  </p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    product.stock <= product.minStock ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {product.stock <= product.minStock ? 'Low Stock' : 'In Stock'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;