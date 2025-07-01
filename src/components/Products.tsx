import React, { useState, useEffect } from 'react';
import { Plus, Search, Package, Edit, Trash2, AlertTriangle, ShoppingBag, TrendingUp, Calendar, FileText, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';
import { db } from '../lib/supabase';
import Swal from 'sweetalert2';

const Products: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'purchases' | 'suppliers'>('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState<string | null>(null);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'beverage' as 'beverage' | 'food' | 'snack' | 'other',
    price: 0,
    cost: 0,
    stock: 0,
    minStock: 0,
    barcode: '',
    description: ''
  });

  const [newPurchase, setNewPurchase] = useState({
    supplierId: '',
    items: [] as Array<{
      productId: string;
      productName: string;
      quantity: number;
      unitCost: number;
      total: number;
    }>,
    notes: '',
    expectedDate: new Date().toISOString().split('T')[0]
  });

  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contact: '',
    phone: '',
    email: '',
    address: '',
    category: 'beverage' as 'beverage' | 'food' | 'snack' | 'other'
  });

  // Calculate totals whenever items change
  const [purchaseSubtotal, setPurchaseSubtotal] = useState(0);
  const [purchaseTax, setPurchaseTax] = useState(0);
  const [purchaseTotal, setPurchaseTotal] = useState(0);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load products
        const productsData = await db.products.getAll();
        setProducts(productsData);
        
        // Load suppliers
        const suppliersData = await db.select('suppliers');
        setSuppliers(suppliersData);
        
        // Load purchase orders
        const purchaseOrdersData = await db.select('purchase_orders', `
          *,
          suppliers(name),
          items:purchase_order_items(*)
        `);
        setPurchaseOrders(purchaseOrdersData);
        
      } catch (error) {
        console.error('Failed to load data:', error);
        Swal.fire({
          icon: 'error',
          title: 'Data Loading Error',
          text: 'Failed to load data. Please try refreshing the page.'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Update totals when items change
  useEffect(() => {
    const subtotal = newPurchase.items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;
    
    setPurchaseSubtotal(subtotal);
    setPurchaseTax(tax);
    setPurchaseTotal(total);
  }, [newPurchase.items]);

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
    const supplier = suppliers.find(s => s.id === purchase.supplierId);
    return (supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
           purchase.poNumber.toLowerCase().includes(searchTerm.toLowerCase());
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
      productId: '',
      productName: '',
      quantity: 1,
      unitCost: 0,
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
      if (field === 'productId') {
        const product = products.find(p => p.id === value);
        if (product) {
          item.productName = product.name;
          item.unitCost = product.cost;
          item.total = item.quantity * product.cost;
        } else {
          item.productName = '';
          item.unitCost = 0;
          item.total = 0;
        }
      }
      
      // Recalculate total when quantity or unitCost changes
      if (field === 'quantity' || field === 'unitCost') {
        item.total = item.quantity * item.unitCost;
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
    try {
      console.log('🚀 Starting product creation...');
      
      if (!newProduct.name || newProduct.price <= 0) {
        Swal.fire({
          icon: 'error',
          title: 'Validation Error',
          text: 'Nama produk dan harga wajib diisi'
        });
        return;
      }
      
      // Show loading state
      Swal.fire({
        title: 'Menyimpan Produk...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });
      
      // Prepare product data
      const productData = {
        name: newProduct.name,
        category: newProduct.category,
        price: newProduct.price,
        cost: newProduct.cost || 0,
        stock: newProduct.stock || 0,
        min_stock: newProduct.minStock || 0,
        barcode: newProduct.barcode || null,
        description: newProduct.description || null,
        is_active: true
      };
      
      // Save to database
      const savedProduct = await db.products.create(productData);
      
      // Update local state
      setProducts(prev => [savedProduct, ...prev]);
      
      // Reset form and close modal
      setNewProduct({
        name: '',
        category: 'beverage',
        price: 0,
        cost: 0,
        stock: 0,
        minStock: 0,
        barcode: '',
        description: ''
      });
      setShowAddForm(false);
      
      // Show success message
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: `Produk "${savedProduct.name}" berhasil ditambahkan`
      });
      
    } catch (error: any) {
      console.error('💥 Product creation failed:', error);
      
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: error.message || 'Terjadi kesalahan saat menyimpan produk'
      });
    }
  };

  const handleCreatePurchase = async () => {
    try {
      if (!newPurchase.supplierId || newPurchase.items.length === 0) {
        Swal.fire({
          icon: 'error',
          title: 'Validation Error',
          text: 'Supplier dan item pembelian wajib diisi'
        });
        return;
      }
      
      const invalidItems = newPurchase.items.some(item => !item.productId || item.quantity <= 0);
      if (invalidItems) {
        Swal.fire({
          icon: 'error',
          title: 'Validation Error',
          text: 'Semua item harus memiliki produk dan quantity yang valid'
        });
        return;
      }
      
      // Show loading state
      Swal.fire({
        title: 'Membuat Purchase Order...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });
      
      // Generate PO number
      const { data: poNumber } = await supabase.rpc('generate_po_number');
      
      // Prepare purchase order data
      const poData = {
        po_number: poNumber,
        supplier_id: newPurchase.supplierId,
        expected_date: newPurchase.expectedDate,
        subtotal: purchaseSubtotal,
        tax: purchaseTax,
        total_amount: purchaseTotal,
        notes: newPurchase.notes || null,
        status: 'pending'
      };
      
      // Create purchase order
      const { data: po, error } = await supabase
        .from('purchase_orders')
        .insert(poData)
        .select()
        .single();
      
      if (error) throw error;
      
      // Create purchase order items
      const poItems = newPurchase.items.map(item => ({
        po_id: po.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        unit_cost: item.unitCost,
        total: item.total
      }));
      
      const { data: items, error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(poItems)
        .select();
      
      if (itemsError) throw itemsError;
      
      // Update local state
      setPurchaseOrders(prev => [{
        ...po,
        items,
        suppliers: suppliers.find(s => s.id === po.supplier_id)
      }, ...prev]);
      
      // Reset form and close modal
      setNewPurchase({
        supplierId: '',
        items: [],
        notes: '',
        expectedDate: new Date().toISOString().split('T')[0]
      });
      setShowPurchaseForm(false);
      
      // Show success message
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: `Purchase Order ${po.po_number} berhasil dibuat`
      });
      
    } catch (error: any) {
      console.error('Purchase order creation failed:', error);
      
      Swal.fire({
        icon: 'error',
        title: 'Gagal Membuat PO',
        text: error.message || 'Terjadi kesalahan saat membuat purchase order'
      });
    }
  };

  const handleAddSupplier = async () => {
    try {
      if (!newSupplier.name || !newSupplier.contact) {
        Swal.fire({
          icon: 'error',
          title: 'Validation Error',
          text: 'Nama supplier dan kontak wajib diisi'
        });
        return;
      }
      
      // Show loading state
      Swal.fire({
        title: 'Menyimpan Supplier...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });
      
      // Prepare supplier data
      const supplierData = {
        name: newSupplier.name,
        contact_person: newSupplier.contact,
        phone: newSupplier.phone,
        email: newSupplier.email || null,
        address: newSupplier.address || null,
        category: newSupplier.category,
        is_active: true
      };
      
      // Save to database
      const { data: savedSupplier, error } = await supabase
        .from('suppliers')
        .insert(supplierData)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update local state
      setSuppliers(prev => [savedSupplier, ...prev]);
      
      // Reset form and close modal
      setNewSupplier({
        name: '',
        contact: '',
        phone: '',
        email: '',
        address: '',
        category: 'beverage'
      });
      setShowSupplierForm(false);
      
      // Show success message
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: `Supplier "${savedSupplier.name}" berhasil ditambahkan`
      });
      
    } catch (error: any) {
      console.error('Supplier creation failed:', error);
      
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: error.message || 'Terjadi kesalahan saat menyimpan supplier'
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      // Confirm deletion
      const result = await Swal.fire({
        title: 'Hapus Produk?',
        text: 'Produk yang dihapus tidak dapat dikembalikan',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, Hapus!',
        cancelButtonText: 'Batal'
      });
      
      if (!result.isConfirmed) return;
      
      // Show loading state
      Swal.fire({
        title: 'Menghapus Produk...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });
      
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', productId);
      
      if (error) throw error;
      
      // Update local state
      setProducts(prev => prev.filter(p => p.id !== productId));
      
      // Show success message
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Produk berhasil dihapus'
      });
      
    } catch (error: any) {
      console.error('Product deletion failed:', error);
      
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menghapus',
        text: error.message || 'Terjadi kesalahan saat menghapus produk'
      });
    }
  };

  const handleEditProduct = async (productId: string) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) {
        throw new Error('Product not found');
      }
      
      // Show form with product data
      setShowEditForm(productId);
      
      // In a real implementation, you would populate a form with the product data
      // and then handle the update when the form is submitted
      
    } catch (error: any) {
      console.error('Edit product failed:', error);
      
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengedit',
        text: error.message || 'Terjadi kesalahan saat mengedit produk'
      });
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
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Tambah Produk
        </button>
      </div>

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
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        /* Products Grid */
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
                      onClick={() => handleEditProduct(product.id)}
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
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <ShoppingBag className="h-5 w-5" />
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

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : (
        /* Purchase Orders List */
        <div className="space-y-4">
          {filteredPurchases.map((purchase) => {
            const supplier = suppliers.find(s => s.id === purchase.supplier_id);
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
                      <p className="font-medium text-gray-900">{purchase.items?.length || 0} produk</p>
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
                      {purchase.items?.map((item: any, index: number) => (
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
                          <div><strong>Dibuat oleh:</strong> {purchase.created_by}</div>
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
      )}
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
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
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

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        /* Suppliers Grid */
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
                  <button 
                    onClick={() => {
                      setNewPurchase(prev => ({
                        ...prev,
                        supplierId: supplier.id
                      }));
                      setShowPurchaseForm(true);
                    }}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
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
      )}
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
              
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk *</label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Masukkan nama produk"
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
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min. Stok</label>
                    <input
                      type="number"
                      value={newProduct.minStock}
                      onChange={(e) => setNewProduct({...newProduct, minStock: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
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
                >
                  Batal
                </button>
                <button 
                  onClick={handleAddProduct}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
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
              
              <form className="space-y-6">
                {/* Supplier Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
                    <select
                      value={newPurchase.supplierId}
                      onChange={(e) => setNewPurchase({...newPurchase, supplierId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      value={newPurchase.expectedDate}
                      onChange={(e) => setNewPurchase({...newPurchase, expectedDate: e.target.value})}
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
                            value={item.productId}
                            onChange={(e) => updatePurchaseItem(index, 'productId', e.target.value)}
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
                            value={item.unitCost}
                            onChange={(e) => updatePurchaseItem(index, 'unitCost', Number(e.target.value))}
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
                >
                  Batal
                </button>
                <button 
                  onClick={handleCreatePurchase}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
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
              
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Supplier *</label>
                  <input
                    type="text"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nama perusahaan supplier"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kontak Person *</label>
                  <input
                    type="text"
                    value={newSupplier.contact}
                    onChange={(e) => setNewSupplier({...newSupplier, contact: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nama kontak person"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
                    <input
                      type="tel"
                      value={newSupplier.phone}
                      onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+62 8xx-xxxx-xxxx"
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
                >
                  Batal
                </button>
                <button 
                  onClick={handleAddSupplier}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
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
            {purchaseOrders?.length || 0}
          </h3>
          <p className="text-gray-600 text-sm">Purchase Order</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Truck className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {suppliers?.length || 0}
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