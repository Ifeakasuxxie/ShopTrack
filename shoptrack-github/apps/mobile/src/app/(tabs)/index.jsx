import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import {
  ShoppingCart,
  Package,
  TrendingUp,
  DollarSign,
  LogOut,
  AlertTriangle,
} from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Fetch dashboard stats
  const { data: statsData } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const token = await AsyncStorage.getItem("auth_token");
      const [productsRes, salesRes, expensesRes] = await Promise.all([
        fetch("/api/products", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
        fetch("/api/sales", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
        fetch("/api/expenses", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
      ]);

      if (!productsRes.ok || !salesRes.ok || !expensesRes.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const products = await productsRes.json();
      const sales = await salesRes.json();
      const expenses = await expensesRes.json();

      return {
        products: products.products,
        sales: sales.sales,
        expenses: expenses.expenses,
      };
    },
  });

  const products = statsData?.products || [];
  const sales = statsData?.sales || [];

  const totalProducts = products.length;
  const lowStockProducts = products.filter((p) => p.stock_quantity < 10);
  const todaySales = sales.filter((s) => {
    const saleDate = new Date(s.created_at);
    const today = new Date();
    return saleDate.toDateString() === today.toDateString();
  });
  const todayRevenue = todaySales.reduce(
    (sum, s) => sum + parseFloat(s.total_amount),
    0,
  );

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("auth_token");
          await AsyncStorage.removeItem("user");
          router.replace("/login");
        },
      },
    ]);
  };

  const stats = [
    {
      label: "Total Products",
      value: totalProducts,
      icon: Package,
      color: "#3B82F6",
    },
    {
      label: "Low Stock",
      value: lowStockProducts.length,
      icon: TrendingUp,
      color: "#EF4444",
    },
    {
      label: "Today's Sales",
      value: todaySales.length,
      icon: ShoppingCart,
      color: "#10B981",
    },
    {
      label: "Today's Revenue",
      value: `₦${todayRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "#8B5CF6",
    },
  ];

  const quickActions = [
    {
      label: "New Sale",
      route: "/(tabs)/pos",
      icon: ShoppingCart,
      color: "#10B981",
    },
    {
      label: "Add Product",
      route: "/(tabs)/add-product",
      icon: Package,
      color: "#3B82F6",
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <StatusBar style="dark" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Header */}
        <View
          style={{
            backgroundColor: "#10B981",
            paddingTop: insets.top + 20,
            paddingBottom: 30,
            paddingHorizontal: 20,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "700",
                  color: "#fff",
                  marginBottom: 4,
                }}
              >
                ShopTrack
              </Text>
              <Text style={{ fontSize: 16, color: "#D1FAE5" }}>
                Your shop management made simple
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleLogout}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                borderRadius: 8,
                padding: 8,
              }}
            >
              <LogOut size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={{ padding: 20, gap: 16 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: "#111827",
              marginBottom: 4,
            }}
          >
            Overview
          </Text>
          <View style={{ gap: 12 }}>
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <View
                  key={index}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 12,
                    padding: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 16,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: `${stat.color}15`,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={24} color={stat.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        color: "#6B7280",
                        marginBottom: 2,
                      }}
                    >
                      {stat.label}
                    </Text>
                    <Text
                      style={{
                        fontSize: 24,
                        fontWeight: "700",
                        color: "#111827",
                      }}
                    >
                      {stat.value}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Low Stock Alerts */}
        {lowStockProducts.length > 0 && (
          <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
            <View
              style={{
                backgroundColor: "#FEF3C7",
                borderRadius: 12,
                padding: 16,
                borderLeftWidth: 4,
                borderLeftColor: "#F59E0B",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <AlertTriangle size={20} color="#F59E0B" />
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "#92400E" }}
                >
                  Low Stock Alerts
                </Text>
              </View>
              {lowStockProducts.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  onPress={() => router.push("/(tabs)/inventory")}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 8,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: "#111827",
                      flex: 1,
                    }}
                  >
                    {product.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#F59E0B",
                    }}
                  >
                    {product.stock_quantity} left
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={{ padding: 20, paddingTop: 0 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: "#111827",
              marginBottom: 16,
            }}
          >
            Quick Actions
          </Text>
          <View style={{ gap: 12 }}>
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => router.push(action.route)}
                  style={{
                    backgroundColor: action.color,
                    borderRadius: 12,
                    padding: 20,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <Icon size={24} color="#fff" />
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "600",
                      color: "#fff",
                      flex: 1,
                    }}
                  >
                    {action.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
