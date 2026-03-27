import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { useRouter } from "expo-router";
import {
  UserPlus,
  Mail,
  Lock,
  Building,
  ChevronRight,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("Retail Shop");
  const [isRegistered, setIsRegistered] = useState(false);
  const [country, setCountry] = useState("Nigeria");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          business_name: businessName,
          business_type: businessType,
          is_registered: isRegistered,
          country,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Error", data.error || "Failed to create account");
        setLoading(false);
        return;
      }

      // Store token
      await AsyncStorage.setItem("auth_token", data.token);
      await AsyncStorage.setItem("user", JSON.stringify(data.user));

      // Navigate to tabs
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Signup error:", error);
      Alert.alert("Error", "Failed to create account. Please try again.");
      setLoading(false);
    }
  };

  const goToStep2 = () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }
    setStep(2);
  };

  const goToStep3 = () => {
    if (!businessName || !businessType) {
      Alert.alert("Error", "Please enter business details");
      return;
    }
    setStep(3);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#F9FAFB" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="dark" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 40,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 20,
        }}
      >
        {/* Header */}
        <View style={{ marginBottom: 40 }}>
          <Text
            style={{
              fontSize: 32,
              fontWeight: "700",
              color: "#111827",
              marginBottom: 8,
            }}
          >
            Get Started
          </Text>
          <Text style={{ fontSize: 16, color: "#6B7280" }}>
            Step {step} of 3
          </Text>
        </View>

        {/* Step 1: Email & Password */}
        {step === 1 && (
          <View style={{ gap: 20 }}>
            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: 8,
                }}
              >
                Email
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 8,
                  paddingHorizontal: 12,
                }}
              >
                <Mail size={20} color="#6B7280" />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    paddingHorizontal: 8,
                    fontSize: 16,
                  }}
                />
              </View>
            </View>

            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: 8,
                }}
              >
                Password
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 8,
                  paddingHorizontal: 12,
                }}
              >
                <Lock size={20} color="#6B7280" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create a password"
                  secureTextEntry
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    paddingHorizontal: 8,
                    fontSize: 16,
                  }}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={goToStep2}
              style={{
                backgroundColor: "#10B981",
                borderRadius: 8,
                paddingVertical: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 12,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>
                Continue
              </Text>
              <ChevronRight size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Business Details */}
        {step === 2 && (
          <View style={{ gap: 20 }}>
            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: 8,
                }}
              >
                Business Name
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 8,
                  paddingHorizontal: 12,
                }}
              >
                <Building size={20} color="#6B7280" />
                <TextInput
                  value={businessName}
                  onChangeText={setBusinessName}
                  placeholder="My Shop"
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    paddingHorizontal: 8,
                    fontSize: 16,
                  }}
                />
              </View>
            </View>

            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: 8,
                }}
              >
                Business Type
              </Text>
              <View
                style={{
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 8,
                }}
              >
                <Picker
                  selectedValue={businessType}
                  onValueChange={setBusinessType}
                  style={{ height: 50 }}
                >
                  <Picker.Item label="Retail Shop" value="Retail Shop" />
                  <Picker.Item
                    label="Food/Restaurant"
                    value="Food/Restaurant"
                  />
                  <Picker.Item label="Pharmacy" value="Pharmacy" />
                  <Picker.Item label="Salon" value="Salon" />
                  <Picker.Item label="Other" value="Other" />
                </Picker>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => setStep(1)}
                style={{
                  flex: 1,
                  backgroundColor: "#fff",
                  borderWidth: 2,
                  borderColor: "#10B981",
                  borderRadius: 8,
                  paddingVertical: 16,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "#10B981" }}
                >
                  Back
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={goToStep3}
                style={{
                  flex: 1,
                  backgroundColor: "#10B981",
                  borderRadius: 8,
                  paddingVertical: 16,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}
                >
                  Continue
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 3: Registration & Country */}
        {step === 3 && (
          <View style={{ gap: 20 }}>
            <View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: 16,
                }}
              >
                Is your business registered?
              </Text>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setIsRegistered(true)}
                  style={{
                    flex: 1,
                    backgroundColor: isRegistered ? "#10B981" : "#fff",
                    borderWidth: 2,
                    borderColor: "#10B981",
                    borderRadius: 8,
                    paddingVertical: 16,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: isRegistered ? "#fff" : "#10B981",
                    }}
                  >
                    Yes
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setIsRegistered(false)}
                  style={{
                    flex: 1,
                    backgroundColor: !isRegistered ? "#10B981" : "#fff",
                    borderWidth: 2,
                    borderColor: "#10B981",
                    borderRadius: 8,
                    paddingVertical: 16,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: !isRegistered ? "#fff" : "#10B981",
                    }}
                  >
                    No
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: 8,
                }}
              >
                Country
              </Text>
              <View
                style={{
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 8,
                }}
              >
                <Picker
                  selectedValue={country}
                  onValueChange={setCountry}
                  style={{ height: 50 }}
                >
                  <Picker.Item label="Nigeria" value="Nigeria" />
                  <Picker.Item label="Other" value="Other" />
                </Picker>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
              <TouchableOpacity
                onPress={() => setStep(2)}
                style={{
                  flex: 1,
                  backgroundColor: "#fff",
                  borderWidth: 2,
                  borderColor: "#10B981",
                  borderRadius: 8,
                  paddingVertical: 16,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "#10B981" }}
                >
                  Back
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSignup}
                disabled={loading}
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
                <UserPlus size={20} color="#fff" />
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}
                >
                  {loading ? "Creating..." : "Create Account"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Already have account link */}
        {step === 1 && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 20,
            }}
          >
            <Text style={{ fontSize: 14, color: "#6B7280" }}>
              Already have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/login")}>
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: "#10B981" }}
              >
                Log In
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
