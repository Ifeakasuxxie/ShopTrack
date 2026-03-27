import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Search,
  Package,
  TrendingUp,
  TrendingDown,
  Plus,
} from "lucide-react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function InventoryScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [restockModal, setRestockModal] = useState(null);
  const [restockQuantity, setRestockQuantity] = useState("");

  const categories = [
    "All",
    "Uncategorized",
    "Electronics",
    "Food",
    "Clothing",
    "Other",
  ];

  // Fetch products
  const { data: productsData } = useQuery({
    queryKey: ["products", searchQuery],
    queryFn: async () => {
      const token = await AsyncStorage.getItem("auth_token");
      const url = searchQuery
        ? `/api/products?search=${encodeURIComponent(searchQuery)}`
        : "/api/products";
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

  // Restock mutation
  const restockMutation = useMutation({
    mutationFn: async ({ productId, quantity }) => {
      const token = await AsyncStorage.getItem("auth_token");
      const response = await fetch(`/api/products/${productId}/restock`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity: parseInt(quantity) }),
      });
      if (!response.ok) throw new Error("Failed to restock");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setRestockModal(null);
      setRestockQuantity("");
      Alert.alert("Success", "Product restocked successfully");
    },
    onError: () => {
      Alert.alert("Error", "Failed to restock product");
    },
  });

  const products = productsData?.products || [];

  // Filter by category
  const filteredProducts = products.filter(
    (product) =>
      selectedCategory === "All" || product.category === selectedCategory,
  );

  const totalValue = filteredProducts.reduce(
    (sum, p) => sum + parseFloat(p.cost_price) * p.stock_quantity,
    0,
  );

  const totalProfit = filteredProducts.reduce(
    (sum, p) =>
      sum +
      (parseFloat(p.selling_price) - parseFloat(p.cost_price)) *
        p.stock_quantity,
    0,
  );

  const handleRestock = () => {
    if (!restockQuantity || parseInt(restockQuantity) <= 0) {
      Alert.alert("Invalid Quantity", "Please enter a valid quantity");
      return;
    }
    restockMutation.mutate({
      productId: restockModal.id,
      quantity: restockQuantity,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          backgroundColor: "#3B82F6",
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
          Inventory
        </Text>

        {/* Stats */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: 8,
              padding: 12,
            }}
          >
            <Text style={{ fontSize: 12, color: "#E0E7FF", marginBottom: 4 }}>
              Total Items
            </Text>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#fff" }}>
              {filteredProducts.reduce((sum, p) => sum + p.stock_quantity, 0)}
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
            <Text style={{ fontSize: 12, color: "#E0E7FF", marginBottom: 4 }}>
              Total Value
            </Text>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#fff" }}>
              ₦{totalValue.toLocaleString()}
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
            <Text style={{ fontSize: 12, color: "#E0E7FF", marginBottom: 4 }}>
              Profit Potential
            </Text>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#fff" }}>
              ₦{totalProfit.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 8,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
          }}
        >
          <Search size={20} color="#6B7280" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search inventory..."
            style={{
              flex: 1,
              paddingVertical: 12,
              paddingHorizontal: 8,
              fontSize: 16,
            }}
          />
        </View>
      </View>

      {/* Category Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingVertical: 12,
          gap: 8,
        }}
        style={{ flexGrow: 0 }}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            onPress={() => setSelectedCategory(category)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor:
                selectedCategory === category ? "#3B82F6" : "#E5E7EB",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: selectedCategory === category ? "#fff" : "#6B7280",
              }}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 20,
        }}
      >
        {filteredProducts.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Package size={48} color="#D1D5DB" />
            <Text style={{ fontSize: 16, color: "#6B7280", marginTop: 12 }}>
              No products found
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/add-product")}
              style={{
                marginTop: 16,
                backgroundColor: "#3B82F6",
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Plus size={20} color="#fff" />
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>
                Add Product
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {filteredProducts.map((product) => {
              const profit =
                parseFloat(product.selling_price) -
                parseFloat(product.cost_price);
              const margin = (profit / parseFloat(product.selling_price)) * 100;
              const isLowStock = product.stock_quantity < 10;

              return (
                <View
                  key={product.id}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 8,
                    padding: 16,
                    borderLeftWidth: 4,
                    borderLeftColor: isLowStock ? "#EF4444" : "#10B981",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 8,
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
                        {product.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#6B7280",
                          marginBottom: 4,
                        }}
                      >
                        {product.barcode || "No barcode"} • {product.category}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setRestockModal(product)}
                      style={{
                        backgroundColor: "#3B82F6",
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: "#fff",
                        }}
                      >
                        Restock
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      paddingTop: 12,
                      borderTopWidth: 1,
                      borderColor: "#F3F4F6",
                    }}
                  >
                    <View>
                      <Text style={{ fontSize: 12, color: "#6B7280" }}>
                        Stock
                      </Text>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: isLowStock ? "#EF4444" : "#111827",
                        }}
                      >
                        {product.stock_quantity}
                      </Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 12, color: "#6B7280" }}>
                        Cost
                      </Text>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: "#111827",
                        }}
                      >
                        ₦{parseFloat(product.cost_price).toLocaleString()}
                      </Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 12, color: "#6B7280" }}>
                        Price
                      </Text>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: "#111827",
                        }}
                      >
                        ₦{parseFloat(product.selling_price).toLocaleString()}
                      </Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 12, color: "#6B7280" }}>
                        Profit
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {profit > 0 ? (
                          <TrendingUp size={14} color="#10B981" />
                        ) : (
                          <TrendingDown size={14} color="#EF4444" />
                        )}
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "600",
                            color: profit > 0 ? "#10B981" : "#EF4444",
                          }}
                        >
                          {margin.toFixed(0)}%
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Restock Modal */}
      <Modal
        visible={restockModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setRestockModal(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 24,
              width: "100%",
              maxWidth: 400,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: "#111827",
                marginBottom: 16,
              }}
            >
              Restock {restockModal?.name}
            </Text>
            <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 12 }}>
              Current Stock: {restockModal?.stock_quantity}
            </Text>
            <TextInput
              value={restockQuantity}
              onChangeText={setRestockQuantity}
              placeholder="Enter quantity to add"
              keyboardType="numeric"
              style={{
                borderWidth: 1,
                borderColor: "#D1D5DB",
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 12,
                fontSize: 16,
                marginBottom: 16,
              }}
            />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setRestockModal(null);
                  setRestockQuantity("");
                }}
                style={{
                  flex: 1,
                  backgroundColor: "#E5E7EB",
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "#6B7280" }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRestock}
                disabled={restockMutation.isPending}
                style={{
                  flex: 1,
                  backgroundColor: "#3B82F6",
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}
                >
                  {restockMutation.isPending ? "Adding..." : "Add Stock"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
