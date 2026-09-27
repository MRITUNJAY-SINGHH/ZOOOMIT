import React from 'react';
import { 
  Text, 
  View, 
  ActivityIndicator, 
  Pressable, 
  StyleSheet 
} from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, radius, typography } from '../constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const AppButton = ({
  title,
  children,
  onPress,
  variant = 'primary',
  size = 'lg',
  loading = false,
  isLoading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  accessibilityLabel,
  style,
  textStyle
}) => {
  const isBusy = Boolean(loading || isLoading);
  const isDisabled = Boolean(disabled || isBusy);
  const isPrimary = variant !== 'secondary';

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const handlePressIn = () => {
    if (isDisabled) return;
    scale.value = withSpring(0.98, { damping: 18, stiffness: 300 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 18, stiffness: 300 });
  };

  const getBackgroundColor = (pressed) => {
    if (isPrimary) {
      return pressed ? colors.primaryDark : colors.primary;
    }
    if (isDisabled) return colors.white;
    return pressed ? colors.softBackground : colors.white;
  };

  const buttonHeight = size === 'sm' ? 42 : size === 'md' ? 48 : 54;
  const buttonRadius = size === 'sm' ? radius.md : 16;
  const fontSize = size === 'sm' ? typography.size.sm : 16;

  const content = title || children;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || (typeof content === 'string' ? content : 'Button')}
      accessibilityState={{ disabled: isDisabled, busy: isBusy }}
      onPress={isDisabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          height: buttonHeight,
          borderRadius: buttonRadius,
          backgroundColor: getBackgroundColor(pressed),
          borderColor: isPrimary ? 'transparent' : (colors.borderLight || colors.border),
          borderWidth: isPrimary ? 0 : 1,
          width: fullWidth ? '100%' : 'auto',
          opacity: isDisabled ? 0.55 : 1
        },
        animatedStyle,
        style
      ]}
    >
      {isBusy ? (
        <ActivityIndicator 
          size="small" 
          color={colors.black} 
        />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && (
            <View style={styles.leftIconContainer}>{icon}</View>
          )}
          {typeof content === 'string' ? (
            <Text
              style={[
                styles.text,
                {
                  fontSize,
                  color: isPrimary ? colors.black : (isDisabled ? colors.textMuted : colors.textPrimary),
                  fontFamily: isPrimary ? typography.family.bold : typography.family.semibold
                },
                textStyle
              ]}
              numberOfLines={1}
            >
              {content}
            </Text>
          ) : (
            content
          )}
          {icon && iconPosition === 'right' && (
            <View style={styles.rightIconContainer}>{icon}</View>
          )}
        </View>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  text: {
    textAlign: 'center',
    letterSpacing: -0.2
  },
  leftIconContainer: {
    marginRight: 8
  },
  rightIconContainer: {
    marginLeft: 8
  }
});
