import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Plus, Minus, Check, ShoppingBag, Package, ChevronRight, Info, Eye } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { colors, typography } from '../../constants/theme';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { haptics } from '../../services/haptics';
import { getProductImage, productUnitRate } from './ProductCard';

export function ProductQuickSheet({
  product,
  mode = 'variants',
  initialVariantId,
  onClose
}) {
  const insets = useSafeAreaInsets();
  const { cart, addItem, updateItem } = useCart();
  const { token } = useAuth();

  // Animation
  const animValue = useRef(new Animated.Value(0)).current;
  const [modalRendered, setModalRendered] = useState(Boolean(product));

  const variants = useMemo(() => {
    return (product?.variants || []).filter((v) => v.isActive !== false);
  }, [product]);

  // Extract distinct types/varieties if present
  const typeOptions = useMemo(() => {
    if (!variants || variants.length === 0) return [];
    const types = new Set();
    variants.forEach((v) => {
      const typeAttr = (v.attributes || []).find((a) =>
        /^(type|variety|flavor|flavour)$/i.test(a.key)
      );
      if (typeAttr && typeAttr.value) {
        types.add(typeAttr.value.trim());
      }
    });
    return Array.from(types);
  }, [variants]);

  const [selectedType, setSelectedType] = useState(() => {
    return typeOptions[0] || null;
  });

  // Filter variants by type if selected
  const visibleVariants = useMemo(() => {
    if (!variants || variants.length === 0) return [];
    if (!selectedType) return variants;
    const filtered = variants.filter((v) => {
      const typeAttr = (v.attributes || []).find((a) =>
        /^(type|variety|flavor|flavour)$/i.test(a.key)
      );
      return typeAttr && typeAttr.value && typeAttr.value.trim() === selectedType;
    });
    return filtered.length > 0 ? filtered : variants;
  }, [variants, selectedType]);

  // Selected variant state
  const [selectedVariantId, setSelectedVariantId] = useState(() => {
    if (initialVariantId) return initialVariantId;
    return visibleVariants[0]?._id || variants[0]?._id || null;
  });

  // Keep selected variant in sync if visible variants change
  useEffect(() => {
    if (visibleVariants.length > 0) {
      const exists = visibleVariants.some((v) => v._id === selectedVariantId);
      if (!exists) {
        setSelectedVariantId(visibleVariants[0]._id);
      }
    }
  }, [visibleVariants]);

  const selectedVariant = useMemo(() => {
    return visibleVariants.find((v) => v._id === selectedVariantId) || visibleVariants[0] || null;
  }, [visibleVariants, selectedVariantId]);

  const [busy, setBusy] = useState(false);

  // Live item in cart for the current selected variant
  const variantId = selectedVariant?._id || null;
  const existingCartItem = useMemo(() => {
    return cart?.items?.find(
      (i) =>
        (i.product?._id || i.product) === product?._id &&
        (variantId ? (i.variant?._id || i.variant) === variantId : !i.variant)
    );
  }, [cart, product?._id, variantId]);

  const currentCartQty = existingCartItem?.qty || 0;

  // Slide-in animation
  useEffect(() => {
    if (product) {
      setModalRendered(true);
      Animated.timing(animValue, {
        toValue: 1,
        duration: 250,
        easing: Easing.bezier(0.2, 0.9, 0.3, 1),
        useNativeDriver: true
      }).start();
    }
  }, [product]);

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

  // Active pricing calculation
  const activePrice = Number(selectedVariant?.sellingPrice ?? product.sellingPrice ?? 0);
  const activeMrp = Number(selectedVariant?.mrp ?? product.mrp ?? 0);
  const activeDiscount =
    activeMrp > activePrice && activeMrp > 0
      ? Math.round(((activeMrp - activePrice) / activeMrp) * 100)
      : 0;

  const primaryImage = getProductImage(product);
  const unit = selectedVariant?.conversionUnit || product.sellingUnit || product.baseUnit || 'PCS';
  const min = Number(product.minSaleQty) > 0 ? Number(product.minSaleQty) : 1;
  const step = Number(product.qtyStep) > 0 ? Number(product.qtyStep) : 1;
  const max = Number(product.maxSaleQty) > 0 ? Number(product.maxSaleQty) : 100;
  

  const handleOpenFullDetails = () => {
    haptics.selection();
    handleClose();
    router.push(`/product/${product._id}`);
  };

  // Add initial item to cart
  const handleAddToCart = async () => {
    if (busy) return;
    if (!token) {
      Alert.alert('Sign in needed', 'Please sign in before adding items to your cart.');
      return;
    }

    haptics.notificationSuccess();
    setBusy(true);
    try {
      await addItem(product._id, min, variantId, unit);
    } catch (err) {
      Alert.alert('Cart update failed', err.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  // Increment cart quantity
  const handleIncrement = async () => {
    if (busy || !existingCartItem) return;
    if (currentCartQty >= max) return;
    haptics.selection();
    setBusy(true);
    try {
      await updateItem(existingCartItem._id, currentCartQty + 1);
    } catch (err) {
      Alert.alert('Cart update failed', err.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  // Decrement cart quantity; when it reaches 0, it removes item and restores Add to Cart button
  const handleDecrement = async () => {
    if (busy || !existingCartItem) return;
    haptics.selection();
    setBusy(true);
    try {
      const nextQty = currentCartQty - 1;
      await updateItem(existingCartItem._id, nextQty < min ? 0 : nextQty);
    } catch (err) {
      Alert.alert('Cart update failed', err.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [500, 0]
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
        {/* Animated Dimmed & Blurred Backdrop (Blur + Black Overlay) */}
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: backdropOpacity }]}
          pointerEvents="none"
        >
          <BlurView
            intensity={Platform.OS === 'ios' ? 55 : 35}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.62)' }]} />
        </Animated.View>

        {/* Dedicated outside tap area to close smoothly when clicking outside */}
        <Pressable
          style={styles.outsideTapArea}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss variation modal by clicking outside"
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

          {/* Close X Button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleClose}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={20} color="#111827" strokeWidth={2.4} />
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* 1. Product Summary Header (Clickable to view full details) */}
            <TouchableOpacity
              style={styles.productHeaderRow}
              onPress={() => {
                haptics.selection();
                onClose();
                router.push('/product/' + product._id);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.thumbnailBox}>
                {primaryImage ? (
                  <Image
                    source={{ uri: primaryImage }}
                    style={styles.thumbnailImage}
                    contentFit="contain"
                    transition={150}
                  />
                ) : (
                  <Package size={30} color="#9CA3AF" />
                )}
              </View>

              <View style={styles.productHeaderInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {product.name}
                </Text>
                <Text style={styles.productSubtitle} numberOfLines={2}>
                  {product.shortDescription || product.subtitle || 'Fresh and naturally grown'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* 2. Select a type (if types exist) */}
            {typeOptions.length > 0 && (
              <View style={styles.sectionWrap}>
                <Text style={styles.sectionHeading}>Select a type</Text>
                <View style={styles.typePillRow}>
                  {typeOptions.map((type) => {
                    const isSelected = selectedType === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.typePill,
                          isSelected && styles.typePillSelected
                        ]}
                        onPress={() => {
                          haptics.selection();
                          setSelectedType(type);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.typePillText,
                            isSelected && styles.typePillTextSelected
                          ]}
                        >
                          {type}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* 3. Select pack size */}
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionHeading}>Select pack size</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.variantsRow}
              >
                {(visibleVariants.length > 0 ? visibleVariants : [null]).map((v, idx) => {
                  const isSelected = v ? selectedVariantId === v._id : true;
                  const vPrice = Number(v?.sellingPrice ?? product.sellingPrice ?? 0);
                  const vMrp = Number(v?.mrp ?? product.mrp ?? 0);
                  const vDiscount =
                    vMrp > vPrice && vMrp > 0
                      ? Math.round(((vMrp - vPrice) / vMrp) * 100)
                      : 0;
                  const vRate = productUnitRate(product, v, vPrice);
                  const vLabel = v?.name || `${min} ${unit.toLowerCase()}`;

                  return (
                    <TouchableOpacity
                      key={v?._id || idx}
                      style={[
                        styles.packCard,
                        isSelected && styles.packCardSelected
                      ]}
                      onPress={() => {
                        haptics.selection();
                        if (v) setSelectedVariantId(v._id);
                      }}
                      activeOpacity={0.85}
                    >
                      {/* Top Row: Pack name + Radio Checkmark */}
                      <View style={styles.packTopRow}>
                        <Text style={styles.packNameText} numberOfLines={2}>
                          {vLabel}
                        </Text>
                        <View
                          style={[
                            styles.radioCircle,
                            isSelected && styles.radioCircleSelected
                          ]}
                        >
                          {isSelected && <Check size={12} color="#111827" strokeWidth={3.4} />}
                        </View>
                      </View>

                      {/* Price Row */}
                      <View style={styles.packPriceRow}>
                        <Text style={styles.packPriceText}>₹{vPrice}</Text>
                        {vMrp > vPrice && (
                          <Text style={styles.packMrpText}>₹{vMrp}</Text>
                        )}
                      </View>

                      {/* Discount Tag */}
                      {vDiscount > 0 && (
                        <Text style={styles.packDiscountText}>{vDiscount}% OFF</Text>
                      )}

                      {/* Per Unit Rate */}
                      {vRate ? (
                        <Text style={styles.packUnitRateText}>{vRate}</Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>


          </ScrollView>

          {/* 5. Sticky Bottom Action Bar */}
          <View style={styles.bottomBar}>
            {/* View Full Details Button */}
            <TouchableOpacity
              style={styles.viewDetailsBtn}
              onPress={handleOpenFullDetails}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="View full product details"
            >
              <Eye size={16} color="#111827" strokeWidth={2.4} />
              <Text style={styles.viewDetailsBtnText}>View Details</Text>
            </TouchableOpacity>

            {/* Compact Add To Cart or Quantity Stepper */}
            <View style={styles.actionCol}>
              {busy ? (
                <View style={styles.smallLoadingBtn}>
                  <ActivityIndicator size="small" color="#111827" />
                </View>
              ) : currentCartQty > 0 ? (
                /* Quantity Stepper (Minus, Qty, Plus) */
                <View style={styles.bottomStepper}>
                  <TouchableOpacity
                    style={styles.bottomStepBtn}
                    onPress={handleDecrement}
                    disabled={busy}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Decrease quantity"
                  >
                    <Minus size={16} color="#111827" strokeWidth={2.6} />
                  </TouchableOpacity>

                  <Text style={styles.bottomStepperQty}>{currentCartQty}</Text>

                  <TouchableOpacity
                    style={styles.bottomStepBtnAdd}
                    onPress={handleIncrement}
                    disabled={busy || currentCartQty >= max}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Increase quantity"
                  >
                    <Plus size={16} color="#111827" strokeWidth={2.6} />
                  </TouchableOpacity>
                </View>
              ) : (
                /* Small Add to Cart Button */
                <TouchableOpacity
                  style={styles.smallAddToCartBtn}
                  onPress={handleAddToCart}
                  disabled={busy}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Add to cart"
                >
                  <Text style={styles.smallAddText}>Add to Cart</Text>
                  <View style={styles.smallAddDivider} />
                  <Text style={styles.smallAddPrice}>₹{activePrice}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const F = typography.family;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent'
  },
  outsideTapArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    minHeight: 460,
    maxHeight: '85%',
    position: 'relative',
    zIndex: 2,
    elevation: 20
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 10
  },
  handlePill: {
    width: 44,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: '#D1D5DB'
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 16
  },
  productHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 16
  },
  thumbnailBox: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  thumbnailImage: {
    width: '90%',
    height: '90%'
  },
  productHeaderInfo: {
    flex: 1,
    paddingRight: 24
  },
  productName: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#111827',
    lineHeight: 21,
    marginBottom: 3
  },
  productSubtitle: {
    fontFamily: F.regular,
    fontSize: 12.5,
    color: '#6B7280',
    lineHeight: 16
  },
  sectionWrap: {
    marginBottom: 20
  },
  sectionHeading: {
    fontFamily: F.bold,
    fontSize: 14.5,
    color: '#111827',
    marginBottom: 10
  },
  typePillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  typePill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E5E7EB'
  },
  typePillSelected: {
    borderColor: '#FEDC4A',
    backgroundColor: '#FEFCE8'
  },
  typePillText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: '#4B5563'
  },
  typePillTextSelected: {
    fontFamily: F.bold,
    color: '#111827'
  },
  variantsRow: {
    gap: 12,
    paddingVertical: 2
  },
  packCard: {
    minWidth: 150,
    maxWidth: 200,
    minHeight: 125,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    padding: 12,
    justifyContent: 'space-between'
  },
  packCardSelected: {
    borderColor: '#FEDC4A',
    backgroundColor: '#FEFCE8'
  },
  packTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  packNameText: {
    fontFamily: F.bold,
    fontSize: 13.5,
    lineHeight: 18,
    color: '#111827',
    flex: 1,
    marginRight: 6,
    minHeight: 36
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  radioCircleSelected: {
    backgroundColor: '#FEDC4A',
    borderColor: '#FEDC4A'
  },
  packPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    marginBottom: 3
  },
  packPriceText: {
    fontFamily: F.bold,
    fontSize: 15.5,
    color: '#111827'
  },
  packMrpText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#9CA3AF',
    textDecorationLine: 'line-through'
  },
  packDiscountText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#16A34A',
    marginBottom: 3
  },
  packUnitRateText: {
    fontFamily: F.regular,
    fontSize: 10.5,
    color: '#6B7280'
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF'
  },
  viewDetailsBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  viewDetailsBtnText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#111827'
  },
  actionCol: {
    flex: 1.25
  },
  smallAddToCartBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FEDC4A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12
  },
  smallAddText: {
    fontFamily: F.bold,
    fontSize: 14.5,
    color: '#111827'
  },
  smallAddDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#E5A900'
  },
  smallAddPrice: {
    fontFamily: F.bold,
    fontSize: 14.5,
    color: '#111827'
  },
  smallLoadingBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FEDC4A',
    alignItems: 'center',
    justifyContent: 'center'
  },
  bottomStepper: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4
  },
  bottomStepBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  bottomStepperQty: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#111827',
    minWidth: 28,
    textAlign: 'center'
  },
  bottomStepBtnAdd: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEDC4A',
    alignItems: 'center',
    justifyContent: 'center'
  }
});
