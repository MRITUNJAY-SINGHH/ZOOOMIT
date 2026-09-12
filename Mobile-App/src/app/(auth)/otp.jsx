import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';
import { AppInput } from '../../components/AppInput';
import { AppButton } from '../../components/AppButton';

export default function OtpScreen() {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const canSubmit = otp.trim().length >= 4;

  const handleVerify = async () => {
    if (otp.trim().length < 4) {
      setErrorMessage('Please enter the verification code');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setTimeout(() => {
      setIsLoading(false);
      router.replace('/(tabs)');
    }, 800);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <TouchableOpacity 
              style={styles.backBtn}
              onPress={() => router.back()}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ArrowLeft size={20} color={colors.textPrimary} style={{ marginRight: 4 }} />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </View>

          <Animated.View 
            entering={FadeInDown.duration(400)}
            style={styles.header}
          >
            <View style={styles.iconCircle}>
              <ShieldCheck size={36} color={colors.primary} />
            </View>
            <Text style={styles.title}>Verification Code</Text>
            <Text style={styles.subtitle}>
              Enter the verification code sent to your phone
            </Text>
          </Animated.View>

          <Animated.View 
            entering={FadeInDown.duration(450).delay(100)}
            style={styles.card}
          >
            {Boolean(errorMessage) && (
              <Animated.View entering={FadeInUp.duration(200)} style={styles.errorBox}>
                <AlertCircle size={16} color={colors.error} style={{ marginRight: spacing.xs }} />
                <Text style={styles.errorBoxText}>{errorMessage}</Text>
              </Animated.View>
            )}

            <AppInput
              label="Verification Code"
              placeholder="• • • •"
              value={otp}
              onChangeText={(text) => {
                setOtp(text);
                if (errorMessage) setErrorMessage('');
              }}
              keyboardType="number-pad"
              maxLength={6}
              style={styles.otpInput}
            />

            <AppButton
              title="Verify & Continue"
              onPress={handleVerify}
              isLoading={isLoading}
              disabled={!canSubmit && !isLoading}
              size="lg"
              style={styles.submitBtn}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  keyboardView: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg
  },
  topBar: {
    marginBottom: spacing.md
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs
  },
  backText: {
    fontSize: typography.size.sm,
    fontFamily: typography.family?.medium || undefined,
    color: colors.textSecondary
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primarySubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  title: {
    fontSize: typography.size['2xl'],
    fontFamily: typography.family?.bold || undefined,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: typography.size.sm,
    fontFamily: typography.family?.regular || undefined,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 20
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorSubtle,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.error
  },
  errorBoxText: {
    flex: 1,
    color: colors.error,
    fontSize: typography.size.xs,
    fontFamily: typography.family?.medium || undefined,
    fontWeight: typography.weight.medium
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 24,
    fontFamily: typography.family?.bold || undefined,
    letterSpacing: 8
  },
  submitBtn: {
    width: '100%',
    marginTop: spacing.sm
  }
});
