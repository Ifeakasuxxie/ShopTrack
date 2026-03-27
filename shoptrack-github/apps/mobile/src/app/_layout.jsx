import { useAuth } from "@/utils/auth/useAuth";
import { Stack, router, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const { initiate, isReady } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    initiate();
  }, [initiate]);

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
      checkSubscription();
    }
  }, [isReady]);

  const checkSubscription = async () => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch("/api/subscription/status", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();

        // Redirect to subscription wall if trial expired and not subscribed
        if (data.trial_expired && !data.is_subscribed) {
          const currentPath = segments.join("/");
          if (
            currentPath !== "subscription-wall" &&
            currentPath !== "login" &&
            currentPath !== "signup"
          ) {
            router.replace("/subscription-wall");
          }
        }
      }
    } catch (error) {
      console.error("Failed to check subscription:", error);
    }
  };

  if (!isReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="subscription-wall" />
          <Stack.Screen name="receipt" />
        </Stack>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
