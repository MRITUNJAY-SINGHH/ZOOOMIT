import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Plus, Minus, Star, Package, Bookmark } from 'lucide-react-native';
import { colors, typography } from '../../constants/theme';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';

export const ProductCard = ({ product, onPress, onVariantPress, compact = false }) => {
  const { width } = useWindowDimensions();
  const { getItemQuantity, addItem, updateItem, cart, isUpdating } = useCart();
  const { token } = useAuth();
  const { isSaved, toggleSave } = useWishlist();
  const [variantIndex, setVariantIndex] = useState(0);
  if (!product) return null;
  const variants = (product.variants || []).filter(v => v.isActive !== false);
  const variant = variants[variantIndex];
  const variantId = variant?._id || null;
  const price = Number(variant?.sellingPrice ?? product.sellingPrice ?? 0);
  const mrp = Number(variant?.mrp ?? product.mrp ?? 0);
  const unit = variant?.conversionUnit || product.sellingUnit || product.baseUnit || 'PCS';
  const qty = getItemQuantity(product._id, variantId);
  const min = product.minSaleQty || 1;
  const step = product.qtyStep || 1;
  const max = product.maxSaleQty || 100;
  const outOfStock = product.isTrackInventory && Number(variant?.stock ?? product.stock ?? 0) <= 0;
  const discount = mrp > price ? Math.round((mrp - price) / mrp * 100) : 0;
  const rating = Number(product.rating ?? product.ratingsAverage);
  const eta = product.deliveryEtaMinutes;
  const deliveryTime = product.deliveryTime || (Number(eta) > 0 ? `${eta} MINS` : null);
  const attributes = (variant?.attributes || []).filter(a => a.key !== 'Pack' && typeof a.value === 'string');
  const badge = product.tags?.includes('popular') ? 'POPULAR' : product.isFeatured ? 'FEATURED' : null;
  const perUnitPrice = variant?.unitPrice ?? product.unitPrice;
  const perUnitLabel = variant?.unitPriceLabel ?? product.unitPriceLabel;
  const image = product.featuredImage || product.galleryImages?.[0];
  const open = () => onPress ? onPress(product) : router.push(`/product/${product._id}`);
  const change = async (direction, e) => {
    e?.stopPropagation?.();
    if (outOfStock || isUpdating) return;
    if (direction > 0 && variants.length > 1 && onVariantPress) { onVariantPress(product, variantId); return; }
    if (!token) { Alert.alert('Sign in needed', 'Please sign in before adding items to your cart.'); return; }
    try {
      const item = cart?.items?.find(i => i.product?._id === product._id && (variantId ? i.variant?._id === variantId : !i.variant));
      const next = Math.round((qty + direction * step) * 1000) / 1000;
      if (direction > 0 && qty > 0 && next > max) return;
      if (item) await updateItem(item._id, next < min ? 0 : next);
      else if (direction > 0) await addItem(product._id, min, variantId, unit);
    } catch (error) { Alert.alert('Cart not updated', error.message || 'Try again.'); }
  };
  return <Pressable style={[styles.card, compact && [styles.compact, { width: Math.max(96, Math.min(160, (width - 56) / 3)) }]]} onPress={open} accessibilityRole="button" accessibilityLabel={`View ${product.name}`}>
    <View style={styles.imageBox}>
      {image ? <Image source={{ uri: image }} style={styles.image} contentFit="contain" /> : <Package size={40} color="#9BA69B" />}
      <Pressable style={styles.bookmark} onPress={e => { e.stopPropagation(); toggleSave(product); }} accessibilityLabel={`Save ${product.name}`}><Bookmark size={17} color="#70757B" fill={isSaved(product._id) ? colors.primary : 'none'} /></Pressable>
      {badge && <Text style={styles.badge}>{badge}</Text>}
      <View style={styles.action}>
        {outOfStock ? <Text style={styles.soldOut}>Sold out</Text> : qty > 0 ? <View style={styles.stepper}>
          <Pressable disabled={isUpdating} onPress={e => change(-1, e)} style={styles.step} accessibilityLabel="Decrease quantity"><Minus size={15} color="#222" /></Pressable>
          <Text style={styles.qty}>{qty}</Text><Pressable disabled={isUpdating || qty >= max} onPress={e => change(1, e)} style={styles.step} accessibilityLabel="Increase quantity"><Plus size={15} color="#222" /></Pressable>
        </View> : <Pressable disabled={isUpdating} style={styles.plus} onPress={e => change(1, e)} accessibilityLabel={`Add ${product.name} to cart`}><Plus size={23} color="#222" strokeWidth={2} /></Pressable>}
      </View>
    </View>
    {variants.length > 1 ? <View style={styles.variants}>{variants.slice(0, 3).map((v, i) => <Pressable key={v._id || i} onPress={e => { e.stopPropagation(); setVariantIndex(i); }} style={[styles.variant, i === variantIndex && styles.selectedVariant]}><Text style={[styles.variantText, i === variantIndex && styles.variantTextOn]} numberOfLines={1}>{v.name}</Text></Pressable>)}</View> : <View style={styles.unitRow}><Text style={styles.unit} numberOfLines={1}>{variant?.name || `${min} ${unit}`}</Text></View>}
    <View style={styles.prices}><Text style={styles.price}>₹{price}</Text>{mrp > price && <Text style={styles.mrp}>₹{mrp}</Text>}</View>
    {Number.isFinite(Number(perUnitPrice)) && perUnitLabel && <Text style={styles.perUnit}>₹{perUnitPrice}/{perUnitLabel}</Text>}
    {discount > 0 && <Text style={styles.discount}>{discount}% OFF</Text>}
    <Text style={styles.name} numberOfLines={3}>{product.name}</Text>
    {(rating > 0 || deliveryTime) && <View style={styles.rating}>{rating > 0 && <><Star size={11} color="#0A946F" fill="#0A946F" /><Text style={styles.ratingText}>{rating}</Text>{Boolean(product.ratingCount || product.reviewsCount) && <Text style={styles.ratingCount}>{product.ratingCount || product.reviewsCount}</Text>}</>}{deliveryTime && <Text style={styles.ratingCount}>{deliveryTime}</Text>}</View>}
    {attributes.length > 0 && <View style={styles.attributes}>{attributes.slice(0, 2).map(a => <Text key={a.key} style={styles.attribute} numberOfLines={1}>{a.value}</Text>)}</View>}
  </Pressable>;
};
const styles = StyleSheet.create({
  bookmark: { position: 'absolute', top: 5, right: 5, padding: 3, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.8)' },
  badge: { fontFamily: typography.family.regular, position: 'absolute', top: 0, left: 0, backgroundColor: '#0C689C', color: '#fff', fontSize: 9, fontWeight: '700', paddingHorizontal: 5, paddingVertical: 3, borderTopLeftRadius: 10, borderBottomRightRadius: 7 }, perUnit: { fontFamily: typography.family.regular, color: '#7A7D82', fontSize: 11, marginTop: 3 }, attributes: { gap: 4, marginTop: 5 }, attribute: { fontFamily: typography.family.regular, fontSize: 10, color: '#3C4653', backgroundColor: '#F1F3F6', paddingHorizontal: 5, paddingVertical: 3, borderRadius: 4, alignSelf: 'flex-start' },
  card: { flex: 1, backgroundColor: '#fff', padding: 0, marginBottom: 14, minWidth: 0 }, compact: { flex: undefined, width: 128, marginRight: 12, marginBottom: 0 },
  imageBox: { width: '100%', aspectRatio: 1, borderRadius: 12, borderWidth: 1, borderColor: '#ECEEF1', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 7, overflow: 'visible' }, image: { width: '84%', height: '84%' },
  action: { position: 'absolute', right: -1, bottom: -1 }, plus: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: '#C9D6F5', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: colors.primary, shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  stepper: { flexDirection: 'row', alignItems: 'center', height: 32, borderRadius: 8, backgroundColor: colors.primary }, step: { width: 26, height: 32, alignItems: 'center', justifyContent: 'center' }, qty: { fontFamily: typography.family.regular, color: '#222', fontSize: 12, fontWeight: '700', minWidth: 16, textAlign: 'center' }, soldOut: { fontFamily: typography.family.regular, fontSize: 10, color: '#7C807B', padding: 5, backgroundColor: '#fff', borderRadius: 6 },
  unitRow: { flexDirection: 'row', marginBottom: 4 }, unit: { color: '#685000', borderWidth: 1, borderColor: '#E3E7EC', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2, fontSize: 11, fontFamily: typography.family.medium }, variants: { flexDirection: 'row', gap: 4, marginBottom: 5, flexWrap: 'wrap' }, variant: { borderWidth: 1, borderColor: '#E3E7EC', borderRadius: 6, paddingVertical: 3, paddingHorizontal: 6, maxWidth: '100%', backgroundColor: '#fff' }, selectedVariant: { borderColor: colors.primary, backgroundColor: '#FFF7DA' }, variantText: { fontFamily: typography.family.regular, fontSize: 10, color: '#4B5563' }, variantTextOn: { color: '#685000', fontWeight: '700' },
  name: { minHeight: 48, lineHeight: 17, fontSize: 13, color: '#1F2937', fontFamily: typography.family.medium }, rating: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 }, ratingText: { fontFamily: typography.family.regular, fontSize: 10, color: '#218755', fontWeight: '700' }, ratingCount: { fontFamily: typography.family.regular, fontSize: 10, color: '#9CA3AF' },
  discount: { fontSize: 11, color: '#0A946F', marginTop: 3, fontFamily: typography.family.bold }, prices: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }, price: { fontSize: 14, fontFamily: typography.family.bold, color: '#111827' }, mrp: { fontFamily: typography.family.regular, fontSize: 11, color: '#9CA3AF', textDecorationLine: 'line-through' }
});
