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
import { User, Smartphone, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';
import { AppInput } from '../../components/AppInput';
import { AppButton } from '../../components/AppButton';
import { useAuth } from '../../context/AuthContext';

export default function SignupScreen() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isPhoneValid = /^[6-9]\d{9}$/.test(phone.trim());
  const isPasswordValid = password.length >= 6;
  const canSubmit = name.trim().length > 0 && isPhoneValid && isPasswordValid;

  const handleSignup = async () => {
    if (!name.trim() || !phone.trim() || !password) {
      setErrorMessage('Please fill in your name, phone number, and password');
      return;
    }

    if (!isPhoneValid) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      await register({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        password
      });
      router.replace('/(tabs)');
    } catch (e) {
      setErrorMessage(e.response?.data?.message || 'Registration failed. Please try again.');
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
          {/* Header */}
          <Animated.View 
            entering={FadeInDown.duration(400)}
            style={styles.header}
          >
            <Text style={styles.title}>Create an Account</Text>
            <Text style={styles.subtitle}>Sign up to start ordering fresh groceries</Text>
          </Animated.View>

          {/* Solid Elevated Card */}
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
              label="Full Name *"
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errorMessage) setErrorMessage('');
              }}
              clearable
              leftIcon={<User size={18} />}
            />

            <AppInput
              label="Phone Number *"
              placeholder="10-digit mobile number"
              value={phone}
              onChangeText={(text) => {
                setPhone(text.replace(/\D/g, '').slice(0, 10));
                if (errorMessage) setErrorMessage('');
              }}
              keyboardType="phone-pad"
              prefix="+91"
              maxLength={10}
              clearable
              leftIcon={<Smartphone size={18} />}
            />

            <AppInput
              label="Email Address (Optional)"
              placeholder="e.g. rahul@example.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errorMessage) setErrorMessage('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              clearable
              leftIcon={<Mail size={18} />}
            />

            <AppInput
              label="Password *"
              placeholder="Create password (min. 6 characters)"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errorMessage) setErrorMessage('');
              }}
              secureTextEntry
              leftIcon={<Lock size={18} />}
            />

            {/* Password requirements hint */}
            <View style={styles.passwordHintRow}>
              <CheckCircle2 
                size={14} 
                color={isPasswordValid ? colors.success : colors.textMuted} 
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.passwordHintText, isPasswordValid && styles.passwordHintTextValid]}>
                At least 6 characters
              </Text>
            </View>

            {/* Legal Notice */}
            <Text style={styles.termsText}>
              By signing up, you agree to Kuiklo's Terms of Service & Privacy Policy.
            </Text>

            {/* Submit Button */}
            <AppButton
              title="Create Account"
              onPress={handleSignup}
              isLoading={isLoading}
              disabled={!canSubmit && !isLoading}
              size="lg"
              style={styles.submitBtn}
            />
          </Animated.View>

          {/* Footer */}
          <Animated.View 
            entering={FadeInDown.duration(450).delay(200)}
            style={styles.footer}
          >
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity 
              onPress={() => router.back()}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
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
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl
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
    textAlign: 'center'
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
  passwordHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -spacing.xs,
    marginBottom: spacing.md
  },
  passwordHintText: {
    fontSize: typography.size.xs,
    fontFamily: typography.family?.regular || undefined,
    color: colors.textMuted
  },
  passwordHintTextValid: {
    color: colors.success,
    fontFamily: typography.family?.medium || undefined
  },
  termsText: {
    fontSize: 11,
    fontFamily: typography.family?.regular || undefined,
    color: colors.textMuted,
    lineHeight: 16,
    marginBottom: spacing.lg,
    textAlign: 'center'
  },
  submitBtn: {
    width: '100%'
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingBottom: spacing.sm
  },
  footerText: {
    fontSize: typography.size.sm,
    fontFamily: typography.family?.regular || undefined,
    color: colors.textSecondary
  },
  loginLink: {
    fontSize: typography.size.sm,
    fontFamily: typography.family?.bold || undefined,
    color: colors.primary,
    fontWeight: typography.weight.bold
  }
});
