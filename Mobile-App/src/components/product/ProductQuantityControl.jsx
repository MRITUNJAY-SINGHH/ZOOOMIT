import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring
} from 'react-native-reanimated';
import { Plus, Minus } from 'lucide-react-native';
import { colors, typography } from '../../constants/theme';
import { useCart } from '../../context/CartContext';
import { haptics } from '../../services/haptics';

export const ProductQuantityControl = ({
  productId,
  variantId = null,
  unit = 'PCS',
  minQty = 1,
  maxQty = 100,
  step = 1,
  isOutOfStock = false,
  compact = false,
  fullWidth = false,
  style
}) => {
  const { getItemQuantity, addItem, updateItem, cart } = useCart();
  const currentQty = getItemQuantity(productId, variantId);

  const scale = useSharedValue(1);

  const animatePress = () => {
    scale.value = withSequence(
      withSpring(0.92, { damping: 10, stiffness: 350 }),
      withSpring(1, { damping: 12, stiffness: 250 })
    );
  };

  const handleAdd = (e) => {
    e?.stopPropagation?.();
    if (isOutOfStock) return;
    animatePress();
    haptics.impactMedium();
    addItem(productId, minQty, variantId, unit);
  };

  const handleIncrement = (e) => {
    e?.stopPropagation?.();
    if (currentQty >= maxQty) return;
    animatePress();
    haptics.impactLight();
    const cartItem = cart.items.find(
      (i) => i.product._id === productId && (variantId ? i.variant?._id === variantId : !i.variant)
    );
    if (cartItem) {
      updateItem(cartItem._id, Math.round((currentQty + step) * 1000) / 1000);
    } else {
      addItem(productId, minQty, variantId, unit);
    }
  };

  const handleDecrement = (e) => {
    e?.stopPropagation?.();
    animatePress();
    haptics.impactLight();
    const cartItem = cart.items.find(
      (i) => i.product._id === productId && (variantId ? i.variant?._id === variantId : !i.variant)
    );
    if (cartItem) {
      const nextQty = Math.round((currentQty - step) * 1000) / 1000;
      updateItem(cartItem._id, nextQty < minQty ? 0 : nextQty);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  if (isOutOfStock) {
    return (
      <View style={[styles.outOfStockBadge, style]}>
        <Text style={styles.outOfStockText}>Out of Stock</Text>
      </View>
    );
  }

  if (currentQty > 0) {
    return (
      <Animated.View style={[animatedStyle, fullWidth && { width: '100%' }]}>
        <View style={[styles.stepperContainer, compact && styles.stepperCompact, fullWidth && styles.stepperFull, style]}>
          <Pressable
            onPress={handleDecrement}
            style={({ pressed }) => [
              styles.stepBtn,
              pressed && styles.stepBtnPressed
            ]}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            accessibilityRole="button"
            accessibilityLabel="Decrease quantity"
          >
            <Minus size={compact ? 13 : 16} color="#FFFFFF" strokeWidth={2.6} />
          </Pressable>

          <Text style={[styles.qtyText, compact && styles.qtyTextCompact]}>
            {currentQty}
          </Text>

          <Pressable
            onPress={handleIncrement}
            style={({ pressed }) => [
              styles.stepBtn,
              pressed && styles.stepBtnPressed
            ]}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            accessibilityRole="button"
            accessibilityLabel="Increase quantity"
          >
            <Plus size={compact ? 13 : 16} color="#FFFFFF" strokeWidth={2.6} />
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  // Single Add Button State
  return (
    <Animated.View style={[animatedStyle, fullWidth && { width: '100%' }]}>
      <Pressable
        onPress={handleAdd}
        style={({ pressed }) => [
          styles.addBtn,
          compact && styles.addBtnCompact,
          fullWidth && styles.addBtnFull,
          pressed && { opacity: 0.88, transform: [{ scale: 0.97 }] },
          style
        ]}
        accessibilityRole="button"
        accessibilityLabel="Add to cart"
      >
        <Text style={[styles.addBtnText, compact && styles.addBtnTextCompact]}>
          ADD
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  addBtn: {
    height: 38,
    paddingHorizontal: 22,
    backgroundColor: '#1769FF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0
  },
  addBtnCompact: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 8
  },
  addBtnFull: {
    width: '100%',
    height: 48,
    borderRadius: 14
  },
  addBtnText: {
    fontSize: 14,
    fontFamily: typography.family.bold,
    color: '#FFFFFF',
    letterSpacing: 0.4
  },
  addBtnTextCompact: {
    fontSize: 12,
    fontFamily: typography.family.bold
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1769FF',
    borderRadius: 12,
    height: 38,
    paddingHorizontal: 4,
    minWidth: 92
  },
  stepperCompact: {
    height: 32,
    borderRadius: 8,
    minWidth: 78,
    paddingHorizontal: 2
  },
  stepperFull: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 12
  },
  stepBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6
  },
  stepBtnPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)'
  },
  qtyText: {
    fontSize: 14,
    fontFamily: typography.family.bold,
    color: '#FFFFFF',
    minWidth: 20,
    textAlign: 'center'
  },
  qtyTextCompact: {
    fontSize: 13,
    fontFamily: typography.family.bold
  },
  outOfStockBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA'
  },
  outOfStockText: {
    fontSize: 11,
    fontFamily: typography.family.bold,
    color: '#DC2626'
  }
});
