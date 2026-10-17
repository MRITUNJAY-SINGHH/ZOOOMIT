import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
  StatusBar
} from 'react-native';
import { Image } from 'expo-image';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import Svg, { Rect, Path, Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, radius, spacing } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { hapticFeedback } from '../services/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function LogoLockIcon() {
  return (
    <Svg width={36} height={40} viewBox="0 0 24 28" fill="none">
      <Path
        d="M6 10V6.5C6 3.46 8.46 1 11.5 1h1C15.54 1 18 3.46 18 6.5V10"
        stroke="#111827"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <Rect
        x="2"
        y="10"
        width="20"
        height="16"
        rx="3.5"
        stroke="#111827"
        strokeWidth="2.8"
      />
      <Circle cx="12" cy="16.5" r="1.6" fill="#111827" />
      <Path
        d="M12 18.1v2.4"
        stroke="#111827"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const scrollViewRef = useRef(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, router]);

  // Listen for keyboard events to allow smooth auto-scroll & extra scrollable padding
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleEmailChange = (val) => {
    // Tactile haptic click on every keystroke
    hapticFeedback.type?.();
    setEmail(val);
    if (errorMessage) setErrorMessage('');
  };

  const handlePasswordChange = (val) => {
    // Tactile haptic click on every keystroke
    hapticFeedback.type?.();
    setPassword(val);
    if (errorMessage) setErrorMessage('');
  };

  const handleEmailFocus = () => {
    hapticFeedback.light?.();
    setEmailFocused(true);
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 160, animated: true });
    }, 120);
  };

  const handlePasswordFocus = () => {
    hapticFeedback.light?.();
    setPasswordFocused(true);
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 230, animated: true });
    }, 120);
  };

  const handleTogglePassword = () => {
    hapticFeedback.selection?.();
    setShowPassword((prev) => !prev);
  };

  const validate = () => {
    if (!email.trim()) {
      setErrorMessage('Please enter your partner email address.');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return false;
    }
    if (!password) {
      setErrorMessage('Please enter your account password.');
      return false;
    }
    if (password.length < 4) {
      setErrorMessage('Password must be at least 4 characters.');
      return false;
    }
    return true;
  };

  const handleSignIn = async () => {
    Keyboard.dismiss();
    setErrorMessage('');
    if (!validate()) {
      hapticFeedback.warning?.();
      return;
    }

    setLoading(true);
    hapticFeedback.medium?.();

    try {
      await login(email.trim(), password);
      hapticFeedback.success?.();
      router.replace('/(tabs)');
    } catch (err) {
      hapticFeedback.error?.();
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Authentication failed. Please verify your credentials.';
      setErrorMessage(msg);
      Alert.alert('Sign In Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Keyboard.dismiss();
    hapticFeedback.light?.();
    Alert.alert(
      'Forgot Password',
      'Please contact your ZOOOMIT hub dispatch administrator to verify your identity and reset your partner account password.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFC928" translucent={false} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: keyboardVisible ? 280 : 40 }
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            bounces={false}
          >
            {/* Top Yellow Hero & Branding Section */}
            <View style={styles.topHeroSection}>
              {/* App Logo */}
              <View style={styles.logoBlock}>
                <LogoLockIcon />
                <Text style={styles.logoBrand}>ZOOOMIT</Text>
                <Text style={styles.logoTagline}>Delivery Partner</Text>
              </View>

              {/* Delivery Boy & City Hero Image */}
              <View
                style={[
                  styles.heroImageWrapper,
                  keyboardVisible && styles.heroImageWrapperCompact
                ]}
              >
                <Image
                  source={require('../../assets/images/login-hero.jpg')}
                  style={styles.heroImage}
                  contentFit="cover"
                  contentPosition="bottom center"
                  priority="high"
                />
              </View>
            </View>

            {/* Bottom White Sheet Form */}
            <View style={styles.bottomSheetCard}>
              <Text style={styles.sheetTitle}>Sign in to your account</Text>
              <Text style={styles.sheetSubtitle}>
                Welcome back! Continue to deliver with ZOOOMIT
              </Text>

              {/* Error Banner */}
              {Boolean(errorMessage) && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              )}

              {/* Email Input */}
              <View
                style={[
                  styles.inputFieldBox,
                  emailFocused && styles.inputFieldBoxFocused,
                  Boolean(errorMessage && !email.trim()) && styles.inputFieldBoxError
                ]}
              >
                <Mail
                  size={20}
                  color={emailFocused ? colors.secondary : '#6B7280'}
                  style={styles.inputLeftIcon}
                />
                <TextInput
                  value={email}
                  onChangeText={handleEmailChange}
                  placeholder="partner@zooomit.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={handleEmailFocus}
                  onBlur={() => setEmailFocused(false)}
                  style={styles.textInputField}
                />
              </View>

              {/* Password Input */}
              <View
                style={[
                  styles.inputFieldBox,
                  passwordFocused && styles.inputFieldBoxFocused,
                  Boolean(errorMessage && !password) && styles.inputFieldBoxError
                ]}
              >
                <Lock
                  size={20}
                  color={passwordFocused ? colors.secondary : '#6B7280'}
                  style={styles.inputLeftIcon}
                />
                <TextInput
                  value={password}
                  onChangeText={handlePasswordChange}
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={handlePasswordFocus}
                  onBlur={() => setPasswordFocused(false)}
                  style={styles.textInputField}
                />
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleTogglePassword}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={styles.eyeToggleBtn}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#6B7280" />
                  ) : (
                    <Eye size={20} color="#6B7280" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Sign In Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSignIn}
                disabled={loading}
                style={[styles.signInButton, loading && styles.signInButtonDisabled]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#111827" />
                ) : (
                  <Text style={styles.signInButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              {/* Forgot Password Link */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleForgotPassword}
                style={styles.forgotPasswordContainer}
              >
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFC928'
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFC928'
  },
  keyboardContainer: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF'
  },

  // Top Yellow Section
  topHeroSection: {
    backgroundColor: '#FFC928',
    alignItems: 'center',
    paddingTop: 10
  },
  logoBlock: {
    alignItems: 'center',
    marginBottom: 6
  },
  logoBrand: {
    fontFamily: typography.family.black,
    fontSize: 32,
    letterSpacing: 2,
    color: '#111827',
    marginTop: 6
  },
  logoTagline: {
    fontFamily: typography.family.medium,
    fontSize: 16,
    color: '#111827',
    marginTop: 1,
    letterSpacing: 0.2
  },

  // Hero Image
  heroImageWrapper: {
    width: SCREEN_WIDTH,
    height: 250,
    overflow: 'hidden'
  },
  heroImageWrapperCompact: {
    height: 150
  },
  heroImage: {
    width: '100%',
    height: '100%'
  },

  // Bottom White Card
  bottomSheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    marginTop: -18,
    paddingHorizontal: spacing.xl,
    paddingTop: 26,
    paddingBottom: 32
  },
  sheetTitle: {
    fontFamily: typography.family.bold,
    fontSize: 22,
    color: '#111827',
    textAlign: 'center',
    letterSpacing: -0.3
  },
  sheetSubtitle: {
    fontFamily: typography.family.regular,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
    lineHeight: 20
  },

  // Error Banner
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md
  },
  errorBannerText: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.xs,
    color: '#DC2626',
    textAlign: 'center'
  },

  // Inputs
  inputFieldBox: {
    height: 54,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: 16
  },
  inputFieldBoxFocused: {
    borderColor: '#FFC928'
  },
  inputFieldBoxError: {
    borderColor: '#DC2626'
  },
  inputLeftIcon: {
    marginRight: 12
  },
  textInputField: {
    flex: 1,
    height: '100%',
    fontFamily: typography.family.medium,
    fontSize: 15,
    color: '#111827'
  },
  eyeToggleBtn: {
    padding: 6
  },

  // Sign In Button
  signInButton: {
    height: 52,
    backgroundColor: '#FFC928',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 16
  },
  signInButtonDisabled: {
    opacity: 0.65
  },
  signInButtonText: {
    fontFamily: typography.family.bold,
    fontSize: 16,
    color: '#111827'
  },

  // Forgot Password
  forgotPasswordContainer: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12
  },
  forgotPasswordText: {
    fontFamily: typography.family.semibold,
    fontSize: 14,
    color: '#2563EB'
  }
});
