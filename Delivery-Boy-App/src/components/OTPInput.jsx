import React, { useRef, useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { colors, typography, radius, spacing } from '../constants/theme';
import { hapticFeedback } from '../services/haptics';

export const OTPInput = ({ length = 4, onComplete, onChangeOtp, error = false }) => {
  const [digits, setDigits] = useState(new Array(length).fill(''));
  const inputsRef = useRef([]);

  const handleChange = (text, index) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    const newDigits = [...digits];

    if (cleaned.length > 1) {
      // Handle paste
      const pasted = cleaned.slice(0, length).split('');
      for (let i = 0; i < length; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setDigits(newDigits);
      const fullCode = newDigits.join('');
      onChangeOtp?.(fullCode);
      if (fullCode.length === length) {
        onComplete?.(fullCode);
      }
      return;
    }

    newDigits[index] = cleaned;
    setDigits(newDigits);
    hapticFeedback.selection();

    const fullCode = newDigits.join('');
    onChangeOtp?.(fullCode);

    if (cleaned && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    if (fullCode.length === length) {
      onComplete?.(fullCode);
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      {digits.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref) => (inputsRef.current[index] = ref)}
          value={digit}
          onChangeText={(val) => handleChange(val, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
          style={[
            styles.box,
            Boolean(digit) && styles.boxFilled,
            error && styles.boxError
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginVertical: spacing.md
  },
  box: {
    width: 60,
    height: 64,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSubtle,
    fontFamily: typography.family.heavy,
    fontSize: typography.size['2xl'],
    color: colors.textPrimary,
    textAlign: 'center'
  },
  boxFilled: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.surface
  },
  boxError: {
    borderColor: colors.error,
    backgroundColor: colors.errorSubtle
  }
});
