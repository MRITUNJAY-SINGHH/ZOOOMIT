import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, TextInput, StyleSheet, View, LogBox } from 'react-native';

LogBox.ignoreAllLogs(true);
import { useFonts } from 'expo-font';
import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black
} from '@expo-google-fonts/inter';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notificationService';
import { colors } from '../constants/theme';

// Make Inter the default font for all Text and TextInput components
const patchDefaultFont = (Component) => {
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

patchDefaultFont(Text);
patchDefaultFont(TextInput);

// SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 30,
      refetchOnWindowFocus: true
    }
  }
});

function NavigationManager() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Listen for push notifications when opened
  useEffect(() => {
    const subscription = notificationService.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      const orderId = data?.orderId;
      if (orderId) {
        router.push(`/order/${orderId}`);
      } else if (data?.ticketId) {
        router.push('/support-requests');
      } else if (data?.settlementId) {
        router.push('/cash-collection');
      }
    });

    notificationService.getLastNotificationResponseAsync().then((response) => {
      const data = response?.notification?.request?.content?.data;
      const orderId = data?.orderId;
      if (orderId) {
        router.push(`/order/${orderId}`);
      } else if (data?.ticketId) {
        router.push('/support-requests');
      } else if (data?.settlementId) {
        router.push('/cash-collection');
      }
    });

    return () => subscription.remove();
  }, [router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="order/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="cash-collection" options={{ headerShown: false }} />
      <Stack.Screen name="support-requests" options={{ headerShown: false }} />
      <Stack.Screen name="personal-info" options={{ headerShown: false }} />
      <Stack.Screen name="notification-settings" options={{ headerShown: false }} />
      <Stack.Screen name="help-support" options={{ headerShown: false }} />
      <Stack.Screen name="about" options={{ headerShown: false }} />
      <Stack.Screen name="privacy-policy" options={{ headerShown: false }} />
      <Stack.Screen name="terms-conditions" options={{ headerShown: false }} />
      <Stack.Screen name="feedback" options={{ headerShown: false }} />
      <Stack.Screen name="help-topic" options={{ headerShown: false }} />
      <Stack.Screen name="contact-support" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
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

  const [forceReady, setForceReady] = React.useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setForceReady(true);
      SplashScreen.hideAsync().catch(() => {});
    }, 1500);

    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }

    return () => clearTimeout(timer);
  }, [fontsLoaded, fontError]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="dark" backgroundColor={colors.surface} />
          <NavigationManager />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
