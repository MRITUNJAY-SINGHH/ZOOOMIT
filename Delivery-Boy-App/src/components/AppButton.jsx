import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, typography, radius, spacing } from '../constants/theme';
import { hapticFeedback } from '../services/haptics';

export const AppButton = ({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger'
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon: Icon
}) => {
  const handlePress = () => {
    if (disabled || loading) return;
    hapticFeedback.light();
    onPress?.();
  };

  const getContainerStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryContainer;
      case 'outline':
        return styles.outlineContainer;
      case 'danger':
        return styles.dangerContainer;
      case 'primary':
      default:
        return styles.primaryContainer;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryText;
      case 'outline':
        return styles.outlineText;
      case 'danger':
        return styles.dangerText;
      case 'primary':
      default:
        return styles.primaryText;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        styles.baseContainer,
        getContainerStyle(),
        (disabled || loading) && styles.disabledContainer,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.secondary : colors.primary}
        />
      ) : (
        <>
          {Icon && <Icon size={18} color={getTextStyle().color} style={styles.icon} />}
          <Text style={[styles.baseText, getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    height: 50,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderWidth: 1.5,
    borderColor: 'transparent'
  },
  primaryContainer: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark
  },
  secondaryContainer: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary
  },
  outlineContainer: {
    backgroundColor: colors.surface,
    borderColor: colors.border
  },
  dangerContainer: {
    backgroundColor: colors.errorSubtle,
    borderColor: colors.error
  },
  disabledContainer: {
    opacity: 0.55
  },
  baseText: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.md,
    textAlign: 'center'
  },
  primaryText: {
    color: colors.secondary
  },
  secondaryText: {
    color: colors.white
  },
  outlineText: {
    color: colors.textPrimary
  },
  dangerText: {
    color: colors.error
  },
  icon: {
    marginRight: spacing.sm
  }
});
