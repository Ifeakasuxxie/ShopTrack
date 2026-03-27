import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  CheckCircle,
  ArrowLeft,
  ShoppingCart,
  History,
} from "lucide-react-native";

export default function ReceiptScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const total = parseFloat(params.total || "0");
  const items = params.items ? JSON.parse(params.items) : [];
  const date = params.date ? new Date(params.date) : new Date();

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          backgroundColor: "#10B981",
          paddingTop: insets.top + 12,
          paddingBottom: 16,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <TouchableOpacity onPress={() => router.replace("/(tabs)")}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#fff" }}>
          Receipt
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 100,
        }}
      >
        {/* Success Icon */}
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: "#D1FAE5",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <CheckCircle size={48} color="#10B981" />
          </View>
          <Text style={{ fontSize: 24, fontWeight: "700", color: "#111827" }}>
            Sale Complete!
          </Text>
          <Text style={{ fontSize: 16, color: "#6B7280", marginTop: 4 }}>
            {date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}{" "}
            at{" "}
            {date.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>

        {/* Receipt Card */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: 20,
            marginBottom: 20,
          }}
        >
          {/* Items */}
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#111827",
              marginBottom: 12,
            }}
          >
            Items Sold
          </Text>
          <View style={{ gap: 12, marginBottom: 16 }}>
            {items.map((item, index) => (
              <View
                key={index}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingBottom: 12,
                  borderBottomWidth: index < items.length - 1 ? 1 : 0,
                  borderColor: "#F3F4F6",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: "#111827",
                      marginBottom: 2,
                    }}
                  >
                    {item.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#6B7280" }}>
                    ₦{parseFloat(item.price).toLocaleString()} × {item.quantity}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#111827",
                  }}
                >
                  ₦{(parseFloat(item.price) * item.quantity).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>

          {/* Total */}
          <View
            style={{
              paddingTop: 16,
              borderTopWidth: 2,
              borderColor: "#E5E7EB",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>
              Total
            </Text>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "700",
                color: "#10B981",
              }}
            >
              ₦{total.toLocaleString()}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View
        style={{
          position: "absolute",
          bottom: insets.bottom,
          left: 0,
          right: 0,
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderColor: "#E5E7EB",
          padding: 20,
        }}
      >
        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/pos")}
            style={{
              flex: 1,
              backgroundColor: "#10B981",
              borderRadius: 8,
              paddingVertical: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <ShoppingCart size={20} color="#fff" />
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>
              New Sale
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/history")}
            style={{
              flex: 1,
              backgroundColor: "#3B82F6",
              borderRadius: 8,
              paddingVertical: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <History size={20} color="#fff" />
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>
              View History
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
