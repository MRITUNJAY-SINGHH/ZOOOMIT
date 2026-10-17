import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, radius, spacing } from '../constants/theme';

export const StatusBadge = ({ status = 'Pending', style }) => {
  const normalized = String(status).trim();

  const getBadgeColors = () => {
    switch (normalized) {
      case 'Delivered':
        return { bg: colors.badgeDelivered, text: colors.badgeDeliveredText, border: '#86EFAC' };
      case 'Out For Delivery':
      case 'OutForDelivery':
        return { bg: colors.badgeOutForDelivery, text: colors.badgeOutForDeliveryText, border: '#93C5FD' };
      case 'Picked Up':
      case 'Arrived at Store':
        return { bg: '#FEF9C3', text: '#A16207', border: '#FDE047' };
      case 'Accepted':
        return { bg: colors.badgeAccepted, text: colors.badgeAcceptedText, border: '#FCD34D' };
      case 'Assigned':
        return { bg: colors.badgeAssigned, text: colors.badgeAssignedText, border: '#C4B5FD' };
      case 'Confirmed':
        return { bg: colors.badgeConfirmed, text: colors.badgeConfirmedText, border: '#BAE6FD' };
      case 'Cancelled':
      case 'Rejected':
        return { bg: colors.badgeCancelled, text: colors.badgeCancelledText, border: '#FCA5A5' };
      case 'Pending':
      default:
        return { bg: colors.badgePending, text: colors.badgePendingText, border: '#FDE68A' };
    }
  };

  const badgeColor = getBadgeColors();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: badgeColor.bg, borderColor: badgeColor.border },
        style
      ]}
    >
      <Text style={[styles.badgeText, { color: badgeColor.text }]}>{normalized}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start'
  },
  badgeText: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.4
  }
});
