import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ImageBackground, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { AlertCircle, ArrowLeft, ArrowRight, Check, LockKeyhole, RefreshCw } from 'lucide-react-native';
import { colors, spacing, typography } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { StorefrontAPI } from '../../services/api';
import { haptics } from '../../services/haptics';

const CODE_LENGTH = 6;

export default function OtpVerificationScreen() {
  const { phone = '', devOtp = '' } = useLocalSearchParams();
  const { loginWithOtp } = useAuth();
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resendCount, setResendCount] = useState(24);
  const [isResending, setIsResending] = useState(false);
  const [resendFeedback, setResendFeedback] = useState(devOtp ? `For testing: ${devOtp}` : '');
  const [currentDevOtp, setCurrentDevOtp] = useState(String(devOtp));
  const inputRef = useRef(null);
  const shakeX = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  const formattedPhone = useMemo(() => {
    const digits = String(phone).replace(/\D/g, '').slice(-10);
    return digits.length === 10 ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : `+91 ${phone}`;
  }, [phone]);
  const boxesAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));
  const buttonAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: buttonScale.value }] }));

  useEffect(() => {
    if (resendCount <= 0) return undefined;
    const timer = setInterval(() => setResendCount((value) => value - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCount]);

  const showError = (message) => {
    setErrorMessage(message);
    haptics.notificationError();
    shakeX.value = withSequence(withTiming(-10, { duration: 45 }), withTiming(10, { duration: 45 }), withTiming(-7, { duration: 45 }), withTiming(7, { duration: 45 }), withTiming(0, { duration: 45 }));
  };

  const verifyCode = async (value = otp) => {
    if (value.length !== CODE_LENGTH || isVerifying || isSuccess) return;
    Keyboard.dismiss();
    setIsVerifying(true);
    setErrorMessage('');
    try {
      await loginWithOtp(phone, value);
      setIsSuccess(true);
      haptics.notificationSuccess();
      setTimeout(() => router.replace('/(tabs)'), 550);
    } catch (error) {
      showError(error.response?.data?.message || error.message || 'That code did not match. Try again.');
      inputRef.current?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleChange = (value) => {
    if (isVerifying || isSuccess) return;
    const nextOtp = value.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setOtp(nextOtp);
    if (errorMessage) setErrorMessage('');
    if (nextOtp.length > otp.length) haptics.selection();
    if (nextOtp.length === CODE_LENGTH) verifyCode(nextOtp);
  };

  const resendCode = async () => {
    if (resendCount || isResending) return;
    setIsResending(true);
    setErrorMessage('');
    haptics.impactLight();
    try {
      const response = await StorefrontAPI.sendOtp(phone);
      setResendCount(24);
      setOtp('');
      setCurrentDevOtp(String(response?.devOtp || ''));
      setResendFeedback(response?.devOtp ? `For testing: ${response.devOtp}` : 'A fresh code is on its way.');
      inputRef.current?.focus();
    } catch (error) {
      showError(error.response?.data?.message || 'We could not resend the code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  if (isSuccess) {
    return <View style={styles.successScreen}><Animated.View entering={FadeIn.duration(220)} style={styles.successContent}><View style={styles.successIcon}><Check size={36} color={colors.black} strokeWidth={3.5} /></View><Text style={styles.successTitle}>Number verified</Text><Text style={styles.successSubtitle}>Opening your Kuiklo store…</Text></Animated.View></View>;
  }

  return (
    <ImageBackground source={require('../../../assets/images/auth/auth_verify_bg.jpg')} style={styles.background} resizeMode="cover">
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeIn.duration(250)} style={styles.topBar}>
              <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Change mobile number"><ArrowLeft size={20} color={colors.textPrimary} strokeWidth={2.5} /></Pressable>
              <View style={styles.secureChip}><LockKeyhole size={13} color={colors.textPrimary} /><Text style={styles.secureChipText}>Secure verification</Text></View>
            </Animated.View>
            <View style={styles.spacer} />
            <Animated.View entering={FadeIn.delay(80).duration(280)} style={styles.card}>
              <View style={styles.stepRow}><View style={styles.stepActive}><Text style={styles.stepNumber}>2</Text></View><Text style={styles.stepLabel}>Confirm your number</Text></View>
              <Text style={styles.title}>Enter verification code</Text>
              <Text style={styles.subtitle}>We sent a 6-digit code to <Text style={styles.phone}>{formattedPhone}</Text></Text>
              <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Change mobile number"><Text style={styles.changeNumber}>Change number</Text></Pressable>
              {Boolean(resendFeedback) && !errorMessage && <Pressable onPress={() => currentDevOtp && handleChange(currentDevOtp)} style={styles.testingBanner} accessibilityRole="button" accessibilityLabel="Use test verification code"><Text style={styles.testingText}>{resendFeedback}{currentDevOtp ? ' · Tap to use it' : ''}</Text></Pressable>}
              {Boolean(errorMessage) && <View style={styles.errorBox} accessibilityRole="alert"><AlertCircle size={16} color={colors.error} /><Text style={styles.errorText}>{errorMessage}</Text></View>}
              <View style={styles.codeInputArea}>
                <Animated.View style={[styles.codeRow, boxesAnimatedStyle]} pointerEvents="none">
                  {Array.from({ length: CODE_LENGTH }, (_, index) => { const digit = otp[index] || ''; const active = index === otp.length; return <View key={index} style={[styles.codeBox, active && styles.codeBoxActive, Boolean(digit) && styles.codeBoxFilled, Boolean(errorMessage) && styles.codeBoxError]}><Text style={styles.codeDigit}>{digit}</Text>{active && !digit && !errorMessage && <View style={styles.cursor} />}</View>; })}
                </Animated.View>
                <TextInput ref={inputRef} value={otp} onChangeText={handleChange} keyboardType="number-pad" inputMode="numeric" maxLength={CODE_LENGTH} textContentType="oneTimeCode" autoComplete="sms-otp" autoFocus showSoftInputOnFocus style={styles.otpInput} accessibilityLabel="Six digit verification code" />
              </View>
              <View style={styles.resendRow}><Text style={styles.resendPrompt}>Didn’t receive a code?</Text>{resendCount > 0 ? <Text style={styles.countdown}>Resend in {resendCount}s</Text> : <Pressable onPress={resendCode} disabled={isResending} style={styles.resendButton} accessibilityRole="button" accessibilityLabel="Resend code">{isResending ? <ActivityIndicator size="small" color={colors.primaryDark} /> : <><RefreshCw size={14} color={colors.primaryDark} /><Text style={styles.resendText}>Resend code</Text></>}</Pressable>}</View>
              <Animated.View style={buttonAnimatedStyle}><Pressable onPress={() => otp.length === CODE_LENGTH ? verifyCode() : showError('Enter all 6 digits to continue.')} onPressIn={() => otp.length === CODE_LENGTH && !isVerifying && (buttonScale.value = withSpring(0.985))} onPressOut={() => (buttonScale.value = withSpring(1))} style={({ pressed }) => [styles.verifyButton, pressed && styles.verifyButtonPressed]} accessibilityRole="button" accessibilityLabel="Verify and continue">{isVerifying ? <View style={styles.verifying}><ActivityIndicator size="small" color={colors.black} /><Text style={styles.verifyText}>Verifying…</Text></View> : <><Text style={styles.verifyText}>Verify & continue</Text><View style={styles.arrowCircle}><ArrowRight size={18} color={colors.white} strokeWidth={2.8} /></View></>}</Pressable></Animated.View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 }, overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(17, 24, 39, 0.32)' }, safeArea: { flex: 1 }, keyboardView: { flex: 1 }, page: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg }, topBar: { paddingTop: spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, secureChip: { flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.94)' }, secureChipText: { color: colors.textPrimary, fontSize: 12, fontFamily: typography.family.bold }, spacer: { flex: 1, minHeight: spacing.xl }, card: { backgroundColor: colors.white, borderRadius: 26, padding: spacing.lg, shadowColor: colors.black, shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 7 }, stepRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md }, stepActive: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }, stepNumber: { color: colors.black, fontSize: 12, fontFamily: typography.family.bold }, stepLabel: { color: colors.textSecondary, fontSize: 12, fontFamily: typography.family.semibold, textTransform: 'uppercase', letterSpacing: 0.4 }, title: { fontSize: 26, lineHeight: 32, color: colors.textPrimary, fontFamily: typography.family.bold, marginBottom: 6 }, subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontFamily: typography.family.regular }, phone: { color: colors.textPrimary, fontFamily: typography.family.bold }, changeNumber: { color: colors.primaryDark, fontSize: 13, fontFamily: typography.family.bold, marginTop: 6, alignSelf: 'flex-start' }, testingBanner: { marginTop: spacing.md, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: colors.primarySoft }, testingText: { textAlign: 'center', fontSize: 12, fontFamily: typography.family.medium, color: colors.textPrimary }, errorBox: { marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 11, borderRadius: 12, backgroundColor: colors.errorSubtle }, errorText: { flex: 1, color: colors.error, fontFamily: typography.family.medium, fontSize: 12 }, codeInputArea: { position: 'relative' }, codeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg, marginBottom: spacing.md }, codeBox: { width: 45, height: 54, borderRadius: 13, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.softBackground }, codeBoxActive: { borderColor: colors.primaryDark, borderWidth: 1.5, backgroundColor: colors.white }, codeBoxFilled: { backgroundColor: colors.white, borderColor: colors.textPrimary }, codeBoxError: { borderColor: colors.error, backgroundColor: colors.errorSubtle }, codeDigit: { color: colors.textPrimary, fontSize: 22, fontFamily: typography.family.bold }, cursor: { width: 13, height: 2, position: 'absolute', bottom: 10, borderRadius: 2, backgroundColor: colors.primaryDark }, otpInput: { position: 'absolute', top: spacing.lg, left: 0, right: 0, height: 54, opacity: 0.02, zIndex: 2 }, resendRow: { minHeight: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }, resendPrompt: { color: colors.textSecondary, fontFamily: typography.family.medium, fontSize: 12 }, countdown: { color: colors.textPrimary, fontFamily: typography.family.bold, fontSize: 12 }, resendButton: { flexDirection: 'row', alignItems: 'center', gap: 5 }, resendText: { color: colors.primaryDark, fontFamily: typography.family.bold, fontSize: 12 }, verifyButton: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', backgroundColor: colors.primary, position: 'relative' }, verifyButtonPressed: { backgroundColor: colors.primaryDark }, verifyText: { color: colors.black, fontFamily: typography.family.bold, fontSize: 16 }, arrowCircle: { position: 'absolute', right: 9, width: 38, height: 38, borderRadius: 19, backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center' }, verifying: { flexDirection: 'row', gap: 8, alignItems: 'center' }, successScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }, successContent: { alignItems: 'center' }, successIcon: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md }, successTitle: { color: colors.textPrimary, fontSize: 25, fontFamily: typography.family.bold }, successSubtitle: { color: colors.textSecondary, fontSize: 14, fontFamily: typography.family.medium, marginTop: 6 }
});
