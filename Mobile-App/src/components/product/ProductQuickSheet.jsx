import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Animated, PanResponder, useWindowDimensions, ActivityIndicator, Alert, Share } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Plus, Minus, X, ChevronDown, ChevronRight, Bookmark, Share2, Package, Truck, RotateCcw, Headphones } from 'lucide-react-native';
import { colors, typography } from '../../constants/theme';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { api } from '../../services/api';

const idOf = value => typeof value === 'object' ? value?._id : value;
const imageOf = p => p?.featuredImage || p?.galleryImages?.[0];
const typeOf = v => (v?.attributes || []).find(a => /^(type|variety)$/i.test(a.key))?.value || '';
const unitOf = (p, v) => v?.conversionUnit || p.sellingUnit || p.baseUnit || 'PCS';
const priceOf = (p, v) => Number(v?.sellingPrice ?? p.sellingPrice ?? 0);

// One sheet stays mounted while moving between preview and full details.
// The handle owns the drag so product scrolling and quantity taps remain usable.
export function ProductQuickSheet({ product, mode = 'details', initialVariantId, onClose }) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compactHeight = Math.min(height - insets.top - 16, height * (mode === 'variants' ? 0.66 : 0.88));
  const fullHeight = Math.max(compactHeight, height - insets.top - 8);
  const sheetHeight = useRef(new Animated.Value(compactHeight)).current;
  const snap = useRef(compactHeight);
  const [expanded, setExpanded] = useState(false);
  const [view, setView] = useState(mode);
  const [selectedId, setSelectedId] = useState(initialVariantId || product?.variants?.[0]?._id || null);
  const [selectedType, setSelectedType] = useState('');
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const draftTouched = useRef(false);
  const { cart, addItem, updateItem, isUpdating } = useCart();
  const { token } = useAuth();
  const { isSaved, toggleSave } = useWishlist();
  const detailQuery = useQuery({
    queryKey: ['quick-product-details', product?._id], enabled: Boolean(product?._id),
    queryFn: async () => {
      const res = await api.get(`/products/${encodeURIComponent(product._id)}`);
      const data = res.data?.data ?? res.data;
      if (!data?.name) throw new Error('Product details could not be loaded.');
      return data;
    }
  });
  const p = detailQuery.data || product;
  const variants = p?.variants || [];
  const options = variants.length ? variants : [{ _id: null, name: `${p?.minSaleQty || 1} ${unitOf(p || {}, null)}` }];
  const types = useMemo(() => [...new Set(variants.map(typeOf).filter(Boolean))], [variants]);
  const selected = options.find(v => v._id === selectedId) || options[0];
  const visibleOptions = selectedType ? options.filter(v => typeOf(v) === selectedType) : options;
  const cartItem = v => cart?.items?.find(i => idOf(i.product) === p?._id && (idOf(i.variant) || null) === (v?._id || null));
  const qty = v => cartItem(v)?.qty || 0;
  const keyOf = v => v?._id || 'base';
  const stock = v => Number(v?.stock ?? p?.stock ?? 0);
  const soldOut = v => Boolean(p?.isTrackInventory) && stock(v) <= 0;
  const min = Number(p?.minSaleQty || 1);
  const step = Number(p?.qtyStep || 1);
  const max = v => Math.min(Number(p?.maxSaleQty || 100), p?.isTrackInventory ? stock(v) : Infinity);
  const price = priceOf(p || {}, selected);
  const mrp = Number(selected?.mrp ?? p?.mrp ?? 0);
  const discount = mrp > price && mrp > 0 ? Math.round((mrp - price) / mrp * 100) : 0;
  const round = n => Math.round(n * 1000) / 1000;
  const move = (to, isFull) => {
    snap.current = to;
    setExpanded(isFull);
    Animated.spring(sheetHeight, { toValue: to, useNativeDriver: false, damping: 24, stiffness: 220, mass: 0.8 }).start();
  };
  useEffect(() => {
    const next = {};
    options.forEach(v => { next[keyOf(v)] = qty(v); });
    setDraft(next);
    setSelectedType(typeOf(options.find(v => v._id === initialVariantId) || options[0]));
  }, [product?._id]);
  useEffect(() => {
    if (!detailQuery.data || draftTouched.current) return;
    const next = {}; options.forEach(v => { next[keyOf(v)] = qty(v); }); setDraft(next);
  }, [detailQuery.data]);
  const pan = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 8 && Math.abs(g.dy) > Math.abs(g.dx),
    onPanResponderMove: (_, g) => sheetHeight.setValue(Math.max(180, Math.min(fullHeight, snap.current - g.dy))),
    onPanResponderRelease: (_, g) => {
      if (g.dy < -45 || g.vy < -0.5) { setView('details'); move(fullHeight, true); }
      else if (g.dy > 70 || g.vy > 0.6) { if (expanded) move(compactHeight, false); else onClose(); }
      else move(snap.current, expanded);
    },
    onPanResponderTerminate: () => move(snap.current, expanded)
  });
  const requireLogin = () => { if (token) return true; Alert.alert('Sign in needed', 'Please sign in before adding items to your cart.'); return false; };
  const update = async (v, next) => {
    const item = cartItem(v);
    if (item) await updateItem(item._id, next);
    else if (next > 0) await addItem(p._id, next, v?._id || null, unitOf(p, v));
  };
  const change = async (v, direction, staged = false) => {
    if (saving || isUpdating || soldOut(v)) return;
    const current = staged ? (draft[keyOf(v)] || 0) : qty(v);
    const next = direction > 0 ? (current ? round(current + step) : min) : (round(current - step) < min ? 0 : round(current - step));
    if (next > max(v)) return;
    if (staged) { draftTouched.current = true; setDraft(prev => ({ ...prev, [keyOf(v)]: next })); return; }
    if (!requireLogin()) return;
    setSaving(true);
    try { await update(v, next); } catch (e) { Alert.alert('Cart not updated', e.message || 'Please try again.'); } finally { setSaving(false); }
  };
  const confirm = async () => {
    if (!requireLogin() || saving || isUpdating) return;
    setSaving(true);
    try {
      // Preserve API ordering and do not close until every selected variant is saved.
      for (const v of options) {
        const desired = draft[keyOf(v)] ?? qty(v);
        if (desired !== qty(v)) await update(v, desired);
      }
      onClose();
    } catch (e) { Alert.alert('Some items could not be updated', e.message || 'Please check your cart and try again.'); }
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Animated, PanResponder, useWindowDimensions, ActivityIndicator, Alert, Share } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Plus, Minus, X, ChevronDown, ChevronRight, Bookmark, Share2, Package, Truck, RotateCcw, Headphones } from 'lucide-react-native';
import { colors, typography } from '../../constants/theme';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { api } from '../../services/api';

const idOf = value => typeof value === 'object' ? value?._id : value;
const imageOf = p => p?.featuredImage || p?.galleryImages?.[0];
const typeOf = v => (v?.attributes || []).find(a => /^(type|variety)$/i.test(a.key))?.value || '';
const unitOf = (p, v) => v?.conversionUnit || p.sellingUnit || p.baseUnit || 'PCS';
const priceOf = (p, v) => Number(v?.sellingPrice ?? p.sellingPrice ?? 0);

// One sheet stays mounted while moving between preview and full details.
// The handle owns the drag so product scrolling and quantity taps remain usable.
export function ProductQuickSheet({ product, mode = 'details', initialVariantId, onClose }) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compactHeight = Math.min(height - insets.top - 16, height * (mode === 'variants' ? 0.66 : 0.88));
  const fullHeight = Math.max(compactHeight, height - insets.top - 8);
  const sheetHeight = useRef(new Animated.Value(compactHeight)).current;
  const snap = useRef(compactHeight);
  const [expanded, setExpanded] = useState(false);
  const [view, setView] = useState(mode);
  const [selectedId, setSelectedId] = useState(initialVariantId || product?.variants?.[0]?._id || null);
  const [selectedType, setSelectedType] = useState('');
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const draftTouched = useRef(false);
  const { cart, addItem, updateItem, isUpdating } = useCart();
  const { token } = useAuth();
  const { isSaved, toggleSave } = useWishlist();
  const detailQuery = useQuery({
    queryKey: ['quick-product-details', product?._id], enabled: Boolean(product?._id),
    queryFn: async () => {
      const res = await api.get(`/products/${encodeURIComponent(product._id)}`);
      const data = res.data?.data ?? res.data;
      if (!data?.name) throw new Error('Product details could not be loaded.');
      return data;
    }
  });
  const p = detailQuery.data || product;
  const variants = p?.variants || [];
  const options = variants.length ? variants : [{ _id: null, name: `${p?.minSaleQty || 1} ${unitOf(p || {}, null)}` }];
  const types = useMemo(() => [...new Set(variants.map(typeOf).filter(Boolean))], [variants]);
  const selected = options.find(v => v._id === selectedId) || options[0];
  const visibleOptions = selectedType ? options.filter(v => typeOf(v) === selectedType) : options;
  const cartItem = v => cart?.items?.find(i => idOf(i.product) === p?._id && (idOf(i.variant) || null) === (v?._id || null));
  const qty = v => cartItem(v)?.qty || 0;
  const keyOf = v => v?._id || 'base';
  const stock = v => Number(v?.stock ?? p?.stock ?? 0);
  const soldOut = v => Boolean(p?.isTrackInventory) && stock(v) <= 0;
  const min = Number(p?.minSaleQty || 1);
  const step = Number(p?.qtyStep || 1);
  const max = v => Math.min(Number(p?.maxSaleQty || 100), p?.isTrackInventory ? stock(v) : Infinity);
  const price = priceOf(p || {}, selected);
  const mrp = Number(selected?.mrp ?? p?.mrp ?? 0);
  const discount = mrp > price && mrp > 0 ? Math.round((mrp - price) / mrp * 100) : 0;
  const round = n => Math.round(n * 1000) / 1000;
  const move = (to, isFull) => {
    snap.current = to;
    setExpanded(isFull);
    Animated.spring(sheetHeight, { toValue: to, useNativeDriver: false, damping: 24, stiffness: 220, mass: 0.8 }).start();
  };
  useEffect(() => {
    const next = {};
    options.forEach(v => { next[keyOf(v)] = qty(v); });
    setDraft(next);
    setSelectedType(typeOf(options.find(v => v._id === initialVariantId) || options[0]));
  }, [product?._id]);
  useEffect(() => {
    if (!detailQuery.data || draftTouched.current) return;
    const next = {}; options.forEach(v => { next[keyOf(v)] = qty(v); }); setDraft(next);
  }, [detailQuery.data]);
  const pan = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 8 && Math.abs(g.dy) > Math.abs(g.dx),
    onPanResponderMove: (_, g) => sheetHeight.setValue(Math.max(180, Math.min(fullHeight, snap.current - g.dy))),
    onPanResponderRelease: (_, g) => {
      if (g.dy < -45 || g.vy < -0.5) { setView('details'); move(fullHeight, true); }
      else if (g.dy > 70 || g.vy > 0.6) { if (expanded) move(compactHeight, false); else onClose(); }
      else move(snap.current, expanded);
    },
    onPanResponderTerminate: () => move(snap.current, expanded)
  });
  const requireLogin = () => { if (token) return true; Alert.alert('Sign in needed', 'Please sign in before adding items to your cart.'); return false; };
  const update = async (v, next) => {
    const item = cartItem(v);
    if (item) await updateItem(item._id, next);
    else if (next > 0) await addItem(p._id, next, v?._id || null, unitOf(p, v));
  };
  const change = async (v, direction, staged = false) => {
    if (saving || isUpdating || soldOut(v)) return;
    const current = staged ? (draft[keyOf(v)] || 0) : qty(v);
    const next = direction > 0 ? (current ? round(current + step) : min) : (round(current - step) < min ? 0 : round(current - step));
    if (next > max(v)) return;
    if (staged) { draftTouched.current = true; setDraft(prev => ({ ...prev, [keyOf(v)]: next })); return; }
    if (!requireLogin()) return;
    setSaving(true);
    try { await update(v, next); } catch (e) { Alert.alert('Cart not updated', e.message || 'Please try again.'); } finally { setSaving(false); }
  };
  const confirm = async () => {
    if (!requireLogin() || saving || isUpdating) return;
    setSaving(true);
    try {
      // Preserve API ordering and do not close until every selected variant is saved.
      for (const v of options) {
        const desired = draft[keyOf(v)] ?? qty(v);
        if (desired !== qty(v)) await update(v, desired);
      }
      onClose();
    } catch (e) { Alert.alert('Some items could not be updated', e.message || 'Please check your cart and try again.'); }
    finally { setSaving(false); }
  };
  const controls = (v, staged = false) => {
    const count = staged ? (draft[keyOf(v)] || 0) : qty(v);
    return soldOut(v) ? <Text style={styles.muted}>Sold out</Text> : <View style={styles.counter}>
      {count > 0 && <><Pressable disabled={saving || isUpdating} onPress={() => change(v, -1, staged)} style={styles.step} accessibilityLabel={`Decrease ${v.name || p.name}`}><Minus size={20} color="#222" /></Pressable><Text style={styles.count}>{count}</Text></>}
      <Pressable disabled={saving || isUpdating || count >= max(v)} onPress={() => change(v, 1, staged)} style={styles.step} accessibilityLabel={`Add ${v.name || p.name}`}>{saving && !staged ? <ActivityIndicator size="small" color="#222" /> : <Plus size={22} color="#222" />}</Pressable>
    </View>;
  };
  const total = options.reduce((sum, v) => sum + priceOf(p || {}, v) * (draft[keyOf(v)] || 0), 0);
  if (!p) return null;
  return <Modal visible transparent animationType="fade" onRequestClose={() => { if (!saving) onClose(); }} statusBarTranslucent>
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => { if (!saving) onClose(); }} accessibilityLabel="Close product preview" />
      <Animated.View style={[styles.sheet, { height: sheetHeight, paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View {...pan.panHandlers} style={styles.drag} accessible accessibilityLabel="Swipe up for full product details, swipe down to collapse"><View style={styles.handle} /></View>
        <View {...pan.panHandlers} style={styles.topbar}>
          <Pressable onPress={() => { if (!saving) expanded ? move(compactHeight, false) : onClose(); }} style={styles.round} accessibilityLabel={expanded ? 'Collapse product details' : 'Close product preview'}>{view === 'variants' ? <X size={22} /> : <ChevronDown size={24} />}</Pressable>
          <Text style={styles.topTitle} numberOfLines={1}>{view === 'variants' ? 'Choose your options' : expanded ? 'Product details' : 'Quick view'}</Text>
          {view === 'details' && <><Pressable style={styles.round} onPress={() => toggleSave(p)} accessibilityLabel="Save to wishlist"><Bookmark size={21} fill={isSaved(p._id) ? colors.primary : 'none'} color="#333" /></Pressable><Pressable style={styles.round} onPress={() => Share.share({ message: `${p.name} - ₹${price} on Zooom` })} accessibilityLabel="Share product"><Share2 size={20} /></Pressable></>}
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {view === 'variants' ? <>
            <View style={styles.identity}>{imageOf(p) ? <Image source={{ uri: imageOf(p) }} style={styles.thumb} contentFit="contain" /> : <Package size={32} />}<Text style={[styles.name, { flex: 1 }]}>{p.name}</Text><Pressable onPress={() => { setView('details'); move(fullHeight, true); }}><Text style={styles.link}>View details</Text></Pressable></View>
            {types.length > 0 && <><Text style={styles.label}>Select a type{selectedType ? `: ${selectedType}` : ''}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.types}>{types.map(t => <Pressable key={t} onPress={() => setSelectedType(t)} style={[styles.type, selectedType === t && styles.typeOn]}><Text style={styles.typeText}>{t}</Text></Pressable>)}</ScrollView></>}
            <Text style={styles.label}>Quantity</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.variantList}>{visibleOptions.map((v, index) => {
              const vp = priceOf(p, v), vm = Number(v.mrp ?? p.mrp ?? 0), vd = vm > vp ? Math.round((vm - vp) / vm * 100) : 0;
              return <View key={v._id || index} style={[styles.variantCard, (draft[keyOf(v)] || 0) > 0 && styles.variantOn]}><View style={styles.variantImage}>{imageOf(v) || imageOf(p) ? <Image source={{ uri: imageOf(v) || imageOf(p) }} style={styles.variantPhoto} contentFit="contain" /> : <Package size={36} />}<View style={styles.variantControls}>{controls(v, true)}</View></View><Text style={styles.pack}>{v.name || unitOf(p, v)}</Text>{vd > 0 && <Text style={styles.discount}>{vd}% OFF</Text>}<View style={styles.priceRow}><Text style={styles.price}>₹{vp}</Text>{vm > vp && <Text style={styles.mrp}>₹{vm}</Text>}</View>{v.unitPrice != null && v.unitPriceLabel && <Text style={styles.muted}>₹{v.unitPrice}/{v.unitPriceLabel}</Text>}</View>;
            })}</ScrollView>
          </> : <>
            <View style={styles.hero}>{imageOf(p) ? <Image source={{ uri: imageOf(p) }} style={styles.heroImage} contentFit="contain" /> : <Package size={64} color="#AAA" />}</View>
            {Number(p.deliveryEtaMinutes) > 0 && <Text style={styles.eta}>{p.deliveryEtaMinutes} MINS</Text>}
            <View style={styles.info}><Text style={styles.name}>{p.name}</Text>{Boolean(p.subtitle) && <Text style={styles.muted}>{p.subtitle}</Text>}<View style={styles.priceRow}><Text style={styles.pack}>{selected?.name || unitOf(p, selected)}</Text>{discount > 0 && <Text style={styles.discount}>{discount}% OFF</Text>}</View><View style={styles.priceRow}><Text style={styles.price}>₹{price}</Text>{mrp > price && <Text style={styles.mrp}>₹{mrp}</Text>}</View>{(selected?.unitPrice ?? p.unitPrice) != null && (selected?.unitPriceLabel || p.unitPriceLabel) && <Text style={styles.muted}>₹{selected?.unitPrice ?? p.unitPrice}/{selected?.unitPriceLabel || p.unitPriceLabel}</Text>}
              {variants.length > 1 && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.types}>{variants.map(v => <Pressable key={v._id} onPress={() => setSelectedId(v._id)} style={[styles.type, selected?._id === v._id && styles.typeOn]}><Text style={styles.typeText}>{v.name}</Text></Pressable>)}</ScrollView>}
            </View>
            <View style={styles.benefits}><View style={styles.benefit}><RotateCcw size={22} /><Text style={styles.small}>Store policies</Text></View><View style={styles.benefit}><Truck size={22} /><Text style={styles.small}>Quick delivery</Text></View><View style={styles.benefit}><Headphones size={22} /><Text style={styles.small}>Order support</Text></View></View>
            {!expanded && <Pressable style={styles.expand} onPress={() => move(fullHeight, true)}><Text style={styles.link}>Swipe up or tap for full details</Text><ChevronRight size={18} /></Pressable>}
            <View style={styles.info}><Text style={styles.sectionTitle}>About this product</Text><Text style={styles.description}>{p.description || 'The store has not added a description yet.'}</Text>{Boolean(p.brand) && <Text style={styles.description}>Brand: {typeof p.brand === 'string' ? p.brand : p.brand.name}</Text>}{Boolean(p.storageInfo) && <Text style={styles.description}>Storage: {p.storageInfo}</Text>}</View>
            {detailQuery.isLoading && <Text style={styles.muted}>Loading more details...</Text>}
            {detailQuery.isError && <Pressable onPress={() => detailQuery.refetch()}><Text style={styles.link}>More details unavailable. Tap to retry.</Text></Pressable>}
          </>}
        </ScrollView>
        {view === 'variants' ? <Pressable style={[styles.confirm, (saving || isUpdating) && { opacity: 0.6 }]} onPress={confirm} disabled={saving || isUpdating}><Text style={styles.confirmText}>Item total: ₹{total.toFixed(2)}</Text>{saving ? <ActivityIndicator color="#222" /> : <Text style={styles.confirmText}>Confirm ›</Text>}</Pressable> : <View style={styles.bottom}><View style={{ flex: 1 }}><Text style={styles.pack}>{selected?.name || unitOf(p, selected)} {discount > 0 ? ` · ${discount}% OFF` : ''}</Text><View style={styles.priceRow}><Text style={styles.price}>₹{price}</Text>{mrp > price && <Text style={styles.mrp}>₹{mrp}</Text>}</View></View>{qty(selected) > 0 ? controls(selected) : <Pressable disabled={saving || isUpdating || soldOut(selected)} onPress={() => change(selected, 1)} style={[styles.add, soldOut(selected) && { opacity: 0.5 }]}>{saving ? <ActivityIndicator color="#222" /> : <Text style={styles.confirmText}>{soldOut(selected) ? 'SOLD OUT' : 'ADD'}</Text>}</Pressable>}</View>}
      </Animated.View>
    </View>
  </Modal>;
}
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.48)', justifyContent: 'flex-end' }, sheet: { backgroundColor: '#F6F7F8', borderTopLeftRadius: 26, borderTopRightRadius: 26, overflow: 'hidden' }, drag: { height: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }, handle: { width: 38, height: 4, borderRadius: 4, backgroundColor: '#CED1D4' }, topbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 10, gap: 8, backgroundColor: '#fff' }, round: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F5', alignItems: 'center', justifyContent: 'center' }, topTitle: { flex: 1, fontSize: 14, fontFamily: typography.family.bold, color: '#222' }, scroll: { flex: 1 }, content: { padding: 16, gap: 14, paddingBottom: 24 }, identity: { flexDirection: 'row', alignItems: 'center', gap: 10 }, thumb: { width: 50, height: 50, backgroundColor: '#fff', borderRadius: 10 }, name: { fontFamily: typography.family.bold, fontSize: 18, lineHeight: 23, color: '#20242A' }, label: { fontFamily: typography.family.medium, color: '#777C83', fontSize: 14 }, link: { fontFamily: typography.family.bold, color: '#685000', fontSize: 12 }, types: { gap: 8, paddingVertical: 8 }, type: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E6E8EB' }, typeOn: { borderColor: colors.primary, backgroundColor: '#FFF6D9', borderWidth: 2 }, typeText: { fontSize: 12, color: '#242424', fontFamily: typography.family.medium }, variantList: { gap: 10, paddingBottom: 8 }, variantCard: { width: 142, borderWidth: 1, borderColor: '#E7E8EB', borderRadius: 14, padding: 7, backgroundColor: '#fff' }, variantOn: { borderColor: colors.primary }, variantImage: { height: 112, backgroundColor: '#F5F5F6', borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }, variantPhoto: { width: '92%', height: '90%' }, variantControls: { position: 'absolute', right: 0, bottom: -4 }, counter: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.primary, borderRadius: 9, backgroundColor: '#FFF9E5', minHeight: 36 }, step: { width: 34, height: 36, alignItems: 'center', justifyContent: 'center' }, count: { fontFamily: typography.family.bold, fontSize: 16, color: '#222', minWidth: 17, textAlign: 'center' }, pack: { fontFamily: typography.family.medium, fontSize: 12, color: '#666A70', marginBottom: 3 }, priceRow: { flexDirection: 'row', gap: 7, alignItems: 'center', marginTop: 5 }, price: { fontFamily: typography.family.bold, fontSize: 17, color: '#232323' }, mrp: { fontFamily: typography.family.regular, fontSize: 12, color: '#94989C', textDecorationLine: 'line-through' }, discount: { fontFamily: typography.family.bold, fontSize: 12, color: '#079B78' }, muted: { fontFamily: typography.family.regular, fontSize: 12, lineHeight: 18, color: '#888D94' }, hero: { height: 280, backgroundColor: '#fff', borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, heroImage: { width: '100%', height: '100%' }, eta: { fontFamily: typography.family.regular, textAlign: 'right', color: '#888D94', fontSize: 11 }, info: { backgroundColor: '#fff', borderRadius: 16, padding: 14 }, benefits: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, paddingVertical: 15 }, benefit: { flex: 1, gap: 7, alignItems: 'center' }, small: { fontFamily: typography.family.regular, fontSize: 9, color: '#83878C' }, expand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 6 }, sectionTitle: { fontSize: 16, fontFamily: typography.family.bold, color: '#222', marginBottom: 8 }, description: { fontSize: 13, fontFamily: typography.family.regular, lineHeight: 20, color: '#777' }, bottom: { backgroundColor: '#fff', padding: 16, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E8EAED' }, add: { backgroundColor: colors.primary, minWidth: 108, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, confirm: { marginHorizontal: 16, marginTop: 8, height: 48, paddingHorizontal: 14, borderRadius: 12, backgroundColor: colors.primary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, confirmText: { fontFamily: typography.family.bold, fontSize: 15, color: '#222' }
});
