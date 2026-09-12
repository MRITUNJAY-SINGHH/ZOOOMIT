import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { colors } from '../constants/theme';

import { 
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold
} from '@expo-google-fonts/outfit';

// Keep native splash screen visible while loading resources
SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 2, // 2 minutes
      refetchOnWindowFocus: false
    }
  }
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <CartProvider>
              <StatusBar style="dark" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.background },
                  animation: 'slide_from_right'
                }}
              >
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen 
                  name="product/[id]" 
                  options={{ 
                    headerShown: true, 
                    title: 'Product Details',
                    headerTintColor: colors.textPrimary,
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: colors.surface }
                  }} 
                />
                <Stack.Screen 
                  name="checkout/index" 
                  options={{ 
                    headerShown: true, 
                    title: 'Checkout',
                    headerTintColor: colors.textPrimary,
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: colors.surface }
                  }} 
                />
                <Stack.Screen 
                  name="orders/[id]" 
                  options={{ 
                    headerShown: true, 
                    title: 'Track Order',
                    headerTintColor: colors.textPrimary,
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: colors.surface }
                  }} 
                />
                <Stack.Screen 
                  name="orders/[id]/issue" 
                  options={{ 
                    headerShown: true, 
                    title: 'Report Problem / Return',
                    headerTintColor: colors.textPrimary,
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: colors.surface }
                  }} 
                />
                <Stack.Screen 
                  name="notifications" 
                  options={{ 
                    headerShown: true, 
                    title: 'Notifications',
                    headerTintColor: colors.textPrimary,
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: colors.surface }
                  }} 
                />
                <Stack.Screen 
                  name="addresses" 
                  options={{ 
                    headerShown: true, 
                    title: 'My Addresses',
                    headerTintColor: colors.textPrimary,
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: colors.surface }
                  }} 
                />
              </Stack>
            </CartProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
