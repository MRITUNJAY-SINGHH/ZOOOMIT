import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Key, Lock, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';
import { AppInput } from '../../components/AppInput';
import { AppButton } from '../../components/AppButton';
import { StorefrontAPI } from '../../services/api';

export default function ResetPasswordScreen() {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isPasswordLongEnough = newPassword.length >= 6;
  const doPasswordsMatch = Boolean(newPassword && confirmPassword && newPassword === confirmPassword);
  const canSubmit = token.trim().length > 0 && isPasswordLongEnough && doPasswordsMatch;

  const handleReset = async () => {
    if (!token.trim() || !newPassword) {
      setErrorMessage('Please enter the reset code and your new password');
      return;
    }

    if (!isPasswordLongEnough) {
      setErrorMessage('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      await StorefrontAPI.resetPassword({
        token: token.trim(),
        newPassword
      });
      Alert.alert(
        'Password Reset Successful',
        'Your password has been updated. Please sign in with your new password.',
        [
          { text: 'Sign In', onPress: () => router.replace('/(auth)/login') }
        ]
      );
    } catch (e) {
      setErrorMessage(
        e.response?.data?.message || 'Failed to reset password. The code may be invalid or expired.'
      );
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
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </View>

          {/* Header */}
          <Animated.View 
            entering={FadeInDown.duration(400)}
            style={styles.header}
          >
            <Text style={styles.title}>Set New Password</Text>
            <Text style={styles.subtitle}>
              Enter the reset code and choose a new password
            </Text>
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
              label="Reset Code / Token *"
              placeholder="Paste or enter the reset code"
              value={token}
              onChangeText={(text) => {
                setToken(text);
                if (errorMessage) setErrorMessage('');
              }}
              autoCapitalize="none"
              clearable
              leftIcon={<Key size={18} />}
            />

            <AppInput
              label="New Password *"
              placeholder="Min. 6 characters"
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                if (errorMessage) setErrorMessage('');
              }}
              secureTextEntry
              leftIcon={<Lock size={18} />}
            />

            <AppInput
              label="Confirm New Password *"
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errorMessage) setErrorMessage('');
              }}
              secureTextEntry
              leftIcon={<Lock size={18} />}
            />

            {/* Live Password Validation Indicators */}
            <View style={styles.indicatorsBox}>
              <View style={styles.indicatorRow}>
                <CheckCircle2 
                  size={14} 
                  color={isPasswordLongEnough ? colors.success : colors.textMuted} 
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.indicatorText, isPasswordLongEnough && styles.indicatorTextValid]}>
                  At least 6 characters
                </Text>
              </View>

              {Boolean(confirmPassword) && (
                <View style={[styles.indicatorRow, { marginTop: 4 }]}>
                  <CheckCircle2 
                    size={14} 
                    color={doPasswordsMatch ? colors.success : colors.error} 
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.indicatorText, doPasswordsMatch ? styles.indicatorTextValid : styles.indicatorTextError]}>
                    {doPasswordsMatch ? 'Passwords match' : 'Passwords do not match'}
                  </Text>
                </View>
              )}
            </View>

            <AppButton
              title="Set New Password"
              onPress={handleReset}
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
  indicatorsBox: {
    marginBottom: spacing.lg,
    marginTop: -spacing.xs
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  indicatorText: {
    fontSize: typography.size.xs,
    fontFamily: typography.family?.regular || undefined,
    color: colors.textMuted
  },
  indicatorTextValid: {
    color: colors.success,
    fontFamily: typography.family?.medium || undefined
  },
  indicatorTextError: {
    color: colors.error,
    fontFamily: typography.family?.medium || undefined
  },
  submitBtn: {
    width: '100%'
  }
});
