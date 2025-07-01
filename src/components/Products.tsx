import React, { useState, useEffect } from 'react';
import { Plus, Search, Package, Edit, Trash2, AlertTriangle, ShoppingBag, TrendingUp, Calendar, FileText, Truck, CheckCircle, Clock, XCircle, Grid, List, Eye } from 'lucide-react';
import { supabase, db } from '../lib/supabase';
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
  
  // View mode states
  const [productViewMode, setProductViewMode] = useState<'grid' | 'list'>('grid');
  const [supplierViewMode, setSupplierViewMode] = useState<'grid' | 'list'>('grid');
  
  // Data states
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'beverage' as 'beverage' | 'food' | 'snack' | 'other',
    price: 0,
    cost: 0,
    stock: 0,
    minStock: 0,
    barcode: '',
    description: '',
    supplier_id: ''
  });

  const [editProduct, setEditProduct] = useState({
    id: '',
    name: '',
    category: 'beverage' as 'beverage' | 'food' | 'snack' | 'other',
    price: 0,
    cost: 0,
    stock: 0,
    minStock: 0,
    barcode: '',
    description: '',
    supplier_id: ''
  });

  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    category: 'beverage' as 'beverage' | 'food' | 'snack' | 'other'
  });

  const categories = [
    { value: 'all', label: 'Semua Kategori' },
    { value: 'beverage', label: 'Minuman' },
    { value: 'food', label: 'Makanan' },
    { value: 'snack', label: 'Snack' },
    { value: 'other', label: 'Lainnya' }
  ];

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading data...');
      
      // Load products with suppliers
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          suppliers(name)
        `)
        .eq('is_active', true);
      
      if (productsError) {
        console.error('❌ Products error:', productsError);
        throw productsError;
      }
      
      console.log('✅ Products loaded:', productsData?.length || 0);
      setProducts(productsData || []);

      // Load suppliers
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true);
      
      if (suppliersError) {
        console.error('❌ Suppliers error:', suppliersError);
        throw suppliersError;
      }
      
      console.log('✅ Suppliers loaded:', suppliersData?.length || 0);
      setSuppliers(suppliersData || []);

      // Load purchase orders
      const { data: purchaseOrdersData, error: purchaseOrdersError } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          suppliers(name),
          purchase_order_items(*)
        `)
        .order('created_at', { ascending: false });
      
      if (purchaseOrdersError) {
        console.error('❌ Purchase orders error:', purchaseOrdersError);
        throw purchaseOrdersError;
      }
      
      console.log('✅ Purchase orders loaded:', purchaseOrdersData?.length || 0);
      setPurchaseOrders(purchaseOrdersData || []);
      
    } catch (err: any) {
      console.error('❌ Load data error:', err);
      setError(err.message || 'Failed to load data');
      
      Swal.fire({
        icon: 'error',
        title: 'Error Loading Data',
        text: err.message || 'Failed to load data from database',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode?.includes(searchTerm);
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
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

  const lowStockProducts = products.filter(p => p.stock <= p.min_stock);

  // CRUD Operations with detailed logging
  const handleAddProduct = async () => {
    try {
      console.log('🚀 Starting product creation...');
      console.log('📝 Form data:', newProduct);
      
      // Validation
      if (!newProduct.name || newProduct.price <= 0) {
        console.log('❌ Validation failed');
        Swal.fire({
          icon: 'error',
          title: 'Validation Error',
          text: 'Nama produk dan harga wajib diisi dengan benar',
          confirmButtonColor: '#dc2626'
        });
        return;
      }
      
      console.log('✅ Validation passed');
      
      // Show loading
      Swal.fire({
        title: 'Menyimpan Produk...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('👤 Current user:', user?.id);
      
      if (userError) {
        console.error('❌ User error:', userError);
        throw new Error('Authentication error');
      }
      
      // Prepare data for insertion
      const productData = {
        ...newProduct,
        created_by: user?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
      };
      
      console.log('📦 Product data to insert:', productData);
      
      // Insert into database
      const { data: insertedProduct, error: insertError } = await supabase
        .from('products')
        .insert(productData)
        .select(`
          *,
          suppliers(name)
        `)
        .single();
      
      if (insertError) {
        console.error('❌ Database insert error:', insertError);
        console.error('Error details:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });
        throw insertError;
      }
      
      console.log('✅ Product inserted successfully:', insertedProduct);
      
      // Update local state
      setProducts(prev => [...prev, insertedProduct]);
      
      // Reset form
      setNewProduct({
        name: '',
        category: 'beverage',
        price: 0,
        cost: 0,
        stock: 0,
        minStock: 0,
        barcode: '',
        description: '',
        supplier_id: ''
      });
      
      setShowAddForm(false);
      
      // Show success message
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: `Produk "${insertedProduct.name}" berhasil ditambahkan`,
        confirmButtonColor: '#059669',
        timer: 3000,
        timerProgressBar: true
      });
      
      console.log('🎉 Product creation completed successfully');
      
    } catch (err: any) {
      console.error('💥 Product creation failed:', err);
      console.error('Error stack:', err.stack);
      
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: err.message || 'Terjadi kesalahan saat menyimpan produk',
        confirmButtonColor: '#dc2626',
        footer: `<small>Error: ${err.code || 'UNKNOWN'}</small>`
      });
    }
  };

  const handleEditProduct = async () => {
    try {
      console.log('🔄 Starting product update...');
      console.log('📝 Edit data:', editProduct);
      
      if (!editProduct.name || editProduct.price <= 0) {
        Swal.fire({
          icon: 'error',
          title: 'Validation Error',
          text: 'Nama produk dan harga wajib diisi dengan benar',
          confirmButtonColor: '#dc2626'
        });
        return;
      }
      
      Swal.fire({
        title: 'Memperbarui Produk...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      
      const updateData = {
        name: editProduct.name,
        category: editProduct.category,
        price: editProduct.price,
        cost: editProduct.cost,
        stock: editProduct.stock,
        min_stock: editProduct.minStock,
        barcode: editProduct.barcode,
        description: editProduct.description,
        supplier_id: editProduct.supplier_id || null,
        updated_at: new Date().toISOString()
      };
      
      console.log('📦 Update data:', updateData);
      
      const { data: updatedProduct, error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', editProduct.id)
        .select(`
          *,
          suppliers(name)
        `)
        .single();
      
      if (updateError) {
        console.error('❌ Update error:', updateError);
        throw updateError;
      }
      
      console.log('✅ Product updated:', updatedProduct);
      
      // Update local state
      setProducts(prev => prev.map(p => p.id === editProduct.id ? updatedProduct : p));
      
      setShowEditForm(null);
      setEditProduct({
        id: '',
        name: '',
        category: 'beverage',
        price: 0,
        cost: 0,
        stock: 0,
        minStock: 0,
        barcode: '',
        description: '',
        supplier_id: ''
      });
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: `Produk "${updatedProduct.name}" berhasil diperbarui`,
        confirmButtonColor: '#059669',
        timer: 3000,
        timerProgressBar: true
      });
      
    } catch (err: any) {
      console.error('💥 Product update failed:', err);
      
      Swal.fire({
        icon: 'error',
        title: 'Gagal Memperbarui',
        text: err.message || 'Terjadi kesalahan saat memperbarui produk',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    try {
      const result = await Swal.fire({
        title: 'Konfirmasi Hapus',
        text: `Apakah Anda yakin ingin menghapus produk "${productName}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal'
      });

      if (!result.isConfirmed) return;

      console.log('🗑️ Deleting product:', productId);

      Swal.fire({
        title: 'Menghapus Produk...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Soft delete - set is_active to false
      const { error: deleteError } = await supabase
        .from('products')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (deleteError) {
        console.error('❌ Delete error:', deleteError);
        throw deleteError;
      }

      console.log('✅ Product deleted successfully');

      // Update local state
      setProducts(prev => prev.filter(p => p.id !== productId));

      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: `Produk "${productName}" berhasil dihapus`,
        confirmButtonColor: '#059669',
        timer: 3000,
        timerProgressBar: true
      });

    } catch (err: any) {
      console.error('💥 Product deletion failed:', err);
      
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menghapus',
        text: err.message || 'Terjadi kesalahan saat menghapus produk',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  const handleAddSupplier = async () => {
    try {
      console.log('🚀 Starting supplier creation...');
      
      if (!newSupplier.name || !newSupplier.contact_person) {
        Swal.fire({
          icon: 'error',
          title: 'Validation Error',
          text: 'Nama supplier dan kontak person wajib diisi',
          confirmButtonColor: '#dc2626'
        });
        return;
      }
      
      Swal.fire({
        title: 'Menyimpan Supplier...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      
      const supplierData = {
        ...newSupplier,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: insertedSupplier, error: insertError } = await supabase
        .from('suppliers')
        .insert(supplierData)
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Supplier insert error:', insertError);
        throw insertError;
      }
      
      console.log('✅ Supplier inserted:', insertedSupplier);
      
      setSuppliers(prev => [...prev, insertedSupplier]);
      
      setNewSupplier({
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        category: 'beverage'
      });
      
      setShowSupplierForm(false);
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: `Supplier "${insertedSupplier.name}" berhasil ditambahkan`,
        confirmButtonColor: '#059669',
        timer: 3000,
        timerProgressBar: true
      });
      
    } catch (err: any) {
      console.error('💥 Supplier creation failed:', err);
      
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: err.message || 'Terjadi kesalahan saat menyimpan supplier',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  const openEditForm = (product: any) => {
    setEditProduct({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      cost: product.cost,
      stock: product.stock,
      minStock: product.min_stock,
      barcode: product.barcode || '',
      description: product.description || '',
      supplier_id: product.supplier_id || ''
    });
    setShowEditForm(product.id);
  };

  const renderProductsTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manajemen Produk</h2>
          <p className="text-gray-600">Kelola inventory produk cafe</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-200 p-1 rounded-lg">
            <button
              onClick={() => setProductViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                productViewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setProductViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                productViewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Tambah Produk
          </button>
        </div>
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
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="font-medium text-red-800">Error: {error}</span>
          </div>
          <button
            onClick={loadData}
            className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Products Display */}
      {!loading && !error && (
        <>
          {productViewMode === 'grid' ? (
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
                          onClick={() => openEditForm(product)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id, product.name)}
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
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produk</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stok</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">{product.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(product.category)}`}>
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">Rp {product.price.toLocaleString('id-ID')}</div>
                          <div className="text-sm text-gray-500">Modal: Rp {product.cost.toLocaleString('id-ID')}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${
                            product.stock <= product.min_stock ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            {product.stock} unit
                          </div>
                          <div className="text-sm text-gray-500">Min: {product.min_stock}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{product.suppliers?.name || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditForm(product)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id, product.name)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
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
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-200 p-1 rounded-lg">
            <button
              onClick={() => setSupplierViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                supplierViewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setSupplierViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                supplierViewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          
          <button
            onClick={() => setShowSupplierForm(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Tambah Supplier
          </button>
        </div>
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

      {/* Suppliers Display */}
      {supplierViewMode === 'grid' ? (
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
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kontak</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total PO</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                        <div className="text-sm text-gray-500">{supplier.contact_person}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{supplier.phone}</div>
                      <div className="text-sm text-gray-500">{supplier.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(supplier.category)}`}>
                        {supplier.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {purchaseOrders.filter(po => po.supplier_id === supplier.id).length}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button className="text-purple-600 hover:text-purple-900">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                      value={newProduct.minStock}
                      onChange={(e) => setNewProduct({...newProduct, minStock: Number(e.target.value)})}
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

      {/* Edit Product Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Produk</h2>
              
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleEditProduct(); }}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk *</label>
                  <input
                    type="text"
                    value={editProduct.name}
                    onChange={(e) => setEditProduct({...editProduct, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Masukkan nama produk"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <select 
                    value={editProduct.category}
                    onChange={(e) => setEditProduct({...editProduct, category: e.target.value as any})}
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
                      value={editProduct.cost}
                      onChange={(e) => setEditProduct({...editProduct, cost: Number(e.target.value)})}
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
                      value={editProduct.price}
                      onChange={(e) => setEditProduct({...editProduct, price: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stok</label>
                    <input
                      type="number"
                      value={editProduct.stock}
                      onChange={(e) => setEditProduct({...editProduct, stock: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min. Stok</label>
                    <input
                      type="number"
                      value={editProduct.minStock}
                      onChange={(e) => setEditProduct({...editProduct, minStock: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier (Opsional)</label>
                  <select
                    value={editProduct.supplier_id}
                    onChange={(e) => setEditProduct({...editProduct, supplier_id: e.target.value})}
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
                    value={editProduct.barcode}
                    onChange={(e) => setEditProduct({...editProduct, barcode: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Scan atau masukkan barcode"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                  <textarea
                    value={editProduct.description}
                    onChange={(e) => setEditProduct({...editProduct, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Deskripsi produk"
                  />
                </div>
              </form>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEditForm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={handleEditProduct}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Perbarui Produk
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
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Truck className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{suppliers.length}</h3>
          <p className="text-gray-600 text-sm">Supplier</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{lowStockProducts.length}</h3>
          <p className="text-gray-600 text-sm">Stok Menipis</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            Rp {products.reduce((sum, p) => sum + (p.price * p.stock), 0).toLocaleString('id-ID')}
          </h3>
          <p className="text-gray-600 text-sm">Nilai Inventory</p>
        </div>
      </div>
    </div>
  );
};

export default Products;