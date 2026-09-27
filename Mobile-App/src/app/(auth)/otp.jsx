import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Dimensions,
  ImageBackground
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  FadeIn
} from 'react-native-reanimated';
import { ArrowLeft, ArrowRight, Check, AlertCircle, RefreshCw, X } from 'lucide-react-native';
import { colors, typography, spacing } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { StorefrontAPI } from '../../services/api';
import { haptics } from '../../services/haptics';

const { height } = Dimensions.get('window');

export default function OtpVerificationScreen() {
  const { phone = '', devOtp = '' } = useLocalSearchParams();
  const { loginWithOtp } = useAuth();

  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resendCount, setResendCount] = useState(24);
  const [isResending, setIsResending] = useState(false);
  const [resendFeedback, setResendFeedback] = useState(
    devOtp ? `Testing OTP: ${devOtp}` : ''
  );

  const inputRef = useRef(null);
  const shakeX = useSharedValue(0);
  const successBadgeScale = useSharedValue(0.4);
  const btnScale = useSharedValue(1);

  const formattedPhone = React.useMemo(() => {
    const raw = phone.toString().replace(/\D/g, '').slice(-10);
    if (raw.length === 10) {
      return `+91 ${raw.slice(0, 5)} ${raw.slice(5)}`;
    }
    return `+91 ${phone}`;
  }, [phone]);

  useEffect(() => {
    if (resendCount <= 0) return;
    const interval = setInterval(() => {
      setResendCount((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCount]);

  const triggerErrorShake = () => {
    haptics.notificationError();
    shakeX.value = withSequence(
      withTiming(-12, { duration: 50 }),
      withTiming(12, { duration: 50 }),
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(-4, { duration: 50 }),
      withTiming(4, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  const animatedBoxesStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }]
  }));

  const animatedCelebrationStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successBadgeScale.value }]
  }));

  const handlePressIn = () => {
    if (otp.length !== 6 || isVerifying) return;
    btnScale.value = withSpring(0.98, { damping: 18, stiffness: 300 });
  };

  const handlePressOut = () => {
    btnScale.value = withSpring(1, { damping: 18, stiffness: 300 });
  };

  const animatedBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }]
  }));

  const handleOtpChange = (text) => {
    if (isSuccess || isVerifying) return;
    const cleaned = text.replace(/\D/g, '').slice(0, 6);
    setOtp(cleaned);
    if (errorMessage) setErrorMessage('');

    if (cleaned.length > otp.length) {
      haptics.selection();
    }

    if (cleaned.length === 6) {
      verifyOtpCode(cleaned);
    }
  };

  const verifyOtpCode = async (codeToVerify) => {
    const code = codeToVerify || otp;
    if (code.length !== 6 || isVerifying || isSuccess) return;

    Keyboard.dismiss();
    setIsVerifying(true);
    setErrorMessage('');

    try {
      await loginWithOtp(phone, code);

      setIsVerifying(false);
      setIsSuccess(true);
      haptics.notificationSuccess();
      successBadgeScale.value = withSpring(1, { damping: 10, stiffness: 220 });

      setTimeout(() => {
        router.replace('/(tabs)');
      }, 300);
    } catch (err) {
      setIsVerifying(false);
      const msg = err.response?.data?.message || err.message || 'The OTP you entered is incorrect. Please try again.';
      setErrorMessage(msg);
      triggerErrorShake();
      inputRef.current?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (resendCount > 0 || isResending) return;

    setIsResending(true);
    setErrorMessage('');
    haptics.impactLight();

    try {
      const res = await StorefrontAPI.sendOtp(phone);
      setResendCount(24);
      setResendFeedback(
        res?.devOtp ? `Testing OTP: ${res.devOtp}` : 'New verification code sent!'
      );
      setOtp('');
      inputRef.current?.focus();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend code. Please try again.';
      setErrorMessage(msg);
      haptics.notificationError();
    } finally {
      setIsResending(false);
    }
  };

  const handleChangeNumber = () => {
    haptics.impactLight();
    router.back();
  };

  if (isSuccess) {
    return (
      <View style={styles.celebrationContainer}>
        <Animated.View style={[styles.celebrationContent, animatedCelebrationStyle]}>
          <View style={styles.celebrationIconCircle}>
            <Check size={40} color={colors.black} strokeWidth={3.5} />
          </View>
          <Text style={styles.celebrationTitle}>Verified!</Text>
          <Text style={styles.celebrationSubtitle}>Setting up your Kuiklo experience...</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../../../assets/images/auth/auth_verify_bg.jpg')}
      style={styles.bgImage}
      resizeMode="cover"
    >
      <View style={styles.screenOverlay}>
        <SafeAreaView style={styles.safeTop} edges={['top']}>
          {/* Top backdrop area: tapping dismisses back to phone input */}
          <View style={styles.topBackdropArea}>
            <Pressable
              onPress={handleChangeNumber}
              style={styles.backButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowLeft size={20} color={colors.textPrimary} strokeWidth={2.4} />
            </Pressable>
          </View>
        </SafeAreaView>

        <TouchableWithoutFeedback onPress={handleChangeNumber}>
          <View style={styles.touchableDismissArea} />
        </TouchableWithoutFeedback>

        {/* Half-Screen Bottom Card */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.bottomCardWrapper}
        >
          <View style={styles.halfScreenCard}>
            {/* Center Drag Handle */}
            <View style={styles.dragHandleBar} />

            {/* Header with Title and Change number */}
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Verify your number</Text>
                <View style={styles.phoneRow}>
                  <Text style={styles.phoneText}>Sent to {formattedPhone}</Text>
                  <Pressable 
                    onPress={handleChangeNumber}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel="Change mobile number"
                  >
                    <Text style={styles.changeAction}>Change</Text>
                  </Pressable>
                </View>
              </View>

              <Pressable
                onPress={handleChangeNumber}
                style={styles.sheetCloseBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Close verification"
              >
                <X size={18} color={colors.textPrimary} strokeWidth={2.4} />
              </Pressable>
            </View>

            {/* Dev Mode Test OTP autofill banner */}
            {Boolean(resendFeedback) && !errorMessage && (
              <Pressable 
                onPress={() => {
                  if (devOtp) {
                    setOtp(devOtp);
                    verifyOtpCode(devOtp);
                  }
                }}
                style={styles.feedbackBanner}
              >
                <Text style={styles.feedbackText}>
                  {resendFeedback} {devOtp ? '• Tap to auto-fill' : ''}
                </Text>
              </Pressable>
            )}

            {/* Error box */}
            {Boolean(errorMessage) && (
              <View style={styles.errorBox}>
                <AlertCircle size={16} color={colors.error} style={{ marginRight: spacing.xs }} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* 6 OTP Boxes with Reanimated transform separated from layout animation */}
            <Animated.View entering={FadeIn.duration(300)}>
              <Animated.View style={[styles.boxesContainer, animatedBoxesStyle]}>
                {[0, 1, 2, 3, 4, 5].map((index) => {
                  const digit = otp[index] || '';
                  const isCurrent = index === otp.length;
                  const isFilled = Boolean(digit);
                  const isErr = Boolean(errorMessage);

                  return (
                    <Pressable
                      key={index}
                      onPress={() => inputRef.current?.focus()}
                      style={[
                        styles.otpBox,
                        isCurrent && styles.otpBoxActive,
                        isFilled && styles.otpBoxFilled,
                        isErr && styles.otpBoxError
                      ]}
                    >
                      <Text style={[styles.otpDigit, isErr && styles.otpDigitError]}>
                        {digit}
                      </Text>
                      {isCurrent && !isErr && !digit && (
                        <View style={styles.cursor} />
                      )}
                    </Pressable>
                  );
                })}
              </Animated.View>
            </Animated.View>

            {/* Hidden Input for Keyboard */}
            <TextInput
              ref={inputRef}
              value={otp}
              onChangeText={handleOtpChange}
              keyboardType="number-pad"
              maxLength={6}
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              autoFocus={true}
              style={styles.hiddenInput}
              accessibilityLabel="OTP 6-digit input"
            />

            {/* Resend Countdown row */}
            <View style={styles.resendRow}>
              <View style={styles.timerCircle}>
                <Text style={styles.timerCircleText}>
                  {resendCount > 0 ? `${resendCount}s` : '0s'}
                </Text>
              </View>
              <View style={styles.resendTextCol}>
                <Text style={styles.resendPrompt}>Didn't receive the code?</Text>
                {resendCount > 0 ? (
                  <Text style={styles.resendCountdownActive}>
                    Resend in {resendCount}s
                  </Text>
                ) : (
                  <Pressable 
                    onPress={handleResendOtp}
                    disabled={isResending}
                    style={styles.resendClickable}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel="Resend OTP"
                  >
                    {isResending ? (
                      <ActivityIndicator size="small" color={colors.black} style={{ marginRight: 6 }} />
                    ) : (
                      <RefreshCw size={13} color={colors.black} style={{ marginRight: 4 }} />
                    )}
                    <Text style={styles.resendClickableText}>Resend OTP</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Primary Yellow CTA Button on Verify Screen */}
            <Animated.View entering={FadeIn.duration(300)} style={styles.ctaWrapper}>
              <Animated.View style={animatedBtnStyle}>
                <Pressable
                  style={({ pressed }) => [
                    styles.ctaButton,
                    {
                      backgroundColor: pressed ? colors.primaryDark : colors.primary
                    }
                  ]}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  onPress={() => {
                    if (otp.length < 6) {
                      setErrorMessage('Please enter the complete 6-digit OTP');
                      triggerShake();
                      inputRef.current?.focus();
                      return;
                    }
                    verifyOtpCode(otp);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Verify and Continue"
                >
                  {isVerifying ? (
                    <View style={styles.verifyingRow}>
                      <ActivityIndicator size="small" color={colors.black} style={{ marginRight: 8 }} />
                      <Text style={styles.ctaText}>Verifying code...</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.ctaText}>Verify & Continue</Text>
                      <View style={styles.ctaIconCircle}>
                        <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.8} />
                      </View>
                    </>
                  )}
                </Pressable>
              </Animated.View>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%'
  },
  screenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'space-between'
  },
  safeTop: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs
  },
  topBackdropArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center'
  },
  touchableDismissArea: {
    flex: 1
  },
  bottomCardWrapper: {
    width: '100%'
  },
  halfScreenCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing.xxl : spacing.xl
  },
  dragHandleBar: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md
  },
  title: {
    fontSize: 22,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    lineHeight: 28,
    marginBottom: 2
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs
  },
  phoneText: {
    fontSize: 14,
    fontFamily: typography.family.medium,
    color: colors.textSecondary
  },
  changeAction: {
    fontSize: 14,
    fontFamily: typography.family.bold,
    color: colors.primaryDark
  },
  sheetCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.softBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm
  },
  feedbackBanner: {
    backgroundColor: colors.primarySoft,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primaryLight
  },
  feedbackText: {
    color: colors.textPrimary,
    fontSize: typography.size.xs,
    fontFamily: typography.family.medium,
    textAlign: 'center'
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorSubtle,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.error
  },
  errorText: {
    flex: 1,
    color: colors.error,
    fontSize: typography.size.xs,
    fontFamily: typography.family.medium
  },
  boxesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.md
  },
  otpBox: {
    width: 48,
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  otpBoxActive: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    transform: [{ scale: 1.03 }]
  },
  otpBoxFilled: {
    borderColor: colors.border,
    backgroundColor: colors.white
  },
  otpBoxError: {
    borderColor: colors.error,
    backgroundColor: colors.errorSubtle
  },
  otpDigit: {
    fontSize: 22,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  otpDigitError: {
    color: colors.error
  },
  cursor: {
    position: 'absolute',
    bottom: 10,
    width: 14,
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0.01
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md
  },
  timerCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center'
  },
  timerCircleText: {
    fontSize: 12,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  resendTextCol: {
    justifyContent: 'center'
  },
  resendPrompt: {
    fontSize: typography.size.xs,
    fontFamily: typography.family.regular,
    color: colors.textSecondary
  },
  resendCountdownActive: {
    fontSize: typography.size.sm,
    fontFamily: typography.family.semibold,
    color: colors.textPrimary
  },
  resendClickable: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2
  },
  resendClickableText: {
    fontSize: typography.size.sm,
    fontFamily: typography.family.bold,
    color: colors.black,
    textDecorationLine: 'underline'
  },
  ctaWrapper: {
    width: '100%',
    marginTop: spacing.xs
  },
  ctaButton: {
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    position: 'relative'
  },
  ctaText: {
    fontSize: 16,
    fontFamily: typography.family.bold,
    color: colors.black
  },
  ctaIconCircle: {
    position: 'absolute',
    right: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center'
  },
  verifyingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  celebrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.white
  },
  celebrationContent: {
    alignItems: 'center'
  },
  celebrationIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.white
  },
  celebrationTitle: {
    fontSize: 28,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  celebrationSubtitle: {
    fontSize: typography.size.md,
    fontFamily: typography.family.regular,
    color: colors.textSecondary
  }
});
