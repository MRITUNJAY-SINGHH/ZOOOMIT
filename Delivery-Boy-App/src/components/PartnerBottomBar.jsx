import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
  Easing
} from 'react-native-reanimated';
import {
  House,
  Home,
  ClipboardList,
  ShoppingBag,
  Wallet,
  CircleUserRound,
  CircleUser,
  UserRound,
  User
} from 'lucide-react-native';
import { colors, typography } from '../constants/theme';
import { hapticFeedback } from '../services/haptics';

const HomeIcon = House || Home;
const OrdersIcon = ClipboardList || ShoppingBag;
const EarningsIcon = Wallet;
const ProfileIcon = CircleUserRound || CircleUser || UserRound || User;

function TabItem({ tab, isActive, onPress, onLongPress }) {
  const progress = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isActive ? 1 : 0, {
      duration: 140,
      easing: Easing.out(Easing.cubic)
    });
  }, [isActive]);

  const animatedCapsuleStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 1], [0.82, 1], Extrapolation.CLAMP);
    const opacity = interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP);
    return {
      opacity,
      transform: [{ scale }]
    };
  });

  const animatedIconStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 1], [1, 1.08], Extrapolation.CLAMP);
    const translateY = interpolate(progress.value, [0, 1], [0, -1.5], Extrapolation.CLAMP);
    return {
      transform: [{ scale }, { translateY }]
    };
  });

  const animatedLabelStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 1], [0.75, 1], Extrapolation.CLAMP);
    return {
      opacity
    };
  });

  const IconComp = tab.icon;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
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
            strokeWidth={isActive ? 2.4 : 2}
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
  const isNavigatingRef = useRef(false);

  // Dynamic bottom padding: handles Android gesture bar, 3-button bar, and iOS home indicator
  const bottomPadding = Math.max(insets.bottom, 10);

  // Determine if running as Expo Router custom tab bar or standalone
  const isExpoTabs = !!(props.state && props.navigation);

  const TABS = [
    { key: 'home', routeName: 'index', label: 'Home', icon: HomeIcon, routePath: '/(tabs)' },
    { key: 'orders', routeName: 'orders', label: 'Orders', icon: OrdersIcon, routePath: '/(tabs)/orders' },
    { key: 'earnings', routeName: 'earnings', label: 'Earnings', icon: EarningsIcon, routePath: '/(tabs)/earnings' },
    { key: 'profile', routeName: 'profile', label: 'Profile', icon: ProfileIcon, routePath: '/(tabs)/profile' }
  ];

  // Active key in Expo Router Tabs mode
  const currentRouteName = isExpoTabs
    ? props.state.routes[props.state.index]?.name
    : null;

  // Active key in Standalone mode
  const standaloneActive = props.activeTab || 'profile';

  // Optimistic tab tracking so visual selection updates instantly (0ms) upon user tap
  const [optimisticTab, setOptimisticTab] = useState(null);

  useEffect(() => {
    setOptimisticTab(null);
  }, [currentRouteName, standaloneActive]);

  const activeTabKey = optimisticTab || (isExpoTabs ? currentRouteName : standaloneActive);

  return (
    <View style={[styles.barContainer, { paddingBottom: bottomPadding }]}>
      <View style={styles.tabsRow}>
        {TABS.map((tab) => {
          const isActuallyActive = isExpoTabs
            ? currentRouteName === tab.routeName
            : standaloneActive === tab.key;
          const isVisuallyActive = isExpoTabs
            ? activeTabKey === tab.routeName
            : activeTabKey === tab.key;

          const handlePress = () => {
            if (isActuallyActive) {
              // If on a subscreen and tapping current tab, quickly return
              if (!isExpoTabs && tab.key === standaloneActive) {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.navigate(tab.routePath);
                }
              }
              return;
            }

            if (isNavigatingRef.current) return;
            isNavigatingRef.current = true;

            // Trigger immediate optimistic visual update
            setOptimisticTab(isExpoTabs ? tab.routeName : tab.key);
            hapticFeedback.light?.();

            if (isExpoTabs) {
              const route = props.state.routes.find((r) => r.name === tab.routeName);
              if (route) {
                const event = props.navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true
                });

                if (!event.defaultPrevented) {
                  props.navigation.navigate(route.name);
                }
              }
            } else {
              // Standalone mode on nested screen
              router.navigate(tab.routePath);
            }

            setTimeout(() => {
              isNavigatingRef.current = false;
            }, 100);
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
              isActive={isVisuallyActive}
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
    paddingHorizontal: 6
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2
  },
  iconContainer: {
    width: 52,
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
    borderRadius: 12,
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
