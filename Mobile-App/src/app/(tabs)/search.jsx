import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Modal, Switch, ActivityIndicator, Alert, Keyboard, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { ChevronLeft, Search, X, ChevronDown, SlidersHorizontal, Tag, TrendingDown, Plus, Minus, Bookmark, Package, Star, Check, Clock } from 'lucide-react-native';
import { typography } from '../../constants/theme';
import { api } from '../../services/api';
import { productImages, productUnitRate } from '../../components/product/ProductCard';
import { FloatingCart, captureCartSource } from '../../components/FloatingCart';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';

const YELLOW = '#FFC928', INK = '#171C2C', RECENT_KEY = 'zooomit_search_history_v1';
const normal = value => String(value || '').toLocaleLowerCase().trim();
const activeVariants = p => (p.variants || []).filter(v => v.isActive !== false);
const priceOf = p => Number(activeVariants(p)[0]?.sellingPrice ?? p.sellingPrice ?? 0);
const discountOf = p => { const v = activeVariants(p)[0], mrp = Number(v?.mrp ?? p.mrp ?? 0), price = priceOf(p); return mrp > price && mrp > 0 ? (mrp - price) / mrp * 100 : 0; };
const stockOf = p => !p.isTrackInventory || (activeVariants(p).length ? activeVariants(p).some(v => Number(v.stock ?? p.stock ?? 0) > 0) : Number(p.stock ?? 0) > 0);
const ratingOf = p => Number(p.averageRating ?? p.rating?.average ?? (typeof p.rating === 'number' ? p.rating : 0));
const categoryOf = p => p.subcategory && typeof p.subcategory === 'object' ? p.subcategory : p.category && typeof p.category === 'object' ? p.category : null;
const brandOf = p => typeof p.brand === 'string' ? p.brand : p.brand?.name || '';
export const matchesSearch = (p, query) => { const terms = normal(query).split(/\s+/).filter(Boolean); const text = normal([p.name, brandOf(p), p.category?.name, p.subcategory?.name, ...(p.tags || [])].join(' ')); return terms.length > 0 && terms.every(term => text.includes(term)); };
export function filterSearchProducts(products, filters) {
  let list = products.filter(p => (!filters.category || String(categoryOf(p)?._id || categoryOf(p)?.name) === filters.category) && (!filters.brand || brandOf(p) === filters.brand) && (!filters.stock || stockOf(p)) && (!filters.offers || discountOf(p) > 0) && (!filters.priceDrop || discountOf(p) > 0) && (filters.min === '' || priceOf(p) >= Number(filters.min)) && (filters.max === '' || priceOf(p) <= Number(filters.max)) && (!filters.rating || ratingOf(p) >= filters.rating));
  if (filters.priceDrop) list = [...list].sort((a, b) => discountOf(b) - discountOf(a));
  else if (filters.sort === 'price_asc') list = [...list].sort((a, b) => priceOf(a) - priceOf(b));
  else if (filters.sort === 'price_desc') list = [...list].sort((a, b) => priceOf(b) - priceOf(a));
  else if (filters.sort === 'popular') list = [...list].sort((a, b) => Number(b.totalOrders || 0) - Number(a.totalOrders || 0));
  return list;
}
async function loadCatalog() {
  const products = [], seen = new Set(); let page = 1, totalPages = 1;
  do {
    const response = await api.get('/products', { params: { page, limit: 100 } });
    const payload = response.data, rows = Array.isArray(payload) ? payload : payload?.data;
    if (!Array.isArray(rows)) throw new Error('Invalid catalog response');
    rows.forEach(p => { if (p._id && p.isActive !== false && !seen.has(p._id)) { products.push(p); seen.add(p._id); } });
    totalPages = Math.max(1, Number(payload?.totalPages || 1)); page += 1;
  } while (page <= totalPages);
  return products;
}
const SORTS = [{ id: 'default', name: 'Relevance' }, { id: 'price_asc', name: 'Price: low to high' }, { id: 'price_desc', name: 'Price: high to low' }, { id: 'popular', name: 'Popularity' }];

function SearchProduct({ product }) {
  const imageRef = useRef(null), gallery = useRef(null);
  const { cart, getItemQuantity, addItem, updateItem, isUpdating } = useCart();
  const { token } = useAuth(); const { isSaved, toggleSave } = useWishlist();
  const [variantId, setVariantId] = useState(null), [imageWidth, setImageWidth] = useState(0), [activeImage, setActiveImage] = useState(0), [busy, setBusy] = useState(false);
  const variants = activeVariants(product), variant = variants.find(v => v._id === variantId) || variants[0];
  const id = variant?._id || null, price = Number(variant?.sellingPrice ?? product.sellingPrice ?? 0), mrp = Number(variant?.mrp ?? product.mrp ?? 0);
  const qty = getItemQuantity(product._id, id), images = productImages(product);
  const soldOut = product.isTrackInventory && Number(variant?.stock ?? product.stock ?? 0) <= 0;
  const min = Number(product.minSaleQty) > 0 ? Number(product.minSaleQty) : 1, step = Number(product.qtyStep) > 0 ? Number(product.qtyStep) : 1, max = Number(product.maxSaleQty) > 0 ? Number(product.maxSaleQty) : 100;
  const unit = variant?.conversionUnit || product.sellingUnit || product.baseUnit || 'PCS';
  const rate = productUnitRate(product, variant, price), rating = ratingOf(product), count = product.ratingCount ?? product.reviewCount ?? product.rating?.count;
  const open = () => router.push(`/product/${product._id}`);
  const change = async direction => {
    if (busy || isUpdating || (direction > 0 && (soldOut || qty >= max))) return;
    if (!token) { Alert.alert('Sign in needed', 'Please sign in before adding items to your cart.'); return; }
    setBusy(true);
    try {
      const source = direction > 0 ? await captureCartSource(imageRef, { ...product, featuredImage: images[activeImage] || images[0] }) : null;
      const item = cart?.items?.find(i => String(i.product?._id || i.product) === String(product._id) && String(i.variant?._id || i.variant || '') === String(id || ''));
      const next = Math.round((qty + direction * step) * 1000) / 1000;
      if (direction > 0 && qty > 0 && next > max) return;
      if (item) await updateItem(item._id, next < min ? 0 : next, source);
      else if (direction > 0) await addItem(product._id, min, id, unit, source);
    } catch (error) { Alert.alert('Cart not updated', error.message || 'Try again.'); } finally { setBusy(false); }
  };
  return <View style={styles.product}>
    <View ref={imageRef} collapsable={false} style={styles.productImage} onLayout={e => setImageWidth(e.nativeEvent.layout.width)}>
      {images.length ? <ScrollView ref={gallery} horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ flex: 1 }} onMomentumScrollEnd={e => setActiveImage(Math.max(0, Math.min(images.length - 1, Math.round(e.nativeEvent.contentOffset.x / Math.max(1, imageWidth)))))}>{images.map((uri, i) => <Pressable key={uri} onPress={open} style={{ width: imageWidth || 1, height: '100%' }} accessibilityLabel={`${product.name}, image ${i + 1}`}><Image source={{ uri }} contentFit="contain" style={styles.full} /></Pressable>)}</ScrollView> : <Pressable onPress={open} style={styles.center}><Package size={34} color="#9AA0A7" /></Pressable>}
      <Pressable onPress={async () => { try { await toggleSave(product); } catch (e) { Alert.alert('Wishlist not updated', e.message || 'Try again.'); } }} style={styles.bookmark} accessibilityLabel={`Save ${product.name}`}><Bookmark size={17} color={INK} fill={isSaved(product._id) ? YELLOW : 'none'} /></Pressable>
      <View style={styles.imageFooter} pointerEvents="none">{typeof product.isVeg === 'boolean' && <View style={[styles.veg, { borderColor: product.isVeg ? '#009B69' : '#AE302E' }]}><View style={[styles.vegDot, { backgroundColor: product.isVeg ? '#009B69' : '#AE302E' }]} /></View>}{images.length > 1 && <View style={styles.dots}>{images.map((uri, i) => <View key={uri} style={[styles.dot, i === activeImage && styles.dotActive]} />)}</View>}</View>
      <View style={styles.addPosition}>{busy ? <View style={styles.add}><ActivityIndicator size="small" color={INK} /></View> : qty > 0 ? <View style={styles.stepper}><Pressable disabled={isUpdating} onPress={() => change(-1)} style={styles.step} accessibilityLabel={`Decrease ${product.name}`}><Minus size={15} color={INK} /></Pressable><Text style={styles.quantity}>{qty}</Text><Pressable disabled={isUpdating || soldOut || qty >= max} onPress={() => change(1)} style={styles.step} accessibilityLabel={`Increase ${product.name}`}><Plus size={15} color={INK} /></Pressable></View> : soldOut ? <Text style={styles.soldOut}>Sold out</Text> : <Pressable disabled={isUpdating} onPress={() => change(1)} style={styles.add} accessibilityLabel={`Add ${product.name}`}><Plus size={25} color={INK} /></Pressable>}</View>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.packRow} contentContainerStyle={{ gap: 4 }}>{variants.length ? variants.map(v => <Pressable key={v._id} onPress={() => setVariantId(v._id)} style={[styles.pack, v._id === id && styles.packSelected]} accessibilityState={{ selected: v._id === id }}><Text style={styles.packText}>{v.name}</Text></Pressable>) : <Text style={[styles.pack, styles.packText]}>{min} {unit.toLowerCase()}</Text>}</ScrollView>
    <Pressable onPress={open}><View style={styles.priceRow}><Text style={styles.price}>₹{price}</Text>{mrp > price && <Text style={styles.mrp}>₹{mrp}</Text>}</View>{rate && <Text style={styles.unitRate}>{rate}</Text>}{mrp > price && <Text style={styles.discount}>{Math.round((mrp - price) / mrp * 100)}% OFF</Text>}<Text style={styles.productName} numberOfLines={3}>{product.name}</Text>{rating > 0 && <View style={styles.ratingRow}><Star size={11} fill="#009B69" color="#009B69" /><Text style={styles.rating}>{rating.toFixed(1)}</Text>{count != null && <Text style={styles.unitRate}>({count})</Text>}</View>}</Pressable>
  </View>;
}

export default function SearchScreen() {
  const input = useRef(null), resultsScroll = useRef(null);
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(enter, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(); }, [enter]);
  const [query, setQuery] = useState(''), [submitted, setSubmitted] = useState(''), [editing, setEditing] = useState(true), [recent, setRecent] = useState([]);
  const [category, setCategory] = useState(''), [sort, setSort] = useState('default'), [brand, setBrand] = useState(''), [min, setMin] = useState(''), [max, setMax] = useState(''), [stock, setStock] = useState(false), [rating, setRating] = useState(0), [offers, setOffers] = useState(false), [priceDrop, setPriceDrop] = useState(false), [modal, setModal] = useState(null);
  const { data: catalog = [], isLoading, isError, refetch, isFetching } = useQuery({ queryKey: ['search-catalog-dynamic-v1'], queryFn: loadCatalog, staleTime: 60000 });
  useEffect(() => { let alive = true; (async () => { try { const raw = Platform.OS === 'web' ? globalThis.localStorage?.getItem(RECENT_KEY) : await SecureStore.getItemAsync(RECENT_KEY); const saved = raw ? JSON.parse(raw) : []; if (alive && Array.isArray(saved)) setRecent(saved.filter(x => typeof x === 'string')); } catch {} })(); return () => { alive = false; }; }, []);
  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const matched = catalog.filter(p => matchesSearch(p, query)), rows = new Map();
    for (const p of matched) {
      const cat = categoryOf(p);
      if (cat?.name && normal(cat.name).includes(normal(query))) rows.set(`cat:${cat._id || cat.name}`, { name: cat.name, image: cat.image || productImages(p)[0] });
    }
    for (const p of matched) rows.set(`product:${p._id}`, { name: p.name, image: productImages(p)[0] });
    return [...rows.values()].slice(0, 8);
  }, [catalog, query]);
  const matching = useMemo(() => catalog.filter(p => matchesSearch(p, submitted)), [catalog, submitted]);
  const categories = useMemo(() => { const map = new Map(); matching.forEach(p => { const c = categoryOf(p); if (c?.name) map.set(String(c._id || c.name), { id: String(c._id || c.name), name: c.name, image: c.image || productImages(p)[0] }); }); return [...map.values()]; }, [matching]);
  const brands = useMemo(() => [...new Set(matching.map(brandOf).filter(Boolean))].sort(), [matching]);
  const products = useMemo(() => filterSearchProducts(matching, { category, sort, brand, min, max, stock, rating, offers, priceDrop }), [matching, category, sort, brand, min, max, stock, rating, offers, priceDrop]);
  const clearFilters = () => { setBrand(''); setMin(''); setMax(''); setStock(false); setRating(0); setOffers(false); setPriceDrop(false); setSort('default'); };
  const submit = async value => {
    const clean = value.trim(); if (!clean) return;
    setQuery(clean); setSubmitted(clean); setEditing(false); setCategory(''); clearFilters(); Keyboard.dismiss(); input.current?.blur(); resultsScroll.current?.scrollTo({ y: 0, animated: false });
    const updated = [clean, ...recent.filter(x => normal(x) !== normal(clean))].slice(0, 8); setRecent(updated);
    try { if (Platform.OS === 'web') globalThis.localStorage?.setItem(RECENT_KEY, JSON.stringify(updated)); else await SecureStore.setItemAsync(RECENT_KEY, JSON.stringify(updated)); } catch {}
  };
  const filterCount = Number(Boolean(brand)) + Number(min !== '' || max !== '') + Number(stock) + Number(rating > 0);
  const resultsVisible = !editing && Boolean(submitted);
  const thumbnail = (uri, size = 40) => <View style={{ width: size, height: size, borderRadius: 9, backgroundColor: '#F4F4F6', alignItems: 'center', justifyContent: 'center' }}>{uri ? <Image source={{ uri }} contentFit="contain" style={styles.full} /> : <Package size={24} color="#9AA0A7" />}</View>;
  return <Animated.View style={{ flex: 1, backgroundColor: '#fff', opacity: enter, transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }}><SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
    <View style={[styles.searchHeader, resultsVisible && styles.headerYellow]}><View style={[styles.searchBox, resultsVisible && { backgroundColor: '#fff' }]}><Pressable onPress={() => { if (resultsVisible) { setEditing(true); input.current?.focus(); } else if (router.canGoBack()) router.back(); else router.replace('/'); }} accessibilityLabel="Go back"><ChevronLeft size={25} color={INK} /></Pressable><TextInput ref={input} style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' }]} value={query} placeholder="Search products" placeholderTextColor="#94969C" selectionColor={YELLOW} returnKeyType="search" onChangeText={v => { setQuery(v); setEditing(true); }} onFocus={() => setEditing(true)} onSubmitEditing={() => submit(query)} autoCorrect={false} /><Pressable onPress={() => { setQuery(''); setSubmitted(''); setEditing(true); input.current?.focus(); }} accessibilityLabel="Clear search"><X size={25} color="#82868C" /></Pressable></View></View>
    {resultsVisible ? <ScrollView ref={resultsScroll} stickyHeaderIndices={[0]} style={styles.scroll} contentContainerStyle={{ paddingBottom: 155 }} keyboardShouldPersistTaps="handled">
      <View style={styles.sticky}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
          {[{ id: '', name: 'All items', image: productImages(matching[0])[0] }, ...categories].map(c => <Pressable key={c.id} onPress={() => { setCategory(c.id); resultsScroll.current?.scrollTo({ y: 0, animated: true }); }} style={styles.category} accessibilityRole="button" accessibilityState={{ selected: category === c.id }}>{thumbnail(c.image, 53)}<Text numberOfLines={1} style={[styles.categoryName, category === c.id && { fontFamily: typography.family.bold }]}>{c.name}</Text><View style={[styles.underline, category === c.id && { backgroundColor: YELLOW }]} /></Pressable>)}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}><Pressable style={[styles.chip, filterCount > 0 && styles.chipOn]} onPress={() => setModal('filters')} accessibilityLabel="Filters"><SlidersHorizontal size={19} color={INK} />{filterCount > 0 && <Text style={styles.chipText}>{filterCount}</Text>}</Pressable><Pressable style={[styles.chip, sort !== 'default' && styles.chipOn]} onPress={() => setModal('sort')}><Text style={styles.chipText}>Sort by</Text><ChevronDown size={17} color={INK} /></Pressable><Pressable style={[styles.chip, offers && styles.chipOn]} onPress={() => setOffers(v => !v)} accessibilityState={{ selected: offers }}><Tag size={18} color="#C49700" /><Text style={styles.chipText}>Offers</Text></Pressable><Pressable style={[styles.chip, priceDrop && styles.chipOn]} onPress={() => setPriceDrop(v => !v)} accessibilityState={{ selected: priceDrop }}><TrendingDown size={18} color="#DC3547" /><Text style={styles.chipText}>Price drop</Text></Pressable></ScrollView>
      </View>
      {isLoading ? <View style={styles.empty}><ActivityIndicator color={INK} /><Text style={styles.emptyText}>Loading products...</Text></View> : isError ? <View style={styles.empty}><Text style={styles.emptyText}>Could not load the catalog</Text><Pressable onPress={() => refetch()} style={styles.primary}><Text>Try again</Text></Pressable></View> : products.length ? <View style={styles.grid}>{products.map(p => <View key={p._id} style={styles.cell}><SearchProduct product={p} /></View>)}</View> : <View style={styles.empty}><Search size={32} color="#8A8E96" /><Text style={styles.emptyTitle}>{matching.length ? 'No products match these filters' : `No results for "${submitted}"`}</Text>{matching.length > 0 && <Pressable style={styles.primary} onPress={() => { clearFilters(); setCategory(''); }}><Text>Clear filters</Text></Pressable>}</View>}
    </ScrollView> : <ScrollView style={styles.scroll} contentContainerStyle={styles.suggestionList} keyboardShouldPersistTaps="handled">
      {isError && <Pressable onPress={() => refetch()} style={styles.retry}><Text style={styles.emptyText}>Could not load suggestions. Tap to retry.</Text></Pressable>}
      {query.trim() ? <>{isLoading && <ActivityIndicator color={INK} style={{ margin: 20 }} />}{suggestions.map((s, i) => <Pressable key={`${s.name}:${i}`} style={styles.suggestion} onPress={() => submit(s.name)}>{thumbnail(s.image)}<Text numberOfLines={2} style={styles.suggestionName}>{s.name}</Text><Search size={21} color="#999DA0" /></Pressable>)}<Pressable style={styles.suggestion} onPress={() => submit(query)}><View style={styles.showAllIcon}><Search size={25} color={INK} /></View><Text style={styles.showAll}>Show all results for <Text style={{ fontFamily: typography.family.bold }}>'{query.trim()}'</Text></Text></Pressable></> : <>{recent.length > 0 && <Text style={styles.sectionTitle}>Recent searches</Text>}{recent.map(term => <Pressable key={term} style={styles.suggestion} onPress={() => submit(term)}><View style={styles.showAllIcon}><Clock size={20} color={INK} /></View><Text style={styles.suggestionName}>{term}</Text><Search size={20} color="#999DA0" /></Pressable>)}{!recent.length && !isFetching && <View style={styles.empty}><Search size={30} color="#999DA0" /><Text style={styles.emptyText}>Search your store's products</Text></View>}</>}
    </ScrollView>}
    <FloatingCart visible={resultsVisible} bottom={24} />
    <Modal transparent visible={modal !== null} animationType="slide" onRequestClose={() => setModal(null)}><View style={styles.modalOverlay}><Pressable style={styles.backdrop} onPress={() => setModal(null)} accessibilityLabel="Close filters" /><View style={styles.sheet}><View style={styles.sheetTitle}><Text style={styles.emptyTitle}>{modal === 'sort' ? 'Sort by' : 'Filters'}</Text><Pressable onPress={() => setModal(null)} accessibilityLabel="Close"><X size={23} color={INK} /></Pressable></View><ScrollView keyboardShouldPersistTaps="handled">
      {modal === 'sort' ? SORTS.filter(s => s.id !== 'popular' || matching.some(p => Number(p.totalOrders) > 0)).map(s => <Pressable key={s.id} style={styles.option} onPress={() => { setSort(s.id); setPriceDrop(false); setModal(null); }}><Text style={styles.optionText}>{s.name}</Text>{sort === s.id && <Check size={20} color={INK} />}</Pressable>) : <><Text style={styles.sectionTitle}>Price range</Text><View style={styles.range}><TextInput style={styles.rangeInput} keyboardType="decimal-pad" placeholder="Min ₹" value={min} onChangeText={v => setMin(v.replace(/[^\d.]/g, ''))} /><TextInput style={styles.rangeInput} keyboardType="decimal-pad" placeholder="Max ₹" value={max} onChangeText={v => setMax(v.replace(/[^\d.]/g, ''))} /></View><View style={styles.option}><Text style={styles.optionText}>In stock only</Text><Switch value={stock} onValueChange={setStock} trackColor={{ true: YELLOW }} /></View>{brands.length > 0 && <><Text style={styles.sectionTitle}>Brand</Text>{['', ...brands].map(b => <Pressable key={b || 'all'} style={styles.option} onPress={() => setBrand(b)}><Text style={styles.optionText}>{b || 'All brands'}</Text>{brand === b && <Check size={19} color={INK} />}</Pressable>)}</>}{matching.some(p => ratingOf(p) > 0) && <><Text style={styles.sectionTitle}>Minimum rating</Text>{[0, ...[...new Set(matching.map(p => Math.floor(ratingOf(p))).filter(v => v > 0))].sort((a, b) => b - a)].map(v => <Pressable key={v} style={styles.option} onPress={() => setRating(v)}><Text style={styles.optionText}>{v ? `${v} stars & above` : 'Any rating'}</Text>{rating === v && <Check size={19} color={INK} />}</Pressable>)}</>}</>}
      </ScrollView>{modal === 'filters' && <View style={styles.sheetActions}><Pressable onPress={clearFilters}><Text style={styles.optionText}>Reset</Text></Pressable><Pressable style={styles.primary} onPress={() => { if ((min !== '' && !Number.isFinite(Number(min))) || (max !== '' && !Number.isFinite(Number(max))) || (min !== '' && max !== '' && Number(min) > Number(max))) { Alert.alert('Check price range', 'Enter a valid minimum and maximum price.'); return; } setModal(null); }}><Text style={styles.optionText}>Show {products.length} products</Text></Pressable></View>}</View></View></Modal>
  </SafeAreaView></Animated.View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' }, full: { width: '100%', height: '100%' }, center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, scroll: { flex: 1 },
  searchHeader: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 12, backgroundColor: '#fff' }, headerYellow: { backgroundColor: '#FFF7D6' }, searchBox: { backgroundColor: '#F2F1F5', borderRadius: 14, height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 12 }, input: { flex: 1, fontFamily: typography.family.medium, fontSize: 18, color: INK, paddingVertical: 8 },
  suggestionList: { paddingHorizontal: 16, paddingTop: 2, paddingBottom: 90 }, suggestion: { flexDirection: 'row', alignItems: 'center', gap: 13, minHeight: 59, paddingVertical: 8 }, suggestionName: { flex: 1, fontFamily: typography.family.medium, fontSize: 17, color: INK }, showAllIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF4C6', alignItems: 'center', justifyContent: 'center' }, showAll: { flex: 1, fontFamily: typography.family.medium, fontSize: 16, color: INK },
  sticky: { backgroundColor: '#fff', zIndex: 10 }, categories: { backgroundColor: '#FFF7D6', minWidth: '100%', paddingHorizontal: 14, gap: 12 }, category: { width: 71, alignItems: 'center', paddingTop: 4 }, categoryName: { width: '100%', textAlign: 'center', fontFamily: typography.family.medium, fontSize: 12, color: INK, marginTop: 7, marginBottom: 12 }, underline: { height: 4, width: '100%', borderTopLeftRadius: 5, borderTopRightRadius: 5 }, filters: { paddingHorizontal: 16, paddingVertical: 12, gap: 9 }, chip: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderColor: '#ECECEF', borderRadius: 10, height: 40, paddingHorizontal: 12, backgroundColor: '#fff' }, chipOn: { backgroundColor: '#FFF4C6', borderColor: YELLOW }, chipText: { fontFamily: typography.family.medium, fontSize: 14, color: INK },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, justifyContent: 'space-between', rowGap: 18 }, cell: { width: '31.8%' }, product: { minWidth: 0 }, productImage: { width: '100%', aspectRatio: 0.95, borderRadius: 10, backgroundColor: '#F4F5F6', overflow: 'hidden' }, bookmark: { position: 'absolute', top: 3, right: 3, padding: 4 }, imageFooter: { position: 'absolute', bottom: 5, left: 5, flexDirection: 'row', alignItems: 'center', gap: 5 }, veg: { width: 13, height: 13, borderWidth: 1, borderRadius: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }, vegDot: { width: 8, height: 8, borderRadius: 4 }, dots: { flexDirection: 'row', gap: 3 }, dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#CDD0D3' }, dotActive: { backgroundColor: '#91969C' }, addPosition: { position: 'absolute', bottom: 0, right: 0 }, add: { height: 33, width: 35, borderRadius: 9, backgroundColor: YELLOW, alignItems: 'center', justifyContent: 'center' }, stepper: { flexDirection: 'row', height: 33, borderRadius: 9, backgroundColor: YELLOW, alignItems: 'center' }, step: { width: 25, height: 33, alignItems: 'center', justifyContent: 'center' }, quantity: { fontFamily: typography.family.bold, fontSize: 12, color: INK }, soldOut: { fontSize: 10, fontFamily: typography.family.medium, padding: 5, backgroundColor: '#fff', color: '#737780', borderRadius: 6 },
  packRow: { marginTop: 5, marginBottom: 3, flexGrow: 0 }, pack: { paddingHorizontal: 5, paddingVertical: 3, borderWidth: 1, borderColor: '#EEEEF1', borderRadius: 5 }, packSelected: { backgroundColor: '#FFF6D4' }, packText: { fontSize: 10, fontFamily: typography.family.medium, color: INK }, priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 }, price: { fontSize: 16, fontFamily: typography.family.bold, color: INK }, mrp: { fontSize: 10, fontFamily: typography.family.regular, color: '#91959D', textDecorationLine: 'line-through' }, unitRate: { fontSize: 10, fontFamily: typography.family.regular, color: '#90949C', marginTop: 3 }, discount: { fontSize: 10, fontFamily: typography.family.bold, color: '#009B69', marginTop: 3 }, productName: { fontSize: 12, lineHeight: 16, fontFamily: typography.family.medium, color: INK, marginTop: 4 }, ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 }, rating: { fontSize: 10, fontFamily: typography.family.bold, color: '#009B69' },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 }, emptyTitle: { fontSize: 18, fontFamily: typography.family.bold, color: INK, textAlign: 'center' }, emptyText: { fontSize: 14, fontFamily: typography.family.medium, color: '#81858D', textAlign: 'center' }, primary: { backgroundColor: YELLOW, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10 }, retry: { paddingVertical: 16 }, sectionTitle: { fontFamily: typography.family.bold, fontSize: 15, color: INK, marginVertical: 16 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' }, backdrop: { position: 'absolute', top: 0, bottom: 0, right: 0, left: 0 }, sheet: { backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 35, maxHeight: '80%' }, sheetTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }, option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F1F3' }, optionText: { fontFamily: typography.family.medium, fontSize: 15, color: INK }, range: { flexDirection: 'row', gap: 12 }, rangeInput: { flex: 1, minWidth: 0, width: 0, borderWidth: 1, borderColor: '#E6E6EB', borderRadius: 10, padding: 12, fontFamily: typography.family.medium, color: INK }, sheetActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }
});
