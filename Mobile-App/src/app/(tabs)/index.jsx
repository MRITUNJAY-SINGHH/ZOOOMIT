import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Dimensions,
  RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import {
  MapPin,
  ChevronRight,
  ChevronDown,
  Search,
  Mic,
  User,
  ShoppingBag,
  Sparkles,
  Tag,
  Zap,
  Grid,
  Menu
} from 'lucide-react-native';
import { colors, typography } from '../../constants/theme';
import { StorefrontAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { haptics } from '../../services/haptics';
import { ProductCard } from '../../components/product/ProductCard';
import { QuickProductSheet } from '../../components/product/QuickProductSheet';
import { MOCK_PRODUCTS } from '../../services/mockProducts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Local generated assets
const HERO_BANNER_IMG = require('../../../assets/images/hero_vegetables_banner.jpg');
const PROMO_50_IMG = require('../../../assets/images/promo_discount_50.jpg');
const PROMO_DELIVERY_IMG = require('../../../assets/images/promo_free_delivery.jpg');
const PROMO_DEALS_IMG = require('../../../assets/images/promo_best_deals.jpg');
const PROMO_COMBO_IMG = require('../../../assets/images/promo_combo_offers.jpg');

// Quick category items (matching Image 1 horizontal bar)
const TOP_CATEGORIES = [
  { id: 'vegetables', name: 'Fresh Vegetables', image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=300' },
  { id: 'fruits', name: 'Fruits', image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=300' },
  { id: 'groceries', name: 'Groceries', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300' },
  { id: 'dairy', name: 'Dairy & Eggs', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300' },
  { id: 'snacks', name: 'Snacks & Beverages', image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=300' },
  { id: 'beauty', name: 'Beauty & Wellness', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300' },
  { id: 'household', name: 'Household & Lifestyle', image: 'https://images.unsplash.com/photo-1585842378054-ee2e52f94ba2?w=300' },
  { id: 'baby', name: 'Baby Care', image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300' }
];

// 12 Categories grid items (matching Image 1 "Shop by Category" 2-row grid)
const ALL_CATEGORIES_GRID = [
  { id: 'vegetables', name: 'Fresh Vegetables', image: 'https://images.unsplash.com/photo-1597362070381-801a61352e82?w=300' },
  { id: 'fruits', name: 'Fruits', image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=300' },
  { id: 'groceries', name: 'Groceries', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300' },
  { id: 'dairy', name: 'Dairy & Eggs', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300' },
  { id: 'snacks', name: 'Snacks & Beverages', image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=300' },
  { id: 'beauty', name: 'Beauty & Wellness', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300' },
  { id: 'household', name: 'Household & Lifestyle', image: 'https://images.unsplash.com/photo-1585842378054-ee2e52f94ba2?w=300' },
  { id: 'baby', name: 'Baby Care', image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300' },
  { id: 'pet', name: 'Pet Care', image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=300' },
  { id: 'personal', name: 'Personal Care', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300' },
  { id: 'pharma', name: 'Health & Pharma', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300' },
  { id: 'kitchen', name: 'Home & Kitchen', image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=300' }
];

// Service switcher tabs (from Image 2)
const SERVICE_TABS = [
  { id: 'food', label: 'Food', icon: '🍔' },
  { id: 'instamart', label: 'Instamart', icon: '🛍️' },
  { id: 'dineout', label: 'Dineout', icon: '🍽️' },
  { id: 'scenes', label: 'Scenes', icon: '🪩' }
];

// Sub-nav chips (from Image 2)
const SUB_NAV_CHIPS = [
  { id: 'ALL', label: 'ALL', icon: 'grid' },
  { id: 'GOURMET', label: 'GOURMET' },
  { id: 'OFFERS', label: 'OFFERS', icon: 'tag' },
  { id: 'EATRIGHT', label: 'EATRIGHT' },
  { id: 'VEGGIES', label: 'VEGGIES' },
  { id: 'CLEANING', label: 'CLEANING' }
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { customer } = useAuth();
  const { cart } = useCart();

  const [activeServiceTab, setActiveServiceTab] = useState('instamart');
  const [activeNavChip, setActiveNavChip] = useState('ALL');
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quickSheetVisible, setQuickSheetVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 1. Fetch real categories
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

  // 2. Fetch real backend products
  const { data: backendProducts, refetch: refetchProducts } = useQuery({
    queryKey: ['home-products'],
    queryFn: async () => {
      try {
        const res = await StorefrontAPI.getProducts({ limit: 40 });
        const list = res.data?.data || res.data;
        if (Array.isArray(list) && list.length > 0) return list;
      } catch (err) {
        console.log('[HomeScreen] Products fetch error, using curated products:', err.message);
      }
      return MOCK_PRODUCTS;
    }
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchCategories(), refetchProducts()]);
    setRefreshing(false);
  };

  // Curated product shelves matching Image 1
  const personalCareShelf = useMemo(() => {
    let list = MOCK_PRODUCTS.filter(p => p._id.startsWith('prod_dove_'));
    if (isVegOnly) list = list.filter(p => p.isVeg !== false);
    return list;
  }, [isVegOnly]);

  const cleaningShelf = useMemo(() => {
    let list = MOCK_PRODUCTS.filter(p => p._id.startsWith('prod_ariel_') || p._id.startsWith('prod_safewash_'));
    if (isVegOnly) list = list.filter(p => p.isVeg !== false);
    return list;
  }, [isVegOnly]);

  const fruitsShelf = useMemo(() => {
    let list = MOCK_PRODUCTS.filter(p => p._id.startsWith('prod_apple_') || p._id.startsWith('prod_banana_') || p._id.startsWith('prod_orange_') || p._id.startsWith('prod_grapes_'));
    if (isVegOnly) list = list.filter(p => p.isVeg !== false);
    return list;
  }, [isVegOnly]);

  const freshVegShelf = useMemo(() => {
    const list = backendProducts || MOCK_PRODUCTS;
    let filtered = list.filter(p => p.category?.slug === 'fresh-vegetables' || p._id.includes('onion') || p._id.includes('tomato') || p._id.includes('potato') || p._id.includes('carrot'));
    if (isVegOnly) filtered = filtered.filter(p => p.isVeg !== false);
    return filtered.slice(0, 8);
  }, [backendProducts, isVegOnly]);

  const defaultAddress = customer?.addresses?.find((a) => a.isDefault) || customer?.addresses?.[0];
  const addressLabel = defaultAddress 
    ? `${defaultAddress.street || defaultAddress.city || 'Sector 62, Noida'}`
    : 'House No 172, Shankar Vihar Colony, 663, Ghaziabad...';

  const handleProductPress = (product) => {
    haptics.selection();
    setSelectedProduct(product);
    setQuickSheetVisible(true);
  };

  const handleCategoryPress = (catId) => {
    haptics.selection();
    router.push(`/category/${catId || 'vegetables'}`);
  };

  return (
    <View style={styles.screenContainer}>
      {/* 1. TOP BAR (DARK NAVY / INSTAMART STYLE FROM IMAGE 2) */}
      <View style={[styles.topBarContainer, { paddingTop: Math.max(insets.top, 12) }]}>
        {/* Row 1: Location & Profile */}
        <View style={styles.locationRow}>
          <TouchableOpacity 
            style={styles.locationLeft}
            onPress={() => router.push('/addresses')}
            activeOpacity={0.7}
          >
            <View style={styles.pinCircle}>
              <MapPin size={18} color="#EF4444" fill="#EF4444" />
            </View>
            <View style={styles.locationTextWrap}>
              <View style={styles.homeTitleRow}>
                <Text style={styles.homeTitleText}>Home</Text>
                <ChevronRight size={16} color="#FFFFFF" strokeWidth={2.4} style={{ marginLeft: 2 }} />
              </View>
              <Text style={styles.addressSubtitle} numberOfLines={1}>
                {addressLabel}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.topIconBtn}
            onPress={() => router.push('/profile')}
            activeOpacity={0.7}
          >
            <Menu size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Row 2: Service Modes Switcher Tabs (Image 2) */}
        <View style={styles.serviceTabsRow}>
          {SERVICE_TABS.map((tab) => {
            const isActive = activeServiceTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => {
                  haptics.selection();
                  setActiveServiceTab(tab.id);
                }}
                style={[
                  styles.serviceTabCard,
                  isActive && styles.serviceTabCardActive
                ]}
                activeOpacity={0.8}
              >
                <Text style={styles.serviceTabEmoji}>{tab.icon}</Text>
                <Text style={[styles.serviceTabLabel, isActive && styles.serviceTabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Row 3: White Search Bar with Mic & VEG Switch (Image 2) */}
        <View style={styles.searchBarRow}>
          <TouchableOpacity 
            style={styles.searchBarMain}
            onPress={() => router.push('/(tabs)/search')}
            activeOpacity={0.85}
          >
            <Search size={18} color="#64748B" style={{ marginRight: 8 }} />
            <Text style={styles.searchPlaceholderText} numberOfLines={1}>
              Search for 'Onion', 'Milk', 'Dove'...
            </Text>
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/search')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Mic size={18} color="#EF4444" style={{ marginHorizontal: 6 }} />
            </TouchableOpacity>
          </TouchableOpacity>

          {/* VEG Switch Toggle */}
          <TouchableOpacity
            style={[styles.vegToggleBtn, isVegOnly && styles.vegToggleBtnActive]}
            onPress={() => {
              haptics.selection();
              setIsVegOnly(!isVegOnly);
            }}
            activeOpacity={0.8}
          >
            <View style={styles.vegSquare}>
              <View style={[styles.vegCircle, isVegOnly && { backgroundColor: '#15803D' }]} />
            </View>
            <Text style={[styles.vegToggleText, isVegOnly && styles.vegToggleTextActive]}>
              VEG
            </Text>
            <View style={[styles.vegSwitchTrack, isVegOnly && styles.vegSwitchTrackActive]}>
              <View style={[styles.vegSwitchThumb, isVegOnly && styles.vegSwitchThumbActive]} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Row 4: Sub-navigation Chips with white indicator (Image 2) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subNavScrollContent}
        >
          {SUB_NAV_CHIPS.map((chip) => {
            const isActive = activeNavChip === chip.id;
            return (
              <TouchableOpacity
                key={chip.id}
                onPress={() => {
                  haptics.selection();
                  setActiveNavChip(chip.id);
                }}
                style={[
                  styles.navChip,
                  isActive && styles.navChipActive
                ]}
                activeOpacity={0.7}
              >
                {chip.icon === 'grid' && (
                  <Grid size={13} color={isActive ? '#FFFFFF' : '#94A3B8'} style={{ marginRight: 5 }} />
                )}
                {chip.icon === 'tag' && (
                  <Tag size={12} color={isActive ? '#FFFFFF' : '#94A3B8'} style={{ marginRight: 5 }} />
                )}
                <Text style={[styles.navChipText, isActive && styles.navChipTextActive]}>
                  {chip.label}
                </Text>
                {isActive && <View style={styles.navChipIndicator} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 2. MAIN SCROLLABLE BODY CONTENT (IMAGE 1 LAYOUT) */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0066FF']} />
        }
        contentContainerStyle={styles.scrollBody}
      >
        {/* TOP CATEGORIES ROW (Screen 1) */}
        <View style={styles.topCategoriesWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.topCategoriesScroll}
          >
            {TOP_CATEGORIES.map((cat, idx) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => handleCategoryPress(cat.id)}
                style={[
                  styles.topCategoryCard,
                  idx === 0 && styles.topCategoryCardFirst
                ]}
                activeOpacity={0.8}
              >
                <View style={styles.topCategoryImgWrap}>
                  <Image
                    source={{ uri: cat.image }}
                    style={styles.topCategoryImg}
                    contentFit="cover"
                    transition={150}
                  />
                </View>
                <Text style={styles.topCategoryName} numberOfLines={2}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* HERO PROMO BANNER (Screen 1) */}
        <TouchableOpacity
          onPress={() => handleCategoryPress('vegetables')}
          style={styles.heroBannerCard}
          activeOpacity={0.9}
        >
          <Image
            source={HERO_BANNER_IMG}
            style={styles.heroBannerImage}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.heroBannerContent}>
            <View style={styles.heroTagPill}>
              <Text style={styles.heroTagText}>🌿 FARM FRESH</Text>
            </View>
            <Text style={styles.heroTitleText}>Fresh & Healthy{'\n'}Vegetables</Text>
            <Text style={styles.heroDiscountText}>UP TO 40% OFF</Text>
            <View style={styles.heroShopNowBtn}>
              <Text style={styles.heroShopNowText}>Shop Now &gt;</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Banner Indicator Dots */}
        <View style={styles.heroDotsRow}>
          <View style={[styles.heroDot, styles.heroDotActive]} />
          <View style={styles.heroDot} />
          <View style={styles.heroDot} />
        </View>

        {/* 4 PROMO MINI-CARDS ROW (Screen 1) */}
        <View style={styles.promoCardsRow}>
          {/* Card 1: 50% OFF */}
          <TouchableOpacity 
            style={[styles.promoCard, { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' }]}
            onPress={() => handleCategoryPress('vegetables')}
            activeOpacity={0.8}
          >
            <View style={styles.promoTextCol}>
              <Text style={styles.promoTitle}>Get</Text>
              <Text style={styles.promoHighlight}>50% OFF</Text>
            </View>
            <Image source={PROMO_50_IMG} style={styles.promoImg} contentFit="contain" />
          </TouchableOpacity>

          {/* Card 2: Free Delivery */}
          <TouchableOpacity 
            style={[styles.promoCard, { backgroundColor: '#FEFCE8', borderColor: '#FEF08A' }]}
            onPress={() => handleCategoryPress('groceries')}
            activeOpacity={0.8}
          >
            <View style={styles.promoTextCol}>
              <Text style={styles.promoTitle}>Free</Text>
              <Text style={styles.promoHighlight}>Delivery</Text>
            </View>
            <Image source={PROMO_DELIVERY_IMG} style={styles.promoImg} contentFit="contain" />
          </TouchableOpacity>

          {/* Card 3: Best Deals */}
          <TouchableOpacity 
            style={[styles.promoCard, { backgroundColor: '#FAF5FF', borderColor: '#F3E8FF' }]}
            onPress={() => handleCategoryPress('dairy')}
            activeOpacity={0.8}
          >
            <View style={styles.promoTextCol}>
              <Text style={styles.promoTitle}>Best</Text>
              <Text style={styles.promoHighlight}>Deals</Text>
            </View>
            <Image source={PROMO_DEALS_IMG} style={styles.promoImg} contentFit="contain" />
          </TouchableOpacity>

          {/* Card 4: Combo Offers */}
          <TouchableOpacity 
            style={[styles.promoCard, { backgroundColor: '#FFF7ED', borderColor: '#FFEDD5' }]}
            onPress={() => handleCategoryPress('snacks')}
            activeOpacity={0.8}
          >
            <View style={styles.promoTextCol}>
              <Text style={styles.promoTitle}>Combo</Text>
              <Text style={styles.promoHighlight}>Offers</Text>
            </View>
            <Image source={PROMO_COMBO_IMG} style={styles.promoImg} contentFit="contain" />
          </TouchableOpacity>
        </View>

        {/* "SHOP BY CATEGORY" 2-ROW GRID (Screen 1) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Shop by Category</Text>
          <TouchableOpacity 
            onPress={() => handleCategoryPress('vegetables')} 
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.seeAllText}>See All &gt;</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.categoriesGrid}>
          {ALL_CATEGORIES_GRID.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => handleCategoryPress(cat.id)}
              style={styles.gridCatItem}
              activeOpacity={0.7}
            >
              <View style={styles.gridCatImgWrap}>
                <Image
                  source={{ uri: cat.image }}
                  style={styles.gridCatImg}
                  contentFit="cover"
                  transition={150}
                />
              </View>
              <Text style={styles.gridCatName} numberOfLines={2}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* SHELF 1: "The Wait Is Over! – Dove Body Wash" (Screen 1) */}
        <View style={styles.shelfHeaderRow}>
          <Text style={styles.shelfHeading}>The Wait Is Over! – Dove Body Wash</Text>
          <TouchableOpacity onPress={() => handleCategoryPress('personal')} hitSlop={8}>
            <Text style={styles.seeAllText}>See All &gt;</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shelfScrollContent}
        >
          {personalCareShelf.map((item) => (
            <ProductCard
              key={item._id}
              product={item}
              compact={true}
              onPress={handleProductPress}
            />
          ))}
        </ScrollView>

        {/* SHELF 2: "Best deals on cleaning essentials!" (Screen 1) */}
        <View style={styles.shelfHeaderRow}>
          <Text style={styles.shelfHeading}>Best deals on cleaning essentials!</Text>
          <TouchableOpacity onPress={() => handleCategoryPress('household')} hitSlop={8}>
            <Text style={styles.seeAllText}>See All &gt;</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shelfScrollContent}
        >
          {cleaningShelf.map((item) => (
            <ProductCard
              key={item._id}
              product={item}
              compact={true}
              onPress={handleProductPress}
            />
          ))}
        </ScrollView>

        {/* SHELF 3: "Fresh Fruits for You" (Screen 1) */}
        <View style={styles.shelfHeaderRow}>
          <Text style={styles.shelfHeading}>Fresh Fruits for You</Text>
          <TouchableOpacity onPress={() => handleCategoryPress('fruits')} hitSlop={8}>
            <Text style={styles.seeAllText}>See All &gt;</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shelfScrollContent}
        >
          {fruitsShelf.map((item) => (
            <ProductCard
              key={item._id}
              product={item}
              compact={true}
              onPress={handleProductPress}
            />
          ))}
        </ScrollView>

        {/* SHELF 4: "Fresh Vegetables" (Screen 1) */}
        <View style={styles.shelfHeaderRow}>
          <Text style={styles.shelfHeading}>Fresh Farm Vegetables</Text>
          <TouchableOpacity onPress={() => handleCategoryPress('vegetables')} hitSlop={8}>
            <Text style={styles.seeAllText}>See All &gt;</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shelfScrollContent}
        >
          {freshVegShelf.map((item) => (
            <ProductCard
              key={item._id}
              product={item}
              compact={true}
              onPress={handleProductPress}
            />
          ))}
        </ScrollView>

        {/* Bottom padding so bottom navigation tab bar doesn't obscure content */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* QUICK PRODUCT BOTTOM SHEET (Screen 2 -> Screen 3 continuous flow) */}
      <QuickProductSheet
        visible={quickSheetVisible}
        product={selectedProduct}
        onClose={() => setQuickSheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  // TOP BAR STYLES (Image 2 Dark Navy Style)
  topBarContainer: {
    backgroundColor: '#080E23',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)'
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12
  },
  pinCircle: {
    marginRight: 8
  },
  locationTextWrap: {
    flex: 1
  },
  homeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  homeTitleText: {
    fontFamily: typography.family.bold,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700'
  },
  addressSubtitle: {
    fontFamily: typography.family.regular,
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 1
  },
  topIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  serviceTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 10
  },
  serviceTabCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 3
  },
  serviceTabCardActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)'
  },
  serviceTabEmoji: {
    fontSize: 18,
    marginBottom: 3
  },
  serviceTabLabel: {
    fontFamily: typography.family.medium,
    fontSize: 11,
    color: '#94A3B8'
  },
  serviceTabLabelActive: {
    color: '#FFFFFF',
    fontFamily: typography.family.bold,
    fontWeight: '700'
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4
  },
  searchBarMain: {
    flex: 1,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12
  },
  searchPlaceholderText: {
    flex: 1,
    fontFamily: typography.family.medium,
    fontSize: 12.5,
    color: '#94A3B8'
  },
  vegToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)'
  },
  vegToggleBtnActive: {
    backgroundColor: '#0F291E',
    borderColor: '#15803D'
  },
  vegSquare: {
    width: 12,
    height: 12,
    borderWidth: 1.2,
    borderColor: '#16A34A',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4
  },
  vegCircle: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#16A34A'
  },
  vegToggleText: {
    fontFamily: typography.family.bold,
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '700',
    marginRight: 6
  },
  vegToggleTextActive: {
    color: '#4ADE80'
  },
  vegSwitchTrack: {
    width: 22,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    paddingHorizontal: 1
  },
  vegSwitchTrackActive: {
    backgroundColor: '#16A34A'
  },
  vegSwitchThumb: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF'
  },
  vegSwitchThumbActive: {
    alignSelf: 'flex-end'
  },
  subNavScrollContent: {
    paddingTop: 10,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center'
  },
  navChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    marginRight: 10,
    position: 'relative'
  },
  navChipActive: {},
  navChipText: {
    fontFamily: typography.family.medium,
    fontSize: 12,
    color: '#94A3B8'
  },
  navChipTextActive: {
    fontFamily: typography.family.bold,
    color: '#FFFFFF',
    fontWeight: '700'
  },
  navChipIndicator: {
    position: 'absolute',
    bottom: -3,
    left: 12,
    right: 12,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF'
  },

  // SCROLL BODY STYLES (Image 1 Layout)
  scrollBody: {
    paddingBottom: 40
  },
  topCategoriesWrap: {
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  topCategoriesScroll: {
    paddingHorizontal: 16,
    gap: 10
  },
  topCategoryCard: {
    width: 74,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 4
  },
  topCategoryCardFirst: {
    backgroundColor: '#FFFDF5',
    borderColor: '#FDE68A'
  },
  topCategoryImgWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 6
  },
  topCategoryImg: {
    width: '100%',
    height: '100%'
  },
  topCategoryName: {
    fontFamily: typography.family.bold,
    fontSize: 10.5,
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 13,
    fontWeight: '700'
  },

  // HERO BANNER (Image 1)
  heroBannerCard: {
    marginHorizontal: 16,
    marginTop: 12,
    height: 160,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E293B'
  },
  heroBannerImage: {
    width: '100%',
    height: '100%'
  },
  heroBannerContent: {
    ...StyleSheet.absoluteFillObject,
    padding: 16,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.28)'
  },
  heroTagPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 6
  },
  heroTagText: {
    fontFamily: typography.family.bold,
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700'
  },
  heroTitleText: {
    fontFamily: typography.family.bold,
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '800',
    lineHeight: 24
  },
  heroDiscountText: {
    fontFamily: typography.family.heavy,
    fontSize: 14,
    color: '#FEF08A',
    fontWeight: '800',
    marginTop: 2,
    marginBottom: 8
  },
  heroShopNowBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    alignSelf: 'flex-start'
  },
  heroShopNowText: {
    fontFamily: typography.family.bold,
    fontSize: 11,
    color: '#111827',
    fontWeight: '700'
  },
  heroDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 10
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1'
  },
  heroDotActive: {
    width: 18,
    borderRadius: 3,
    backgroundColor: '#0F172A'
  },

  // 4 PROMO MINI CARDS
  promoCardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 14
  },
  promoCard: {
    flex: 1,
    height: 72,
    borderRadius: 14,
    borderWidth: 1,
    padding: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden'
  },
  promoTextCol: {
    flex: 1
  },
  promoTitle: {
    fontFamily: typography.family.bold,
    fontSize: 10,
    color: '#1E293B',
    fontWeight: '700'
  },
  promoHighlight: {
    fontFamily: typography.family.heavy,
    fontSize: 11,
    color: '#0F172A',
    fontWeight: '800',
    marginTop: 1
  },
  promoImg: {
    width: 38,
    height: 38
  },

  // "SHOP BY CATEGORY" 2-ROW GRID
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 10
  },
  sectionHeading: {
    fontFamily: typography.family.bold,
    fontSize: 17,
    color: '#0F172A',
    fontWeight: '700'
  },
  seeAllText: {
    fontFamily: typography.family.bold,
    fontSize: 12.5,
    color: '#0066FF',
    fontWeight: '700'
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginBottom: 14
  },
  gridCatItem: {
    width: '16.66%',
    alignItems: 'center',
    paddingHorizontal: 3,
    paddingVertical: 6
  },
  gridCatImgWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 4,
    justifyContent: 'center',
    alignItems: 'center'
  },
  gridCatImg: {
    width: '100%',
    height: '100%'
  },
  gridCatName: {
    fontFamily: typography.family.medium,
    fontSize: 9.5,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 12
  },

  // CURATED PRODUCT SHELVES
  shelfHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 8
  },
  shelfHeading: {
    fontFamily: typography.family.bold,
    fontSize: 15.5,
    color: '#0F172A',
    fontWeight: '700'
  },
  shelfScrollContent: {
    paddingHorizontal: 16,
    gap: 10
  }
});
