import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Platform,
  Alert,
  useWindowDimensions,
  Modal,
  Animated
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  X,
  Search,
  Heart,
  Share2,
  Truck,
  Package,
  ShieldCheck,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ShoppingCart,
  Plus,
  Minus,
  Headphones,
  Box,
  Sparkles,
  AlertCircle,
  Utensils,
  Info,
  Tag,
  Leaf,
  Layers,
  Clock,
  ThermometerSnowflake,
  ShieldAlert
} from 'lucide-react-native';
import { colors, typography } from '../../constants/theme';
import { api, StorefrontAPI } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { haptics } from '../../services/haptics';
import { ErrorState } from '../../components/ErrorState';

const stripHtml = (html) =>
  String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

export default function ProductDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const sliderWidth = Math.min(width - 32, 500);
  const sliderHeight = Math.round(sliderWidth * 0.92);

  const sliderRef = useRef(null);
  const zoomScrollRef = useRef(null);
  const [zoomIndex, setZoomIndex] = useState(0);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const { id } = useLocalSearchParams();
  const rawId = Array.isArray(id) ? id[0] : id;
  const cleanId = String(rawId || '').trim();

  // Selected Variant & Gallery States
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('highlights');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Cart & Wishlist hooks
  const { cart, addItem, updateItem, getItemQuantity, isUpdating } = useCart();
  const { token } = useAuth();
  const { isSaved, toggleSave } = useWishlist();
  const [addingLocal, setAddingLocal] = useState(false);

  // 1. Fetch Main Product Details
  const {
    data: product,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['product-details', cleanId],
    enabled: Boolean(cleanId),
    queryFn: async () => {
      const res = await api.get(`/products/${encodeURIComponent(cleanId)}`);
      const data = res.data?.data ?? res.data;
      if (!data?.name) throw new Error('Product is currently unavailable.');
      return data;
    }
  });

  // Extract Category ID for related products
  const categoryId =
    product?.category?._id ||
    (typeof product?.category === 'string' ? product?.category : null);
  const subcategoryId =
    product?.subcategory?._id ||
    (typeof product?.subcategory === 'string' ? product?.subcategory : null);

  // 2. Fetch Related / "You May Also Like" Products
  const { data: relatedProducts = [] } = useQuery({
    queryKey: ['related-products', categoryId, subcategoryId, cleanId],
    enabled: Boolean(categoryId || subcategoryId),
    queryFn: async () => {
      // Use existing similarProducts if provided
      if (product?.similarProducts && product.similarProducts.length > 0) {
        return product.similarProducts.filter((p) => p._id !== cleanId);
      }
      // Otherwise fetch dynamically from subcategory or category
      const params = { limit: 8 };
      if (subcategoryId) params.subcategory = subcategoryId;
      else if (categoryId) params.category = categoryId;
      const res = await api.get('/products', { params });
      const list = res.data?.data ?? res.data;
      if (Array.isArray(list)) {
        return list.filter((p) => p._id !== cleanId);
      }
      return [];
    }
  });

  // Active Variant & Pricing
  const variants = useMemo(
    () => (product?.variants || []).filter((v) => v.isActive !== false),
    [product?.variants]
  );

  const selectedVariant = useMemo(() => {
    if (!variants.length) return null;
    return variants.find((v) => v._id === selectedVariantId) || variants[0];
  }, [variants, selectedVariantId]);

  // Gallery Images Array
  const galleryImages = useMemo(() => {
    const list = [];
    if (selectedVariant?.image) list.push(selectedVariant.image);
    if (product?.featuredImage) list.push(product.featuredImage);
    if (product?.galleryImages && Array.isArray(product.galleryImages)) {
      product.galleryImages.forEach((img) => {
        if (img && !list.includes(img)) list.push(img);
      });
    }
    return list.length > 0
      ? list
      : ['https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=800'];
  }, [product, selectedVariant]);

  // Reset active image on variant change
  useEffect(() => {
    setActiveImageIndex(0);
    sliderRef.current?.scrollTo({ x: 0, animated: false });
  }, [selectedVariantId]);

  useEffect(() => {
    if (isZoomModalOpen) {
      setTimeout(() => {
        zoomScrollRef.current?.scrollTo({ x: zoomIndex * width, animated: false });
      }, 60);
    }
  }, [isZoomModalOpen]);

  // Set initial variant id
  useEffect(() => {
    if (variants.length > 0 && !selectedVariantId) {
      setSelectedVariantId(variants[0]._id);
    }
  }, [variants, selectedVariantId]);

  // Pricing & Stock
  const activePrice = Number(
    selectedVariant?.sellingPrice ?? product?.sellingPrice ?? 0
  );
  const activeMrp = Number(selectedVariant?.mrp ?? product?.mrp ?? 0);
  const activeUnit =
    selectedVariant?.conversionUnit ||
    product?.sellingUnit ||
    product?.baseUnit ||
    'PCS';
  const hasDiscount = activeMrp > activePrice && activePrice > 0;
  const discountPercent = hasDiscount
    ? Math.round(((activeMrp - activePrice) / activeMrp) * 100)
    : 0;

  const currentStock = Number(selectedVariant?.stock ?? product?.stock ?? 0);
  const isOutOfStock =
    Boolean(product?.isTrackInventory) && currentStock <= 0;

  // Cart Quantities for the Selected Item
  const currentVariantId = selectedVariant?._id || null;
  const currentQty = getItemQuantity(cleanId, currentVariantId);

  // Cart Actions for Sticky Bottom Bar
  const handleAddToCart = async () => {
    haptics.selection();
    if (isOutOfStock) return;
    if (!token) {
      Alert.alert(
        'Sign in required',
        'Please sign in to add items to your cart.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/(tabs)/profile') }
        ]
      );
      return;
    }

    setAddingLocal(true);
    try {
      await addItem(cleanId, 1, currentVariantId, activeUnit);
      haptics.notificationSuccess();
    } catch (err) {
      Alert.alert('Cart Error', err.message || 'Could not add item to cart');
    } finally {
      setAddingLocal(false);
    }
  };

  const handleIncrement = async () => {
    haptics.selection();
    if (isOutOfStock || addingLocal) return;
    setAddingLocal(true);
    try {
      const item = cart?.items?.find(
        (i) =>
          (i.product?._id === cleanId || i.product === cleanId) &&
          (currentVariantId
            ? i.variant?._id === currentVariantId || i.variant === currentVariantId
            : !i.variant)
      );
      if (item) {
        await updateItem(item._id, currentQty + 1);
        haptics.impactLight();
      } else {
        await addItem(cleanId, 1, currentVariantId, activeUnit);
      }
    } catch (err) {
      Alert.alert('Cart Error', err.message || 'Could not update quantity');
    } finally {
      setAddingLocal(false);
    }
  };

  const handleDecrement = async () => {
    haptics.selection();
    if (addingLocal) return;
    setAddingLocal(true);
    try {
      const item = cart?.items?.find(
        (i) =>
          (i.product?._id === cleanId || i.product === cleanId) &&
          (currentVariantId
            ? i.variant?._id === currentVariantId || i.variant === currentVariantId
            : !i.variant)
      );
      if (item) {
        await updateItem(item._id, Math.max(0, currentQty - 1));
        haptics.impactLight();
      }
    } catch (err) {
      Alert.alert('Cart Error', err.message || 'Could not update quantity');
    } finally {
      setAddingLocal(false);
    }
  };

  // Share handler
  const handleShare = async () => {
    haptics.selection();
    try {
      await Share.share({
        title: product?.name || 'ZOOOMIT Product',
        message: `Check out ${product?.name} on ZOOOMIT — instant grocery delivery in minutes!`
      });
    } catch (e) {}
  };

  // Wishlist handler
  const isProductSaved = isSaved(cleanId);
  const handleWishlist = () => {
    haptics.impactLight();
    if (!token) {
      Alert.alert('Sign in required', 'Please sign in to save items to your wishlist.');
      return;
    }
    toggleSave(product);
  };

  // Loading State
  if (isLoading) {
    return (
      <View style={[styles.screen, styles.centerScreen]}>
        <ActivityIndicator size="large" color="#FFC928" />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    );
  }

  // Error State
  if (isError || !product) {
    return (
      <View style={[styles.screen, styles.centerScreen]}>
        <ErrorState
          title="Product Not Available"
          message={error?.message || 'We could not load this product. Please check your connection and try again.'}
          onRetry={refetch}
        />
      </View>
    );
  }

  // Highlights extraction
  const highlightsList =
    product.highlights && product.highlights.length > 0
      ? product.highlights
      : [
          { key: 'Fresh Sourced', value: 'Farm fresh & direct' },
          { key: 'Quality Checked', value: 'Graded & hygienic' },
          { key: 'Fast Delivery', value: product.deliveryTime || '10-30 mins' },
          { key: 'Best Value', value: 'Guaranteed best price' }
        ];

  // Description clean text
  const cleanDescription = stripHtml(product.description || product.shortDescription || '');

  // Key Features list
  const keyFeaturesList =
    product.highlights && product.highlights.length > 0
      ? product.highlights.map((h) => `${h.key}: ${h.value}`)
      : [
          'Carefully handpicked and quality graded',
          'Freshly packed under hygienic conditions',
          'Rich in authentic natural taste and nutrients',
          'Delivered straight to your doorstep in minutes'
        ];

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 12) + 110 }
        ]}
      >
        {/* ========================================================== */}
        {/* 1. TOP NAV BAR (BACK, SEARCH, WISHLIST, SHARE)             */}
        {/* ========================================================== */}
        <View style={[styles.topNavBar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.navCircleBtn}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={22} color="#111827" strokeWidth={2.4} />
          </TouchableOpacity>

          <View style={styles.topRightActions}>
            <TouchableOpacity
              style={styles.navCircleBtn}
              onPress={() => router.push('/(tabs)/search')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Search products"
            >
              <Search size={20} color="#111827" strokeWidth={2.2} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navCircleBtn}
              onPress={handleWishlist}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Save to wishlist"
            >
              <Heart
                size={20}
                color={isProductSaved ? '#DC2626' : '#111827'}
                fill={isProductSaved ? '#DC2626' : 'transparent'}
                strokeWidth={2.2}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navCircleBtn}
              onPress={handleShare}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Share product"
            >
              <Share2 size={20} color="#111827" strokeWidth={2.2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ========================================================== */}
        {/* 2. PRODUCT IMAGE GALLERY (SWIPABLE SLIDER - NO BORDER)     */}
        {/* ========================================================== */}
        <View style={styles.galleryWrapper}>
          <View style={[styles.sliderBox, { width: sliderWidth, height: sliderHeight }]}>
            <ScrollView
              ref={sliderRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={sliderWidth}
              snapToAlignment="start"
              onMomentumScrollEnd={(e) => {
                const offsetX = e.nativeEvent.contentOffset.x;
                const idx = Math.round(offsetX / sliderWidth);
                if (idx >= 0 && idx < galleryImages.length) {
                  setActiveImageIndex(idx);
                }
              }}
              style={{ width: sliderWidth, height: sliderHeight }}
            >
              {galleryImages.map((img, idx) => (
                <Pressable
                  key={idx}
                  style={[styles.sliderSlide, { width: sliderWidth, height: sliderHeight }]}
                  onPress={() => {
                    haptics.selection();
                    setZoomIndex(idx);
                    setIsZoomModalOpen(true);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Zoom image ${idx + 1} of ${galleryImages.length}`}
                >
                  <Image
                    source={{ uri: img }}
                    style={styles.heroImage}
                    contentFit="contain"
                    transition={150}
                  />
                </Pressable>
              ))}
            </ScrollView>

            {/* Pagination Badge (e.g. 1/5) */}
            {galleryImages.length > 1 && (
              <View style={styles.paginationBadge} pointerEvents="none">
                <Text style={styles.paginationBadgeText}>
                  {activeImageIndex + 1}/{galleryImages.length}
                </Text>
              </View>
            )}
          </View>

          {/* Dots Indicator below Slider */}
          {galleryImages.length > 1 && (
            <View style={styles.dotsRow}>
              {galleryImages.map((_, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.dot,
                    idx === activeImageIndex ? styles.dotActive : styles.dotInactive
                  ]}
                  onPress={() => {
                    haptics.selection();
                    setActiveImageIndex(idx);
                    sliderRef.current?.scrollTo({ x: idx * sliderWidth, animated: true });
                  }}
                  hitSlop={6}
                />
              ))}
            </View>
          )}
        </View>

        {/* ========================================================== */}
        {/* 3. DYNAMIC PRODUCT TITLE, SUBTITLE & PRICING               */}
        {/* ========================================================== */}
        <View style={styles.infoSection}>
          {Boolean(product.brand) && (
            <Text style={styles.brandTag}>{product.brand.toUpperCase()}</Text>
          )}

          <Text style={styles.productTitle}>{product.name}</Text>

          {Boolean(product.subtitle || product.shortDescription) && (
            <Text style={styles.productSubtitle}>
              {product.subtitle || product.shortDescription}
            </Text>
          )}

          {/* Price Block */}
          <View style={styles.priceContainer}>
            <View style={styles.priceRow}>
              <Text style={styles.sellingPriceText}>₹{activePrice}</Text>

              {hasDiscount && (
                <Text style={styles.mrpStrikeText}>₹{activeMrp}</Text>
              )}

              {hasDiscount && (
                <View style={styles.discountPill}>
                  <Text style={styles.discountPillText}>{discountPercent}% OFF</Text>
                </View>
              )}
            </View>

            <Text style={styles.taxSubtext}>Inclusive of all taxes</Text>

            {/* Stock indicator */}
            {isOutOfStock ? (
              <View style={styles.stockNoticeBox}>
                <AlertCircle size={14} color="#DC2626" />
                <Text style={styles.outOfStockNotice}>Out of Stock</Text>
              </View>
            ) : currentStock <= 10 && currentStock > 0 ? (
              <View style={styles.stockNoticeBox}>
                <Clock size={14} color="#D97706" />
                <Text style={styles.lowStockNotice}>Only {currentStock} left in stock</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ========================================================== */}
        {/* 4. DYNAMIC VARIATIONS & PACK SIZES                         */}
        {/* ========================================================== */}
        {variants.length > 0 && (
          <View style={styles.variantsSection}>
            <Text style={styles.sectionHeading}>Select Pack Size</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.variantsScrollContent}
            >
              {variants.map((v) => {
                const isSelected = selectedVariant?._id === v._id;
                const vPrice = Number(v.sellingPrice || product.sellingPrice || 0);

                return (
                  <TouchableOpacity
                    key={v._id}
                    style={[
                      styles.variantCard,
                      isSelected ? styles.variantCardSelected : styles.variantCardUnselected
                    ]}
                    onPress={() => {
                      haptics.selection();
                      setSelectedVariantId(v._id);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.variantNameText,
                        isSelected && styles.variantNameSelected
                      ]}
                      numberOfLines={1}
                    >
                      {v.name}
                    </Text>
                    <Text style={styles.variantPriceText}>₹{vPrice}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ========================================================== */}
        {/* 5. THREE KEY TRUST BADGES                                  */}
        {/* ========================================================== */}
        <View style={styles.trustBadgesRow}>
          <View style={styles.trustCard}>
            <Truck size={20} color="#111827" strokeWidth={2.2} />
            <Text style={styles.trustTitle}>Free delivery</Text>
            <Text style={styles.trustSub}>
              {product.deliveryTime ? `In ${product.deliveryTime}` : 'Usually in 10-30 mins'}
            </Text>
          </View>

          <View style={styles.trustCard}>
            <ShieldCheck size={20} color="#111827" strokeWidth={2.2} />
            <Text style={styles.trustTitle}>Secure</Text>
            <Text style={styles.trustSub}>Packaging</Text>
          </View>

          <View style={styles.trustCard}>
            <RotateCcw size={20} color="#111827" strokeWidth={2.2} />
            <Text style={styles.trustTitle}>7 Days</Text>
            <Text style={styles.trustSub}>Easy Return</Text>
          </View>
        </View>

        {/* Section Separator */}
        <View style={styles.sectionDivider} />

        {/* ========================================================== */}
        {/* 6. PRODUCT INFORMATION TABS                                */}
        {/* ========================================================== */}
        <View style={styles.tabsSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsNavRow}
          >
            {[
              { key: 'highlights', label: 'Highlights' },
              { key: 'description', label: 'Description' },
              { key: 'features', label: 'Key Features' },
              { key: 'specifications', label: 'Specifications' }
            ].map((t) => {
              const active = activeTab === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.tabButton, active && styles.tabButtonActive]}
                  onPress={() => {
                    haptics.selection();
                    setActiveTab(t.key);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* TAB 1: HIGHLIGHTS */}
          {activeTab === 'highlights' && (
            <View style={styles.tabContentBox}>
              {/* 4 Feature Icon Tiles */}
              <View style={styles.featureTilesGrid}>
                {highlightsList.slice(0, 4).map((h, i) => (
                  <View key={i} style={styles.featureTile}>
                    <View style={styles.featureIconWrap}>
                      {i === 0 ? (
                        <Sparkles size={20} color="#E5A900" />
                      ) : i === 1 ? (
                        <ShieldCheck size={20} color="#E5A900" />
                      ) : i === 2 ? (
                        <Leaf size={20} color="#E5A900" />
                      ) : (
                        <Tag size={20} color="#E5A900" />
                      )}
                    </View>
                    <Text style={styles.featureTileKey} numberOfLines={2}>
                      {h.key}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Product Details Subsection */}
              <View style={styles.detailsSubBox}>
                <Text style={styles.subBoxTitle}>Product Details</Text>
                <Text
                  style={styles.detailsBodyText}
                  numberOfLines={isDescriptionExpanded ? undefined : 3}
                >
                  {cleanDescription ||
                    'Fresh premium quality product sourced under stringent hygiene standards. Perfect for daily culinary and household use.'}
                </Text>
                {cleanDescription.length > 120 && (
                  <TouchableOpacity
                    style={styles.readMoreBtn}
                    onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  >
                    <Text style={styles.readMoreText}>
                      {isDescriptionExpanded ? 'Read Less' : 'Read More'}
                    </Text>
                    {isDescriptionExpanded ? (
                      <ChevronUp size={16} color="#111827" />
                    ) : (
                      <ChevronDown size={16} color="#111827" />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* TAB 2: DESCRIPTION */}
          {activeTab === 'description' && (
            <View style={styles.tabContentBox}>
              <Text style={styles.fullDescriptionText}>
                {cleanDescription || 'High quality item carefully sourced and packaged for freshness.'}
              </Text>

              {/* Spec Summary Table */}
              <View style={styles.specSummaryTable}>
                {Boolean(product.brand) && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Brand</Text>
                    <Text style={styles.summaryValue}>{product.brand}</Text>
                  </View>
                )}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Category</Text>
                  <Text style={styles.summaryValue}>{product.category?.name || 'Groceries'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Pack Size</Text>
                  <Text style={styles.summaryValue}>
                    {selectedVariant?.name || product.sellingUnit || product.baseUnit || 'Standard'}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Delivery</Text>
                  <Text style={styles.summaryValue}>{product.deliveryTime || '10-30 mins'}</Text>
                </View>
              </View>
            </View>
          )}

          {/* TAB 3: KEY FEATURES */}
          {activeTab === 'features' && (
            <View style={styles.tabContentBox}>
              <Text style={styles.subBoxTitle}>Key Features</Text>
              <View style={styles.featuresList}>
                {keyFeaturesList.map((f, i) => (
                  <View key={i} style={styles.featureItemRow}>
                    <View style={styles.featureCheckCircle}>
                      <Check size={13} color="#FFFFFF" strokeWidth={3} />
                    </View>
                    <Text style={styles.featureItemText}>{f}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* TAB 4: SPECIFICATIONS */}
          {activeTab === 'specifications' && (
            <View style={styles.tabContentBox}>
              <Text style={styles.subBoxTitle}>Specifications</Text>
              <View style={styles.specsTable}>
                {Boolean(product.brand) && (
                  <View style={styles.specTableRow}>
                    <Text style={styles.specKey}>Brand</Text>
                    <Text style={styles.specVal}>{product.brand}</Text>
                  </View>
                )}
                <View style={styles.specTableRow}>
                  <Text style={styles.specKey}>Category</Text>
                  <Text style={styles.specVal}>{product.category?.name || 'Fresh Grocery'}</Text>
                </View>
                {Boolean(product.subcategory?.name) && (
                  <View style={styles.specTableRow}>
                    <Text style={styles.specKey}>Subcategory</Text>
                    <Text style={styles.specVal}>{product.subcategory.name}</Text>
                  </View>
                )}
                <View style={styles.specTableRow}>
                  <Text style={styles.specKey}>Net Quantity</Text>
                  <Text style={styles.specVal}>
                    {selectedVariant?.name || product.sellingUnit || product.baseUnit}
                  </Text>
                </View>
                <View style={styles.specTableRow}>
                  <Text style={styles.specKey}>Dietary Type</Text>
                  <Text style={styles.specVal}>
                    {product.isVeg ? 'Vegetarian (100% Veg)' : 'Non-Vegetarian'}
                  </Text>
                </View>
                <View style={styles.specTableRow}>
                  <Text style={styles.specKey}>Country of Origin</Text>
                  <Text style={styles.specVal}>{product.countryOfOrigin || 'India'}</Text>
                </View>
                {Boolean(product.sellerDetails?.fssaiNumber) && (
                  <View style={styles.specTableRow}>
                    <Text style={styles.specKey}>FSSAI License No.</Text>
                    <Text style={styles.specVal}>{product.sellerDetails.fssaiNumber}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Section Separator */}
        <View style={styles.sectionDivider} />

        {/* ========================================================== */}
        {/* 7. ADDITIONAL DYNAMIC SECTIONS (CONDITIONAL)               */}
        {/* ========================================================== */}

        {/* What's in the Box */}
        {Boolean(product.packagingDetails || selectedVariant?.name) && (
          <View style={styles.additionalSection}>
            <Text style={styles.sectionHeading}>What's in the Box</Text>
            <View style={styles.boxCard}>
              <Box size={20} color="#111827" strokeWidth={2} />
              <View style={{ flex: 1 }}>
                <Text style={styles.boxItemTitle}>
                  1 × {product.name} ({selectedVariant?.name || product.sellingUnit || 'Standard'})
                </Text>
                <Text style={styles.boxItemSub}>Original tamper-proof sealed pack</Text>
              </View>
            </View>
          </View>
        )}

        {/* Care & Storage Instructions (if available) */}
        {Boolean(product.storageInfo) && (
          <View style={styles.additionalSection}>
            <Text style={styles.sectionHeading}>Care & Storage Instructions</Text>
            <View style={styles.careCard}>
              <View style={styles.careRow}>
                <ThermometerSnowflake size={18} color="#2563EB" />
                <Text style={styles.careText}>{product.storageInfo}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Delivery & Support (4 Clean Feature Tiles) */}
        <View style={styles.additionalSection}>
          <Text style={styles.sectionHeading}>Delivery & Support</Text>
          <View style={styles.supportGrid}>
            <View style={styles.supportTile}>
              <Truck size={20} color="#111827" strokeWidth={2.2} />
              <Text style={styles.supportTileTitle}>
                {product.deliveryTime || '10-30 mins'}
              </Text>
              <Text style={styles.supportTileSub}>Delivery</Text>
            </View>

            <View style={styles.supportTile}>
              <Headphones size={20} color="#111827" strokeWidth={2.2} />
              <Text style={styles.supportTileTitle}>24/7</Text>
              <Text style={styles.supportTileSub}>Support</Text>
            </View>

            <View style={styles.supportTile}>
              <Package size={20} color="#111827" strokeWidth={2.2} />
              <Text style={styles.supportTileTitle}>Properly</Text>
              <Text style={styles.supportTileSub}>Packed</Text>
            </View>

            <View style={styles.supportTile}>
              <RotateCcw size={20} color="#111827" strokeWidth={2.2} />
              <Text style={styles.supportTileTitle}>Easy</Text>
              <Text style={styles.supportTileSub}>Returns</Text>
            </View>
          </View>
        </View>

        {/* Section Separator */}
        <View style={styles.sectionDivider} />

        {/* ========================================================== */}
        {/* 8. YOU MAY ALSO LIKE (RELATED PRODUCTS)                    */}
        {/* ========================================================== */}
        {relatedProducts.length > 0 && (
          <View style={styles.relatedSection}>
            <View style={styles.relatedHeader}>
              <Text style={styles.relatedTitle}>You May Also Like</Text>
              {categoryId && (
                <TouchableOpacity
                  onPress={() => router.push(`/category/${categoryId}`)}
                  hitSlop={8}
                >
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relatedScrollContent}
            >
              {relatedProducts.map((rel) => {
                const relPrice = Number(rel.sellingPrice || 0);
                const relMrp = Number(rel.mrp || 0);
                const relDiscount =
                  relMrp > relPrice && relPrice > 0
                    ? Math.round(((relMrp - relPrice) / relMrp) * 100)
                    : 0;

                const relUnit =
                  rel.variants?.[0]?.name ||
                  rel.sellingUnit ||
                  rel.baseUnit ||
                  '1 pc';

                return (
                  <Pressable
                    key={rel._id}
                    style={styles.relatedCard}
                    onPress={() => {
                      haptics.selection();
                      router.push(`/product/${rel._id}`);
                    }}
                  >
                    <View style={styles.relImageContainer}>
                      <Image
                        source={{ uri: rel.featuredImage || rel.galleryImages?.[0] }}
                        style={styles.relImage}
                        contentFit="contain"
                      />
                    </View>

                    <Text style={styles.relName} numberOfLines={2}>
                      {rel.name}
                    </Text>

                    <Text style={styles.relUnit} numberOfLines={1}>
                      {relUnit}
                    </Text>

                    <View style={styles.relPriceRow}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text style={styles.relPrice}>₹{relPrice}</Text>
                          {relMrp > relPrice && (
                            <Text style={styles.relMrp}>₹{relMrp}</Text>
                          )}
                        </View>
                        {relDiscount > 0 && (
                          <Text style={styles.relDiscount}>{relDiscount}% OFF</Text>
                        )}
                      </View>

                      {/* Small Yellow Add Button on Related Card */}
                      <TouchableOpacity
                        style={styles.relAddBtn}
                        onPress={async (e) => {
                          e.stopPropagation();
                          haptics.selection();
                          if (!token) {
                            Alert.alert('Sign in required', 'Please sign in to add items.');
                            return;
                          }
                          try {
                            await addItem(rel._id, 1, rel.variants?.[0]?._id || null, relUnit);
                            haptics.notificationSuccess();
                          } catch (err) {
                            Alert.alert('Error', err.message || 'Could not add to cart');
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        <Plus size={16} color="#111827" strokeWidth={3} />
                      </TouchableOpacity>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* ========================================================== */}
      {/* 9. STICKY FIXED BOTTOM PURCHASE BAR (THE ONLY ADD BUTTON)  */}
      {/* ========================================================== */}
      <View
        style={[
          styles.stickyBottomBar,
          { paddingBottom: Math.max(insets.bottom, 12) }
        ]}
      >
        {/* Left Column: Price, MRP, Discount */}
        <View style={styles.bottomPriceCol}>
          <View style={styles.bottomPriceLine}>
            <Text style={styles.bottomPriceText}>₹{activePrice}</Text>
            {hasDiscount && (
              <Text style={styles.bottomMrpText}>₹{activeMrp}</Text>
            )}
          </View>

          {hasDiscount ? (
            <Text style={styles.bottomDiscountText}>{discountPercent}% OFF</Text>
          ) : (
            <Text style={styles.bottomTaxSub}>Inclusive of taxes</Text>
          )}
        </View>

        {/* Right Column: Only ONE Add To Cart Button / Quantity Stepper */}
        <View style={styles.bottomActionCol}>
          {isOutOfStock ? (
            <View style={styles.outOfStockBtn}>
              <Text style={styles.outOfStockBtnText}>Out of Stock</Text>
            </View>
          ) : currentQty > 0 ? (
            /* Quantity Stepper (Minus, Qty, Plus) */
            <View style={styles.stepperBox}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={handleDecrement}
                disabled={addingLocal}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Decrease quantity"
              >
                <Minus size={18} color="#111827" strokeWidth={2.6} />
              </TouchableOpacity>

              <View style={styles.stepperQtyWrap}>
                {addingLocal ? (
                  <ActivityIndicator size="small" color="#111827" />
                ) : (
                  <Text style={styles.stepperQtyText}>{currentQty}</Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={handleIncrement}
                disabled={addingLocal || (currentStock > 0 && currentQty >= currentStock)}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Increase quantity"
              >
                <Plus size={18} color="#111827" strokeWidth={2.6} />
              </TouchableOpacity>
            </View>
          ) : (
            /* Single Add To Cart Button */
            <TouchableOpacity
              style={[styles.addToCartBtn, addingLocal && { opacity: 0.85 }]}
              onPress={handleAddToCart}
              disabled={addingLocal}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Add to cart"
            >
              {addingLocal ? (
                <ActivityIndicator size="small" color="#111827" />
              ) : (
                <>
                  <ShoppingCart size={18} color="#111827" strokeWidth={2.4} />
                  <Text style={styles.addToCartText}>Add to Cart</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ========================================================== */}
      {/* FULL SCREEN ZOOM IMAGE VIEWER MODAL                        */}
      {/* ========================================================== */}
      <Modal
        visible={isZoomModalOpen}
        transparent={false}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setIsZoomModalOpen(false)}
      >
        <View style={styles.zoomModalRoot}>
          {/* Header Bar */}
          <View style={[styles.zoomHeader, { paddingTop: Math.max(insets.top, 16) }]}>
            <TouchableOpacity
              style={styles.zoomCloseBtn}
              onPress={() => {
                haptics.selection();
                setIsZoomModalOpen(false);
              }}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close image viewer"
            >
              <X size={24} color="#FFFFFF" strokeWidth={2.4} />
            </TouchableOpacity>

            <View style={styles.zoomCounterBadge}>
              <Text style={styles.zoomCounterText}>
                {zoomIndex + 1} / {galleryImages.length}
              </Text>
            </View>

            <View style={{ width: 40 }} />
          </View>

          {/* Zoomable Image Swiper */}
          <ScrollView
            ref={zoomScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={width}
            onMomentumScrollEnd={(e) => {
              const offsetX = e.nativeEvent.contentOffset.x;
              const idx = Math.round(offsetX / width);
              if (idx >= 0 && idx < galleryImages.length) {
                setZoomIndex(idx);
              }
            }}
            style={styles.zoomScrollView}
          >
            {galleryImages.map((img, idx) => (
              <ZoomableSlide
                key={idx}
                imageUri={img}
                width={width}
                height={height}
              />
            ))}
          </ScrollView>

          {/* Bottom Thumbnails Strip */}
          <View style={[styles.zoomBottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Text style={styles.zoomHintText}>Double tap to zoom in / out</Text>

            {galleryImages.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.zoomThumbnailsRow}
              >
                {galleryImages.map((img, idx) => {
                  const isActive = idx === zoomIndex;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.zoomThumbCard,
                        isActive && styles.zoomThumbCardActive
                      ]}
                      onPress={() => {
                        haptics.selection();
                        setZoomIndex(idx);
                        zoomScrollRef.current?.scrollTo({ x: idx * width, animated: true });
                      }}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={{ uri: img }}
                        style={styles.zoomThumbImg}
                        contentFit="contain"
                      />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const F = typography.family;

function ZoomableSlide({ imageUri, width, height }) {
  const [scale, setScale] = useState(1);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const lastTap = useRef(0);

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      haptics.selection();
      const nextScale = scale > 1.2 ? 1 : 2.5;
      setScale(nextScale);
      Animated.spring(scaleAnim, {
        toValue: nextScale,
        friction: 6,
        tension: 40,
        useNativeDriver: true
      }).start();
    }
    lastTap.current = now;
  };

  return (
    <View style={[styles.zoomSlideContainer, { width, height: height * 0.72 }]}>
      <ScrollView
        maximumZoomScale={Platform.OS === 'ios' ? 4 : 1}
        minimumZoomScale={1}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.zoomScrollContent}
        centerContent
      >
        <Pressable onPress={handleDoubleTap} style={styles.zoomPressable}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Image
              source={{ uri: imageUri }}
              style={{ width: width * 0.94, height: height * 0.65 }}
              contentFit="contain"
              transition={150}
            />
          </Animated.View>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  centerScreen: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: F.medium,
    color: '#6B7280'
  },
  scrollContent: {
    paddingTop: 0
  },

  // 1. Top Nav Bar
  topNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    zIndex: 10
  },
  navCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },

  // 2. Gallery (Slider without borders)
  galleryWrapper: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    alignItems: 'center'
  },
  sliderBox: {
    borderRadius: 20,
    backgroundColor: '#FAFAFA',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 0,
    borderColor: 'transparent'
  },
  sliderSlide: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA'
  },
  heroImage: {
    width: '92%',
    height: '92%'
  },
  paginationBadge: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    backgroundColor: 'rgba(17, 24, 39, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  paginationBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: F.bold,
    letterSpacing: 0.5
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12
  },
  dot: {
    height: 6,
    borderRadius: 3
  },
  dotActive: {
    width: 18,
    backgroundColor: '#FFC928'
  },
  dotInactive: {
    width: 6,
    backgroundColor: '#E5E7EB'
  },

  // 3. Product Info
  infoSection: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 14
  },
  brandTag: {
    fontSize: 11.5,
    fontFamily: F.bold,
    color: '#D97706',
    letterSpacing: 0.8,
    marginBottom: 4
  },
  productTitle: {
    fontSize: 18,
    fontFamily: F.bold,
    color: '#111827',
    lineHeight: 24
  },
  productSubtitle: {
    fontSize: 13,
    fontFamily: F.regular,
    color: '#667085',
    marginTop: 4,
    lineHeight: 18
  },
  priceContainer: {
    marginTop: 12
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  sellingPriceText: {
    fontSize: 26,
    fontFamily: F.bold,
    color: '#111827'
  },
  mrpStrikeText: {
    fontSize: 15,
    fontFamily: F.regular,
    color: '#9CA3AF',
    textDecorationLine: 'line-through'
  },
  discountPill: {
    backgroundColor: '#FEF08A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  discountPillText: {
    fontSize: 11.5,
    fontFamily: F.bold,
    color: '#854D0E',
    letterSpacing: 0.3
  },
  taxSubtext: {
    fontSize: 12,
    fontFamily: F.regular,
    color: '#9CA3AF',
    marginTop: 3
  },
  stockNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6
  },
  outOfStockNotice: {
    fontSize: 12.5,
    fontFamily: F.bold,
    color: '#DC2626'
  },
  lowStockNotice: {
    fontSize: 12.5,
    fontFamily: F.bold,
    color: '#D97706'
  },

  // 4. Variations
  variantsSection: {
    paddingTop: 4,
    paddingBottom: 14
  },
  sectionHeading: {
    fontSize: 15,
    fontFamily: F.bold,
    color: '#111827',
    paddingHorizontal: 16,
    marginBottom: 10
  },
  variantsScrollContent: {
    paddingHorizontal: 16,
    gap: 10
  },
  variantCard: {
    minWidth: 96,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  variantCardSelected: {
    borderWidth: 1.5,
    borderColor: '#FFC928',
    backgroundColor: '#FEFCE8'
  },
  variantCardUnselected: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF'
  },
  variantNameText: {
    fontSize: 13.5,
    fontFamily: F.bold,
    color: '#374151'
  },
  variantNameSelected: {
    color: '#111827'
  },
  variantPriceText: {
    fontSize: 12,
    fontFamily: F.medium,
    color: '#6B7280',
    marginTop: 2
  },

  // 5. Trust Badges
  trustBadgesRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  trustCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF'
  },
  trustTitle: {
    fontSize: 12,
    fontFamily: F.bold,
    color: '#111827',
    marginTop: 6,
    textAlign: 'center'
  },
  trustSub: {
    fontSize: 10.5,
    fontFamily: F.regular,
    color: '#6B7280',
    marginTop: 1,
    textAlign: 'center'
  },

  // Separator
  sectionDivider: {
    height: 8,
    backgroundColor: '#F8FAFC',
    marginVertical: 12
  },

  // 6. Tabs Section
  tabsSection: {
    paddingHorizontal: 16,
    paddingTop: 4
  },
  tabsNavRow: {
    flexDirection: 'row',
    gap: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 2
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 2,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent'
  },
  tabButtonActive: {
    borderBottomColor: '#FFC928'
  },
  tabButtonText: {
    fontSize: 13.5,
    fontFamily: F.medium,
    color: '#6B7280'
  },
  tabButtonTextActive: {
    fontFamily: F.bold,
    color: '#111827'
  },
  tabContentBox: {
    paddingTop: 16
  },

  // Highlights Tab
  featureTilesGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16
  },
  featureTile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    backgroundColor: '#FFFDF5'
  },
  featureIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6
  },
  featureTileKey: {
    fontSize: 11,
    fontFamily: F.bold,
    color: '#111827',
    textAlign: 'center',
    lineHeight: 14
  },
  detailsSubBox: {
    paddingTop: 4
  },
  subBoxTitle: {
    fontSize: 15,
    fontFamily: F.bold,
    color: '#111827',
    marginBottom: 8
  },
  detailsBodyText: {
    fontSize: 13.5,
    fontFamily: F.regular,
    color: '#4B5563',
    lineHeight: 20
  },
  readMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8
  },
  readMoreText: {
    fontSize: 13,
    fontFamily: F.bold,
    color: '#111827'
  },

  // Description Tab
  fullDescriptionText: {
    fontSize: 13.5,
    fontFamily: F.regular,
    color: '#374151',
    lineHeight: 21,
    marginBottom: 16
  },
  specSummaryTable: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    overflow: 'hidden'
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  summaryLabel: {
    fontSize: 13,
    fontFamily: F.medium,
    color: '#6B7280'
  },
  summaryValue: {
    fontSize: 13,
    fontFamily: F.bold,
    color: '#111827'
  },

  // Key Features Tab
  featuresList: {
    gap: 10
  },
  featureItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  featureCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFC928',
    alignItems: 'center',
    justifyContent: 'center'
  },
  featureItemText: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: F.medium,
    color: '#374151',
    lineHeight: 19
  },

  // Specifications Tab
  specsTable: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    overflow: 'hidden'
  },
  specTableRow: {
    flexDirection: 'row',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  specKey: {
    width: '40%',
    fontSize: 13,
    fontFamily: F.medium,
    color: '#6B7280'
  },
  specVal: {
    width: '60%',
    fontSize: 13,
    fontFamily: F.bold,
    color: '#111827'
  },

  // 7. Additional Sections
  additionalSection: {
    paddingHorizontal: 16,
    paddingVertical: 6
  },
  boxCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 13,
    backgroundColor: '#FAFAFA'
  },
  boxItemTitle: {
    fontSize: 13.5,
    fontFamily: F.bold,
    color: '#111827'
  },
  boxItemSub: {
    fontSize: 12,
    fontFamily: F.regular,
    color: '#6B7280',
    marginTop: 1
  },
  careCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 13,
    backgroundColor: '#FAFAFA'
  },
  careRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  careText: {
    flex: 1,
    fontSize: 13,
    fontFamily: F.medium,
    color: '#374151',
    lineHeight: 19
  },
  supportGrid: {
    flexDirection: 'row',
    gap: 10
  },
  supportTile: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF'
  },
  supportTileTitle: {
    fontSize: 12,
    fontFamily: F.bold,
    color: '#111827',
    marginTop: 6,
    textAlign: 'center'
  },
  supportTileSub: {
    fontSize: 10.5,
    fontFamily: F.regular,
    color: '#6B7280',
    marginTop: 1,
    textAlign: 'center'
  },

  // 8. Related Products
  relatedSection: {
    paddingVertical: 8
  },
  relatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12
  },
  relatedTitle: {
    fontSize: 16,
    fontFamily: F.bold,
    color: '#111827'
  },
  viewAllText: {
    fontSize: 13,
    fontFamily: F.bold,
    color: '#D97706'
  },
  relatedScrollContent: {
    paddingHorizontal: 16,
    gap: 12
  },
  relatedCard: {
    width: 140,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 10,
    backgroundColor: '#FFFFFF'
  },
  relImageContainer: {
    width: '100%',
    height: 105,
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  relImage: {
    width: '85%',
    height: '85%'
  },
  relName: {
    fontSize: 12.5,
    fontFamily: F.bold,
    color: '#111827',
    lineHeight: 16,
    height: 32
  },
  relUnit: {
    fontSize: 11,
    fontFamily: F.regular,
    color: '#6B7280',
    marginTop: 2,
    marginBottom: 6
  },
  relPriceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between'
  },
  relPrice: {
    fontSize: 14,
    fontFamily: F.bold,
    color: '#111827'
  },
  relMrp: {
    fontSize: 11,
    fontFamily: F.regular,
    color: '#9CA3AF',
    textDecorationLine: 'line-through'
  },
  relDiscount: {
    fontSize: 10,
    fontFamily: F.bold,
    color: '#16A34A',
    marginTop: 1
  },
  relAddBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFC928',
    alignItems: 'center',
    justifyContent: 'center'
  },

  // 9. Sticky Bottom Bar
  stickyBottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 100
  },
  bottomPriceCol: {
    flex: 1
  },
  bottomPriceLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  bottomPriceText: {
    fontSize: 22,
    fontFamily: F.bold,
    color: '#111827'
  },
  bottomMrpText: {
    fontSize: 14,
    fontFamily: F.regular,
    color: '#9CA3AF',
    textDecorationLine: 'line-through'
  },
  bottomDiscountText: {
    fontSize: 12,
    fontFamily: F.bold,
    color: '#16A34A',
    marginTop: 1
  },
  bottomTaxSub: {
    fontSize: 11,
    fontFamily: F.regular,
    color: '#9CA3AF',
    marginTop: 1
  },
  bottomActionCol: {
    marginLeft: 14
  },
  addToCartBtn: {
    height: 48,
    minWidth: 160,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: '#FFC928',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  addToCartText: {
    fontSize: 14.5,
    fontFamily: F.bold,
    color: '#111827'
  },
  stepperBox: {
    height: 48,
    minWidth: 150,
    borderRadius: 14,
    backgroundColor: '#FFC928',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6
  },
  stepperBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepperQtyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepperQtyText: {
    fontSize: 15,
    fontFamily: F.bold,
    color: '#111827'
  },
  outOfStockBtn: {
    height: 48,
    minWidth: 150,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  outOfStockBtnText: {
    fontSize: 13.5,
    fontFamily: F.bold,
    color: '#9CA3AF'
  },
  // Zoom Modal Styles
  zoomModalRoot: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    justifyContent: 'space-between'
  },
  zoomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
    zIndex: 10
  },
  zoomCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  zoomCounterBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16
  },
  zoomCounterText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: F.bold
  },
  zoomScrollView: {
    flex: 1
  },
  zoomSlideContainer: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  zoomScrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  zoomPressable: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  zoomBottomBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    alignItems: 'center'
  },
  zoomHintText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontFamily: F.medium,
    marginBottom: 12
  },
  zoomThumbnailsRow: {
    gap: 10,
    paddingHorizontal: 4,
    paddingBottom: 4
  },
  zoomThumbCard: {
    width: 52,
    height: 52,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center'
  },
  zoomThumbCardActive: {
    borderColor: '#FEDC4A',
    backgroundColor: 'rgba(254, 220, 74, 0.2)'
  },
  zoomThumbImg: {
    width: '100%',
    height: '100%'
  },
});