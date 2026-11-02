import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check, ShoppingCart, Package } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { colors, typography } from '../../constants/theme';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { haptics } from '../../services/haptics';
import { getProductImage, getVariantDisplay } from './ProductCard';
import { captureCartSource } from '../FloatingCart';

export function ProductQuickSheet({
  product,
  initialVariantId,
  onClose,
  onVariantAdded
}) {
  const insets = useSafeAreaInsets();
  const thumbnailRef = useRef(null);
  const { addItem } = useCart();
  const { token } = useAuth();
  const [busy, setBusy] = useState(false);

  // Animation
  const animValue = useRef(new Animated.Value(0)).current;
  const [modalRendered, setModalRendered] = useState(Boolean(product));

  const variants = useMemo(() => {
    return (product?.variants || []).filter((v) => v.isActive !== false);
  }, [product]);

  const productId = String(product?._id || product?.id || '');

  // Selected variant state
  const [selectedVariantId, setSelectedVariantId] = useState(() => {
    if (initialVariantId) return String(initialVariantId);
    return variants[0]?._id || variants[0]?.id || null;
  });

  // Keep selected variant in sync
  useEffect(() => {
    if (variants.length > 0) {
      const exists = variants.some((v) => String(v._id || v.id) === String(selectedVariantId));
      if (!exists) {
        setSelectedVariantId(variants[0]._id || variants[0].id);
      }
    }
  }, [variants, selectedVariantId]);

  const selectedVariant = useMemo(() => {
    return variants.find((v) => String(v._id || v.id) === String(selectedVariantId)) || variants[0] || null;
  }, [variants, selectedVariantId]);

  // Slide-in animation
  useEffect(() => {
    if (product) {
      setModalRendered(true);
      Animated.timing(animValue, {
        toValue: 1,
        duration: 240,
        easing: Easing.bezier(0.2, 0.9, 0.3, 1),
        useNativeDriver: true
      }).start();
    }
  }, [product, animValue]);

  const handleClose = () => {
    haptics.selection();
    Animated.timing(animValue, {
      toValue: 0,
      duration: 180,
      easing: Easing.bezier(0.3, 0, 0.8, 0.15),
      useNativeDriver: true
    }).start(() => {
      setModalRendered(false);
      onClose?.();
    });
  };

  if (!modalRendered || !product) return null;

  const primaryImage = getProductImage(product);
  const minPrice = variants.length
    ? Math.min(...variants.map((v) => Number(v.sellingPrice ?? product.sellingPrice ?? 0)))
    : Number(product.sellingPrice || 0);
  const minMrp = variants.length
    ? Math.max(...variants.map((v) => Number(v.mrp ?? product.mrp ?? 0)))
    : Number(product.mrp || 0);
  const headerDiscount =
    minMrp > minPrice && minMrp > 0
      ? Math.round(((minMrp - minPrice) / minMrp) * 100)
      : 0;

  const unit = selectedVariant?.conversionUnit || product.sellingUnit || product.baseUnit || 'PCS';
  const min = Number(product.minSaleQty) > 0 ? Number(product.minSaleQty) : 1;

  // Add selected variant to cart and dismiss
  const handleAddToCart = async () => {
    if (busy || !selectedVariant) return;
    if (!token) {
      Alert.alert('Sign in needed', 'Please sign in before adding items to your cart.');
      return;
    }

    haptics.notificationSuccess();
    setBusy(true);
    try {
      const vId = selectedVariant._id || selectedVariant.id || null;
      const source = captureCartSource(thumbnailRef, { ...product, featuredImage: primaryImage });
      await addItem(productId, min, vId, unit, source);
      onVariantAdded?.(vId);
      handleClose();
    } catch (err) {
      Alert.alert('Cart update failed', err.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [420, 0]
  });

  const backdropOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  return (
    <Modal
      transparent
      visible={modalRendered}
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* Animated Dimmed & Blurred Backdrop */}
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: backdropOpacity }]}
          pointerEvents="none"
        >
          {Platform.OS === 'ios' && (
            <BlurView intensity={45} tint="dark" style={StyleSheet.absoluteFill} />
          )}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.55)' }]} />
        </Animated.View>

        {/* Dismiss on outside tap */}
        <TouchableOpacity
          style={styles.outsideTapArea}
          onPress={handleClose}
          activeOpacity={1}
          accessibilityRole="button"
          accessibilityLabel="Close variant sheet"
        />

        {/* Bottom Sheet Card */}
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              transform: [{ translateY }],
              paddingBottom: Math.max(insets.bottom, 16)
            }
          ]}
        >
          {/* Top Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handlePill} />
          </View>

          {/* Header Row: Title & Close X */}
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Select Variant</Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={18} color="#111827" strokeWidth={2.4} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Product Summary Header */}
            <View style={styles.productSummaryBox}>
              <View ref={thumbnailRef} collapsable={false} style={styles.thumbnailBox}>
                {primaryImage ? (
                  <Image
                    source={{ uri: primaryImage }}
                    style={styles.thumbnailImage}
                    contentFit="contain"
                    transition={150}
                  />
                ) : (
                  <Package size={24} color="#9CA3AF" />
                )}
              </View>

              <View style={styles.productSummaryInfo}>
                <Text style={styles.productSummaryName} numberOfLines={1}>
                  {product.name}
                </Text>
                <View style={styles.summaryPriceRow}>
                  <Text style={styles.summaryFromText}>From </Text>
                  <Text style={styles.summaryPrice}>₹{minPrice}</Text>
                  {minMrp > minPrice && (
                    <Text style={styles.summaryMrp}>₹{minMrp}</Text>
                  )}
                  {headerDiscount > 0 && (
                    <View style={styles.summaryDiscountBadge}>
                      <Text style={styles.summaryDiscountText}>{headerDiscount}% OFF</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Choose Weight / Pack Section */}
            <Text style={styles.sectionHeading}>Choose Weight</Text>
            <View style={styles.variantsGrid}>
              {variants.map((v) => {
                const isSelected = selectedVariantId === v._id;
                const vPrice = Number(v.sellingPrice ?? product.sellingPrice ?? 0);
                const vMrp = Number(v.mrp ?? product.mrp ?? 0);
                const vDiscount =
                  vMrp > vPrice && vMrp > 0
                    ? Math.round(((vMrp - vPrice) / vMrp) * 100)
                    : 0;
                const vStockVal = Number(v.stock ?? v.quantity ?? product.stock ?? product.quantity ?? 0);
                const vOutOfStock =
                  product.isOutOfStock === true ||
                  (v.stock !== undefined || v.quantity !== undefined || product.stock !== undefined
                    ? vStockVal <= 0
                    : false) ||
                  (product.isTrackInventory && vStockVal <= 0);

                return (
                  <TouchableOpacity
                    key={v._id}
                    disabled={vOutOfStock}
                    style={[
                      styles.variantCard,
                      isSelected && styles.variantCardSelected,
                      vOutOfStock && styles.variantCardDisabled
                    ]}
                    onPress={() => {
                      haptics.selection();
                      setSelectedVariantId(v._id);
                    }}
                    activeOpacity={0.85}
                  >
                    {(() => {
                      const { weight, variety } = getVariantDisplay(v, product);
                      return (
                        <View style={styles.variantTopRow}>
                          <View style={styles.variantHeaderCol}>
                            <Text
                              style={[
                                styles.variantWeightText,
                                isSelected && styles.variantWeightTextSelected,
                                vOutOfStock && styles.textDisabled
                              ]}
                              numberOfLines={1}
                            >
                              {weight}
                            </Text>
                            {variety ? (
                              <View style={[styles.varietyBadge, isSelected && styles.varietyBadgeSelected]}>
                                <Text
                                  style={[
                                    styles.varietyBadgeText,
                                    isSelected && styles.varietyBadgeTextSelected,
                                    vOutOfStock && styles.textDisabled
                                  ]}
                                  numberOfLines={1}
                                >
                                  {variety}
                                </Text>
                              </View>
                            ) : null}
                          </View>

                          {isSelected ? (
                            <View style={styles.checkBadge}>
                              <Check size={12} color="#111827" strokeWidth={3} />
                            </View>
                          ) : (
                            <View style={styles.uncheckCircle} />
                          )}
                        </View>
                      );
                    })()}

                    <View style={styles.variantPriceRow}>
                      <Text
                        style={[
                          styles.variantPrice,
                          vOutOfStock && styles.textDisabled
                        ]}
                      >
                        ₹{vPrice}
                      </Text>
                      {vMrp > vPrice && (
                        <Text style={styles.variantMrp}>₹{vMrp}</Text>
                      )}
                      {vDiscount > 0 && !vOutOfStock && (
                        <Text style={styles.variantDiscount}>{vDiscount}% OFF</Text>
                      )}
                    </View>

                    {vOutOfStock && (
                      <Text style={styles.outOfStockLabel}>Out of Stock</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Full-width Yellow Add to Cart CTA */}
          <View style={styles.bottomCtaWrap}>
            <TouchableOpacity
              style={[styles.addCtaBtn, busy && styles.addCtaDisabled]}
              onPress={handleAddToCart}
              disabled={busy}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Add to cart"
            >
              {busy ? (
                <ActivityIndicator size="small" color="#111827" />
              ) : (
                <>
                  <ShoppingCart size={18} color="#111827" strokeWidth={2.4} />
                  <Text style={styles.addCtaText}>Add to Cart</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent'
  },
  outsideTapArea: {
    flex: 1
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingHorizontal: 20,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 20
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 6
  },
  handlePill: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB'
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 6
  },
  headerTitle: {
    fontFamily: typography.family.bold,
    fontSize: 18,
    color: '#111827'
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center'
  },
  scrollContent: {
    paddingBottom: 16
  },
  productSummaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEA',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    padding: 10,
    marginBottom: 16,
    gap: 12
  },
  thumbnailBox: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  thumbnailImage: {
    width: 44,
    height: 44
  },
  productSummaryInfo: {
    flex: 1
  },
  productSummaryName: {
    fontFamily: typography.family.bold,
    fontSize: 14.5,
    color: '#111827',
    marginBottom: 4
  },
  summaryPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4
  },
  summaryFromText: {
    fontFamily: typography.family.regular,
    fontSize: 12,
    color: '#6B7280'
  },
  summaryPrice: {
    fontFamily: typography.family.bold,
    fontSize: 15,
    color: '#111827'
  },
  summaryMrp: {
    fontFamily: typography.family.regular,
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginLeft: 2
  },
  summaryDiscountBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6
  },
  summaryDiscountText: {
    fontFamily: typography.family.bold,
    fontSize: 10.5,
    color: '#16A34A'
  },
  sectionHeading: {
    fontFamily: typography.family.bold,
    fontSize: 14.5,
    color: '#111827',
    marginBottom: 12
  },
  variantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  variantCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 12,
    justifyContent: 'space-between',
    minHeight: 84
  },
  variantCardSelected: {
    borderColor: '#FFC928',
    backgroundColor: '#FFFDF5'
  },
  variantCardDisabled: {
    opacity: 0.5,
    backgroundColor: '#F9FAFB'
  },
  variantHeaderCol: {
    flex: 1,
    paddingRight: 6
  },
  variantWeightText: {
    fontFamily: typography.family.bold,
    fontSize: 15,
    color: '#111827',
    fontWeight: '700'
  },
  variantWeightTextSelected: {
    color: '#111827'
  },
  varietyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    marginTop: 3
  },
  varietyBadgeSelected: {
    backgroundColor: '#FEF3C7'
  },
  varietyBadgeText: {
    fontFamily: typography.family.medium,
    fontSize: 10.5,
    color: '#4B5563',
    fontWeight: '600'
  },
  varietyBadgeTextSelected: {
    color: '#92400E'
  },
  variantTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  variantName: {
    fontFamily: typography.family.bold,
    fontSize: 13.5,
    color: '#374151',
    flex: 1
  },
  variantNameSelected: {
    color: '#111827'
  },
  checkBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFC928',
    alignItems: 'center',
    justifyContent: 'center'
  },
  uncheckCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#D1D5DB'
  },
  variantPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 4
  },
  variantPrice: {
    fontFamily: typography.family.bold,
    fontSize: 16,
    color: '#111827'
  },
  variantMrp: {
    fontFamily: typography.family.regular,
    fontSize: 11.5,
    color: '#9CA3AF',
    textDecorationLine: 'line-through'
  },
  variantDiscount: {
    fontFamily: typography.family.bold,
    fontSize: 10.5,
    color: '#16A34A',
    marginLeft: 2
  },
  outOfStockLabel: {
    fontFamily: typography.family.medium,
    fontSize: 10.5,
    color: '#EF4444',
    marginTop: 4
  },
  textDisabled: {
    color: '#9CA3AF'
  },
  bottomCtaWrap: {
    paddingTop: 10
  },
  addCtaBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFC928',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#E5A900',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }
  },
  addCtaDisabled: {
    opacity: 0.7
  },
  addCtaText: {
    fontFamily: typography.family.bold,
    fontSize: 15.5,
    color: '#111827'
  }
});
