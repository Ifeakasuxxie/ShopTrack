import { View, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Calendar, TrendingUp } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { LineGraph } from "react-native-graph";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();

  const { data: salesData } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const token = await AsyncStorage.getItem("auth_token");
      const response = await fetch("/api/sales", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch sales");
      return response.json();
    },
  });

  const sales = salesData?.sales || [];

  // Calculate 7-day revenue for chart
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      days.push(date);
    }
    return days;
  };

  const last7Days = getLast7Days();
  const chartData = last7Days.map((day) => {
    const dayStart = new Date(day);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    const dayRevenue = sales
      .filter((sale) => {
        const saleDate = new Date(sale.created_at);
        return saleDate >= dayStart && saleDate <= dayEnd;
      })
      .reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);

    return {
      date: day,
      value: dayRevenue,
    };
  });

  const totalRevenue = sales.reduce(
    (sum, sale) => sum + parseFloat(sale.total_amount),
    0,
  );

  const todayRevenue = chartData[chartData.length - 1]?.value || 0;

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          backgroundColor: "#F59E0B",
          paddingTop: insets.top + 20,
          paddingBottom: 20,
          paddingHorizontal: 20,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "700",
            color: "#fff",
            marginBottom: 16,
          }}
        >
          Sales History
        </Text>

        {/* Stats */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: 8,
              padding: 12,
            }}
          >
            <Text style={{ fontSize: 12, color: "#FEF3C7", marginBottom: 4 }}>
              Today's Revenue
            </Text>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#fff" }}>
              ₦{todayRevenue.toLocaleString()}
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: 8,
              padding: 12,
            }}
          >
            <Text style={{ fontSize: 12, color: "#FEF3C7", marginBottom: 4 }}>
              Total Sales
            </Text>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#fff" }}>
              {sales.length}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 20,
        }}
      >
        {/* 7-Day Revenue Chart */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <TrendingUp size={20} color="#F59E0B" />
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#111827" }}>
              Last 7 Days Revenue
            </Text>
          </View>

          {chartData.length > 0 && (
            <View style={{ height: 200 }}>
              <LineGraph
                points={chartData}
                animated={true}
                color="#F59E0B"
                style={{ width: "100%", height: 200 }}
                enablePanGesture={false}
                gradientFillColors={["#FEF3C7", "#FFFBEB"]}
              />
            </View>
          )}

          {/* Day Labels */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 12,
            }}
          >
            {last7Days.map((day, index) => (
              <Text key={index} style={{ fontSize: 10, color: "#6B7280" }}>
                {day.toLocaleDateString("en-US", { weekday: "short" })}
              </Text>
            ))}
          </View>
        </View>

        {/* Sales List */}
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: "#111827",
            marginBottom: 12,
          }}
        >
          Recent Sales
        </Text>

        {sales.length === 0 ? (
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 8,
              padding: 40,
              alignItems: "center",
            }}
          >
            <Calendar size={48} color="#D1D5DB" />
            <Text
              style={{
                fontSize: 16,
                color: "#6B7280",
                marginTop: 12,
                textAlign: "center",
              }}
            >
              No sales yet
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {sales.map((sale) => (
              <View
                key={sale.id}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 8,
                  padding: 16,
                  borderLeftWidth: 4,
                  borderLeftColor: "#F59E0B",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: "#111827",
                    }}
                  >
                    ₦{parseFloat(sale.total_amount).toLocaleString()}
                  </Text>
                  <Text style={{ fontSize: 14, color: "#6B7280" }}>
                    {new Date(sale.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: "#6B7280" }}>
                  {new Date(sale.created_at).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
