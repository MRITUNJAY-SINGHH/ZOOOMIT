import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, ActivityIndicator, Animated, Easing, Platform, StatusBar as RNStatusBar } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Bookmark, ShoppingBasket, Snowflake, Apple, Sparkles, Gift, Package, Leaf, Cherry, Grape, Citrus, Banana, Carrot, Wine, ChefHat, Heart, Star, Sprout, PartyPopper, ChevronDown, ChevronRight, ChevronUp, User } from 'lucide-react-native';
import { typography } from '../../constants/theme';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTabBarVisibility } from '../../context/TabBarVisibilityContext';
import { ProductCard } from '../../components/product/ProductCard';

const TABS = [
  { name: 'All', icon: ShoppingBasket, match: '' },
  { name: 'Winter', icon: Snowflake, match: 'winter' },
  { name: 'Fresh', icon: Apple, match: 'fruit|vegetable|fresh' },
  { name: 'Gourmet', icon: Sparkles, match: 'gourmet' },
  { name: 'Gifts', icon: Gift, match: 'gift' },
  { name: 'More', icon: Package, match: '' }
];

// One place to change the look of each tab. Order must match TABS.
// bg = header + hero colour, accent = hero headline colour, deco = vector icons (x/y in %, size, rotation) faded in behind the header and hero.
const THEMES = [
  { name: 'All', bg: '#437D29', accent: '#FFA7CC', title: 'Fresh picks', sub: 'EVERY DAY', caption: 'Fruits, vegetables & more', hero: Leaf,
    deco: [[Leaf, 6, 10, 30, -20], [Apple, 82, 8, 26, 15], [Sprout, 48, 55, 28, 0], [Leaf, 90, 62, 34, 30], [Citrus, 22, 70, 26, 10]] },
  { name: 'Winter', bg: '#2F6FA8', accent: '#CFF3FF', title: 'Winter', sub: 'ESSENTIALS', caption: 'Stay warm, stay stocked', hero: Snowflake,
    deco: [[Snowflake, 6, 8, 30, 0], [Snowflake, 84, 6, 22, 20], [Snowflake, 40, 60, 34, 10], [Snowflake, 92, 58, 26, -15], [Snowflake, 20, 72, 20, 30], [Snowflake, 62, 12, 18, 0]] },
  { name: 'Fresh', bg: '#2E7D32', accent: '#FFE27A', title: 'Lowest prices', sub: 'EVERYDAY', caption: 'Fresh fruits & vegetables', hero: Apple,
    deco: [[Cherry, 5, 10, 30, -15], [Banana, 80, 6, 30, 20], [Grape, 44, 62, 30, 0], [Carrot, 92, 60, 30, 25], [Citrus, 20, 72, 26, 10], [Apple, 62, 10, 22, -10]] },
  { name: 'Gourmet', bg: '#5B2A86', accent: '#FFD27A', title: 'Gourmet', sub: 'FINDS', caption: 'Treat yourself today', hero: ChefHat,
    deco: [[Sparkles, 6, 10, 28, 0], [Wine, 84, 8, 28, 15], [ChefHat, 42, 62, 30, -10], [Star, 92, 60, 22, 0], [Sparkles, 20, 72, 22, 15]] },
  { name: 'Gifts', bg: '#C2185B', accent: '#FFE0EC', title: 'Gifts', sub: 'THEY\'LL LOVE', caption: 'Pick something special', hero: Gift,
    deco: [[Heart, 6, 10, 28, -15], [Gift, 84, 8, 28, 15], [PartyPopper, 44, 62, 30, 0], [Heart, 92, 60, 24, 20], [Star, 20, 72, 20, 0]] },
  { name: 'More', bg: '#46505E', accent: '#D8E1EC', title: 'Discover', sub: 'MORE', caption: 'Everything else you need', hero: Package,
    deco: [[Package, 6, 10, 28, -10], [ShoppingBasket, 84, 8, 28, 10], [Sparkles, 44, 62, 26, 0], [Package, 92, 60, 24, 15]] }
];
const THEME_INDEX = (name) => Math.max(0, TABS.findIndex(t => t.name === name));
const themeColors = THEMES.map(t => t.bg);
const themeRange = THEMES.map((_, i) => i);
const fade = (anim, i) => anim.interpolate({ inputRange: [i - 1, i, i + 1], outputRange: [0, 1, 0], extrapolate: 'clamp' });
const ThemeDeco = ({ anim }) => <View pointerEvents="none" style={StyleSheet.absoluteFill}>
  {THEMES.map((t, i) => <Animated.View key={t.name} pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: fade(anim, i) }]}>
    {t.deco.map(([Icon, x, y, size, rot], k) => <View key={k} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: [{ rotate: `${rot}deg` }], opacity: 0.2 }}><Icon size={size} color="#fff" strokeWidth={1.6} /></View>)}
  </Animated.View>)}
</View>;
const GROUPS = [
  { name: 'Fresh\nfruits', match: 'fruit|apple|banana|mango|orange|grape', image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400' },
  { name: 'Fresh\nvegetables', match: 'vegetable', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400' },
  { name: 'Milk &\ndairy', match: 'milk|curd|paneer|butter|cheese', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400' }
];
const listFrom = (res) => {
  const data = res.data?.data ?? res.data;
  const list = Array.isArray(data) ? data : data?.products ?? data?.categories;
  if (!Array.isArray(list)) throw new Error('The store returned an invalid catalog.');
  return list;
};
const categoryText = (p) => `${p.category?.name || (typeof p.category === 'string' ? p.category : '')} ${p.name || ''}`;

const TabItem = ({ name, icon: Icon, active, onPress }) => {
  const v = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => { Animated.timing(v, { toValue: active ? 1 : 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(); }, [active, v]);
  const lift = v.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const color = v.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,255,255,0.72)', 'rgba(255,255,255,1)'] });
  return <Pressable onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: active }} style={styles.tabPress}>
    <Animated.View style={[styles.tab, { transform: [{ translateY: lift }, { scale }] }]}>
      <Icon size={22} color="#fff" strokeWidth={active ? 2.1 : 1.6} />
      <Animated.Text style={[styles.tabText, active && styles.tabTextActive, { color }]}>{name}</Animated.Text>
    </Animated.View>
  </Pressable>;
};
const SEARCH_WORDS = ['Apple', 'Atta', 'Sugar', 'Milk', 'Paneer', 'Eggs'];
const WORD_H = 18;
const RotatingSearch = ({ words }) => {
  const list = words.length ? words : SEARCH_WORDS;
  const [i, setI] = useState(0);
  const p = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(p, { toValue: 1, duration: 420, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }).start(({ finished }) => { if (finished) { setI(x => x + 1); p.setValue(0); } });
    }, 2000);
    return () => clearTimeout(timer);
  }, [i, p]);
  const cur = list[i % list.length];
  const next = list[(i + 1) % list.length];
  return <View style={styles.rotRow}>
    <Text style={styles.placeholder}>{"Search for '"}</Text>
    <View style={styles.rotWindow}>
      <Animated.Text numberOfLines={1} style={[styles.placeholder, styles.rotWord, { opacity: p.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }), transform: [{ translateY: p.interpolate({ inputRange: [0, 1], outputRange: [0, -WORD_H] }) }] }]}>{cur + "'"}</Animated.Text>
      <Animated.Text numberOfLines={1} style={[styles.placeholder, styles.rotWord, { opacity: p, transform: [{ translateY: p.interpolate({ inputRange: [0, 1], outputRange: [WORD_H, 0] }) }] }]}>{next + "'"}</Animated.Text>
    </View>
  </View>;
};
const idOf = (item) => typeof item === 'string' ? item : item?._id || item?.id;
const CategoryArt = ({ category, products }) => {
  const [failed, setFailed] = useState(false);
  const ownProduct = products.find(p => idOf(p.category) === idOf(category) || idOf(p.subcategory) === idOf(category));
  const uri = failed ? ownProduct?.featuredImage : category.image || category.featuredImage || ownProduct?.featuredImage;
  const [fallbackFailed, setFallbackFailed] = useState(false);
  return <View style={styles.categoryArt}>{uri && !fallbackFailed ? <Image source={{ uri }} style={styles.categoryImage} contentFit="contain" onError={() => failed ? setFallbackFailed(true) : setFailed(true)} /> : <ShoppingBasket size={30} color="#2376B5" />}</View>;
};
const TOP_INSET_FALLBACK = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 28) : 44;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { customer } = useAuth();
  const { onScrollHandler } = useTabBarVisibility();
  const scrollRef = useRef(null);
  const sectionOffsets = useRef({});
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const lastY = useRef(0);
  const downFrom = useRef(0);
  const [activeParent, setActiveParent] = useState(null);
  const [tab, setTab] = useState('All');
  const themeAnim = useRef(new Animated.Value(0)).current;
  const [tabsWidth, setTabsWidth] = useState(0);
  useEffect(() => { Animated.timing(themeAnim, { toValue: THEME_INDEX(tab), duration: 450, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }).start(); }, [tab, themeAnim]);
  const theme = THEMES[THEME_INDEX(tab)];
  const themeBg = themeAnim.interpolate({ inputRange: themeRange, outputRange: themeColors });
  const tabW = tabsWidth / TABS.length;
  const HUMP_W = Math.max(tabW - 10, 48);
  const humpLeft = themeAnim.interpolate({ inputRange: themeRange, outputRange: themeRange.map(i => i * tabW + (tabW - HUMP_W) / 2) });
  const lineLeftW = themeAnim.interpolate({ inputRange: themeRange, outputRange: themeRange.map(i => i * tabW + (tabW - HUMP_W) / 2 + 16 + 1) });
  const lineRightW = themeAnim.interpolate({ inputRange: themeRange, outputRange: themeRange.map(i => Math.max(tabsWidth + 32 - (i * tabW + (tabW - HUMP_W) / 2 + 16 + HUMP_W - 1), 0)) });
  const backAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(backAnim, { toValue: showBackToTop ? 1 : 0, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(); }, [showBackToTop, backAnim]);
  const [group, setGroup] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const productsQuery = useQuery({ queryKey: ['instamart-home-products'], queryFn: async () => listFrom(await api.get('/products', { params: { limit: 60 } })) });
  const categoriesQuery = useQuery({ queryKey: ['instamart-home-categories'], queryFn: async () => listFrom(await api.get('/categories', { params: { includeSubcategories: 'true' } })) });
  const products = productsQuery.data || [];
  const categories = categoriesQuery.data || [];
  const searchWords = [...SEARCH_WORDS.slice(0, 4), ...categories.map(c => (c.name || '').trim()).filter(n => n.length >= 3 && n.length <= 12 && !SEARCH_WORDS.some(w => w.toLowerCase() === n.toLowerCase()))].filter((n, i, a) => a.findIndex(x => x.toLowerCase() === n.toLowerCase()) === i).slice(0, 9);
  const parents = categories.filter(c => !idOf(c.parentCategory));
  const childrenOf = (parent) => {
    const list = [...(parent.subcategories || []), ...categories.filter(c => idOf(c.parentCategory) === idOf(parent))];
    return list.filter((c, i) => list.findIndex(x => idOf(x) === idOf(c)) === i);
  };
  const handleScroll = (event) => {
    onScrollHandler(event);
    const y = Math.max(event.nativeEvent.contentOffset.y, 0);
    const dy = y - lastY.current;
    lastY.current = y;
    if (y < 320) { setShowBackToTop(false); downFrom.current = y; return; }
    if (dy > 4) { setShowBackToTop(false); } else if (dy < -8) { setShowBackToTop(true); }
  };
  const jumpToParent = (parent) => {
    setActiveParent(idOf(parent));
    const y = sectionOffsets.current[idOf(parent)];
    if (typeof y === 'number') scrollRef.current?.scrollTo({ y: Math.max(y - 12, 0), animated: true });
  };
  const address = customer?.addresses?.find(a => a.isDefault) || customer?.addresses?.[0];
  const initial = (customer?.name || customer?.firstName || customer?.fullName || '').trim().charAt(0).toUpperCase();
  const addressLabel = address ? [address.street, address.city].filter(Boolean).join(', ') : 'Select delivery address';
  const match = group || TABS.find(t => t.name === tab)?.match;
  const visibleProducts = match ? products.filter(p => new RegExp(match, 'i').test(categoryText(p))) : products;
  const onRefresh = async () => {
    setRefreshing(true);
    try { await Promise.all([productsQuery.refetch(), categoriesQuery.refetch()]); } finally { setRefreshing(false); }
  };
  const openCategory = (category) => router.push(`/category/${category._id || category.id}`);
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Animated.View onLayout={e => setHeaderHeight(e.nativeEvent.layout.height)} style={[styles.header, { backgroundColor: themeBg, paddingTop: Math.max(insets.top, TOP_INSET_FALLBACK) + 8 }]}>
        <ThemeDeco anim={themeAnim} />
        <View style={styles.addressRow}>
        <Pressable style={styles.address} onPress={() => router.push('/addresses')} accessibilityRole="button">
          <Text style={styles.addressText} numberOfLines={1}>{addressLabel}</Text><ChevronDown size={14} color="#fff" />
        </Pressable>
        <Pressable style={styles.avatar} onPress={() => router.push('/(tabs)/profile')} accessibilityRole="button" accessibilityLabel="Open profile">
          {initial ? <Text style={styles.avatarText}>{initial}</Text> : <User size={18} color="#fff" />}
        </Pressable>
        </View>
        <View style={styles.searchRow}>
          <Pressable style={styles.search} onPress={() => router.push('/(tabs)/search')} accessibilityLabel="Search products" accessibilityRole="button">
            <RotatingSearch words={searchWords} /><Search size={19} color="#637164" />
          </Pressable>
          <Pressable style={styles.bookmark} onPress={() => router.push('/wishlist')} accessibilityLabel="Wishlist" accessibilityRole="button"><Bookmark size={22} color="#fff" /></Pressable>
        </View>
        <View style={styles.tabsWrap}>
          <View onLayout={e => setTabsWidth(e.nativeEvent.layout.width)} style={styles.tabs}>
            {TABS.map(t => <TabItem key={t.name} name={t.name} icon={t.icon} active={t.name === tab} onPress={() => { setTab(t.name); setGroup(null); }} />)}
          </View>
          {tabsWidth > 0 && <>
            <Animated.View pointerEvents="none" style={[styles.lineSeg, { left: -16, width: lineLeftW }]}>
              <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.9)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.lineFade} />
              <View style={[styles.lineSolid, { left: 56 }]} />
            </Animated.View>
            <Animated.View pointerEvents="none" style={[styles.lineSeg, { right: -16, width: lineRightW }]}>
              <View style={[styles.lineSolid, { right: 56 }]} />
              <LinearGradient colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.lineFade, { right: 0 }]} />
            </Animated.View>
            <Animated.View pointerEvents="none" style={[styles.hump, { left: humpLeft, width: HUMP_W }]} />
          </>}
        </View>
      </Animated.View>
      <ScrollView ref={scrollRef} onScroll={handleScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={styles.body} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" colors={['#1769FF']} />}>
        <Animated.View style={[styles.greenPanel, { backgroundColor: themeBg }]}>
          <ThemeDeco anim={themeAnim} />
          <View style={styles.hero}>
            <View style={styles.heroCopy}><Text style={[styles.heroPink, { color: theme.accent }]}>{theme.title}</Text><Text style={styles.heroWhite}>{theme.sub}</Text><Text style={styles.heroCaption}>{theme.caption}</Text></View>
            {tab === 'All' || tab === 'Fresh' ? <Image source={{ uri: GROUPS[0].image }} style={styles.heroImage} contentFit="cover" /> : <View style={styles.heroBadge}><theme.hero size={44} color="#fff" strokeWidth={1.5} /></View>}
          </View>
          <View style={styles.featuredRow}>
            {GROUPS.map(g => {
              const items = products.filter(p => new RegExp(g.match, 'i').test(p.name || ''));
              const prices = items.flatMap(p => p.variants?.length ? p.variants.map(v => v.sellingPrice ?? p.sellingPrice) : [p.sellingPrice]).filter(p => Number.isFinite(Number(p)) && Number(p) >= 0).map(Number);
              return <Pressable key={g.name} style={[styles.featuredTile, group === g.match && styles.selectedTile]} onPress={() => { setGroup(g.match); setTab('Fresh'); }} accessibilityRole="button" accessibilityLabel={g.name.replace('\n', ' ')}>
                <Text style={styles.featuredName}>{g.name}</Text><Image source={{ uri: g.image }} style={styles.featuredImage} contentFit="cover" />
                <Text style={styles.priceRibbon} numberOfLines={1}>{prices.length ? `STARTS AT ₹${Math.min(...prices)}` : 'EXPLORE'}</Text>
              </Pressable>;
            })}
          </View>
        </Animated.View>
        {categoriesQuery.isLoading && <ActivityIndicator color="#1769FF" style={styles.loading} />}
        {categoriesQuery.isError && <View style={styles.state}><Text style={styles.stateText}>Couldn't load categories.</Text><Pressable onPress={() => categoriesQuery.refetch()}><Text style={styles.seeAllText}>Retry</Text></Pressable></View>}
        {parents.length > 0 && <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.parentSlider}>
            {parents.map(parent => <Pressable key={idOf(parent)} onPress={() => jumpToParent(parent)} style={styles.parentTile} accessibilityRole="button" accessibilityLabel={`Browse ${parent.name}`} accessibilityState={{ selected: activeParent === idOf(parent) }}>
              <View style={[styles.parentArt, activeParent === idOf(parent) && styles.parentArtActive]}><CategoryArt category={parent} products={products} /></View>
              <Text style={[styles.categoryName, activeParent === idOf(parent) && styles.parentLabelActive]} numberOfLines={2}>{parent.name}</Text>
            </Pressable>)}
          </ScrollView>
          {parents.map(parent => {
            const children = childrenOf(parent);
            const tiles = children.length ? children : [parent];
            return <View key={idOf(parent)} onLayout={e => { sectionOffsets.current[idOf(parent)] = e.nativeEvent.layout.y; }}>
              <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{parent.name}</Text></View>
              <View style={styles.categoryGrid}>{tiles.map(c => <Pressable key={idOf(c)} style={styles.category} onPress={() => openCategory(c)} accessibilityRole="button" accessibilityLabel={`Shop ${c.name}`}>
                <CategoryArt category={c} products={products} /><Text style={styles.categoryName} numberOfLines={3}>{c.name}</Text>
              </Pressable>)}</View>
            </View>;
          })}
        </>}
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{group ? 'Fresh picks for you' : tab === 'All' ? 'Top deals on bestsellers' : `${tab} picks`}</Text><Pressable onPress={() => router.push('/(tabs)/search')} style={styles.seeAll}><Text style={styles.seeAllText}>See All</Text><ChevronRight size={14} color="#1769FF" /></Pressable></View>
        {productsQuery.isLoading && <ActivityIndicator color="#1769FF" style={styles.loading} />}
        {productsQuery.isError && <View style={styles.state}><Text style={styles.stateTitle}>Couldn't load your store</Text><Text style={styles.stateText}>Check your connection and try again.</Text><Pressable onPress={onRefresh}><Text style={styles.seeAllText}>Retry</Text></Pressable></View>}
        {!productsQuery.isLoading && !productsQuery.isError && !visibleProducts.length && <View style={styles.state}><Text style={styles.stateText}>No products in this collection yet.</Text><Pressable onPress={() => { setTab('All'); setGroup(null); }}><Text style={styles.seeAllText}>Browse all products</Text></Pressable></View>}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shelf}>{visibleProducts.slice(0, 12).map(p => <ProductCard key={p._id} product={p} compact />)}</ScrollView>
        {visibleProducts.length > 0 && <Pressable style={styles.fullSeeAll} onPress={() => router.push('/(tabs)/search')} accessibilityRole="button"><Text style={styles.fullSeeAllText}>See All »</Text></Pressable>}
        {visibleProducts.length > 12 && <><View style={styles.sectionHeader}><Text style={styles.sectionTitle}>More everyday essentials</Text></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shelf}>{visibleProducts.slice(12, 24).map(p => <ProductCard key={p._id} product={p} compact />)}</ScrollView></>}
      </ScrollView>
      <Animated.View pointerEvents={showBackToTop ? 'box-none' : 'none'} style={[styles.backTopWrap, { top: headerHeight + 10, opacity: backAnim, transform: [{ translateY: backAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }] }]}><Pressable style={styles.backTop} onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })} accessibilityRole="button" accessibilityLabel="Back to top"><ChevronUp size={16} color="#fff" /><Text style={styles.backTopText}>Back to top</Text></Pressable></Animated.View>
    </View>
  );
}
const styles = StyleSheet.create({
  parentSlider: { paddingHorizontal: 16, paddingVertical: 22, gap: 12 }, parentTile: { width: 76, gap: 8, alignItems: 'center' }, parentArt: { width: 68, height: 68, borderRadius: 16, borderWidth: 2, borderColor: 'transparent' }, parentArtActive: { borderColor: '#1769FF', transform: [{ translateY: -3 }] }, parentLabelActive: { color: '#1769FF' },
  fullSeeAll: { marginHorizontal: 16, marginTop: 14, padding: 14, borderRadius: 14, backgroundColor: '#EDF8FE', alignItems: 'center' }, fullSeeAllText: { color: '#0066CC', fontSize: 16, fontFamily: typography.family.bold },
  backTopWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 20 }, backTop: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#1C1F26', paddingHorizontal: 13, paddingVertical: 8, borderRadius: 24, elevation: 5, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } }, backTopText: { color: '#fff', fontSize: 12, fontFamily: typography.family.medium },
  root: { flex: 1, backgroundColor: '#fff' }, header: { backgroundColor: '#437D29', paddingHorizontal: 16, overflow: 'hidden' },
  addressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 }, avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.22)', borderWidth: 1.5, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#fff', fontSize: 15, fontFamily: typography.family.bold }, address: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4 }, addressText: { color: '#fff', fontFamily: typography.family.medium, fontSize: 12, flexShrink: 1 },
  searchRow: { flexDirection: 'row', gap: 10, alignItems: 'center' }, search: { flex: 1, height: 44, borderRadius: 13, backgroundColor: '#fff', paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, placeholder: { color: '#7B8378', fontSize: 13, fontFamily: typography.family.regular }, bookmark: { width: 38, height: 44, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', paddingTop: 16 }, tabsWrap: { position: 'relative' }, lineSeg: { position: 'absolute', bottom: 0, height: 2, overflow: 'hidden' }, lineFade: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 56 }, lineSolid: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.9)' }, hump: { position: 'absolute', bottom: 0, height: 60, borderWidth: 2, borderBottomWidth: 0, borderColor: 'rgba(255,255,255,0.9)', borderTopLeftRadius: 20, borderTopRightRadius: 20 }, rotRow: { flexDirection: 'row', alignItems: 'center', flex: 1 }, rotWindow: { height: 18, flex: 1, overflow: 'hidden' }, rotWord: { position: 'absolute', left: 0, right: 0, top: 0, lineHeight: 18 }, heroBadge: { width: 85, height: 85, borderRadius: 42, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' }, tabPress: { flex: 1, alignItems: 'center' }, tab: { minWidth: 52, alignItems: 'center', gap: 5, paddingHorizontal: 7, paddingTop: 7, paddingBottom: 8, borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, marginBottom: 2 }, tabBar: { height: 3, borderRadius: 2, backgroundColor: '#fff', marginTop: 1 }, tabText: { fontSize: 10, color: '#DDEBD5', fontFamily: typography.family.medium }, tabTextActive: { color: '#fff', fontFamily: typography.family.bold },
  body: { paddingBottom: Math.max(180, TOP_INSET_FALLBACK + 140) }, greenPanel: { backgroundColor: '#437D29', overflow: 'hidden', padding: 16, paddingTop: 12, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 }, hero: { height: 100, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 }, heroCopy: { flex: 1 }, heroPink: { color: '#FFA7CC', fontSize: 25, fontWeight: '900', fontFamily: typography.family.bold }, heroWhite: { color: '#fff', fontSize: 21, fontWeight: '900', fontFamily: typography.family.bold }, heroCaption: { color: '#E7F3DE', fontSize: 11, marginTop: 5 }, heroImage: { width: 95, height: 85, borderRadius: 18 },
  featuredRow: { flexDirection: 'row', gap: 8, marginTop: 12 }, featuredTile: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 16, overflow: 'hidden', paddingTop: 10, borderWidth: 1, borderColor: '#ffffff15' }, selectedTile: { borderColor: '#fff' }, featuredName: { textAlign: 'center', fontSize: 13, lineHeight: 15, color: '#fff', fontFamily: typography.family.medium, minHeight: 32 }, featuredImage: { width: '100%', height: 76, marginTop: 4 }, priceRibbon: { backgroundColor: '#F883AD', color: '#23331C', textAlign: 'center', paddingVertical: 5, fontSize: 10, fontWeight: '800', fontFamily: typography.family.bold },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 20, marginBottom: 12 }, sectionTitle: { flex: 1, fontSize: 18, color: '#20251F', fontFamily: typography.family.bold }, seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 }, seeAllText: { color: '#1769FF', fontSize: 12, fontFamily: typography.family.medium }, shelf: { paddingHorizontal: 16, paddingBottom: 10 }, categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10 }, category: { width: '25%', padding: 6, alignItems: 'center', gap: 7, marginBottom: 12 }, categoryImage: { width: '92%', height: '92%' }, categoryArt: { width: '100%', aspectRatio: 1, borderRadius: 14, backgroundColor: '#EDF8FE', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, categoryName: { fontSize: 12, lineHeight: 16, textAlign: 'center', color: '#263223', fontFamily: typography.family.medium }, loading: { margin: 24 }, state: { padding: 24, gap: 10 }, stateTitle: { fontSize: 16, fontWeight: '700' }, stateText: { color: '#6B7280', fontSize: 13 }
});
