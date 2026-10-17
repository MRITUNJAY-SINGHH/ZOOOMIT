import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { Image } from 'expo-image';
import { Mail, Lock, ShieldCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, radius, spacing } from '../constants/theme';
import { AppButton, AppInput } from '../components';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, router]);

  const validate = () => {
    const errs = {};
    if (!email.trim()) {
      errs.email = 'Please enter your registered email address';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Please enter a valid email format';
    }

    if (!password) {
      errs.password = 'Please enter your password';
    } else if (password.length < 4) {
      errs.password = 'Password must be at least 4 characters';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSignIn = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Please check credentials.';
      Alert.alert('Authentication Failed', msg);
      setErrors({ global: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Brand */}
          <View style={styles.brandHeader}>
            <Image
              source={require('../../assets/images/delivery-partner-hero.png')}
              style={styles.heroImage}
              contentFit="contain"
            />
            <View style={styles.brandBadge}>
              <Text style={styles.brandName}>ZOOOMIT</Text>
              <View style={styles.roleTag}>
                <ShieldCheck size={13} color="#854D0E" style={{ marginRight: 4 }} />
                <Text style={styles.roleText}>DELIVERY PARTNER</Text>
              </View>
            </View>
            <Text style={styles.title}>Partner Sign In</Text>
            <Text style={styles.subtitle}>
              Sign in with the credentials assigned by your administrator.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            {Boolean(errors.global) && (
              <View style={styles.globalErrorBox}>
                <Text style={styles.globalErrorText}>{errors.global}</Text>
              </View>
            )}

            <AppInput
              label="Registered Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
              }}
              placeholder="e.g. rider@example.com"
              keyboardType="email-address"
              icon={Mail}
              error={errors.email}
            />

            <AppInput
              label="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
              }}
              placeholder="Enter your secret password"
              secureTextEntry
              icon={Lock}
              error={errors.password}
            />

            <AppButton
              title="Sign In to Dashboard"
              variant="primary"
              onPress={handleSignIn}
              loading={loading}
              style={styles.signInBtn}
            />

            {/* Note */}
            <View style={styles.footerNote}>
              <Text style={styles.footerNoteText}>
                Need assistance with your partner account? Contact your local ZOOOMIT hub dispatch administrator.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.softBackground
  },
  keyboardContainer: {
    flex: 1
  },
  scrollContent: {
    padding: spacing.lg,
    flexGrow: 1,
    justifyContent: 'center'
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg
  },
  heroImage: {
    width: 150,
    height: 150,
    marginBottom: spacing.sm
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs
  },
  brandName: {
    fontFamily: typography.family.heavy,
    fontSize: typography.size['2xl'],
    color: colors.secondary,
    letterSpacing: 1
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryDark,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill
  },
  roleText: {
    fontFamily: typography.family.bold,
    fontSize: 10,
    color: '#854D0E',
    letterSpacing: 0.5
  },
  title: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.xl,
    color: colors.textPrimary,
    marginTop: spacing.xs
  },
  subtitle: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 290
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.lg
  },
  globalErrorBox: {
    backgroundColor: colors.errorSubtle,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md
  },
  globalErrorText: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.xs,
    color: colors.error,
    textAlign: 'center'
  },
  signInBtn: {
    marginTop: spacing.sm
  },
  footerNote: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight
  },
  footerNoteText: {
    fontFamily: typography.family.regular,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16
  }
});
