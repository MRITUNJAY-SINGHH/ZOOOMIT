import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { colors, spacing, typography } from '../constants/theme';
import { Eye, EyeOff, X } from 'lucide-react-native';

export const AppInput = ({
  label,
  error,
  leftIcon,
  prefix,
  isPhone = false,
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
        {isPhone && (
          <View style={styles.phonePrefixContainer}>
            <Text style={styles.flagText}>🇮🇳</Text>
            <Text style={styles.phonePrefixText}>+91</Text>
            <View style={styles.divider} />
          </View>
        )}

        {!isPhone && prefix && (
          <View style={styles.prefixContainer}>
            <Text style={styles.prefixText}>{prefix}</Text>
            <View style={styles.divider} />
          </View>
        )}

        {leftIcon && !isPhone && (
          <View style={styles.leftIconContainer}>
            {React.cloneElement(leftIcon, {
              color: isFocused ? colors.primaryDark : colors.textMuted
            })}
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
          selectionColor={colors.primaryDark}
          {...rest}
        />

        {clearable && hasValue && (
          <TouchableOpacity
            onPress={() => onChangeText && onChangeText('')}
            style={styles.actionIconContainer}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={styles.clearCircle}>
              <X size={12} color={colors.white} />
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
              <EyeOff size={20} color={isFocused ? colors.primaryDark : colors.textMuted} />
            ) : (
              <Eye size={20} color={isFocused ? colors.primaryDark : colors.textMuted} />
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
    fontFamily: typography.family.medium,
    color: colors.textPrimary,
    marginBottom: 6
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54
  },
  focused: {
    borderWidth: 1.5,
    borderColor: colors.primary
  },
  errorBorder: {
    borderWidth: 1.5,
    borderColor: colors.error
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: typography.family.regular,
    color: colors.textPrimary,
    paddingVertical: 0
  },
  leftIconContainer: {
    marginRight: 10
  },
  phonePrefixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10
  },
  flagText: {
    fontSize: 16,
    marginRight: 4
  },
  phonePrefixText: {
    fontSize: 15,
    fontFamily: typography.family.semibold,
    color: colors.textPrimary,
    marginRight: 10
  },
  prefixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10
  },
  prefixText: {
    fontSize: 15,
    fontFamily: typography.family.semibold,
    color: colors.textPrimary,
    marginRight: 8
  },
  divider: {
    width: 1,
    height: 22,
    backgroundColor: colors.border
  },
  actionIconContainer: {
    padding: 4,
    marginLeft: 6
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
    fontFamily: typography.family.medium,
    color: colors.error,
    marginTop: 6,
    marginLeft: 2
  }
});
