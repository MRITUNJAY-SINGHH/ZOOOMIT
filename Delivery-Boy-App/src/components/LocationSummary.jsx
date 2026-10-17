import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Navigation, MapPin, Store, Phone } from 'lucide-react-native';
import { colors, typography, radius, spacing } from '../constants/theme';
import { locationService } from '../services/locationService';
import { hapticFeedback } from '../services/haptics';

export const LocationSummary = ({
  type = 'delivery', // 'pickup' | 'delivery'
  title,
  address,
  contactName,
  contactPhone,
  latitude,
  longitude,
  distanceKm,
  onCall,
  style
}) => {
  const isPickup = type === 'pickup';

  const handleStartNavigation = () => {
    hapticFeedback.medium();
    locationService.openTurnByTurnNavigation({
      latitude,
      longitude,
      label: title || (isPickup ? 'ZOOOMIT Store Hub' : 'Customer Address'),
      address
    });
  };

  return (
    <View style={[styles.card, style]}>
      <View style={styles.headerRow}>
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.iconCircle,
              isPickup ? styles.iconPickup : styles.iconDelivery
            ]}
          >
            {isPickup ? (
              <Store size={18} color="#A16207" />
            ) : (
              <MapPin size={18} color="#15803D" />
            )}
          </View>
          <View>
            <Text style={styles.categoryLabel}>{isPickup ? 'PICKUP LOCATION' : 'DELIVERY DESTINATION'}</Text>
            <Text style={styles.titleText}>{title || (isPickup ? 'ZOOOMIT Supermart Hub' : contactName || 'Customer')}</Text>
          </View>
        </View>

        {distanceKm !== undefined && (
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>{distanceKm} km</Text>
          </View>
        )}
      </View>

      <Text style={styles.addressText}>{address}</Text>

      {/* Action Row */}
      <View style={styles.actionsRow}>
        {Boolean(contactPhone) && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              hapticFeedback.light();
              onCall?.(contactPhone);
            }}
            style={styles.callBtn}
          >
            <Phone size={16} color={colors.secondary} style={{ marginRight: 6 }} />
            <Text style={styles.callBtnText}>Call</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleStartNavigation}
          style={styles.navBtn}
        >
          <Navigation size={16} color={colors.secondary} style={{ marginRight: 6 }} />
          <Text style={styles.navBtnText}>Free GPS Navigation</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginRight: spacing.sm
  },
  iconPickup: {
    backgroundColor: '#FEF9C3',
    borderColor: '#FDE047'
  },
  iconDelivery: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC'
  },
  categoryLabel: {
    fontFamily: typography.family.bold,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 0.5
  },
  titleText: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    color: colors.textPrimary
  },
  distanceBadge: {
    backgroundColor: colors.primarySubtle,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill
  },
  distanceText: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    color: '#854D0E'
  },
  addressText: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginVertical: spacing.sm,
    lineHeight: 18
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs
  },
  callBtn: {
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  callBtnText: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    color: colors.secondary
  },
  navBtn: {
    flex: 1,
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  navBtnText: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    color: colors.secondary
  }
});
