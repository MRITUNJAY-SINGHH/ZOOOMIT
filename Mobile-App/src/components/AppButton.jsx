import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  View, 
  ActivityIndicator 
} from 'react-native';
import { colors, spacing, radius, typography } from '../constants/theme';

export const AppButton = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon,
  style,
  textStyle
}) => {
  const getContainerStyle = () => {
    const base = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.xl,
      minHeight: size === 'sm' ? 38 : size === 'lg' ? 52 : 46
    };

    // Size
    let sizeStyle = {};
    if (size === 'sm') sizeStyle = { paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.md };
    else if (size === 'md') sizeStyle = { paddingVertical: spacing.md, paddingHorizontal: spacing.xl };
    else if (size === 'lg') sizeStyle = { paddingVertical: spacing.md + 2, paddingHorizontal: spacing['2xl'] };

    // Solid Variant Styling (No gradients)
    let variantStyle = {};
    if (variant === 'primary') variantStyle = { backgroundColor: colors.primary };
    else if (variant === 'secondary') variantStyle = { backgroundColor: colors.surfaceSubtle, borderWidth: 1, borderColor: colors.border };
    else if (variant === 'outline') variantStyle = { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary };
    else if (variant === 'ghost') variantStyle = { backgroundColor: 'transparent' };
    else if (variant === 'danger') variantStyle = { backgroundColor: colors.error };

    const disabledStyle = (disabled || isLoading) ? { opacity: 0.55 } : {};

    return [base, sizeStyle, variantStyle, disabledStyle, style || {}];
  };

  const getTextStyle = () => {
    let color = '#ffffff';
    if (variant === 'secondary') color = colors.textPrimary;
    else if (variant === 'outline') color = colors.primary;
    else if (variant === 'ghost') color = colors.textSecondary;
    else if (variant === 'danger') color = '#ffffff';

    let fontSize = typography.size.md;
    if (size === 'sm') fontSize = typography.size.sm;
    else if (size === 'lg') fontSize = typography.size.lg;

    return [
      {
        color,
        fontSize,
        fontFamily: typography.family?.semibold || undefined,
        fontWeight: typography.weight.semibold,
        textAlign: 'center'
      },
      textStyle || {}
    ];
  };

  return (
    <TouchableOpacity
      style={getContainerStyle()}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.82}
    >
      {isLoading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'outline' || variant === 'secondary' ? colors.primary : '#ffffff'} 
        />
      ) : (
        <>
          {icon && <View style={{ marginRight: spacing.sm }}>{icon}</View>}
          <Text style={getTextStyle()}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};
