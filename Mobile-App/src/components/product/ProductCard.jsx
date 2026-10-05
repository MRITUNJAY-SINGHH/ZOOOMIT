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
    {variants.length > 1 ? <View style={styles.variants}>{variants.slice(0, 3).map((v, i) => <Pressable key={v._id || i} onPress={e => { e.stopPropagation(); setVariantIndex(i); }} style={[styles.variant, i === variantIndex && styles.selectedVariant]}><Text style={styles.variantText} numberOfLines={1}>{v.name}</Text></Pressable>)}</View> : <Text style={styles.unit} numberOfLines={1}>{variant?.name || `${min} ${unit}`}</Text>}
    {Boolean(product.rating || product.ratingsAverage) && <View style={styles.rating}><Star size={9} color="#218755" fill="#218755" /><Text style={styles.ratingText}>{product.rating || product.ratingsAverage}</Text>{Boolean(product.ratingCount || product.reviewsCount) && <Text style={styles.ratingCount}>({product.ratingCount || product.reviewsCount})</Text>}</View>}
    <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
    <Text style={styles.discount}>{discount ? `${discount}% OFF` : ' '}</Text>
    <View style={styles.prices}><Text style={styles.price}>₹{price}</Text>{mrp > price && <Text style={styles.mrp}>₹{mrp}</Text>}</View>
  </Pressable>;
};
const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: '#fff', padding: 5, marginBottom: 12, minWidth: 0 }, compact: { flex: undefined, width: 126, marginRight: 12, marginBottom: 0 },
  imageBox: { width: '100%', aspectRatio: 1, borderRadius: 12, borderWidth: 1, borderColor: '#E7EBE6', backgroundColor: '#F8FAF6', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }, image: { width: '87%', height: '87%' }, action: { position: 'absolute', right: 0, top: 0 }, plus: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: '#D9E2EB', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }, stepper: { flexDirection: 'row', alignItems: 'center', height: 32, borderRadius: 8, borderWidth: 1, borderColor: '#1769FF', backgroundColor: '#fff' }, step: { width: 25, height: 32, alignItems: 'center', justifyContent: 'center' }, qty: { color: '#1769FF', fontSize: 11, minWidth: 15, textAlign: 'center' }, soldOut: { fontSize: 10, color: '#7C807B', padding: 5, backgroundColor: '#fff', borderRadius: 6 },
  unit: { backgroundColor: '#F5F6F4', color: '#787E77', fontSize: 10, textAlign: 'center', borderRadius: 4, paddingVertical: 4, marginBottom: 6 }, variants: { flexDirection: 'row', gap: 3, marginBottom: 6, flexWrap: 'wrap' }, variant: { borderWidth: 1, borderColor: '#E7EBE6', borderRadius: 4, padding: 3, maxWidth: '100%' }, selectedVariant: { borderColor: '#1769FF', backgroundColor: '#EEF5FF' }, variantText: { fontSize: 9, color: '#4B5563' },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 4 }, ratingText: { fontSize: 9, color: '#218755' }, ratingCount: { fontSize: 9, color: '#9CA3AF' }, name: { minHeight: 32, lineHeight: 16, fontSize: 12, color: '#252B24', fontFamily: typography.family.medium }, discount: { fontSize: 10, color: '#218755', marginTop: 5, marginBottom: 3, fontFamily: typography.family.bold }, prices: { flexDirection: 'row', alignItems: 'center', gap: 5 }, price: { fontSize: 14, fontFamily: typography.family.bold, color: '#1D251C' }, mrp: { fontSize: 10, color: '#929990', textDecorationLine: 'line-through' }
});
