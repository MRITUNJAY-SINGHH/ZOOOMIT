import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MapPin, Store, ChevronRight, Package, Clock } from 'lucide-react-native';
import { colors, typography, radius, spacing } from '../constants/theme';
import { StatusBadge } from './StatusBadge';
import { hapticFeedback } from '../services/haptics';

export const OrderCard = ({ order, onPress, style }) => {
  const handlePress = () => {
    hapticFeedback.light();
    onPress?.(order);
  };

  const itemCount = order.items?.reduce((acc, it) => acc + (it.qty || 1), 0) || order.items?.length || 1;
  const addressText = order.shippingAddress?.formattedAddress || order.shippingAddress?.city || 'Local Delivery';
  const orderTime = order.createdAt
    ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Recent';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={[styles.card, style]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.idRow}>
          <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
          <View style={styles.timeTag}>
            <Clock size={12} color={colors.textMuted} style={{ marginRight: 3 }} />
            <Text style={styles.timeText}>{orderTime}</Text>
          </View>
        </View>
        <StatusBadge status={order.status} />
      </View>

      {/* Body Addresses */}
      <View style={styles.body}>
        <View style={styles.addressRow}>
          <Store size={14} color="#A16207" style={styles.addressIcon} />
          <Text style={styles.pickupText} numberOfLines={1}>ZOOOMIT Supermart Hub</Text>
        </View>
        <View style={styles.connectorLine} />
        <View style={styles.addressRow}>
          <MapPin size={14} color="#15803D" style={styles.addressIcon} />
          <Text style={styles.deliveryText} numberOfLines={1}>{addressText}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerMeta}>
          <View style={styles.badgeItem}>
            <Package size={13} color={colors.textSecondary} style={{ marginRight: 4 }} />
            <Text style={styles.footerText}>{itemCount} Item{itemCount > 1 ? 's' : ''}</Text>
          </View>
          <Text style={styles.dotSeparator}>•</Text>
          <Text style={styles.earningsText}>Pay: ₹45</Text>
        </View>

        <View style={styles.viewDetailsRow}>
          <Text style={styles.viewDetailsText}>Details</Text>
          <ChevronRight size={16} color={colors.secondary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  orderNumber: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.md,
    color: colors.textPrimary,
    marginRight: spacing.sm
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  timeText: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textMuted
  },
  body: {
    marginVertical: spacing.sm
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  addressIcon: {
    marginRight: spacing.sm
  },
  pickupText: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    flex: 1
  },
  connectorLine: {
    width: 1.5,
    height: 10,
    backgroundColor: colors.border,
    marginLeft: 6,
    marginVertical: 2
  },
  deliveryText: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    flex: 1
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight
  },
  footerMeta: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  footerText: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.xs,
    color: colors.textSecondary
  },
  dotSeparator: {
    marginHorizontal: spacing.xs,
    color: colors.textMuted
  },
  earningsText: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    color: '#854D0E'
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  viewDetailsText: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    color: colors.secondary,
    marginRight: 2
  }
});
