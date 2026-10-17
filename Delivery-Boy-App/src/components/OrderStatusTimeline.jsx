import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check, Circle } from 'lucide-react-native';
import { colors, typography, radius, spacing } from '../constants/theme';

const STEPS = [
  { key: 'Assigned', title: 'Order Assigned', desc: 'Assigned by ZOOOMIT Hub' },
  { key: 'Accepted', title: 'Accepted by You', desc: 'Heading to store for pickup' },
  { key: 'Arrived at Store', title: 'Arrived at Store', desc: 'Order is being packed' },
  { key: 'Picked Up', title: 'Items Collected', desc: 'Checklist verified at hub' },
  { key: 'Out For Delivery', title: 'Out for Delivery', desc: 'Navigating to customer' },
  { key: 'Delivered', title: 'Delivered', desc: 'Verified with 4-digit OTP' }
];

export const OrderStatusTimeline = ({ currentStatus = 'Assigned', style }) => {
  const normalized = currentStatus === 'OutForDelivery' ? 'Out For Delivery' : currentStatus;
  const currentIndex = STEPS.findIndex((s) => s.key.toLowerCase() === normalized.toLowerCase());

  return (
    <View style={[styles.container, style]}>
      {STEPS.map((step, index) => {
        const isPassed = currentIndex >= 0 && index < currentIndex;
        const isCurrent = currentIndex >= 0 && index === currentIndex;
        const isFuture = index > currentIndex;
        const isLast = index === STEPS.length - 1;

        return (
          <View key={step.key} style={styles.stepRow}>
            {/* Left Indicator Column */}
            <View style={styles.indicatorCol}>
              <View
                style={[
                  styles.circle,
                  isPassed && styles.circlePassed,
                  isCurrent && styles.circleCurrent,
                  isFuture && styles.circleFuture
                ]}
              >
                {isPassed ? (
                  <Check size={14} color={colors.white} />
                ) : isCurrent ? (
                  <View style={styles.innerDot} />
                ) : (
                  <Circle size={10} color={colors.border} />
                )}
              </View>
              {!isLast && (
                <View
                  style={[
                    styles.verticalLine,
                    isPassed ? styles.linePassed : styles.lineFuture
                  ]}
                />
              )}
            </View>

            {/* Right Content Column */}
            <View style={styles.contentCol}>
              <Text
                style={[
                  styles.stepTitle,
                  isCurrent && styles.stepTitleCurrent,
                  isFuture && styles.stepTitleFuture
                ]}
              >
                {step.title}
              </Text>
              <Text style={styles.stepDesc}>{step.desc}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 48
  },
  indicatorCol: {
    alignItems: 'center',
    width: 28,
    marginRight: spacing.sm
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2
  },
  circlePassed: {
    backgroundColor: colors.success,
    borderColor: colors.success
  },
  circleCurrent: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryDark
  },
  circleFuture: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.border
  },
  innerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primaryDark
  },
  verticalLine: {
    width: 2,
    flex: 1,
    marginVertical: 2
  },
  linePassed: {
    backgroundColor: colors.success
  },
  lineFuture: {
    backgroundColor: colors.borderLight
  },
  contentCol: {
    flex: 1,
    paddingBottom: spacing.sm
  },
  stepTitle: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    color: colors.textPrimary
  },
  stepTitleCurrent: {
    color: '#854D0E'
  },
  stepTitleFuture: {
    color: colors.textMuted
  },
  stepDesc: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 2
  }
});
