import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, ActivityIndicator, Animated, Easing, Platform, StatusBar as RNStatusBar } from 'react-native';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Path } from 'react-native-svg';
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
const ThemeDeco = ({ anim, bottomInset = 0 }) => <View pointerEvents="none" style={[StyleSheet.absoluteFill, { bottom: bottomInset, overflow: 'hidden' }]}>
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

const TabItem = ({ name, icon: Icon, active, onPress, onLayout, onContentLayout, backgroundColor }) => {
  const v = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => { Animated.timing(v, { toValue: active ? 1 : 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(); }, [active, v]);
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const color = v.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,255,255,0.72)', 'rgba(255,255,255,1)'] });
  return <Pressable onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: active }} onLayout={onLayout} style={styles.tabPress}>
    <Animated.View onLayout={onContentLayout} style={styles.tab}>
      <Animated.View style={[styles.tabIcon, { backgroundColor, transform: [{ scale }] }]}><Icon size={22} color="#fff" strokeWidth={active ? 2.1 : 1.6} /></Animated.View>
      <Animated.Text style={[styles.tabText, active && styles.tabTextActive, { color }]} numberOfLines={2}>{name}</Animated.Text>
    </Animated.View>
  </Pressable>;
};
// The curve follows measured cells and content, including real font height.
// Its roof meets the lower part of the icon (as in B); the label is INSIDE
// the sloping shoulders, and the baseline is BELOW every label.
const AnimatedPath = Animated.createAnimatedComponent(Path);
const tabOutline = (width, height, cell, content) => {
  const center = cell.x + cell.width / 2;
  const base = height - 0.5;
  const roof = Math.min(cell.y + content.y + 27, base - 12);
  const halfFoot = Math.max(1, cell.width / 2 - 1);
  const halfRoof = Math.max(1, Math.min(content.width / 2 + 3, halfFoot - 9));
  const left = center - halfFoot, right = center + halfFoot;
  const topLeft = center - halfRoof, topRight = center + halfRoof;
  const rise = base - roof;
  const midLeft = (left + topLeft) / 2, midRight = (right + topRight) / 2;
  return `M 0 ${base} L ${left} ${base} C ${left + 3} ${base} ${midLeft - 2} ${base - rise * 0.22} ${midLeft} ${base - rise * 0.5} C ${midLeft + 2} ${roof + 3} ${topLeft - 3} ${roof} ${topLeft} ${roof} L ${topRight} ${roof} C ${topRight + 3} ${roof} ${midRight - 2} ${roof + 3} ${midRight} ${base - rise * 0.5} C ${midRight + 2} ${base - rise * 0.22} ${right - 3} ${base} ${right} ${base} L ${width} ${base}`;
};
const CategoryTabs = ({ tab, anim, backgroundColor, onSelect }) => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [cells, setCells] = useState({});
  const [contents, setContents] = useState({});
  const record = (setter, index, layout) => setter(old => {
    const prev = old[index];
    return prev && ['x', 'y', 'width', 'height'].every(k => prev[k] === layout[k]) ? old : { ...old, [index]: layout };
  });
  const ready = size.width > 0 && TABS.every((_, i) => cells[i] && contents[i]);
  const path = ready ? anim.interpolate({ inputRange: themeRange, outputRange: TABS.map((_, i) => tabOutline(size.width, size.height, cells[i], contents[i])), extrapolate: 'clamp' }) : null;
  return <View style={styles.tabsWrap} onLayout={e => setSize(e.nativeEvent.layout)}>
    {ready && <Svg pointerEvents="none" width={size.width} height={size.height} style={StyleSheet.absoluteFill}>
      <Defs><SvgGradient id="categoryLine" x1="0%" y1="0%" x2="100%" y2="0%"><Stop offset="0%" stopColor="#fff" stopOpacity={0} /><Stop offset="12%" stopColor="#fff" stopOpacity={0.5} /><Stop offset="88%" stopColor="#fff" stopOpacity={0.5} /><Stop offset="100%" stopColor="#fff" stopOpacity={0} /></SvgGradient></Defs>
      <AnimatedPath d={path} fill="none" stroke="url(#categoryLine)" strokeWidth={1} />
    </Svg>}
    <View style={styles.tabs}>
      {TABS.map((t, i) => <TabItem key={t.name} name={t.name} icon={t.icon} active={t.name === tab} backgroundColor={backgroundColor} onPress={() => onSelect(t.name)} onLayout={e => record(setCells, i, e.nativeEvent.layout)} onContentLayout={e => record(setContents, i, e.nativeEvent.layout)} />)}
    </View>
  </View>;
};
const SEARCH_WORDS = ['Apple', 'Atta', 'Sugar', 'Milk', 'Paneer', 'Eggs'];
const WORD_H = 18;
const RotatingSearch = ({ words }) => {
  const seen = new Set();
  const uniq = (words.length ? words : SEARCH_WORDS).filter(w => { const k = String(w).trim().toLowerCase(); if (!k || seen.has(k)) return false; seen.add(k); return true; });
  const list = uniq.length >= 2 ? uniq : SEARCH_WORDS;
  const [step, setStep] = useState(0);
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(t, { toValue: step + 1, duration: 420, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }).start(({ finished }) => { if (finished) setStep(step + 1); });
    }, 1800);
    return () => { clearTimeout(timer); };
  }, [step, t]);
  // Two slots, even and odd word numbers. t only ever counts up, so a slot is re-pointed at a new word
  // while it is invisible and nothing is reset mid-frame (this removed the repeat/flash).
  const slotWord = (parity) => { const n = step % 2 === parity ? step : step + 1; return n; };
  const renderSlot = (n) => <Animated.Text key={n % 2} numberOfLines={1} style={[styles.placeholder, styles.rotWord, {
    opacity: t.interpolate({ inputRange: [n - 1, n, n + 1], outputRange: [0, 1, 0], extrapolate: 'clamp' }),
    transform: [{ translateY: t.interpolate({ inputRange: [n - 1, n, n + 1], outputRange: [WORD_H, 0, -WORD_H], extrapolate: 'clamp' }) }]
  }]}>{list[n % list.length] + "'"}</Animated.Text>;
  return <View style={styles.rotRow}>
    <Text style={styles.placeholder}>{"Search for '"}</Text>
    <View style={styles.rotWindow}>
      {renderSlot(slotWord(0))}
      {renderSlot(slotWord(1))}
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
  useEffect(() => { Animated.timing(themeAnim, { toValue: THEME_INDEX(tab), duration: 450, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }).start(); }, [tab, themeAnim]);
  const theme = THEMES[THEME_INDEX(tab)];
  const themeBg = themeAnim.interpolate({ inputRange: themeRange, outputRange: themeColors });
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
        <ThemeDeco anim={themeAnim} bottomInset={84} />
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
        <CategoryTabs tab={tab} anim={themeAnim} backgroundColor={themeBg} onSelect={name => { setTab(name); setGroup(null); }} />
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
  tabs: { flexDirection: 'row', paddingTop: 16, paddingHorizontal: 16 }, tabsWrap: { position: 'relative', marginHorizontal: -16 }, rotRow: { flexDirection: 'row', alignItems: 'center', flex: 1 }, rotWindow: { height: 18, flex: 1, overflow: 'hidden' }, rotWord: { position: 'absolute', left: 0, right: 0, top: 0, lineHeight: 18 }, heroBadge: { width: 85, height: 85, borderRadius: 42, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' }, tabPress: { flex: 1, minWidth: 0, alignItems: 'center' }, tab: { maxWidth: '100%', alignItems: 'center', gap: 4, paddingHorizontal: 3, paddingTop: 9, paddingBottom: 12 }, tabIcon: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center', borderRadius: 13 }, tabText: { fontSize: 10, lineHeight: 13, textAlign: 'center', color: '#DDEBD5', fontFamily: typography.family.medium }, tabTextActive: { color: '#fff', fontFamily: typography.family.bold },
  body: { paddingBottom: Math.max(180, TOP_INSET_FALLBACK + 140) }, greenPanel: { backgroundColor: '#437D29', overflow: 'hidden', padding: 16, paddingTop: 12, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 }, hero: { height: 100, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 }, heroCopy: { flex: 1 }, heroPink: { color: '#FFA7CC', fontSize: 25, fontWeight: '900', fontFamily: typography.family.bold }, heroWhite: { color: '#fff', fontSize: 21, fontWeight: '900', fontFamily: typography.family.bold }, heroCaption: { color: '#E7F3DE', fontSize: 11, marginTop: 5 }, heroImage: { width: 95, height: 85, borderRadius: 18 },
  featuredRow: { flexDirection: 'row', gap: 8, marginTop: 12 }, featuredTile: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 16, overflow: 'hidden', paddingTop: 10, borderWidth: 1, borderColor: '#ffffff15' }, selectedTile: { borderColor: '#fff' }, featuredName: { textAlign: 'center', fontSize: 13, lineHeight: 15, color: '#fff', fontFamily: typography.family.medium, minHeight: 32 }, featuredImage: { width: '100%', height: 76, marginTop: 4 }, priceRibbon: { backgroundColor: '#F883AD', color: '#23331C', textAlign: 'center', paddingVertical: 5, fontSize: 10, fontWeight: '800', fontFamily: typography.family.bold },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 20, marginBottom: 12 }, sectionTitle: { flex: 1, fontSize: 18, color: '#20251F', fontFamily: typography.family.bold }, seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 }, seeAllText: { color: '#1769FF', fontSize: 12, fontFamily: typography.family.medium }, shelf: { paddingHorizontal: 16, paddingBottom: 10 }, categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10 }, category: { width: '25%', padding: 6, alignItems: 'center', gap: 7, marginBottom: 12 }, categoryImage: { width: '92%', height: '92%' }, categoryArt: { width: '100%', aspectRatio: 1, borderRadius: 14, backgroundColor: '#EDF8FE', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, categoryName: { fontSize: 12, lineHeight: 16, textAlign: 'center', color: '#263223', fontFamily: typography.family.medium }, loading: { margin: 24 }, state: { padding: 24, gap: 10 }, stateTitle: { fontSize: 16, fontWeight: '700' }, stateText: { color: '#6B7280', fontSize: 13 }
});
