import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { Power, CheckCircle2, CircleOff } from 'lucide-react-native';
import { colors, typography, radius, spacing } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { hapticFeedback } from '../services/haptics';

export const OnlineStatusToggle = ({ style }) => {
  const { isOnline, toggleOnline } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await toggleOnline();
    } catch (err) {
      Alert.alert(
        'Availability Error',
        err.response?.data?.message || 'Unable to update availability status. Please check your network connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.textColumn}>
        <View style={styles.statusIndicatorRow}>
          <View
            style={[
              styles.indicatorDot,
              { backgroundColor: isOnline ? colors.success : colors.textMuted }
            ]}
          />
          <Text style={styles.statusLabel}>
            {isOnline ? 'YOU ARE ONLINE' : 'YOU ARE OFFLINE'}
          </Text>
        </View>
        <Text style={styles.subtext}>
          {isOnline
            ? 'Ready to receive high-priority delivery orders'
            : 'Go online to start receiving customer orders'}
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleToggle}
        disabled={loading}
        style={[
          styles.switchButton,
          isOnline ? styles.switchOnline : styles.switchOffline,
          loading && styles.switchLoading
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={isOnline ? colors.white : colors.secondary} />
        ) : isOnline ? (
          <>
            <Power size={18} color={colors.white} style={styles.btnIcon} />
            <Text style={styles.btnTextOnline}>Go Offline</Text>
          </>
        ) : (
          <>
            <Power size={18} color={colors.secondary} style={styles.btnIcon} />
            <Text style={styles.btnTextOffline}>Go Online</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  textColumn: {
    flex: 1,
    marginRight: spacing.sm
  },
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2
  },
  indicatorDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 6
  },
  statusLabel: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    letterSpacing: 0.3
  },
  subtext: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 2
  },
  switchButton: {
    height: 42,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5
  },
  switchOnline: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary
  },
  switchOffline: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark
  },
  switchLoading: {
    opacity: 0.7
  },
  btnIcon: {
    marginRight: 6
  },
  btnTextOnline: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    color: colors.white
  },
  btnTextOffline: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    color: colors.secondary
  }
});
