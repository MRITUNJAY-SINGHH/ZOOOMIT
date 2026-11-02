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

import { 
  useFonts,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black
} from '@expo-google-fonts/inter';
import { Text, TextInput, StyleSheet, View, Image } from 'react-native';

// Make Inter the default font for every Text/TextInput. Explicit fontFamily in a style still wins.
const withInterDefault = (Component) => {
  if (!Component || typeof Component.render !== 'function' || Component.__interPatched) return;
  const original = Component.render;
  Component.render = function render(...args) {
    const element = original.apply(this, args);
    const flat = StyleSheet.flatten(element?.props?.style) || {};
    if (flat.fontFamily) return element;
    const isBold = ['600', '700', '800', '900', 'bold'].includes(String(flat.fontWeight));
    const isMedium = ['500'].includes(String(flat.fontWeight));
    const font = isBold ? 'Inter_700Bold' : isMedium ? 'Inter_500Medium' : 'Inter_400Regular';
    return React.cloneElement(element, { 
      style: { fontFamily: font, ...flat } 
    });
  };
  Component.__interPatched = true;
};
withInterDefault(Text);
withInterDefault(TextInput);

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
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
    // Add Load the actual bundled Gilroy font files
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
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
        <Image
          source={require('../../assets/images/logo.jpg')}
          style={{ width: 220, height: 220 }}
          resizeMode="contain"
        />
      </View>
    );
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
