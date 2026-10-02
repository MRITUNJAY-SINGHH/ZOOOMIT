import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import { WishlistProvider } from '../context/WishlistContext';
import { CartProvider } from '../context/CartContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { colors, typography } from '../constants/theme';

import { useFonts } from 'expo-font';

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
    GilroyLight: require('../../assets/fonts/Gilroy-Light.ttf'),
    GilroyRegular: require('../../assets/fonts/Gilroy-Regular.ttf'),
    GilroyMedium: require('../../assets/fonts/Gilroy-Medium.ttf'),
    GilroyBold: require('../../assets/fonts/Gilroy-Bold.ttf'),
    GilroyHeavy: require('../../assets/fonts/Gilroy-Heavy.ttf'),
    'Gilroy-Light': require('../../assets/fonts/Gilroy-Light.ttf'),
    'Gilroy-Regular': require('../../assets/fonts/Gilroy-Regular.ttf'),
    'Gilroy-Medium': require('../../assets/fonts/Gilroy-Medium.ttf'),
    'Gilroy-Bold': require('../../assets/fonts/Gilroy-Bold.ttf'),
    'Gilroy-Heavy': require('../../assets/fonts/Gilroy-Heavy.ttf')
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
            <WishlistProvider>
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
                    options={{ headerShown: false }} 
                  />
                  <Stack.Screen 
                    name="category/[id]" 
                    options={{ headerShown: false }} 
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
                  name="wishlist" 
                  options={{ headerShown: false }} 
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
            </WishlistProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
