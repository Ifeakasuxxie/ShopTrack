import { View, Text, TouchableOpacity, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Check, AlertCircle } from "lucide-react-native";
import { router } from "expo-router";

export default function SubscriptionWall() {
  const insets = useSafeAreaInsets();

  const handleSubscribe = () => {
    // Open external payment link or contact page
    Linking.openURL("https://yourwebsite.com/subscribe");
  };

  const handleContactSupport = () => {
    Linking.openURL("mailto:support@yourshop.com?subject=Subscription Help");
  };

  const features = [
    "Unlimited product inventory",
    "Point of Sale system",
    "Sales tracking and analytics",
    "Expense management",
    "7-day revenue charts",
    "Multi-device access",
    "Data backup and security",
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <StatusBar style="dark" />

      <View
        style={{
          flex: 1,
          paddingTop: insets.top + 40,
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 20,
        }}
      >
        {/* Alert Icon */}
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: "#FEF3C7",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <AlertCircle size={40} color="#F59E0B" />
          </View>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "700",
              color: "#111827",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Trial Expired
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: "#6B7280",
              textAlign: "center",
              lineHeight: 24,
            }}
          >
            Your 7-day trial has ended. Subscribe to continue using ShopTrack.
          </Text>
        </View>

        {/* Pricing */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
            borderWidth: 2,
            borderColor: "#10B981",
          }}
        >
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <Text style={{ fontSize: 16, color: "#6B7280", marginBottom: 4 }}>
              Monthly Subscription
            </Text>
            <View style={{ flexDirection: "row", alignItems: "baseline" }}>
              <Text
                style={{
                  fontSize: 48,
                  fontWeight: "700",
                  color: "#10B981",
                }}
              >
                ₦2,500
              </Text>
              <Text style={{ fontSize: 18, color: "#6B7280", marginLeft: 4 }}>
                /month
              </Text>
            </View>
          </View>

          {/* Features List */}
          <View style={{ gap: 12 }}>
            {features.map((feature, index) => (
              <View
                key={index}
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: "#D1FAE5",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Check size={16} color="#10B981" />
                </View>
                <Text style={{ fontSize: 14, color: "#374151", flex: 1 }}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA Buttons */}
        <TouchableOpacity
          onPress={handleSubscribe}
          style={{
            backgroundColor: "#10B981",
            borderRadius: 12,
            padding: 18,
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "600", color: "#fff" }}>
            Subscribe Now
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleContactSupport}
          style={{
            backgroundColor: "#E5E7EB",
            borderRadius: 12,
            padding: 18,
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#6B7280" }}>
            Contact Support
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          style={{ alignItems: "center", padding: 12 }}
        >
          <Text style={{ fontSize: 14, color: "#6B7280" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
