import { captureCartSource } from '../FloatingCart';
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView, Animated, AccessibilityInfo, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Plus, Minus, Package, Heart } from 'lucide-react-native';
import { typography } from '../../constants/theme';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { haptics } from '../../services/haptics';

export function getProductImage(product) {
  if (!product) return null;
  if (typeof product.featuredImage === 'string' && product.featuredImage.trim()) return product.featuredImage.trim();
  if (typeof product.image === 'string' && product.image.trim()) return product.image.trim();
  if (Array.isArray(product.galleryImages) && product.galleryImages[0]) return product.galleryImages[0];
  if (Array.isArray(product.images) && product.images[0]) {
    const img = product.images[0];
    return typeof img === 'string' ? img : img?.url;
  }
  if (product.variants?.length) {
    for (const v of product.variants) {
      if (typeof v.featuredImage === 'string' && v.featuredImage.trim()) return v.featuredImage.trim();
      if (typeof v.image === 'string' && v.image.trim()) return v.image.trim();
    }
  }
  return null;
}

export const productImages = p => {
  const list = [
    p?.featuredImage,
    p?.image,
    ...(p?.galleryImages || []),
    ...(p?.images || []).map(img => typeof img === 'string' ? img : img?.url)
  ].filter(x => typeof x === 'string' && x.trim());
  return [...new Set(list)];
};

export function productUnitRate(product, variant, price) {
  const explicit = variant?.unitPrice ?? product.unitPrice;
  const label = variant?.unitPriceLabel ?? product.unitPriceLabel;
  if (explicit != null && Number.isFinite(Number(explicit)) && label) return `₹${Number(explicit)}/${label}`;
  const factor = variant ? Number(variant.conversionFactor) : Number(product.minSaleQty);
  const unit = String(product.baseUnit || '').toUpperCase();
  if (!(factor > 0) || !(price > 0)) return null;
  const amount = factor * (unit === 'KG' || unit === 'LTR' ? 1000 : 1);
  if (!['KG', 'GM', 'LTR', 'ML'].includes(unit)) return null;
  const rate = Math.round(price / amount * 100 * 100) / 100;
  return `₹${rate}/100 ${unit === 'KG' || unit === 'GM' ? 'g' : 'ml'}`;
}

export const ProductCard = ({
  product,
  onPress,
  onVariantPress,
  compact = false,
  detailed = false,
  selectedVariantId,
  onSelectVariant
}) => {
  const requestRef = useRef(false);
  const imageRef = useRef(null);
  const { getItemQuantity, addItem, updateItem, cart, getItemPending } = useCart();
  const { token } = useAuth();
  const { isSaved, toggleSave } = useWishlist();
  const [localVariantId, setLocalVariantId] = useState(null);
  const [busy, setBusy] = useState(false);
  const reducedMotion = useRef(false), scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(v => { reducedMotion.current = v; }).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', v => { reducedMotion.current = v; });
    return () => sub?.remove?.();
  }, []);

  const variants = (product?.variants || []).filter(v => v.isActive !== false);
  const hasMultipleVariants = variants.length > 1;
  const selected = selectedVariantId !== undefined ? selectedVariantId : localVariantId;
  const variant = variants.find(v => v._id === selected) || variants[0];
  const variantId = variant?._id || null;
  const price = Number(variant?.sellingPrice ?? product?.sellingPrice ?? 0);
  const mrp = Number(variant?.mrp ?? product?.mrp ?? 0);
  const pending = getItemPending(product?._id, variantId);
  const qty = product ? getItemQuantity(product._id, variantId) : 0;

  useEffect(() => {
    if (reducedMotion.current) return;
    scale.setValue(0.94);
    Animated.spring(scale, { toValue: 1, damping: 16, stiffness: 220, useNativeDriver: true }).start();
  }, [qty, variantId]);

  if (!product) return null;

  const images = productImages(product);
  const primaryImage = getProductImage(product) || images[0];
  const unit = variant?.conversionUnit || product.sellingUnit || product.baseUnit || 'PCS';
  const min = Number(product.minSaleQty) > 0 ? Number(product.minSaleQty) : 1;
  const step = Number(product.qtyStep) > 0 ? Number(product.qtyStep) : 1;
  const max = Number(product.maxSaleQty) > 0 ? Number(product.maxSaleQty) : 100;
  const outOfStock = product.isTrackInventory && Number(variant?.stock ?? product.stock ?? 0) <= 0;
  const discount = mrp > price && mrp > 0 ? Math.round((mrp - price) / mrp * 100) : 0;
  const rate = productUnitRate(product, variant, price);

  const open = () => {
    haptics.light();
    if (onPress) {
      onPress(product);
    } else {
      router.push(`/product/${product._id}`);
    }
  };

  const handleAddClick = () => {
    haptics.selection();
    if (hasMultipleVariants) {
      if (onVariantPress) {
        onVariantPress(product, variantId);
      } else if (onPress) {
        onPress(product);
      }
      return;
    }
    change(1);
  };

  const choose = v => {
    setLocalVariantId(v._id);
    onSelectVariant?.(v._id);
    if (onVariantPress) {
      onVariantPress(product, v._id);
    }
  };

  const change = async direction => {
    if (outOfStock || busy || pending || requestRef.current || (direction > 0 && qty >= max)) return;
    if (!token) {
      Alert.alert('Sign in needed', 'Please sign in before adding items to your cart.');
      return;
    }
    requestRef.current = true;
    setBusy(true);
    try {
      const source = direction > 0 ? captureCartSource(imageRef, { ...product, featuredImage: primaryImage }) : null;
      const item = cart?.items?.find(i => i.product?._id === product._id && (variantId ? i.variant?._id === variantId : !i.variant));
      const next = Math.round((qty + direction * step) * 1000) / 1000;
      if (direction > 0 && qty > 0 && next > max) return;
      if (item) await updateItem(item._id, next < min ? 0 : next, source);
      else if (direction > 0) await addItem(product._id, min, variantId, unit, source);
    } catch (error) {
      Alert.alert('Cart not updated', error.message || 'Try again.');
    } finally {
      requestRef.current = false;
      setBusy(false);
    }
  };

  return (
    <View style={[styles.card, compact && styles.compact, detailed && styles.detailed]}>
      {/* Product Image Area */}
      <View ref={imageRef} collapsable={false} style={[styles.imageBox, detailed && styles.detailImage]}>
        <Pressable onPress={open} style={styles.imageContainer} accessibilityLabel={product.name}>
          {primaryImage ? (
            <Image
              source={{ uri: primaryImage }}
              style={styles.image}
              contentFit="contain"
              transition={150}
            />
          ) : (
            <View style={styles.placeholder}>
              <Package size={36} color="#CBD5E1" />
            </View>
          )}
        </Pressable>

        {/* Wishlist Button (Circular pill with Heart icon) */}
        <Pressable
          style={styles.wishlistBtn}
          onPress={() => {
            haptics.selection();
            toggleSave(product);
          }}
          accessibilityRole="button"
          accessibilityLabel={`Save ${product.name}`}
          hitSlop={6}
        >
          <Heart
            size={14}
            color={isSaved(product._id) ? '#EF4444' : '#111827'}
            fill={isSaved(product._id) ? '#EF4444' : 'transparent'}
            strokeWidth={2}
          />
        </Pressable>

        {/* Veg / Non-Veg badge */}
        <View pointerEvents="none" style={styles.lowerLeft}>
          {typeof product.isVeg === 'boolean' && (
            <View style={styles.vegBadge} accessibilityLabel={product.isVeg ? 'Vegetarian' : 'Non-vegetarian'}>
              <View style={[styles.foodMark, { borderColor: product.isVeg ? '#16A34A' : '#DC2626' }]}>
                <View style={[styles.foodDot, { backgroundColor: product.isVeg ? '#16A34A' : '#DC2626' }]} />
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Product Details */}
      <Pressable onPress={open} disabled={detailed} accessibilityLabel={`View ${product.name}`}>
        {/* Name */}
        <Text style={[styles.name, detailed && styles.detailName]} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Unit / Weight */}
        <Text style={styles.unitText} numberOfLines={2}>
          {variant?.name || `${min} ${unit.toLowerCase()}`}
        </Text>

        {/* Bottom Price & Add Action Row */}
        <View style={styles.bottomRow}>
          <View style={styles.priceCol}>
            {/* Price Row */}
            <View style={styles.prices}>
              <Text style={[styles.price, detailed && styles.detailPrice]}>₹{price}</Text>
              {mrp > price && <Text style={styles.mrp}>₹{mrp}</Text>}
            </View>

            {/* Discount & Unit Rate */}
            <View style={styles.discountRow}>
              {discount > 0 && <Text style={styles.discount}>{discount}% OFF</Text>}
              {rate ? <Text style={styles.perUnit}>{rate}</Text> : null}
            </View>
          </View>

          {/* Yellow + Add to Cart Button or Stepper (Aligned at Bottom-Right) */}
          <Animated.View style={[styles.action, { transform: [{ scale }] }]}>
            {outOfStock ? (
              <Text style={styles.soldOut}>Sold out</Text>
            ) : qty > 0 ? (
              <View style={styles.stepper}>
                <Pressable
                  disabled={busy || Boolean(pending)}
                  onPress={() => change(-1)}
                  style={styles.step}
                  accessibilityRole="button"
                  accessibilityLabel={`Decrease ${product.name}`}
                >
                  {pending < 0 ? (
                    <ActivityIndicator size="small" color="#111827" />
                  ) : (
                    <Minus size={14} color="#111827" strokeWidth={2.6} />
                  )}
                </Pressable>
                <Text style={styles.qty}>{qty}</Text>
                <Pressable
                  disabled={busy || Boolean(pending) || qty >= max}
                  onPress={() => change(1)}
                  style={styles.step}
                  accessibilityRole="button"
                  accessibilityLabel={`Increase ${product.name}`}
                >
                  {pending > 0 ? (
                    <ActivityIndicator size="small" color="#111827" />
                  ) : (
                    <Plus size={14} color="#111827" strokeWidth={2.6} />
                  )}
                </Pressable>
              </View>
            ) : (
              <Pressable
                disabled={busy || Boolean(pending)}
                style={({ pressed }) => [styles.plus, pressed && { opacity: 0.85 }]}
                onPress={handleAddClick}
                accessibilityRole="button"
                accessibilityLabel={`Add ${product.name}`}
              >
                {busy || pending ? (
                  <ActivityIndicator size="small" color="#111827" />
                ) : (
                  <Plus size={18} color="#111827" strokeWidth={2.8} />
                )}
              </Pressable>
            )}
          </Animated.View>
        </View>
      </Pressable>
    </View>
  );
};

export const ProductGrid = ({ products = [], onProductPress, style }) => (
  <View style={[styles.grid, style]}>
    {products.map((p, i) => (
      <View key={p._id || p.slug || i} style={styles.gridCell}>
        <ProductCard product={p} onPress={onProductPress} />
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F3F5',
    padding: 10,
    marginBottom: 12
  },
  compact: {
    flex: undefined,
    width: 168,
    marginRight: 12
  },
  detailed: {
    marginBottom: 0
  },
  imageBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative'
  },
  detailImage: {
    aspectRatio: 1,
    borderRadius: 14
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  image: {
    width: '88%',
    height: '88%'
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  wishlistBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2
  },
  lowerLeft: {
    position: 'absolute',
    left: 5,
    bottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  vegBadge: {
    padding: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 5
  },
  foodMark: {
    width: 11,
    height: 11,
    borderRadius: 2,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  foodDot: {
    width: 5,
    height: 5,
    borderRadius: 3
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 4
  },
  priceCol: {
    flex: 1,
    marginRight: 6
  },
  action: {
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  plus: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#FEDC4A',
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 34,
    borderRadius: 9,
    backgroundColor: '#FEDC4A'
  },
  step: {
    width: 28,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center'
  },
  qty: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#111827',
    minWidth: 16,
    textAlign: 'center'
  },
  soldOut: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    fontSize: 9.5,
    fontFamily: typography.family.bold,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    borderRadius: 6
  },
  name: {
    fontFamily: typography.family.bold,
    fontSize: 13,
    lineHeight: 17,
    minHeight: 34,
    color: '#111827',
    marginBottom: 2
  },
  detailName: {
    fontSize: 20,
    lineHeight: 26,
    minHeight: 0
  },
  unitText: {
    fontFamily: typography.family.medium,
    fontSize: 11.5,
    color: '#6B7280',
    marginBottom: 4,
    minHeight: 16
  },
  prices: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6
  },
  price: {
    fontFamily: typography.family.bold,
    fontSize: 15.5,
    color: '#111827'
  },
  detailPrice: {
    fontSize: 22
  },
  mrp: {
    fontFamily: typography.family.regular,
    fontSize: 11,
    color: '#9CA3AF',
    textDecorationLine: 'line-through'
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2
  },
  discount: {
    fontFamily: typography.family.bold,
    fontSize: 11,
    color: '#16A34A'
  },
  perUnit: {
    fontFamily: typography.family.regular,
    fontSize: 10.5,
    color: '#6B7280'
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 10,
    paddingHorizontal: 16
  },
  gridCell: {
    width: '48%',
    flexGrow: 1,
    maxWidth: '49%'
  }
});
