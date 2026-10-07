import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ImageBackground, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  FadeIn
} from 'react-native-reanimated';
import { ArrowRight } from 'lucide-react-native';
import { colors, typography, spacing } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { haptics } from '../services/haptics';

const { width } = Dimensions.get('window');

export default function IndexScreen() {
  const { token, isLoading } = useAuth();
  const btnScale = useSharedValue(1);

  useEffect(() => {
    if (!isLoading) {
      if (token) {
        router.replace('/(tabs)');
      }
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading, token]);

  const animatedBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }]
  }));

  const handlePressIn = () => {
    btnScale.value = withSpring(0.98, { damping: 18, stiffness: 300 });
  };

  const handlePressOut = () => {
    btnScale.value = withSpring(1, { damping: 18, stiffness: 300 });
  };

  const handleContinue = () => {
    haptics.impactLight();
    router.push('/(auth)/login');
  };

  if (isLoading || token) {
    return null;
  }

  return (
    <ImageBackground
      source={require('../../assets/images/auth/auth_splash_bg.jpg')}
      style={styles.bgImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom']}>
        <View style={styles.topSection}>
          <Animated.View 
            entering={FadeIn.duration(400)} 
            style={styles.logoRow}
          >
            <View style={styles.logoWrapper}>
              <Text style={styles.brandTitle}>ZOOOMIT</Text>
              <View style={styles.leafIconBadge}>
                <Text style={styles.leafEmoji}>🍃</Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View 
            entering={FadeIn.delay(100).duration(400)}
            style={styles.textWrapper}
          >
            <Text style={styles.headline}>Fresh groceries.{"\n"}Fast delivery.</Text>
            <Text style={styles.subtext}>Everything you need, delivered to your door.</Text>
          </Animated.View>
        </View>

        <View style={styles.middleSpacer} />

        <View style={styles.bottomSection}>
          <Animated.View 
            entering={FadeIn.delay(150).duration(400)}
            style={styles.ctaWrapper}
          >
            <Animated.View style={animatedBtnStyle}>
              <Pressable
                style={({ pressed }) => [
                  styles.ctaButton,
                  { backgroundColor: pressed ? colors.primaryDark : colors.primary }
                ]}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handleContinue}
                accessibilityRole="button"
                accessibilityLabel="Continue with Mobile"
              >
                <Text style={styles.ctaText}>Continue with Mobile</Text>
                <View style={styles.ctaIconCircle}>
                  <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.8} />
                </View>
              </Pressable>
            </Animated.View>
          </Animated.View>

          <Animated.View 
            entering={FadeIn.delay(200).duration(400)} 
            style={styles.legalContainer}
          >
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
          </Animated.View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%'
  },
  safeContainer: {
    flex: 1,
    justifyContent: 'space-between'
  },
  topSection: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg
  },
  logoRow: {
    marginBottom: spacing.md
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    alignSelf: 'flex-start'
  },
  brandTitle: {
    fontSize: 40,
    fontFamily: typography.family.extraBold,
    color: colors.textPrimary,
    letterSpacing: -0.5
  },
  leafIconBadge: {
    position: 'absolute',
    top: -8,
    left: 52
  },
  leafEmoji: {
    fontSize: 22,
    fontFamily: typography.family.regular
  },
  textWrapper: {
    marginTop: spacing.xs
  },
  headline: {
    fontSize: 34,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    lineHeight: 40,
    marginBottom: 8
  },
  subtext: {
    fontSize: 15,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    lineHeight: 22,
    maxWidth: width * 0.8
  },
  middleSpacer: {
    flex: 1
  },
  bottomSection: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center'
  },
  ctaWrapper: {
    width: '100%',
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
    backgroundColor: 'rgba(0, 0, 0, 0.45)'
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
  }
});
