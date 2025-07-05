import React, { useState, useEffect } from 'react';
import { Plus, Search, Package, Edit, Trash2, AlertTriangle, ShoppingBag, TrendingUp, Calendar, FileText, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';
import { List as ListIcon, LayoutGrid } from 'lucide-react';
import { mockProducts, mockPurchaseOrders, mockSuppliers } from '../data/mockData';
import { db } from '../lib/supabase'; // Hanya import db
import Swal from 'sweetalert2';

const Products: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'purchases' | 'suppliers' | 'purchaseList'>('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState<string | null>(null);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<string | null>(null);

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
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    category: 'beverage' as 'beverage' | 'food' | 'snack' | 'other'
  });

  // State untuk produk dari database
  const [products, setProducts] = useState<any[]>([]);
  // State untuk supplier dari database
  const [suppliers, setSuppliers] = useState<any[]>([]);
  // const [supplierView, setSupplierView] = useState<'card' | 'list'>('card');
  const [showEditSupplierForm, setShowEditSupplierForm] = useState<string | null>(null);
  const [editSupplier, setEditSupplier] = useState<any | null>(null);

  // Tambah state untuk daftar PO, filter tanggal, dan status
  const [purchases, setPurchases] = useState<any[]>([]);
  const [purchaseDateRange, setPurchaseDateRange] = useState<{start: string, end: string}>({start: '', end: ''});
  const [purchaseStatus, setPurchaseStatus] = useState<string>('all');

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

  // Fetch products from Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await db.products.getAll();
        setProducts(data || []);
      } catch (error: any) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal memuat produk',
          text: error.message || 'Terjadi kesalahan saat mengambil data produk.'
        });
      }
    };
    fetchProducts();
    // expose for refresh
    (window as any).refreshProducts = fetchProducts;
  }, []);

  // Fetch suppliers from Supabase
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const data = await db.suppliers.getAll();
        setSuppliers(data || []);
      } catch (error: any) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal memuat supplier',
          text: error.message || 'Terjadi kesalahan saat mengambil data supplier.'
        });
      }
    };
    fetchSuppliers();
    (window as any).refreshSuppliers = fetchSuppliers;
  }, []);

  // Fetch purchase orders dari Supabase
  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const data = await db.purchases.getAll();
        setPurchases(data || []);
      } catch (error: any) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal memuat daftar pembelian',
          text: error.message || 'Terjadi kesalahan saat mengambil data pembelian.'
        });
      }
    };
    fetchPurchases();
    (window as any).refreshPurchases = fetchPurchases;
  }, []);

  // Helper: mapping DB fields to UI fields for purchases
  // function mapPurchaseFromDb(p: any) {
  //   return {
  //     id: p.id,
  //     poNumber: p.po_number || p.poNumber || '-',
  //     supplier_id: p.supplier_id,
  //     orderDate: p.order_date || p.orderDate,
  //     expectedDate: p.expected_date || p.expectedDate,
  //     status: p.status || 'pending',
  //     notes: p.notes,
  //     totalAmount: p.total_amount || p.totalAmount,
  //     createdBy: p.created_by || p.createdBy,
  //     // items: p.items || [] // items will be fetched separately if needed
  //   };
  // }

  // Fetch purchases from Supabase (replace mockPurchaseOrders)
  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        // const data = await db.purchases.getAll(); // purchases fetch not needed
        // Map DB fields to UI fields
        // const mapped = (data || []).map(mapPurchaseFromDb); // purchases mapping not needed
        // setPurchases(mapped); // commented out since purchases state is removed
      } catch (error: any) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal memuat daftar pembelian',
          text: error.message || 'Terjadi kesalahan saat mengambil data pembelian.'
        });
      }
    };
    fetchPurchases();
    (window as any).refreshPurchases = fetchPurchases;
  }, []);

  // Buka modal edit dan isi data produk
  useEffect(() => {
    if (showEditForm) {
      const prod = products.find(p => p.id === showEditForm);
      if (prod) setEditProduct({ ...prod });
    } else {
      setEditProduct(null);
    }
  }, [showEditForm, products]);

  // Buka modal edit supplier dan isi data
  useEffect(() => {
    if (showEditSupplierForm) {
      const sup = suppliers.find(s => s.id === showEditSupplierForm);
      if (sup) setEditSupplier({ ...sup });
    } else {
      setEditSupplier(null);
    }
  }, [showEditSupplierForm, suppliers]);

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

  // const filteredPurchases = mockPurchaseOrders.filter(purchase => {
  //   const supplier = mockSuppliers.find(s => s.id === purchase.supplierId);
  //   return supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     purchase.poNumber.toLowerCase().includes(searchTerm.toLowerCase());
  // });

  // Ganti filteredSuppliers agar pakai data dari database
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_person.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPurchaseOrders = purchases.filter(po => {
    // Filter status
    const statusMatch = purchaseStatus === 'all' || po.status === purchaseStatus;
    // Filter tanggal order
    let dateMatch = true;
    if (purchaseDateRange.start) {
      dateMatch = dateMatch && new Date(po.order_date) >= new Date(purchaseDateRange.start);
    }
    if (purchaseDateRange.end) {
      dateMatch = dateMatch && new Date(po.order_date) <= new Date(purchaseDateRange.end);
    }
    // Filter search
    const supplier = suppliers.find(s => s.id === po.supplier_id);
    const searchMatch =
      (po.po_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    return statusMatch && dateMatch && searchMatch;
  });

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

  const lowStockProducts = products.filter(p => p.stock <= p.minStock);

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
      // @ts-expect-error: dynamic assignment
      item[field as keyof typeof item] = value;
      
      // Handle product selection
      if (field === 'productId') {
        const product = mockProducts.find(p => p.id === value);
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

  const handleAddProduct = () => {
    if (!newProduct.name || newProduct.price <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Validasi Gagal',
        text: 'Nama produk dan harga wajib diisi'
      });
      return;
    }
    
    // Here we would normally save to database
    // For demo, just show success message
    Swal.fire({
      icon: 'success',
      title: 'Berhasil!',
      text: `Produk ${newProduct.name} berhasil ditambahkan!`
    });
    
    setShowAddForm(false);
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
  };

  // const handleCreatePurchase = () => {
  //   if (!newPurchase.supplierId || newPurchase.items.length === 0) {
  //     Swal.fire({
  //       icon: 'error',
  //       title: 'Validasi Gagal',
  //       text: 'Supplier dan item pembelian wajib diisi'
  //     });
  //     return;
  //   }
    
  //   const invalidItems = newPurchase.items.some(item => !item.productId || item.quantity <= 0);
  //   if (invalidItems) {
  //     Swal.fire({
  //       icon: 'error',
  //       title: 'Validasi Gagal',
  //       text: 'Semua item harus memiliki produk dan quantity yang valid'
  //     });
  //     return;
  //   }
    
  //   Swal.fire({
  //     icon: 'success',
  //     title: 'Berhasil!',
  //     text: `Purchase Order berhasil dibuat dengan total Rp ${purchaseTotal.toLocaleString('id-ID')}`
  //   });
    
  //   setShowPurchaseForm(false);
  //   setNewPurchase({
  //     supplierId: '',
  //     items: [],
  //     notes: '',
  //     expectedDate: new Date().toISOString().split('T')[0]
  //   });
  // };

  // Ubah handleAddSupplier agar simpan ke database dan refresh list
  const handleAddSupplier = async () => {
    if (!newSupplier.name?.trim() || !newSupplier.contact_person?.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Validasi Gagal',
        text: 'Nama supplier dan kontak person wajib diisi'
      });
      return;
    }
    try {
      await db.suppliers.create(newSupplier);
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: `Supplier ${newSupplier.name} berhasil ditambahkan!`
      });
      setShowSupplierForm(false);
      setNewSupplier({
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        category: 'beverage'
      });
      if ((window as any).refreshSuppliers) (window as any).refreshSuppliers();
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal tambah supplier',
        text: error.message || 'Terjadi kesalahan saat menambah supplier.'
      });
    }
  };

  const [editProduct, setEditProduct] = useState<any | null>(null); // State produk yang diedit

  const handleEditProduct = async () => {
    if (!editProduct.name || editProduct.price <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Validasi Gagal',
        text: 'Nama produk dan harga wajib diisi'
      });
      return;
    }
    try {
      await db.products.update(editProduct.id, {
        name: editProduct.name,
        category: editProduct.category,
        price: editProduct.price,
        cost: editProduct.cost,
        stock: editProduct.stock,
        minStock: editProduct.minStock,
        barcode: editProduct.barcode,
        description: editProduct.description
      });
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: `Produk ${editProduct.name} berhasil diupdate!`
      });
      setShowEditForm(null);
      // Refresh produk
      if ((window as any).refreshProducts) (window as any).refreshProducts();
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal update',
        text: error.message || 'Terjadi kesalahan saat update produk.'
      });
    }
  };

  // Edit supplier
  const handleEditSupplier = async () => {
    // Cek null/undefined dan string kosong
    if (!editSupplier || !editSupplier.name?.trim() || !editSupplier.contact_person?.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Validasi Gagal',
        text: 'Nama supplier dan kontak person wajib diisi'
      });
      return;
    }
    try {
      await db.suppliers.update(editSupplier.id, editSupplier);
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Supplier berhasil diupdate!'
      });
      setShowEditSupplierForm(null);
      if ((window as any).refreshSuppliers) (window as any).refreshSuppliers();
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal update supplier',
        text: error.message || 'Terjadi kesalahan saat update supplier.'
      });
    }
  };

  const handleDeleteProduct = async (product: any) => {
    const result = await Swal.fire({
      title: `Hapus produk?`,
      text: `Yakin ingin menghapus produk ${product.name}? Data tidak dapat dikembalikan!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal'
    });
    if (result.isConfirmed) {
      try {
        await db.delete('products', product.id);
        Swal.fire('Terhapus!', `Produk ${product.name} berhasil dihapus.`, 'success');
        if ((window as any).refreshProducts) (window as any).refreshProducts();
      } catch (error: any) {
        Swal.fire('Gagal', error.message || 'Gagal menghapus produk.', 'error');
      }
    }
  };

  // Delete supplier
  const handleDeleteSupplier = async (supplier: any) => {
    // Cek apakah ada produk yang masih terkait dengan supplier ini
    const relatedProducts = products.filter(p => p.supplier_id === supplier.id);
    if (relatedProducts.length > 0) {
      Swal.fire({
        icon: 'error',
        title: 'Tidak bisa hapus supplier',
        text: `Masih ada ${relatedProducts.length} produk yang terkait dengan supplier ini. Hapus atau pindahkan produk terlebih dahulu.`
      });
      return;
    }
    const result = await Swal.fire({
      title: `Hapus supplier?`,
      text: `Yakin ingin menghapus supplier ${supplier.name}? Data tidak dapat dikembalikan!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal'
    });
    if (result.isConfirmed) {
      try {
        await db.suppliers.delete(supplier.id);
        Swal.fire('Terhapus!', `Supplier ${supplier.name} berhasil dihapus.`, 'success');
        if ((window as any).refreshSuppliers) (window as any).refreshSuppliers();
      } catch (error: any) {
        Swal.fire('Gagal', error.message || 'Gagal menghapus supplier.', 'error');
      }
    }
  };

  const [productView, setProductView] = useState<'card' | 'list'>('card');
  const [supplierView, setSupplierView] = useState<'card' | 'list'>('card');

  const renderProductsTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manajemen Produk</h2>
          <p className="text-gray-600">Kelola inventory produk cafe</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setProductView('card')}
            className={`p-2 rounded-lg border ${productView === 'card' ? 'bg-blue-100 border-blue-400 text-blue-600' : 'border-gray-200 text-gray-400 hover:text-blue-600'}`}
            aria-label="Tampilan Card"
          >
            <LayoutGrid className="h-5 w-5" />
          </button>
          <button
            onClick={() => setProductView('list')}
            className={`p-2 rounded-lg border ${productView === 'list' ? 'bg-blue-100 border-blue-400 text-blue-600' : 'border-gray-200 text-gray-400 hover:text-blue-600'}`}
            aria-label="Tampilan List"
          >
            <ListIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ml-2"
          >
            <Plus className="h-5 w-5" />
            Tambah Produk
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 cursor-pointer" 
            onClick={() => setSearchTerm('')}
          />
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

      {/* Products Grid/List */}
      {productView === 'card' ? (
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
                      onClick={() => handleDeleteProduct(product)}
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
                        product.stock <= product.minStock ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        {product.stock} unit
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Min. Stok</p>
                      <p className="font-medium text-gray-700">{product.minStock} unit</p>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harga Jual</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stok</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min. Stok</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Barcode</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(product.category)}`}>{product.category}</span>
                  </td>
                  <td className="px-4 py-3 text-green-600 font-semibold">Rp {product.price.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3 text-gray-700">Rp {product.cost.toLocaleString('id-ID')}</td>
                  <td className={`px-4 py-3 font-semibold ${product.stock <= product.minStock ? 'text-red-600' : 'text-blue-600'}`}>{product.stock}</td>
                  <td className="px-4 py-3">{product.minStock}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{product.barcode || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setShowEditForm(product.id)} className="p-1 text-gray-400 hover:text-blue-600 transition-colors"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => handleDeleteProduct(product)} className="p-1 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // const paginatedPurchases = purchases.slice((purchasePage - 1) * purchasesPerPage, purchasePage * purchasesPerPage);
  // const totalPages = Math.ceil(totalPurchases / purchasesPerPage);

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

      {/* Purchase Orders List */}
      <div className="space-y-4">
        {filteredPurchaseOrders.map((purchase) => {
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
                    {purchase.status?.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <div>
                    <p className="text-xs">Tanggal Order</p>
                    <p className="font-medium text-gray-900">{purchase.order_date ? new Date(purchase.order_date).toLocaleDateString('id-ID') : '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Truck className="h-4 w-4" />
                  <div>
                    <p className="text-xs">Estimasi Tiba</p>
                    <p className="font-medium text-gray-900">{purchase.expected_date ? new Date(purchase.expected_date).toLocaleDateString('id-ID') : '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Package className="h-4 w-4" />
                  <div>
                    <p className="text-xs">Total Item</p>
                    <p className="font-medium text-gray-900">-</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <TrendingUp className="h-4 w-4" />
                  <div>
                    <p className="text-xs">Total Nilai</p>
                    <p className="font-medium text-gray-900">Rp {Number(purchase.total_amount).toLocaleString('id-ID')}</p>
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
              </div>

              {/* Extended Details */}
              {selectedPurchase === purchase.id && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Detail Purchase Order</h4>
                  {/* Items List - tampilkan jika sudah fetch item */}
                  <div className="space-y-2 mb-4 text-gray-500 text-sm">(Detail item PO belum diimplementasikan)</div>
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
                        <div><strong>Total:</strong> Rp {Number(purchase.total_amount).toLocaleString('id-ID')}</div>
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
        {filteredPurchaseOrders.length === 0 && (
          <div className="text-center text-gray-400 py-6">Tidak ada data purchase order ditemukan.</div>
        )}
      </div>
    </div>
  );

  // Form/Content untuk tab Daftar Pembelian
  const renderPurchaseListTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-700 mb-1">Cari PO / Supplier</label>
          <input
            type="text"
            placeholder="Cari PO number atau nama supplier..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
          <select
            value={purchaseStatus}
            onChange={e => setPurchaseStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Semua</option>
            <option value="pending">Pending</option>
            <option value="ordered">Ordered</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal Order</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={purchaseDateRange.start}
              onChange={e => setPurchaseDateRange(r => ({...r, start: e.target.value}))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="self-center">-</span>
            <input
              type="date"
              value={purchaseDateRange.end}
              onChange={e => setPurchaseDateRange(r => ({...r, end: e.target.value}))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO Number</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Order</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredPurchaseOrders.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-6">
                  Tidak ada data purchase order ditemukan.
                </td>
              </tr>
            )}
            {filteredPurchaseOrders.map(po => {
              const supplier = suppliers.find(s => s.id === po.supplier_id);
              return (
                <tr key={po.id}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-900">{po.po_number}</td>
                  <td className="px-4 py-3">{po.order_date ? new Date(po.order_date).toLocaleDateString('id-ID') : '-'}</td>
                  <td className="px-4 py-3">{supplier?.name || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(po.status)}`}>{po.status}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-blue-700">Rp {Number(po.total_amount).toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3">
                    {/* Aksi detail, dll */}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render tab for suppliers
  const renderSuppliersTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manajemen Supplier</h2>
          <p className="text-gray-600">Kelola data supplier produk</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSupplierView('card')}
            className={`p-2 rounded-lg border ${supplierView === 'card' ? 'bg-purple-100 border-purple-400 text-purple-600' : 'border-gray-200 text-gray-400 hover:text-purple-600'}`}
            aria-label="Tampilan Card"
          >
            <LayoutGrid className="h-5 w-5" />
          </button>
          <button
            onClick={() => setSupplierView('list')}
            className={`p-2 rounded-lg border ${supplierView === 'list' ? 'bg-purple-100 border-purple-400 text-purple-600' : 'border-gray-200 text-gray-400 hover:text-purple-600'}`}
            aria-label="Tampilan List"
          >
            <ListIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowSupplierForm(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Tambah Supplier
          </button>
        </div>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Cari supplier atau kontak person..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>
      {supplierView === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSuppliers.length === 0 && (
            <div className="col-span-full text-center text-gray-400 py-6">Tidak ada data supplier ditemukan.</div>
          )}
          {filteredSuppliers.map((supplier) => (
            <div key={supplier.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">{supplier.category}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setShowEditSupplierForm(supplier.id)} className="p-1 text-gray-400 hover:text-purple-600 transition-colors"><Edit className="h-4 w-4" /></button>
                    <button onClick={() => handleDeleteSupplier(supplier)} className="p-1 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{supplier.name}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{supplier.address}</p>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="font-medium">Kontak:</span> {supplier.contact_person}
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="font-medium">Telepon:</span> {supplier.phone || '-'}
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="font-medium">Email:</span> {supplier.email || '-'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kontak Person</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telepon</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredSuppliers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-6">
                    Tidak ada data supplier ditemukan.
                  </td>
                </tr>
              )}
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{supplier.name}</td>
                  <td className="px-4 py-3">{supplier.contact_person}</td>
                  <td className="px-4 py-3">{supplier.phone || '-'}</td>
                  <td className="px-4 py-3">{supplier.email || '-'}</td>
                  <td className="px-4 py-3">{supplier.category}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setShowEditSupplierForm(supplier.id)} className="p-1 text-gray-400 hover:text-purple-600 transition-colors"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => handleDeleteSupplier(supplier)} className="p-1 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manajemen Produk & Pembelian</h1>
          <p className="text-gray-600">Kelola produk, pembelian stok, dan supplier</p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              { [
                { id: 'products', label: 'Produk', icon: Package },
                { id: 'purchases', label: 'Pembelian', icon: ShoppingBag },
                { id: 'purchaseList', label: 'Daftar Pembelian', icon: FileText },
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
        {activeTab === 'purchaseList' && renderPurchaseListTab()}
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
                          {(() => {
                            const subtotal = newPurchase.items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
                            const tax = Math.round(subtotal * 0.1);
                            const total = subtotal + tax;
                            return (
                              <>
                                <div className="flex justify-between items-center">
                                  <span className="text-blue-800">Subtotal:</span>
                                  <span className="font-medium text-blue-900">
                                    Rp {subtotal.toLocaleString('id-ID')}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-blue-800">Pajak (10%):</span>
                                  <span className="font-medium text-blue-900">
                                    Rp {tax.toLocaleString('id-ID')}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center border-t border-blue-300 pt-2">
                                  <span className="font-bold text-blue-900">Total:</span>
                                  <span className="text-xl font-bold text-blue-900">
                                    Rp {total.toLocaleString('id-ID')}
                                  </span>
                                </div>
                              </>
                            );
                          })()}
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
                    onClick={async () => {
                      // Simpan ke database
                      try {
                        await db.purchases.create({
                          supplier_id: newPurchase.supplierId, // field DB
                          items: newPurchase.items,
                          notes: newPurchase.notes,
                          expected_date: newPurchase.expectedDate,
                          subtotal: purchaseSubtotal,
                          tax: purchaseTax,
                          total_amount: purchaseTotal // field DB
                        });
                        Swal.fire({
                          icon: 'success',
                          title: 'Berhasil!',
                          text: `Purchase Order berhasil dibuat dengan total Rp ${purchaseTotal.toLocaleString('id-ID')}`
                        });
                        setShowPurchaseForm(false);
                        setNewPurchase({
                          supplierId: '',
                          items: [],
                          notes: '',
                          expectedDate: new Date().toISOString().split('T')[0]
                        });
                        if ((window as any).refreshPurchases) (window as any).refreshPurchases();
                      } catch (error: any) {
                        Swal.fire({
                          icon: 'error',
                          title: 'Gagal tambah PO',
                          text: (error?.message || '') + (error?.details ? '\n' + error.details : '')
                        });
                        // Optional: log error detail ke console
                        // eslint-disable-next-line no-console
                        console.error('PO Error:', error);
                      }
                    }}
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Nama perusahaan supplier"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kontak Person *</label>
                    <input
                      type="text"
                      value={newSupplier.contact_person}
                      onChange={(e) => setNewSupplier({...newSupplier, contact_person: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Nama kontak person"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
                      <input
                        type="text"
                        value={newSupplier.phone}
                        onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="+62 8xx-xxxx-xxxx"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                      <select
                        value={newSupplier.category}
                        onChange={(e) => setNewSupplier({...newSupplier, category: e.target.value as any})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="email@supplier.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                    <textarea
                      value={newSupplier.address}
                      onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Alamat lengkap supplier"
                      rows={2}
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

        {/* Edit Product Modal */}
        {showEditForm && editProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Produk</h2>
                <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleEditProduct(); }}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk *</label>
                    <input
                      type="text"
                      value={editProduct.name}
                      onChange={e => setEditProduct({ ...editProduct, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Masukkan nama produk"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                    <select
                      value={editProduct.category}
                      onChange={e => setEditProduct({ ...editProduct, category: e.target.value })}
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
                        onChange={e => setEditProduct({ ...editProduct, cost: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Harga Jual *</label>
                      <input
                        type="number"
                        value={editProduct.price}
                        onChange={e => setEditProduct({ ...editProduct, price: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stok</label>
                      <input
                        type="number"
                        value={editProduct.stock}
                        onChange={e => setEditProduct({ ...editProduct, stock: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Min. Stok</label>
                      <input
                        type="number"
                        value={editProduct.minStock}
                        onChange={e => setEditProduct({ ...editProduct, minStock: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Barcode (Opsional)</label>
                    <input
                      type="text"
                      value={editProduct.barcode || ''}
                      onChange={e => setEditProduct({ ...editProduct, barcode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Scan atau masukkan barcode"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                    <textarea
                      value={editProduct.description || ''}
                      onChange={e => setEditProduct({ ...editProduct, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Deskripsi produk"
                    />
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowEditForm(null)}
                      className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </form>
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
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{mockProducts.length}</h3>
            <p className="text-gray-600 text-sm">Total Produk</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {mockPurchaseOrders?.length || 0}
            </h3>
            <p className="text-gray-600 text-sm">Purchase Order</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Truck className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {mockSuppliers?.length || 0}
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
      {/* Modal Edit Supplier */}
      {showEditSupplierForm && editSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Supplier</h2>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Supplier *</label>
                  <input
                    type="text"
                    value={editSupplier.name}
                    onChange={(e) => setEditSupplier({ ...editSupplier, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Nama perusahaan supplier"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kontak Person *</label>
                  <input
                    type="text"
                    value={editSupplier.contact_person}
                    onChange={(e) => setEditSupplier({ ...editSupplier, contact_person: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Nama kontak person"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
                    <input
                      type="text"
                      value={editSupplier.phone}
                      onChange={(e) => setEditSupplier({ ...editSupplier, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="+62 8xx-xxxx-xxxx"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                    <select
                      value={editSupplier.category}
                      onChange={(e) => setEditSupplier({ ...editSupplier, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                    value={editSupplier.email}
                    onChange={(e) => setEditSupplier({ ...editSupplier, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="email@supplier.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                  <textarea
                    value={editSupplier.address}
                    onChange={(e) => setEditSupplier({ ...editSupplier, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Alamat lengkap supplier"
                    rows={2}
                  />
                </div>
              </form>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEditSupplierForm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={handleEditSupplier}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Products;