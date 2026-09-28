import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  ScrollView,
  Dimensions
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Zap, Plus, Star } from 'lucide-react-native';
import { colors, typography } from '../../constants/theme';
import { ProductSaveButton } from './ProductSaveButton';
import { ProductPrice } from './ProductPrice';
import { useCart } from '../../context/CartContext';
import { haptics } from '../../services/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const INITIAL_CARD_WIDTH = Math.max(130, Math.floor(((SCREEN_WIDTH - 78 - 32) / 2) - 16));

export const ProductCard = ({ product, onPress, compact = false }) => {
  const { getItemQuantity, addItem, updateItem, cart } = useCart();
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [cardWidth, setCardWidth] = useState(INITIAL_CARD_WIDTH);

  if (!product) return null;

  const variants = product.variants || [];
  const currentVariant = variants[selectedVariantIndex] || null;

  const activePrice = currentVariant?.sellingPrice || product.sellingPrice || 0;
  const activeMrp = currentVariant?.mrp || product.mrp || 0;
  const activeUnit = currentVariant?.conversionUnit || product.sellingUnit || product.baseUnit || 'PCS';
  const activeVariantId = currentVariant?._id || null;

  const isOutOfStock = product.isTrackInventory && (product.stock || 0) <= 0;
  const currentQty = getItemQuantity(product._id, activeVariantId);
  const minQty = product.minSaleQty || 1;
  const step = product.qtyStep || 1;

  const handleCardPress = () => {
    haptics.selection();
    if (onPress) {
      onPress(product);
    } else {
      router.push(`/product/${product._id}`);
    }
  };

  const handleAddPress = (e) => {
    e?.stopPropagation?.();
    haptics.medium();
    if (onPress) {
      onPress(product);
    } else {
      addItem(product._id, minQty, activeVariantId, activeUnit);
    }
  };

  const handleIncrement = (e) => {
    e?.stopPropagation?.();
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

  const handleDecrement = (e) => {
    e?.stopPropagation?.();
    haptics.selection();
    const cartItem = cart?.items?.find(
      i => i.product?._id === product._id && (activeVariantId ? i.variant?._id === activeVariantId : !i.variant)
    );
    if (cartItem) {
      const nextQty = Math.round((currentQty - step) * 1000) / 1000;
      updateItem(cartItem._id, nextQty < minQty ? 0 : nextQty);
    }
  };

  const images = (product.galleryImages && product.galleryImages.length > 0)
    ? product.galleryImages
    : [product.featuredImage || 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600'];

  return (
    <Pressable
      onPress={handleCardPress}
      style={({ pressed }) => [
        styles.card,
        compact && styles.cardCompact,
        pressed && styles.cardPressed
      ]}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${product.name}`}
    >
      {/* 1. Image Container with Horizontal Slider */}
      <View 
        style={styles.imageContainer}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && Math.abs(w - cardWidth) > 2) {
            setCardWidth(w);
          }
        }}
      >
        <ScrollView
          horizontal
          pagingEnabled
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(e) => {
            const w = e.nativeEvent.layoutMeasurement.width || cardWidth;
            if (w > 0) {
              const idx = Math.round(e.nativeEvent.contentOffset.x / w);
              if (idx !== activeImgIndex && idx >= 0 && idx < images.length) {
                setActiveImgIndex(idx);
              }
            }
          }}
          style={styles.imageScroll}
        >
          {images.map((imgUri, idx) => (
            <Pressable 
              key={idx} 
              onPress={handleCardPress}
              style={[styles.imageSlide, { width: cardWidth }]}
            >
              <Image
                source={{ uri: imgUri }}
                style={styles.image}
                contentFit="cover"
                transition={150}
              />
            </Pressable>
          ))}
        </ScrollView>

        {/* Wishlist / Save Button top right */}
        <View style={styles.saveBtnWrap}>
          <ProductSaveButton product={product} size={16} variant="card" />
        </View>

        {/* Veg Symbol bottom left */}
        <View style={styles.vegBadge}>
          <View style={styles.vegSquare}>
            <View style={styles.vegCircle} />
          </View>
        </View>

        {/* Multi-image pagination dots bottom center */}
        {images.length > 1 && (
          <View style={styles.paginationDots}>
            {images.slice(0, 4).map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  idx === activeImgIndex ? styles.dotActive : styles.dotInactive
                ]}
              />
            ))}
          </View>
        )}

        {/* Plus / Stepper button on bottom right of the image (Screenshot 1) */}
        <View style={styles.actionBtnWrap}>
          {currentQty > 0 ? (
            <View style={styles.stepperPill}>
              <Pressable onPress={handleDecrement} style={styles.stepperSubBtn} hitSlop={4}>
                <Text style={styles.stepperSubText}>−</Text>
              </Pressable>
              <Text style={styles.stepperQtyText}>{currentQty}</Text>
              <Pressable onPress={handleIncrement} style={styles.stepperSubBtn} hitSlop={4}>
                <Text style={styles.stepperSubText}>+</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={handleAddPress}
              style={({ pressed }) => [
                styles.plusSquareBtn,
                pressed && styles.plusSquareBtnPressed
              ]}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Plus size={19} color="#0066FF" strokeWidth={2.6} />
            </Pressable>
          )}
        </View>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Out of stock</Text>
          </View>
        )}
      </View>

      {/* 2. Variant Pills Row (e.g. 1 kg, 3 kg, 3x1kg) */}
      {variants.length > 0 && (
        <View style={styles.variantsRow}>
          {variants.slice(0, 3).map((v, idx) => {
            const isSelected = idx === selectedVariantIndex;
            return (
              <Pressable
                key={v._id || idx}
                onPress={(e) => {
                  e.stopPropagation();
                  haptics.selection();
                  setSelectedVariantIndex(idx);
                }}
                style={[
                  styles.variantPill,
                  isSelected ? styles.variantPillSelected : styles.variantPillUnselected
                ]}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Text
                  style={[
                    styles.variantPillText,
                    isSelected && styles.variantPillTextSelected
                  ]}
                  numberOfLines={1}
                >
                  {v.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* 3. Pricing block */}
      <ProductPrice
        price={activePrice}
        mrp={activeMrp}
        unit={activeUnit}
        conversionFactor={currentVariant?.conversionFactor || 1}
        showDiscount={true}
        showUnitRate={true}
        size="md"
      />

      {/* 4. Product Title */}
      <Text style={styles.productTitle} numberOfLines={2}>
        {product.name}
      </Text>

      {/* 5. Rating & Delivery ETA Footer */}
      <View style={styles.deliveryRow}>
        {Boolean(product.rating || product.ratingsAverage) && (
          <View style={styles.ratingBadge}>
            <Star size={9.5} color="#16A34A" fill="#16A34A" />
            <Text style={styles.ratingText}>{product.rating || product.ratingsAverage || '4.6'}</Text>
            {Boolean(product.ratingCount || product.reviewsCount) && (
              <Text style={styles.ratingCountText}>{product.ratingCount || product.reviewsCount || '3k'}</Text>
            )}
            <Text style={styles.ratingDivider}>•</Text>
          </View>
        )}
        <Zap size={10} color="#D97706" fill="#D97706" />
        <Text style={styles.deliveryText}>
          {product.deliveryTime || '17 MINS'}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 8,
    marginBottom: 12,
    position: 'relative'
  },
  cardCompact: {
    width: 154,
    flex: undefined,
    marginRight: 10,
    marginBottom: 0
  },
  cardPressed: {
    backgroundColor: '#FAFAFA'
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 8
  },
  imageScroll: {
    width: '100%',
    height: '100%'
  },
  imageSlide: {
    height: '100%'
  },
  image: {
    width: '100%',
    height: '100%'
  },
  saveBtnWrap: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 10
  },
  vegBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 5
  },
  vegSquare: {
    width: 13,
    height: 13,
    borderWidth: 1.2,
    borderColor: '#16A34A',
    backgroundColor: colors.white,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center'
  },
  vegCircle: {
    width: 5.5,
    height: 5.5,
    borderRadius: 3,
    backgroundColor: '#16A34A'
  },
  paginationDots: {
    position: 'absolute',
    bottom: 8,
    left: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    zIndex: 5
  },
  dot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.5
  },
  dotActive: {
    backgroundColor: '#0066FF',
    width: 6,
    height: 6,
    borderRadius: 3
  },
  dotInactive: {
    backgroundColor: '#D1D5DB'
  },
  actionBtnWrap: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    zIndex: 10
  },
  plusSquareBtn: {
    width: 35,
    height: 35,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center'
  },
  plusSquareBtnPressed: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0066FF',
    transform: [{ scale: 0.94 }]
  },
  stepperPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: '#0066FF',
    borderRadius: 8,
    height: 34,
    paddingHorizontal: 3
  },
  stepperSubBtn: {
    width: 22,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  stepperSubText: {
    fontFamily: typography.family.bold,
    fontSize: 15,
    color: '#0066FF',
    fontWeight: '700'
  },
  stepperQtyText: {
    fontFamily: typography.family.bold,
    fontSize: 12.5,
    color: '#111827',
    fontWeight: '700',
    minWidth: 16,
    textAlign: 'center'
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15
  },
  outOfStockText: {
    fontFamily: typography.family.bold,
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '700',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4
  },
  variantsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 6
  },
  variantPill: {
    paddingVertical: 2.5,
    paddingHorizontal: 6,
    borderRadius: 5,
    borderWidth: 1
  },
  variantPillSelected: {
    borderColor: '#0066FF',
    backgroundColor: '#EFF6FF'
  },
  variantPillUnselected: {
    borderColor: '#E5E7EB',
    backgroundColor: colors.white
  },
  variantPillText: {
    fontFamily: typography.family.medium,
    fontSize: 10,
    color: '#4B5563'
  },
  variantPillTextSelected: {
    fontFamily: typography.family.bold,
    color: '#0066FF',
    fontWeight: '700'
  },
  productTitle: {
    fontFamily: typography.family.bold,
    fontSize: 12.5,
    color: '#111827',
    lineHeight: 16,
    marginTop: 4,
    fontWeight: '600'
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 6
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2.5,
    marginRight: 2
  },
  ratingText: {
    fontFamily: typography.family.bold,
    fontSize: 10.5,
    color: '#16A34A',
    fontWeight: '700'
  },
  ratingCountText: {
    fontFamily: typography.family.regular,
    fontSize: 9.5,
    color: '#6B7280'
  },
  ratingDivider: {
    fontSize: 9,
    color: '#9CA3AF',
    marginHorizontal: 1
  },
  deliveryText: {
    fontFamily: typography.family.medium,
    fontSize: 10.5,
    color: '#6B7280',
    fontWeight: '500'
  }
});
