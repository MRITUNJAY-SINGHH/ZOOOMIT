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
import { Tabs, router } from 'expo-router';
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

function FloatingCapsuleTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { cart } = useCart();
  const { subscribe } = useTabBarVisibility();
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH - 24);

  const isHomePage = state.routes[state.index]?.name === 'index';

  const bottomInset = Platform.OS === 'ios' ? Math.max(insets.bottom, 10) : 8;
  const totalBarHeight = BAR_CONTENT_HEIGHT + bottomInset;

  const totalCartQty = useMemo(() => {
    if (!cart?.items?.length) return 0;
    return cart.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }, [cart]);

  const cartThumbnails = useMemo(() => {
    if (!cart?.items?.length) return [];
    const thumbs = [];
    for (const item of cart.items) {
      const uri = item.product?.featuredImage || item.product?.galleryImages?.[0] || item.product?.images?.[0]?.url || item.product?.image;
      if (uri && !thumbs.includes(uri)) {
        thumbs.push(uri);
      }
      if (thumbs.length >= 3) break;
    }
    return thumbs;
  }, [cart]);

  const visibleRoutes = state.routes.filter(route => route.name !== 'search' && descriptors[route.key].options.href !== null);
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

  return (
    <>
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
          ) : (
            <TouchableOpacity
              style={styles.blueCartPill}
              onPress={() => {
                haptics.medium();
                router.push('/(tabs)/cart');
              }}
              activeOpacity={0.9}
            >
              <View style={styles.blueCartLeft}>
                <Text style={styles.blueCartTag}>CART</Text>
                <Text style={styles.blueCartCount}>
                  {totalCartQty} {totalCartQty === 1 ? 'ITEM' : 'ITEMS'}
                </Text>
              </View>

              <View style={styles.blueCartRight}>
                <View style={styles.thumbsRow}>
                  {cartThumbnails.map((uri, idx) => (
                    <View key={idx} style={[styles.thumbCard, { marginLeft: idx > 0 ? -6 : 0 }]}>
                      <Image source={{ uri }} style={styles.thumbImage} contentFit="contain" />
                    </View>
                  ))}
                </View>
                <ChevronRight size={18} color="#FFFFFF" strokeWidth={2.8} style={{ marginLeft: 6 }} />
              </View>
            </TouchableOpacity>
          )}
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
            const { options } = descriptors[route.key];
            const label = options.title !== undefined ? options.title : route.name;
            const isFocused = state.routes[state.index]?.key === route.key;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                haptics.selection();
                navigation.navigate(route.name);
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
        <Tabs.Screen name="search" options={{ href: null }} />
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
  blueCartPill: {
    width: SCREEN_WIDTH - 24,
    height: 52,
    backgroundColor: '#0052FF',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16
  },
  blueCartLeft: {
    justifyContent: 'center'
  },
  blueCartTag: {
    fontFamily: typography.family.bold,
    fontSize: 10.5,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.8
  },
  blueCartCount: {
    fontFamily: typography.family.bold,
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700'
  },
  blueCartRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  thumbsRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  thumbCard: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    overflow: 'hidden'
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4
  }
});
