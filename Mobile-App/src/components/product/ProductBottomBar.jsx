import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography } from '../../constants/theme';
import { ProductQuantityControl } from './ProductQuantityControl';

export const ProductBottomBar = ({
  product,
  selectedVariant
}) => {
  const insets = useSafeAreaInsets();

  if (!product) return null;

  const activePrice = selectedVariant?.sellingPrice || product.sellingPrice || 0;
  const activeMrp = selectedVariant?.mrp || product.mrp || 0;
  const activeUnit = selectedVariant?.conversionUnit || product.sellingUnit || product.baseUnit || 'PCS';
  const activeVariantName = selectedVariant?.name || `${product.minSaleQty || 1} ${activeUnit}`;
  const activeVariantId = selectedVariant?._id || null;

  const hasDiscount = activeMrp > activePrice;
  const discountPercent = hasDiscount
    ? Math.round(((activeMrp - activePrice) / activeMrp) * 100)
    : 0;

  const isOutOfStock = product.isTrackInventory && (product.stock || 0) <= 0;

  return (
    <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.leftInfoCol}>
        <View style={styles.packDiscountRow}>
          <Text style={styles.packName} numberOfLines={1}>
            {activeVariantName}
          </Text>
          {hasDiscount && (
            <Text style={styles.discountPill}>
              {discountPercent}% OFF
            </Text>
          )}
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceText}>₹{activePrice}</Text>
          {hasDiscount && (
            <Text style={styles.mrpText}>₹{activeMrp}</Text>
          )}
        </View>
      </View>

      <View style={styles.rightActionCol}>
        <ProductQuantityControl
          product={product}
          productId={product._id}
          variantId={activeVariantId}
          unit={activeUnit}
          minQty={product.minSaleQty || 1}
          maxQty={product.maxSaleQty || 100}
          step={product.qtyStep || 1}
          isOutOfStock={isOutOfStock}
          style={styles.customAddBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 99
  },
  leftInfoCol: {
    flex: 1,
    marginRight: 16
  },
  packDiscountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2
  },
  packName: {
    fontSize: 12,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  discountPill: {
    fontSize: 11,
    fontFamily: typography.family.bold,
    color: '#15803D'
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6
  },
  priceText: {
    fontSize: 18,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    letterSpacing: -0.2
  },
  mrpText: {
    fontSize: 13,
    fontFamily: typography.family.regular,
    color: colors.textMuted,
    textDecorationLine: 'line-through'
  },
  rightActionCol: {
    minWidth: 120
  },
  customAddBtn: {
    height: 44,
    paddingHorizontal: 28,
    borderRadius: 12
  }
});
