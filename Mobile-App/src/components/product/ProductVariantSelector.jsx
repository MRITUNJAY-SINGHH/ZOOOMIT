import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { colors, typography } from '../../constants/theme';
import { haptics } from '../../services/haptics';

export const ProductVariantSelector = ({
  variants = [],
  selectedVariantId,
  onSelectVariant,
  defaultProduct
}) => {
  if (!variants || variants.length === 0) return null;

  // Render options: if variants exist, list them
  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeading}>
        Select Quantity / Pack
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {variants.map((v) => {
          const isSelected = selectedVariantId === v._id;
          const numPrice = v.sellingPrice || defaultProduct?.sellingPrice || 0;
          const numMrp = v.mrp || defaultProduct?.mrp || 0;
          const hasDiscount = numMrp > numPrice;
          const discountPercent = hasDiscount
            ? Math.round(((numMrp - numPrice) / numMrp) * 100)
            : 0;

          // Calculate unit rate
          let unitRate = '';
          const factor = v.conversionFactor || 1;
          const unit = (v.conversionUnit || 'kg').toLowerCase();
          if (unit === 'kg' || unit === 'g' || unit === 'gm') {
            const grams = unit === 'kg' ? factor * 1000 : factor * 100;
            if (grams > 0) {
              unitRate = `₹${((numPrice / grams) * 100).toFixed(1)}/100 g`;
            }
          }

          return (
            <Pressable
              key={v._id}
              onPress={() => {
                haptics.selection();
                onSelectVariant(v._id);
              }}
              style={[
                styles.variantCard,
                isSelected ? styles.variantCardSelected : styles.variantCardUnselected
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Select pack ${v.name}`}
            >
              <Text style={[styles.variantName, isSelected && styles.variantNameSelected]} numberOfLines={1}>
                {v.name}
              </Text>

              {hasDiscount ? (
                <Text style={styles.discountText}>
                  {discountPercent}% OFF
                </Text>
              ) : (
                <View style={{ height: 16 }} />
              )}

              <View style={styles.priceRow}>
                <Text style={styles.priceText}>₹{numPrice}</Text>
                {hasDiscount && (
                  <Text style={styles.mrpText}>₹{numMrp}</Text>
                )}
              </View>

              {Boolean(unitRate) && (
                <Text style={styles.unitRateText}>{unitRate}</Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12
  },
  sectionHeading: {
    fontSize: 13,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  scrollContent: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 16
  },
  variantCard: {
    minWidth: 102,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    backgroundColor: colors.white
  },
  variantCardUnselected: {
    borderColor: colors.borderLight,
    backgroundColor: colors.white
  },
  variantCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  variantName: {
    fontSize: 13,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    marginBottom: 2
  },
  variantNameSelected: {
    color: colors.black
  },
  discountText: {
    fontSize: 11,
    fontFamily: typography.family.bold,
    color: '#15803D',
    marginBottom: 4
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4
  },
  priceText: {
    fontSize: 14,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  mrpText: {
    fontSize: 11,
    fontFamily: typography.family.regular,
    color: colors.textMuted,
    textDecorationLine: 'line-through'
  },
  unitRateText: {
    fontSize: 10,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    marginTop: 2
  }
});
