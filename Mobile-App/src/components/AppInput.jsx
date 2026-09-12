import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { colors, spacing, radius, typography } from '../constants/theme';
import { Eye, EyeOff, X } from 'lucide-react-native';

export const AppInput = ({
  label,
  error,
  leftIcon,
  prefix,
  secureTextEntry,
  clearable = false,
  containerStyle,
  style,
  value,
  onChangeText,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const hasValue = Boolean(value && value.length > 0);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View 
        style={[
          styles.container, 
          isFocused && styles.focused, 
          Boolean(error) && styles.errorBorder
        ]}
      >
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            {React.cloneElement(leftIcon, {
              color: isFocused ? colors.primary : colors.textMuted
            })}
          </View>
        )}

        {prefix && (
          <View style={styles.prefixContainer}>
            <Text style={styles.prefixText}>{prefix}</Text>
          </View>
        )}

        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...rest}
        />

        {clearable && hasValue && (
          <TouchableOpacity
            onPress={() => onChangeText && onChangeText('')}
            style={styles.actionIconContainer}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={styles.clearCircle}>
              <X size={12} color="#ffffff" />
            </View>
          </TouchableOpacity>
        )}

        {secureTextEntry && (
          <TouchableOpacity 
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.actionIconContainer}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isPasswordVisible ? (
              <EyeOff size={20} color={isFocused ? colors.primary : colors.textMuted} />
            ) : (
              <Eye size={20} color={isFocused ? colors.primary : colors.textMuted} />
            )}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
    width: '100%'
  },
  label: {
    fontSize: typography.size.sm,
    fontFamily: typography.family?.medium || undefined,
    fontWeight: typography.weight.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs + 2
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    minHeight: 50
  },
  focused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface
  },
  errorBorder: {
    borderColor: colors.error
  },
  input: {
    flex: 1,
    fontSize: typography.size.md,
    fontFamily: typography.family?.regular || undefined,
    color: colors.textPrimary,
    paddingVertical: spacing.sm + 4
  },
  leftIconContainer: {
    marginRight: spacing.sm
  },
  prefixContainer: {
    backgroundColor: colors.borderSubtle,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    marginRight: spacing.sm
  },
  prefixText: {
    fontSize: typography.size.sm,
    fontFamily: typography.family?.semibold || undefined,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary
  },
  actionIconContainer: {
    padding: spacing.xs,
    marginLeft: spacing.xs
  },
  clearCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorText: {
    fontSize: typography.size.xs,
    fontFamily: typography.family?.medium || undefined,
    color: colors.error,
    marginTop: spacing.xs
  }
});
