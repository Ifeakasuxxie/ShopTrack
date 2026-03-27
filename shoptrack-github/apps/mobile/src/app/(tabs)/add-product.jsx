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
import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Scan,
  Package,
  DollarSign,
  Hash,
  Flashlight,
  X,
} from "lucide-react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import AsyncStorage from "@react-native-async-storage/async-storage";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";

export default function AddProductScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams();
  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState(params.barcode || "");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [category, setCategory] = useState("Uncategorized");
  const [showScanner, setShowScanner] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const lastScannedRef = useRef({ barcode: null, timestamp: 0 });

  const categories = [
    "Uncategorized",
    "Electronics",
    "Food",
    "Clothing",
    "Other",
  ];

  // Auto-fetch product details from Open Food Facts when barcode changes
  useEffect(() => {
    if (barcode && barcode.length >= 8) {
      fetchProductDetails(barcode);
    }
  }, [barcode]);

  const fetchProductDetails = async (barcodeValue) => {
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcodeValue}.json`,
      );
      const data = await response.json();

      if (data.status === 1 && data.product) {
        const product = data.product;
        if (product.product_name && !name) {
          setName(product.product_name);
        }
        if (product.categories && !category) {
          const productCategory = product.categories.toLowerCase();
          if (
            productCategory.includes("food") ||
            productCategory.includes("beverage")
          ) {
            setCategory("Food");
          }
        }
      }
    } catch (error) {
      console.log("Could not fetch product details from Open Food Facts");
    }
  };

  const createMutation = useMutation({
    mutationFn: async (productData) => {
      const token = await AsyncStorage.getItem("auth_token");
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create product");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      Alert.alert("Success", "Product added successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert("Missing Field", "Please enter product name");
      return;
    }
    if (!costPrice || parseFloat(costPrice) <= 0) {
      Alert.alert("Invalid Price", "Please enter valid cost price");
      return;
    }
    if (!sellingPrice || parseFloat(sellingPrice) <= 0) {
      Alert.alert("Invalid Price", "Please enter valid selling price");
      return;
    }
    if (!stockQuantity || parseInt(stockQuantity) < 0) {
      Alert.alert("Invalid Quantity", "Please enter valid stock quantity");
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      barcode: barcode.trim() || null,
      cost_price: parseFloat(costPrice),
      selling_price: parseFloat(sellingPrice),
      stock_quantity: parseInt(stockQuantity),
      category,
    });
  };

  const handleBarcodeScanned = ({ data }) => {
    const now = Date.now();
    if (
      lastScannedRef.current.barcode === data &&
      now - lastScannedRef.current.timestamp < 2000
    ) {
      return;
    }

    lastScannedRef.current = { barcode: data, timestamp: now };
    setBarcode(data);
    setShowScanner(false);
    setTorchOn(false);

    // Auto-fetch product details
    fetchProductDetails(data);
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

  return (
    <KeyboardAvoidingAnimatedView
      style={{ flex: 1, backgroundColor: "#F9FAFB" }}
      behavior="padding"
    >
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          backgroundColor: "#8B5CF6",
          paddingTop: insets.top + 12,
          paddingBottom: 16,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#fff" }}>
          Add New Product
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 20,
        }}
      >
        {/* Barcode */}
        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#111827",
              marginBottom: 8,
            }}
          >
            Barcode / QR Code (Optional)
          </Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <TextInput
                value={barcode}
                onChangeText={setBarcode}
                placeholder="Scan or enter barcode"
                style={{
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#D1D5DB",
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  fontSize: 16,
                }}
              />
            </View>
            <TouchableOpacity
              onPress={openScanner}
              style={{
                backgroundColor: "#8B5CF6",
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

        {/* Product Name */}
        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#111827",
              marginBottom: 8,
            }}
          >
            Product Name *
          </Text>
          <View
            style={{
              backgroundColor: "#fff",
              borderWidth: 1,
              borderColor: "#D1D5DB",
              borderRadius: 8,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 12,
            }}
          >
            <Package size={20} color="#6B7280" />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Coca Cola 500ml"
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 8,
                fontSize: 16,
              }}
            />
          </View>
        </View>

        {/* Category */}
        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#111827",
              marginBottom: 8,
            }}
          >
            Category
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
          >
            <View style={{ flexDirection: "row", gap: 8 }}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 8,
                    backgroundColor: category === cat ? "#8B5CF6" : "#E5E7EB",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: category === cat ? "#fff" : "#6B7280",
                    }}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Cost Price */}
        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#111827",
              marginBottom: 8,
            }}
          >
            Cost Price (₦) *
          </Text>
          <View
            style={{
              backgroundColor: "#fff",
              borderWidth: 1,
              borderColor: "#D1D5DB",
              borderRadius: 8,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 12,
            }}
          >
            <DollarSign size={20} color="#6B7280" />
            <TextInput
              value={costPrice}
              onChangeText={setCostPrice}
              placeholder="How much you paid"
              keyboardType="numeric"
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 8,
                fontSize: 16,
              }}
            />
          </View>
        </View>

        {/* Selling Price */}
        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#111827",
              marginBottom: 8,
            }}
          >
            Selling Price (₦) *
          </Text>
          <View
            style={{
              backgroundColor: "#fff",
              borderWidth: 1,
              borderColor: "#D1D5DB",
              borderRadius: 8,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 12,
            }}
          >
            <DollarSign size={20} color="#6B7280" />
            <TextInput
              value={sellingPrice}
              onChangeText={setSellingPrice}
              placeholder="How much you'll sell for"
              keyboardType="numeric"
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 8,
                fontSize: 16,
              }}
            />
          </View>
        </View>

        {/* Stock Quantity */}
        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#111827",
              marginBottom: 8,
            }}
          >
            Initial Stock Quantity *
          </Text>
          <View
            style={{
              backgroundColor: "#fff",
              borderWidth: 1,
              borderColor: "#D1D5DB",
              borderRadius: 8,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 12,
            }}
          >
            <Hash size={20} color="#6B7280" />
            <TextInput
              value={stockQuantity}
              onChangeText={setStockQuantity}
              placeholder="Number of items in stock"
              keyboardType="numeric"
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 8,
                fontSize: 16,
              }}
            />
          </View>
        </View>

        {/* Profit Preview */}
        {costPrice && sellingPrice && (
          <View
            style={{
              backgroundColor:
                parseFloat(sellingPrice) > parseFloat(costPrice)
                  ? "#DCFCE7"
                  : "#FEE2E2",
              borderRadius: 8,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 4 }}>
              Profit per unit
            </Text>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "700",
                color:
                  parseFloat(sellingPrice) > parseFloat(costPrice)
                    ? "#10B981"
                    : "#EF4444",
              }}
            >
              ₦
              {(
                parseFloat(sellingPrice) - parseFloat(costPrice)
              ).toLocaleString()}
            </Text>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={createMutation.isPending}
          style={{
            backgroundColor: "#8B5CF6",
            paddingVertical: 16,
            borderRadius: 8,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>
            {createMutation.isPending ? "Adding Product..." : "Add Product"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Barcode Scanner Modal */}
      <Modal visible={showScanner} animationType="slide">
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <CameraView
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
                  borderColor: "#8B5CF6",
                  borderRadius: 12,
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
                    ? "rgba(139, 92, 246, 0.8)"
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
    </KeyboardAvoidingAnimatedView>
  );
}
