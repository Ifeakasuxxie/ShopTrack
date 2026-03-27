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
import { useState, useRef } from "react";
import {
  Search,
  Scan,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Flashlight,
  X,
} from "lucide-react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function POSScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const lastScannedRef = useRef({ barcode: null, timestamp: 0 });

  // Fetch products with search
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

  const products = productsData?.products || [];
  const displayProducts = searchQuery ? products : products;

  // Checkout mutation
  const checkoutMutation = useMutation({
    mutationFn: async (items) => {
      const token = await AsyncStorage.getItem("auth_token");
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items }),
      });
      if (!response.ok) throw new Error("Failed to complete sale");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });

      const total = cart.reduce(
        (sum, item) => sum + item.selling_price * item.quantity,
        0,
      );

      const items = cart.map((item) => ({
        name: item.name,
        price: item.selling_price,
        quantity: item.quantity,
      }));

      // Navigate to receipt screen with sale data
      router.push({
        pathname: "/receipt",
        params: {
          total: total.toString(),
          items: JSON.stringify(items),
          date: new Date().toISOString(),
        },
      });

      // Clear cart
      setCart([]);
    },
    onError: () => {
      Alert.alert("Error", "Failed to complete sale");
    },
  });

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stock_quantity) {
        Alert.alert("Out of Stock", "Not enough stock available");
        return;
      }
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      if (product.stock_quantity === 0) {
        Alert.alert("Out of Stock", "This product is out of stock");
        return;
      }
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId, delta) => {
    const item = cart.find((i) => i.id === productId);
    if (!item) return;

    const newQuantity = item.quantity + delta;

    if (newQuantity <= 0) {
      setCart(cart.filter((i) => i.id !== productId));
      return;
    }

    // Check stock from the cart item itself
    if (newQuantity > item.stock_quantity) {
      Alert.alert("Out of Stock", "Not enough stock available");
      return;
    }

    setCart(
      cart.map((i) =>
        i.id === productId ? { ...i, quantity: newQuantity } : i,
      ),
    );
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      Alert.alert("Empty Cart", "Please add items to cart first");
      return;
    }

    const items = cart.map((item) => ({
      product_id: item.id,
      quantity: item.quantity,
      price: parseFloat(item.selling_price),
    }));

    checkoutMutation.mutate(items);
  };

  const handleBarcodeScanned = async ({ data }) => {
    // Prevent duplicate scans within 2 seconds
    const now = Date.now();
    if (
      lastScannedRef.current.barcode === data &&
      now - lastScannedRef.current.timestamp < 2000
    ) {
      return;
    }

    lastScannedRef.current = { barcode: data, timestamp: now };
    setShowScanner(false);
    setTorchOn(false);

    try {
      const token = await AsyncStorage.getItem("auth_token");
      const response = await fetch(`/api/products/barcode/${data}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        Alert.alert(
          "Product Not Found",
          `Barcode ${data} is not in the system.`,
          [
            { text: "Try Again", style: "cancel" },
            {
              text: "Add as New Product",
              onPress: () => {
                router.push({
                  pathname: "/(tabs)/add-product",
                  params: { barcode: data },
                });
              },
            },
          ],
        );
        return;
      }
      const result = await response.json();
      addToCart(result.product);
    } catch (error) {
      Alert.alert("Error", "Failed to find product");
    }
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          "Permission Denied",
          "Camera permission is required to scan barcodes",
        );
        return;
      }
    }
    setShowScanner(true);
  };

  const total = cart.reduce(
    (sum, item) => sum + item.selling_price * item.quantity,
    0,
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          backgroundColor: "#10B981",
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
          New Sale
        </Text>

        {/* Search Bar */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View
            style={{
              flex: 1,
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
              placeholder="Search products..."
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 8,
                fontSize: 16,
              }}
            />
          </View>
          <TouchableOpacity
            onPress={openScanner}
            style={{
              backgroundColor: "#059669",
              borderRadius: 8,
              width: 48,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Scan size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: cart.length > 0 ? 200 : 20 }}
      >
        {/* Products List - show all products */}
        <View style={{ padding: 20 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#111827",
              marginBottom: 12,
            }}
          >
            {searchQuery ? "Search Results" : "All Products"}
          </Text>
          {displayProducts.length === 0 ? (
            <Text
              style={{
                color: "#6B7280",
                textAlign: "center",
                paddingVertical: 20,
              }}
            >
              {searchQuery ? "No products found" : "No products available"}
            </Text>
          ) : (
            <View style={{ gap: 8 }}>
              {displayProducts.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  onPress={() => addToCart(product)}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 8,
                    padding: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
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
                    <Text style={{ fontSize: 14, color: "#6B7280" }}>
                      ₦{parseFloat(product.selling_price).toLocaleString()} •
                      Stock: {product.stock_quantity}
                    </Text>
                  </View>
                  <Plus size={20} color="#10B981" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Cart Summary - always visible when cart has items */}
      {cart.length > 0 && (
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
          <View style={{ maxHeight: 120 }}>
            <ScrollView>
              {cart.map((item) => (
                <View
                  key={item.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 12,
                    gap: 8,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: "#111827",
                      }}
                    >
                      {item.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#6B7280" }}>
                      ₦{parseFloat(item.selling_price).toLocaleString()} ×{" "}
                      {item.quantity}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => updateQuantity(item.id, -1)}
                      style={{ padding: 4 }}
                    >
                      <Minus size={16} color="#6B7280" />
                    </TouchableOpacity>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        minWidth: 20,
                        textAlign: "center",
                      }}
                    >
                      {item.quantity}
                    </Text>
                    <TouchableOpacity
                      onPress={() => updateQuantity(item.id, 1)}
                      style={{ padding: 4 }}
                    >
                      <Plus size={16} color="#10B981" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => removeFromCart(item.id)}
                      style={{ padding: 4, marginLeft: 4 }}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 12,
              paddingTop: 12,
              borderTopWidth: 1,
              borderColor: "#E5E7EB",
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#111827" }}>
              Total: ₦{total.toLocaleString()}
            </Text>
            <TouchableOpacity
              onPress={handleCheckout}
              disabled={checkoutMutation.isPending}
              style={{
                backgroundColor: "#10B981",
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <ShoppingCart size={20} color="#fff" />
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>
                {checkoutMutation.isPending ? "Processing..." : "Checkout"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Barcode Scanner Modal with torch and targeting overlay */}
      <Modal visible={showScanner} animationType="slide">
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <CameraView
            ref={cameraRef}
            style={{ flex: 1 }}
            facing="back"
            enableTorch={torchOn}
            onBarcodeScanned={handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: [
                "qr",
                "ean13",
                "ean8",
                "upc_a",
                "upc_e",
                "code128",
                "code39",
              ],
            }}
          >
            {/* Targeting Rectangle Overlay */}
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 250,
                  height: 150,
                  borderWidth: 3,
                  borderColor: "#10B981",
                  borderRadius: 12,
                  backgroundColor: "transparent",
                }}
              />
              <Text
                style={{
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: "600",
                  marginTop: 20,
                  textAlign: "center",
                }}
              >
                Point camera at barcode or QR code
              </Text>
            </View>

            {/* Controls */}
            <View
              style={{
                position: "absolute",
                top: insets.top + 20,
                left: 20,
                right: 20,
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <TouchableOpacity
                onPress={() => setTorchOn(!torchOn)}
                style={{
                  backgroundColor: torchOn
                    ? "rgba(16, 185, 129, 0.8)"
                    : "rgba(0, 0, 0, 0.6)",
                  borderRadius: 20,
                  padding: 12,
                }}
              >
                <Flashlight size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowScanner(false);
                  setTorchOn(false);
                }}
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  borderRadius: 20,
                  padding: 12,
                }}
              >
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      </Modal>
    </View>
  );
}
