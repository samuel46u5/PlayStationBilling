export const NAV_ITEMS = [
    { id: "dashboard", label: "Dashboard"},
    // { id: "cashier", label: "Kasir POS", icon: CreditCard },
    { id: "cashier-session", label: "Pembukuan Kasir"},
    { id: "rentals", label: "Active Rentals"},
    { id: "bookings", label: "Scheduled Bookings"},
    { id: "customers", label: "Customers" },
    { id: "products", label: "Products"  },
    { id: "sales", label: "Sales Report"  },
    // { id: "payments", label: "Payments", icon: DollarSign },
    { id: "bookkeeping", label: "Bookkeeping"  },
    { id: "vouchers", label: "Voucher Management"  },
    { id: "consoles", label: "Consoles" },
    { id: "equipment", label: "Equipment Management" },
    { id: "rates", label: "Tarif"  },
    // { id: "rate-profiles", label: "Profil tarif", icon: TrendingUp },
    { id: "maintenance", label: "Hardware Maintenance" },
    { id: "users", label: "User Management" },
    { id: "rfid-cards", label: "Master Card" },
    { id: "device", label: "Device Management" },
    { id: "settings", label: "Pengaturan" },
    // { id: 'login', label: 'Login', icon: LogIn }
  ] as const;

  export type NavItemId =  typeof NAV_ITEMS[number]["id"];