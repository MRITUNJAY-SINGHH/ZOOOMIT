import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../../constants/theme';

export const ProductPrice = ({
  price,
  mrp,
  unit,
  conversionFactor = 1,
  showDiscount = true,
  showUnitRate = true,
  size = 'md'
}) => {
  const numPrice = Number(price) || 0;
  const numMrp = Number(mrp) || 0;
  const hasDiscount = numMrp > numPrice;
  const discountPercent = hasDiscount
    ? Math.round(((numMrp - numPrice) / numMrp) * 100)
    : 0;

  // Calculate unit rate (e.g. ₹6.7 / 100g or ₹67 / kg)
  let unitRateText = '';
  if (showUnitRate && numPrice > 0) {
    if (unit?.toLowerCase() === 'kg' || unit?.toLowerCase() === 'g' || unit?.toLowerCase() === 'gm') {
      const totalGrams = unit?.toLowerCase() === 'kg' ? (conversionFactor || 1) * 1000 : (conversionFactor || 1) * (unit ? parseFloat(unit) || 100 : 100);
      if (totalGrams > 0) {
        const ratePer100g = ((numPrice / totalGrams) * 100).toFixed(1);
        unitRateText = `₹${ratePer100g}/100 g`;
      }
    } else if (unit?.toLowerCase() === 'ltr' || unit?.toLowerCase() === 'ml') {
      const totalMl = unit?.toLowerCase() === 'ltr' ? (conversionFactor || 1) * 1000 : (conversionFactor || 100);
      const ratePer100ml = ((numPrice / totalMl) * 100).toFixed(1);
      unitRateText = `₹${ratePer100ml}/100 ml`;
    }
  }

  const isLg = size === 'lg';

  return (
    <View style={styles.container}>
      <View style={styles.priceRow}>
        <Text style={[styles.sellingPrice, isLg && styles.sellingPriceLg]}>
          ₹{numPrice}
        </Text>
        {hasDiscount && (
          <Text style={[styles.mrp, isLg && styles.mrpLg]}>
            ₹{numMrp}
          </Text>
        )}
      </View>

      {Boolean(unitRateText) && (
        <Text style={styles.unitRateText}>{unitRateText}</Text>
      )}

      {showDiscount && hasDiscount && (
        <Text style={styles.discountText}>{discountPercent}% OFF</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 2
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6
  },
  sellingPrice: {
    fontSize: 14.5,
    fontFamily: typography.family.bold,
    color: '#111827',
    fontWeight: '700',
    letterSpacing: -0.2
  },
  sellingPriceLg: {
    fontSize: 22,
    fontFamily: typography.family.bold,
    fontWeight: '700'
  },
  mrp: {
    fontSize: 12,
    fontFamily: typography.family.regular,
    color: '#9CA3AF',
    textDecorationLine: 'line-through'
  },
  mrpLg: {
    fontSize: 15,
    fontFamily: typography.family.regular
  },
  unitRateText: {
    fontSize: 10.5,
    fontFamily: typography.family.regular,
    color: '#6B7280',
    marginTop: 1
  },
  discountText: {
    fontSize: 11,
    fontFamily: typography.family.bold,
    color: '#16A34A',
    fontWeight: '700',
    marginTop: 1.5
  }
});
