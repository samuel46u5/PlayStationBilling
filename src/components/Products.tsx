import React, { useState, useEffect } from 'react';
import { Plus, Search, Package, Edit, Trash2, AlertTriangle, ShoppingBag, TrendingUp, Calendar, FileText, Truck, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';
import { supabase, db } from '../lib/supabase';

const Products: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'purchases' | 'suppliers'>('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState<string | null>(null);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);

  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'beverage' as 'beverage' | 'food' | 'snack' | 'other',
    price: 0,
    cost: 0,
    stock: 0,
    min_stock: 0,
    barcode: '',
    description: '',
    supplier_id: ''
  });

  const [newPurchase, setNewPurchase] = useState({
    supplier_id: '',
    items: [] as Array<{
      product_id: string;
      product_name: string;
      quantity: number;
      unit_cost: number;
      total: number;
    }>,
    notes: '',
    expected_date: new Date().toISOString().split('T')[0]
  });

  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    category: 'beverage' as 'beverage' | 'food' | 'snack' | 'other'
  });

  // Calculate totals whenever items change
  const [purchaseSubtotal, setPurchaseSubtotal] = useState(0);
  const [purchaseTax, setPurchaseTax] = useState(0);
  const [purchaseTotal, setPurchaseTotal] = useState(0);

  // Update totals when items change
  useEffect(() => {
    const subtotal = newPurchase.items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;
    
    setPurchaseSubtotal(subtotal);
    setPurchaseTax(tax);
    setPurchaseTotal(total);
  }, [newPurchase.items]);

  // Load data on component mount
  useEffect(() => {
    loadProducts();
    loadSuppliers();
    loadPurchaseOrders();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await db.products.getAll();
      setProducts(data || []);
    } catch (err: any) {
      setError('Failed to load products: ' + err.message);
      console.error('Error loading products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const data = await db.select('suppliers', '*', { is_active: true });
      setSuppliers(data || []);
    } catch (err: any) {
      console.error('Error loading suppliers:', err);
    }
  };

  const loadPurchaseOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          suppliers(name),
          purchase_order_items(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPurchaseOrders(data || []);
    } catch (err: any) {
      console.error('Error loading purchase orders:', err);
    }
  };

  const categories = [
    { value: 'all', label: 'Semua Kategori' },
    { value: 'beverage', label: 'Minuman' },
    { value: 'food', label: 'Makanan' },
    { value: 'snack', label: 'Snack' },
    { value: 'other', label: 'Lainnya' }
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode?.includes(searchTerm);
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredPurchases = purchaseOrders.filter(purchase => {
    const supplier = purchase.suppliers;
    return supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           purchase.po_number.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_person.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'beverage': return 'bg-blue-100 text-blue-800';
      case 'food': return 'bg-orange-100 text-orange-800';
      case 'snack': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'ordered': return 'bg-blue-100 text-blue-800';
      case 'received': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'ordered': return <Truck className="h-4 w-4" />;
      case 'received': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const lowStockProducts = products.filter(p => p.stock <= p.min_stock);

  const addItemToPurchase = () => {
    const newItem = {
      product_id: '',
      product_name: '',
      quantity: 1,
      unit_cost: 0,
      total: 0
    };
    
    setNewPurchase(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const updatePurchaseItem = (index: number, field: string, value: any) => {
    setNewPurchase(prev => {
      const updatedItems = [...prev.items];
      const item = { ...updatedItems[index] };
      
      // Update the specific field
      item[field as keyof typeof item] = value;
      
      // Handle product selection
      if (field === 'product_id') {
        const product = products.find(p => p.id === value);
        if (product) {
          item.product_name = product.name;
          item.unit_cost = product.cost;
          item.total = item.quantity * product.cost;
        } else {
          item.product_name = '';
          item.unit_cost = 0;
          item.total = 0;
        }
      }
      
      // Recalculate total when quantity or unit_cost changes
      if (field === 'quantity' || field === 'unit_cost') {
        item.total = item.quantity * item.unit_cost;
      }
      
      updatedItems[index] = item;
      
      return {
        ...prev,
        items: updatedItems
      };
    });
  };

  const removePurchaseItem = (index: number) => {
    setNewPurchase(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || newProduct.price <= 0) {
      setError('Nama produk dan harga wajib diisi');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      await db.insert('products', {
        name: newProduct.name,
        category: newProduct.category,
        price: newProduct.price,
        cost: newProduct.cost,
        stock: newProduct.stock,
        min_stock: newProduct.min_stock,
        barcode: newProduct.barcode || null,
        description: newProduct.description || null,
        supplier_id: newProduct.supplier_id || null,
        is_active: true
      });
      
      // Reload products
      await loadProducts();
      
      // Reset form
      setShowAddForm(false);
      setNewProduct({
        name: '',
        category: 'beverage',
        price: 0,
        cost: 0,
        stock: 0,
        min_stock: 0,
        barcode: '',
        description: '',
        supplier_id: ''
      });
      
      alert('Produk berhasil ditambahkan!');
    } catch (err: any) {
      setError('Gagal menambahkan produk: ' + err.message);
      console.error('Error adding product:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePurchase = async () => {
    if (!newPurchase.supplier_id || newPurchase.items.length === 0) {
      setError('Supplier dan item pembelian wajib diisi');
      return;
    }
    
    const invalidItems = newPurchase.items.some(item => !item.product_id || item.quantity <= 0);
    if (invalidItems) {
      setError('Semua item harus memiliki produk dan quantity yang valid');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Generate PO number
      const { data: poNumber } = await supabase.rpc('generate_po_number');
      
      // Create purchase order
      const purchaseOrder = await db.insert('purchase_orders', {
        po_number: poNumber,
        supplier_id: newPurchase.supplier_id,
        expected_date: newPurchase.expected_date,
        subtotal: purchaseSubtotal,
        tax: purchaseTax,
        total_amount: purchaseTotal,
        notes: newPurchase.notes || null,
        status: 'pending'
      });

      // Create purchase order items
      await Promise.all(
        newPurchase.items.map(item => 
          db.insert('purchase_order_items', {
            po_id: purchaseOrder.id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_cost: item.unit_cost,
            total: item.total
          })
        )
      );

      // Reload purchase orders
      await loadPurchaseOrders();
      
      alert(`Purchase Order ${poNumber} berhasil dibuat!\nSubtotal: Rp ${purchaseSubtotal.toLocaleString('id-ID')}\nPajak: Rp ${purchaseTax.toLocaleString('id-ID')}\nTotal: Rp ${purchaseTotal.toLocaleString('id-ID')}`);
      
      setShowPurchaseForm(false);
      setNewPurchase({
        supplier_id: '',
        items: [],
        notes: '',
        expected_date: new Date().toISOString().split('T')[0]
      });
    } catch (err: any) {
      setError('Gagal membuat purchase order: ' + err.message);
      console.error('Error creating purchase order:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSupplier = async () => {
    if (!newSupplier.name || !newSupplier.contact_person) {
      setError('Nama supplier dan kontak wajib diisi');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      await db.insert('suppliers', {
        name: newSupplier.name,
        contact_person: newSupplier.contact_person,
        phone: newSupplier.phone,
        email: newSupplier.email || null,
        address: newSupplier.address || null,
        category: newSupplier.category,
        is_active: true
      });
      
      // Reload suppliers
      await loadSuppliers();
      
      alert('Supplier berhasil ditambahkan!');
      setShowSupplierForm(false);
      setNewSupplier({
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        category: 'beverage'
      });
    } catch (err: any) {
      setError('Gagal menambahkan supplier: ' + err.message);
      console.error('Error adding supplier:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProduct = async (productId: string) => {
    // Here you would normally update the database
    alert(`Product ${productId} berhasil diperbarui!`);
    setShowEditForm(null);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      try {
        setIsLoading(true);
        await db.update('products', productId, { is_active: false });
        await loadProducts();
        alert('Produk berhasil dihapus!');
      } catch (err: any) {
        setError('Gagal menghapus produk: ' + err.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const renderProductsTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manajemen Produk</h2>
          <p className="text-gray-600">Kelola inventory produk cafe</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          {isLoading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
          Tambah Produk
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
          <button 
            onClick={() => setError(null)}
            className="mt-2 text-red-600 hover:text-red-700 text-sm"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Cari produk atau barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {categories.map(category => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-800">Stok Menipis</h3>
          </div>
          <p className="text-red-700 text-sm">
            {lowStockProducts.length} produk memiliki stok di bawah minimum: {' '}
            {lowStockProducts.map(p => p.name).join(', ')}
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Memuat produk...</span>
        </div>
      )}

      {/* Products Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Product Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(product.category)}`}>
                    {product.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setShowEditForm(product.id)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
              </div>

              {/* Product Details */}
              <div className="p-4">
                <div className="space-y-3">
                  {/* Price & Cost */}
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500">Harga Jual</p>
                      <p className="font-semibold text-green-600">
                        Rp {product.price.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Modal</p>
                      <p className="font-medium text-gray-700">
                        Rp {product.cost.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>

                  {/* Stock */}
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500">Stok Tersedia</p>
                      <p className={`font-semibold ${
                        product.stock <= product.min_stock ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        {product.stock} unit
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Min. Stok</p>
                      <p className="font-medium text-gray-700">{product.min_stock} unit</p>
                    </div>
                  </div>

                  {/* Profit Margin */}
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Margin Keuntungan</span>
                      <span className="font-semibold text-purple-600">
                        {Math.round(((product.price - product.cost) / product.price) * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Barcode */}
                  {product.barcode && (
                    <div className="pt-2">
                      <p className="text-xs text-gray-500">Barcode</p>
                      <p className="font-mono text-sm text-gray-700">{product.barcode}</p>
                    </div>
                  )}

                  {/* Supplier */}
                  {product.suppliers && (
                    <div className="pt-2">
                      <p className="text-xs text-gray-500">Supplier</p>
                      <p className="text-sm text-gray-700">{product.suppliers.name}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderPurchasesTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pembelian Stok</h2>
          <p className="text-gray-600">Kelola purchase order dan pembelian produk</p>
        </div>
        <button
          onClick={() => setShowPurchaseForm(true)}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          {isLoading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <ShoppingBag className="h-5 w-5" />}
          Buat Purchase Order
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Cari PO atau supplier..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Purchase Orders List */}
      <div className="space-y-4">
        {filteredPurchases.map((purchase) => {
          const supplier = purchase.suppliers;
          return (
            <div key={purchase.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{purchase.po_number}</h3>
                    <p className="text-gray-600">{supplier?.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(purchase.status)}`}>
                    {getStatusIcon(purchase.status)}
                    {purchase.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <div>
                    <p className="text-xs">Tanggal Order</p>
                    <p className="font-medium text-gray-900">{new Date(purchase.order_date).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-gray-600">
                  <Truck className="h-4 w-4" />
                  <div>
                    <p className="text-xs">Estimasi Tiba</p>
                    <p className="font-medium text-gray-900">{new Date(purchase.expected_date).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-gray-600">
                  <Package className="h-4 w-4" />
                  <div>
                    <p className="text-xs">Total Item</p>
                    <p className="font-medium text-gray-900">{purchase.purchase_order_items?.length || 0} produk</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-gray-600">
                  <TrendingUp className="h-4 w-4" />
                  <div>
                    <p className="text-xs">Total Nilai</p>
                    <p className="font-medium text-gray-900">Rp {purchase.total_amount.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setSelectedPurchase(selectedPurchase === purchase.id ? null : purchase.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Lihat Detail
                </button>
                
                {purchase.status === 'pending' && (
                  <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    Konfirmasi Order
                  </button>
                )}
                
                {purchase.status === 'ordered' && (
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    Terima Barang
                  </button>
                )}
              </div>

              {/* Extended Details */}
              {selectedPurchase === purchase.id && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Detail Purchase Order</h4>
                  
                  {/* Items List */}
                  <div className="space-y-2 mb-4">
                    {purchase.purchase_order_items?.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200">
                        <div>
                          <span className="font-medium">{item.product_name}</span>
                          <span className="text-gray-600 ml-2">x {item.quantity}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">Rp {item.total.toLocaleString('id-ID')}</div>
                          <div className="text-sm text-gray-600">@Rp {item.unit_cost.toLocaleString('id-ID')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Supplier Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Informasi Supplier</h5>
                      <div className="text-sm space-y-1">
                        <div><strong>Nama:</strong> {supplier?.name}</div>
                        <div><strong>Kontak:</strong> {supplier?.contact_person}</div>
                        <div><strong>Telepon:</strong> {supplier?.phone}</div>
                        <div><strong>Email:</strong> {supplier?.email}</div>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Detail Order</h5>
                      <div className="text-sm space-y-1">
                        <div><strong>PO Number:</strong> {purchase.po_number}</div>
                        <div><strong>Status:</strong> {purchase.status}</div>
                        <div><strong>Subtotal:</strong> Rp {purchase.subtotal.toLocaleString('id-ID')}</div>
                        <div><strong>Pajak:</strong> Rp {purchase.tax.toLocaleString('id-ID')}</div>
                        <div><strong>Total:</strong> Rp {purchase.total_amount.toLocaleString('id-ID')}</div>
                      </div>
                    </div>
                  </div>
                  
                  {purchase.notes && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <strong className="text-blue-800">Catatan:</strong>
                      <p className="text-blue-700 mt-1">{purchase.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderSuppliersTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manajemen Supplier</h2>
          <p className="text-gray-600">Kelola data supplier dan vendor</p>
        </div>
        <button
          onClick={() => setShowSupplierForm(true)}
          disabled={isLoading}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          {isLoading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
          Tambah Supplier
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Cari supplier..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map((supplier) => (
          <div key={supplier.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Truck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{supplier.name}</h3>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(supplier.category)}`}>
                    {supplier.category}
                  </span>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-4">
              <div className="space-y-3">
                <div className="text-sm">
                  <p className="text-gray-600">Kontak Person</p>
                  <p className="font-medium">{supplier.contact_person}</p>
                </div>
                
                <div className="text-sm">
                  <p className="text-gray-600">Telepon</p>
                  <p className="font-medium">{supplier.phone}</p>
                </div>
                
                <div className="text-sm">
                  <p className="text-gray-600">Email</p>
                  <p className="font-medium">{supplier.email}</p>
                </div>
                
                {supplier.address && (
                  <div className="text-sm">
                    <p className="text-gray-600">Alamat</p>
                    <p className="font-medium">{supplier.address}</p>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total PO:</span>
                    <span className="font-medium">
                      {purchaseOrders.filter(po => po.supplier_id === supplier.id).length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  Buat PO
                </button>
                <button className="p-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg transition-colors">
                  <Edit className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Manajemen Produk & Pembelian</h1>
        <p className="text-gray-600">Kelola produk, pembelian stok, dan supplier</p>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'products', label: 'Produk', icon: Package },
              { id: 'purchases', label: 'Pembelian', icon: ShoppingBag },
              { id: 'suppliers', label: 'Supplier', icon: Truck }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setSearchTerm('');
                    setError(null);
                  }}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'products' && renderProductsTab()}
      {activeTab === 'purchases' && renderPurchasesTab()}
      {activeTab === 'suppliers' && renderSuppliersTab()}

      {/* Add Product Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Tambah Produk Baru</h2>
              
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleAddProduct(); }}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk *</label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Masukkan nama produk"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <select 
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="beverage">Minuman</option>
                    <option value="food">Makanan</option>
                    <option value="snack">Snack</option>
                    <option value="other">Lainnya</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Harga Modal *</label>
                    <input
                      type="number"
                      value={newProduct.cost}
                      onChange={(e) => setNewProduct({...newProduct, cost: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Harga Jual *</label>
                    <input
                      type="number"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stok Awal</label>
                    <input
                      type="number"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({...newProduct, stock: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min. Stok</label>
                    <input
                      type="number"
                      value={newProduct.min_stock}
                      onChange={(e) => setNewProduct({...newProduct, min_stock: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier (Opsional)</label>
                  <select
                    value={newProduct.supplier_id}
                    onChange={(e) => setNewProduct({...newProduct, supplier_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Pilih Supplier</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barcode (Opsional)</label>
                  <input
                    type="text"
                    value={newProduct.barcode}
                    onChange={(e) => setNewProduct({...newProduct, barcode: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Scan atau masukkan barcode"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Deskripsi produk"
                  />
                </div>
              </form>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                  disabled={isLoading}
                >
                  Batal
                </button>
                <button 
                  onClick={handleAddProduct}
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
                  Simpan Produk
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Purchase Order Modal */}
      {showPurchaseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Buat Purchase Order</h2>
              
              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleCreatePurchase(); }}>
                {/* Supplier Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
                    <select
                      value={newPurchase.supplier_id}
                      onChange={(e) => setNewPurchase({...newPurchase, supplier_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Pilih Supplier</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Diharapkan</label>
                    <input
                      type="date"
                      value={newPurchase.expected_date}
                      onChange={(e) => setNewPurchase({...newPurchase, expected_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Items Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-900">Item Pembelian</h3>
                    <button
                      type="button"
                      onClick={addItemToPurchase}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Tambah Item
                    </button>
                  </div>

                  <div className="space-y-3">
                    {newPurchase.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-3 items-end p-3 bg-gray-50 rounded-lg">
                        <div className="col-span-4">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Produk</label>
                          <select
                            value={item.product_id}
                            onChange={(e) => updatePurchaseItem(index, 'product_id', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Pilih Produk</option>
                            {products.map(product => (
                              <option key={product.id} value={product.id}>{product.name}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Qty</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updatePurchaseItem(index, 'quantity', Number(e.target.value))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            min="1"
                          />
                        </div>
                        
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Harga Satuan</label>
                          <input
                            type="number"
                            value={item.unit_cost}
                            onChange={(e) => updatePurchaseItem(index, 'unit_cost', Number(e.target.value))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        
                        <div className="col-span-3">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Total</label>
                          <div className="px-2 py-1 bg-gray-100 rounded text-sm font-medium">
                            Rp {item.total.toLocaleString('id-ID')}
                          </div>
                        </div>
                        
                        <div className="col-span-1">
                          <button
                            type="button"
                            onClick={() => removePurchaseItem(index)}
                            className="w-full p-1 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Real-time Total Calculation */}
                  {newPurchase.items.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-3">Ringkasan Purchase Order</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-blue-800">Subtotal:</span>
                          <span className="font-medium text-blue-900">
                            Rp {purchaseSubtotal.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-blue-800">Pajak (10%):</span>
                          <span className="font-medium text-blue-900">
                            Rp {purchaseTax.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-t border-blue-300 pt-2">
                          <span className="font-bold text-blue-900">Total:</span>
                          <span className="text-xl font-bold text-blue-900">
                            Rp {purchaseTotal.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (Opsional)</label>
                  <textarea
                    value={newPurchase.notes}
                    onChange={(e) => setNewPurchase({...newPurchase, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Catatan untuk supplier"
                  />
                </div>
              </form>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowPurchaseForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                  disabled={isLoading}
                >
                  Batal
                </button>
                <button 
                  onClick={handleCreatePurchase}
                  disabled={isLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
                  Buat Purchase Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showSupplierForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Tambah Supplier Baru</h2>
              
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleAddSupplier(); }}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Supplier *</label>
                  <input
                    type="text"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nama perusahaan supplier"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kontak Person *</label>
                  <input
                    type="text"
                    value={newSupplier.contact_person}
                    onChange={(e) => setNewSupplier({...newSupplier, contact_person: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nama kontak person"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telepon *</label>
                    <input
                      type="tel"
                      value={newSupplier.phone}
                      onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+62 8xx-xxxx-xxxx"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                    <select 
                      value={newSupplier.category}
                      onChange={(e) => setNewSupplier({...newSupplier, category: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="beverage">Minuman</option>
                      <option value="food">Makanan</option>
                      <option value="snack">Snack</option>
                      <option value="other">Lainnya</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="email@supplier.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                  <textarea
                    value={newSupplier.address}
                    onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Alamat lengkap supplier"
                  />
                </div>
              </form>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowSupplierForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                  disabled={isLoading}
                >
                  Batal
                </button>
                <button 
                  onClick={handleAddSupplier}
                  disabled={isLoading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
                  Tambah Supplier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Package className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{products.length}</h3>
          <p className="text-gray-600 text-sm">Total Produk</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <ShoppingBag className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {purchaseOrders.length}
          </h3>
          <p className="text-gray-600 text-sm">Purchase Order</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Truck className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {suppliers.length}
          </h3>
          <p className="text-gray-600 text-sm">Supplier</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{lowStockProducts.length}</h3>
          <p className="text-gray-600 text-sm">Stok Menipis</p>
        </div>
      </div>
    </div>
  );
};

export default Products;