import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, ActivityIndicator, Animated, Easing, Platform, StatusBar as RNStatusBar, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Path } from 'react-native-svg';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Bookmark, ShoppingBasket, Snowflake, Apple, Sparkles, Gift, Package, Leaf, Cherry, Grape, Citrus, Banana, Carrot, Wine, ChefHat, Heart, Star, Sprout, PartyPopper, ChevronDown, ChevronRight, ChevronUp, User, Smartphone, Laptop, Headphones, Watch, Camera, Milk, Cookie, Egg, Coffee, Droplets, Flower2, Scissors } from 'lucide-react-native';
import { typography } from '../../constants/theme';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTabBarVisibility } from '../../context/TabBarVisibilityContext';
import { ProductCard } from '../../components/product/ProductCard';

const TABS = [
  { name: 'Groceries', match: '', art: 'Shopping%20bags/3D/shopping_bags_3d.png' },
  { name: 'Zooommart', match: '', art: 'Shopping%20cart/3D/shopping_cart_3d.png' },
  { name: 'Electronics', match: 'electronic|smartphone|phone|laptop|accessor', art: 'Laptop/3D/laptop_3d.png' },
  { name: 'Beauty', match: 'beauty|skin|hair|cosmetic|makeup', art: 'Lipstick/3D/lipstick_3d.png' }
];
const THEME_INDEX = name => Math.max(0, TABS.findIndex(t => t.name === name));
const THEMES = TABS.map(t => ({ name: t.name, bg: '#50001B' }));
const themeColors = THEMES.map(t => t.bg);
const themeRange = THEMES.map((_, i) => i);
const TAB_ART = 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/';
const TabItem = ({ item, active, onPress, width }) => {
  const lift = useRef(new Animated.Value(active ? 0 : 4)).current;
  useEffect(() => { Animated.timing(lift, { toValue: active ? 0 : 4, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(); }, [active, lift]);
  return <Pressable onPress={onPress} accessibilityRole="tab" accessibilityLabel={item.name} accessibilityState={{ selected: active }} style={{ width, height: 78 }}>
    <Svg width={width + 12} height={78} viewBox="0 0 160 114" preserveAspectRatio="none" style={{ position: 'absolute', left: -6 }}>
      <Defs><SvgGradient id={active ? 'activeTab' : item.name} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={active ? '#59001F' : '#2C0A17'} /><Stop offset="1" stopColor={active ? '#50001B' : '#2A0613'} /></SvgGradient></Defs>
      <Path d="M0 113 C9 111 11 104 13 91 L25 29 Q29 8 49 8 L113 8 Q132 8 136 29 L147 91 Q149 107 160 113" fill={`url(#${active ? 'activeTab' : item.name})`} stroke={active ? '#EBCDD5' : '#522B3A'} strokeWidth={active ? 1.7 : 1} />
    </Svg>
    <Animated.View style={{ alignItems: 'center', paddingTop: 14, transform: [{ translateY: lift }] }}>
      <Image source={{ uri: TAB_ART + item.art }} style={{ width: 38, height: 38 }} contentFit="contain" />
      <Text numberOfLines={1} style={{ color: active ? '#FFF' : '#BEA3AF', fontSize: 11.5, marginTop: 4, fontFamily: active ? typography.family.bold : typography.family.medium }}>{item.name}</Text>
    </Animated.View>
  </Pressable>;
};
const CategoryTabs = ({ tab, onSelect }) => {
  const { width } = useWindowDimensions();
  return <View style={{ flexDirection: 'row', height: 78, overflow: 'hidden' }}>{TABS.map(item => <TabItem key={item.name} item={item} width={width / 4} active={item.name === tab} onPress={() => onSelect(item.name)} />)}</View>;
};
// Original vector artwork and browse cards. No reference screenshot, invented offer or delivery promise.
const POSTER_H = 105;
const loopValue = (v, ms, delay = 0) => Animated.loop(Animated.sequence([Animated.timing(v, { toValue: 1, duration: ms, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }), Animated.timing(v, { toValue: 0, duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: true })]));
const FruitArt = () => <Svg width={62} height={62} viewBox="0 0 62 62">
  <Defs><SvgGradient id="fruit" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#FFCB24"/><Stop offset="1" stopColor="#E17400"/></SvgGradient></Defs>
  <Path d="M31 20C6 8 7 56 30 62C54 56 56 8 31 20" fill="url(#fruit)"/><Path d="M30 18Q24 2 41 1Q46 13 30 18" fill="#82AD38"/>
</Svg>;
const BagArt = () => <Svg width={58} height={62} viewBox="0 0 58 62">
  <Path d="m26 14 22 10-5 40-28-5-5-39z" fill="#EF1596"/><Path d="M22 22Q23 0 40 18" stroke="#FFC82E" strokeWidth="4" fill="none"/>
</Svg>;
const SparkArt = ({ size }) => <Svg width={size} height={size} viewBox="0 0 20 20"><Path d="m10 0 2.6 7.4L20 10l-7.4 2.6L10 20l-2.6-7.4L0 10l7.4-2.6z" fill="#FFF0CC"/></Svg>;
const PosterArt = () => {
  const a = useRef(new Animated.Value(0)).current;
  const b = useRef(new Animated.Value(0)).current;
  const c = useRef(new Animated.Value(0)).current;
  const d = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loops = [loopValue(a, 1500), loopValue(b, 1700, 300), loopValue(c, 1100), loopValue(d, 1300, 500)];
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, [a, b, c, d]);
  const spin = (v, deg) => v.interpolate({ inputRange: [0, 1], outputRange: [`${-deg}deg`, `${deg}deg`] });
  const rise = (v, px) => v.interpolate({ inputRange: [0, 1], outputRange: [px, -px] });
  return <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <Animated.View style={{ position: 'absolute', left: 14, top: 18, transform: [{ translateY: rise(a, 5) }, { rotate: spin(a, 10) }] }}><FruitArt /></Animated.View>
    <Animated.View style={{ position: 'absolute', right: 16, top: 16, transform: [{ translateY: rise(b, -5) }, { rotate: spin(b, -10) }] }}><BagArt /></Animated.View>
    <Animated.View style={{ position: 'absolute', left: 72, top: 20, opacity: c, transform: [{ scale: c.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.15] }) }] }}><SparkArt size={16} /></Animated.View>
    <Animated.View style={{ position: 'absolute', right: 78, top: 70, opacity: d, transform: [{ scale: d.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.1] }) }] }}><SparkArt size={12} /></Animated.View>
  </View>;
};
const COLLECTIONS = {
  Groceries: [['Fresh picks', 'Fruit & vegetables', 'fruit|vegetable', Apple], ['Daily picks', 'Fill your cupboard', 'milk|atta|rice|sugar', ShoppingBasket], ['Little treats', 'Snacks & more', 'snack|sweet|chocolate', Gift], ['Dairy', 'Milk & more', 'milk|dairy|paneer|curd', Milk], ['Biscuits', 'Tea-time bites', 'biscuit|cookie|snack', Cookie], ['Eggs', 'Protein picks', 'egg|meat|chicken', Egg], ['Tea & coffee', 'Start your day', 'tea|coffee', Coffee]],
  Zooommart: [['Everyday finds', 'Explore the store', '', ShoppingBasket], ['Home favourites', 'For your space', 'home|clean|house', Package], ['Self care', 'Your daily routine', 'beauty|skin|hair', Sparkles], ['Little treats', 'Snacks & more', 'snack|sweet|chocolate', Gift], ['Fresh picks', 'Fruit & vegetables', 'fruit|vegetable', Apple], ['Tech finds', 'Phones & more', 'electronic|phone|laptop', Smartphone], ['Tea & coffee', 'Start your day', 'tea|coffee', Coffee]],
  Electronics: [['Phones', 'Browse mobiles', 'phone|mobile', Smartphone], ['Laptops', 'Work & play', 'laptop|computer', Laptop], ['Audio', 'Headphones', 'headphone|earphone|speaker|audio', Headphones], ['Watches', 'Wear it', 'watch|band', Watch], ['Cameras', 'Capture more', 'camera', Camera], ['Accessories', 'The little extras', 'accessor|cable|charger', Gift], ['Explore more', 'All store products', '', ShoppingBasket]],
  Beauty: [['Skin care', 'Glow routine', 'skin|face|cream', Droplets], ['Hair care', 'Strong & shiny', 'hair|shampoo', Scissors], ['Makeup', 'Explore cosmetics', 'cosmetic|makeup', Heart], ['Fragrance', 'Smell good', 'perfume|fragrance|deo', Flower2], ['Self care', 'Skin & hair', 'skin|hair|beauty', Sparkles], ['Gifting', 'Treat someone', 'gift', Gift], ['Explore more', 'All store products', '', ShoppingBasket]]
};
const PulseTitle = () => {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { const l = loopValue(v, 1200); l.start(); return () => l.stop(); }, [v]);
  return <Animated.Text style={[newStyles.posterTitle, { transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }] }]}>ZOOOM FINDS</Animated.Text>;
};
const DISC = ['#FFE167', '#5C174D', '#126342', '#2A4FA8', '#B85C00', '#6A2C91', '#0F6E78'];
const DISC_ICON = ['#751239', '#FFF0B2', '#FFF0B2', '#DCE7FF', '#FFE7C2', '#F2DAFF', '#CFF6FA'];
const HomePoster = ({ tab, onBrowse }) => <View style={newStyles.posterPanel}>
  <View style={newStyles.poster}><PosterArt /><PulseTitle /><Pressable onPress={() => onBrowse('')} accessibilityRole="button" accessibilityLabel="Explore store"><Text style={newStyles.posterCta}>EXPLORE NOW</Text></Pressable></View>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={newStyles.promoRow} snapToInterval={112} decelerationRate="fast">{COLLECTIONS[tab].map(([title, caption, match, Icon], i) => <Pressable key={title} onPress={() => onBrowse(match)} accessibilityRole="button" accessibilityLabel={`Browse ${title}`} style={newStyles.promoCard}><Text style={newStyles.promoTitle}>{title}</Text><Text style={newStyles.promoCaption}>{caption}</Text><View style={[newStyles.artDisc, { backgroundColor: DISC[i % DISC.length] }]}><Icon size={46} color={DISC_ICON[i % DISC_ICON.length]} strokeWidth={1.5}/></View><Text style={newStyles.browse}>BROWSE ›</Text></Pressable>)}</ScrollView>
</View>;
const listFrom = (res) => {
  const data = res.data?.data ?? res.data;
  const list = Array.isArray(data) ? data : data?.products ?? data?.categories;
  if (!Array.isArray(list)) throw new Error('The store returned an invalid catalog.');
  return list;
};
const categoryText = (p) => `${p.category?.name || (typeof p.category === 'string' ? p.category : '')} ${p.name || ''}`;

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
  const topPad = Math.max(insets.top, TOP_INSET_FALLBACK);
  const headerHeight = topPad + 78;
  const [topH, setTopH] = useState(170);
  const [panelH, setPanelH] = useState(76);
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastY = useRef(0);
  const downFrom = useRef(0);
  const [activeParent, setActiveParent] = useState(null);
  const [tab, setTab] = useState('Groceries');
  const themeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(themeAnim, { toValue: THEME_INDEX(tab), duration: 450, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }).start(); }, [tab, themeAnim]);
  const copyAnim = useRef(new Animated.Value(1)).current;
  const artAnim = useRef(new Animated.Value(1)).current;
  const bannerAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    copyAnim.setValue(0); artAnim.setValue(0); bannerAnim.setValue(0);
    Animated.stagger(90, [
      Animated.timing(copyAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(artAnim, { toValue: 1, duration: 480, easing: Easing.out(Easing.back(1.4)), useNativeDriver: false }),
      Animated.timing(bannerAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: false })
    ]).start();
  }, [tab, copyAnim, artAnim, bannerAnim]);
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
  const addressTitle = address ? (address.label || address.type || address.name || 'Home') : 'Add address';
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
      <Animated.ScrollView ref={scrollRef} onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false, listener: handleScroll })} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={styles.body} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" colors={['#1769FF']} progressViewOffset={topPad} />}>
      <View onLayout={e => setTopH(e.nativeEvent.layout.height)} style={[styles.header, { backgroundColor: '#1A0009', paddingTop: topPad + 8 }]}>
        
        <View style={styles.addressRow}>
        <Pressable style={styles.address} onPress={() => router.push('/addresses')} accessibilityRole="button">
          <View style={styles.addressTop}><Text style={styles.addressLabel} numberOfLines={1}>{addressTitle}</Text><ChevronRight size={18} color="#fff" strokeWidth={2.4} /></View>
          <Text style={styles.addressText} numberOfLines={1}>{addressLabel}</Text>
        </Pressable>
        <Pressable style={[styles.avatar, newStyles.avatar]} onPress={() => router.push('/(tabs)/profile')} accessibilityRole="button" accessibilityLabel="Open profile">
          {initial ? <Text style={styles.avatarText}>{initial}</Text> : <User size={18} color="#fff" />}
        </Pressable>
        </View>
        <CategoryTabs tab={tab} onSelect={name => { setTab(name); setGroup(null); }} />
      </View>
        <View style={{ height: panelH, backgroundColor: '#50001B' }} />
        <Animated.View style={{ opacity: bannerAnim, transform: [{ translateY: bannerAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}><HomePoster tab={tab} onBrowse={value => { setGroup(value || null); scrollRef.current?.scrollTo({ y: sectionOffsets.current.__products || 0, animated: true }); }} /></Animated.View>
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
        <View onLayout={e => { sectionOffsets.current.__products = e.nativeEvent.layout.y; }} style={styles.sectionHeader}><Text style={styles.sectionTitle}>{group ? 'Fresh picks for you' : tab === 'Groceries' ? 'Top deals on bestsellers' : `${tab} picks`}</Text><Pressable onPress={() => router.push('/(tabs)/search')} style={styles.seeAll}><Text style={styles.seeAllText}>See All</Text><ChevronRight size={14} color="#1769FF" /></Pressable></View>
        {productsQuery.isLoading && <ActivityIndicator color="#1769FF" style={styles.loading} />}
        {productsQuery.isError && <View style={styles.state}><Text style={styles.stateTitle}>Couldn't load your store</Text><Text style={styles.stateText}>Check your connection and try again.</Text><Pressable onPress={onRefresh}><Text style={styles.seeAllText}>Retry</Text></Pressable></View>}
        {!productsQuery.isLoading && !productsQuery.isError && !visibleProducts.length && <View style={styles.state}><Text style={styles.stateText}>No products in this collection yet.</Text><Pressable onPress={() => { setTab('Groceries'); setGroup(null); }}><Text style={styles.seeAllText}>Browse all products</Text></Pressable></View>}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shelf}>{visibleProducts.slice(0, 12).map(p => <ProductCard key={p._id} product={p} compact />)}</ScrollView>
        {visibleProducts.length > 0 && <Pressable style={styles.fullSeeAll} onPress={() => router.push('/(tabs)/search')} accessibilityRole="button"><Text style={styles.fullSeeAllText}>See All »</Text></Pressable>}
        {visibleProducts.length > 12 && <><View style={styles.sectionHeader}><Text style={styles.sectionTitle}>More everyday essentials</Text></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shelf}>{visibleProducts.slice(12, 24).map(p => <ProductCard key={p._id} product={p} compact />)}</ScrollView></>}
        <View pointerEvents="none" style={{ position: 'absolute', top: -700, left: 0, right: 0, height: 700, backgroundColor: '#1A0009' }} />
      </Animated.ScrollView>
      <Animated.View onLayout={e => setPanelH(e.nativeEvent.layout.height)} style={[styles.lowerPanel, newStyles.lowerPanel, newStyles.stickyPanel, { transform: [{ translateY: scrollY.interpolate({ inputRange: [0, Math.max(topH - topPad, 1)], outputRange: [topH, topPad], extrapolateRight: 'clamp' }) }] }]}>
        <View style={styles.searchRow}>
          <Pressable style={[styles.search, newStyles.search]} onPress={() => router.push('/(tabs)/search')} accessibilityLabel="Search products" accessibilityRole="button">
            <RotatingSearch words={searchWords} /><Search size={22} color="#A50046" strokeWidth={2.4} />
          </Pressable>
          <Pressable style={[styles.bookmark, newStyles.heartButton]} onPress={() => router.push('/wishlist')} accessibilityLabel="Wishlist" accessibilityRole="button"><Bookmark size={25} color="#A50046" strokeWidth={2.2} /></Pressable>
        </View>
      </Animated.View>
      <Animated.View pointerEvents="none" style={[newStyles.statusCover, { height: topPad, opacity: scrollY.interpolate({ inputRange: [Math.max(topH - topPad - 8, 0), Math.max(topH - topPad, 1)], outputRange: [0, 1], extrapolate: 'clamp' }) }]} />
      <Animated.View pointerEvents={showBackToTop ? 'box-none' : 'none'} style={[styles.backTopWrap, { top: headerHeight + 10, opacity: backAnim, transform: [{ translateY: backAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }] }]}><Pressable style={styles.backTop} onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })} accessibilityRole="button" accessibilityLabel="Back to top"><ChevronUp size={16} color="#fff" /><Text style={styles.backTopText}>Back to top</Text></Pressable></Animated.View>
    </View>
  );
}
const styles = StyleSheet.create({
  parentSlider: { paddingHorizontal: 14, paddingVertical: 22, gap: 10 }, parentTile: { width: 88, gap: 8, alignItems: 'center' }, parentArt: { width: 82, height: 82, borderRadius: 20, borderWidth: 2, borderColor: 'transparent' }, parentArtActive: { borderColor: '#1769FF', transform: [{ translateY: -3 }] }, parentLabelActive: { color: '#1769FF' },
  fullSeeAll: { marginHorizontal: 16, marginTop: 14, padding: 14, borderRadius: 14, backgroundColor: '#EDF8FE', alignItems: 'center' }, fullSeeAllText: { color: '#0066CC', fontSize: 16, fontFamily: typography.family.bold },
  backTopWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 20 }, backTop: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#1C1F26', paddingHorizontal: 13, paddingVertical: 8, borderRadius: 24, elevation: 5, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } }, backTopText: { color: '#fff', fontSize: 12, fontFamily: typography.family.medium },
  root: { flex: 1, backgroundColor: '#fff' }, header: { backgroundColor: '#437D29', paddingHorizontal: 0, overflow: 'hidden' },
  addressRow: { paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 }, avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.22)', borderWidth: 1.5, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#fff', fontSize: 15, fontFamily: typography.family.bold }, address: { flex: 1, paddingVertical: 2 }, addressTop: { flexDirection: 'row', alignItems: 'center', gap: 2 }, addressLabel: { color: '#fff', fontFamily: typography.family.bold, fontSize: 20, flexShrink: 1 }, addressText: { color: '#fff', fontFamily: typography.family.medium, fontSize: 12, opacity: 0.9, marginTop: 1 }, chipsRow: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6, gap: 22 }, chip: { paddingVertical: 8, alignItems: 'center' }, chipText: { color: 'rgba(255,255,255,0.75)', fontSize: 12.5, letterSpacing: 0.4, fontFamily: typography.family.bold }, chipTextActive: { color: '#fff' }, chipLine: { height: 3, borderRadius: 2, backgroundColor: '#fff', marginTop: 6, alignSelf: 'stretch' }, chipLineOff: { backgroundColor: 'transparent' },
  searchRow: { paddingHorizontal: 16, paddingTop: 14, flexDirection: 'row', gap: 10, alignItems: 'center' }, search: { flex: 1, height: 56, borderRadius: 16, backgroundColor: '#fff', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }, placeholder: { color: '#7B8378', fontSize: 13, fontFamily: typography.family.regular }, bookmark: { width: 56, height: 56, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', gap: 3 }, savedText: { fontSize: 11, color: '#20251F', fontFamily: typography.family.bold }, micDivider: { width: 1, height: 22, backgroundColor: '#D6D9D3', marginHorizontal: 10 },
  rotRow: { flexDirection: 'row', alignItems: 'center', flex: 1 }, rotWindow: { height: 18, flex: 1, overflow: 'hidden' }, rotWord: { position: 'absolute', left: 0, right: 0, top: 0, lineHeight: 18 }, heroBadge: { width: 85, height: 85, borderRadius: 42, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' }, tabsScroll: { flexGrow: 0 }, tabText: { fontSize: 13, textAlign: 'center', fontFamily: typography.family.medium }, tabTextActive: { color: '#fff', fontFamily: typography.family.bold },
  tabsRow: { paddingHorizontal: 13, alignItems: 'flex-end' },
  tabCard: { height: 96, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, borderBottomWidth: 0, borderColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 12 },
  tabCardActive: { borderColor: 'rgba(255,255,255,0.28)', paddingBottom: 6 },
  tabIconCircle: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  tabBadge: { position: 'absolute', top: -1, backgroundColor: '#1769FF', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, zIndex: 2 },
  tabBadgeText: { color: '#fff', fontSize: 10, fontFamily: typography.family.bold },
  lowerPanel: { backgroundColor: 'rgba(255,255,255,0.13)', paddingBottom: 6 },
  body: { paddingBottom: Math.max(180, TOP_INSET_FALLBACK + 140) }, greenPanel: { backgroundColor: '#437D29', overflow: 'hidden', padding: 16, paddingTop: 12, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 }, hero: { height: 100, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 }, heroCopy: { flex: 1 }, heroPink: { color: '#FFA7CC', fontSize: 25, fontWeight: '900', fontFamily: typography.family.bold }, heroWhite: { color: '#fff', fontSize: 21, fontWeight: '900', fontFamily: typography.family.bold }, heroCaption: { color: '#E7F3DE', fontSize: 11, marginTop: 5 }, heroImage: { width: 95, height: 85, borderRadius: 18 },
  featuredRow: { flexDirection: 'row', gap: 8, marginTop: 12 }, featuredTile: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 16, overflow: 'hidden', paddingTop: 10, borderWidth: 1, borderColor: '#ffffff15' }, selectedTile: { borderColor: '#fff' }, featuredName: { textAlign: 'center', fontSize: 13, lineHeight: 15, color: '#fff', fontFamily: typography.family.medium, minHeight: 32 }, featuredImage: { width: '100%', height: 76, marginTop: 4 }, priceRibbon: { backgroundColor: '#F883AD', color: '#23331C', textAlign: 'center', paddingVertical: 5, fontSize: 10, fontWeight: '800', fontFamily: typography.family.bold },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 20, marginBottom: 12 }, sectionTitle: { flex: 1, fontSize: 18, color: '#20251F', fontFamily: typography.family.bold }, seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 }, seeAllText: { color: '#1769FF', fontSize: 12, fontFamily: typography.family.medium }, shelf: { paddingHorizontal: 16, paddingBottom: 10 }, categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 }, category: { width: '25%', padding: 4, alignItems: 'center', gap: 7, marginBottom: 12 }, categoryImage: { width: '100%', height: '100%' }, categoryArt: { width: '100%', aspectRatio: 1, borderRadius: 18, backgroundColor: '#EDF8FE', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, categoryName: { fontSize: 13, lineHeight: 17, textAlign: 'center', color: '#263223', fontFamily: typography.family.bold, paddingTop: 8 }, loading: { margin: 24 }, state: { padding: 24, gap: 10 }, stateTitle: { fontSize: 16, fontWeight: '700' }, stateText: { color: '#6B7280', fontSize: 13 },
  sliderContainer: { marginTop: 24, marginBottom: 20 }, bannerImage: { width: '100%', aspectRatio: 1.488, borderRadius: 18 }, paginationRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 12, gap: 6 }, activePill: { backgroundColor: '#374151', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }, activePillText: { color: '#fff', fontSize: 10, fontFamily: typography.family.bold, fontWeight: '800' }, inactiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D1D5DB' }
});


const newStyles = StyleSheet.create({
  avatar: { width: 38, height: 32, borderRadius: 22, borderColor: '#5C3543', borderWidth: 1, backgroundColor: '#140007' },
  lowerPanel: { backgroundColor: '#50001B', paddingBottom: 10 },
  stickyPanel: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, elevation: 6, shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  statusCover: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 11, backgroundColor: '#50001B' },
  search: { height: 52, borderRadius: 12, gap: 8, paddingHorizontal: 12, shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 5, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  heartButton: { width: 48, height: 52, borderRadius: 12, borderWidth: 1.5, borderColor: '#A50046' },
  posterPanel: { backgroundColor: '#50001B', paddingBottom: 22, borderBottomLeftRadius: 25, borderBottomRightRadius: 25, overflow: 'hidden' },
  poster: { height: POSTER_H, alignItems: 'center', justifyContent: 'center', gap: 7 },
  posterTitle: { color: '#FFE62D', fontSize: 31, fontWeight: '900', letterSpacing: -1.6, fontFamily: typography.family.heavy || typography.family.bold, textShadowColor: '#AC4F00', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 1 },
  posterCta: { color: '#FFE62D', fontSize: 10, fontFamily: typography.family.bold, borderWidth: 1, borderColor: '#9D275A', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 3 },
  promoRow: { paddingHorizontal: 12, gap: 13, paddingTop: 4 },
  promoCard: { width: 99, height: 119, borderRadius: 13, borderWidth: 1, borderColor: '#B71C75', backgroundColor: '#DA0087', alignItems: 'center', overflow: 'hidden', paddingTop: 10 },
  promoTitle: { fontSize: 13, fontWeight: '700', color: '#FFF', fontFamily: typography.family.bold, textAlign: 'center', paddingHorizontal: 3 },
  promoCaption: { fontSize: 9, color: '#FFDAF3', fontFamily: typography.family.medium, textAlign: 'center', marginTop: 3 },
  artDisc: { width: 74, height: 74, borderRadius: 37, alignItems: 'center', justifyContent: 'center', marginTop: 9, borderWidth: 2, borderColor: '#E9A043' },
  browse: { position: 'absolute', bottom: 5, color: '#FFF3CB', fontFamily: typography.family.bold, fontSize: 8, backgroundColor: '#66012F', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 9 }
});
