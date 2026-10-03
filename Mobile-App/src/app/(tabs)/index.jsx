import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Dimensions,
  RefreshControl,
  Animated
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Navigation,
  ChevronDown,
  ChevronRight,
  Search,
  Bookmark,
  User,
  ShoppingBag,
  Sparkles,
  Zap,
  ArrowRight,
  X,
  Clock
} from 'lucide-react-native';
import { colors, typography } from '../../constants/theme';
import { StorefrontAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { haptics } from '../../services/haptics';
import { ProductCard } from '../../components/product/ProductCard';
import { QuickProductSheet } from '../../components/product/QuickProductSheet';
import { MOCK_PRODUCTS } from '../../services/mockProducts';
import { useTabBarVisibility } from '../../context/TabBarVisibilityContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const INSTAMART_CATEGORIES = [
  {
    id: 'vegetables',
    name: 'Vegetables & Fruits',
    image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=300',
    bgColor: '#EBF9F1',
    borderColor: '#D1FAE5'
  },
  {
    id: 'dairy',
    name: 'Dairy, Bread & Eggs',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300',
    bgColor: '#EFF6FF',
    borderColor: '#DBEAFE'
  },
  {
    id: 'groceries',
    name: 'Atta, Rice & Dal',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300',
    bgColor: '#FFFBEB',
    borderColor: '#FEF3C7'
  },
  {
    id: 'snacks',
    name: 'Snacks & Munchies',
    image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=300',
    bgColor: '#FFF7ED',
    borderColor: '#FFEDD5'
  },
  {
    id: 'drinks',
    name: 'Cold Drinks & Juices',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=300',
    bgColor: '#FEF2F2',
    borderColor: '#FEE2E2'
  },
  {
    id: 'instant',
    name: 'Instant & Frozen',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300',
    bgColor: '#FAF5FF',
    borderColor: '#F3E8FF'
  },
  {
    id: 'household',
    name: 'Cleaning & Household',
    image: 'https://images.unsplash.com/photo-1585842378054-ee2e52f94ba2?w=300',
    bgColor: '#F0FDFA',
    borderColor: '#CCFBF1'
  },
  {
    id: 'beauty',
    name: 'Personal & Baby Care',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300',
    bgColor: '#FDF2F8',
    borderColor: '#FCE7F3'
  }
];

const SEARCH_PROMPTS = [
  "Search for 'Chocolates'",
  "Search for 'Pizza'",
  "Search for 'milk, curd, butter'",
  "Search for 'fresh onion, tomato'",
  "Search for 'atta, dal, rice'",
  "Search for 'chips, cold drinks'"
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { customer } = useAuth();
  const { cart } = useCart();
  const { onScrollHandler } = useTabBarVisibility();

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quickSheetVisible, setQuickSheetVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchIndex, setSearchIndex] = useState(0);

  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setInterval(() => {
      setSearchIndex((prev) => (prev + 1) % SEARCH_PROMPTS.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const { data: categoriesData, refetch: refetchCategories } = useQuery({
    queryKey: ['home-categories'],
    queryFn: async () => {
      try {
        const res = await StorefrontAPI.getCategories();
        return res.data?.data || [];
      } catch (e) {
        return [];
      }
    }
  });

  const { data: backendProducts, refetch: refetchProducts } = useQuery({
    queryKey: ['home-products'],
    queryFn: async () => {
      try {
        const res = await StorefrontAPI.getProducts({ limit: 40 });
        const list = res.data?.data || res.data;
        return Array.isArray(list) && list.length > 0 ? list : null;
      } catch (e) {
        return null;
      }
    }
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.selection();
    await Promise.all([refetchCategories(), refetchProducts()]);
    setRefreshing(false);
  }, [refetchCategories, refetchProducts]);

  const activeProducts = useMemo(() => {
    return backendProducts || MOCK_PRODUCTS;
  }, [backendProducts]);

  const lightningDealsShelf = useMemo(() => {
    return activeProducts.slice(0, 8);
  }, [activeProducts]);

  const dairyEssentialsShelf = useMemo(() => {
    return activeProducts.filter((p) => p.category === 'dairy' || p.category === 'groceries').slice(0, 8);
  }, [activeProducts]);

  const snackMunchiesShelf = useMemo(() => {
    return activeProducts.filter((p) => p.category === 'snacks' || p.category === 'drinks').slice(0, 8);
  }, [activeProducts]);

  const handleProductPress = (product) => {
    haptics.selection();
    setSelectedProduct(product);
    setQuickSheetVisible(true);
  };

  const handleCategoryPress = (categoryId) => {
    haptics.selection();
    router.push({
      pathname: '/(tabs)/search',
      params: { category: categoryId }
    });
  };

  const addressLabel = useMemo(() => {
    if (customer?.addresses?.length > 0) {
      const def = customer.addresses.find((a) => a.isDefault) || customer.addresses[0];
      return `${def.street || ''}, ${def.city || ''}`.trim() || 'Select delivery address';
    }
    return 'Jaya Prakash Nagar, Kanakapura Main Rd...';
  }, [customer]);

  const topInset = Math.max(insets.top, 12);
  const restingHeaderHeight = topInset + 44 + 48 + 14;

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 44],
    outputRange: [0, -44],
    extrapolate: 'clamp'
  });

  const addressOpacity = scrollY.interpolate({
    inputRange: [0, 32],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });

  const handleScroll = (e) => {
    scrollY.setValue(e.nativeEvent.contentOffset.y);
    onScrollHandler(e);
  };

  return (
    <View style={styles.screenRoot}>
      <StatusBar style="dark" />

      <Animated.View
        style={[
          styles.stickyHeaderWrapper,
          {
            paddingTop: topInset,
            transform: [{ translateY: headerTranslateY }]
          }
        ]}
      >
        <Animated.View
          style={[
            styles.addressRow,
            {
              opacity: addressOpacity
            }
          ]}
        >
          <TouchableOpacity
            style={styles.addressLeft}
            onPress={() => {
              haptics.selection();
              router.push('/addresses');
            }}
            activeOpacity={0.7}
          >
            <Navigation
              size={18}
              color={colors.primaryDark}
              fill={colors.primaryDark}
              style={styles.addressArrowIcon}
            />
            <View style={styles.addressTextCol}>
              <View style={styles.addressTitleRow}>
                <Text style={styles.addressTitleText}>Delivering to J P Nagar</Text>
                <ChevronDown size={16} color={colors.textPrimary} strokeWidth={2.5} style={{ marginLeft: 3 }} />
              </View>
              <Text style={styles.addressSubtitleText} numberOfLines={1}>
                {addressLabel}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => {
              haptics.selection();
              router.push('/(tabs)/profile');
            }}
            activeOpacity={0.8}
          >
            <User size={18} color={colors.textPrimary} strokeWidth={2.2} />
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.searchBarRow}>
          <TouchableOpacity
            style={styles.searchBarMain}
            onPress={() => {
              haptics.selection();
              router.push('/(tabs)/search');
            }}
            activeOpacity={0.9}
          >
            <Search size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <Text style={styles.searchPlaceholderText} numberOfLines={1}>
              {SEARCH_PROMPTS[searchIndex]}
            </Text>
            <View style={styles.searchShortcut}>
              <Text style={styles.searchShortcutText}>⌘ K</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.wishlistBookmarkBtn}
            onPress={() => {
              haptics.selection();
              router.push('/wishlist');
            }}
            activeOpacity={0.8}
          >
            <Bookmark size={20} color="#1E293B" strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF5200']} />
        }
        contentContainerStyle={[
          styles.scrollBody,
          {
            paddingTop: restingHeaderHeight,
            paddingBottom: 120
          }
        ]}
      >
        <LinearGradient
          colors={[colors.primary, '#FFD95A', '#FFF0B0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBannerContainer}
        >
          <Image
            source={require('../../../assets/images/festive_banner_bg.jpg')}
            style={[StyleSheet.absoluteFillObject, { opacity: 0.12 }]}
            contentFit="cover"
          />

          <View style={styles.heroBannerContent}>
            <View style={styles.dishLeftWrap}>
              <Image
                source={require('../../../assets/images/banner_dish_left.jpg')}
                style={styles.dishImg}
                contentFit="cover"
              />
            </View>

            <View style={styles.bannerCenterContent}>
              <View style={styles.bannerTagRow}>
                <View style={styles.heroEyebrow}>
                  <Zap size={13} color={colors.primaryDark} fill={colors.primaryDark} />
                  <Text style={styles.bannerTagText}>FASTEST DELIVERY</Text>
                </View>
              </View>

              <Text style={styles.bannerHeadline}>Fresh groceries at your doorstep</Text>
              <Text style={styles.bannerOfferHeading}>Flat ₹150 OFF on your first order</Text>

              <TouchableOpacity
                style={styles.bannerOrderNowBtn}
                onPress={() => {
                  haptics.medium();
                  handleCategoryPress('snacks');
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.bannerOrderNowText}>SHOP NOW</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dishRightWrap}>
              <Image
                source={require('../../../assets/images/banner_dish_right.jpg')}
                style={styles.dishImg}
                contentFit="cover"
              />
            </View>
          </View>
        </LinearGradient>

        <View style={styles.promiseStrip}>
          <View style={styles.promiseItem}>
            <View style={styles.promiseIcon}><Clock size={15} color={colors.primaryDark} /></View>
            <View>
              <Text style={styles.promiseTitle}>10 min delivery</Text>
              <Text style={styles.promiseCaption}>At your doorstep</Text>
            </View>
          </View>
          <View style={styles.promiseDivider} />
          <View style={styles.promiseItem}>
            <View style={styles.promiseIcon}><Sparkles size={15} color={colors.primaryDark} /></View>
            <View>
              <Text style={styles.promiseTitle}>Fresh & sorted</Text>
              <Text style={styles.promiseCaption}>Quality you can trust</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionHeading}>What are you looking for?</Text>
            <Text style={styles.sectionSubHeading}>Everyday essentials, delivered fast</Text>
          </View>
          <TouchableOpacity
            onPress={() => handleCategoryPress('vegetables')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.seeAllText}>See All &gt;</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.categoriesGrid4Col}>
          {INSTAMART_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => handleCategoryPress(cat.id)}
              style={styles.grid4ColItem}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.grid4ColImgContainer,
                  { backgroundColor: cat.bgColor, borderColor: cat.borderColor }
                ]}
              >
                <Image
                  source={{ uri: cat.image }}
                  style={styles.grid4ColImg}
                  contentFit="contain"
                  transition={150}
                />
              </View>
              <Text style={styles.grid4ColName} numberOfLines={2}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.shelfHeaderRow}>
          <View>
            <View style={styles.shelfTitleWithBadge}>
              <Text style={styles.shelfHeading}>Lightning Deals</Text>
              <View style={styles.lightningPill}>
                <Clock size={11} color="#EA580C" strokeWidth={2.4} style={{ marginRight: 3 }} />
                <Text style={styles.lightningPillText}>Under 10 mins</Text>
              </View>
            </View>
            <Text style={styles.shelfSubHeading}>Lowest prices guaranteed today</Text>
          </View>
          <TouchableOpacity onPress={() => handleCategoryPress('vegetables')} hitSlop={8}>
            <Text style={styles.seeAllText}>See All &gt;</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shelfScrollContent}
        >
          {lightningDealsShelf.map((item) => (
            <ProductCard
              key={item._id}
              product={item}
              compact={true}
              onPress={handleProductPress}
            />
          ))}
        </ScrollView>

        <View style={styles.shelfHeaderRow}>
          <View>
            <Text style={styles.shelfHeading}>Dairy, Bread & Eggs</Text>
            <Text style={styles.shelfSubHeading}>Farm-fresh milk, butter & morning staples</Text>
          </View>
          <TouchableOpacity onPress={() => handleCategoryPress('dairy')} hitSlop={8}>
            <Text style={styles.seeAllText}>See All &gt;</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shelfScrollContent}
        >
          {dairyEssentialsShelf.map((item) => (
            <ProductCard
              key={item._id}
              product={item}
              compact={true}
              onPress={handleProductPress}
            />
          ))}
        </ScrollView>

        <View style={styles.shelfHeaderRow}>
          <View>
            <Text style={styles.shelfHeading}>Snacks & Drinks</Text>
            <Text style={styles.shelfSubHeading}>Cravings satisfied in 10 minutes</Text>
          </View>
          <TouchableOpacity onPress={() => handleCategoryPress('snacks')} hitSlop={8}>
            <Text style={styles.seeAllText}>See All &gt;</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shelfScrollContent}
        >
          {snackMunchiesShelf.map((item) => (
            <ProductCard
              key={item._id}
              product={item}
              compact={true}
              onPress={handleProductPress}
            />
          ))}
        </ScrollView>
      </ScrollView>

      {selectedProduct && (
        <QuickProductSheet
          visible={quickSheetVisible}
          product={selectedProduct}
          onClose={() => setQuickSheetVisible(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: colors.softBackground
  },
  stickyHeaderWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 900,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingBottom: 8
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    marginBottom: 4
  },
  addressLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10
  },
  addressArrowIcon: {
    marginRight: 8
  },
  addressTextCol: {
    flex: 1
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  addressTitleText: {
    fontFamily: typography.family.bold,
    fontSize: 15.5,
    color: colors.textPrimary,
    fontWeight: '800'
  },
  addressSubtitleText: {
    fontFamily: typography.family.medium,
    fontSize: 11.5,
    color: '#6B5B20',
    fontWeight: '500'
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(17, 24, 39, 0.08)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48
  },
  searchBarMain: {
    flex: 1,
    height: 46,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: 'rgba(17, 24, 39, 0.08)'
  },
  searchPlaceholderText: {
    flex: 1,
    fontFamily: typography.family.medium,
    fontSize: 13.5,
    color: colors.textSecondary,
    fontWeight: '500',
    marginRight: 8
  },
  searchShortcut: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: colors.softBackground
  },
  searchShortcutText: {
    fontFamily: typography.family.bold,
    fontSize: 10,
    color: colors.textMuted
  },
  wishlistBookmarkBtn: {
    width: 46,
    height: 46,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(17, 24, 39, 0.08)'
  },
  scrollBody: {
    backgroundColor: colors.softBackground
  },
  heroBannerContainer: {
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 14,
    height: 174,
    borderRadius: 24,
    backgroundColor: colors.primary,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center'
  },
  heroBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    width: '100%',
    height: '100%'
  },
  dishLeftWrap: {
    width: 92,
    height: 92,
    borderRadius: 46,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    backgroundColor: colors.primarySoft
  },
  dishRightWrap: {
    width: 92,
    height: 92,
    borderRadius: 46,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    backgroundColor: colors.primarySoft
  },
  dishImg: {
    width: '100%',
    height: '100%'
  },
  bannerCenterContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6
  },
  bannerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  bannerTagText: {
    fontFamily: typography.family.bold,
    fontSize: 11,
    color: colors.primaryDark,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  heroEyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12
  },
  bannerTagIcon: {
    fontSize: 13,
    marginLeft: 4
  },
  bannerOfferHeading: {
    fontFamily: typography.family.medium,
    fontSize: 11,
    color: '#6B5B20',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    maxWidth: 150
  },
  bannerHeadline: {
    fontFamily: typography.family.bold,
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 4,
    maxWidth: 165
  },
  bannerOrderNowBtn: {
    backgroundColor: colors.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18
  },
  bannerOrderNowText: {
    fontFamily: typography.family.bold,
    fontSize: 11.5,
    color: colors.white,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12
  },
  promiseStrip: {
    marginHorizontal: 12,
    marginBottom: 22,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  promiseItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  promiseIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  promiseTitle: {
    fontFamily: typography.family.bold,
    fontSize: 11,
    color: colors.textPrimary
  },
  promiseCaption: {
    fontFamily: typography.family.regular,
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2
  },
  promiseDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
    marginHorizontal: 10
  },
  sectionHeading: {
    fontFamily: typography.family.bold,
    fontSize: 17,
    color: colors.textPrimary,
    fontWeight: '800'
  },
  sectionSubHeading: {
    fontFamily: typography.family.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2
  },
  seeAllText: {
    fontFamily: typography.family.bold,
    fontSize: 12.5,
    color: colors.primaryDark,
    fontWeight: '700'
  },
  categoriesGrid4Col: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    marginBottom: 20
  },
  grid4ColItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 4
  },
  grid4ColImgContainer: {
    width: (SCREEN_WIDTH - 52) / 4,
    height: (SCREEN_WIDTH - 52) / 4,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    overflow: 'hidden'
  },
  grid4ColImg: {
    width: '78%',
    height: '78%'
  },
  grid4ColName: {
    fontFamily: typography.family.medium,
    fontSize: 11,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 14,
    fontWeight: '600'
  },
  shelfHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
    marginTop: 6
  },
  shelfTitleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  shelfHeading: {
    fontFamily: typography.family.bold,
    fontSize: 17,
    color: colors.textPrimary,
    fontWeight: '800',
    marginRight: 8
  },
  lightningPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10
  },
  lightningPillText: {
    fontFamily: typography.family.bold,
    fontSize: 10.5,
    color: colors.primaryDark,
    fontWeight: '700'
  },
  shelfSubHeading: {
    fontFamily: typography.family.regular,
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  shelfScrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 16
  }
});
