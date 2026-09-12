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
import { Lock, Smartphone, ArrowRight, AlertCircle } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';
import { AppInput } from '../../components/AppInput';
import { AppButton } from '../../components/AppButton';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const canSubmit = identifier.trim().length > 0 && password.length > 0;

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      setErrorMessage('Please enter your phone number or email and password');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      await login({ login: identifier.trim(), password });
      router.replace('/(tabs)');
    } catch (e) {
      setErrorMessage(e.response?.data?.message || 'Invalid credentials. Please check and try again.');
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
          {/* Top Hero Brand Header */}
          <Animated.View 
            entering={FadeInDown.duration(400)}
            style={styles.heroSection}
          >
            <View style={styles.imageWrapper}>
              <Image
                source={require('../../../assets/images/auth/auth_groceries.jpg')}
                style={styles.heroImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandTitle}>Welcome to Kuiklo</Text>
            <Text style={styles.brandSubtitle}>Fresh groceries delivered to your door</Text>
          </Animated.View>

          {/* Solid Elevated Login Card */}
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

            <AppInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errorMessage) setErrorMessage('');
              }}
              secureTextEntry
              leftIcon={<Lock size={18} />}
            />

            {/* Forgot Password */}
            <TouchableOpacity 
              style={styles.forgotBtn}
              onPress={() => router.push('/(auth)/forgot-password')}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Primary Sign In Button */}
            <AppButton
              title="Sign In"
              onPress={handleLogin}
              isLoading={isLoading}
              disabled={!canSubmit && !isLoading}
              size="lg"
              style={styles.submitBtn}
            />

            {/* Guest Exploration Option */}
            <TouchableOpacity 
              style={styles.guestBtn}
              onPress={() => router.replace('/(tabs)')}
              activeOpacity={0.7}
            >
              <Text style={styles.guestText}>Continue as Guest</Text>
              <ArrowRight size={14} color={colors.textSecondary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </Animated.View>

          {/* Footer: Signup Link */}
          <Animated.View 
            entering={FadeInDown.duration(450).delay(200)}
            style={styles.footer}
          >
            <Text style={styles.footerText}>New to Kuiklo? </Text>
            <TouchableOpacity 
              onPress={() => router.push('/(auth)/signup')}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.signupLink}>Create an Account</Text>
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
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg
  },
  forgotText: {
    fontSize: typography.size.xs,
    fontFamily: typography.family?.medium || undefined,
    color: colors.primary,
    fontWeight: typography.weight.semibold
  },
  submitBtn: {
    width: '100%'
  },
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm
  },
  guestText: {
    fontSize: typography.size.sm,
    fontFamily: typography.family?.medium || undefined,
    color: colors.textSecondary,
    fontWeight: typography.weight.medium
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
  signupLink: {
    fontSize: typography.size.sm,
    fontFamily: typography.family?.bold || undefined,
    color: colors.primary,
    fontWeight: typography.weight.bold
  }
});
