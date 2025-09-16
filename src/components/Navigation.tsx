import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Gamepad2,
  Settings as SettingsIcon,
  DollarSign,
  ShoppingCart,
  Package,
  Calculator,
  CreditCard,
  Shield,
  Calendar,
  Wrench,
  Ticket,
  Cog,
  Wallet,
  LogIn,
  LogOut,
  User,
  PenTool as Tool,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { NAV_ITEMS } from "../constants/navItem";
import { db } from "../lib/supabase";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  // const navItems = [
  //   { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  //   // { id: "cashier", label: "Kasir POS", icon: CreditCard },
  //   { id: "cashier-session", label: "Pembukuan Kasir", icon: Wallet },
  //   { id: "rentals", label: "Active Rentals", icon: Gamepad2 },
  //   { id: "bookings", label: "Scheduled Bookings", icon: Calendar },
  //   { id: "customers", label: "Customers", icon: Users },
  //   { id: "products", label: "Products", icon: Package },
  //   { id: "sales", label: "Sales Report", icon: ShoppingCart },
  //   // { id: "payments", label: "Payments", icon: DollarSign },
  //   { id: "bookkeeping", label: "Bookkeeping", icon: Calculator },
  //   { id: "vouchers", label: "Voucher Management", icon: Ticket },
  //   { id: "consoles", label: "Consoles", icon: SettingsIcon },
  //   { id: "equipment", label: "Equipment Management", icon: Wrench },
  //   { id: "rates", label: "Tarif", icon: TrendingUp },
  //   // { id: "rate-profiles", label: "Profil tarif", icon: TrendingUp },
  //   { id: "maintenance", label: "Hardware Maintenance", icon: Tool },
  //   { id: "users", label: "User Management", icon: Shield },
  //   { id: "settings", label: "Pengaturan", icon: Cog },
  //   // { id: 'login', label: 'Login', icon: LogIn }
  // ];

  const iconMap: Record<string, any> = {
    dashboard: LayoutDashboard,
    "cashier-session": Wallet,
    rentals: Gamepad2,
    bookings: Calendar,
    customers: Users,
    products: Package,
    sales: ShoppingCart,
    bookkeeping: Calculator,
    vouchers: Ticket,
    consoles: SettingsIcon,
    equipment: Wrench,
    rates: TrendingUp,
    maintenance: Tool,
    "rfid-cards": CreditCard,
    users: Shield,
    settings: Cog,
  };
  const { user, logout } = useAuth();

  const [brand, setBrand] = React.useState({
    name: "Gaming & Billiard",
  });

  useEffect(() => {
    (async () => {
      try {
        const row = await db.settings.get();
        const general = (row?.general as any) || {};
        setBrand({
          name: general.businessName,
        });
      } catch (e) {
        console.error("Gagal memuat system settings:", e);
      }
    })();
  }, []);

  const allowedIds = Array.isArray(user?.roles?.nav_items)
    ? (user!.roles!.nav_items as string[])
    : null;

  const navItems = (
    allowedIds ? NAV_ITEMS.filter((i) => allowedIds.includes(i.id)) : NAV_ITEMS
  ).map((i) => ({
    ...i,
    icon: iconMap[i.id] || LayoutDashboard,
  }));

  return (
    <nav className="bg-slate-800 text-white w-64 min-h-screen p-6 flex flex-col">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Gamepad2 className="h-8 w-8 text-blue-400" />
          <div>
            <h1 className="text-xl font-bold">{brand.name}</h1>
            <p className="text-slate-400 text-xs">Rental + Mini Cafe POS</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    activeTab === item.id
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
                {/* Hapus render RateProfilePage dari sini, hanya tombol menu saja */}
              </li>
            );
          })}
        </ul>
      </div>

      {/* User Profile Section */}
      <div className="mt-6 pt-6 border-t border-slate-700">
        <div className="flex items-center gap-3 px-4 py-2 mb-2">
          <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-slate-300" />
          </div>
          <div className="overflow-hidden">
            <p className="font-medium text-sm text-white truncate">
              {user?.full_name}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {user?.roles?.name}
            </p>
          </div>
        </div>
      </div>
      {user && (
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-red-400 hover:bg-slate-700 hover:text-red-500"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      )}
    </nav>
  );
};

export default Navigation;
