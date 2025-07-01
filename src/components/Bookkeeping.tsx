import React, { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, Calendar, DollarSign, FileText, Filter } from 'lucide-react';
import { mockBookkeepingEntries } from '../data/mockData';

const Bookkeeping: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    type: 'income' as 'income' | 'expense',
    category: 'rental' as 'rental' | 'cafe' | 'inventory' | 'operational' | 'other',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    reference: '',
    notes: ''
  });

  const periods = [
    { value: 'today', label: 'Hari Ini' },
    { value: 'week', label: 'Minggu Ini' },
    { value: 'month', label: 'Bulan Ini' },
    { value: 'year', label: 'Tahun Ini' }
  ];

  const types = [
    { value: 'all', label: 'Semua' },
    { value: 'income', label: 'Pemasukan' },
    { value: 'expense', label: 'Pengeluaran' }
  ];

  const categories = [
    { value: 'all', label: 'Semua Kategori' },
    { value: 'rental', label: 'Rental PlayStation' },
    { value: 'cafe', label: 'Penjualan Cafe' },
    { value: 'inventory', label: 'Pembelian Inventory' },
    { value: 'operational', label: 'Operasional' },
    { value: 'other', label: 'Lainnya' }
  ];

  const filteredEntries = mockBookkeepingEntries.filter(entry => {
    const matchesType = selectedType === 'all' || entry.type === selectedType;
    const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory;
    return matchesType && matchesCategory;
  });

  const totalIncome = mockBookkeepingEntries
    .filter(entry => entry.type === 'income')
    .reduce((sum, entry) => sum + entry.amount, 0);

  const totalExpense = mockBookkeepingEntries
    .filter(entry => entry.type === 'expense')
    .reduce((sum, entry) => sum + entry.amount, 0);

  const netProfit = totalIncome - totalExpense;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'rental': return 'bg-blue-100 text-blue-800';
      case 'cafe': return 'bg-green-100 text-green-800';
      case 'inventory': return 'bg-orange-100 text-orange-800';
      case 'operational': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'income' ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const handleAddEntry = () => {
    if (!newEntry.description || newEntry.amount <= 0) {
      alert('Description and amount are required');
      return;
    }
    
    // Here you would normally save to database
    alert('Transaction added successfully!');
    setShowAddForm(false);
    setNewEntry({
      type: 'income',
      category: 'rental',
      description: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      reference: '',
      notes: ''
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Pembukuan</h1>
            <p className="text-gray-600">Kelola catatan keuangan bisnis</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Tambah Transaksi
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
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
          
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {types.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            Rp {totalIncome.toLocaleString('id-ID')}
          </h3>
          <p className="text-gray-600 text-sm">Total Pemasukan</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <TrendingDown className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            Rp {totalExpense.toLocaleString('id-ID')}
          </h3>
          <p className="text-gray-600 text-sm">Total Pengeluaran</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
            netProfit >= 0 ? 'bg-blue-100' : 'bg-red-100'
          }`}>
            <DollarSign className={`h-6 w-6 ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
          </div>
          <h3 className={`text-2xl font-bold mb-1 ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            Rp {Math.abs(netProfit).toLocaleString('id-ID')}
          </h3>
          <p className="text-gray-600 text-sm">{netProfit >= 0 ? 'Laba Bersih' : 'Rugi Bersih'}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <FileText className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{mockBookkeepingEntries.length}</h3>
          <p className="text-gray-600 text-sm">Total Transaksi</p>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Riwayat Transaksi</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredEntries.map((entry) => (
            <div key={entry.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    entry.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {getTypeIcon(entry.type)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{entry.description}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(entry.category)}`}>
                        {entry.category}
                      </span>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {new Date(entry.date).toLocaleDateString('id-ID')}
                      </div>
                      {entry.reference && (
                        <span className="text-sm text-gray-500">Ref: {entry.reference}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    entry.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {entry.type === 'income' ? '+' : '-'}Rp {entry.amount.toLocaleString('id-ID')}
                  </p>
                  <p className="text-sm text-gray-600 capitalize">{entry.type}</p>
                </div>
              </div>
              
              {entry.notes && (
                <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <strong>Catatan:</strong> {entry.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Tambah Transaksi</h2>
              
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Transaksi</label>
                  <select 
                    value={newEntry.type}
                    onChange={(e) => setNewEntry({...newEntry, type: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="income">Pemasukan</option>
                    <option value="expense">Pengeluaran</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <select 
                    value={newEntry.category}
                    onChange={(e) => setNewEntry({...newEntry, category: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="rental">Rental PlayStation</option>
                    <option value="cafe">Penjualan Cafe</option>
                    <option value="inventory">Pembelian Inventory</option>
                    <option value="operational">Operasional</option>
                    <option value="other">Lainnya</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi *</label>
                  <input
                    type="text"
                    value={newEntry.description}
                    onChange={(e) => setNewEntry({...newEntry, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Deskripsi transaksi"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah *</label>
                  <input
                    type="number"
                    value={newEntry.amount}
                    onChange={(e) => setNewEntry({...newEntry, amount: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={newEntry.date}
                    onChange={(e) => setNewEntry({...newEntry, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Referensi (Opsional)</label>
                  <input
                    type="text"
                    value={newEntry.reference}
                    onChange={(e) => setNewEntry({...newEntry, reference: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nomor referensi"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (Opsional)</label>
                  <textarea
                    value={newEntry.notes}
                    onChange={(e) => setNewEntry({...newEntry, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Catatan tambahan"
                  />
                </div>
              </form>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={handleAddEntry}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookkeeping;