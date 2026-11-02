import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import {
  Search,
  ArrowRight,
  ShoppingBasket,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  User,
  MapPin,
  Heart,
  LayoutGrid,
  Headphones
} from 'lucide-react-native';
import { colors, typography } from '../../constants/theme';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTabBarVisibility } from '../../context/TabBarVisibilityContext';
import { ProductCard } from '../../components/product/ProductCard';
import { QuickAddressSheet } from '../../components/address/QuickAddressSheet';
import { TypewriterSearch } from '../../components/TypewriterSearch';
import { HeaderMandalaBg } from '../../components/home/HeaderMandalaBg';
import { haptics } from '../../services/haptics';

const TOP_INSET_FALLBACK = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 28) : 44;
const HEADER_YELLOW = '#FFF4C7';

const LOCAL_CATEGORY_IMAGES = {
  'fruits & vegetables': require('../../../assets/images/categories/fresh_tomato.jpg'),
  'fruits and vegetables': require('../../../assets/images/categories/fresh_tomato.jpg'),
  'fruits': require('../../../assets/images/categories/fresh_tomato.jpg'),
  'vegetables': require('../../../assets/images/categories/fresh_tomato.jpg'),
  'fresh': require('../../../assets/images/categories/fresh_tomato.jpg'),
  'diwali': require('../../../assets/images/diwali/diwali_diyas.jpg'),
  'gifts': require('../../../assets/images/diwali/diwali_gifting.jpg'),
  'dairy & eggs': require('../../../assets/images/categories/dairy_milk.jpg'),
  'dairy and eggs': require('../../../assets/images/categories/dairy_milk.jpg'),
  'dairy': require('../../../assets/images/categories/dairy_milk.jpg'),
  'milk': require('../../../assets/images/categories/dairy_milk.jpg'),
  'atta, rice & flours': require('../../../assets/images/categories/atta_rice_dal.jpg'),
  'atta, rice & dal': require('../../../assets/images/categories/atta_rice_dal.jpg'),
  'organic': require('../../../assets/images/categories/atta_rice_dal.jpg'),
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

const REFERENCE_SHORTCUTS = [
  {
    id: 'all',
    name: 'All',
    iconType: 'grid',
    isAll: true,
  },
  {
    id: 'fresh',
    name: 'Fresh',
    imageSource: require('../../../assets/images/categories/fresh_tomato.jpg'),
    match: 'fruit|veg|fresh|produce',
  },
  {
    id: 'diwali',
    name: 'Diwali',
    imageSource: require('../../../assets/images/diwali/diwali_diyas.jpg'),
    isDiwali: true,
    match: 'diwali|festive|pooja|puja|gift|sweet',
  },
  {
    id: 'electronics',
    name: 'Electronics',
    iconType: 'headphones',
    match: 'electronic|appliance|gadget|phone|mobile',
  },
  {
    id: 'organic',
    name: 'Organic',
    imageSource: require('../../../assets/images/categories/atta_rice_dal.jpg'),
    match: 'organic|grain|atta|rice|dal|staple|flour',
  },
  {
    id: 'gifts',
    name: 'Gifts',
    imageSource: require('../../../assets/images/diwali/diwali_gifting.jpg'),
    match: 'gift|hamper|box',
  },
];

const DIWALI_BANNER_SLIDES = [
  {
    id: 'diwali_slide_1',
    preheading: 'CELEBRATE',
    heading: 'Diwali',
    subtitle: 'Everything you need\nfor a brighter celebration',
    buttonText: 'Shop Now',
    image: require('../../../assets/images/diwali/diwali_banner.jpg'),
    match: 'diwali|festive',
    query: 'Diwali',
  },
  {
    id: 'diwali_slide_2',
    preheading: 'FESTIVE DELIGHTS',
    heading: 'Sweets & Treats',
    subtitle: 'Pure ghee mithai & gift hampers\nat festive prices',
    buttonText: 'Shop Sweets',
    image: require('../../../assets/images/diwali/diwali_banner_2.jpg'),
    match: 'sweet|mithai|dry.*fruit|hamper',
    query: 'Diwali Sweets',
  },
  {
    id: 'diwali_slide_3',
    preheading: 'LIGHT UP YOUR HOME',
    heading: 'Diyas & Decor',
    subtitle: 'Handcrafted earthen diyas\n& traditional decoration',
    buttonText: 'Explore Decor',
    image: require('../../../assets/images/diwali/diwali_banner_3.jpg'),
    match: 'diya|decor|light|rangoli',
    query: 'Diyas and Decorations',
  },
];

const DIWALI_CATEGORY_CARDS = [
  {
    key: 'gifting',
    name: 'Gifting',
    image: require('../../../assets/images/diwali/diwali_gifting.jpg'),
    match: 'gift|hamper|box',
    query: 'Diwali Gifting',
  },
  {
    key: 'pooja',
    name: 'Pooja\nessentials',
    image: require('../../../assets/images/diwali/diwali_pooja.jpg'),
    match: 'pooja|puja|incense|agarbatti|hawan',
    query: 'Pooja Essentials',
  },
  {
    key: 'diyas',
    name: 'Diyas &\ndecorations',
    image: require('../../../assets/images/diwali/diwali_diyas.jpg'),
    match: 'diya|decor|light|rangoli|candle',
    query: 'Diyas and Decorations',
  },
  {
    key: 'sweets',
    name: 'Sweets &\nDry fruits',
    image: require('../../../assets/images/diwali/diwali_sweets.jpg'),
    match: 'sweet|mithai|dry.*fruit|kaju|badam|pista',
    query: 'Sweets and Dry Fruits',
  },
  {
    key: 'festive_ready',
    name: 'Festive ready',
    image: require('../../../assets/images/diwali/diwali_festive_ready.jpg'),
    match: 'festive|cloth|wear|fashion|ethnic|kurta',
    query: 'Festive Ready',
  },
  {
    key: 'home_essentials',
    name: 'Home\nessentials',
    image: require('../../../assets/images/diwali/diwali_home_essentials.jpg'),
    match: 'home|electronic|appliance|clean|purifier',
    query: 'Home Essentials',
  },
];


const DiwaliBannerCarousel = React.memo(({ width, slides, onSlidePress }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef(null);
  const isInteracting = useRef(false);
  const activeIndexRef = useRef(0);
  const bannerHeight = Math.round(width * 0.65);

  useEffect(() => {
    const timer = setInterval(() => {
      if (isInteracting.current) return;
      const next = (activeIndexRef.current + 1) % slides.length;
      activeIndexRef.current = next;
      setActiveSlide(next);
      carouselRef.current?.scrollTo({ x: next * width, animated: true });
    }, 4500);

    return () => clearInterval(timer);
  }, [width, slides.length]);

  const handleMomentumScrollEnd = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    activeIndexRef.current = idx;
    setActiveSlide(idx);
    isInteracting.current = false;
  };

  const updateSlideFromOffset = (e) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.max(0, Math.min(slides.length - 1, Math.round(x / width)));
    activeIndexRef.current = idx;
    setActiveSlide(idx);
    isInteracting.current = false;
  };

  return (
    <View style={[styles.diwaliCarouselBox, { width, height: bannerHeight }]}>
      <ScrollView
        ref={carouselRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled={true}
        overScrollMode="never"
        bounces={false}
        scrollEventThrottle={16}
        onTouchStart={() => { isInteracting.current = true; }}
        onTouchEnd={() => { setTimeout(() => { isInteracting.current = false; }, 2500); }}
        onMomentumScrollEnd={updateSlideFromOffset}
        onScrollEndDrag={updateSlideFromOffset}
      >
        {slides.map((slide) => (
          <Pressable
            key={slide.id}
            style={[styles.diwaliSlide, { width, height: bannerHeight }]}
            onPress={() => onSlidePress(slide)}
            accessibilityRole="button"
            accessibilityLabel={`${slide.preheading} ${slide.heading} - ${slide.subtitle.replace('\n', ' ')}`}
          >
            {/* Background Image: Full width & height explicit style */}
            <Image
              source={slide.image}
              style={styles.diwaliSlideBgImage}
              contentFit="cover"
            />

            {/* Gentle gradient overlay preserving fireworks & lanterns on left/right while ensuring center text readability */}
            <LinearGradient
              colors={['transparent', 'rgba(35, 4, 62, 0.15)', 'rgba(35, 4, 62, 0.35)']}
              style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.diwaliSlideContent}>
              <Text style={styles.diwaliPreheading}>{slide.preheading}</Text>
              <Text style={styles.diwaliMainHeading}>{slide.heading}</Text>
              <Text style={styles.diwaliSubtitle}>{slide.subtitle}</Text>

              <View style={styles.shopNowBtn}>
                <Text style={styles.shopNowText}>{slide.buttonText}</Text>
                <ArrowRight size={15} color="#111827" strokeWidth={2.4} />
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* Pagination Dots Row */}
      <View style={styles.diwaliDotsRowOverlay} pointerEvents="box-none">
        {slides.map((_, idx) => (
          <Pressable
            key={idx}
            onPress={() => {
              haptics.selection();
              activeIndexRef.current = idx;
              setActiveSlide(idx);
              carouselRef.current?.scrollTo({ x: idx * width, animated: true });
            }}
            hitSlop={8}
            style={[
              styles.diwaliDot,
              activeSlide === idx && styles.diwaliDotActive
            ]}
          />
        ))}
      </View>
    </View>
  );
});

const SHOP_BY_CATEGORY_ITEMS = [
  {
    key: 'fruits-veg',
    name: 'Fruits &\nVegetables',
    match: 'fruit|vegetable',
    imageSource: require('../../../assets/images/categories/fresh_tomato.jpg'),
  },
  {
    key: 'dairy-eggs',
    name: 'Dairy &\nEggs',
    match: 'dairy|milk|egg|curd|paneer|butter|cheese',
    imageSource: require('../../../assets/images/categories/dairy_milk.jpg'),
  },
  {
    key: 'atta-rice',
    name: 'Atta, Rice\n& Grains',
    match: 'atta|rice|grain|flour|staple|daal|pulse',
    imageSource: require('../../../assets/images/categories/atta_rice_dal.jpg'),
  },
  {
    key: 'oils-ghee',
    name: 'Oils &\nGhee',
    match: 'oil|ghee|mustard|sunflower|edible oil',
    imageSource: { uri: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop&q=80' },
  },
  {
    key: 'spices',
    name: 'Masala &\nSpices',
    match: 'spice|masala|salt|sugar|chilli|turmeric',
    imageSource: require('../../../assets/images/categories/masala_spices.jpg'),
  },
  {
    key: 'snacks-bev',
    name: 'Snacks &\nBeverages',
    match: 'snack|beverage|drink|chips|biscuit|tea|coffee|juice',
    imageSource: require('../../../assets/images/categories/snacks_beverages.jpg'),
  },
  {
    key: 'personal-care',
    name: 'Personal\nCare',
    match: 'personal|care|soap|shampoo|skin|hair|cream',
    imageSource: require('../../../assets/images/categories/personal_care.jpg'),
  },
  {
    key: 'household',
    name: 'Household\nEssentials',
    match: 'household|clean|wash|detergent|surface',
    imageSource: { uri: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400&auto=format&fit=crop&q=80' },
  },
];


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
  const sectionOffsets = useRef({});

  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [addressSheetVisible, setAddressSheetVisible] = useState(false);
  const [addressOpening, setAddressOpening] = useState(false);


  const handleDiwaliSlidePress = (slide) => {
    haptics.selection();
    const diwaliCat = categories.find((c) => new RegExp(slide.match, 'i').test(c.name || '')) ||
                      parents.find((p) => new RegExp(slide.match, 'i').test(p.name || ''));
    const catId = diwaliCat?._id || diwaliCat?.id;
    if (catId) {
      router.push(`/category/${catId}`);
    } else {
      router.push({ pathname: '/(tabs)/search', params: { q: slide.query } });
    }
  };

  const handleOpenAddress = () => {
    haptics.selection();
    setAddressOpening(true);
    setAddressSheetVisible(true);
  };

  const topPad = Math.max(insets.top, TOP_INSET_FALLBACK);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [headerHeight, setHeaderHeight] = useState(190);
  const upScrollAccumulator = useRef(0);
  const downScrollAccumulator = useRef(0);
  const lastScrollY = useRef(0);

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
    const dy = y - lastScrollY.current;
    lastScrollY.current = y;

    // When user reaches near the banner or top of page, always hide Back to top
    if (y < 350) {
      setShowBackToTop(false);
      downScrollAccumulator.current = 0;
      return;
    }

    if (dy < -3) {
      // User is scrolling UP: show Back to top immediately!
      setShowBackToTop(true);
      downScrollAccumulator.current = 0;
    } else if (dy > 6) {
      // User is scrolling DOWN: accumulate down scroll before hiding to prevent flicker
      downScrollAccumulator.current += dy;
      if (downScrollAccumulator.current > 70) {
        setShowBackToTop(false);
      }
    }
  };

  const scrollToOffset = useCallback((y, animated = true) => {
    const node = scrollRef.current?.getNode ? scrollRef.current.getNode() : (scrollRef.current?._component || scrollRef.current);
    node?.scrollTo?.({ y, animated });
  }, []);

  const jumpToParent = (parent) => {
    setActiveCategory(idOf(parent));
    const y = sectionOffsets.current[idOf(parent)];
    if (typeof y === 'number') {
      scrollToOffset(Math.max(y - 70, 0));
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

  // Build shortcut list: Reference categories enriched with real backend parents
  const shortcutList = useMemo(() => {
    const list = REFERENCE_SHORTCUTS.map((refItem) => ({ ...refItem }));

    if (parents.length > 0) {
      parents.forEach((p) => {
        const pName = (p.name || '').toLowerCase().trim();
        const matched = list.find((item) => item.match && new RegExp(item.match, 'i').test(pName));
        if (matched) {
          if (!matched.raw) {
            matched.raw = p;
            matched.backendId = idOf(p);
          }
        } else {
          let imageSource = (p.image || p.featuredImage) ? { uri: p.image || p.featuredImage } : null;
          if (!imageSource) {
            const matchKey = Object.keys(LOCAL_CATEGORY_IMAGES).find((k) => pName.includes(k));
            imageSource = matchKey ? LOCAL_CATEGORY_IMAGES[matchKey] : require('../../../assets/images/categories/atta_rice_dal.jpg');
          }
          list.push({
            id: idOf(p),
            name: p.name,
            raw: p,
            backendId: idOf(p),
            imageSource,
          });
        }
      });
    }
    return list;
  }, [parents]);

  // Handle active category selection
  const handleSelectShortcut = (item) => {
    haptics.selection();
    if (item.id === 'all') {
      setActiveCategory('all');
      return;
    }
    if (item.id === 'diwali' || item.isDiwali) {
      setActiveCategory('diwali');
      scrollToOffset(0);
      return;
    }
    setActiveCategory(item.id);
    if (item.raw) {
      jumpToParent(item.raw);
    } else if (item.backendId) {
      const p = parents.find((x) => idOf(x) === item.backendId);
      if (p) jumpToParent(p);
    } else if (item.match) {
      scrollToOffset(sectionOffsets.current.__products || 0);
    }
  };

  const handleDiwaliCardPress = (card) => {
    haptics.selection();
    const matchedCat = categories.find((c) => new RegExp(card.match, 'i').test(c.name || '')) ||
                       parents.find((p) => new RegExp(card.match, 'i').test(p.name || ''));
    const catId = matchedCat?._id || matchedCat?.id;
    if (catId) {
      router.push(`/category/${catId}`);
    } else {
      router.push({
        pathname: '/(tabs)/search',
        params: { q: card.query }
      });
    }
  };

  // Products filtering
  const visibleProducts = useMemo(() => {
    if (activeCategory === 'all') return products;
    if (activeCategory === 'diwali') {
      const diwaliMatches = products.filter((p) =>
        /diwali|festive|pooja|sweet|dry.*fruit|diya|candle|gift/i.test(categoryText(p))
      );
      return diwaliMatches.length ? diwaliMatches : products;
    }
    const shortcut = shortcutList.find((s) => s.id === activeCategory);
    if (shortcut?.match) {
      const matched = products.filter((p) => new RegExp(shortcut.match, 'i').test(categoryText(p)));
      if (matched.length) return matched;
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
      const timeout = new Promise((resolve) => setTimeout(resolve, 2500));
      await Promise.race([
        Promise.all([productsQuery.refetch(), categoriesQuery.refetch()]),
        timeout,
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const openCategory = (category) => router.push(`/category/${category._id || category.id}`);

  const headerBorderColor = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: ['rgba(229, 169, 0, 0.08)', 'rgba(229, 169, 0, 0.28)'],
    extrapolate: 'clamp',
  });

  
  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Pinned Top Status Bar Filler (Always light yellow with mandala, pins behind system status bar) */}
      <View style={[styles.statusBarFiller, { height: topPad }]} pointerEvents="none" />

      {/* Native Zero-Lag ScrollView with stickyHeaderIndices={[0]} */}
      <Animated.ScrollView
        ref={scrollRef}
        stickyHeaderIndices={[0]}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
          listener: handleScroll,
        })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={[styles.mainScrollView, { marginTop: topPad }]}
        contentContainerStyle={styles.scrollBody}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#111827"
            colors={['#FFC928', '#111827']}
            progressViewOffset={10}
          />
        }
      >
        {/* INDEX 0: Entire Unified Sticky Header (Deliver To + Search Bar + Category Navigation) */}
        <Animated.View
            onLayout={(e) => {
              const h = Math.round(e.nativeEvent.layout.height);
              if (h > 0) setHeaderHeight(h);
            }}
            style={[styles.unifiedHeaderBox, { borderBottomColor: headerBorderColor }]}
          >
          <HeaderMandalaBg width={240} height={220} />

          {/* Row 1: Deliver To / Location & Profile Avatar */}
          <View style={styles.addressRow}>
            <Pressable
              style={({ pressed }) => [
                styles.addressButton,
                (pressed || addressOpening) && styles.addressButtonPressed
              ]}
              onPress={handleOpenAddress}
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
                  {addressOpening ? (
                    <ActivityIndicator size="small" color="#111827" style={styles.addressSpinner} />
                  ) : (
                    <ChevronDown size={14} color="#111827" strokeWidth={2.6} style={styles.chevron} />
                  )}
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
          </View>

          {/* Row 2: Search Bar & Wishlist */}
          <View style={styles.searchRow}>
            <Pressable
              style={styles.searchBar}
              onPress={() => {
                haptics.selection();
                router.push('/(tabs)/search');
              }}
              accessibilityRole="button"
              accessibilityLabel="Search products"
            >
              <Search size={18} color="#9CA3AF" strokeWidth={2} style={styles.searchIcon} />
              <View style={styles.searchPlaceholderWrap} pointerEvents="none">
                <TypewriterSearch
                  prefix="Search "
                  keywords={['groceries', 'aata', 'fresh milk', 'farm veggies', 'sweets & gifts', 'pure ghee']}
                  style={styles.placeholderText}
                />
              </View>
            </Pressable>

            <Pressable
              style={styles.wishlistBtn}
              onPress={() => {
                haptics.selection();
                router.push('/wishlist');
              }}
              accessibilityRole="button"
              accessibilityLabel="View Wishlist"
            >
              <Heart size={20} color="#111827" strokeWidth={2} />
            </Pressable>
          </View>

          {/* Row 3: Category Navigation */}
          <View style={styles.categoryNavRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryNavContent}
            >
              {shortcutList.map((cat) => {
                const isSelected = activeCategory === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    style={styles.categoryNavItem}
                    onPress={() => handleSelectShortcut(cat)}
                    accessibilityRole="button"
                    accessibilityLabel={cat.name}
                  >
                    <View
                      style={[
                        styles.categoryNavPill,
                        isSelected && styles.categoryNavPillActive,
                      ]}
                    >
                      {cat.iconType === 'grid' ? (
                        <LayoutGrid size={24} color="#D97706" strokeWidth={2.2} />
                      ) : cat.iconType === 'headphones' ? (
                        <Headphones size={24} color="#7C3AED" strokeWidth={2.2} />
                      ) : (
                        <Image
                          source={cat.imageSource}
                          style={styles.categoryNavIconImg}
                          contentFit="contain"
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.categoryNavLabel,
                        isSelected && styles.categoryNavLabelActive,
                      ]}
                      numberOfLines={1}
                    >
                      {cat.name.replace('\n', ' ')}
                    </Text>
                    <View
                      style={[
                        styles.categoryNavUnderline,
                        isSelected && styles.categoryNavUnderlineActive,
                      ]}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Animated.View>

        {/* Diwali Festive Section: 100% Full-Width Banner Carousel + 6 Category Cards */}
        <View style={styles.diwaliSectionWrapper}>
          {/* 100% Full-Width Smooth Banner Carousel (Height: 280, Jitter-Free) */}
          <DiwaliBannerCarousel
            width={width}
            slides={DIWALI_BANNER_SLIDES}
            onSlidePress={handleDiwaliSlidePress}
          />

          {/* 6 Category Cards in 3 Columns x 2 Rows directly below the banner */}
          <View style={styles.diwaliCardsGridSection}>
            {DIWALI_CATEGORY_CARDS.map((card) => (
              <Pressable
                key={card.key}
                style={({ pressed }) => [
                  styles.diwaliCard,
                  pressed && styles.diwaliCardPressed,
                ]}
                onPress={() => handleDiwaliCardPress(card)}
                accessibilityRole="button"
                accessibilityLabel={`Shop ${card.name.replace('\n', ' ')}`}
              >
                <Text style={styles.diwaliCardTitle} numberOfLines={2}>
                  {card.name}
                </Text>
                <View style={styles.diwaliCardImgWrap}>
                  <Image
                    source={card.image}
                    style={styles.diwaliCardImg}
                    contentFit="contain"
                  />
                </View>
              </Pressable>
            ))}
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
            {/* Shop by Category Grid (Exact Reference UI: 4 Columns x 2 Rows) */}
            <View style={styles.shopByCategorySection}>
              <View style={styles.shopByCategoryHeader}>
                <Text style={styles.shopByCategoryTitle}>Shop by Category</Text>
                <Pressable
                  onPress={() => {
                    haptics.selection();
                    router.push('/(tabs)/category');
                  }}
                  style={styles.viewAllBtn}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="View all categories"
                >
                  <Text style={styles.viewAllText}>View All</Text>
                  <ArrowRight size={13} color="#111827" strokeWidth={2.5} />
                </Pressable>
              </View>

              <View style={styles.shopByCategoryGrid}>
                {SHOP_BY_CATEGORY_ITEMS.map((item) => {
                  const realCat =
                    categories.find((c) => new RegExp(item.match, 'i').test(c.name || '')) ||
                    parents.find((p) => new RegExp(item.match, 'i').test(p.name || ''));

                  const catId = realCat?._id || realCat?.id;
                  const imageSource = realCat?.image
                    ? { uri: realCat.image }
                    : realCat?.featuredImage
                    ? { uri: realCat.featuredImage }
                    : item.imageSource;

                  return (
                    <Pressable
                      key={item.key}
                      style={styles.shopCategoryItem}
                      onPress={() => {
                        haptics.selection();
                        if (catId) {
                          router.push(`/category/${catId}`);
                        } else if (parents[0]?._id) {
                          router.push(`/category/${parents[0]._id}`);
                        } else {
                          router.push('/(tabs)/search');
                        }
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Shop ${item.name.replace('\n', ' ')}`}
                    >
                      <View style={styles.shopCategoryCard}>
                        <Image
                          source={imageSource}
                          style={styles.shopCategoryCardImg}
                          contentFit="contain"
                        />
                      </View>
                      <Text style={styles.shopCategoryLabel} numberOfLines={2}>
                        {item.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

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

      {/* Back To Top Floating Pill - Pins directly below the sticky search bar */}
      <Animated.View
        pointerEvents={showBackToTop ? 'auto' : 'none'}
        style={[
          styles.backTopWrap,
          {
            top: topPad + headerHeight + 8,
            opacity: backAnim,
            transform: [
              {
                translateY: backAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-12, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Pressable
          style={styles.backTop}
          onPress={() => {
            haptics.selection();
            setShowBackToTop(false);
            scrollToOffset(0);
          }}
          accessibilityRole="button"
          accessibilityLabel="Back to top"
        >
          <ChevronUp size={15} color="#FFC928" strokeWidth={2.6} />
          <Text style={styles.backTopText}>Back to top</Text>
        </Pressable>
      </Animated.View>

      {/* Quick Delivery Address Bottom Sheet */}
      <QuickAddressSheet
        visible={addressSheetVisible}
        onClose={() => {
          setAddressSheetVisible(false);
          setAddressOpening(false);
        }}
      />
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
    backgroundColor: '#FFFFFF',
  },
  yellowBackdrop: {
    position: 'absolute',
    top: -500,
    left: 0,
    right: 0,
    height: 500,
    backgroundColor: HEADER_YELLOW,
  },

  statusBarFiller: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF4C7',
    zIndex: 100,
    overflow: 'hidden',
  },
  mainScrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  unifiedHeaderBox: {
    backgroundColor: '#FFF4C7',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 169, 0, 0.18)',
    zIndex: 50,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    overflow: 'hidden',
    paddingTop: 6,
    paddingBottom: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  addressButtonPressed: {
    opacity: 0.82,
  },
  addressSpinner: {
    marginLeft: 4,
    transform: [{ scale: 0.72 }],
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
    color: '#4B5563',
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
    borderColor: '#E5E7EB',
  },
  avatarInitial: {
    fontSize: 15,
    color: '#111827',
    fontFamily: typography.family.bold,
    fontWeight: '800',
  },

  /* Search Bar & Wishlist Row */
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  searchBar: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderWidth: 1.2,
    borderColor: '#FFE082',
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
  wishlistBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Horizontal Category Navigation */
  categoryNavRow: {
    height: 82,
    paddingBottom: 4,
  },
  categoryNavContent: {
    paddingHorizontal: 16,
    gap: 12,
    alignItems: 'center',
  },
  categoryNavItem: {
    alignItems: 'center',
    width: 58,
  },
  categoryNavPill: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  categoryNavPillActive: {
    backgroundColor: '#FFEBA3',
  },
  categoryNavIconImg: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  categoryNavLabel: {
    fontFamily: typography.family.medium,
    fontSize: 11,
    color: '#374151',
    marginTop: 3,
    textAlign: 'center',
  },
  categoryNavLabelActive: {
    fontFamily: typography.family.bold,
    color: '#111827',
    fontWeight: '700',
  },
  categoryNavUnderline: {
    width: 24,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'transparent',
    marginTop: 3,
  },
  categoryNavUnderlineActive: {
    backgroundColor: '#E5A900',
  },

  /* Diwali Festive Section (100% Full Width Banner Carousel + 6 Cards) */
  diwaliSectionWrapper: {
    width: '100%',
    backgroundColor: '#35065C',
    marginBottom: 16,
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  diwaliCarouselBox: {
    height: 282,
    position: 'relative',
    backgroundColor: '#35065C',
  },
  diwaliSlide: {
    height: 282,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  diwaliSlideBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  diwaliSlideContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    zIndex: 2,
    marginTop: 4,
  },
  diwaliPreheading: {
    fontFamily: typography.family.bold,
    fontSize: 12,
    letterSpacing: 3,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  diwaliMainHeading: {
    fontFamily: typography.family.bold,
    fontSize: 38,
    lineHeight: 44,
    color: '#FEF08A',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  diwaliSubtitle: {
    fontFamily: typography.family.medium,
    fontSize: 13,
    lineHeight: 17,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    opacity: 0.95,
  },
  shopNowBtn: {
    backgroundColor: '#FFC928',
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  shopNowText: {
    fontFamily: typography.family.bold,
    fontSize: 13.5,
    color: '#111827',
    fontWeight: '700',
  },
  diwaliDotsRowOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 10,
  },
  diwaliDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  diwaliDotActive: {
    width: 20,
    backgroundColor: '#FFFFFF',
  },

  /* 6 Category Cards Section */
  diwaliCardsGridSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 16,
    rowGap: 10,
    backgroundColor: '#35065C',
  },
  diwaliCard: {
    width: '31.3%',
    height: 136,
    borderRadius: 18,
    backgroundColor: '#240344',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    paddingTop: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  diwaliCardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
  diwaliCardTitle: {
    fontFamily: typography.family.bold,
    fontSize: 12.5,
    lineHeight: 15,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '700',
    minHeight: 30,
  },
  diwaliCardImgWrap: {
    width: '100%',
    height: 86,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  diwaliCardImg: {
    width: '96%',
    height: '100%',
  },

  /* Store Products and Parent Categories */
  /* Shop by Category 4-Column Grid */
  homepageBodyWhite: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    paddingTop: 4,
  },
  shopByCategorySection: {
    backgroundColor: '#FFFFFF',
    paddingTop: 18,
    paddingBottom: 8,
    marginBottom: 8,
  },
  shopByCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  shopByCategoryTitle: {
    fontFamily: typography.family.bold,
    fontSize: 18,
    color: '#111827',
    fontWeight: '700',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFC928',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  viewAllText: {
    fontFamily: typography.family.bold,
    fontSize: 12,
    color: '#111827',
    fontWeight: '700',
  },
  shopByCategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    rowGap: 14,
  },
  shopCategoryItem: {
    width: '25%',
    padding: 4,
    alignItems: 'center',
  },
  shopCategoryCircle: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 18,
    backgroundColor: '#ECF6FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    overflow: 'hidden',
    padding: 4,
  },
  shopCategoryCard: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 18,
    backgroundColor: '#ECF6FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    overflow: 'hidden',
    padding: 4,
  },
  shopCategoryCardImg: {
    width: '100%',
    height: '100%',
  },
  shopCategoryCircleImg: {
    width: '100%',
    height: '100%',
  },
  shopCategoryLabel: {
    fontFamily: typography.family.bold,
    fontSize: 11.5,
    lineHeight: 15,
    color: '#111827',
    textAlign: 'center',
    minHeight: 30,
  },
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
    backgroundColor: '#ECF6FE',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 6,
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
    zIndex: 999,
    elevation: 10,
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
