import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  Pressable,
  Modal,
  Share,
  PanResponder,
  TouchableOpacity
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  X,
  Share2,
  Layers,
  Zap,
  Tag,
  ChevronRight,
  RotateCcw,
  Truck,
  Headphones,
  CheckCircle2
} from 'lucide-react-native';
import { colors, typography } from '../../constants/theme';
import { ProductSaveButton } from './ProductSaveButton';
import { ProductInfoTabs } from './ProductInfoTabs';
import { SimilarProducts } from './SimilarProducts';
import { SellerDetails } from './SellerDetails';
import { useCart } from '../../context/CartContext';
import { haptics } from '../../services/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const QuickProductSheet = ({
  visible,
  product: initialProduct,
  onClose,
  onOpenFullDetails
}) => {
  const insets = useSafeAreaInsets();
  const { getItemQuantity, addItem, updateItem, cart } = useCart();

  // Screen 2: Lower 55-65% screen height (~60%)
  const QUICK_HEIGHT = Math.round(SCREEN_HEIGHT * 0.60);
  // Screen 3: Full height up to status bar inset
  const FULL_HEIGHT = SCREEN_HEIGHT - Math.max(insets.top, 10);

  const [currentProduct, setCurrentProduct] = useState(initialProduct);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [offersModalVisible, setOffersModalVisible] = useState(false);

  const isExpandedRef = useRef(false);
  const scrollOffsetY = useRef(0);
  const scrollViewRef = useRef(null);
  const startDragHeight = useRef(QUICK_HEIGHT);

  const sheetHeight = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  const animatedSheetStyle = useAnimatedStyle(() => ({
    height: sheetHeight.value
  }));

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value
  }));

  useEffect(() => {
    isExpandedRef.current = isExpanded;
  }, [isExpanded]);

  useEffect(() => {
    if (visible && initialProduct) {
      setCurrentProduct(initialProduct);
      setIsExpanded(false);
      isExpandedRef.current = false;
      scrollOffsetY.current = 0;
      setSelectedVariantId(initialProduct?.variants?.[0]?._id || null);
      setActiveImgIndex(0);

      sheetHeight.value = 0;
      backdropOpacity.value = 0;

      // Spring up from bottom to QUICK_HEIGHT
      sheetHeight.value = withSpring(QUICK_HEIGHT, {
        damping: 24,
        stiffness: 260,
        mass: 0.8
      });
      backdropOpacity.value = withTiming(1, { duration: 220 });
    }
  }, [visible, initialProduct]);

  const toggleExpand = useCallback((expand) => {
    haptics.selection();
    setIsExpanded(expand);
    isExpandedRef.current = expand;
    sheetHeight.value = withSpring(expand ? FULL_HEIGHT : QUICK_HEIGHT, {
      damping: 24,
      stiffness: 260,
      mass: 0.8
    });
    if (!expand) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, [FULL_HEIGHT, QUICK_HEIGHT, sheetHeight]);

  const handleClose = useCallback(() => {
    haptics.light();
    sheetHeight.value = withTiming(0, { duration: 200 });
    backdropOpacity.value = withTiming(0, { duration: 200 });
    setTimeout(() => {
      onClose();
    }, 200);
  }, [onClose, sheetHeight, backdropOpacity]);

  // Dedicated PanResponder for Top Drag Handle & Header bar
  const headerPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        startDragHeight.current = sheetHeight.value;
      },
      onPanResponderMove: (_, gestureState) => {
        const targetH = startDragHeight.current - gestureState.dy;
        sheetHeight.value = Math.max(0, Math.min(FULL_HEIGHT, targetH));
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentH = sheetHeight.value;
        if (!isExpandedRef.current) {
          // In Quick View: swipe UP expands to full page; swipe DOWN closes
          if (gestureState.dy < -30 || gestureState.vy < -0.3 || currentH > QUICK_HEIGHT + 50) {
            toggleExpand(true);
          } else if (gestureState.dy > 35 || gestureState.vy > 0.3 || currentH < QUICK_HEIGHT - 40) {
            handleClose();
          } else {
            sheetHeight.value = withSpring(QUICK_HEIGHT, { damping: 24, stiffness: 260 });
          }
        } else {
          // In Full Page: swipe DOWN collapses back to Quick View
          if (gestureState.dy > 40 || gestureState.vy > 0.3 || currentH < FULL_HEIGHT - 60) {
            toggleExpand(false);
          } else {
            sheetHeight.value = withSpring(FULL_HEIGHT, { damping: 24, stiffness: 260 });
          }
        }
      }
    })
  ).current;

  // PanResponder for Main Sheet Body (gestures anywhere on sheet when collapsed, or at top of scroll when expanded)
  const sheetPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only react to vertical gestures
        if (Math.abs(gestureState.dx) > Math.abs(gestureState.dy)) return false;

        // When collapsed (Quick View): any vertical swipe > 10px expands or closes
        if (!isExpandedRef.current) {
          return Math.abs(gestureState.dy) > 10;
        }

        // When expanded (Full Page): only capture swipe DOWN when scroll is at the top
        if (isExpandedRef.current && scrollOffsetY.current <= 2 && gestureState.dy > 12) {
          return true;
        }

        return false;
      },
      onPanResponderGrant: () => {
        startDragHeight.current = sheetHeight.value;
      },
      onPanResponderMove: (_, gestureState) => {
        const targetH = startDragHeight.current - gestureState.dy;
        if (!isExpandedRef.current) {
          sheetHeight.value = Math.max(0, Math.min(FULL_HEIGHT, targetH));
        } else {
          sheetHeight.value = Math.max(QUICK_HEIGHT, Math.min(FULL_HEIGHT, targetH));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentH = sheetHeight.value;
        if (!isExpandedRef.current) {
          if (gestureState.dy < -40 || gestureState.vy < -0.4 || currentH > QUICK_HEIGHT + 60) {
            toggleExpand(true);
          } else if (gestureState.dy > 50 || gestureState.vy > 0.4 || currentH < QUICK_HEIGHT - 50) {
            handleClose();
          } else {
            sheetHeight.value = withSpring(QUICK_HEIGHT, { damping: 24, stiffness: 260 });
          }
        } else {
          if (gestureState.dy > 55 || gestureState.vy > 0.4 || currentH < FULL_HEIGHT - 70) {
            toggleExpand(false);
          } else {
            sheetHeight.value = withSpring(FULL_HEIGHT, { damping: 24, stiffness: 260 });
          }
        }
      }
    })
  ).current;

  const product = currentProduct || initialProduct;
  if (!visible || !product) {
    return null;
  }

  const images = (product?.galleryImages && product.galleryImages.length > 0)
    ? product.galleryImages
    : [product?.featuredImage || 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=800'];

  const variants = product?.variants || [];
  const selectedVariant = variants.find(v => v._id === selectedVariantId) || variants[0] || null;

  const activePrice = selectedVariant?.sellingPrice || product?.sellingPrice || 0;
  const activeMrp = selectedVariant?.mrp || product?.mrp || 0;
  const activeUnit = selectedVariant?.conversionUnit || product?.sellingUnit || product?.baseUnit || 'PCS';
  const activeVariantName = selectedVariant?.name || `${product?.minSaleQty || 1} ${activeUnit}`;
  const activeVariantId = selectedVariant?._id || null;

  const hasDiscount = activeMrp > activePrice;
  const discountPercent = hasDiscount
    ? Math.round(((activeMrp - activePrice) / activeMrp) * 100)
    : 0;

  const currentQty = product ? getItemQuantity(product._id, activeVariantId) : 0;
  const minQty = product?.minSaleQty || 1;
  const step = product?.qtyStep || 1;

  const handleAdd = () => {
    if (!product) return;
    haptics.medium();
    addItem(product._id, minQty, activeVariantId, activeUnit);
  };

  const handleIncrement = () => {
    if (!product) return;
    haptics.selection();
    const cartItem = cart?.items?.find(
      i => i.product?._id === product._id && (activeVariantId ? i.variant?._id === activeVariantId : !i.variant)
    );
    if (cartItem) {
      updateItem(cartItem._id, Math.round((currentQty + step) * 1000) / 1000);
    } else {
      addItem(product._id, minQty, activeVariantId, activeUnit);
    }
  };

  const handleDecrement = () => {
    if (!product) return;
    haptics.selection();
    const cartItem = cart?.items?.find(
      i => i.product?._id === product._id && (activeVariantId ? i.variant?._id === activeVariantId : !i.variant)
    );
    if (cartItem) {
      const nextQty = Math.round((currentQty - step) * 1000) / 1000;
      updateItem(cartItem._id, nextQty < minQty ? 0 : nextQty);
    }
  };

  const handleShare = async () => {
    if (!product) return;
    haptics.selection();
    try {
      await Share.share({
        message: `Check out ${product.name} on Kuiklo! Fresh essentials delivered in 17 mins.`,
        title: product.name
      });
    } catch (e) {}
  };

  const handleSelectSimilarProduct = (newProduct) => {
    haptics.selection();
    setCurrentProduct(newProduct);
    setSelectedVariantId(newProduct?.variants?.[0]?._id || null);
    setActiveImgIndex(0);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const categoryName = product.category?.name || product.categoryName || 'Fresh Vegetables';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => {
        if (isExpanded) {
          toggleExpand(false);
        } else {
          handleClose();
        }
      }}
    >
      <View style={styles.backdrop}>
        {/* Dimmed backdrop over category page (Screen 2 & 3) */}
        <Animated.View style={[styles.backdropPressable, animatedBackdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        {/* Bottom-anchored Sheet Container */}
        <Animated.View 
          style={[styles.sheetContainer, animatedSheetStyle]}
          {...sheetPanResponder.panHandlers}
        >
          {/* 1. Top Drag Handle & Action Bar (Pan Responder enabled) */}
          <View style={styles.topBarWrap} {...headerPanResponder.panHandlers}>
            <View style={styles.dragHandlePill} />

            <View style={styles.headerControlsRow}>
              {/* Left action: '✕' in Quick View (Screen 2) -> '←' in Full Page (Screen 3) */}
              <TouchableOpacity
                onPress={() => {
                  if (isExpanded) {
                    toggleExpand(false); // Screen 4: back to Quick View
                  } else {
                    handleClose(); // Screen 5: back to Category
                  }
                }}
                style={styles.circleIconBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {isExpanded ? (
                  <ArrowLeft size={20} color="#111827" strokeWidth={2.4} />
                ) : (
                  <X size={18} color="#111827" strokeWidth={2.4} />
                )}
              </TouchableOpacity>

              {/* Right actions: Bookmark & Share (Screen 2 & 3) */}
              <View style={styles.topRightRow}>
                <ProductSaveButton 
                  product={product} 
                  size={18} 
                  variant="circle" 
                />
                <TouchableOpacity
                  onPress={handleShare}
                  style={styles.circleIconBtn}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Share2 size={17} color="#111827" strokeWidth={2.2} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* 2. Scrollable Body Content */}
          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            bounces={false}
            scrollEventThrottle={16}
            scrollEnabled={isExpanded}
            onScroll={(e) => {
              scrollOffsetY.current = e.nativeEvent.contentOffset.y;
            }}
          >
            {/* HERO PRODUCT IMAGE CAROUSEL */}
            <View style={[styles.heroImageWrap, isExpanded && styles.heroImageWrapExpanded]}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                  setActiveImgIndex(idx);
                }}
                style={styles.heroCarousel}
              >
                {images.map((imgUri, idx) => (
                  <View key={idx} style={styles.heroSlide}>
                    <Image
                      source={{ uri: imgUri }}
                      style={styles.fullCoverImage}
                      contentFit="cover"
                      transition={150}
                    />
                  </View>
                ))}
              </ScrollView>

              {/* View Similar Floating Pill (Only when collapsed or if similar products exist) */}
              <TouchableOpacity
                onPress={() => {
                  if (!isExpanded) {
                    toggleExpand(true);
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({ y: 520, animated: true });
                    }, 280);
                  } else {
                    scrollViewRef.current?.scrollTo({ y: 520, animated: true });
                  }
                }}
                style={styles.viewSimilarPill}
                activeOpacity={0.8}
              >
                <Layers size={13} color="#111827" strokeWidth={2} style={{ marginRight: 5 }} />
                <Text style={styles.viewSimilarText}>View Similar</Text>
              </TouchableOpacity>
            </View>

            {/* Pagination Dots & Delivery ETA Row */}
            <View style={styles.metaRow}>
              {images.length > 1 ? (
                <View style={styles.dotsWrap}>
                  {images.map((_, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.dot,
                        idx === activeImgIndex ? styles.dotActive : styles.dotInactive
                      ]}
                    />
                  ))}
                </View>
              ) : <View style={{ width: 10 }} />}

              <View style={styles.deliveryBadge}>
                <Zap size={12} color="#D97706" fill="#D97706" />
                <Text style={styles.deliveryText}>
                  {product.deliveryTime || '17 MINS'}
                </Text>
              </View>
            </View>

            {/* PRODUCT INFORMATION */}
            <View style={styles.infoCard}>
              <Text style={styles.productTitle}>{product.name}</Text>
              {Boolean(product.subtitle) && (
                <Text style={styles.productSubtitle}>{product.subtitle}</Text>
              )}
              <Text style={styles.quantityLabel}>
                Quantity: {activeVariantName}
              </Text>

              {/* VARIANT / PACK SELECTOR CARDS (Screen 2 & 3) */}
              {variants.length > 0 && (
                <View style={styles.variantsRow}>
                  {variants.slice(0, 3).map((v) => {
                    const isSelected = v._id === selectedVariantId;
                    const vPrice = v.sellingPrice || product.sellingPrice || 0;
                    const vMrp = v.mrp || product.mrp || 0;
                    const vHasDiscount = vMrp > vPrice;
                    const vDiscount = vHasDiscount ? Math.round(((vMrp - vPrice) / vMrp) * 100) : 0;

                    let rate = '';
                    const factor = v.conversionFactor || 1;
                    const vUnit = (v.conversionUnit || 'kg').toLowerCase();
                    if (vUnit === 'kg' || vUnit === 'g' || vUnit === 'gm') {
                      const grams = vUnit === 'kg' ? factor * 1000 : factor * 100;
                      if (grams > 0) {
                        rate = `₹${((vPrice / grams) * 100).toFixed(1)}/100 g`;
                      }
                    }

                    return (
                      <Pressable
                        key={v._id}
                        onPress={() => {
                          haptics.selection();
                          setSelectedVariantId(v._id);
                        }}
                        style={[
                          styles.variantCard,
                          isSelected && styles.variantCardSelected
                        ]}
                      >
                        <Text 
                          style={[styles.variantCardName, isSelected && styles.variantCardNameSelected]}
                          numberOfLines={1}
                        >
                          {v.name}
                        </Text>

                        {vHasDiscount ? (
                          <Text style={styles.variantDiscountText}>
                            {vDiscount}% OFF
                          </Text>
                        ) : (
                          <View style={{ height: 16 }} />
                        )}

                        <View style={styles.variantPriceRow}>
                          <Text style={styles.variantPrice}>₹{vPrice}</Text>
                          {vHasDiscount && (
                            <Text style={styles.variantMrp}>₹{vMrp}</Text>
                          )}
                        </View>

                        {Boolean(rate) && (
                          <Text style={styles.variantRateText}>{rate}</Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {/* PAYMENT OFFERS ROW (Screen 2 & 3) */}
              <Pressable
                onPress={() => {
                  haptics.selection();
                  setOffersModalVisible(true);
                }}
                style={styles.paymentOffersRow}
              >
                <View style={styles.paymentOffersHeader}>
                  <Text style={styles.paymentOffersTitle}>Payment Offers</Text>
                  <ChevronRight size={15} color="#6B7280" />
                </View>
                <View style={styles.paymentOffersBadgeRow}>
                  <View style={styles.offerTagCircle}>
                    <Tag size={12} color="#7C3AED" />
                  </View>
                  <Text style={styles.offerTagText}>₹100 OFF</Text>
                </View>
              </Pressable>
            </View>

            {/* EXTENDED SECTIONS REVEALED ON SWIPE UP / EXPAND (Screen 3) */}
            {isExpanded && (
              <View style={styles.extendedSection}>
                {/* 1. Service Benefits Row: 48 Hours Refund, Fast Delivery, 24/7 Support */}
                <View style={styles.serviceBenefitsRow}>
                  <View style={styles.serviceBenefitCard}>
                    <RotateCcw size={18} color="#1F2937" strokeWidth={2} />
                    <Text style={styles.benefitTitle}>48 Hours</Text>
                    <Text style={styles.benefitSubtitle}>Refund</Text>
                  </View>

                  <View style={styles.serviceBenefitCard}>
                    <Truck size={18} color="#1F2937" strokeWidth={2} />
                    <Text style={styles.benefitTitle}>Fast</Text>
                    <Text style={styles.benefitSubtitle}>Delivery</Text>
                  </View>

                  <View style={styles.serviceBenefitCard}>
                    <Headphones size={18} color="#1F2937" strokeWidth={2} />
                    <Text style={styles.benefitTitle}>24/7</Text>
                    <Text style={styles.benefitSubtitle}>Support</Text>
                  </View>
                </View>

                {/* 2. Product Information Tabs (Highlights, Description, Health benefits, Storage) */}
                <View style={styles.sectionWrap}>
                  <ProductInfoTabs product={product} />
                </View>

                {/* 3. Category Link Banner */}
                <Pressable
                  onPress={() => {
                    haptics.selection();
                    handleClose();
                  }}
                  style={styles.categoryLinkBanner}
                >
                  <Text style={styles.categoryLinkText}>
                    Explore all {categoryName} Category items
                  </Text>
                  <ChevronRight size={16} color="#0066FF" />
                </Pressable>

                {/* 4. Similar Products */}
                {product.similarProducts && product.similarProducts.length > 0 && (
                  <View style={styles.sectionWrap}>
                    <SimilarProducts 
                      products={product.similarProducts} 
                      onProductPress={handleSelectSimilarProduct}
                    />
                  </View>
                )}

                {/* 5. Seller Details & Other Information */}
                <View style={styles.sectionWrap}>
                  <SellerDetails product={product} />
                </View>
              </View>
            )}

            {/* Spacer for sticky bottom bar */}
            <View style={{ height: 90 }} />
          </ScrollView>

          {/* 3. STICKY BOTTOM ACTION BAR */}
          <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <View style={styles.bottomBarLeft}>
              <View style={styles.bottomPackRow}>
                <Text style={styles.bottomPackName} numberOfLines={1}>
                  {activeVariantName}
                </Text>
                {hasDiscount && (
                  <Text style={styles.bottomDiscountBadge}>
                    {discountPercent}% OFF
                  </Text>
                )}
              </View>
              <View style={styles.bottomPriceRow}>
                <Text style={styles.bottomPriceText}>₹{activePrice}</Text>
                {hasDiscount && (
                  <Text style={styles.bottomMrpText}>₹{activeMrp}</Text>
                )}
              </View>
            </View>

            {currentQty > 0 ? (
              <View style={styles.stepperWrap}>
                <TouchableOpacity onPress={handleDecrement} style={styles.stepperBtn} activeOpacity={0.7}>
                  <Text style={styles.stepperBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepperQtyText}>{currentQty}</Text>
                <TouchableOpacity onPress={handleIncrement} style={styles.stepperBtn} activeOpacity={0.7}>
                  <Text style={styles.stepperBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Pressable
                onPress={handleAdd}
                style={({ pressed }) => [
                  styles.addBtn,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
                ]}
              >
                <Text style={styles.addBtnText}>ADD</Text>
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* Payment Offers Modal Sheet */}
        <Modal
          visible={offersModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setOffersModalVisible(false)}
        >
          <View style={styles.offersModalOverlay}>
            <Pressable style={styles.offersBackdrop} onPress={() => setOffersModalVisible(false)} />
            <View style={styles.offersSheet}>
              <View style={styles.offersSheetHeader}>
                <Text style={styles.offersSheetTitle}>Available Offers</Text>
                <TouchableOpacity onPress={() => setOffersModalVisible(false)} hitSlop={8}>
                  <X size={20} color="#374151" />
                </TouchableOpacity>
              </View>
              <View style={styles.offerItem}>
                <CheckCircle2 size={18} color="#16A34A" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.offerItemTitle}>Flat ₹100 OFF with KUIKLO100</Text>
                  <Text style={styles.offerItemDesc}>
                    Applicable on orders above ₹499. Apply coupon at checkout.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent'
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.48)'
  },
  sheetContainer: {
    width: '100%',
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0
  },
  topBarWrap: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 6,
    backgroundColor: colors.white,
    zIndex: 20
  },
  dragHandlePill: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    marginBottom: 8
  },
  headerControlsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16
  },
  topRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  circleIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center'
  },
  scrollContent: {
    paddingBottom: 24
  },
  heroImageWrap: {
    width: '100%',
    height: 215,
    backgroundColor: '#F3F4F6',
    position: 'relative'
  },
  heroImageWrapExpanded: {
    height: 290
  },
  heroCarousel: {
    width: '100%',
    height: '100%'
  },
  heroSlide: {
    width: SCREEN_WIDTH,
    height: '100%'
  },
  fullCoverImage: {
    width: '100%',
    height: '100%'
  },
  viewSimilarPill: {
    position: 'absolute',
    right: 14,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    paddingVertical: 5,
    paddingHorizontal: 11,
    zIndex: 10
  },
  viewSimilarText: {
    fontFamily: typography.family.bold,
    fontSize: 11.5,
    color: '#111827',
    fontWeight: '700'
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8
  },
  dotsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5
  },
  dotActive: {
    backgroundColor: '#0066FF',
    width: 7,
    height: 7,
    borderRadius: 3.5
  },
  dotInactive: {
    backgroundColor: '#D1D5DB'
  },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  deliveryText: {
    fontFamily: typography.family.bold,
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '700'
  },
  infoCard: {
    paddingHorizontal: 16,
    paddingTop: 8
  },
  productTitle: {
    fontFamily: typography.family.bold,
    fontSize: 19,
    color: '#111827',
    fontWeight: '700',
    lineHeight: 24
  },
  productSubtitle: {
    fontFamily: typography.family.medium,
    fontSize: 12.5,
    color: '#6B7280',
    marginTop: 3
  },
  quantityLabel: {
    fontFamily: typography.family.bold,
    fontSize: 12.5,
    color: '#374151',
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 6
  },
  variantsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4
  },
  variantCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 9
  },
  variantCardSelected: {
    borderColor: '#0066FF',
    borderWidth: 2,
    backgroundColor: '#F8FAFF'
  },
  variantCardName: {
    fontFamily: typography.family.bold,
    fontSize: 12.5,
    color: '#1F2937',
    fontWeight: '700'
  },
  variantCardNameSelected: {
    color: '#0066FF'
  },
  variantDiscountText: {
    fontFamily: typography.family.bold,
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '700',
    marginVertical: 2
  },
  variantPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2
  },
  variantPrice: {
    fontFamily: typography.family.bold,
    fontSize: 13.5,
    color: '#111827',
    fontWeight: '700'
  },
  variantMrp: {
    fontFamily: typography.family.regular,
    fontSize: 11,
    color: '#9CA3AF',
    textDecorationLine: 'line-through'
  },
  variantRateText: {
    fontFamily: typography.family.medium,
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2
  },
  paymentOffersRow: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 10,
    marginTop: 12
  },
  paymentOffersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  paymentOffersTitle: {
    fontFamily: typography.family.bold,
    fontSize: 12.5,
    color: '#1F2937',
    fontWeight: '700'
  },
  paymentOffersBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  offerTagCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6
  },
  offerTagText: {
    fontFamily: typography.family.bold,
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: '700'
  },
  extendedSection: {
    marginTop: 12
  },
  serviceBenefitsRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 10
  },
  serviceBenefitCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  benefitTitle: {
    fontFamily: typography.family.bold,
    fontSize: 12,
    color: '#111827',
    fontWeight: '700',
    marginTop: 5
  },
  benefitSubtitle: {
    fontFamily: typography.family.regular,
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1
  },
  categoryLinkBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 14
  },
  categoryLinkText: {
    fontFamily: typography.family.bold,
    fontSize: 12.5,
    color: '#0066FF',
    fontWeight: '700',
    flex: 1,
    marginRight: 8
  },
  sectionWrap: {
    marginTop: 12,
    paddingHorizontal: 16
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 50
  },
  bottomBarLeft: {
    flex: 1,
    marginRight: 16
  },
  bottomPackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  bottomPackName: {
    fontFamily: typography.family.bold,
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '700'
  },
  bottomDiscountBadge: {
    fontFamily: typography.family.bold,
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '700'
  },
  bottomPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 2
  },
  bottomPriceText: {
    fontFamily: typography.family.bold,
    fontSize: 17,
    color: '#111827',
    fontWeight: '700'
  },
  bottomMrpText: {
    fontFamily: typography.family.regular,
    fontSize: 12.5,
    color: '#9CA3AF',
    textDecorationLine: 'line-through'
  },
  addBtn: {
    backgroundColor: '#0066FF',
    borderRadius: 8,
    paddingHorizontal: 30,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center'
  },
  addBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 14.5,
    color: colors.white,
    fontWeight: '700'
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: '#0066FF',
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 4
  },
  stepperBtn: {
    width: 32,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  stepperBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 17,
    color: '#0066FF',
    fontWeight: '700'
  },
  stepperQtyText: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#111827',
    fontWeight: '700',
    minWidth: 26,
    textAlign: 'center'
  },
  offersModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)'
  },
  offersBackdrop: {
    ...StyleSheet.absoluteFillObject
  },
  offersSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32
  },
  offersSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  offersSheetTitle: {
    fontFamily: typography.family.bold,
    fontSize: 16,
    color: '#111827',
    fontWeight: '700'
  },
  offerItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  offerItemTitle: {
    fontFamily: typography.family.bold,
    fontSize: 13,
    color: '#111827',
    fontWeight: '700',
    marginBottom: 3
  },
  offerItemDesc: {
    fontFamily: typography.family.regular,
    fontSize: 12,
    color: '#6B7280'
  }
});
