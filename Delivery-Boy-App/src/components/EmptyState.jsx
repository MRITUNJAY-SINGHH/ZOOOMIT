import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { colors, typography, spacing } from '../constants/theme';
import { AppButton } from './AppButton';

const IMAGES = {
  orders: require('../../assets/images/empty-orders.png'),
  support: require('../../assets/images/support-illustration.png'),
  success: require('../../assets/images/delivery-success.png'),
  hero: require('../../assets/images/delivery-partner-hero.png')
};

export const EmptyState = ({
  type = 'orders',
  title,
  message,
  actionTitle,
  onAction,
  style
}) => {
  const imageSource = IMAGES[type] || IMAGES.orders;

  return (
    <View style={[styles.container, style]}>
      <Image
        source={imageSource}
        style={styles.illustration}
        contentFit="contain"
      />
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {actionTitle && onAction && (
        <AppButton
          title={actionTitle}
          variant="outline"
          onPress={onAction}
          style={styles.actionBtn}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginVertical: spacing.xl
  },
  illustration: {
    width: 170,
    height: 170,
    marginBottom: spacing.md
  },
  title: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs
  },
  message: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20
  },
  actionBtn: {
    marginTop: spacing.lg,
    minWidth: 150
  }
});
