import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  StatusBar as RNStatusBar,
  useWindowDimensions
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import {
  Search,
  ShoppingBasket,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  User,
  MapPin,
  Mic
} from 'lucide-react-native';
import { colors, typography } from '../../constants/theme';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTabBarVisibility } from '../../context/TabBarVisibilityContext';
import { ProductCard } from '../../components/product/ProductCard';

const TOP_INSET_FALLBACK = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 28) : 44;
const HEADER_YELLOW = '#FEDC4A';

const LOCAL_CATEGORY_IMAGES = {
  'fruits & vegetables': require('../../../assets/images/categories/fruits_veggies.jpg'),
  'fruits and vegetables': require('../../../assets/images/categories/fruits_veggies.jpg'),
  'fruits': require('../../../assets/images/categories/fruits_veggies.jpg'),
  'vegetables': require('../../../assets/images/categories/fruits_veggies.jpg'),
  'dairy & eggs': require('../../../assets/images/categories/dairy_milk.jpg'),
  'dairy and eggs': require('../../../assets/images/categories/dairy_milk.jpg'),
  'dairy': require('../../../assets/images/categories/dairy_milk.jpg'),
  'milk': require('../../../assets/images/categories/dairy_milk.jpg'),
  'atta, rice & flours': require('../../../assets/images/categories/atta_rice_dal.jpg'),
  'atta, rice & dal': require('../../../assets/images/categories/atta_rice_dal.jpg'),
  'atta': require('../../../assets/images/categories/atta_rice_dal.jpg'),
  'rice': require('../../../assets/images/categories/atta_rice_dal.jpg'),
  'flours': require('../../../assets/images/categories/atta_rice_dal.jpg'),
  'snacks & beverages': require('../../../assets/images/categories/snacks_beverages.jpg'),
  'snacks and beverages': require('../../../assets/images/categories/snacks_beverages.jpg'),
  'snacks': require('../../../assets/images/categories/snacks_beverages.jpg'),
  'beverages': require('../../../assets/images/categories/snacks_beverages.jpg'),
  'household essentials': require('../../../assets/images/categories/personal_care.jpg'),
  'personal care': require('../../../assets/images/categories/personal_care.jpg'),
  'masala & spices': require('../../../assets/images/categories/masala_spices.jpg'),
  'spices': require('../../../assets/images/categories/masala_spices.jpg'),
};

const DEFAULT_SHORTCUTS = [
  { id: 'fruits-veg', name: 'Fruits &\nVegetables', match: 'fruit|vegetable', imageSource: require('../../../assets/images/categories/fruits_veggies.jpg') },
  { id: 'dairy-eggs', name: 'Dairy &\nEggs', match: 'dairy|milk|egg|curd|paneer', imageSource: require('../../../assets/images/categories/dairy_milk.jpg') },
  { id: 'atta-rice', name: 'Atta, Rice\n& Flours', match: 'atta|rice|flour|dal|pulse', imageSource: require('../../../assets/images/categories/atta_rice_dal.jpg') },
  { id: 'snacks-bev', name: 'Snacks &\nBeverages', match: 'snack|beverage|drink|chips', imageSource: require('../../../assets/images/categories/snacks_beverages.jpg') },
  { id: 'household', name: 'Household\nEssentials', match: 'clean|wash|household|care', imageSource: require('../../../assets/images/categories/personal_care.jpg') },
  { id: 'spices', name: 'Masala &\nSpices', match: 'spice|masala|salt|sugar', imageSource: require('../../../assets/images/categories/masala_spices.jpg') },
];

const PROMO_BANNERS = [
  {
    id: 'banner-1',
    image: require('../../../assets/images/banner/banner_full_1.png'),
  },
  {
    id: 'banner-2',
    image: require('../../../assets/images/banner/banner_full_2.png'),
  },
  {
    id: 'banner-3',
    image: require('../../../assets/images/banner/banner_full_3.png'),
  },
  {
    id: 'banner-4',
    image: require('../../../assets/images/banner/banner_full_4.png'),
  },
];

const SEARCH_WORDS = [
  'Search for groceries, milk, bread...',
  'Search fresh fruits & veggies...',
  'Search atta, rice & dal...',
  'Search dairy, paneer & eggs...',
  'Search snacks & beverages...',
];

const RotatingSearch = ({ words }) => {
  const list = words && words.length ? words : SEARCH_WORDS;
  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % list.length);
      }, 250);
    }, 3200);
    return () => clearInterval(timer);
  }, [list.length, fadeAnim]);

  return (
    <Animated.Text
      numberOfLines={1}
      style={[styles.placeholderText, { opacity: fadeAnim }]}
    >
      {list[index]}
    </Animated.Text>
  );
};

const idOf = (item) => (typeof item === 'string' ? item : item?._id || item?.id);

const listFrom = (res) => {
  const data = res.data?.data ?? res.data;
  const list = Array.isArray(data) ? data : data?.products ?? data?.categories;
  if (!Array.isArray(list)) return [];
  return list;
};

const categoryText = (p) =>
  `${p.category?.name || (typeof p.category === 'string' ? p.category : '')} ${p.name || ''}`;

const formatCategoryLabel = (name) => {
  if (!name) return '';
  if (name.includes('\n')) return name;
  if (name.includes(' & ')) return name.replace(' & ', ' &\n');
  if (name.includes(' and ')) return name.replace(' and ', ' &\n');
  const words = name.split(' ');
  if (words.length >= 2 && name.length > 10) {
    const mid = Math.ceil(words.length / 2);
    return words.slice(0, mid).join(' ') + '\n' + words.slice(mid).join(' ');
  }
  return name;
};

const CategoryArt = ({ category, products }) => {
  const [failed, setFailed] = useState(false);
  const ownProduct = products.find(
    (p) => idOf(p.category) === idOf(category) || idOf(p.subcategory) === idOf(category)
  );
  const uri = failed
    ? ownProduct?.featuredImage
    : category.image || category.featuredImage || ownProduct?.featuredImage;
  const [fallbackFailed, setFallbackFailed] = useState(false);

  return (
    <View style={styles.categoryArt}>
      {uri && !fallbackFailed ? (
        <Image
          source={{ uri }}
          style={styles.categoryImage}
          contentFit="contain"
          onError={() => (failed ? setFallbackFailed(true) : setFailed(true))}
        />
      ) : (
        <ShoppingBasket size={30} color="#2376B5" />
      )}
    </View>
  );
};

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { customer } = useAuth();
  const { onScrollHandler } = useTabBarVisibility();
  const scrollRef = useRef(null);
  const bannerScrollRef = useRef(null);
  const sectionOffsets = useRef({});

  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const topPad = Math.max(insets.top, TOP_INSET_FALLBACK);
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastY = useRef(0);
  const downFrom = useRef(0);

  const backAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(backAnim, {
      toValue: showBackToTop ? 1 : 0,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [showBackToTop, backAnim]);

  const productsQuery = useQuery({
    queryKey: ['instamart-home-products'],
    queryFn: async () => listFrom(await api.get('/products', { params: { limit: 60 } })),
  });

  const categoriesQuery = useQuery({
    queryKey: ['instamart-home-categories'],
    queryFn: async () =>
      listFrom(await api.get('/categories', { params: { includeSubcategories: 'true' } })),
  });

  const products = productsQuery.data || [];
  const categories = categoriesQuery.data || [];
  const parents = categories.filter((c) => !idOf(c.parentCategory));

  const childrenOf = (parent) => {
    const list = [
      ...(parent.subcategories || []),
      ...categories.filter((c) => idOf(c.parentCategory) === idOf(parent)),
    ];
    return list.filter((c, i) => list.findIndex((x) => idOf(x) === idOf(c)) === i);
  };

  const handleScroll = (event) => {
    onScrollHandler(event);
    const y = Math.max(event.nativeEvent.contentOffset.y, 0);
    const dy = y - lastY.current;
    lastY.current = y;
    if (y < 300) {
      setShowBackToTop(false);
      downFrom.current = y;
      return;
    }
    if (dy > 4) {
      setShowBackToTop(false);
    } else if (dy < -8) {
      setShowBackToTop(true);
    }
  };

  const jumpToParent = (parent) => {
    setActiveCategory(idOf(parent));
    const y = sectionOffsets.current[idOf(parent)];
    if (typeof y === 'number') {
      scrollRef.current?.scrollTo({ y: Math.max(y - 70, 0), animated: true });
    }
  };

  const address = customer?.addresses?.find((a) => a.isDefault) || customer?.addresses?.[0];
  const initial = (customer?.name || customer?.firstName || customer?.fullName || '')
    .trim()
    .charAt(0)
    .toUpperCase();
  const addressLabel = address
    ? [address.street, address.city].filter(Boolean).join(', ') ||
      address.addressLine1 ||
      address.city ||
      address.label ||
      'Home'
    : 'Select delivery address';

  // Build shortcut list
  const shortcutList = useMemo(() => {
    if (parents.length > 0) {
      return parents.map((cat) => {
        const lower = (cat.name || '').toLowerCase().trim();
        let imageSource = LOCAL_CATEGORY_IMAGES[lower];
        if (!imageSource) {
          const matchKey = Object.keys(LOCAL_CATEGORY_IMAGES).find((k) => lower.includes(k));
          if (matchKey) imageSource = LOCAL_CATEGORY_IMAGES[matchKey];
        }
        if (!imageSource && (cat.image || cat.featuredImage)) {
          imageSource = { uri: cat.image || cat.featuredImage };
        }
        if (!imageSource) {
          imageSource = require('../../../assets/images/categories/fruits_veggies.jpg');
        }
        return {
          id: idOf(cat),
          name: cat.name,
          raw: cat,
          imageSource,
        };
      });
    }
    return DEFAULT_SHORTCUTS;
  }, [parents]);

  // Handle active category selection
  const handleSelectShortcut = (item) => {
    if (item.id === 'all') {
      setActiveCategory('all');
      return;
    }
    setActiveCategory(item.id);
    if (item.raw) {
      jumpToParent(item.raw);
    } else if (item.match) {
      scrollRef.current?.scrollTo({ y: sectionOffsets.current.__products || 0, animated: true });
    }
  };

  // Products filtering
  const visibleProducts = useMemo(() => {
    if (activeCategory === 'all') return products;
    const shortcut = shortcutList.find((s) => s.id === activeCategory);
    if (shortcut?.match) {
      return products.filter((p) => new RegExp(shortcut.match, 'i').test(categoryText(p)));
    }
    return products.filter(
      (p) => idOf(p.category) === activeCategory || idOf(p.subcategory) === activeCategory
    );
  }, [activeCategory, products, shortcutList]);

  // Category horizontal sliders
  const categorySliders = useMemo(() => {
    const map = new Map();
    visibleProducts.forEach((p) => {
      const cid = idOf(p.category) || idOf(p.subcategory);
      const key = cid || 'other';
      const title =
        (typeof p.category === 'object' && p.category?.name) ||
        categories.find((c) => idOf(c) === cid)?.name ||
        'More products';
      if (!map.has(key)) map.set(key, { key, title, products: [] });
      map.get(key).products.push(p);
    });
    return [...map.values()];
  }, [visibleProducts, categories]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([productsQuery.refetch(), categoriesQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  };

  const openCategory = (category) => router.push(`/category/${category._id || category.id}`);

  // Collapsing header animations
  const addrHeight = scrollY.interpolate({
    inputRange: [0, 48],
    outputRange: [44, 0],
    extrapolate: 'clamp',
  });
  const addrOpacity = scrollY.interpolate({
    inputRange: [0, 26],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const bannerCardWidth = Math.min(width - 32, 400);
  const bannerCardHeight = Math.round(bannerCardWidth * (645 / 720));

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Pinned / Collapsing Sticky Top Header */}
      <View style={[styles.stickyHeader, { paddingTop: topPad }]}>
        {/* Deliver To Row */}
        <Animated.View
          style={[
            styles.addressRow,
            {
              height: addrHeight,
              opacity: addrOpacity,
              overflow: 'hidden',
            },
          ]}
        >
          <Pressable
            style={styles.addressButton}
            onPress={() => router.push('/addresses')}
            accessibilityRole="button"
            accessibilityLabel="Change delivery location"
          >
            <View style={styles.pinWrapper}>
              <MapPin size={22} color="#111827" strokeWidth={2.4} />
            </View>
            <View style={styles.addressTextCol}>
              <Text style={styles.deliverToLabel}>Deliver to</Text>
              <View style={styles.addressValueRow}>
                <Text style={styles.addressValue} numberOfLines={1}>
                  {addressLabel}
                </Text>
                <ChevronDown size={14} color="#111827" strokeWidth={2.6} style={styles.chevron} />
              </View>
            </View>
          </Pressable>

          <Pressable
            style={styles.avatarButton}
            onPress={() => router.push('/(tabs)/profile')}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
          >
            {initial ? (
              <Text style={styles.avatarInitial}>{initial}</Text>
            ) : (
              <User size={18} color="#111827" strokeWidth={2.2} />
            )}
          </Pressable>
        </Animated.View>

        {/* Search Bar Row */}
        <View style={styles.searchRow}>
          <Pressable
            style={styles.searchBar}
            onPress={() => router.push('/(tabs)/search')}
            accessibilityRole="button"
            accessibilityLabel="Search products"
          >
            <Search size={18} color="#9CA3AF" strokeWidth={2} style={styles.searchIcon} />
            <View style={styles.searchPlaceholderWrap} pointerEvents="none">
              <RotatingSearch words={SEARCH_WORDS} />
            </View>
            <Mic size={18} color="#111827" strokeWidth={2} style={styles.micIcon} />
          </Pressable>
        </View>
      </View>

      {/* Scrollable Content Body */}
      <Animated.ScrollView
        ref={scrollRef}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
          listener: handleScroll,
        })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollBody, { paddingTop: topPad + 104 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#111827"
            colors={['#FFC928', '#111827']}
            progressViewOffset={topPad + 104}
          />
        }
      >
        {/* Elastic pull-down yellow backdrop */}
        <View pointerEvents="none" style={styles.yellowBackdrop} />

        {/* Unified Yellow Hero Section (Categories + Full Banner in ONE continuous section) */}
        <View style={styles.yellowHeroSection}>
          {/* Horizontal Category Shortcuts */}
          <View style={styles.categoryShortcutsSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScrollContent}
            >
              {/* "All" Category Shortcut */}
              <Pressable
                style={styles.categoryItem}
                onPress={() => handleSelectShortcut({ id: 'all' })}
                accessibilityRole="button"
                accessibilityLabel="All products"
              >
                <View
                  style={[
                    styles.categoryTile,
                    activeCategory === 'all' && styles.categoryTileActive,
                  ]}
                >
                  <ShoppingBasket size={24} color="#D97706" strokeWidth={2} />
                </View>
                <Text
                  style={[
                    styles.categoryLabel,
                    activeCategory === 'all' && styles.categoryLabelActive,
                  ]}
                  numberOfLines={2}
                >
                  All
                </Text>
                <View
                  style={[
                    styles.activeIndicator,
                    activeCategory === 'all' && styles.activeIndicatorVisible,
                  ]}
                />
              </Pressable>

              {/* Dynamic Category Shortcuts */}
              {shortcutList.map((cat) => {
                const isSelected = activeCategory === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    style={styles.categoryItem}
                    onPress={() => handleSelectShortcut(cat)}
                    accessibilityRole="button"
                    accessibilityLabel={cat.name}
                  >
                    <View style={[styles.categoryTile, isSelected && styles.categoryTileActive]}>
                      <Image
                        source={cat.imageSource}
                        style={styles.categoryTileImage}
                        contentFit="cover"
                      />
                    </View>
                    <Text
                      style={[styles.categoryLabel, isSelected && styles.categoryLabelActive]}
                      numberOfLines={2}
                    >
                      {formatCategoryLabel(cat.name)}
                    </Text>
                    <View
                      style={[
                        styles.activeIndicator,
                        isSelected && styles.activeIndicatorVisible,
                      ]}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Full Marketing Banner Carousel (No text write, full banner image, dots inside) */}
          <View style={styles.bannerCarouselSection}>
            <ScrollView
              ref={bannerScrollRef}
              horizontal
              pagingEnabled
              decelerationRate="fast"
              snapToInterval={bannerCardWidth + 12}
              snapToAlignment="start"
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bannerScrollContent}
              onMomentumScrollEnd={(e) => {
                const offsetX = e.nativeEvent.contentOffset.x;
                const idx = Math.round(offsetX / (bannerCardWidth + 12));
                if (idx >= 0 && idx < PROMO_BANNERS.length) {
                  setActiveBannerIndex(idx);
                }
              }}
            >
              {PROMO_BANNERS.map((banner) => (
                <Pressable
                  key={banner.id}
                  style={[
                    styles.bannerCard,
                    { width: bannerCardWidth, height: bannerCardHeight },
                  ]}
                  onPress={() => router.push('/(tabs)/search')}
                  accessibilityRole="button"
                  accessibilityLabel={banner.id}
                >
                  <Image
                    source={banner.image}
                    style={styles.bannerFullImage}
                    contentFit="cover"
                  />

                  {/* Pagination Dots INSIDE the Banner at Bottom-Left */}
                  <View style={styles.bannerInnerDots}>
                    {PROMO_BANNERS.map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.innerDot,
                          activeBannerIndex === i && styles.innerDotActive,
                        ]}
                      />
                    ))}
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Loading and Error States */}
        {categoriesQuery.isLoading && <ActivityIndicator color="#111827" style={styles.loading} />}
        {categoriesQuery.isError && (
          <View style={styles.state}>
            <Text style={styles.stateText}>Couldn't load categories.</Text>
            <Pressable onPress={() => categoriesQuery.refetch()}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {/* Parent Categories Grid & Sections */}
        {parents.length > 0 && (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.parentSlider}
            >
              {parents.map((parent) => (
                <Pressable
                  key={idOf(parent)}
                  onPress={() => jumpToParent(parent)}
                  style={styles.parentTile}
                  accessibilityRole="button"
                  accessibilityLabel={`Browse ${parent.name}`}
                  accessibilityState={{ selected: activeCategory === idOf(parent) }}
                >
                  <View
                    style={[
                      styles.parentArt,
                      activeCategory === idOf(parent) && styles.parentArtActive,
                    ]}
                  >
                    <CategoryArt category={parent} products={products} />
                  </View>
                  <Text
                    style={[
                      styles.categoryName,
                      activeCategory === idOf(parent) && styles.parentLabelActive,
                    ]}
                    numberOfLines={2}
                  >
                    {parent.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {parents.map((parent) => {
              const children = childrenOf(parent);
              const tiles = children.length ? children : [parent];
              return (
                <View
                  key={idOf(parent)}
                  onLayout={(e) => {
                    sectionOffsets.current[idOf(parent)] = e.nativeEvent.layout.y;
                  }}
                >
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{parent.name}</Text>
                  </View>
                  <View style={styles.categoryGrid}>
                    {tiles.map((c) => (
                      <Pressable
                        key={idOf(c)}
                        style={styles.category}
                        onPress={() => openCategory(c)}
                        accessibilityRole="button"
                        accessibilityLabel={`Shop ${c.name}`}
                      >
                        <CategoryArt category={c} products={products} />
                        <Text style={styles.categoryName} numberOfLines={3}>
                          {c.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* Section Header: Top deals / bestseller picks */}
        <View
          onLayout={(e) => {
            sectionOffsets.current.__products = e.nativeEvent.layout.y;
          }}
          style={styles.sectionHeader}
        >
          <Text style={styles.sectionTitle}>
            {activeCategory === 'all' ? 'Top deals on bestsellers' : 'Selected Category Picks'}
          </Text>
          <Pressable onPress={() => router.push('/(tabs)/search')} style={styles.seeAll}>
            <Text style={styles.seeAllText}>See All</Text>
            <ChevronRight size={14} color="#111827" />
          </Pressable>
        </View>

        {productsQuery.isLoading && <ActivityIndicator color="#111827" style={styles.loading} />}
        {productsQuery.isError && (
          <View style={styles.state}>
            <Text style={styles.stateTitle}>Couldn't load your store</Text>
            <Text style={styles.stateText}>Check your connection and try again.</Text>
            <Pressable onPress={onRefresh}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        )}
        {!productsQuery.isLoading && !productsQuery.isError && !visibleProducts.length && (
          <View style={styles.state}>
            <Text style={styles.stateText}>No products in this collection yet.</Text>
            <Pressable onPress={() => setActiveCategory('all')}>
              <Text style={styles.retryText}>Browse all products</Text>
            </Pressable>
          </View>
        )}

        {/* Category Products Sliders */}
        {categorySliders.map((section) => (
          <View key={section.key} style={styles.sliderSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle} numberOfLines={1}>
                {section.title}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalProductsContent}
            >
              {section.products.map((p, idx) => (
                <ProductCard key={p._id || p.slug || idx} product={p} compact />
              ))}
            </ScrollView>
          </View>
        ))}

        {visibleProducts.length > 0 && (
          <Pressable
            style={styles.fullSeeAll}
            onPress={() => router.push('/(tabs)/search')}
            accessibilityRole="button"
          >
            <Text style={styles.fullSeeAllText}>See All »</Text>
          </Pressable>
        )}
      </Animated.ScrollView>

      {/* Back To Top Floating Pill */}
      <Animated.View
        pointerEvents={showBackToTop ? 'box-none' : 'none'}
        style={[
          styles.backTopWrap,
          {
            top: topPad + 112,
            opacity: backAnim,
            transform: [
              {
                translateY: backAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-14, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Pressable
          style={styles.backTop}
          onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
          accessibilityRole="button"
          accessibilityLabel="Back to top"
        >
          <ChevronUp size={16} color="#fff" />
          <Text style={styles.backTopText}>Back to top</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollBody: {
    paddingBottom: 120,
  },
  yellowBackdrop: {
    position: 'absolute',
    top: -500,
    left: 0,
    right: 0,
    height: 500,
    backgroundColor: HEADER_YELLOW,
  },

  /* Sticky Top Header */
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    backgroundColor: HEADER_YELLOW,
    paddingBottom: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  addressButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  pinWrapper: {
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  deliverToLabel: {
    fontSize: 11,
    color: '#374151',
    fontFamily: typography.family.medium,
    lineHeight: 14,
  },
  addressValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  addressValue: {
    fontSize: 14,
    color: '#111827',
    fontFamily: typography.family.bold,
    fontWeight: '700',
    maxWidth: '85%',
  },
  chevron: {
    marginLeft: 3,
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  avatarInitial: {
    fontSize: 15,
    color: '#111827',
    fontFamily: typography.family.bold,
    fontWeight: '800',
  },

  /* Search Bar */
  searchRow: {
    paddingHorizontal: 16,
    paddingTop: 2,
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchPlaceholderWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#9CA3AF',
    fontSize: 13.5,
    fontFamily: typography.family.regular,
  },
  micIcon: {
    marginLeft: 8,
  },

  /* Unified Yellow Hero Section */
  yellowHeroSection: {
    backgroundColor: HEADER_YELLOW,
    paddingTop: 4,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  /* Category Shortcuts */
  categoryShortcutsSection: {
    paddingBottom: 14,
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
    gap: 14,
    alignItems: 'flex-start',
  },
  categoryItem: {
    alignItems: 'center',
    width: 58,
  },
  categoryTile: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  categoryTileActive: {
    backgroundColor: '#FFFFFF',
  },
  categoryTileImage: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  categoryLabel: {
    fontSize: 10.5,
    lineHeight: 13,
    color: '#111827',
    fontFamily: typography.family.medium,
    textAlign: 'center',
    marginTop: 6,
    minHeight: 26,
  },
  categoryLabelActive: {
    fontFamily: typography.family.bold,
    fontWeight: '700',
  },
  activeIndicator: {
    width: 22,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
    marginTop: 4,
  },
  activeIndicatorVisible: {
    backgroundColor: '#111827',
  },

  /* Full Marketing Banner Carousel */
  bannerCarouselSection: {
    marginTop: 2,
  },
  bannerScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  bannerCard: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#FFF5D6',
    position: 'relative',
  },
  bannerFullImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  bannerInnerDots: {
    position: 'absolute',
    bottom: 14,
    left: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    zIndex: 10,
  },
  innerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  innerDotActive: {
    width: 18,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFC928',
  },

  /* Store Products and Parent Categories */
  parentSlider: {
    paddingHorizontal: 14,
    paddingVertical: 18,
    gap: 10,
  },
  parentTile: {
    width: 88,
    gap: 8,
    alignItems: 'center',
  },
  parentArt: {
    width: 80,
    height: 80,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  parentArtActive: {
    borderColor: '#111827',
    transform: [{ translateY: -3 }],
  },
  parentLabelActive: {
    color: '#111827',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 18,
    color: '#111827',
    fontFamily: typography.family.bold,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    color: '#111827',
    fontSize: 12,
    fontFamily: typography.family.medium,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  category: {
    width: '25%',
    padding: 4,
    alignItems: 'center',
    gap: 7,
    marginBottom: 12,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryArt: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  categoryName: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    color: '#111827',
    fontFamily: typography.family.bold,
    paddingTop: 6,
  },
  sliderSection: {
    marginBottom: 8,
  },
  horizontalProductsContent: {
    paddingHorizontal: 16,
  },
  fullSeeAll: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFF9E8',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFC928',
  },
  fullSeeAllText: {
    color: '#B45309',
    fontSize: 15,
    fontFamily: typography.family.bold,
  },
  loading: {
    margin: 24,
  },
  state: {
    padding: 24,
    gap: 10,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  stateText: {
    color: '#6B7280',
    fontSize: 13,
  },
  retryText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },

  /* Back to Top */
  backTopWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 60,
  },
  backTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#111827',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  backTopText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: typography.family.medium,
  },
});
