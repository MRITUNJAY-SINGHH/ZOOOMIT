import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Smartphone, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';
import { AppInput } from '../../components/AppInput';
import { AppButton } from '../../components/AppButton';
import { StorefrontAPI } from '../../services/api';

export default function ForgotPasswordScreen() {
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const canSubmit = identifier.trim().length > 0;

  const handleSubmit = async () => {
    if (!identifier.trim()) {
      setErrorMessage('Please enter your registered phone number or email');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      const isEmail = identifier.includes('@');
      const payload = isEmail 
        ? { email: identifier.trim() } 
        : { phone: identifier.trim() };
      
      const res = await StorefrontAPI.forgotPassword(payload);
      setSuccessMessage(
        res.data?.message || 'If an account exists with this identifier, instructions to reset your password have been sent.'
      );
      setIsSuccess(true);
    } catch (e) {
      setErrorMessage(e.response?.data?.message || 'Failed to process request. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
          {/* Top Bar with Standard Back Navigation */}
          <View style={styles.topBar}>
            <TouchableOpacity 
              style={styles.backBtn}
              onPress={() => router.back()}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ArrowLeft size={20} color={colors.textPrimary} style={{ marginRight: 4 }} />
              <Text style={styles.backText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Hero Section */}
          <Animated.View 
            entering={FadeInDown.duration(400)}
            style={styles.heroSection}
          >
            <View style={styles.imageWrapper}>
              <Image
                source={require('../../../assets/images/auth/auth_security.jpg')}
                style={styles.heroImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandTitle}>Recover Account</Text>
            <Text style={styles.brandSubtitle}>
              Enter your registered phone number or email to receive password reset instructions.
            </Text>
          </Animated.View>

          {/* Solid Elevated Card */}
          <Animated.View 
            entering={FadeInDown.duration(450).delay(100)}
            style={styles.card}
          >
            {isSuccess ? (
              <Animated.View entering={FadeInUp.duration(300)} style={styles.successContainer}>
                <View style={styles.successIconCircle}>
                  <CheckCircle2 size={36} color={colors.success} />
                </View>
                <Text style={styles.successTitle}>Request Processed</Text>
                <Text style={styles.successMessage}>{successMessage}</Text>

                <AppButton
                  title="Enter Reset Code"
                  onPress={() => router.push('/(auth)/reset-password')}
                  variant="primary"
                  size="lg"
                  style={{ width: '100%', marginBottom: spacing.md }}
                />

                <AppButton
                  title="Back to Sign In"
                  onPress={() => router.replace('/(auth)/login')}
                  variant="secondary"
                  size="md"
                  style={{ width: '100%' }}
                />
              </Animated.View>
            ) : (
              <>
                {Boolean(errorMessage) && (
                  <Animated.View entering={FadeInUp.duration(200)} style={styles.errorBox}>
                    <AlertCircle size={16} color={colors.error} style={{ marginRight: spacing.xs }} />
                    <Text style={styles.errorBoxText}>{errorMessage}</Text>
                  </Animated.View>
                )}

                <AppInput
                  label="Phone Number or Email"
                  placeholder="e.g. 9876543210 or name@example.com"
                  value={identifier}
                  onChangeText={(text) => {
                    setIdentifier(text);
                    if (errorMessage) setErrorMessage('');
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  clearable
                  leftIcon={<Smartphone size={18} />}
                />

                <AppButton
                  title="Send Reset Instructions"
                  onPress={handleSubmit}
                  isLoading={isLoading}
                  disabled={!canSubmit && !isLoading}
                  size="lg"
                  style={styles.submitBtn}
                />
              </>
            )}
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
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    justifyContent: 'center'
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
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.xl
  },
  imageWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border
  },
  heroImage: {
    width: '90%',
    height: '90%'
  },
  brandTitle: {
    fontSize: typography.size['2xl'],
    fontFamily: typography.family?.bold || undefined,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4
  },
  brandSubtitle: {
    fontSize: typography.size.sm,
    fontFamily: typography.family?.regular || undefined,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
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
  submitBtn: {
    width: '100%',
    marginTop: spacing.sm
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md
  },
  successTitle: {
    fontSize: typography.size.lg,
    fontFamily: typography.family?.bold || undefined,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  successMessage: {
    fontSize: typography.size.sm,
    fontFamily: typography.family?.regular || undefined,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl
  }
});
