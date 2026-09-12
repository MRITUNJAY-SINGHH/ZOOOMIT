import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';

export const SkeletonBox = ({
  width = '100%',
  height = 20,
  borderRadius = radius.md,
  style
}) => {
  return (
    <View
      style={[
        styles.box,
        { width, height, borderRadius },
        style
      ]}
    />
  );
};

export const ProductCardSkeleton = () => {
  return (
    <View style={styles.card}>
      <SkeletonBox height={110} style={{ marginBottom: spacing.sm }} />
      <SkeletonBox height={12} width="40%" style={{ marginBottom: spacing.xs }} />
      <SkeletonBox height={16} width="90%" style={{ marginBottom: spacing.xs }} />
      <SkeletonBox height={16} width="60%" style={{ marginBottom: spacing.md }} />
      <View style={styles.row}>
        <SkeletonBox height={20} width="35%" />
        <SkeletonBox height={28} width="40%" borderRadius={radius.md} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surfaceSubtle,
    overflow: 'hidden'
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  }
});
