import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShoppingBag } from 'lucide-react-native';
import { colors, typography } from '../constants/theme';
import { useCart } from '../context/CartContext';

export const CartBadge = ({
  color = colors.textSecondary,
  size = 24
}) => {
  const { itemCount } = useCart();

  return (
    <View style={styles.container}>
      <ShoppingBag size={size} color={color} />
      {itemCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {itemCount > 99 ? '99+' : itemCount}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center'
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: colors.primary,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.surface
  },
  badgeText: {
    color: '#fff',
    fontSize: typography.size.xs - 2,
    fontWeight: typography.weight.bold
  }
});
