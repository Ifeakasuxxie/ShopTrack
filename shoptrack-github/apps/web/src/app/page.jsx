"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingCart,
  Package,
  TrendingUp,
  DollarSign,
  Search,
} from "lucide-react";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch products
  const { data: productsData } = useQuery({
    queryKey: ["products", searchQuery],
    queryFn: async () => {
      const url = searchQuery
        ? `/api/products?search=${encodeURIComponent(searchQuery)}`
        : "/api/products";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

  // Fetch sales
  const { data: salesData } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const response = await fetch("/api/sales");
      if (!response.ok) throw new Error("Failed to fetch sales");
      return response.json();
    },
  });

  const products = productsData?.products || [];
  const sales = salesData?.sales || [];

  // Calculate stats
  const totalProducts = products.length;
  const lowStockProducts = products.filter((p) => p.stock_quantity < 10).length;
  const todaySales = sales.filter((s) => {
    const saleDate = new Date(s.created_at);
    const today = new Date();
    return saleDate.toDateString() === today.toDateString();
  });
  const todayRevenue = todaySales.reduce(
    (sum, s) => sum + parseFloat(s.total_amount),
    0,
  );

  const stats = [
    {
      label: "Total Products",
      value: totalProducts,
      icon: Package,
      color: "bg-blue-500",
    },
    {
      label: "Low Stock",
      value: lowStockProducts,
      icon: TrendingUp,
      color: "bg-red-500",
    },
    {
      label: "Today's Sales",
      value: todaySales.length,
      icon: ShoppingCart,
      color: "bg-green-500",
    },
    {
      label: "Today's Revenue",
      value: `₦${todayRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 text-white py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">ShopTrack Dashboard</h1>
          <p className="text-green-100">Manage your shop inventory and sales</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-4">
                  <div className={`${stat.color} bg-opacity-10 p-3 rounded-lg`}>
                    <Icon
                      className={`w-6 h-6 ${stat.color.replace("bg-", "text-")}`}
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Inventory Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Inventory</h2>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Barcode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Selling Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      {searchQuery
                        ? "No products found"
                        : "No products yet. Use the mobile app to add products."}
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const isLowStock = product.stock_quantity < 10;
                    const isOutOfStock = product.stock_quantity === 0;

                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {product.barcode || "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            ₦{parseFloat(product.cost_price).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-green-600">
                            ₦
                            {parseFloat(product.selling_price).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {product.stock_quantity}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              isOutOfStock
                                ? "bg-red-100 text-red-800"
                                : isLowStock
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                            }`}
                          >
                            {isOutOfStock
                              ? "Out of Stock"
                              : isLowStock
                                ? "Low Stock"
                                : "In Stock"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Recent Sales</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {sales.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No sales yet. Sales will appear here after checkout on the
                mobile app.
              </div>
            ) : (
              sales.slice(0, 10).map((sale) => {
                const date = new Date(sale.created_at);
                const items = sale.items || [];

                return (
                  <div key={sale.id} className="p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-lg font-semibold text-gray-900">
                          ₦{parseFloat(sale.total_amount).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          {date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {items.length} {items.length === 1 ? "item" : "items"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {items.slice(0, 3).map((item, index) => (
                        <span key={index}>
                          {item.product_name} ({item.quantity})
                          {index < Math.min(items.length - 1, 2) && ", "}
                        </span>
                      ))}
                      {items.length > 3 && (
                        <span> and {items.length - 3} more...</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Download Note */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Mobile App Available
          </h3>
          <p className="text-blue-800">
            Download the ShopTrack mobile app to manage products, scan barcodes,
            and process sales on the go. This dashboard provides a read-only
            view of your inventory and sales data.
          </p>
        </div>
      </div>
    </div>
  );
}
