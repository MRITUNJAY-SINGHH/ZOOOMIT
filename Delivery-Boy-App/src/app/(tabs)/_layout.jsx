import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Home, ShoppingBag, Wallet, User } from 'lucide-react-native';
import { colors, typography } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { View, ActivityIndicator } from 'react-native';

export default function TabsLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primaryDark} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
          shadowRadius: 0,
          shadowOffset: { width: 0, height: 0 }
        },
        tabBarLabelStyle: {
          fontFamily: typography.family.bold,
          fontSize: 11
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            focused ? (
              <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#FFC928', alignItems: 'center', justifyContent: 'center' }}>
                <Home size={18} color="#111827" strokeWidth={2.4} />
              </View>
            ) : (
              <Home size={20} color="#94A3B8" strokeWidth={1.8} />
            )
          )
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ focused }) => (
            focused ? (
              <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#FFC928', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBag size={18} color="#111827" strokeWidth={2.4} />
              </View>
            ) : (
              <ShoppingBag size={20} color="#94A3B8" strokeWidth={1.8} />
            )
          )
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: 'Earnings',
          tabBarIcon: ({ focused }) => (
            focused ? (
              <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#FFC928', alignItems: 'center', justifyContent: 'center' }}>
                <Wallet size={18} color="#111827" strokeWidth={2.4} />
              </View>
            ) : (
              <Wallet size={20} color="#94A3B8" strokeWidth={1.8} />
            )
          )
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            focused ? (
              <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#FFC928', alignItems: 'center', justifyContent: 'center' }}>
                <User size={18} color="#111827" strokeWidth={2.4} />
              </View>
            ) : (
              <User size={20} color="#94A3B8" strokeWidth={1.8} />
            )
          )
        }}
      />
    </Tabs>
  );
}
