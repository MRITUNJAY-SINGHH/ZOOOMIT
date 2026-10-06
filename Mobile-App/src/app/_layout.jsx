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
import { Text, TextInput, StyleSheet } from 'react-native';

// Make Gilroy the default font for every Text/TextInput. Explicit fontFamily in a style still wins.
const withGilroyDefault = (Component) => {
  if (!Component || typeof Component.render !== 'function' || Component.__gilroyPatched) return;
  const original = Component.render;
  Component.render = function render(...args) {
    const element = original.apply(this, args);
    const flat = StyleSheet.flatten(element?.props?.style) || {};
    if (flat.fontFamily) return element;
    const bold = ['600', '700', '800', '900', 'bold'].includes(String(flat.fontWeight));
    return React.cloneElement(element, { style: [{ fontFamily: bold ? 'GilroyBold' : 'GilroyRegular' }, element.props.style] });
  };
  Component.__gilroyPatched = true;
};
withGilroyDefault(Text);
withGilroyDefault(TextInput);

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
                  options={{ headerShown: false }} 
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
