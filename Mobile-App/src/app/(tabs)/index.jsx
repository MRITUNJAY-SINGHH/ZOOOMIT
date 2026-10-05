import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, ActivityIndicator, Animated, Easing, Platform, StatusBar as RNStatusBar } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Search, Bookmark, ShoppingBasket, Snowflake, Apple, Sparkles, Gift, Package, ChevronDown, ChevronRight } from 'lucide-react-native';
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
  useEffect(() => { Animated.timing(v, { toValue: active ? 1 : 0, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(); }, [active, v]);
  const lift = v.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });
  const bg = v.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,255,255,0)', 'rgba(255,255,255,0.22)'] });
  const bar = v.interpolate({ inputRange: [0, 1], outputRange: [0, 26] });
  return <Pressable onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: active }} style={styles.tabPress}>
    <Animated.View style={[styles.tab, { backgroundColor: bg, transform: [{ translateY: lift }, { scale }] }]}>
      <Icon size={22} color="#fff" strokeWidth={active ? 2.1 : 1.6} />
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{name}</Text>
      <Animated.View style={[styles.tabBar, { width: bar, opacity: v }]} />
    </Animated.View>
  </Pressable>;
};
const TOP_INSET_FALLBACK = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 28) : 44;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { customer } = useAuth();
  const { onScrollHandler } = useTabBarVisibility();
  const [tab, setTab] = useState('All');
  const [group, setGroup] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const productsQuery = useQuery({ queryKey: ['instamart-home-products'], queryFn: async () => listFrom(await api.get('/products', { params: { limit: 60 } })) });
  const categoriesQuery = useQuery({ queryKey: ['instamart-home-categories'], queryFn: async () => listFrom(await api.get('/categories')) });
  const products = productsQuery.data || [];
  const categories = categoriesQuery.data || [];
  const address = customer?.addresses?.find(a => a.isDefault) || customer?.addresses?.[0];
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
      <View style={[styles.header, { paddingTop: Math.max(insets.top, TOP_INSET_FALLBACK) + 8 }]}>
        <Pressable style={styles.address} onPress={() => router.push('/addresses')} accessibilityRole="button">
          <Text style={styles.addressText} numberOfLines={1}>{addressLabel}</Text><ChevronDown size={14} color="#fff" />
        </Pressable>
        <View style={styles.searchRow}>
          <Pressable style={styles.search} onPress={() => router.push('/(tabs)/search')} accessibilityLabel="Search products" accessibilityRole="button">
            <Text style={styles.placeholder}>Search for 'Apples'</Text><Search size={19} color="#637164" />
          </Pressable>
          <Pressable style={styles.bookmark} onPress={() => router.push('/wishlist')} accessibilityLabel="Wishlist" accessibilityRole="button"><Bookmark size={22} color="#fff" /></Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {TABS.map(t => <TabItem key={t.name} name={t.name} icon={t.icon} active={t.name === tab} onPress={() => { setTab(t.name); setGroup(null); }} />)}
        </ScrollView>
      </View>
      <ScrollView onScroll={onScrollHandler} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={styles.body} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" colors={['#1769FF']} />}>
        <View style={styles.greenPanel}>
          <View style={styles.hero}>
            <View style={styles.heroCopy}><Text style={styles.heroPink}>Fresh picks</Text><Text style={styles.heroWhite}>EVERY DAY</Text><Text style={styles.heroCaption}>Fruits, vegetables & more</Text></View>
            <Image source={{ uri: GROUPS[0].image }} style={styles.heroImage} contentFit="cover" />
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
        </View>
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{group ? 'Fresh picks for you' : tab === 'All' ? 'Top deals on bestsellers' : `${tab} picks`}</Text><Pressable onPress={() => router.push('/(tabs)/search')} style={styles.seeAll}><Text style={styles.seeAllText}>See All</Text><ChevronRight size={14} color="#1769FF" /></Pressable></View>
        {productsQuery.isLoading && <ActivityIndicator color="#1769FF" style={styles.loading} />}
        {productsQuery.isError && <View style={styles.state}><Text style={styles.stateTitle}>Couldn't load your store</Text><Text style={styles.stateText}>Check your connection and try again.</Text><Pressable onPress={onRefresh}><Text style={styles.seeAllText}>Retry</Text></Pressable></View>}
        {!productsQuery.isLoading && !productsQuery.isError && !visibleProducts.length && <View style={styles.state}><Text style={styles.stateText}>No products in this collection yet.</Text><Pressable onPress={() => { setTab('All'); setGroup(null); }}><Text style={styles.seeAllText}>Browse all products</Text></Pressable></View>}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shelf}>{visibleProducts.slice(0, 12).map(p => <ProductCard key={p._id} product={p} compact />)}</ScrollView>
        {categories.length > 0 && <><View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Shop by category</Text></View><View style={styles.categoryGrid}>{categories.map(c => <Pressable key={c._id || c.id} style={styles.category} onPress={() => openCategory(c)}>
          {c.image || c.featuredImage ? <Image source={{ uri: c.image || c.featuredImage }} style={styles.categoryImage} contentFit="contain" /> : <ShoppingBasket size={30} color="#467B29" />}
          <Text style={styles.categoryName} numberOfLines={2}>{c.name}</Text>
        </Pressable>)}</View></>}
        {visibleProducts.length > 12 && <><View style={styles.sectionHeader}><Text style={styles.sectionTitle}>More everyday essentials</Text></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shelf}>{visibleProducts.slice(12, 24).map(p => <ProductCard key={p._id} product={p} compact />)}</ScrollView></>}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' }, header: { backgroundColor: '#437D29', paddingHorizontal: 16 },
  address: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 12, paddingVertical: 4 }, addressText: { color: '#fff', fontFamily: typography.family.medium, fontSize: 12, flexShrink: 1 },
  searchRow: { flexDirection: 'row', gap: 10, alignItems: 'center' }, search: { flex: 1, height: 44, borderRadius: 13, backgroundColor: '#fff', paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, placeholder: { color: '#7B8378', fontSize: 13, fontFamily: typography.family.regular }, bookmark: { width: 38, height: 44, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexGrow: 1, justifyContent: 'space-between', paddingTop: 16, paddingBottom: 0 }, tabPress: { flex: 1, alignItems: 'center' }, tab: { minWidth: 52, alignItems: 'center', gap: 5, paddingHorizontal: 7, paddingTop: 7, paddingBottom: 8, borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, marginBottom: 6 }, tabBar: { height: 3, borderRadius: 2, backgroundColor: '#fff', marginTop: 1 }, tabText: { fontSize: 10, color: '#DDEBD5', fontFamily: typography.family.medium }, tabTextActive: { color: '#fff', fontFamily: typography.family.bold },
  body: { paddingBottom: 125 }, greenPanel: { backgroundColor: '#437D29', padding: 16, paddingTop: 12, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 }, hero: { height: 100, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 }, heroCopy: { flex: 1 }, heroPink: { color: '#FFA7CC', fontSize: 25, fontWeight: '900', fontFamily: typography.family.bold }, heroWhite: { color: '#fff', fontSize: 21, fontWeight: '900', fontFamily: typography.family.bold }, heroCaption: { color: '#E7F3DE', fontSize: 11, marginTop: 5 }, heroImage: { width: 95, height: 85, borderRadius: 18 },
  featuredRow: { flexDirection: 'row', gap: 8, marginTop: 12 }, featuredTile: { flex: 1, backgroundColor: '#193F17', borderRadius: 16, overflow: 'hidden', paddingTop: 10, borderWidth: 1, borderColor: '#ffffff15' }, selectedTile: { borderColor: '#fff' }, featuredName: { textAlign: 'center', fontSize: 13, lineHeight: 15, color: '#fff', fontFamily: typography.family.medium, minHeight: 32 }, featuredImage: { width: '100%', height: 76, marginTop: 4 }, priceRibbon: { backgroundColor: '#F883AD', color: '#23331C', textAlign: 'center', paddingVertical: 5, fontSize: 10, fontWeight: '800', fontFamily: typography.family.bold },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 20, marginBottom: 12 }, sectionTitle: { flex: 1, fontSize: 15, color: '#20251F', fontFamily: typography.family.bold }, seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 }, seeAllText: { color: '#1769FF', fontSize: 12, fontFamily: typography.family.medium }, shelf: { paddingHorizontal: 16, paddingBottom: 10 }, categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10 }, category: { width: '25%', padding: 6, alignItems: 'center', gap: 7, marginBottom: 12 }, categoryImage: { width: '100%', height: 70, borderRadius: 12, backgroundColor: '#F2F7EE' }, categoryName: { fontSize: 11, textAlign: 'center', color: '#263223', fontFamily: typography.family.medium }, loading: { margin: 24 }, state: { padding: 24, gap: 10 }, stateTitle: { fontSize: 16, fontWeight: '700' }, stateText: { color: '#6B7280', fontSize: 13 }
});
