import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Extrapolation,
  Easing
} from 'react-native-reanimated';
import {
  House,
  Home,
  Zap,
  ClipboardList,
  ShoppingBag,
  CircleUserRound,
  CircleUser,
  UserRound,
  User
} from 'lucide-react-native';
import { colors, typography } from '../constants/theme';
import { hapticFeedback } from '../services/haptics';

const HomeIcon = House || Home;
const ActiveIcon = Zap;
const OrdersIcon = ClipboardList || ShoppingBag;
const ProfileIcon = CircleUserRound || CircleUser || UserRound || User;

function TabItem({ tab, isActive, onPress, onLongPress }) {
  const progress = useSharedValue(isActive ? 1 : 0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(isActive ? 1 : 0, {
      duration: 220,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1)
    });
  }, [isActive]);

  const handlePressIn = () => {
    pressScale.value = withSpring(0.92, { damping: 14, stiffness: 260 });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 14, stiffness: 220 });
  };

  // Animated capsule background (yellow highlight)
  const animatedCapsuleStyle = useAnimatedStyle(() => {
    const scaleX = interpolate(progress.value, [0, 1], [0.65, 1], Extrapolation.CLAMP);
    const scaleY = interpolate(progress.value, [0, 1], [0.8, 1], Extrapolation.CLAMP);
    const opacity = interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP);
    return {
      opacity,
      transform: [{ scaleX }, { scaleY }]
    };
  });

  // Animated icon (smooth micro-scale & subtle elevation)
  const animatedIconStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 1], [1, 1.1], Extrapolation.CLAMP);
    const translateY = interpolate(progress.value, [0, 1], [0, -1.5], Extrapolation.CLAMP);
    return {
      transform: [
        { scale: scale * pressScale.value },
        { translateY }
      ]
    };
  });

  // Animated label text
  const animatedLabelStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 1], [0.75, 1], Extrapolation.CLAMP);
    const translateY = interpolate(progress.value, [0, 1], [0, -0.5], Extrapolation.CLAMP);
    return {
      opacity,
      transform: [{ translateY }]
    };
  });

  const IconComp = tab.icon;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLongPress={onLongPress}
      style={styles.tabButton}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={tab.label}
    >
      <View style={styles.iconContainer}>
        <Animated.View style={[styles.activeCapsule, animatedCapsuleStyle]} />
        <Animated.View style={animatedIconStyle}>
          <IconComp
            size={20}
            color={isActive ? colors.secondary : '#64748B'}
            strokeWidth={isActive ? 2.5 : 2}
          />
        </Animated.View>
      </View>

      <Animated.Text
        numberOfLines={1}
        style={[
          styles.tabLabel,
          isActive ? styles.tabLabelActive : styles.tabLabelInactive,
          animatedLabelStyle
        ]}
      >
        {tab.label}
      </Animated.Text>
    </TouchableOpacity>
  );
}

export default function PartnerBottomBar(props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const isNavigatingRef = useRef(false);

  // Dynamic bottom padding: handles Android gesture bar, 3-button bar, and iOS home indicator
  const bottomPadding = Math.max(insets.bottom, 10);

  // Determine if running as Expo Router custom tab bar or standalone
  const isExpoTabs = !!(props.state && props.navigation);

  const TABS = useMemo(
    () => [
      { key: 'home', routeName: 'index', label: 'Home', icon: HomeIcon, routePath: '/(tabs)' },
      { key: 'active', routeName: 'active', label: 'Active', icon: ActiveIcon, routePath: '/(tabs)/active' },
      { key: 'orders', routeName: 'orders', label: 'Orders', icon: OrdersIcon, routePath: '/(tabs)/orders' },
      { key: 'profile', routeName: 'profile', label: 'Profile', icon: ProfileIcon, routePath: '/(tabs)/profile' }
    ],
    []
  );

  // Optimistic tab tracking so visual selection updates instantly upon user tap
  const [optimisticTab, setOptimisticTab] = useState(null);

  // Authoritative detection of the current active tab
  const activeTabKey = useMemo(() => {
    if (optimisticTab) return optimisticTab;

    // 1. Check Expo Router tabs state if available
    if (isExpoTabs && props.state?.routes && props.state?.index !== undefined) {
      const routeName = props.state.routes[props.state.index]?.name;
      if (routeName === 'active') return 'active';
      if (routeName === 'orders') return 'orders';
      if (routeName === 'profile') return 'profile';
      if (routeName === 'index') return 'home';
    }

    // 2. Check current global pathname from Expo Router
    const currentPath = pathname || '';
    if (currentPath.includes('/active')) return 'active';
    if (currentPath.includes('/orders')) return 'orders';
    if (currentPath.includes('/profile')) return 'profile';

    // 3. Fallback to passed activeTab prop if standalone
    if (props.activeTab) {
      if (props.activeTab === 'active') return 'active';
      if (props.activeTab === 'orders') return 'orders';
      if (props.activeTab === 'profile') return 'profile';
      if (props.activeTab === 'home' || props.activeTab === 'index') return 'home';
    }

    return 'home';
  }, [optimisticTab, isExpoTabs, props.state?.index, pathname, props.activeTab]);

  // Clear optimistic tab once path/state catches up
  useEffect(() => {
    setOptimisticTab(null);
  }, [pathname, props.state?.index]);

  return (
    <View style={[styles.barContainer, { paddingBottom: bottomPadding }]}>
      <View style={styles.tabsRow}>
        {TABS.map((tab) => {
          const isActive = activeTabKey === tab.key;

          const handlePress = () => {
            if (isActive) return;

            if (isNavigatingRef.current) return;
            isNavigatingRef.current = true;

            // Trigger immediate optimistic visual update
            setOptimisticTab(tab.key);
            hapticFeedback.light?.();

            // 1. Notify React Navigation Tabs
            if (isExpoTabs) {
              const route = props.state.routes.find((r) => r.name === tab.routeName);
              if (route) {
                const event = props.navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true
                });

                if (!event.defaultPrevented) {
                  try {
                    props.navigation.navigate({ name: route.name, merge: true });
                  } catch {
                    // fallback
                  }
                }
              }
            }

            // 2. Trigger native Expo Router navigation
            try {
              router.navigate(tab.routePath);
            } catch {
              router.push(tab.routePath);
            }

            setTimeout(() => {
              isNavigatingRef.current = false;
            }, 120);
          };

          const handleLongPress = () => {
            if (isExpoTabs) {
              const route = props.state.routes.find((r) => r.name === tab.routeName);
              if (route) {
                props.navigation.emit({
                  type: 'tabLongPress',
                  target: route.key
                });
              }
            }
          };

          return (
            <TabItem
              key={tab.key}
              tab={tab}
              isActive={isActive}
              onPress={handlePress}
              onLongPress={handleLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    elevation: 0,
    shadowOpacity: 0
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 8
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2
  },
  iconContainer: {
    width: 54,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  activeCapsule: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
    backgroundColor: '#FFC928'
  },
  tabLabel: {
    fontSize: 11.5,
    lineHeight: 15,
    marginTop: 3,
    textAlign: 'center'
  },
  tabLabelActive: {
    fontFamily: typography.family.bold,
    color: '#111827'
  },
  tabLabelInactive: {
    fontFamily: typography.family.medium,
    color: '#64748B'
  }
});
