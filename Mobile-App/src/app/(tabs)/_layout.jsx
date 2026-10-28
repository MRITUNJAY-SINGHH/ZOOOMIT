import React, { useMemo, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Animated
} from 'react-native';
import { Tabs, router, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Home,
  LayoutGrid,
  ShoppingCart,
  ClipboardList,
  User,
  ChevronRight
} from 'lucide-react-native';
import { FloatingCart } from '../../components/FloatingCart';
import { typography } from '../../constants/theme';
import { useCart } from '../../context/CartContext';
import { haptics } from '../../services/haptics';
import { TabBarVisibilityProvider, useTabBarVisibility } from '../../context/TabBarVisibilityContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BAR_CONTENT_HEIGHT = 62;
const PILL_PADDING_V = 4;
const PILL_PADDING_H = 3;
const PILL_HEIGHT = BAR_CONTENT_HEIGHT - (PILL_PADDING_V * 2);
const PILL_RADIUS = 18;

function FloatingCapsuleTabBar(props) {
  const { state, descriptors, navigation: navProp, emitter, navigateToTab } = props;
  const hookNav = useNavigation();
  const navigation = navProp || hookNav;
  const insets = useSafeAreaInsets();
  const { cart } = useCart();
  const { subscribe } = useTabBarVisibility();
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH - 24);

  const isHomePage = state.routes[state.index]?.name === 'index';

  const bottomInset = Platform.OS === 'ios' ? Math.max(insets.bottom, 10) : 8;
  const totalBarHeight = BAR_CONTENT_HEIGHT + bottomInset;

  const totalCartQty = useMemo(() => {
    if (!cart?.items?.length) return 0;
    return cart.items.reduce((sum, item) => sum + (Number(item.qty ?? item.quantity ?? 0) > 0 ? 1 : 0), 0);
  }, [cart]);

  const visibleRoutes = state.routes.filter(route => route.name !== 'search' && descriptors[route.key]?.options?.href !== null);
  const focusedIndex = visibleRoutes.findIndex(route => route.key === state.routes[state.index]?.key);
  const activeIndex = Math.max(focusedIndex, 0);
  const tabCount = visibleRoutes.length;
  const tabWidth = containerWidth / tabCount;
  const pillWidth = tabWidth - (PILL_PADDING_H * 2);

  const slideAnim = useRef(new Animated.Value(activeIndex * tabWidth + PILL_PADDING_H)).current;
  const animY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeIndex * tabWidth + PILL_PADDING_H,
      damping: 22,
      stiffness: 240,
      mass: 0.7,
      useNativeDriver: true,
    }).start();
  }, [activeIndex, tabWidth]);

  useEffect(() => {
    const unsubscribe = subscribe((visible) => {
      Animated.spring(animY, {
        toValue: visible ? 0 : 1,
        damping: 24,
        stiffness: 260,
        mass: 0.6,
        useNativeDriver: true,
      }).start();
    });
    return unsubscribe;
  }, [subscribe]);

  useEffect(() => {
    Animated.spring(animY, { toValue: 0, damping: 24, stiffness: 260, mass: 0.6, useNativeDriver: true }).start();
  }, [state.index, animY]);

  const menuTranslateY = animY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, totalBarHeight + 20]
  });

  const targetDrop = totalCartQty === 0
    ? totalBarHeight - (Platform.OS === 'ios' ? Math.max(insets.bottom - 4, 0) : 0)
    : totalBarHeight;

  const contextualTranslateY = animY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, targetDrop]
  });

  const renderTabIcon = (routeName, isFocused) => {
    const iconColor = isFocused ? '#0066FF' : '#55657E';
    const iconSize = 22;

    switch (routeName) {
      case 'index':
        return (
          <Home
            size={iconSize}
            color={iconColor}
            strokeWidth={isFocused ? 2.4 : 1.9}
          />
        );
      case 'category':
        return (
          <LayoutGrid
            size={iconSize}
            color={iconColor}
            strokeWidth={isFocused ? 2.5 : 1.9}
          />
        );
      case 'cart':
        return (
          <View style={styles.cartIconWrapper}>
            <ShoppingCart
              size={iconSize}
              color={iconColor}
              strokeWidth={isFocused ? 2.4 : 1.9}
            />
            {totalCartQty > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {totalCartQty > 99 ? '99+' : totalCartQty}
                </Text>
              </View>
            )}
          </View>
        );
      case 'orders':
        return (
          <ClipboardList
            size={iconSize}
            color={iconColor}
            strokeWidth={isFocused ? 2.4 : 1.9}
          />
        );
      case 'profile':
        return (
          <User
            size={iconSize}
            color={iconColor}
            strokeWidth={isFocused ? 2.4 : 1.9}
          />
        );
      default:
        return <Home size={iconSize} color={iconColor} />;
    }
  };

  // Search owns its full-screen layout and floating cart.
  if (state.routes[state.index]?.name === 'search') return null;

  return (
    <>
      <FloatingCart bottom={totalBarHeight + 8} visible={['index', 'category'].includes(state.routes[state.index]?.name)} />
      {isHomePage && (
        <Animated.View
          style={[
            styles.contextualWrapper,
            {
              bottom: totalCartQty === 0 ? totalBarHeight : totalBarHeight + 8,
              transform: [{ translateY: contextualTranslateY }]
            }
          ]}
          pointerEvents="box-none"
        >
          {totalCartQty === 0 ? (
            <LinearGradient
              colors={['#E8FAF6', '#D6F7F1', '#BAF3E9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.freeDeliveryStrip}
            >
              <Text style={styles.freeDeliveryText}>
                <Text style={styles.freeDeliveryBold}>FREE DELIVERY </Text>
                <Text style={styles.freeDeliveryNormal}>on orders above ₹99</Text>
              </Text>
            </LinearGradient>
          ) : null
          }
        </Animated.View>
      )}

      <Animated.View
        style={[
          styles.dockedBottomContainer,
          {
            paddingBottom: bottomInset,
            transform: [{ translateY: menuTranslateY }],
            borderTopWidth: !isHomePage ? 1 : 0,
            borderTopColor: '#E2E8F0'
          }
        ]}
        pointerEvents="box-none"
      >
        <View
          style={styles.tabsRow}
          onLayout={(e) => {
            const { width } = e.nativeEvent.layout;
            if (width > 0 && width !== containerWidth) {
              setContainerWidth(width);
            }
          }}
        >
          <Animated.View
            style={[
              styles.activePill,
              {
                width: pillWidth,
                opacity: focusedIndex < 0 ? 0 : 1,
                transform: [{ translateX: slideAnim }]
              }
            ]}
            pointerEvents="none"
          />

          {visibleRoutes.map((route, index) => {
            const descriptor = descriptors[route.key] || {};
            const options = descriptor.options || {};
            const label = options.title !== undefined ? options.title : route.name;
            const isFocused = state.routes[state.index]?.key === route.key;

            const onPress = () => {
              const event = emitter?.emit
                ? emitter.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  })
                : navigation?.emit
                ? navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  })
                : { defaultPrevented: false };

              if (!isFocused && !event?.defaultPrevented) {
                haptics.selection();
                if (typeof navigateToTab === 'function') {
                  navigateToTab(route.key);
                } else if (navigation?.navigate) {
                  navigation.navigate(route.name);
                } else {
                  router.navigate(route.name === 'index' ? '/(tabs)' : `/(tabs)/${route.name}`);
                }
              }
            };

            const onLongPress = () => {
              if (emitter?.emit) {
                emitter.emit({
                  type: 'tabLongPress',
                  target: route.key,
                });
              } else if (navigation?.emit) {
                navigation.emit({
                  type: 'tabLongPress',
                  target: route.key,
                });
              }
            };

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tabItem}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  {renderTabIcon(route.name, isFocused)}
                </View>
                <Text
                  style={[
                    styles.tabLabel,
                    isFocused && styles.tabLabelActive
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    </>
  );
}

export default function TabLayout() {
  return (
    <TabBarVisibilityProvider>
      <Tabs
        tabBar={(props) => <FloatingCapsuleTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home'
          }}
        />
        <Tabs.Screen
          name="category"
          options={{
            title: 'Categories'
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            title: 'Cart'
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
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarStyle: { display: 'none' }
          }}
        />
      </Tabs>
    </TabBarVisibilityProvider>
  );
}

const styles = StyleSheet.create({
  dockedBottomContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    zIndex: 999,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 3
  },
  tabsRow: {
    width: '100%',
    height: BAR_CONTENT_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative'
  },
  activePill: {
    position: 'absolute',
    top: PILL_PADDING_V,
    left: 0,
    height: PILL_HEIGHT,
    borderRadius: PILL_RADIUS,
    backgroundColor: '#F0F3F6',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    zIndex: 1
  },
  tabItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    paddingVertical: 4
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 26,
    marginBottom: 2
  },
  tabLabel: {
    fontFamily: typography.family.medium,
    fontSize: 11,
    color: '#55657E',
    fontWeight: '500'
  },
  tabLabelActive: {
    fontFamily: typography.family.bold,
    color: '#0066FF',
    fontWeight: '700'
  },
  cartIconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -8,
    backgroundColor: '#FF5200',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3.5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF'
  },
  cartBadgeText: {
    fontFamily: typography.family.bold,
    fontSize: 9.5,
    color: '#FFFFFF',
    fontWeight: '800'
  },
  contextualWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 998,
    alignItems: 'center'
  },
  freeDeliveryStrip: {
    width: '100%',
    height: 38,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    overflow: 'hidden'
  },
  freeDeliveryText: {
    fontSize: 12,
    color: '#005C66',
    letterSpacing: 0.3
  },
  freeDeliveryBold: {
    fontFamily: typography.family.bold,
    fontWeight: '800',
    color: '#005C66'
  },
  freeDeliveryNormal: {
    fontFamily: typography.family.medium,
    fontWeight: '600',
    color: '#005C66'
  },
});
