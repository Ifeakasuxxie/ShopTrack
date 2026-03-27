import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Wallet } from "lucide-react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ExpensesScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Other");

  const categories = ["Restock", "Utilities", "Transport", "Salary", "Other"];

  const { data: expensesData } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const token = await AsyncStorage.getItem("auth_token");
      const response = await fetch("/api/expenses", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch expenses");
      return response.json();
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (expenseData) => {
      const token = await AsyncStorage.getItem("auth_token");
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(expenseData),
      });
      if (!response.ok) throw new Error("Failed to create expense");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["expenses"]);
      setDescription("");
      setAmount("");
      setCategory("Other");
      Alert.alert("Success", "Expense added!");
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const expenses = expensesData?.expenses || [];

  // Calculate totals
  const today = new Date().toDateString();
  const todayTotal = expenses
    .filter((e) => new Date(e.created_at).toDateString() === today)
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const allTimeTotal = expenses.reduce(
    (sum, e) => sum + parseFloat(e.amount),
    0,
  );

  const handleSubmit = () => {
    if (!description || !amount) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    createExpenseMutation.mutate({
      description,
      amount: parseFloat(amount),
      category,
    });
  };

  const getCategoryColor = (cat) => {
    const colors = {
      Restock: "#3B82F6",
      Utilities: "#EF4444",
      Transport: "#F59E0B",
      Salary: "#10B981",
      Other: "#6B7280",
    };
    return colors[cat] || "#6B7280";
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <StatusBar style="light" />

      {/* Header */}
      <View
        style={{
          backgroundColor: "#8B5CF6",
          paddingTop: insets.top + 20,
          paddingBottom: 24,
          paddingHorizontal: 20,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <Wallet size={28} color="#fff" />
          <Text style={{ fontSize: 24, fontWeight: "700", color: "#fff" }}>
            Expenses
          </Text>
        </View>

        {/* Totals */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <Text style={{ fontSize: 12, color: "#EDE9FE", marginBottom: 4 }}>
              Today's Total
            </Text>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#fff" }}>
              ₦{todayTotal.toLocaleString()}
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <Text style={{ fontSize: 12, color: "#EDE9FE", marginBottom: 4 }}>
              All-Time Total
            </Text>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#fff" }}>
              ₦{allTimeTotal.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 80,
        }}
      >
        {/* Add Expense Form */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: "#111827",
              marginBottom: 16,
            }}
          >
            Add Expense
          </Text>

          {/* Description */}
          <View style={{ marginBottom: 12 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: "#374151",
                marginBottom: 6,
              }}
            >
              Description
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="What was this expense for?"
              style={{
                backgroundColor: "#F9FAFB",
                borderRadius: 8,
                padding: 12,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                fontSize: 16,
              }}
            />
          </View>

          {/* Amount */}
          <View style={{ marginBottom: 12 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: "#374151",
                marginBottom: 6,
              }}
            >
              Amount (₦)
            </Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              style={{
                backgroundColor: "#F9FAFB",
                borderRadius: 8,
                padding: 12,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                fontSize: 16,
              }}
            />
          </View>

          {/* Category Picker */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: "#374151",
                marginBottom: 6,
              }}
            >
              Category
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -4 }}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={{
                    backgroundColor:
                      category === cat ? getCategoryColor(cat) : "#F3F4F6",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    marginHorizontal: 4,
                  }}
                >
                  <Text
                    style={{
                      color: category === cat ? "#fff" : "#6B7280",
                      fontWeight: category === cat ? "600" : "400",
                    }}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={createExpenseMutation.isPending}
            style={{
              backgroundColor: "#8B5CF6",
              borderRadius: 8,
              padding: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>
              {createExpenseMutation.isPending ? "Adding..." : "Add Expense"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Expenses List */}
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: "#111827",
            marginBottom: 12,
          }}
        >
          Recent Expenses
        </Text>

        {expenses.length === 0 ? (
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 32,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#9CA3AF", fontSize: 16 }}>
              No expenses yet
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {expenses.map((expense) => (
              <View
                key={expense.id}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: "#111827",
                      marginBottom: 4,
                    }}
                  >
                    {expense.description}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: `${getCategoryColor(expense.category)}15`,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: getCategoryColor(expense.category),
                          fontWeight: "500",
                        }}
                      >
                        {expense.category}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: "#6B7280" }}>
                      {new Date(expense.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <Text
                  style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}
                >
                  ₦{parseFloat(expense.amount).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
