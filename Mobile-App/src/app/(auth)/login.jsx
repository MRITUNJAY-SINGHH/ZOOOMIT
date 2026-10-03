import React, { useState, useRef, useEffect } from 'react';
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
  ImageBackground,
  ScrollView,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  FadeIn
} from 'react-native-reanimated';
import { ArrowLeft, ArrowRight, X, AlertCircle, ChevronDown, Check, RefreshCw } from 'lucide-react-native';
import { colors, typography, spacing } from '../../constants/theme';
import { StorefrontAPI } from '../../services/api';
import { haptics } from '../../services/haptics';
import { useAuth } from '../../context/AuthContext';

const { height } = Dimensions.get('window');

export default function MobileLoginScreen() {
  const { loginWithOtp } = useAuth();

  // Phone input states
  const [phone, setPhone] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const inputRef = useRef(null);

  // Reanimated values for phone screen
  const btnScale = useSharedValue(1);
  const inputScale = useSharedValue(1);
  const isComplete = phone.trim().length === 10;

  // Half-screen OTP verification states
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [resendCount, setResendCount] = useState(24);
  const [isResending, setIsResending] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  const [resendFeedback, setResendFeedback] = useState('');

  const otpInputRef = useRef(null);
  const shakeX = useSharedValue(0);
  const verifyBtnScale = useSharedValue(1);

  // Resend timer countdown
  useEffect(() => {
    if (!showVerifyModal || resendCount <= 0) return;
    const interval = setInterval(() => {
      setResendCount((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [showVerifyModal, resendCount]);

  const handlePhoneChange = (text) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 10);
    setPhone(cleaned);
    if (errorMessage) setErrorMessage('');

    if (cleaned.length === 10 && phone.length < 10) {
      haptics.impactLight();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    inputScale.value = withSpring(1.01, { damping: 14, stiffness: 200 });
  };

  const handleBlur = () => {
    setIsFocused(false);
    inputScale.value = withSpring(1, { damping: 14, stiffness: 200 });
  };

  const animatedInputStyle = useAnimatedStyle(() => ({
    transform: [{ scale: inputScale.value }]
  }));

  const handlePressIn = () => {
    if (!isComplete || isLoading) return;
    btnScale.value = withSpring(0.98, { damping: 18, stiffness: 300 });
  };

  const handlePressOut = () => {
    btnScale.value = withSpring(1, { damping: 18, stiffness: 300 });
  };

  const animatedBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }]
  }));

  // Shake animation for incorrect OTP
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

  const handleVerifyPressIn = () => {
    if (otp.length !== 6 || isVerifying) return;
    verifyBtnScale.value = withSpring(0.98, { damping: 18, stiffness: 300 });
  };

  const handleVerifyPressOut = () => {
    verifyBtnScale.value = withSpring(1, { damping: 18, stiffness: 300 });
  };

  const animatedVerifyBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: verifyBtnScale.value }]
  }));

  // Send the code, then continue to the dedicated verification screen.
  const handleContinue = async () => {
    if (!isComplete) {
      triggerShake();
      setErrorMessage('Please enter a valid 10-digit mobile number');
      inputRef.current?.focus();
      return;
    }
    if (isLoading) return;

    Keyboard.dismiss();
    setIsLoading(true);
    setErrorMessage('');
    haptics.impactLight();

    try {
      const res = await StorefrontAPI.sendOtp(phone);
      router.push({
        pathname: '/(auth)/otp',
        params: { phone, devOtp: res?.devOtp || '' }
      });
    } catch (err) {
      haptics.notificationError();
      const message = err.response?.data?.message || 'Failed to send verification code. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP submission
  const handleVerifyOtp = async (codeToVerify) => {
    const code = codeToVerify || otp;
    if (code.length !== 6 || isVerifying || isVerified) return;

    Keyboard.dismiss();
    setIsVerifying(true);
    setVerifyError('');

    try {
      await loginWithOtp(phone, code);
      setIsVerifying(false);
      setIsVerified(true);
      haptics.notificationSuccess();

      setTimeout(() => {
        setShowVerifyModal(false);
        router.replace('/(tabs)');
      }, 300);
    } catch (err) {
      setIsVerifying(false);
      const msg = err.response?.data?.message || err.message || 'The OTP you entered is incorrect. Please try again.';
      setVerifyError(msg);
      triggerErrorShake();
      otpInputRef.current?.focus();
    }
  };

  const handleOtpChange = (text) => {
    if (isVerified || isVerifying) return;
    const cleaned = text.replace(/\D/g, '').slice(0, 6);
    setOtp(cleaned);
    if (verifyError) setVerifyError('');

    if (cleaned.length > otp.length) {
      haptics.selection();
    }

    if (cleaned.length === 6) {
      handleVerifyOtp(cleaned);
    }
  };

  const handleResendOtp = async () => {
    if (resendCount > 0 || isResending) return;

    setIsResending(true);
    setVerifyError('');
    haptics.impactLight();

    try {
      const res = await StorefrontAPI.sendOtp(phone);
      setResendCount(24);
      setDevOtp(res?.devOtp || '');
      setResendFeedback(
        res?.devOtp ? `Testing OTP: ${res.devOtp}` : 'New verification code sent!'
      );
      setOtp('');
      otpInputRef.current?.focus();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend code. Please try again.';
      setVerifyError(msg);
      haptics.notificationError();
    } finally {
      setIsResending(false);
    }
  };

  const handleBack = () => {
    haptics.impactLight();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <ImageBackground
      source={require('../../../assets/images/auth/auth_phone_bg.jpg')}
      style={styles.bgImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView 
              contentContainerStyle={styles.scrollContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Animated.View 
                entering={FadeIn.duration(300)} 
                style={styles.navBar}
              >
                <Pressable
                  onPress={handleBack}
                  style={styles.backButton}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <ArrowLeft size={20} color={colors.textPrimary} strokeWidth={2.4} />
                </Pressable>
              </Animated.View>

              <View style={styles.heroSpacer} />

              <View style={styles.cardContent}>
                <Animated.View entering={FadeIn.delay(50).duration(300)}>
                  <Text style={styles.title}>What's your mobile number?</Text>
                  <Text style={styles.subtitle}>
                    We'll send you a verification code to continue.
                  </Text>
                </Animated.View>

                {Boolean(errorMessage) && (
                  <Animated.View 
                    entering={FadeIn.duration(200)} 
                    style={styles.errorBox}
                  >
                    <AlertCircle size={16} color={colors.error} style={{ marginRight: spacing.xs }} />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </Animated.View>
                )}

                {/* Wrap layout animation in outer Animated.View to avoid transform conflict */}
                <Animated.View entering={FadeIn.duration(300)}>
                  <Animated.View 
                    style={[
                      styles.inputCard,
                      isFocused && styles.inputCardFocused,
                      isComplete && styles.inputCardComplete,
                      Boolean(errorMessage) && styles.inputCardError,
                      animatedInputStyle
                    ]}
                  >
                    <View style={styles.countryPill}>
                      <Text style={styles.flagEmoji}>🇮🇳</Text>
                      <Text style={styles.countryCode}>+91</Text>
                      <ChevronDown size={14} color={colors.textSecondary} style={{ marginLeft: 2 }} />
                      <View style={styles.dividerPipe} />
                    </View>

                    <TextInput
                      ref={inputRef}
                      style={styles.phoneInput}
                      value={phone}
                      onChangeText={handlePhoneChange}
                      placeholder="98765 43210"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="phone-pad"
                      maxLength={10}
                      autoFocus={true}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                      selectionColor={colors.primaryDark}
                      accessibilityLabel="Mobile number input"
                    />

                    {phone.length > 0 && (
                      <Pressable
                        onPress={() => {
                          setPhone('');
                          if (errorMessage) setErrorMessage('');
                          inputRef.current?.focus();
                        }}
                        style={styles.clearBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <X size={14} color={colors.textSecondary} strokeWidth={2.4} />
                      </Pressable>
                    )}
                  </Animated.View>
                </Animated.View>

                {isComplete && !errorMessage && (
                  <Animated.View 
                    entering={FadeIn.duration(200)}
                    style={styles.validFeedbackRow}
                  >
                    <View style={styles.validCheckCircle}>
                      <Check size={11} color={colors.white} strokeWidth={3.5} />
                    </View>
                    <Text style={styles.validFeedbackText}>Looks good!</Text>
                  </Animated.View>
                )}

                {/* Wrap layout animation in outer Animated.View to avoid transform conflict */}
                <Animated.View 
                  entering={FadeIn.duration(300)} 
                  style={styles.ctaWrapper}
                >
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
                      onPress={handleContinue}
                      accessibilityRole="button"
                      accessibilityLabel="Continue"
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color={colors.black} />
                      ) : (
                        <>
                          <Text style={styles.ctaText}>
                            Continue
                          </Text>
                          <View style={styles.ctaIconCircle}>
                            <ArrowRight 
                              size={18} 
                              color="#FFFFFF" 
                              strokeWidth={2.8} 
                            />
                          </View>
                        </>
                      )}
                    </Pressable>
                  </Animated.View>
                </Animated.View>

                <View style={styles.legalContainer}>
                  <Text style={styles.legalNotice}>
                    By continuing, you agree to our{' '}
                    <Text 
                      style={styles.legalLink}
                      onPress={() => {
                        haptics.selection();
                        router.push('/privacy');
                      }}
                    >
                      Privacy Policy
                    </Text>
                    {' and '}
                    <Text 
                      style={styles.legalLink}
                      onPress={() => {
                        haptics.selection();
                        router.push('/terms');
                      }}
                    >
                      Terms of Use
                    </Text>
                  </Text>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </SafeAreaView>

      {/* Half-Screen Verification Bottom Sheet */}
      <Modal
        visible={showVerifyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowVerifyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setShowVerifyModal(false)}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.sheetContainer}
          >
            <View style={styles.halfScreenCard}>
              {/* Drag Handle */}
              <View style={styles.dragHandleBar} />

              {/* Sheet Header */}
              <View style={styles.sheetHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetTitle}>Verify your number</Text>
                  <View style={styles.sheetPhoneRow}>
                    <Text style={styles.sheetPhoneText}>
                      Sent to +91 {phone.slice(0, 5)} {phone.slice(5)}
                    </Text>
                    <Pressable 
                      onPress={() => setShowVerifyModal(false)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityRole="button"
                      accessibilityLabel="Change mobile number"
                    >
                      <Text style={styles.sheetChangeText}>Change</Text>
                    </Pressable>
                  </View>
                </View>

                <Pressable
                  onPress={() => setShowVerifyModal(false)}
                  style={styles.sheetCloseBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Close verification"
                >
                  <X size={18} color={colors.textPrimary} strokeWidth={2.4} />
                </Pressable>
              </View>

              {/* Dev Mode Test OTP banner */}
              {Boolean(resendFeedback) && !verifyError && (
                <Pressable 
                  onPress={() => {
                    if (devOtp) {
                      setOtp(devOtp);
                      handleVerifyOtp(devOtp);
                    }
                  }}
                  style={styles.feedbackBanner}
                >
                  <Text style={styles.feedbackText}>
                    {resendFeedback} {devOtp ? '• Tap to auto-fill' : ''}
                  </Text>
                </Pressable>
              )}

              {/* Error banner */}
              {Boolean(verifyError) && (
                <View style={styles.errorBox}>
                  <AlertCircle size={16} color={colors.error} style={{ marginRight: spacing.xs }} />
                  <Text style={styles.errorText}>{verifyError}</Text>
                </View>
              )}

              {/* 6 OTP Boxes */}
              <Animated.View style={[styles.boxesContainer, animatedBoxesStyle]}>
                {[0, 1, 2, 3, 4, 5].map((index) => {
                  const digit = otp[index] || '';
                  const isCurrent = index === otp.length;
                  const isFilled = Boolean(digit);
                  const isErr = Boolean(verifyError);

                  return (
                    <Pressable
                      key={index}
                      onPress={() => otpInputRef.current?.focus()}
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

              {/* Hidden OTP input */}
              <TextInput
                ref={otpInputRef}
                value={otp}
                onChangeText={handleOtpChange}
                keyboardType="number-pad"
                maxLength={6}
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
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
              <View style={styles.sheetCtaWrapper}>
                <Animated.View style={animatedVerifyBtnStyle}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.sheetCtaButton,
                      {
                        backgroundColor: pressed ? colors.primaryDark : colors.primary
                      }
                    ]}
                    onPressIn={handleVerifyPressIn}
                    onPressOut={handleVerifyPressOut}
                    onPress={() => {
                      if (otp.length < 6) {
                        setVerifyError('Please enter the complete 6-digit OTP');
                        triggerErrorShake();
                        otpInputRef.current?.focus();
                        return;
                      }
                      handleVerifyOtp(otp);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Verify & Continue"
                  >
                    {isVerifying ? (
                      <View style={styles.verifyingRow}>
                        <ActivityIndicator size="small" color={colors.black} style={{ marginRight: 8 }} />
                        <Text style={styles.sheetCtaText}>Verifying code...</Text>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.sheetCtaText}>Verify & Continue</Text>
                        <View style={styles.ctaIconCircle}>
                          <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.8} />
                        </View>
                      </>
                    )}
                  </Pressable>
                </Animated.View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%'
  },
  safeArea: {
    flex: 1
  },
  keyboardView: {
    flex: 1
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
    paddingBottom: spacing.lg
  },
  navBar: {
    paddingVertical: spacing.md
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
  heroSpacer: {
    height: height * 0.32
  },
  cardContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingTop: spacing.xs
  },
  title: {
    fontSize: 27,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    lineHeight: 34,
    marginBottom: 6
  },
  subtitle: {
    fontSize: 14,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.lg
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
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    height: 54
  },
  inputCardFocused: {
    borderColor: colors.primary,
    borderWidth: 1.5
  },
  inputCardComplete: {
    borderColor: colors.primary
  },
  inputCardError: {
    borderColor: colors.error
  },
  countryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.sm
  },
  flagEmoji: {
    fontSize: 18,
    fontFamily: typography.family.regular,
    marginRight: 4
  },
  countryCode: {
    fontSize: 16,
    fontFamily: typography.family.semibold,
    color: colors.textPrimary
  },
  dividerPipe: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
    marginLeft: spacing.sm
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    fontFamily: typography.family.semibold,
    color: colors.textPrimary,
    paddingHorizontal: spacing.sm,
    height: '100%',
    letterSpacing: 1
  },
  clearBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.softBackground,
    justifyContent: 'center',
    alignItems: 'center'
  },
  validFeedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    paddingLeft: spacing.xs,
    marginBottom: spacing.xs
  },
  validCheckCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center'
  },
  validFeedbackText: {
    fontSize: 12,
    fontFamily: typography.family.semibold,
    color: colors.success
  },
  ctaWrapper: {
    width: '100%',
    marginTop: spacing.md,
    marginBottom: spacing.sm
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
  legalContainer: {
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignSelf: 'center'
  },
  legalNotice: {
    fontSize: 11,
    fontFamily: typography.family.medium,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 16
  },
  legalLink: {
    textDecorationLine: 'underline',
    color: '#FFFFFF',
    fontFamily: typography.family.bold
  },

  // Half-Screen Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)'
  },
  modalBackdrop: {
    flex: 1
  },
  sheetContainer: {
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
  sheetTitle: {
    fontSize: 22,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    lineHeight: 28,
    marginBottom: 2
  },
  sheetPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs
  },
  sheetPhoneText: {
    fontSize: 14,
    fontFamily: typography.family.medium,
    color: colors.textSecondary
  },
  sheetChangeText: {
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
  sheetCtaWrapper: {
    width: '100%',
    marginTop: spacing.xs
  },
  sheetCtaButton: {
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    position: 'relative'
  },
  sheetCtaText: {
    fontSize: 16,
    fontFamily: typography.family.bold,
    color: colors.black
  },
  verifyingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  }
});
