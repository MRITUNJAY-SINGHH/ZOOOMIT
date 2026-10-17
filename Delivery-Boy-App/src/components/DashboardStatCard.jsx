import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, radius, spacing } from '../constants/theme';

export const DashboardStatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default', // 'default' | 'highlight'
  style,
  onPress
}) => {
  const isHighlight = variant === 'highlight';
  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.card,
        isHighlight ? styles.highlightCard : styles.defaultCard,
        style
      ]}
    >
      <View style={styles.topRow}>
        <Text style={[styles.title, isHighlight && styles.highlightTitle]}>{title}</Text>
        {Icon && (
          <View style={[styles.iconCircle, isHighlight && styles.highlightIconCircle]}>
            <Icon size={18} color={isHighlight ? colors.secondary : colors.primaryDark} />
          </View>
        )}
      </View>
      <Text style={[styles.value, isHighlight && styles.highlightValue]}>{value}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, isHighlight && styles.highlightSubtitle]}>
          {subtitle}
        </Text>
      )}
    </CardWrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    flex: 1
  },
  defaultCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border
  },
  highlightCard: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryDark
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs
  },
  title: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  highlightTitle: {
    color: '#854D0E',
    fontFamily: typography.family.bold
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center'
  },
  highlightIconCircle: {
    backgroundColor: colors.primary
  },
  value: {
    fontFamily: typography.family.heavy,
    fontSize: typography.size['2xl'],
    color: colors.textPrimary,
    marginVertical: 2
  },
  highlightValue: {
    color: colors.secondary
  },
  subtitle: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textMuted
  },
  highlightSubtitle: {
    color: '#854D0E'
  }
});
