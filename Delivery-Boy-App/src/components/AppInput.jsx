import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { colors, typography, radius, spacing } from '../constants/theme';

export const AppInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error,
  icon: Icon,
  keyboardType = 'default',
  autoCapitalize = 'none',
  editable = true,
  style
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!secureTextEntry);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.focusedWrapper,
          Boolean(error) && styles.errorWrapper,
          !editable && styles.disabledWrapper
        ]}
      >
        {Icon && <Icon size={20} color={isFocused ? colors.secondary : colors.textMuted} style={styles.leftIcon} />}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={styles.textInput}
        />
        {secureTextEntry && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowPassword((prev) => !prev)}
            style={styles.eyeBtn}
          >
            {showPassword ? (
              <EyeOff size={20} color={colors.textSecondary} />
            ) : (
              <Eye size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        )}
      </View>
      {Boolean(error) && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md
  },
  label: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  inputWrapper: {
    height: 50,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md
  },
  focusedWrapper: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.surface
  },
  errorWrapper: {
    borderColor: colors.error
  },
  disabledWrapper: {
    backgroundColor: colors.borderLight,
    opacity: 0.7
  },
  leftIcon: {
    marginRight: spacing.sm
  },
  textInput: {
    flex: 1,
    fontFamily: typography.family.regular,
    fontSize: typography.size.md,
    color: colors.textPrimary,
    height: '100%'
  },
  eyeBtn: {
    padding: spacing.xs
  },
  errorText: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.xs,
    color: colors.error,
    marginTop: spacing.xs
  }
});
