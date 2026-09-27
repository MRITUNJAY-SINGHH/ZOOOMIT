import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { colors, typography } from '../constants/theme';

import { 
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold
} from '@expo-google-fonts/outfit';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 2,
      refetchOnWindowFocus: false
    }
  }
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold
  });

  useEffect(() => {
    if (fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontError]);

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
                    headerTitleStyle: { fontFamily: typography.family.bold },
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
                    headerTitleStyle: { fontFamily: typography.family.bold },
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: colors.surface }
                  }} 
                />
                <Stack.Screen 
                  name="orders/[id]" 
                  options={{ headerShown: false }} 
                />
                <Stack.Screen 
                  name="orders/issue" 
                  options={{ 
                    headerShown: true, 
                    title: 'Report Problem / Return',
                    headerTintColor: colors.textPrimary,
                    headerTitleStyle: { fontFamily: typography.family.bold },
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: colors.surface }
                  }} 
                />
                <Stack.Screen 
                  name="orders/support" 
                  options={{ headerShown: false }} 
                />
                <Stack.Screen 
                  name="notifications" 
                  options={{ 
                    headerShown: true, 
                    title: 'Notifications',
                    headerTintColor: colors.textPrimary,
                    headerTitleStyle: { fontFamily: typography.family.bold },
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
                    headerTitleStyle: { fontFamily: typography.family.bold },
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
