"use client";

import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Package,
  TrendingUp,
  DollarSign,
  Calendar,
  AlertTriangle,
  LogOut,
  Menu,
  X,
} from "lucide-react";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch user info
      const userRes = await fetch("/api/auth/me");
      if (!userRes.ok) {
        window.location.href = "/";
        return;
      }
      const userData = await userRes.json();
      setUser(userData.user);

      // Fetch products, sales
      const [productsRes, salesRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/sales"),
      ]);

      const productsData = await productsRes.json();
      const salesData = await salesRes.json();

      setProducts(productsData.products || []);
      setSales(salesData.sales || []);

      // Calculate stats
      const today = new Date().toDateString();
      const todaySales = (salesData.sales || []).filter(
        (s) => new Date(s.created_at).toDateString() === today,
      );
      const todayRevenue = todaySales.reduce(
        (sum, s) => sum + parseFloat(s.total_amount),
        0,
      );
      const lowStock = (productsData.products || []).filter(
        (p) => p.stock_quantity < 10,
      );

      setStats({
        totalProducts: productsData.products?.length || 0,
        lowStock: lowStock.length,
        todaySales: todaySales.length,
        todayRevenue,
      });

      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Products",
      value: stats?.totalProducts || 0,
      icon: Package,
      color: "blue",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Low Stock Items",
      value: stats?.lowStock || 0,
      icon: AlertTriangle,
      color: "red",
      bgColor: "bg-red-50",
      iconColor: "text-red-600",
    },
    {
      label: "Today's Sales",
      value: stats?.todaySales || 0,
      icon: ShoppingCart,
      color: "green",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      label: "Today's Revenue",
      value: `₦${(stats?.todayRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "purple",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
    },
  ];

  const lowStockProducts = products.filter((p) => p.stock_quantity < 10);
  const recentSales = sales.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">ShopTrack</h1>
          <p className="text-sm text-gray-500 mt-1">
            {user?.business_name || "Dashboard"}
          </p>
        </div>
        <nav className="p-4">
          <a
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-green-50 text-green-700 font-medium"
          >
            <TrendingUp size={20} />
            Overview
          </a>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 w-full"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}
                    >
                      <Icon className={stat.iconColor} size={24} />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Low Stock Alerts */}
            {lowStockProducts.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="text-amber-600" size={20} />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Low Stock Alerts
                  </h3>
                </div>
                <div className="space-y-3">
                  {lowStockProducts.slice(0, 5).map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 bg-amber-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {product.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {product.category}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-amber-600">
                          {product.stock_quantity} left
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Sales */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="text-green-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">
                  Recent Sales
                </h3>
              </div>
              {recentSales.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No sales yet</p>
              ) : (
                <div className="space-y-3">
                  {recentSales.map((sale) => (
                    <div
                      key={sale.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          ₦{parseFloat(sale.total_amount).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(sale.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
