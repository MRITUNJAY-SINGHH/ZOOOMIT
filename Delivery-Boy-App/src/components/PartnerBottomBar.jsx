import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Home, ShoppingBag, Wallet, User } from 'lucide-react-native';
import { typography } from '../constants/theme';
import { hapticFeedback } from '../services/haptics';

export default function PartnerBottomBar({ activeTab = 'profile' }) {
  const router = useRouter();

  const handleTabPress = (tabName, route) => {
    hapticFeedback.light?.();
    if (tabName === activeTab && route === '/(tabs)/profile') {
      // already on profile or subpage, if on subpage go back to profile
      router.replace('/(tabs)/profile');
      return;
    }
    router.replace(route);
  };

  const tabs = [
    { name: 'home', label: 'Home', icon: Home, route: '/(tabs)' },
    { name: 'orders', label: 'Orders', icon: ShoppingBag, route: '/(tabs)/orders' },
    { name: 'earnings', label: 'Earnings', icon: Wallet, route: '/(tabs)/earnings' },
    { name: 'profile', label: 'Profile', icon: User, route: '/(tabs)/profile' }
  ];

  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.name;
        const IconComp = tab.icon;

        return (
          <TouchableOpacity
            key={tab.name}
            activeOpacity={0.75}
            onPress={() => handleTabPress(tab.name, tab.route)}
            style={styles.tabButton}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
          >
            {isActive ? (
              <View style={styles.activeIconBox}>
                <IconComp size={18} color="#111827" strokeWidth={2.4} />
              </View>
            ) : (
              <View style={styles.inactiveIconBox}>
                <IconComp size={20} color="#94A3B8" strokeWidth={1.8} />
              </View>
            )}
            <Text style={[styles.tabLabel, isActive ? styles.tabLabelActive : styles.tabLabelInactive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    height: 64,
    paddingBottom: 6,
    paddingTop: 6,
    elevation: 0,
    shadowOpacity: 0
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  activeIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFC928',
    alignItems: 'center',
    justifyContent: 'center'
  },
  inactiveIconBox: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabLabel: {
    fontFamily: typography.family.bold,
    fontSize: 11,
    marginTop: 2
  },
  tabLabelActive: {
    color: '#111827'
  },
  tabLabelInactive: {
    color: '#94A3B8'
  }
});
