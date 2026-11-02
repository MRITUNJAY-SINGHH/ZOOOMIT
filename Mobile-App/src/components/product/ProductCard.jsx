import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Animated,
  ActivityIndicator,
  AccessibilityInfo
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Plus, Minus, Heart, ChevronRight, Package } from 'lucide-react-native';
import { typography } from '../../constants/theme';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { haptics } from '../../services/haptics';
import { captureCartSource } from '../FloatingCart';
import { ProductQuickSheet } from './ProductQuickSheet';

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

export const productImages = (p) => {
  const list = [
    p?.featuredImage,
    p?.image,
    ...(p?.galleryImages || []),
    ...(p?.images || []).map((img) => (typeof img === 'string' ? img : img?.url))
  ].filter((x) => typeof x === 'string' && x.trim());
  return [...new Set(list)];
};

export function productUnitRate(product, variant, price) {
  const explicit = variant?.unitPrice ?? product?.unitPrice;
  const label = variant?.unitPriceLabel ?? product?.unitPriceLabel;
  if (explicit != null && Number.isFinite(Number(explicit)) && label) return `₹${Number(explicit)}/${label}`;
  const factor = variant ? Number(variant.conversionFactor) : Number(product?.minSaleQty);
  const unit = String(product?.baseUnit || '').toUpperCase();
  if (!(factor > 0) || !(price > 0)) return null;
  const amount = factor * (unit === 'KG' || unit === 'LTR' ? 1000 : 1);
  if (!['KG', 'GM', 'LTR', 'ML'].includes(unit)) return null;
  const rate = Math.round((price / amount) * 100 * 100) / 100;
  return `₹${rate}/100 ${unit === 'KG' || unit === 'GM' ? 'g' : 'ml'}`;
}

export function getVariantDisplay(variant, product) {
  if (!variant) return { weight: '', variety: '', fullLabel: '', rawName: '' };

  let weight = '';
  let variety = '';

  // 1. Check variant attributes array
  if (Array.isArray(variant.attributes) && variant.attributes.length > 0) {
    const packAttr = variant.attributes.find((a) =>
      /pack|weight|size|qty|quantity/i.test(a.key || '')
    );
    if (packAttr?.value) {
      weight = String(packAttr.value).trim();
    }
    const typeAttr = variant.attributes.find((a) =>
      /type|variety|flavour|flavor|variant/i.test(a.key || '')
    );
    if (typeAttr?.value) {
      variety = String(typeAttr.value).trim();
    }
  }

  // 2. Extract from variant name if weight not found or name has ' - '
  const rawName = String(variant.name || '').trim();
  if (rawName) {
    if (rawName.includes(' - ')) {
      const parts = rawName.split(' - ').map((s) => s.trim());
      if (!weight) {
        weight = parts[parts.length - 1];
      }
      if (!variety && parts.length > 1) {
        variety = parts.slice(0, parts.length - 1).join(' - ');
      }
    } else if (!weight) {
      const match = rawName.match(/\b\d+(\.\d+)?\s*(g|gm|gms|kg|kgs|ml|l|ltr|ltrs|pc|pcs|pack|pk)\b/i);
      if (match) {
        weight = match[0];
        const rest = rawName.replace(match[0], '').replace(/[()\-]/g, '').trim();
        if (rest && !variety) variety = rest;
      } else {
        weight = rawName;
      }
    }
  }

  // 3. Fallbacks for weight
  if (!weight) {
    if (variant.conversionFactor && variant.conversionUnit) {
      weight = `${variant.conversionFactor} ${variant.conversionUnit}`;
    } else if (product?.sellingUnit) {
      weight = product.sellingUnit;
    } else if (product?.baseUnit) {
      const minQty = Number(product.minSaleQty) || 1;
      weight = `${minQty} ${product.baseUnit.toLowerCase()}`;
    } else {
      weight = rawName || '1 Pack';
    }
  }

  // 4. Simplify variety so it doesn't redundantly repeat product name
  let cleanVariety = variety;
  if (cleanVariety && product?.name) {
    const pClean = product.name.toLowerCase().replace(/[()]/g, ' ');
    const vWords = cleanVariety.split(/[\s\-]+/);
    const filtered = vWords.filter((w) => {
      const lower = w.toLowerCase();
      if (['hybrid', 'desi', 'local', 'imported', 'organic'].includes(lower)) return true;
      return !pClean.includes(lower);
    });
    if (filtered.length > 0) {
      cleanVariety = filtered.join(' ');
    } else if (cleanVariety.toLowerCase().includes('hybrid')) {
      cleanVariety = 'Hybrid';
    } else {
      cleanVariety = '';
    }
  }

  const fullLabel = cleanVariety ? `${weight} • ${cleanVariety}` : weight;

  return { weight, variety: cleanVariety, fullLabel, rawName };
}

export const ProductCard = ({
  product,
  onPress,
  onVariantPress,
  compact = false,
  selectedVariantId,
  onSelectVariant
}) => {
  const requestRef = useRef(false);
  const imageRef = useRef(null);
  const { cart, getItemQuantity, addItem, updateItem, getItemPending } = useCart();
  const { token } = useAuth();
  const { isSaved, toggleSave } = useWishlist();

  const [busy, setBusy] = useState(false);
  const [showQuickSheet, setShowQuickSheet] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const reducedMotion = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => { reducedMotion.current = v; })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => {
      reducedMotion.current = v;
    });
    return () => sub?.remove?.();
  }, []);

  const variants = useMemo(() => {
    return (product?.variants || []).filter((v) => v.isActive !== false);
  }, [product?.variants]);

  const hasMultipleVariants = variants.length > 1;

  const productId = String(product?._id || product?.id || '');

  // Check if an item for this product is currently in the cart
  const cartItem = useMemo(() => {
    return cart?.items?.find((i) => {
      const pId = String(i.product?._id || i.product || '');
      return pId === productId && Number(i.qty || 0) > 0;
    });
  }, [cart?.items, productId]);

  // Determine active variant:
  // 1. If product is in cart with a variant, show that variant
  // 2. Else if selectedVariantId prop passed, use that
  // 3. Else if single product without multiple variants, use variants[0]
  // 4. Else null (user must choose variant)
  const activeCartVariant = useMemo(() => {
    if (!cartItem?.variant) return null;
    const vId = String(cartItem.variant?._id || cartItem.variant?.id || cartItem.variant || '');
    return variants.find((v) => String(v._id || v.id) === vId) || null;
  }, [cartItem, variants]);

  const activeVariant = useMemo(() => {
    if (activeCartVariant) return activeCartVariant;
    if (selectedVariantId) return variants.find((v) => String(v._id || v.id) === String(selectedVariantId)) || null;
    if (!hasMultipleVariants && variants.length > 0) return variants[0];
    return null;
  }, [activeCartVariant, selectedVariantId, hasMultipleVariants, variants]);

  const activeVariantId = activeVariant?._id || activeVariant?.id || null;
  const qty = cartItem
    ? Number(cartItem.qty || 0)
    : product
    ? getItemQuantity(productId, activeVariantId)
    : 0;

  const pending = getItemPending(productId, activeVariantId);

  useEffect(() => {
    if (reducedMotion.current) return;
    scale.setValue(0.95);
    Animated.spring(scale, { toValue: 1, damping: 15, stiffness: 240, useNativeDriver: true }).start();
  }, [qty, activeVariantId, scale]);

  if (!product) return null;

  const primaryImage = getProductImage(product);
  const min = Number(product.minSaleQty) > 0 ? Number(product.minSaleQty) : 1;
  const step = Number(product.qtyStep) > 0 ? Number(product.qtyStep) : 1;
  const max = Number(product.maxSaleQty) > 0 ? Number(product.maxSaleQty) : 100;
  const unit = activeVariant?.conversionUnit || product.sellingUnit || product.baseUnit || 'PCS';

  // Pricing calculations
  const minPrice = variants.length
    ? Math.min(...variants.map((v) => Number(v.sellingPrice ?? product.sellingPrice ?? 0)))
    : Number(product.sellingPrice || 0);

  const price = activeVariant
    ? Number(activeVariant.sellingPrice ?? product.sellingPrice ?? 0)
    : minPrice;

  const mrp = activeVariant
    ? Number(activeVariant.mrp ?? product.mrp ?? 0)
    : variants.length
    ? Math.max(...variants.map((v) => Number(v.mrp ?? product.mrp ?? 0)))
    : Number(product.mrp || 0);

  const discount = mrp > price && mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;

  const hasVariants = variants.length > 0;
  const totalVariantStock = hasVariants
    ? variants.reduce((sum, v) => sum + Number(v.stock ?? v.quantity ?? v.countInStock ?? 0), 0)
    : 0;

  const currentStock = activeVariant
    ? Number(activeVariant.stock ?? activeVariant.quantity ?? activeVariant.countInStock ?? 0)
    : hasVariants
    ? totalVariantStock
    : Number(product.stock ?? product.quantity ?? product.countInStock ?? 0);

  const hasStockField =
    activeVariant?.stock !== undefined ||
    activeVariant?.quantity !== undefined ||
    product?.stock !== undefined ||
    product?.quantity !== undefined ||
    (hasVariants && variants.some((v) => v.stock !== undefined || v.quantity !== undefined));

  const outOfStock =
    product.isOutOfStock === true ||
    (hasStockField ? currentStock <= 0 : false) ||
    (product.isTrackInventory && currentStock <= 0);

  // Available options display for multiple variants before adding
  const availableOptionsText = useMemo(() => {
    if (!hasMultipleVariants) return null;
    const weights = variants
      .map((v) => getVariantDisplay(v, product).weight)
      .filter(Boolean);
    const unique = [...new Set(weights)];
    return unique.join(' | ');
  }, [hasMultipleVariants, variants, product]);

  const activeCartVariantText = useMemo(() => {
    if (!activeCartVariant) return '';
    const { weight, variety } = getVariantDisplay(activeCartVariant, product);
    return variety ? `${weight} • ${variety}` : weight;
  }, [activeCartVariant, product]);

  const openDetails = () => {
    haptics.light();
    if (onPress) {
      onPress(product);
    } else {
      router.push(`/product/${product._id}`);
    }
  };

  const handleChooseVariant = () => {
    haptics.selection();
    if (onVariantPress) {
      onVariantPress(product, activeVariantId);
    } else {
      setShowQuickSheet(true);
    }
  };

  const change = async (direction) => {
    if (outOfStock || busy || pending || requestRef.current || (direction > 0 && qty >= max)) return;
    if (!token) {
      Alert.alert('Sign in needed', 'Please sign in before adding items to your cart.');
      return;
    }
    requestRef.current = true;
    setBusy(true);
    try {
      const source =
        direction > 0
          ? captureCartSource(imageRef, { ...product, featuredImage: primaryImage })
          : null;
      const targetItem = cart?.items?.find((i) => {
        const pId = String(i.product?._id || i.product || '');
        const vId = String(i.variant?._id || i.variant?.id || i.variant || '');
        return pId === productId && (activeVariantId ? vId === String(activeVariantId) : !vId);
      });

      const next = Math.round((qty + direction * step) * 1000) / 1000;
      if (direction > 0 && qty > 0 && next > max) return;
      if (targetItem) {
        await updateItem(targetItem._id, next < min ? 0 : next, source);
      } else if (direction > 0) {
        await addItem(productId, min, activeVariantId, unit, source);
      }
    } catch (error) {
      Alert.alert('Cart not updated', error.message || 'Try again.');
    } finally {
      requestRef.current = false;
      setBusy(false);
    }
  };

  const saved = isSaved(product._id);

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      {/* 1. Upper Product Image Area with Soft Light-Yellow Gradient Background */}
      <View ref={imageRef} collapsable={false} style={styles.imageBox}>
        <Pressable
          onPress={openDetails}
          style={styles.imageTouchable}
          accessibilityRole="button"
          accessibilityLabel={`View ${product.name}`}
        >
          {primaryImage ? (
            <Image
              source={{ uri: primaryImage }}
              style={styles.image}
              contentFit="cover"
              transition={150}
            />
          ) : (
            <View style={styles.placeholder}>
              <Package size={38} color="#D1D5DB" />
            </View>
          )}
        </Pressable>

        {/* Wishlist Heart Icon (White Circular Pill at Top-Right) */}
        <Pressable
          style={styles.wishlistBtn}
          onPress={() => {
            haptics.selection();
            toggleSave(product);
          }}
          accessibilityRole="button"
          accessibilityLabel={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          hitSlop={8}
        >
          <Heart
            size={15}
            color={saved ? '#EF4444' : '#111827'}
            fill={saved ? '#EF4444' : 'transparent'}
            strokeWidth={2}
          />
        </Pressable>
      </View>

      {/* 2. Clean White Content Area */}
      <View style={styles.contentArea}>
        {/* Top Row: Green/Veg Dot on Left, Discount Badge on Right */}
        <View style={styles.topIndicatorRow}>
          <View
            style={[
              styles.vegBox,
              { borderColor: product.isVeg === false ? '#DC2626' : '#16A34A' }
            ]}
          >
            <View
              style={[
                styles.vegDot,
                { backgroundColor: product.isVeg === false ? '#DC2626' : '#16A34A' }
              ]}
            />
          </View>

          {discount > 0 ? (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discount}% OFF</Text>
            </View>
          ) : (
            <View style={styles.discountPlaceholder} />
          )}
        </View>

        {/* Product Name (Fixed 2 lines height) */}
        <Pressable onPress={openDetails} accessibilityRole="button" accessibilityLabel={`View ${product.name}`}>
          <Text style={styles.productName} numberOfLines={2}>
            {product.name}
          </Text>
        </Pressable>

        {/* Pack Size / Variant Info */}
        <View style={styles.packSizeRow}>
          {hasMultipleVariants && qty > 0 && activeCartVariant ? (
            // After selecting variant and adding to cart: yellow pill badge
            <View style={styles.selectedVariantBadge}>
              <Text style={styles.selectedVariantText} numberOfLines={1}>
                {activeCartVariantText || activeCartVariant.name || activeCartVariant.conversionUnit}
              </Text>
            </View>
          ) : hasMultipleVariants && qty === 0 ? (
            // Before adding with variations: show available pack sizes
            <Text style={styles.variantOptionsText} numberOfLines={1}>
              {availableOptionsText || 'Multiple options'}
            </Text>
          ) : (
            // Single product without variations
            <Text style={styles.singlePackText} numberOfLines={1}>
              {getVariantDisplay(activeVariant, product).weight || activeVariant?.name || `${min} ${unit.toLowerCase()}`}
            </Text>
          )}
        </View>

        {/* Price Section: Top has MRP with light strikethrough, Below has actual price */}
        <View style={styles.priceContainer}>
          <View style={styles.mrpRow}>
            {mrp > price ? (
              <Text style={styles.mrpValue}>₹{mrp}</Text>
            ) : (
              <View style={styles.mrpPlaceholder} />
            )}
          </View>

          <View style={styles.actualPriceRow}>
            {hasMultipleVariants && qty === 0 ? (
              <View style={styles.priceWithFromRow}>
                <Text style={styles.fromLabel}>From </Text>
                <Text style={styles.priceValue}>₹{minPrice}</Text>
              </View>
            ) : (
              <Text style={styles.priceValue}>₹{price}</Text>
            )}
          </View>
        </View>

        {/* 3. Action Area: Add to Cart / Choose Weight / Stepper */}
        <Animated.View style={[styles.actionRow, { transform: [{ scale }] }]}>
          {outOfStock ? (
            <View style={styles.soldOutBtn}>
              <Text style={styles.soldOutText}>Out of Stock</Text>
            </View>
          ) : qty > 0 ? (
            // 3-part Stepper (Minus, Quantity, Solid Yellow Plus)
            <View style={styles.stepperWrap}>
              <Pressable
                disabled={busy || Boolean(pending)}
                onPress={() => change(-1)}
                style={styles.stepBtnMinus}
                accessibilityRole="button"
                accessibilityLabel={`Decrease quantity of ${product.name}`}
                hitSlop={4}
              >
                {pending < 0 ? (
                  <ActivityIndicator size="small" color="#111827" />
                ) : (
                  <Minus size={15} color="#111827" strokeWidth={2.6} />
                )}
              </Pressable>

              <View style={styles.stepQtyBox}>
                <Text style={styles.stepQtyText}>{qty}</Text>
              </View>

              <Pressable
                disabled={busy || Boolean(pending) || qty >= max}
                onPress={() => change(1)}
                style={styles.stepBtnPlus}
                accessibilityRole="button"
                accessibilityLabel={`Increase quantity of ${product.name}`}
                hitSlop={4}
              >
                {pending > 0 ? (
                  <ActivityIndicator size="small" color="#111827" />
                ) : (
                  <Plus size={15} color="#111827" strokeWidth={2.6} />
                )}
              </Pressable>
            </View>
          ) : hasMultipleVariants ? (
            // With variations: Yellow "Choose Weight >" button
            <Pressable
              disabled={busy}
              style={({ pressed }) => [
                styles.chooseWeightBtn,
                pressed && styles.btnPressed
              ]}
              onPress={handleChooseVariant}
              accessibilityRole="button"
              accessibilityLabel={`Choose weight for ${product.name}`}
            >
              <Text style={styles.chooseWeightText}>Choose Weight</Text>
              <ChevronRight size={15} color="#111827" strokeWidth={2.6} />
            </Pressable>
          ) : (
            // No variations: Instant Yellow "Add to Cart" button
            <Pressable
              disabled={busy || Boolean(pending)}
              style={({ pressed }) => [
                styles.addToCartBtn,
                pressed && styles.btnPressed
              ]}
              onPress={() => change(1)}
              accessibilityRole="button"
              accessibilityLabel={`Add ${product.name} to cart`}
            >
              {busy || pending ? (
                <ActivityIndicator size="small" color="#111827" />
              ) : (
                <Text style={styles.addToCartText}>Add to Cart</Text>
              )}
            </Pressable>
          )}
        </Animated.View>
      </View>

      {/* Built-in Quick Variant Bottom Sheet */}
      {showQuickSheet && (
        <ProductQuickSheet
          product={product}
          initialVariantId={activeVariantId}
          onClose={() => setShowQuickSheet(false)}
          onVariantAdded={(vId) => {
            onSelectVariant?.(vId);
          }}
        />
      )}
    </View>
  );
};

export const ProductGrid = ({ products = [], onProductPress, onVariantPress, style }) => (
  <View style={[styles.grid, style]}>
    {products.map((p, i) => (
      <View key={p._id || p.slug || i} style={styles.gridCell}>
        <ProductCard
          product={p}
          onPress={onProductPress}
          onVariantPress={onVariantPress}
        />
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 12
  },
  cardCompact: {
    flex: undefined,
    width: 168,
    marginRight: 12,
    marginBottom: 0
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16
  },
  gridCell: {
    width: '48%',
    marginBottom: 12
  },

  /* 1. Upper Image Box */
  imageBox: {
    width: '100%',
    aspectRatio: 1.05,
    backgroundColor: '#FFF9E8',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden'
  },
  imageTouchable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  image: {
    width: '100%',
    height: '100%'
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  wishlistBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3
  },

  /* 2. Content Area */
  contentArea: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 10
  },
  topIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 18,
    marginBottom: 6
  },
  vegBox: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF'
  },
  vegDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  discountBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4
  },
  discountText: {
    fontFamily: typography.family.bold,
    fontSize: 10,
    color: '#16A34A'
  },
  discountPlaceholder: {
    height: 18
  },
  productName: {
    fontFamily: typography.family.bold,
    fontSize: 13.5,
    color: '#111827',
    lineHeight: 18,
    height: 36,
    marginBottom: 4
  },
  packSizeRow: {
    height: 20,
    justifyContent: 'center',
    marginBottom: 6
  },
  variantOptionsText: {
    fontFamily: typography.family.medium,
    fontSize: 11.5,
    color: '#6B7280'
  },
  singlePackText: {
    fontFamily: typography.family.medium,
    fontSize: 11.5,
    color: '#6B7280'
  },
  selectedVariantBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF4C7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4
  },
  selectedVariantText: {
    fontFamily: typography.family.bold,
    fontSize: 11,
    color: '#111827'
  },

  /* Price Container */
  priceContainer: {
    height: 34,
    justifyContent: 'flex-end',
    marginBottom: 8
  },
  mrpRow: {
    height: 14,
    justifyContent: 'center'
  },
  mrpValue: {
    fontFamily: typography.family.regular,
    fontSize: 11,
    color: '#9CA3AF',
    textDecorationLine: 'line-through'
  },
  mrpPlaceholder: {
    height: 14
  },
  actualPriceRow: {
    height: 20,
    justifyContent: 'center'
  },
  priceWithFromRow: {
    flexDirection: 'row',
    alignItems: 'baseline'
  },
  fromLabel: {
    fontFamily: typography.family.regular,
    fontSize: 11.5,
    color: '#6B7280',
    marginRight: 2
  },
  priceValue: {
    fontFamily: typography.family.bold,
    fontSize: 15.5,
    color: '#111827'
  },

  /* 3. Action Area */
  actionRow: {
    width: '100%'
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }]
  },
  addToCartBtn: {
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFC928',
    alignItems: 'center',
    justifyContent: 'center'
  },
  addToCartText: {
    fontFamily: typography.family.bold,
    fontSize: 13,
    color: '#111827'
  },
  chooseWeightBtn: {
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFC928',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2
  },
  chooseWeightText: {
    fontFamily: typography.family.bold,
    fontSize: 13,
    color: '#111827'
  },
  stepperWrap: {
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden'
  },
  stepBtnMinus: {
    width: 36,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF'
  },
  stepQtyBox: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF'
  },
  stepQtyText: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#111827'
  },
  stepBtnPlus: {
    width: 36,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFC928'
  },
  soldOutBtn: {
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  soldOutText: {
    fontFamily: typography.family.bold,
    fontSize: 12.5,
    color: '#9CA3AF'
  }
});
