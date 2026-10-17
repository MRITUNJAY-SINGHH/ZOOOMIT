import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Easing
} from 'react-native';
import { Image } from 'expo-image';
import Svg, { Rect, Path, Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { typography, radius } from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function LogoLockIcon() {
  return (
    <Svg width={42} height={46} viewBox="0 0 24 28" fill="none">
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

export default function SplashScreenComponent() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // Animation values
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const bgScale = useRef(new Animated.Value(1.08)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(-30)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const bottomBadgeOpacity = useRef(new Animated.Value(0)).current;
  const screenFade = useRef(new Animated.Value(1)).current;

  // Pulse animation for the status capsule
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Hide Expo default splash as soon as our custom animated splash mounts
    SplashScreen.hideAsync().catch(() => {});

    // Start entrance animations sequence
    Animated.parallel([
      // 1. Background image fade-in and smooth camera zoom settling
      Animated.timing(bgOpacity, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true
      }),
      Animated.timing(bgScale, {
        toValue: 1.0,
        duration: 1400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),

      // 2. Logo entrance with bounce & drop
      Animated.sequence([
        Animated.delay(200),
        Animated.parallel([
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
          }),
          Animated.spring(logoTranslateY, {
            toValue: 0,
            friction: 6,
            tension: 50,
            useNativeDriver: true
          }),
          Animated.spring(logoScale, {
            toValue: 1,
            friction: 5,
            tension: 60,
            useNativeDriver: true
          })
        ]),
        // 3. Tagline fade in
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true
        }),
        // 4. Bottom status pill fade in
        Animated.timing(bottomBadgeOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true
        })
      ])
    ]).start();

    // Subtle pulsing for the status indicator
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    ).start();

    // Transition timer to seamlessly route to Login Screen
    const timer = setTimeout(() => {
      // Smooth fade-out before navigation
      Animated.timing(screenFade, {
        toValue: 0,
        duration: 400,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true
      }).start(() => {
        if (!isLoading && isAuthenticated) {
          router.replace('/(tabs)');
        } else {
          router.replace('/login');
        }
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading, router]);

  return (
    <Animated.View style={[styles.container, { opacity: screenFade }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFC928" translucent={false} />

      {/* Full-bleed Animated Background & Delivery Cityscape */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            opacity: bgOpacity,
            transform: [{ scale: bgScale }]
          }
        ]}
      >
        <Image
          source={require('../../assets/images/splash-hero-bg.jpg')}
          style={styles.heroBackground}
          contentFit="cover"
          priority="high"
        />
      </Animated.View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Animated Brand Logo Header */}
        <View style={styles.topBrandingArea}>
          <Animated.View
            style={[
              styles.logoBlock,
              {
                opacity: logoOpacity,
                transform: [
                  { translateY: logoTranslateY },
                  { scale: logoScale }
                ]
              }
            ]}
          >
            <LogoLockIcon />
            <Text style={styles.brandTitle}>ZOOOMIT</Text>
          </Animated.View>

          <Animated.Text style={[styles.brandSubtitle, { opacity: taglineOpacity }]}>
            Delivery Partner
          </Animated.Text>
        </View>

        {/* Bottom Status / Dispatch Network Badge */}
        <Animated.View
          style={[
            styles.bottomStatusArea,
            {
              opacity: bottomBadgeOpacity,
              transform: [{ scale: pulseAnim }]
            }
          ]}
        >
          <View style={styles.statusPill}>
            <View style={styles.pulsingDot} />
            <Text style={styles.statusText}>Connecting to Dispatch Network</Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFC928',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT
  },
  heroBackground: {
    width: '100%',
    height: '100%'
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18
  },

  // Top Branding
  topBrandingArea: {
    alignItems: 'center',
    marginTop: 20
  },
  logoBlock: {
    alignItems: 'center'
  },
  brandTitle: {
    fontFamily: typography.family.black,
    fontSize: 34,
    letterSpacing: 2.2,
    color: '#111827',
    marginTop: 8
  },
  brandSubtitle: {
    fontFamily: typography.family.medium,
    fontSize: 17,
    color: '#111827',
    marginTop: 2,
    letterSpacing: 0.3
  },

  // Bottom Status Pill
  bottomStatusArea: {
    marginBottom: 20,
    alignItems: 'center'
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: '#E5E7EB'
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
    marginRight: 8
  },
  statusText: {
    fontFamily: typography.family.semibold,
    fontSize: 12,
    color: '#111827',
    letterSpacing: 0.2
  }
});
