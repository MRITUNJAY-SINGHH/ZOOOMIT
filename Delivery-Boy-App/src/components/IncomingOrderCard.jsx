import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, Navigation, Clock, Package, DollarSign, Store } from 'lucide-react-native';
import { colors, typography, radius, spacing } from '../constants/theme';
import { AppButton } from './AppButton';
import { hapticFeedback } from '../services/haptics';

export const IncomingOrderCard = ({
  order,
  onAccept,
  onReject,
  accepting = false,
  rejecting = false,
  style
}) => {
  const [timeLeft, setTimeLeft] = useState(order.expirySeconds || 90);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const pickupName = order.pickupLocation?.storeName || 'ZOOOMIT Supermart Hub';
  const pickupAddress = order.pickupLocation?.address || 'Sector 4, Main Express Hub';
  const deliveryArea = order.deliveryLocation?.formattedAddress || order.deliveryLocation?.city || 'Customer Address';
  const itemsCount = order.itemCount || 1;
  const distance = order.deliveryLocation?.distanceKm || 2.4;

  return (
    <View style={[styles.card, style]}>
      {/* Top Banner with Countdown */}
      <View style={styles.topBanner}>
        <View style={styles.badgeRow}>
          <View style={styles.livePulse} />
          <Text style={styles.badgeText}>NEW DELIVERY OFFER</Text>
        </View>
        <View style={styles.timerBadge}>
          <Clock size={13} color={colors.secondary} style={{ marginRight: 4 }} />
          <Text style={styles.timerText}>{timeLeft}s</Text>
        </View>
      </View>

      {/* Order info summary */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
          <Text style={styles.orderLabel}>ORDER NUMBER</Text>
          <Text style={styles.orderNumber} numberOfLines={1} ellipsizeMode="tail">#{order.orderNumber}</Text>
        </View>
        <View style={[styles.paymentPill, { flexShrink: 0 }]}>
          <Text style={styles.paymentPillText}>
            {(order.paymentMode || order.paymentMethod || '').toLowerCase().includes('cod') ? 'COD' : 'Paid Online'}
          </Text>
        </View>
      </View>

      {/* Route Info */}
      <View style={styles.routeContainer}>
        {/* Pickup */}
        <View style={styles.routeRow}>
          <View style={styles.iconCircleStore}>
            <Store size={15} color="#A16207" />
          </View>
          <View style={styles.routeDetails}>
            <Text style={styles.routeRole}>PICKUP STORE</Text>
            <Text style={styles.locationTitle} numberOfLines={1}>{pickupName}</Text>
            <Text style={styles.locationSubtitle} numberOfLines={1}>{pickupAddress}</Text>
          </View>
        </View>

        <View style={styles.routeDivider} />

        {/* Drop */}
        <View style={styles.routeRow}>
          <View style={styles.iconCircleDrop}>
            <MapPin size={15} color="#15803D" />
          </View>
          <View style={styles.routeDetails}>
            <Text style={styles.routeRole}>DELIVER TO</Text>
            <Text style={styles.locationTitle} numberOfLines={1}>
              {order.deliveryLocation?.contactName || 'Customer'}
            </Text>
            <Text style={styles.locationSubtitle} numberOfLines={1}>{deliveryArea}</Text>
          </View>
        </View>
      </View>

      {/* Meta tags */}
      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <Package size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
          <Text style={styles.metaText}>{itemsCount} Item{itemsCount > 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.metaChip}>
          <Navigation size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
          <Text style={styles.metaText}>{distance} km est.</Text>
        </View>
        <View style={styles.metaChip}>
          <Clock size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
          <Text style={styles.metaText}>15-20 min</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <AppButton
          title="Decline"
          variant="outline"
          onPress={() => onReject?.(order)}
          loading={rejecting}
          disabled={accepting}
          style={styles.declineBtn}
          textStyle={{ color: colors.textSecondary }}
        />
        <AppButton
          title="Accept Delivery"
          variant="primary"
          onPress={() => onAccept?.(order)}
          loading={accepting}
          disabled={rejecting || timeLeft <= 0}
          style={styles.acceptBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg
  },
  topBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryDark,
    marginRight: 6
  },
  badgeText: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    color: colors.secondary,
    letterSpacing: 0.5
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primaryDark
  },
  timerText: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    color: colors.secondary
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight
  },
  orderLabel: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.xs,
    color: colors.textMuted
  },
  orderNumber: {
    fontFamily: typography.family.heavy,
    fontSize: typography.size.xl,
    color: colors.textPrimary,
    marginTop: 2
  },
  paymentPill: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center'
  },
  paymentPillText: {
    fontFamily: typography.family.bold,
    fontSize: 12,
    color: '#1D4ED8'
  },
  routeContainer: {
    marginVertical: spacing.md
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconCircleStore: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF9C3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FDE047',
    marginRight: spacing.sm
  },
  iconCircleDrop: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#86EFAC',
    marginRight: spacing.sm
  },
  routeDetails: {
    flex: 1
  },
  routeRole: {
    fontFamily: typography.family.bold,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 0.4
  },
  locationTitle: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    color: colors.textPrimary
  },
  locationSubtitle: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textSecondary
  },
  routeDivider: {
    width: 2,
    height: 14,
    backgroundColor: colors.border,
    marginLeft: 15,
    marginVertical: 3
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.sm
  },
  metaText: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.xs,
    color: colors.textSecondary
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  declineBtn: {
    flex: 1,
    height: 46
  },
  acceptBtn: {
    flex: 2,
    height: 46
  }
});
