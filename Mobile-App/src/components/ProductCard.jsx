import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Plus } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../constants/theme';
import { QuantityStepper } from './QuantityStepper';
import { useCart } from '../context/CartContext';
import { router } from 'expo-router';

export const ProductCard = ({ product, onPress }) => {
  const { getItemQuantity, addItem, updateItem, cart } = useCart();

  const currentQty = getItemQuantity(product._id);
  const minQty = product.minSaleQty || 1;
  const maxQty = product.maxSaleQty || 100;
  const step = product.qtyStep || 1;
  const unit = product.sellingUnit || product.baseUnit || 'PCS';

  const hasDiscount = product.mrp && product.mrp > product.sellingPrice;
  const discountPercent = hasDiscount 
    ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100) 
    : 0;

  const isOutOfStock = product.isTrackInventory && (product.stock || 0) <= 0;

  const handleAdd = () => {
    if (isOutOfStock) return;
    addItem(product._id, minQty, undefined, unit);
  };

  const handleIncrement = () => {
    const cartItem = cart.items.find(i => i.product._id === product._id && !i.variant);
    if (cartItem) {
      updateItem(cartItem._id, Math.round((currentQty + step) * 1000) / 1000);
    }
  };

  const handleDecrement = () => {
    const cartItem = cart.items.find(i => i.product._id === product._id && !i.variant);
    if (cartItem) {
      const nextQty = Math.round((currentQty - step) * 1000) / 1000;
      updateItem(cartItem._id, nextQty < minQty ? 0 : nextQty);
    }
  };

  const handleCardPress = () => {
    if (onPress) onPress();
    else router.push(`/product/${product._id}`);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handleCardPress}
      activeOpacity={0.88}
    >
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: product.featuredImage || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400' }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountPercent}% OFF</Text>
          </View>
        )}
        {isOutOfStock && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        {product.brand && (
          <Text style={styles.brand} numberOfLines={1}>{product.brand}</Text>
        )}
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.unit}>{unit}</Text>

        <View style={styles.bottomRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>₹{product.sellingPrice}</Text>
            {hasDiscount && (
              <Text style={styles.mrp}>₹{product.mrp}</Text>
            )}
          </View>

          {currentQty > 0 ? (
            <QuantityStepper
              quantity={currentQty}
              minQty={minQty}
              maxQty={maxQty}
              step={step}
              unit=""
              compact
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
            />
          ) : (
            <TouchableOpacity
              style={[styles.addButton, isOutOfStock && styles.disabledButton]}
              onPress={handleAdd}
              disabled={isOutOfStock}
              activeOpacity={0.8}
            >
              <Plus size={16} color={colors.black} />
              <Text style={styles.addButtonText}>ADD</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden'
  },
  imageWrapper: {
    width: '100%',
    height: 120,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.softBackground,
    position: 'relative'
  },
  image: {
    width: '100%',
    height: '100%'
  },
  discountBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radius.xs
  },
  discountText: {
    color: colors.black,
    fontSize: typography.size.xs - 1,
    fontFamily: typography.family.bold
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  outOfStockText: {
    fontSize: typography.size.xs,
    fontFamily: typography.family.bold,
    color: colors.textSecondary,
    backgroundColor: colors.softBackground,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border
  },
  info: {
    marginTop: spacing.xs + 2
  },
  brand: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    fontFamily: typography.family.medium,
    textTransform: 'uppercase'
  },
  name: {
    fontSize: typography.size.sm,
    fontFamily: typography.family.semibold,
    color: colors.textPrimary,
    marginTop: 2,
    minHeight: 36
  },
  unit: {
    fontSize: typography.size.xs,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    marginTop: 2
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm
  },
  priceContainer: {
    flexDirection: 'column'
  },
  price: {
    fontSize: typography.size.md,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  mrp: {
    fontSize: typography.size.xs,
    fontFamily: typography.family.regular,
    color: colors.textMuted,
    textDecorationLine: 'line-through'
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.primary
  },
  disabledButton: {
    opacity: 0.4
  },
  addButtonText: {
    fontSize: typography.size.xs + 1,
    fontFamily: typography.family.bold,
    color: colors.black,
    marginLeft: 2
  }
});
