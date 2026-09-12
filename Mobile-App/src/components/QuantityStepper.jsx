import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Plus, Minus, Trash2 } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../constants/theme';

export const QuantityStepper = ({
  quantity,
  minQty = 1,
  maxQty = 100,
  step = 1,
  unit = '',
  onIncrement,
  onDecrement,
  style,
  compact = false
}) => {
  const isMin = quantity <= minQty;
  const isMax = quantity >= maxQty;

  return (
    <View style={[styles.container, compact && styles.compactContainer, style]}>
      <TouchableOpacity
        onPress={onDecrement}
        style={[styles.button, styles.decrementBtn]}
        activeOpacity={0.7}
      >
        {isMin ? (
          <Trash2 size={compact ? 13 : 16} color={colors.textSecondary} />
        ) : (
          <Minus size={compact ? 13 : 16} color={colors.primary} />
        )}
      </TouchableOpacity>

      <View style={styles.quantityDisplay}>
        <Text style={[styles.quantityText, compact && styles.compactQuantityText]}>
          {quantity}
        </Text>
        {Boolean(unit) && !compact && (
          <Text style={styles.unitText}>{unit}</Text>
        )}
      </View>

      <TouchableOpacity
        onPress={onIncrement}
        disabled={isMax}
        style={[styles.button, styles.incrementBtn, isMax && styles.disabledBtn]}
        activeOpacity={0.7}
      >
        <Plus size={compact ? 13 : 16} color={isMax ? colors.textMuted : colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    overflow: 'hidden'
  },
  compactContainer: {
    paddingHorizontal: 2
  },
  button: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center'
  },
  decrementBtn: {
    backgroundColor: 'transparent'
  },
  incrementBtn: {
    backgroundColor: 'transparent'
  },
  disabledBtn: {
    opacity: 0.3
  },
  quantityDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    minWidth: 28
  },
  quantityText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.primary
  },
  compactQuantityText: {
    fontSize: typography.size.xs + 1
  },
  unitText: {
    fontSize: typography.size.xs - 2,
    color: colors.textSecondary,
    marginLeft: 2
  }
});
