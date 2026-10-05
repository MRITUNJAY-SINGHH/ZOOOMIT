import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Plus, Minus, Star, Package } from 'lucide-react-native';
import { typography } from '../../constants/theme';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export const ProductCard = ({ product, onPress, compact = false }) => {
  const { getItemQuantity, addItem, updateItem, cart, isUpdating } = useCart();
  const { token } = useAuth();
  const [variantIndex, setVariantIndex] = useState(0);
  if (!product) return null;
  const variants = product.variants || [];
  const variant = variants[variantIndex];
  const variantId = variant?._id || null;
  const price = Number(variant?.sellingPrice ?? product.sellingPrice ?? 0);
  const mrp = Number(variant?.mrp ?? product.mrp ?? 0);
  const unit = variant?.conversionUnit || product.sellingUnit || product.baseUnit || 'PCS';
  const qty = getItemQuantity(product._id, variantId);
  const min = product.minSaleQty || 1;
  const step = product.qtyStep || 1;
  const max = product.maxSaleQty || 100;
  const outOfStock = product.isTrackInventory && Number(product.stock || 0) <= 0;
  const discount = mrp > price ? Math.round((mrp - price) / mrp * 100) : 0;
  const image = product.featuredImage || product.galleryImages?.[0];
  const open = () => onPress ? onPress(product) : router.push(`/product/${product._id}`);
  const change = async (direction, e) => {
    e?.stopPropagation?.();
    if (outOfStock || isUpdating) return;
    if (!token) { Alert.alert('Sign in needed', 'Please sign in before adding items to your cart.'); return; }
    try {
      const item = cart?.items?.find(i => i.product?._id === product._id && (variantId ? i.variant?._id === variantId : !i.variant));
      const next = Math.round((qty + direction * step) * 1000) / 1000;
      if (direction > 0 && qty > 0 && next > max) return;
      if (item) await updateItem(item._id, next < min ? 0 : next);
      else if (direction > 0) await addItem(product._id, min, variantId, unit);
    } catch (error) { Alert.alert('Cart not updated', error.message || 'Try again.'); }
  };
  return <Pressable style={[styles.card, compact && styles.compact]} onPress={open} accessibilityRole="button" accessibilityLabel={`View ${product.name}`}>
    <View style={styles.imageBox}>
      {image ? <Image source={{ uri: image }} style={styles.image} contentFit="contain" /> : <Package size={40} color="#9BA69B" />}
      <View style={styles.action}>
        {outOfStock ? <Text style={styles.soldOut}>Sold out</Text> : qty > 0 ? <View style={styles.stepper}>
          <Pressable disabled={isUpdating} onPress={e => change(-1, e)} style={styles.step} accessibilityLabel="Decrease quantity"><Minus size={15} color="#1769FF" /></Pressable>
          <Text style={styles.qty}>{qty}</Text><Pressable disabled={isUpdating || qty >= max} onPress={e => change(1, e)} style={styles.step} accessibilityLabel="Increase quantity"><Plus size={15} color="#1769FF" /></Pressable>
        </View> : <Pressable disabled={isUpdating} style={styles.plus} onPress={e => change(1, e)} accessibilityLabel={`Add ${product.name} to cart`}><Plus size={23} color="#1769FF" strokeWidth={2} /></Pressable>}
      </View>
    </View>
    {variants.length > 1 ? <View style={styles.variants}>{variants.slice(0, 3).map((v, i) => <Pressable key={v._id || i} onPress={e => { e.stopPropagation(); setVariantIndex(i); }} style={[styles.variant, i === variantIndex && styles.selectedVariant]}><Text style={[styles.variantText, i === variantIndex && styles.variantTextOn]} numberOfLines={1}>{v.name}</Text></Pressable>)}</View> : <View style={styles.unitRow}><Text style={styles.unit} numberOfLines={1}>{variant?.name || `${min} ${unit}`}</Text></View>}
    <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
    {Boolean(product.rating || product.ratingsAverage) && <View style={styles.rating}><Star size={9} color="#218755" fill="#218755" /><Text style={styles.ratingText}>{product.rating || product.ratingsAverage}</Text>{Boolean(product.ratingCount || product.reviewsCount) && <Text style={styles.ratingCount}>({product.ratingCount || product.reviewsCount})</Text>}</View>}
    {discount > 0 && <Text style={styles.discount}>{discount}% OFF</Text>}
    <View style={styles.prices}><Text style={styles.price}>₹{price}</Text>{mrp > price && <Text style={styles.mrp}>₹{mrp}</Text>}</View>
  </Pressable>;
};
const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: '#fff', padding: 0, marginBottom: 14, minWidth: 0 }, compact: { flex: undefined, width: 128, marginRight: 12, marginBottom: 0 },
  imageBox: { width: '100%', aspectRatio: 1, borderRadius: 12, borderWidth: 1, borderColor: '#ECEEF1', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 7, overflow: 'visible' }, image: { width: '84%', height: '84%' },
  action: { position: 'absolute', right: 5, top: 5 }, plus: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: '#C9D6F5', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#1769FF', shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  stepper: { flexDirection: 'row', alignItems: 'center', height: 32, borderRadius: 8, backgroundColor: '#1769FF' }, step: { width: 26, height: 32, alignItems: 'center', justifyContent: 'center' }, qty: { color: '#fff', fontSize: 12, fontWeight: '700', minWidth: 16, textAlign: 'center' }, soldOut: { fontSize: 10, color: '#7C807B', padding: 5, backgroundColor: '#fff', borderRadius: 6 },
  unitRow: { flexDirection: 'row', marginBottom: 4 }, unit: { color: '#6B7280', fontSize: 11, fontFamily: typography.family.medium }, variants: { flexDirection: 'row', gap: 4, marginBottom: 5, flexWrap: 'wrap' }, variant: { borderWidth: 1, borderColor: '#E3E7EC', borderRadius: 6, paddingVertical: 3, paddingHorizontal: 6, maxWidth: '100%', backgroundColor: '#fff' }, selectedVariant: { borderColor: '#1769FF', backgroundColor: '#EEF5FF' }, variantText: { fontSize: 10, color: '#4B5563' }, variantTextOn: { color: '#1769FF', fontWeight: '700' },
  name: { minHeight: 32, lineHeight: 16, fontSize: 12, color: '#1F2937', fontFamily: typography.family.medium }, rating: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 }, ratingText: { fontSize: 10, color: '#218755', fontWeight: '700' }, ratingCount: { fontSize: 10, color: '#9CA3AF' },
  discount: { fontSize: 11, color: '#1769FF', marginTop: 5, fontFamily: typography.family.bold }, prices: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }, price: { fontSize: 14, fontFamily: typography.family.bold, color: '#111827' }, mrp: { fontSize: 11, color: '#9CA3AF', textDecorationLine: 'line-through' }
});
