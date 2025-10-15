import React, { useEffect, useState } from "react";
import {
  DollarSign,
  Users,
  Gamepad2,
  Clock,
  TrendingUp,
  AlertCircle,
  ShoppingCart,
  Package,
} from "lucide-react";
import { db, supabase } from "../lib/supabase";

const Dashboard: React.FC = () => {
  const [rentalSessions, setRentalSessions] = useState<any[]>([]);
  const [consoles, setConsoles] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: rental_sessions, error } = await supabase
          .from("rental_sessions")
          .select(
            `
            *,
            consoles(name)
            `
          )
          .gte(
            "created_at",
            new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
          )
          .lte(
            "created_at",
            new Date(new Date().setHours(23, 59, 59, 999)).toISOString()
          )
          .order("created_at", { ascending: false });
        setRentalSessions(rental_sessions || []);
      } catch {
        setRentalSessions([]);
      }

      try {
        const consoles = await db.consoles.getAll();
        setConsoles(consoles || []);
      } catch {
        setConsoles([]);
      }

      try {
        const { data: trxRows } = await supabase
          .from("cashier_transactions")
          .select(
            `
            id,
            timestamp,
            details,
            type,
            cashier_sessions (
              cashier_name
            )
          `
          )
          .eq("type", "sale")
          .gte(
            "timestamp",
            new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
          )
          .lte(
            "timestamp",
            new Date(new Date().setHours(23, 59, 59, 999)).toISOString()
          )
          .order("timestamp", { ascending: false });

        // Normalize details (handle both JSON and string)
        const normalized = (trxRows || []).map((row: any) => {
          let details = row?.details;
          if (typeof details === "string") {
            try {
              details = JSON.parse(details);
            } catch {
              details = {};
            }
          }
          return { ...row, details: details || {} };
        });

        setSales(normalized);

        // Hitung top products dari details.items (type === 'product')
        const productAgg: Record<
          string,
          { product_name: string; quantity_sum: number; total_sum: number }
        > = {};
        for (const sale of normalized) {
          const items = sale?.details?.items || [];
          for (const item of items) {
            if (!item || item.type !== "product") continue;
            const name: string = item.product_name || item.name || "";
            if (!name) continue;
            const qty: number = Number(item.quantity ?? 1) || 1;
            const total: number =
              Number(item.total ?? (item.price ?? 0) * qty) || 0;
            if (!productAgg[name]) {
              productAgg[name] = {
                product_name: name,
                quantity_sum: 0,
                total_sum: 0,
              };
            }
            productAgg[name].quantity_sum += qty;
            productAgg[name].total_sum += total;
          }
        }
        const top = Object.values(productAgg)
          .sort((a, b) => b.quantity_sum - a.quantity_sum)
          .slice(0, 10);
        setTopProducts(top);
      } catch {
        setSales([]);
        setTopProducts([]);
      }

      try {
        const products = await db.products.getAll();
        setProducts(products || []);
      } catch {
        setProducts([]);
      }
    };
    fetchData();
  }, []);

  const activeRentals = consoles.filter(
    (console: any) => console.status === "rented"
  ).length;
  const rentalRevenue = rentalSessions.reduce(
    (sum: number, session: any) => sum + (session.total_amount || 0),
    0
  );
  const cafeRevenue = sales.reduce(
    (sum: number, sale: any) =>
      sum + (sale?.details?.breakdown?.products_total ?? 0),
    0
  );
  const totalRevenue = rentalRevenue + cafeRevenue;
  const lowStockProducts = products.filter(
    (p: any) => (p.stock ?? 0) <= (p.min_stock ?? 0)
  ).length;

  const stats = [
    {
      title: "Total Revenue Hari Ini",
      value: `Rp ${totalRevenue.toLocaleString("id-ID")}`,
      icon: DollarSign,
      color: "bg-green-500",
      subtitle: `Rental: Rp ${rentalRevenue.toLocaleString(
        "id-ID"
      )} | Cafe: Rp ${cafeRevenue.toLocaleString("id-ID")}`,
    },
    {
      title: "Active Rentals",
      value: `${activeRentals.toString()} Unit`,
      icon: Gamepad2,
      color: "bg-blue-500",
    },
    {
      title: "Penjualan Cafe",
      value: `${sales.length.toString()} Transaksi`,
      icon: ShoppingCart,
      color: "bg-purple-500",
    },
    {
      title: "Stok Menipis",
      value: `${lowStockProducts.toString()} Item`,
      icon: AlertCircle,
      color: lowStockProducts > 0 ? "bg-red-500" : "bg-green-500",
      trend: lowStockProducts > 0 ? "Perlu restok" : "Stok aman",
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Selamat datang! Berikut ringkasan bisnis hari ini.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-sm">
                  {stat.trend ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-green-600 font-medium">
                        {stat.trend}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value}
              </h3>
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Rental Terbaru
          </h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {rentalSessions.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                Belum ada sesi rental terbaru.
              </div>
            ) : (
              rentalSessions.map((session: any) => {
                const customerName = session.customers?.name ?? "-";
                const consoleName = session.consoles?.name ?? "-";
                const totalAmount =
                  session.total_amount ?? session.totalAmount ?? 0;
                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 border border-gray-100 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Gamepad2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {customerName}
                        </p>
                        <p className="text-sm text-gray-600">{consoleName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        Rp {totalAmount.toLocaleString("id-ID")}
                      </p>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          session.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {session.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Cafe Sales */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Penjualan Cafe Terbaru
          </h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {sales.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                Belum ada penjualan cafe terbaru.
              </div>
            ) : (
              sales.map((sale: any) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-4 border border-gray-100 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {sale.cashier_sessions.cashier_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {sale.details?.items?.filter(
                          (item: any) => item.type === "product"
                        ).length || 0}{" "}
                        item -{" "}
                        {sale.timestamp
                          ? new Date(sale.timestamp).toLocaleTimeString(
                              "id-ID",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : "-"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      Rp{" "}
                      {(
                        sale.details?.breakdown?.products_total ?? 0
                      ).toLocaleString("id-ID")}
                    </p>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        sale.details?.payment?.method === "cash"
                          ? "bg-green-100 text-green-800"
                          : sale.details?.payment?.method === "card"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {(sale.details?.payment?.method ?? "cash").toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Produk Terlaris
        </h2>
        <div className="space-y-4">
          {topProducts.map((top_product: any, index: number) => {
            const matched = products.find(
              (product: any) =>
                (product?.name ?? "").toLowerCase() ===
                (top_product?.product_name ?? "").toLowerCase()
            );
            const stock = matched?.stock ?? 0;
            const minStock = matched?.min_stock ?? matched?.minStock ?? 0;
            const price = matched?.price;

            return (
              <div
                key={`${top_product.product_name}-${index}`}
                className="flex items-center justify-between p-4 border border-gray-100 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-purple-600">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {top_product.product_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Terjual: {top_product.quantity_sum} • Total: Rp{" "}
                      {(Number(top_product.total_sum) || 0).toLocaleString(
                        "id-ID"
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    Rp {(price ?? 0).toLocaleString("id-ID")}
                  </p>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      stock <= minStock
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {stock <= minStock ? "Low Stock" : "In Stock"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
