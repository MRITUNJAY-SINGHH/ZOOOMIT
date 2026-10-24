import React, { useCallback } from 'react';
import { Tabs, Redirect } from 'expo-router';
import { colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import PartnerBottomBar from '../../components/PartnerBottomBar';

export default function TabsLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  const renderTabBar = useCallback((props) => <PartnerBottomBar {...props} />, []);

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
      backBehavior="history"
      tabBar={renderTabBar}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        lazy: true
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home'
        }}
      />
      <Tabs.Screen
        name="active"
        options={{
          title: 'Active'
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders'
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile'
        }}
      />
    </Tabs>
  );
}
