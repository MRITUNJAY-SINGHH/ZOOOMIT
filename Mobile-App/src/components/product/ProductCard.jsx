import { captureCartSource } from '../FloatingCart';
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView, Animated, AccessibilityInfo } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Plus, Minus, Package, Bookmark } from 'lucide-react-native';
import { typography } from '../../constants/theme';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';

const BLUE = '#1769FF';
export const productImages = p => [...new Set([p?.featuredImage, ...(p?.galleryImages || [])].filter(x => typeof x === 'string' && x.trim()))];
export function productUnitRate(product, variant, price) {
  const explicit = variant?.unitPrice ?? product.unitPrice;
  const label = variant?.unitPriceLabel ?? product.unitPriceLabel;
  if (explicit != null && Number.isFinite(Number(explicit)) && label) return `₹${Number(explicit)}/${label}`;
  // conversionFactor is measured in the product's baseUnit, not the variant's label.
  const factor = variant ? Number(variant.conversionFactor) : Number(product.minSaleQty);
  const unit = String(product.baseUnit || '').toUpperCase();
  if (!(factor > 0) || !(price > 0)) return null;
  const amount = factor * (unit === 'KG' || unit === 'LTR' ? 1000 : 1);
  if (!['KG', 'GM', 'LTR', 'ML'].includes(unit)) return null;
  const rate = Math.round(price / amount * 100 * 100) / 100;
  return `₹${rate}/100 ${unit === 'KG' || unit === 'GM' ? 'g' : 'ml'}`;
}
export const ProductCard = ({ product, onPress, compact = false, detailed = false, selectedVariantId, onSelectVariant }) => {
  const imageRef = useRef(null), galleryRef = useRef(null);
  const { getItemQuantity, addItem, updateItem, cart, isUpdating } = useCart();
  const { token } = useAuth();
  const { isSaved, toggleSave } = useWishlist();
  const [localVariantId, setLocalVariantId] = useState(null);
  const [activeImage, setActiveImage] = useState(0), [imageWidth, setImageWidth] = useState(0);
  const [busy, setBusy] = useState(false);
  const reducedMotion = useRef(false), scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(v => { reducedMotion.current = v; }).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', v => { reducedMotion.current = v; });
    return () => sub?.remove?.();
  }, []);
  const variants = (product?.variants || []).filter(v => v.isActive !== false);
  const selected = selectedVariantId !== undefined ? selectedVariantId : localVariantId;
  const variant = variants.find(v => v._id === selected) || variants[0];
  const variantId = variant?._id || null;
  const price = Number(variant?.sellingPrice ?? product?.sellingPrice ?? 0);
  const mrp = Number(variant?.mrp ?? product?.mrp ?? 0);
  const qty = product ? getItemQuantity(product._id, variantId) : 0;
  useEffect(() => {
    if (reducedMotion.current) return;
    scale.setValue(0.94);
    Animated.spring(scale, { toValue: 1, damping: 16, stiffness: 220, useNativeDriver: true }).start();
  }, [qty, variantId]);
  useEffect(() => { setActiveImage(0); galleryRef.current?.scrollTo({ x: 0, animated: false }); }, [product?._id]);
  if (!product) return null;
  const images = productImages(product);
  const unit = variant?.conversionUnit || product.sellingUnit || product.baseUnit || 'PCS';
  const min = Number(product.minSaleQty) > 0 ? Number(product.minSaleQty) : 1;
  const step = Number(product.qtyStep) > 0 ? Number(product.qtyStep) : 1;
  const max = Number(product.maxSaleQty) > 0 ? Number(product.maxSaleQty) : 100;
  const outOfStock = product.isTrackInventory && Number(variant?.stock ?? product.stock ?? 0) <= 0;
  const discount = mrp > price && mrp > 0 ? Math.round((mrp - price) / mrp * 100) : 0;
  const rate = productUnitRate(product, variant, price);
  const open = () => !detailed && (onPress ? onPress(product) : router.push(`/product/${product._id}`));
  const choose = v => { setLocalVariantId(v._id); onSelectVariant?.(v._id); };
  const change = async direction => {
    if (outOfStock || busy || isUpdating || (direction > 0 && qty >= max)) return;
    if (!token) { Alert.alert('Sign in needed', 'Please sign in before adding items to your cart.'); return; }
    setBusy(true);
    try {
      const source = direction > 0 ? await captureCartSource(imageRef, { ...product, featuredImage: images[activeImage] || images[0] }) : null;
      const item = cart?.items?.find(i => i.product?._id === product._id && (variantId ? i.variant?._id === variantId : !i.variant));
      const next = Math.round((qty + direction * step) * 1000) / 1000;
      if (direction > 0 && qty > 0 && next > max) return;
      if (item) await updateItem(item._id, next < min ? 0 : next, source);
      else if (direction > 0) await addItem(product._id, min, variantId, unit, source);
    } catch (error) { Alert.alert('Cart not updated', error.message || 'Try again.'); }
    finally { setBusy(false); }
  };
  return <View style={[styles.card, compact && styles.compact, detailed && styles.detailed]}>
    <View ref={imageRef} collapsable={false} style={[styles.imageBox, detailed && styles.detailImage]} onLayout={e => setImageWidth(e.nativeEvent.layout.width)}>
      {images.length ? <ScrollView ref={galleryRef} horizontal pagingEnabled directionalLockEnabled showsHorizontalScrollIndicator={false} style={styles.gallery} onMomentumScrollEnd={e => setActiveImage(Math.max(0, Math.min(images.length - 1, Math.round(e.nativeEvent.contentOffset.x / Math.max(1, imageWidth)))))}>
        {images.map((uri, i) => <Pressable key={uri} style={{ width: imageWidth || 1, height: '100%' }} onPress={open} accessibilityLabel={`${product.name}, image ${i + 1} of ${images.length}`}><Image source={{ uri }} style={styles.image} contentFit="contain" transition={160} /></Pressable>)}
      </ScrollView> : <Pressable onPress={open} style={styles.placeholder}><Package size={40} color="#9BA69B" /></Pressable>}
      <Pressable style={styles.bookmark} onPress={() => toggleSave(product)} accessibilityRole="button" accessibilityLabel={`Save ${product.name}`}><Bookmark size={17} color={isSaved(product._id) ? BLUE : '#737B7D'} fill={isSaved(product._id) ? BLUE : 'none'} /></Pressable>
      <View pointerEvents="none" style={styles.lowerLeft}>
        {typeof product.isVeg === 'boolean' && <View style={styles.vegBadge} accessibilityLabel={product.isVeg ? 'Vegetarian' : 'Non-vegetarian'}><View style={[styles.foodMark, { borderColor: product.isVeg ? '#0A9979' : '#AC3929' }]}><View style={[styles.foodDot, { backgroundColor: product.isVeg ? '#0A9979' : '#AC3929' }]} /></View></View>}
        {images.length > 1 && <View style={styles.dots}>{images.map((uri, i) => <View key={uri} style={[styles.dot, i === activeImage && styles.dotOn]} />)}</View>}
      </View>
      <Animated.View style={[styles.action, { transform: [{ scale }] }]}>
        {outOfStock ? <Text style={styles.soldOut}>Sold out</Text> : qty > 0 ? <View style={styles.stepper}>
          <Pressable disabled={busy || isUpdating} onPress={() => change(-1)} style={styles.step} accessibilityRole="button" accessibilityLabel={`Decrease ${product.name}`}><Minus size={19} color={BLUE} /></Pressable>
          <Text style={styles.qty}>{qty}</Text><Pressable disabled={busy || isUpdating || qty >= max} onPress={() => change(1)} style={styles.step} accessibilityRole="button" accessibilityLabel={`Increase ${product.name}`}><Plus size={20} color={BLUE} /></Pressable>
        </View> : <Pressable disabled={busy || isUpdating} style={styles.plus} onPress={() => change(1)} accessibilityRole="button" accessibilityLabel={`Add ${product.name}, ${variant?.name || unit}`}><Plus size={26} color={BLUE} strokeWidth={2.4} /></Pressable>}
      </Animated.View>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.variants} style={styles.variantScroll}>
      {variants.length ? variants.map(v => <Pressable key={v._id} onPress={() => choose(v)} style={[styles.variant, v._id === variantId && styles.selectedVariant]} accessibilityRole="button" accessibilityState={{ selected: v._id === variantId }}><Text style={[styles.variantText, v._id === variantId && styles.variantTextOn]}>{v.name}</Text></Pressable>) : <Text style={styles.unit}>{min} {unit.toLowerCase()}</Text>}
    </ScrollView>
    <Pressable onPress={open} disabled={detailed} accessibilityLabel={`View ${product.name}`}>
      <View style={styles.prices}><Text style={[styles.price, detailed && styles.detailPrice]}>₹{price}</Text>{mrp > price && <Text style={styles.mrp}>₹{mrp}</Text>}</View>
      {rate && <Text style={styles.perUnit}>{rate}</Text>}
      {discount > 0 && <Text style={styles.discount}>{discount}% OFF</Text>}
      <Text style={[styles.name, detailed && styles.detailName]} numberOfLines={detailed ? undefined : 2}>{product.name}</Text>
      {detailed && Boolean(product.subtitle) && <Text style={styles.subtitle}>{product.subtitle}</Text>}
    </Pressable>
  </View>;
};
export const ProductGrid = ({ products = [], onProductPress, style }) => <View style={[styles.grid, style]}>{products.map((p, i) => <View key={p._id || p.slug || i} style={styles.gridCell}><ProductCard product={p} onPress={onProductPress} /></View>)}</View>;
const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: '#fff', minWidth: 0, marginBottom: 16 }, compact: { flex: undefined, width: 168, marginRight: 12 }, detailed: { marginBottom: 0 },
  imageBox: { width: '100%', aspectRatio: 0.85, borderRadius: 10, backgroundColor: '#F4F5F2', overflow: 'hidden', marginBottom: 7 }, detailImage: { aspectRatio: 1, borderRadius: 14 }, gallery: { width: '100%', height: '100%' }, image: { width: '100%', height: '100%' }, placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bookmark: { position: 'absolute', top: 4, right: 4, padding: 7, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.8)' },
  lowerLeft: { position: 'absolute', left: 5, bottom: 5, flexDirection: 'row', alignItems: 'center', gap: 5 }, vegBadge: { padding: 5, backgroundColor: '#fff', borderRadius: 7 }, foodMark: { width: 12, height: 12, borderRadius: 2, borderWidth: 1.2, alignItems: 'center', justifyContent: 'center' }, foodDot: { width: 7, height: 7, borderRadius: 4 }, dots: { flexDirection: 'row', gap: 3 }, dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#CCD1C6' }, dotOn: { backgroundColor: '#879482' },
  action: { position: 'absolute', right: 0, bottom: 0 }, plus: { width: 38, height: 38, borderRadius: 9, borderWidth: 1.2, borderColor: '#86AFF6', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }, stepper: { flexDirection: 'row', alignItems: 'center', height: 38, borderRadius: 9, borderWidth: 1.2, borderColor: '#86AFF6', backgroundColor: '#fff' }, step: { width: 31, height: 36, alignItems: 'center', justifyContent: 'center' }, qty: { fontFamily: typography.family.bold, fontSize: 16, color: BLUE, minWidth: 19, textAlign: 'center' }, soldOut: { padding: 8, fontSize: 10, color: '#7C807B', backgroundColor: '#fff', borderRadius: 8 },
  variantScroll: { flexGrow: 0, marginBottom: 4 }, variants: { gap: 4 }, variant: { paddingHorizontal: 4, paddingVertical: 3, borderWidth: 0.7, borderColor: '#EFEFEF', borderRadius: 3, backgroundColor: '#FAFAFA' }, selectedVariant: { borderColor: '#D9E7FF', backgroundColor: '#fff' }, variantText: { fontFamily: typography.family.regular, fontSize: 10, color: '#7D8284' }, variantTextOn: { fontFamily: typography.family.bold, color: BLUE }, unit: { fontFamily: typography.family.medium, color: '#767B7C', fontSize: 11, paddingVertical: 3 },
  prices: { flexDirection: 'row', alignItems: 'baseline', gap: 5, marginTop: 2 }, price: { fontFamily: typography.family.bold, fontSize: 15, color: '#242628' }, mrp: { fontFamily: typography.family.regular, fontSize: 10, color: '#939697', textDecorationLine: 'line-through' }, perUnit: { fontFamily: typography.family.regular, fontSize: 10, color: '#949899', marginTop: 3 }, discount: { fontFamily: typography.family.bold, fontSize: 10, color: '#079B78', marginTop: 4 }, name: { fontFamily: typography.family.medium, fontSize: 12, lineHeight: 16, minHeight: 32, color: '#252A2C', marginTop: 5 }, detailPrice: { fontSize: 23 }, detailName: { fontSize: 22, lineHeight: 28, minHeight: 0 }, subtitle: { fontFamily: typography.family.regular, fontSize: 13, color: '#818688', marginTop: 5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 10, paddingHorizontal: 16 }, gridCell: { width: '48%', flexGrow: 1, maxWidth: '49%' }
});
