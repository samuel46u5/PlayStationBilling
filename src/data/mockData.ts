import { Customer, Console, RentalSession, Invoice, Product, Sale, CashierSession, BookkeepingEntry, User, Role, Permission, UserSession, ActivityLog, ScheduledBooking, EquipmentType, RateProfile, Voucher, VoucherUsage, PurchaseOrder, Supplier, CashierTransaction, CashFlow, Sparepart, SparepartUsage, MaintenanceTransaction, MaintenancePartUsage, MaintenanceHistory, Technician } from '../types';

export const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Ahmad Pratama',
    phone: '+62 812-3456-7890',
    email: 'ahmad.pratama@email.com',
    address: 'Jl. Merdeka No. 123, Jakarta',
    totalSpent: 450000,
    joinDate: '2024-01-15',
    status: 'active'
  },
  {
    id: '2',
    name: 'Siti Nurhaliza',
    phone: '+62 856-7890-1234',
    email: 'siti.nur@email.com',
    address: 'Jl. Sudirman No. 456, Bandung',
    totalSpent: 320000,
    joinDate: '2024-02-03',
    status: 'active'
  },
  {
    id: '3',
    name: 'Budi Santoso',
    phone: '+62 878-9012-3456',
    totalSpent: 680000,
    joinDate: '2023-12-10',
    status: 'active'
  },
  {
    id: '4',
    name: 'Rina Sari',
    phone: '+62 821-1111-2222',
    email: 'rina.sari@email.com',
    address: 'Jl. Gatot Subroto No. 789, Surabaya',
    totalSpent: 150000,
    joinDate: '2024-03-20',
    status: 'active'
  }
];

// Suppliers Mock Data
export const mockSuppliers: Supplier[] = [
  {
    id: 'SUP001',
    name: 'PT Sumber Rejeki',
    contact: 'Budi Hartono',
    phone: '+62 21-1234-5678',
    email: 'budi@sumberrejeki.com',
    address: 'Jl. Industri No. 45, Jakarta Timur',
    category: 'beverage',
    isActive: true,
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00'
  },
  {
    id: 'SUP002',
    name: 'CV Maju Bersama',
    contact: 'Sari Dewi',
    phone: '+62 22-9876-5432',
    email: 'sari@majubersama.co.id',
    address: 'Jl. Raya Bandung No. 123, Bandung',
    category: 'food',
    isActive: true,
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00'
  },
  {
    id: 'SUP003',
    name: 'Toko Snack Jaya',
    contact: 'Andi Wijaya',
    phone: '+62 31-5555-6666',
    email: 'andi@snackjaya.com',
    address: 'Jl. Pahlawan No. 67, Surabaya',
    category: 'snack',
    isActive: true,
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00'
  },
  {
    id: 'SUP004',
    name: 'Distributor Kopi Nusantara',
    contact: 'Rini Susanti',
    phone: '+62 274-7777-8888',
    email: 'rini@kopinusantara.id',
    address: 'Jl. Malioboro No. 89, Yogyakarta',
    category: 'beverage',
    isActive: true,
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00'
  }
];

// Purchase Orders Mock Data
export const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'PO001',
    poNumber: 'PO-2024-001',
    supplierId: 'SUP001',
    orderDate: '2024-12-25',
    expectedDate: '2024-12-30',
    status: 'ordered',
    items: [
      {
        productId: 'P001',
        productName: 'Kopi Americano',
        quantity: 50,
        unitCost: 8000,
        total: 400000
      },
      {
        productId: 'P002',
        productName: 'Kopi Latte',
        quantity: 30,
        unitCost: 10000,
        total: 300000
      }
    ],
    subtotal: 700000,
    tax: 70000,
    totalAmount: 770000,
    notes: 'Pengiriman pagi hari, pastikan kemasan aman',
    createdBy: 'mgr001',
    createdAt: '2024-12-25T10:00:00',
    updatedAt: '2024-12-25T10:00:00'
  },
  {
    id: 'PO002',
    poNumber: 'PO-2024-002',
    supplierId: 'SUP002',
    orderDate: '2024-12-26',
    expectedDate: '2024-12-31',
    status: 'pending',
    items: [
      {
        productId: 'P004',
        productName: 'Indomie Goreng',
        quantity: 100,
        unitCost: 3500,
        total: 350000
      },
      {
        productId: 'P005',
        productName: 'Indomie Kuah',
        quantity: 80,
        unitCost: 3500,
        total: 280000
      }
    ],
    subtotal: 630000,
    tax: 63000,
    totalAmount: 693000,
    notes: 'Pesan untuk tahun baru, stok harus cukup',
    createdBy: 'cash001',
    createdAt: '2024-12-26T14:00:00',
    updatedAt: '2024-12-26T14:00:00'
  },
  {
    id: 'PO003',
    poNumber: 'PO-2024-003',
    supplierId: 'SUP003',
    orderDate: '2024-12-20',
    expectedDate: '2024-12-25',
    status: 'received',
    items: [
      {
        productId: 'P006',
        productName: 'Chitato',
        quantity: 60,
        unitCost: 3000,
        total: 180000
      },
      {
        productId: 'P007',
        productName: 'Oreo',
        quantity: 40,
        unitCost: 4500,
        total: 180000
      }
    ],
    subtotal: 360000,
    tax: 36000,
    totalAmount: 396000,
    notes: 'Sudah diterima dengan baik, kualitas sesuai',
    receivedDate: '2024-12-24',
    receivedBy: 'staff001',
    createdBy: 'mgr001',
    createdAt: '2024-12-20T09:00:00',
    updatedAt: '2024-12-24T16:00:00'
  }
];

// Equipment Types - Jenis Alat
export const mockEquipmentTypes: EquipmentType[] = [
  {
    id: 'ET001',
    name: 'PlayStation 4',
    description: 'Gaming console PlayStation 4 dengan berbagai game populer',
    icon: 'Gamepad2',
    category: 'gaming',
    isActive: true,
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00'
  },
  {
    id: 'ET002',
    name: 'PlayStation 5',
    description: 'Gaming console PlayStation 5 generasi terbaru dengan grafis 4K',
    icon: 'Gamepad2',
    category: 'gaming',
    isActive: true,
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00'
  },
  {
    id: 'ET003',
    name: 'Meja Billiard 8-Ball',
    description: 'Meja billiard standar untuk permainan 8-ball pool',
    icon: 'Circle',
    category: 'billiard',
    isActive: true,
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00'
  },
  {
    id: 'ET004',
    name: 'Meja Billiard 9-Ball',
    description: 'Meja billiard premium untuk permainan 9-ball',
    icon: 'Circle',
    category: 'billiard',
    isActive: true,
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00'
  },
  {
    id: 'ET005',
    name: 'Meja Snooker',
    description: 'Meja snooker ukuran standar internasional',
    icon: 'Circle',
    category: 'billiard',
    isActive: true,
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00'
  }
];

// Rate Profiles - Master Tarif
export const mockRateProfiles: RateProfile[] = [
  {
    id: 'RP001',
    name: 'PlayStation Standard',
    description: 'Tarif standar untuk PlayStation 4',
    hourlyRate: 10000,
    dailyRate: 80000,
    weeklyRate: 500000,
    monthlyRate: 1800000,
    peakHourRate: 12000,
    peakHourStart: '18:00',
    peakHourEnd: '22:00',
    weekendMultiplier: 1.2,
    isActive: true,
    applicableEquipmentTypes: ['ET001'],
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00',
    createdBy: 'admin001'
  },
  {
    id: 'RP002',
    name: 'PlayStation Premium',
    description: 'Tarif premium untuk PlayStation 5',
    hourlyRate: 15000,
    dailyRate: 120000,
    weeklyRate: 700000,
    monthlyRate: 2500000,
    peakHourRate: 18000,
    peakHourStart: '18:00',
    peakHourEnd: '22:00',
    weekendMultiplier: 1.3,
    isActive: true,
    applicableEquipmentTypes: ['ET002'],
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00',
    createdBy: 'admin001'
  },
  {
    id: 'RP003',
    name: 'Billiard Standard',
    description: 'Tarif standar untuk meja billiard 8-ball',
    hourlyRate: 25000,
    dailyRate: 200000,
    weeklyRate: 1200000,
    monthlyRate: 4000000,
    peakHourRate: 30000,
    peakHourStart: '19:00',
    peakHourEnd: '23:00',
    weekendMultiplier: 1.5,
    isActive: true,
    applicableEquipmentTypes: ['ET003'],
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00',
    createdBy: 'admin001'
  },
  {
    id: 'RP004',
    name: 'Billiard Premium',
    description: 'Tarif premium untuk meja billiard 9-ball dan snooker',
    hourlyRate: 35000,
    dailyRate: 280000,
    weeklyRate: 1800000,
    monthlyRate: 6000000,
    peakHourRate: 42000,
    peakHourStart: '19:00',
    peakHourEnd: '23:00',
    weekendMultiplier: 1.5,
    isActive: true,
    applicableEquipmentTypes: ['ET004', 'ET005'],
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00',
    createdBy: 'admin001'
  },
  {
    id: 'RP005',
    name: 'Student Discount',
    description: 'Tarif khusus untuk pelajar/mahasiswa (berlaku untuk semua equipment)',
    hourlyRate: 8000,
    dailyRate: 60000,
    weeklyRate: 350000,
    monthlyRate: 1200000,
    peakHourRate: 10000,
    peakHourStart: '18:00',
    peakHourEnd: '22:00',
    weekendMultiplier: 1.1,
    isActive: true,
    applicableEquipmentTypes: ['ET001', 'ET002', 'ET003', 'ET004', 'ET005'],
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00',
    createdBy: 'admin001'
  }
];

// Spareparts Mock Data
export const mockSpareparts: Sparepart[] = [
  {
    id: 'SP001',
    name: 'DualSense Controller PS5',
    partNumber: 'CFI-ZCT1W',
    category: 'controller',
    compatibleConsoles: ['1', '2'], // PS5 consoles
    description: 'Controller wireless untuk PlayStation 5 dengan haptic feedback',
    specifications: 'Wireless, USB-C charging, built-in microphone, haptic feedback',
    brand: 'Sony',
    model: 'DualSense',
    condition: 'new',
    price: 850000,
    stock: 5,
    minStock: 2,
    location: 'Rak A-1',
    supplier: 'Sony Official Store',
    purchaseLink: 'https://www.sony.co.id/electronics/game-controllers/dualsense-wireless-controller',
    alternativeLinks: [
      'https://tokopedia.com/search?st=product&q=dualsense%20controller',
      'https://shopee.co.id/search?keyword=dualsense%20controller'
    ],
    photos: [
      'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400',
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400'
    ],
    installationNotes: 'Pair dengan console menggunakan USB cable, kemudian test semua fungsi button',
    warrantyPeriod: 12,
    lastUsed: '2024-12-20',
    usageHistory: [
      {
        id: 'SU001',
        sparepartId: 'SP001',
        consoleId: '1',
        usageDate: '2024-12-20',
        reason: 'replacement',
        description: 'Controller lama mengalami stick drift',
        quantity: 1,
        technician: 'Andi Wijaya',
        cost: 50000,
        notes: 'Controller lama disimpan untuk spare parts',
        createdAt: '2024-12-20T14:00:00'
      }
    ],
    isActive: true,
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-12-20T14:00:00',
    createdBy: 'admin001'
  },
  {
    id: 'SP002',
    name: 'DualShock 4 Controller PS4',
    partNumber: 'CUH-ZCT2U',
    category: 'controller',
    compatibleConsoles: ['3', '4', '5'], // PS4 consoles
    description: 'Controller wireless untuk PlayStation 4',
    specifications: 'Wireless, micro-USB charging, built-in speaker, touchpad',
    brand: 'Sony',
    model: 'DualShock 4',
    condition: 'new',
    price: 650000,
    stock: 8,
    minStock: 3,
    location: 'Rak A-2',
    supplier: 'Sony Official Store',
    purchaseLink: 'https://www.sony.co.id/electronics/game-controllers/dualshock-4',
    photos: [
      'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400'
    ],
    installationNotes: 'Pair dengan console, test semua fungsi termasuk touchpad dan speaker',
    warrantyPeriod: 12,
    usageHistory: [],
    isActive: true,
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00',
    createdBy: 'admin001'
  },
  {
    id: 'SP003',
    name: 'USB-C Charging Cable',
    partNumber: 'USB-C-3M',
    category: 'cable',
    compatibleConsoles: ['1', '2'], // PS5 consoles
    description: 'Kabel charging USB-C untuk controller PS5',
    specifications: '3 meter length, USB-A to USB-C, fast charging support',
    brand: 'Generic',
    condition: 'new',
    price: 75000,
    stock: 15,
    minStock: 5,
    location: 'Rak B-1',
    supplier: 'Toko Elektronik Jaya',
    purchaseLink: 'https://tokopedia.com/search?st=product&q=usb%20c%20cable%203m',
    photos: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'
    ],
    installationNotes: 'Test charging speed dan koneksi data',
    warrantyPeriod: 6,
    usageHistory: [
      {
        id: 'SU002',
        sparepartId: 'SP003',
        consoleId: '2',
        usageDate: '2024-12-15',
        reason: 'replacement',
        description: 'Kabel lama putus',
        quantity: 1,
        technician: 'Budi Santoso',
        cost: 25000,
        createdAt: '2024-12-15T10:00:00'
      }
    ],
    isActive: true,
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-12-15T10:00:00',
    createdBy: 'admin001'
  },
  {
    id: 'SP004',
    name: 'PS5 Internal SSD 1TB',
    partNumber: 'SN850-1TB',
    category: 'storage',
    compatibleConsoles: ['1', '2'],
    description: 'SSD internal 1TB untuk upgrade storage PlayStation 5',
    specifications: 'NVMe M.2 SSD, 1TB capacity, PCIe 4.0, up to 7000 MB/s read speed',
    brand: 'Western Digital',
    model: 'WD Black SN850',
    condition: 'new',
    price: 2500000,
    stock: 2,
    minStock: 1,
    location: 'Rak C-1 (Secure)',
    supplier: 'WD Official Store',
    purchaseLink: 'https://www.westerndigital.com/products/internal-drives/wd-black-sn850-nvme-ssd',
    alternativeLinks: [
      'https://tokopedia.com/search?st=product&q=wd%20black%20sn850%201tb',
      'https://shopee.co.id/search?keyword=wd%20black%20sn850'
    ],
    photos: [
      'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400'
    ],
    installationNotes: 'Matikan console, buka cover, pasang SSD dengan hati-hati, format melalui system settings',
    warrantyPeriod: 60,
    usageHistory: [
      {
        id: 'SU003',
        sparepartId: 'SP004',
        consoleId: '1',
        usageDate: '2024-11-15',
        reason: 'upgrade',
        description: 'Upgrade storage untuk menambah kapasitas game',
        quantity: 1,
        technician: 'Andi Wijaya',
        cost: 150000,
        notes: 'Instalasi berhasil, storage terdeteksi 931GB available',
        createdAt: '2024-11-15T16:00:00'
      }
    ],
    isActive: true,
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-11-15T16:00:00',
    createdBy: 'admin001'
  },
  {
    id: 'SP005',
    name: 'PS4 Cooling Fan',
    partNumber: 'PS4-FAN-OEM',
    category: 'cooling',
    compatibleConsoles: ['3', '4', '5'],
    description: 'Kipas pendingin internal untuk PlayStation 4',
    specifications: 'DC 12V, 0.5A, 4-pin connector, original replacement part',
    brand: 'Sony OEM',
    condition: 'new',
    price: 150000,
    stock: 6,
    minStock: 2,
    location: 'Rak B-3',
    supplier: 'PS4 Parts Supplier',
    purchaseLink: 'https://tokopedia.com/search?st=product&q=ps4%20cooling%20fan%20original',
    photos: [
      'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400'
    ],
    installationNotes: 'Buka casing PS4, lepas fan lama, pasang fan baru, pastikan kabel terpasang dengan benar',
    warrantyPeriod: 12,
    usageHistory: [
      {
        id: 'SU004',
        sparepartId: 'SP005',
        consoleId: '4',
        usageDate: '2024-12-28',
        reason: 'replacement',
        description: 'Fan lama berisik dan tidak berputar optimal',
        quantity: 1,
        technician: 'Budi Santoso',
        cost: 100000,
        notes: 'Setelah penggantian, suhu console normal dan tidak berisik',
        createdAt: '2024-12-28T11:00:00'
      }
    ],
    isActive: true,
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-12-28T11:00:00',
    createdBy: 'admin001'
  }
];

// Technicians Mock Data
export const mockTechnicians: Technician[] = [
  {
    id: 'TECH001',
    name: 'Andi Wijaya',
    email: 'andi.wijaya@psrental.com',
    phone: '+62 812-1111-1111',
    specializations: ['PlayStation 5', 'PlayStation 4', 'Controller Repair', 'Storage Upgrade'],
    certifications: [
      {
        id: 'CERT001',
        name: 'Sony PlayStation Certified Technician',
        issuedBy: 'Sony Interactive Entertainment',
        issuedDate: '2023-06-15',
        expiryDate: '2025-06-15',
        certificateNumber: 'SPCT-2023-001'
      }
    ],
    hourlyRate: 75000,
    status: 'active',
    totalRepairs: 45,
    averageRepairTime: 2.5,
    customerRating: 4.8,
    joinDate: '2023-01-15',
    createdAt: '2023-01-15T00:00:00',
    updatedAt: '2024-12-28T00:00:00'
  },
  {
    id: 'TECH002',
    name: 'Budi Santoso',
    email: 'budi.santoso@psrental.com',
    phone: '+62 812-2222-2222',
    specializations: ['PlayStation 4', 'Cooling Systems', 'Power Supply', 'General Maintenance'],
    certifications: [
      {
        id: 'CERT002',
        name: 'Electronics Repair Certification',
        issuedBy: 'Indonesian Electronics Association',
        issuedDate: '2022-03-20',
        certificateNumber: 'IEA-2022-045'
      }
    ],
    hourlyRate: 65000,
    status: 'active',
    totalRepairs: 38,
    averageRepairTime: 3.2,
    customerRating: 4.6,
    joinDate: '2022-08-01',
    createdAt: '2022-08-01T00:00:00',
    updatedAt: '2024-12-28T00:00:00'
  },
  {
    id: 'TECH003',
    name: 'Sari Dewi',
    email: 'sari.dewi@psrental.com',
    phone: '+62 812-3333-3333',
    specializations: ['Billiard Table Maintenance', 'Felt Replacement', 'Cushion Repair'],
    certifications: [],
    hourlyRate: 50000,
    status: 'active',
    totalRepairs: 22,
    averageRepairTime: 4.0,
    customerRating: 4.9,
    joinDate: '2023-11-01',
    createdAt: '2023-11-01T00:00:00',
    updatedAt: '2024-12-28T00:00:00'
  }
];

// Maintenance Transactions Mock Data
export const mockMaintenanceTransactions: MaintenanceTransaction[] = [
  {
    id: 'MNT001',
    transactionNumber: 'MNT-2024-001',
    consoleId: '1',
    consoleName: 'PlayStation 5 - Station 1',
    consoleModel: 'PlayStation 5',
    consoleSerialNumber: 'PS5-001',
    serviceDate: '2024-12-20',
    completedDate: '2024-12-20',
    technicianId: 'TECH001',
    technicianName: 'Andi Wijaya',
    issueDescription: 'Controller stick drift pada controller utama, customer mengeluh analog stick bergerak sendiri',
    serviceStatus: 'completed',
    priority: 'high',
    
    partsUsed: [
      {
        id: 'MPU001',
        sparepartId: 'SP001',
        sparepartName: 'DualSense Controller PS5',
        partNumber: 'CFI-ZCT1W',
        category: 'controller',
        oldPartCondition: 'Stick drift pada analog kiri, button berfungsi normal',
        oldPartSerialNumber: 'DS5-OLD-001',
        oldPartNotes: 'Controller masih bisa digunakan untuk game yang tidak memerlukan analog presisi',
        newPartSerialNumber: 'DS5-NEW-001',
        newPartCondition: 'new',
        quantityUsed: 1,
        unitCost: 850000,
        totalCost: 850000,
        installationNotes: 'Pairing berhasil, test semua fungsi OK, haptic feedback berfungsi normal',
        installationTime: 30,
        partWarrantyPeriod: 12,
        partWarrantyExpiry: '2025-12-20'
      }
    ],
    
    laborCost: 50000,
    additionalServiceFees: 0,
    totalPartsCost: 850000,
    totalRepairCost: 900000,
    
    paymentStatus: 'paid',
    warrantyType: 'service',
    warrantyExpiry: '2025-06-20',
    
    serviceNotes: 'Controller berhasil diganti, customer puas dengan performa controller baru. Dijelaskan cara perawatan controller agar awet.',
    beforePhotos: ['https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400'],
    afterPhotos: ['https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400'],
    testResults: 'Semua fungsi controller berfungsi normal: analog stick responsif, button tactile feedback baik, haptic feedback aktif, audio output clear',
    
    createdBy: 'cash001',
    createdAt: '2024-12-20T10:00:00',
    updatedAt: '2024-12-20T16:00:00',
    updatedBy: 'TECH001'
  },
  {
    id: 'MNT002',
    transactionNumber: 'MNT-2024-002',
    consoleId: '4',
    consoleName: 'PlayStation 4 - Station 2',
    consoleModel: 'PlayStation 4',
    consoleSerialNumber: 'PS4-002',
    serviceDate: '2024-12-28',
    technicianId: 'TECH002',
    technicianName: 'Budi Santoso',
    issueDescription: 'Console overheating dan fan berisik, sering auto shutdown saat bermain game berat',
    serviceStatus: 'in-progress',
    priority: 'urgent',
    
    partsUsed: [
      {
        id: 'MPU002',
        sparepartId: 'SP005',
        sparepartName: 'PS4 Cooling Fan',
        partNumber: 'PS4-FAN-OEM',
        category: 'cooling',
        oldPartCondition: 'Fan berisik, putaran tidak stabil, bearing aus',
        oldPartNotes: 'Fan sudah digunakan 2 tahun, perlu diganti',
        newPartCondition: 'new',
        quantityUsed: 1,
        unitCost: 150000,
        totalCost: 150000,
        installationNotes: 'Fan terpasang dengan baik, putaran smooth dan silent',
        installationTime: 90,
        partWarrantyPeriod: 12,
        partWarrantyExpiry: '2025-12-28'
      }
    ],
    
    laborCost: 100000,
    additionalServiceFees: 0,
    totalPartsCost: 150000,
    totalRepairCost: 250000,
    
    paymentStatus: 'pending',
    
    serviceNotes: 'Sedang dalam proses pembersihan internal dan penggantian thermal paste. Fan sudah diganti, menunggu testing final.',
    beforePhotos: ['https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400'],
    
    createdBy: 'cash001',
    createdAt: '2024-12-28T09:00:00',
    updatedAt: '2024-12-28T14:00:00',
    updatedBy: 'TECH002'
  },
  {
    id: 'MNT003',
    transactionNumber: 'MNT-2024-003',
    consoleId: '2',
    consoleName: 'PlayStation 5 - Station 2',
    consoleModel: 'PlayStation 5',
    consoleSerialNumber: 'PS5-002',
    serviceDate: '2024-12-15',
    completedDate: '2024-12-15',
    technicianId: 'TECH001',
    technicianName: 'Andi Wijaya',
    issueDescription: 'Kabel charging controller putus, tidak bisa charge controller',
    serviceStatus: 'completed',
    priority: 'medium',
    
    partsUsed: [
      {
        id: 'MPU003',
        sparepartId: 'SP003',
        sparepartName: 'USB-C Charging Cable',
        partNumber: 'USB-C-3M',
        category: 'cable',
        oldPartCondition: 'Kabel putus di bagian connector USB-C',
        oldPartNotes: 'Kabel sudah digunakan 8 bulan, sering ditekuk',
        newPartCondition: 'new',
        quantityUsed: 1,
        unitCost: 75000,
        totalCost: 75000,
        installationNotes: 'Kabel baru berfungsi normal, charging speed optimal',
        installationTime: 15,
        partWarrantyPeriod: 6,
        partWarrantyExpiry: '2025-06-15'
      }
    ],
    
    laborCost: 25000,
    additionalServiceFees: 0,
    totalPartsCost: 75000,
    totalRepairCost: 100000,
    
    paymentStatus: 'paid',
    warrantyType: 'service',
    warrantyExpiry: '2025-03-15',
    
    serviceNotes: 'Penggantian kabel charging berhasil. Customer diedukasi untuk tidak menekuk kabel berlebihan.',
    testResults: 'Charging berfungsi normal, kabel terdeteksi dengan baik, tidak ada error',
    
    createdBy: 'cash001',
    createdAt: '2024-12-15T11:00:00',
    updatedAt: '2024-12-15T12:00:00',
    updatedBy: 'TECH001'
  },
  {
    id: 'MNT004',
    transactionNumber: 'MNT-2024-004',
    consoleId: '1',
    consoleName: 'PlayStation 5 - Station 1',
    consoleModel: 'PlayStation 5',
    consoleSerialNumber: 'PS5-001',
    serviceDate: '2024-11-15',
    completedDate: '2024-11-15',
    technicianId: 'TECH001',
    technicianName: 'Andi Wijaya',
    issueDescription: 'Upgrade storage internal untuk menambah kapasitas penyimpanan game',
    serviceStatus: 'completed',
    priority: 'low',
    
    partsUsed: [
      {
        id: 'MPU004',
        sparepartId: 'SP004',
        sparepartName: 'PS5 Internal SSD 1TB',
        partNumber: 'SN850-1TB',
        category: 'storage',
        oldPartCondition: 'Tidak ada part lama (upgrade)',
        newPartCondition: 'new',
        quantityUsed: 1,
        unitCost: 2500000,
        totalCost: 2500000,
        installationNotes: 'SSD terpasang dengan sempurna, format berhasil, storage terdeteksi 931GB available',
        installationTime: 45,
        partWarrantyPeriod: 60,
        partWarrantyExpiry: '2029-11-15'
      }
    ],
    
    laborCost: 150000,
    additionalServiceFees: 0,
    totalPartsCost: 2500000,
    totalRepairCost: 2650000,
    
    paymentStatus: 'paid',
    warrantyType: 'manufacturer',
    warrantyExpiry: '2029-11-15',
    
    serviceNotes: 'Upgrade SSD berhasil dilakukan. Console sekarang memiliki total storage ~1.8TB. Customer sangat puas dengan peningkatan kapasitas.',
    testResults: 'SSD terdeteksi dengan baik, speed test menunjukkan performa optimal, game loading lebih cepat',
    
    createdBy: 'mgr001',
    createdAt: '2024-11-15T14:00:00',
    updatedAt: '2024-11-15T17:00:00',
    updatedBy: 'TECH001'
  }
];

// Maintenance History Mock Data
export const mockMaintenanceHistory: MaintenanceHistory[] = [
  {
    consoleId: '1',
    totalMaintenanceCount: 2,
    totalMaintenanceCost: 3550000,
    lastMaintenanceDate: '2024-12-20',
    averageRepairCost: 1775000,
    commonIssues: [
      {
        issue: 'Controller stick drift',
        frequency: 1,
        averageCost: 900000,
        lastOccurrence: '2024-12-20'
      }
    ],
    partsReplacementHistory: [
      {
        sparepartId: 'SP001',
        sparepartName: 'DualSense Controller PS5',
        replacementCount: 1,
        totalCost: 900000,
        lastReplacement: '2024-12-20',
        averageLifespan: 240
      },
      {
        sparepartId: 'SP004',
        sparepartName: 'PS5 Internal SSD 1TB',
        replacementCount: 1,
        totalCost: 2650000,
        lastReplacement: '2024-11-15'
      }
    ],
    warrantyStatus: 'active',
    nextScheduledMaintenance: '2025-06-20'
  },
  {
    consoleId: '2',
    totalMaintenanceCount: 1,
    totalMaintenanceCost: 100000,
    lastMaintenanceDate: '2024-12-15',
    averageRepairCost: 100000,
    commonIssues: [
      {
        issue: 'Charging cable issues',
        frequency: 1,
        averageCost: 100000,
        lastOccurrence: '2024-12-15'
      }
    ],
    partsReplacementHistory: [
      {
        sparepartId: 'SP003',
        sparepartName: 'USB-C Charging Cable',
        replacementCount: 1,
        totalCost: 100000,
        lastReplacement: '2024-12-15',
        averageLifespan: 240
      }
    ],
    warrantyStatus: 'active',
    nextScheduledMaintenance: '2025-03-15'
  },
  {
    consoleId: '4',
    totalMaintenanceCount: 1,
    totalMaintenanceCost: 250000,
    lastMaintenanceDate: '2024-12-28',
    averageRepairCost: 250000,
    commonIssues: [
      {
        issue: 'Overheating issues',
        frequency: 1,
        averageCost: 250000,
        lastOccurrence: '2024-12-28'
      }
    ],
    partsReplacementHistory: [
      {
        sparepartId: 'SP005',
        sparepartName: 'PS4 Cooling Fan',
        replacementCount: 1,
        totalCost: 250000,
        lastReplacement: '2024-12-28',
        averageLifespan: 730
      }
    ],
    warrantyStatus: 'active'
  }
];

// Simplified Vouchers
export const mockVouchers: Voucher[] = [
  {
    id: 'V001',
    voucherCode: 'VCH001',
    name: 'Voucher Gaming 5 Jam',
    description: 'Voucher untuk bermain game selama 5 jam dengan diskon 10%',
    totalHours: 5,
    remainingHours: 3.5,
    usedHours: 1.5,
    originalPrice: 50000, // 5 x 10000 (PS4 rate)
    voucherPrice: 45000, // 10% discount
    discountAmount: 5000,
    discountPercentage: 10,
    validityDays: 30,
    createdDate: '2024-12-20',
    expiryDate: '2025-01-19',
    status: 'active',
    customerId: '1',
    customerName: 'Ahmad Pratama',
    customerPhone: '+62 812-3456-7890',
    soldDate: '2024-12-20',
    soldBy: 'cash001',
    isActive: true,
    createdAt: '2024-12-20T10:00:00',
    updatedAt: '2024-12-28T15:30:00',
    createdBy: 'cash001'
  },
  {
    id: 'V002',
    voucherCode: 'VCH002',
    name: 'Voucher Gaming 10 Jam',
    description: 'Voucher untuk bermain game selama 10 jam dengan diskon 15%',
    totalHours: 10,
    remainingHours: 10,
    usedHours: 0,
    originalPrice: 100000, // 10 x 10000
    voucherPrice: 85000, // 15% discount
    discountAmount: 15000,
    discountPercentage: 15,
    validityDays: 45,
    createdDate: '2024-12-25',
    expiryDate: '2025-02-08',
    status: 'active',
    customerId: '2',
    customerName: 'Siti Nurhaliza',
    customerPhone: '+62 856-7890-1234',
    soldDate: '2024-12-25',
    soldBy: 'cash001',
    isActive: true,
    createdAt: '2024-12-25T14:00:00',
    updatedAt: '2024-12-25T14:00:00',
    createdBy: 'cash001'
  },
  {
    id: 'V003',
    voucherCode: 'VCH003',
    name: 'Voucher Premium 5 Jam',
    description: 'Voucher untuk bermain PS5 selama 5 jam dengan diskon 10%',
    totalHours: 5,
    remainingHours: 0,
    usedHours: 5,
    originalPrice: 75000, // 5 x 15000 (PS5 rate)
    voucherPrice: 67500, // 10% discount
    discountAmount: 7500,
    discountPercentage: 10,
    validityDays: 30,
    createdDate: '2024-11-15',
    expiryDate: '2024-12-15',
    status: 'used-up',
    customerId: '3',
    customerName: 'Budi Santoso',
    customerPhone: '+62 878-9012-3456',
    soldDate: '2024-11-15',
    soldBy: 'cash002',
    isActive: true,
    createdAt: '2024-11-15T09:00:00',
    updatedAt: '2024-12-15T18:00:00',
    createdBy: 'cash002'
  },
  {
    id: 'V004',
    voucherCode: 'VCH004',
    name: 'Voucher Billiard 3 Jam',
    description: 'Voucher untuk bermain billiard selama 3 jam dengan diskon 12%',
    totalHours: 3,
    remainingHours: 3,
    usedHours: 0,
    originalPrice: 75000, // 3 x 25000 (Billiard rate)
    voucherPrice: 66000, // 12% discount
    discountAmount: 9000,
    discountPercentage: 12,
    validityDays: 30,
    createdDate: '2024-12-28',
    expiryDate: '2025-01-27',
    status: 'active',
    isActive: true,
    createdAt: '2024-12-28T16:00:00',
    updatedAt: '2024-12-28T16:00:00',
    createdBy: 'cash001'
  },
  {
    id: 'V005',
    voucherCode: 'VCH005',
    name: 'Voucher Gaming 8 Jam',
    description: 'Voucher untuk bermain game selama 8 jam dengan diskon 12%',
    totalHours: 8,
    remainingHours: 8,
    usedHours: 0,
    originalPrice: 80000, // 8 x 10000
    voucherPrice: 70400, // 12% discount
    discountAmount: 9600,
    discountPercentage: 12,
    validityDays: 60,
    createdDate: '2024-12-01',
    expiryDate: '2025-01-30',
    status: 'expired',
    isActive: true,
    createdAt: '2024-12-01T11:00:00',
    updatedAt: '2024-12-01T11:00:00',
    createdBy: 'mgr001'
  }
];

// Voucher Usage History
export const mockVoucherUsages: VoucherUsage[] = [
  {
    id: 'VU001',
    voucherId: 'V001',
    voucherCode: 'VCH001',
    rentalSessionId: '1',
    hoursUsed: 1.5,
    usageDate: '2024-12-28',
    remainingHoursAfter: 3.5,
    usedBy: 'cash001',
    notes: 'PlayStation 4 rental session',
    createdAt: '2024-12-28T15:30:00'
  },
  {
    id: 'VU002',
    voucherId: 'V003',
    voucherCode: 'VCH003',
    hoursUsed: 2,
    usageDate: '2024-12-10',
    remainingHoursAfter: 3,
    usedBy: 'cash002',
    notes: 'PlayStation 5 rental session',
    createdAt: '2024-12-10T14:00:00'
  },
  {
    id: 'VU003',
    voucherId: 'V003',
    voucherCode: 'VCH003',
    hoursUsed: 3,
    usageDate: '2024-12-15',
    remainingHoursAfter: 0,
    usedBy: 'cash001',
    notes: 'Final usage - voucher depleted',
    createdAt: '2024-12-15T18:00:00'
  }
];

export const mockConsoles: Console[] = [
  {
    id: '1',
    name: 'PlayStation 5 - Station 1',
    equipmentTypeId: 'ET002',
    rateProfileId: 'RP002',
    status: 'rented',
    location: 'Lantai 1 - Area Gaming A',
    serialNumber: 'PS5-001',
    purchaseDate: '2024-01-15',
    warrantyExpiry: '2026-01-15',
    notes: 'Console utama dengan controller wireless',
    ipAddress: '192.168.1.101',
    relayCommand: '/relay/0?turn=',
    isActive: true,
    createdAt: '2024-01-15T00:00:00',
    updatedAt: '2024-01-15T00:00:00'
  },
  {
    id: '2',
    name: 'PlayStation 5 - Station 2',
    equipmentTypeId: 'ET002',
    rateProfileId: 'RP002',
    status: 'rented',
    location: 'Lantai 1 - Area Gaming A',
    serialNumber: 'PS5-002',
    purchaseDate: '2024-01-15',
    warrantyExpiry: '2026-01-15',
    ipAddress: '192.168.1.102',
    relayCommand: '/relay/0?turn=',
    isActive: true,
    createdAt: '2024-01-15T00:00:00',
    updatedAt: '2024-01-15T00:00:00'
  },
  {
    id: '3',
    name: 'PlayStation 4 - Station 1',
    equipmentTypeId: 'ET001',
    rateProfileId: 'RP001',
    status: 'available',
    location: 'Lantai 1 - Area Gaming B',
    serialNumber: 'PS4-001',
    purchaseDate: '2023-06-01',
    warrantyExpiry: '2025-06-01',
    ipAddress: '192.168.1.103',
    relayCommand: '/relay/0?turn=',
    isActive: true,
    createdAt: '2023-06-01T00:00:00',
    updatedAt: '2023-06-01T00:00:00'
  },
  {
    id: '4',
    name: 'PlayStation 4 - Station 2',
    equipmentTypeId: 'ET001',
    rateProfileId: 'RP001',
    status: 'rented',
    location: 'Lantai 1 - Area Gaming B',
    serialNumber: 'PS4-002',
    purchaseDate: '2023-06-01',
    warrantyExpiry: '2025-06-01',
    ipAddress: '192.168.1.104',
    relayCommand: '/relay/0?turn=',
    isActive: true,
    createdAt: '2023-06-01T00:00:00',
    updatedAt: '2023-06-01T00:00:00'
  },
  {
    id: '5',
    name: 'PlayStation 4 - Station 3',
    equipmentTypeId: 'ET001',
    rateProfileId: 'RP001',
    status: 'maintenance',
    location: 'Lantai 1 - Area Gaming B',
    serialNumber: 'PS4-003',
    purchaseDate: '2023-06-01',
    warrantyExpiry: '2025-06-01',
    notes: 'Controller rusak, perlu diganti',
    ipAddress: '192.168.1.105',
    relayCommand: '/relay/0?turn=',
    isActive: true,
    createdAt: '2023-06-01T00:00:00',
    updatedAt: '2023-06-01T00:00:00'
  },
  {
    id: '6',
    name: 'Billiard Table 1',
    equipmentTypeId: 'ET003',
    rateProfileId: 'RP003',
    status: 'available',
    location: 'Lantai 2 - Area Billiard',
    serialNumber: 'BIL-001',
    purchaseDate: '2023-12-01',
    warrantyExpiry: '2025-12-01',
    notes: 'Meja billiard 8-ball dengan felt hijau',
    ipAddress: '192.168.1.106',
    relayCommand: '/relay/0?turn=',
    isActive: true,
    createdAt: '2023-12-01T00:00:00',
    updatedAt: '2023-12-01T00:00:00'
  },
  {
    id: '7',
    name: 'Billiard Table 2',
    equipmentTypeId: 'ET004',
    rateProfileId: 'RP004',
    status: 'rented',
    location: 'Lantai 2 - Area Billiard',
    serialNumber: 'BIL-002',
    purchaseDate: '2023-12-01',
    warrantyExpiry: '2025-12-01',
    notes: 'Meja billiard 9-ball premium',
    ipAddress: '192.168.1.107',
    relayCommand: '/relay/0?turn=',
    isActive: true,
    createdAt: '2023-12-01T00:00:00',
    updatedAt: '2023-12-01T00:00:00'
  },
  {
    id: '8',
    name: 'Snooker Table 1',
    equipmentTypeId: 'ET005',
    rateProfileId: 'RP004',
    status: 'available',
    location: 'Lantai 2 - Area Snooker',
    serialNumber: 'SNK-001',
    purchaseDate: '2024-02-01',
    warrantyExpiry: '2026-02-01',
    notes: 'Meja snooker ukuran standar internasional',
    ipAddress: '192.168.1.108',
    relayCommand: '/relay/0?turn=',
    isActive: true,
    createdAt: '2024-02-01T00:00:00',
    updatedAt: '2024-02-01T00:00:00'
  }
];

// Helper function to create realistic start times
const createStartTime = (hoursAgo: number, minutesAgo: number = 0) => {
  const now = new Date();
  const startTime = new Date(now.getTime() - (hoursAgo * 60 * 60 * 1000) - (minutesAgo * 60 * 1000));
  return startTime.toISOString();
};

export const mockRentalSessions: RentalSession[] = [
  {
    id: '1',
    customerId: '1',
    consoleId: '1',
    startTime: createStartTime(2, 30), // Started 2 hours 30 minutes ago
    duration: 150, // 2.5 hours in minutes
    rateType: 'hourly',
    baseAmount: 45000, // 3 hours * 15000
    lateFee: 0,
    totalAmount: 45000,
    status: 'active',
    paymentStatus: 'pending',
    paidAmount: 0,
    appliedRateProfile: {
      id: 'RP002',
      name: 'PlayStation Premium',
      hourlyRate: 15000,
      peakHourRate: 18000,
      weekendMultiplier: 1.3
    },
    // Voucher usage
    isVoucherUsed: true,
    voucherId: 'V001',
    voucherCode: 'VCH001',
    voucherHoursUsed: 1.5,
    voucherRemainingBefore: 5,
    voucherRemainingAfter: 3.5
  },
  {
    id: '2',
    customerId: '2',
    consoleId: '4',
    startTime: createStartTime(6), // Started 6 hours ago, completed
    endTime: new Date(Date.now() - (2 * 60 * 60 * 1000)).toISOString(), // Ended 2 hours ago
    duration: 240, // 4 hours
    rateType: 'hourly',
    baseAmount: 40000, // 4 hours * 10000
    lateFee: 0,
    totalAmount: 40000,
    status: 'completed',
    paymentStatus: 'paid',
    paidAmount: 40000,
    appliedRateProfile: {
      id: 'RP001',
      name: 'PlayStation Standard',
      hourlyRate: 10000,
      peakHourRate: 12000,
      weekendMultiplier: 1.2
    }
  },
  {
    id: '3',
    customerId: '3',
    consoleId: '2',
    startTime: createStartTime(1, 45), // Started 1 hour 45 minutes ago
    duration: 105, // 1.75 hours in minutes
    rateType: 'hourly',
    baseAmount: 30000, // 2 hours * 15000
    lateFee: 0,
    totalAmount: 30000,
    status: 'active',
    paymentStatus: 'partial',
    paidAmount: 15000,
    appliedRateProfile: {
      id: 'RP002',
      name: 'PlayStation Premium',
      hourlyRate: 15000,
      peakHourRate: 18000,
      weekendMultiplier: 1.3
    }
  },
  {
    id: '4',
    customerId: '4',
    consoleId: '7',
    startTime: createStartTime(3), // Started 3 hours ago
    duration: 180, // 3 hours
    rateType: 'hourly',
    baseAmount: 105000, // 3 hours * 35000
    lateFee: 0,
    totalAmount: 105000,
    status: 'active',
    paymentStatus: 'pending',
    paidAmount: 0,
    appliedRateProfile: {
      id: 'RP004',
      name: 'Billiard Premium',
      hourlyRate: 35000,
      peakHourRate: 42000,
      weekendMultiplier: 1.5
    }
  }
];

// Scheduled Bookings Mock Data
export const mockScheduledBookings: ScheduledBooking[] = [
  {
    id: 'BK001',
    customerId: '1',
    consoleId: '3',
    bookingDate: '2024-12-28',
    scheduledDate: '2025-01-07',
    scheduledTime: '12:00',
    duration: 2,
    endTime: '14:00',
    totalAmount: 20000, // 2 hours * 10000
    depositAmount: 10000,
    remainingAmount: 10000,
    status: 'confirmed',
    paymentStatus: 'deposit-paid',
    notes: 'Booking untuk main FIFA dengan teman',
    reminderSent: false,
    createdBy: 'cash001',
    createdAt: '2024-12-28T10:00:00',
    updatedAt: '2024-12-28T10:00:00'
  },
  {
    id: 'BK002',
    customerId: '2',
    consoleId: '6',
    bookingDate: '2024-12-28',
    scheduledDate: '2025-01-07',
    scheduledTime: '15:00',
    duration: 3,
    endTime: '18:00',
    totalAmount: 75000, // 3 hours * 25000
    depositAmount: 0,
    remainingAmount: 75000,
    status: 'confirmed',
    paymentStatus: 'unpaid',
    notes: 'Main billiard dengan keluarga',
    reminderSent: false,
    createdBy: 'cash001',
    createdAt: '2024-12-28T11:30:00',
    updatedAt: '2024-12-28T11:30:00'
  },
  {
    id: 'BK003',
    customerId: '3',
    consoleId: '8',
    bookingDate: '2024-12-27',
    scheduledDate: '2024-12-29',
    scheduledTime: '10:00',
    duration: 4,
    endTime: '14:00',
    totalAmount: 140000, // 4 hours * 35000
    depositAmount: 70000,
    remainingAmount: 70000,
    status: 'confirmed',
    paymentStatus: 'deposit-paid',
    notes: 'Tournament snooker dengan grup',
    reminderSent: true,
    createdBy: 'mgr001',
    createdAt: '2024-12-27T09:00:00',
    updatedAt: '2024-12-28T08:00:00'
  }
];

export const mockInvoices: Invoice[] = [
  {
    id: 'INV-001',
    rentalSessionId: '2',
    customerId: '2',
    issueDate: '2024-12-28',
    dueDate: '2024-12-28',
    items: [
      {
        description: 'PlayStation 4 Rental - 4 hours',
        quantity: 4,
        rate: 10000,
        amount: 40000
      }
    ],
    subtotal: 40000,
    lateFee: 0,
    total: 40000,
    status: 'paid'
  },
  {
    id: 'INV-002',
    rentalSessionId: '4',
    customerId: '4',
    issueDate: '2024-12-28',
    dueDate: '2024-12-29',
    items: [
      {
        description: 'Billiard Premium Rental - 3 hours',
        quantity: 3,
        rate: 35000,
        amount: 105000
      }
    ],
    subtotal: 105000,
    lateFee: 0,
    total: 105000,
    status: 'sent'
  }
];

// POS Mock Data
export const mockProducts: Product[] = [
  {
    id: 'P001',
    name: 'Kopi Americano',
    category: 'beverage',
    price: 15000,
    cost: 8000,
    stock: 50,
    minStock: 10,
    barcode: '8901234567890',
    description: 'Kopi hitam premium dengan rasa yang kuat',
    isActive: true
  },
  {
    id: 'P002',
    name: 'Kopi Latte',
    category: 'beverage',
    price: 18000,
    cost: 10000,
    stock: 45,
    minStock: 10,
    barcode: '8901234567891',
    description: 'Kopi dengan susu steamed yang creamy',
    isActive: true
  },
  {
    id: 'P003',
    name: 'Teh Tarik',
    category: 'beverage',
    price: 12000,
    cost: 6000,
    stock: 30,
    minStock: 10,
    barcode: '8901234567892',
    description: 'Teh manis dengan susu yang ditarik',
    isActive: true
  },
  {
    id: 'P004',
    name: 'Indomie Goreng',
    category: 'food',
    price: 8000,
    cost: 3500,
    stock: 25,
    minStock: 5,
    barcode: '8901234567893',
    description: 'Mie instan goreng klasik Indonesia',
    isActive: true
  },
  {
    id: 'P005',
    name: 'Indomie Kuah',
    category: 'food',
    price: 8000,
    cost: 3500,
    stock: 20,
    minStock: 5,
    barcode: '8901234567894',
    description: 'Mie instan kuah dengan rasa ayam',
    isActive: true
  },
  {
    id: 'P006',
    name: 'Chitato',
    category: 'snack',
    price: 5000,
    cost: 3000,
    stock: 40,
    minStock: 10,
    barcode: '8901234567895',
    description: 'Keripik kentang rasa sapi panggang',
    isActive: true
  },
  {
    id: 'P007',
    name: 'Oreo',
    category: 'snack',
    price: 7000,
    cost: 4500,
    stock: 35,
    minStock: 10,
    barcode: '8901234567896',
    description: 'Biskuit sandwich cokelat',
    isActive: true
  },
  {
    id: 'P008',
    name: 'Aqua 600ml',
    category: 'beverage',
    price: 3000,
    cost: 2000,
    stock: 60,
    minStock: 20,
    barcode: '8901234567897',
    description: 'Air mineral dalam kemasan',
    isActive: true
  }
];

export const mockSales: Sale[] = [
  {
    id: 'S001',
    customerId: '1',
    items: [
      {
        productId: 'P001',
        productName: 'Kopi Americano',
        quantity: 2,
        price: 15000,
        total: 30000
      },
      {
        productId: 'P006',
        productName: 'Chitato',
        quantity: 1,
        price: 5000,
        total: 5000
      }
    ],
    subtotal: 35000,
    tax: 0,
    discount: 0,
    total: 35000,
    paymentMethod: 'cash',
    paymentAmount: 40000,
    changeAmount: 5000,
    saleDate: '2024-12-28T15:30:00',
    cashierId: 'cash001',
    notes: 'Customer reguler'
  },
  {
    id: 'S002',
    items: [
      {
        productId: 'P004',
        productName: 'Indomie Goreng',
        quantity: 1,
        price: 8000,
        total: 8000
      },
      {
        productId: 'P008',
        productName: 'Aqua 600ml',
        quantity: 1,
        price: 3000,
        total: 3000
      }
    ],
    subtotal: 11000,
    tax: 0,
    discount: 0,
    total: 11000,
    paymentMethod: 'card',
    paymentAmount: 11000,
    changeAmount: 0,
    saleDate: '2024-12-28T16:45:00',
    cashierId: 'cash001'
  }
];

// Enhanced Cashier Sessions with detailed tracking
export const mockCashierSessions: CashierSession[] = [
  {
    id: 'CS001',
    cashierId: 'cash001',
    cashierName: 'Sari Dewi',
    startTime: '2024-12-28T08:00:00',
    openingCash: 500000, // Saldo awal dari bos
    totalSales: 46000,
    totalCash: 35000, // Cash sales
    totalCard: 11000, // Card sales
    totalTransfer: 0,
    totalTransactions: 2,
    status: 'active',
    notes: 'Shift pagi, kondisi normal',
    createdAt: '2024-12-28T08:00:00',
    updatedAt: '2024-12-28T16:45:00'
  },
  {
    id: 'CS002',
    cashierId: 'cash002',
    cashierName: 'Budi Hartono',
    startTime: '2024-12-27T08:00:00',
    endTime: '2024-12-27T20:00:00',
    openingCash: 500000,
    closingCash: 480000, // Uang yang disetor ke bos
    expectedCash: 485000, // Opening + cash sales - change given
    variance: -5000, // Kurang Rp 5,000
    totalSales: 125000,
    totalCash: 95000,
    totalCard: 30000,
    totalTransfer: 0,
    totalTransactions: 8,
    status: 'closed',
    notes: 'Shift kemarin, ada selisih kurang',
    createdAt: '2024-12-27T08:00:00',
    updatedAt: '2024-12-27T20:15:00'
  }
];

// Cashier Transactions - detailed transaction log
export const mockCashierTransactions: CashierTransaction[] = [
  {
    id: 'CT001',
    sessionId: 'CS001',
    type: 'sale',
    amount: 35000,
    paymentMethod: 'cash',
    referenceId: 'S001',
    description: 'Penjualan cafe - Kopi Americano x2, Chitato x1',
    timestamp: '2024-12-28T15:30:00',
    cashierId: 'cash001'
  },
  {
    id: 'CT002',
    sessionId: 'CS001',
    type: 'sale',
    amount: 11000,
    paymentMethod: 'card',
    referenceId: 'S002',
    description: 'Penjualan cafe - Indomie Goreng, Aqua 600ml',
    timestamp: '2024-12-28T16:45:00',
    cashierId: 'cash001'
  }
];

// Cash Flow tracking
export const mockCashFlow: CashFlow[] = [
  {
    id: 'CF001',
    sessionId: 'CS001',
    type: 'in',
    amount: 500000,
    description: 'Saldo awal kasir dari bos',
    category: 'opening',
    timestamp: '2024-12-28T08:00:00',
    cashierId: 'cash001'
  },
  {
    id: 'CF002',
    sessionId: 'CS001',
    type: 'in',
    amount: 40000,
    description: 'Pembayaran tunai - S001',
    category: 'sale',
    timestamp: '2024-12-28T15:30:00',
    cashierId: 'cash001'
  },
  {
    id: 'CF003',
    sessionId: 'CS001',
    type: 'out',
    amount: 5000,
    description: 'Kembalian untuk customer - S001',
    category: 'change',
    timestamp: '2024-12-28T15:30:00',
    cashierId: 'cash001'
  }
];

export const mockBookkeepingEntries: BookkeepingEntry[] = [
  {
    id: 'BE001',
    date: '2024-12-28',
    type: 'income',
    category: 'rental',
    description: 'PlayStation rental - Ahmad Pratama',
    amount: 45000,
    reference: 'R001'
  },
  {
    id: 'BE002',
    date: '2024-12-28',
    type: 'income',
    category: 'rental',
    description: 'Billiard rental - Rina Sari',
    amount: 105000,
    reference: 'R004'
  },
  {
    id: 'BE003',
    date: '2024-12-28',
    type: 'income',
    category: 'cafe',
    description: 'Penjualan cafe - Kopi dan snack',
    amount: 46000,
    reference: 'S001,S002'
  },
  {
    id: 'BE004',
    date: '2024-12-28',
    type: 'expense',
    category: 'inventory',
    description: 'Pembelian stok kopi dan snack',
    amount: 150000,
    reference: 'PO001'
  },
  {
    id: 'BE005',
    date: '2024-12-28',
    type: 'expense',
    category: 'operational',
    description: 'Listrik dan internet',
    amount: 75000,
    reference: 'UTIL001'
  },
  {
    id: 'BE006',
    date: '2024-12-20',
    type: 'income',
    category: 'voucher',
    description: 'Penjualan voucher VCH001 - Ahmad Pratama',
    amount: 45000,
    reference: 'VCH001'
  },
  {
    id: 'BE007',
    date: '2024-12-25',
    type: 'income',
    category: 'voucher',
    description: 'Penjualan voucher VCH002 - Siti Nurhaliza',
    amount: 85000,
    reference: 'VCH002'
  },
  {
    id: 'BE008',
    date: '2024-12-28',
    type: 'income',
    category: 'voucher',
    description: 'Penjualan voucher VCH004 - Walk-in customer',
    amount: 66000,
    reference: 'VCH004'
  }
];

// User Management Mock Data
export const mockPermissions: Permission[] = [
  // Dashboard
  { id: 'dashboard.view', module: 'dashboard', action: 'view', resource: 'dashboard', description: 'View dashboard' },
  
  // Rental Management
  { id: 'rental.view', module: 'rental', action: 'view', resource: 'rental', description: 'View rental sessions' },
  { id: 'rental.create', module: 'rental', action: 'create', resource: 'rental', description: 'Create new rental session' },
  { id: 'rental.update', module: 'rental', action: 'update', resource: 'rental', description: 'Update rental session' },
  { id: 'rental.delete', module: 'rental', action: 'delete', resource: 'rental', description: 'Delete rental session' },
  
  // Booking Management
  { id: 'booking.view', module: 'booking', action: 'view', resource: 'booking', description: 'View scheduled bookings' },
  { id: 'booking.create', module: 'booking', action: 'create', resource: 'booking', description: 'Create new booking' },
  { id: 'booking.update', module: 'booking', action: 'update', resource: 'booking', description: 'Update booking' },
  { id: 'booking.delete', module: 'booking', action: 'delete', resource: 'booking', description: 'Delete booking' },
  
  // Equipment Management
  { id: 'equipment.view', module: 'equipment', action: 'view', resource: 'equipment', description: 'View equipment types' },
  { id: 'equipment.create', module: 'equipment', action: 'create', resource: 'equipment', description: 'Create equipment type' },
  { id: 'equipment.update', module: 'equipment', action: 'update', resource: 'equipment', description: 'Update equipment type' },
  { id: 'equipment.delete', module: 'equipment', action: 'delete', resource: 'equipment', description: 'Delete equipment type' },
  
  // Rate Profile Management
  { id: 'rate.view', module: 'rate', action: 'view', resource: 'rate', description: 'View rate profiles' },
  { id: 'rate.create', module: 'rate', action: 'create', resource: 'rate', description: 'Create rate profile' },
  { id: 'rate.update', module: 'rate', action: 'update', resource: 'rate', description: 'Update rate profile' },
  { id: 'rate.delete', module: 'rate', action: 'delete', resource: 'rate', description: 'Delete rate profile' },
  
  // Customer Management
  { id: 'customer.view', module: 'customer', action: 'view', resource: 'customer', description: 'View customers' },
  { id: 'customer.create', module: 'customer', action: 'create', resource: 'customer', description: 'Create new customer' },
  { id: 'customer.update', module: 'customer', action: 'update', resource: 'customer', description: 'Update customer' },
  { id: 'customer.delete', module: 'customer', action: 'delete', resource: 'customer', description: 'Delete customer' },
  
  // POS/Cashier
  { id: 'pos.view', module: 'pos', action: 'view', resource: 'pos', description: 'Access POS system' },
  { id: 'pos.sale', module: 'pos', action: 'sale', resource: 'pos', description: 'Process sales' },
  { id: 'pos.refund', module: 'pos', action: 'refund', resource: 'pos', description: 'Process refunds' },
  { id: 'pos.session', module: 'pos', action: 'session', resource: 'pos', description: 'Manage cashier sessions' },
  
  // Product Management
  { id: 'product.view', module: 'product', action: 'view', resource: 'product', description: 'View products' },
  { id: 'product.create', module: 'product', action: 'create', resource: 'product', description: 'Create new product' },
  { id: 'product.update', module: 'product', action: 'update', resource: 'product', description: 'Update product' },
  { id: 'product.delete', module: 'product', action: 'delete', resource: 'product', description: 'Delete product' },
  
  // Sales Reports
  { id: 'sales.view', module: 'sales', action: 'view', resource: 'sales', description: 'View sales reports' },
  { id: 'sales.export', module: 'sales', action: 'export', resource: 'sales', description: 'Export sales data' },
  
  // Financial Management
  { id: 'finance.view', module: 'finance', action: 'view', resource: 'finance', description: 'View financial data' },
  { id: 'finance.bookkeeping', module: 'finance', action: 'bookkeeping', resource: 'finance', description: 'Manage bookkeeping' },
  { id: 'finance.invoice', module: 'finance', action: 'invoice', resource: 'finance', description: 'Manage invoices' },
  { id: 'finance.payment', module: 'finance', action: 'payment', resource: 'finance', description: 'Manage payments' },
  
  // Console Management
  { id: 'console.view', module: 'console', action: 'view', resource: 'console', description: 'View consoles' },
  { id: 'console.create', module: 'console', action: 'create', resource: 'console', description: 'Create new console' },
  { id:  'console.update', module: 'console', action: 'update', resource: 'console', description: 'Update console settings' },
  { id: 'console.delete', module: 'console', action: 'delete', resource: 'console', description: 'Delete console' },
  
  // Voucher Management
  { id: 'voucher.view', module: 'voucher', action: 'view', resource: 'voucher', description: 'View vouchers' },
  { id: 'voucher.create', module: 'voucher', action: 'create', resource: 'voucher', description: 'Create voucher' },
  { id: 'voucher.update', module: 'voucher', action: 'update', resource: 'voucher', description: 'Update voucher' },
  { id: 'voucher.delete', module: 'voucher', action: 'delete', resource: 'voucher', description: 'Delete voucher' },
  { id: 'voucher.sell', module: 'voucher', action: 'sell', resource: 'voucher', description: 'Sell voucher to customer' },
  { id: 'voucher.use', module: 'voucher', action: 'use', resource: 'voucher', description: 'Use voucher for payment' },
  { id: 'voucher.print', module: 'voucher', action: 'print', resource: 'voucher', description: 'Print voucher cards' },
  
  // User Management
  { id: 'user.view', module: 'user', action: 'view', resource: 'user', description: 'View users' },
  { id: 'user.create', module: 'user', action: 'create', resource: 'user', description: 'Create new user' },
  { id: 'user.update', module: 'user', action: 'update', resource: 'user', description: 'Update user' },
  { id: 'user.delete', module: 'user', action: 'delete', resource: 'user', description: 'Delete user' },
  { id: 'user.role', module: 'user', action: 'role', resource: 'user', description: 'Manage user roles' },
  
  // System Settings
  { id: 'system.settings', module: 'system', action: 'settings', resource: 'system', description: 'Manage system settings' },
  { id: 'system.backup', module: 'system', action: 'backup', resource: 'system', description: 'System backup' },
  { id: 'system.logs', module: 'system', action: 'logs', resource: 'system', description: 'View system logs' }
];

export const mockRoles: Role[] = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access with all permissions',
    permissions: mockPermissions,
    isSystem: true,
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00'
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Management access with financial and reporting capabilities',
    permissions: mockPermissions.filter(p => 
      !p.id.includes('user.') && 
      !p.id.includes('system.') &&
      !p.id.includes('delete')
    ),
    isSystem: false,
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00'
  },
  {
    id: 'cashier',
    name: 'Kasir',
    description: 'POS and basic rental operations',
    permissions: mockPermissions.filter(p => 
      p.id.includes('dashboard.view') ||
      p.id.includes('pos.') ||
      p.id.includes('rental.view') ||
      p.id.includes('rental.create') ||
      p.id.includes('booking.view') ||
      p.id.includes('booking.create') ||
      p.id.includes('customer.view') ||
      p.id.includes('customer.create') ||
      p.id.includes('product.view') ||
      p.id.includes('console.view') ||
      p.id.includes('voucher.view') ||
      p.id.includes('voucher.sell') ||
      p.id.includes('voucher.use') ||
      p.id.includes('voucher.print')
    ),
    isSystem: false,
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00'
  },
  {
    id: 'staff',
    name: 'Staff',
    description: 'Basic operational access',
    permissions: mockPermissions.filter(p => 
      p.id.includes('dashboard.view') ||
      p.id.includes('rental.view') ||
      p.id.includes('booking.view') ||
      p.id.includes('customer.view') ||
      p.id.includes('product.view') ||
      p.id.includes('console.view') ||
      p.id.includes('voucher.view')
    ),
    isSystem: false,
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00'
  }
];

export const mockUsers: User[] = [
  {
    id: 'admin001',
    username: 'admin',
    email: 'admin@psrental.com',
    fullName: 'System Administrator',
    phone: '+62 812-1111-1111',
    roleId: 'admin',
    status: 'active',
    lastLogin: '2024-12-28T08:00:00',
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-12-28T08:00:00',
    createdBy: 'system'
  },
  {
    id: 'mgr001',
    username: 'manager1',
    email: 'manager@psrental.com',
    fullName: 'Andi Wijaya',
    phone: '+62 812-2222-2222',
    roleId: 'manager',
    status: 'active',
    lastLogin: '2024-12-28T07:30:00',
    createdAt: '2024-01-15T00:00:00',
    updatedAt: '2024-12-28T07:30:00',
    createdBy: 'admin001'
  },
  {
    id: 'cash001',
    username: 'kasir1',
    email: 'kasir1@psrental.com',
    fullName: 'Sari Dewi',
    phone: '+62 812-3333-3333',
    roleId: 'cashier',
    status: 'active',
    lastLogin: '2024-12-28T08:15:00',
    createdAt: '2024-02-01T00:00:00',
    updatedAt: '2024-12-28T08:15:00',
    createdBy: 'mgr001'
  },
  {
    id: 'cash002',
    username: 'kasir2',
    email: 'kasir2@psrental.com',
    fullName: 'Budi Hartono',
    phone: '+62 812-4444-4444',
    roleId: 'cashier',
    status: 'active',
    lastLogin: '2024-12-27T20:00:00',
    createdAt: '2024-02-15T00:00:00',
    updatedAt: '2024-12-27T20:00:00',
    createdBy: 'mgr001'
  },
  {
    id: 'staff001',
    username: 'staff1',
    email: 'staff1@psrental.com',
    fullName: 'Rini Susanti',
    phone: '+62 812-5555-5555',
    roleId: 'staff',
    status: 'inactive',
    lastLogin: '2024-12-25T18:00:00',
    createdAt: '2024-03-01T00:00:00',
    updatedAt: '2024-12-25T18:00:00',
    createdBy: 'mgr001'
  }
];

export const mockUserSessions: UserSession[] = [
  {
    id: 'sess001',
    userId: 'admin001',
    loginTime: '2024-12-28T08:00:00',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    status: 'active'
  },
  {
    id: 'sess002',
    userId: 'cash001',
    loginTime: '2024-12-28T08:15:00',
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    status: 'active'
  }
];

export const mockActivityLogs: ActivityLog[] = [
  {
    id: 'log001',
    userId: 'admin001',
    action: 'login',
    module: 'auth',
    description: 'User logged in successfully',
    timestamp: '2024-12-28T08:00:00',
    ipAddress: '192.168.1.100'
  },
  {
    id: 'log002',
    userId: 'cash001',
    action: 'session_opened',
    module: 'cashier',
    description: 'Opened cashier session with Rp 500,000 opening cash',
    metadata: { sessionId: 'CS001', openingCash: 500000 },
    timestamp: '2024-12-28T08:00:00',
    ipAddress: '192.168.1.101'
  },
  {
    id: 'log003',
    userId: 'cash001',
    action: 'sale_created',
    module: 'pos',
    description: 'Created new sale transaction',
    metadata: { saleId: 'S001', amount: 35000 },
    timestamp: '2024-12-28T15:30:00',
    ipAddress: '192.168.1.101'
  },
  {
    id: 'log004',
    userId: 'mgr001',
    action: 'user_created',
    module: 'user',
    description: 'Created new user account',
    metadata: { newUserId: 'staff001', role: 'staff' },
    timestamp: '2024-03-01T10:00:00',
    ipAddress: '192.168.1.102'
  },
  {
    id: 'log005',
    userId: 'cash001',
    action: 'booking_created',
    module: 'booking',
    description: 'Created new scheduled booking',
    metadata: { bookingId: 'BK001', customerId: '1', scheduledDate: '2025-01-07' },
    timestamp: '2024-12-28T10:00:00',
    ipAddress: '192.168.1.101'
  },
  {
    id: 'log006',
    userId: 'admin001',
    action: 'rate_profile_created',
    module: 'equipment',
    description: 'Created new rate profile',
    metadata: { rateProfileId: 'RP005', name: 'Student Discount' },
    timestamp: '2024-12-28T09:00:00',
    ipAddress: '192.168.1.100'
  },
  {
    id: 'log007',
    userId: 'cash001',
    action: 'voucher_sold',
    module: 'voucher',
    description: 'Sold voucher to customer',
    metadata: { voucherCode: 'VCH001', customerId: '1', amount: 45000 },
    timestamp: '2024-12-20T10:00:00',
    ipAddress: '192.168.1.101'
  },
  {
    id: 'log008',
    userId: 'cash001',
    action: 'voucher_used',
    module: 'voucher',
    description: 'Voucher used for rental payment',
    metadata: { voucherCode: 'VCH001', hoursUsed: 1.5, remainingHours: 3.5 },
    timestamp: '2024-12-28T15:30:00',
    ipAddress: '192.168.1.101'
  },
  {
    id: 'log009',
    userId: 'cash002',
    action: 'session_closed',
    module: 'cashier',
    description: 'Closed cashier session with cash deposit',
    metadata: { sessionId: 'CS002', closingCash: 480000, variance: -5000 },
    timestamp: '2024-12-27T20:15:00',
    ipAddress: '192.168.1.103'
  }
];