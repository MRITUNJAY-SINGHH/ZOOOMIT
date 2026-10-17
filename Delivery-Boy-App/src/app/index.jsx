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
import { hapticFeedback } from '../services/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BIKE_WIDTH = 220;
const BIKE_HEIGHT = 200;

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
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(-24)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const bottomBadgeOpacity = useRef(new Animated.Value(0)).current;
  const screenFade = useRef(new Animated.Value(1)).current;

  // Bike specific motion: starts completely off-screen on the left
  const bikeTranslateX = useRef(new Animated.Value(-BIKE_WIDTH - 80)).current;
  const bikeBounceY = useRef(new Animated.Value(0)).current;
  const bikeTilt = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Hide Expo default splash as soon as our animated splash screen loads
    SplashScreen.hideAsync().catch(() => {});

    // 1. Continuous engine suspension bounce while driving
    const bounceLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bikeBounceY, {
          toValue: -2.5,
          duration: 120,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(bikeBounceY, {
          toValue: 2,
          duration: 120,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    );
    bounceLoop.start();

    // 2. Initial Splash Screen Elements Appearance (City background + ZOOOMIT Logo)
    Animated.sequence([
      // First: City background and logo fade in smoothly
      Animated.parallel([
        Animated.timing(bgOpacity, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true
        }),
        Animated.spring(logoTranslateY, {
          toValue: 0,
          friction: 7,
          tension: 60,
          useNativeDriver: true
        }),
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true
        }),
        Animated.timing(bottomBadgeOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true
        })
      ]),

      // Brief gentle pause so the user sees the splash screen clearly
      Animated.delay(350),

      // 3. Smooth, continuous bike run: comes from left side and goes all the way to right side
      Animated.parallel([
        Animated.timing(bikeTilt, {
          toValue: 1, // subtle forward riding angle
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(bikeTranslateX, {
          toValue: SCREEN_WIDTH + 80,
          duration: 1950, // smooth, natural riding speed across the screen
          easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
          useNativeDriver: true
        })
      ])
    ]).start(() => {
      // Haptic confirmation upon bike run completion
      hapticFeedback.light?.();

      // 4. Smoothly fade out and open the Login screen
      Animated.timing(screenFade, {
        toValue: 0,
        duration: 320,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true
      }).start(() => {
        bounceLoop.stop();
        if (!isLoading && isAuthenticated) {
          router.replace('/(tabs)');
        } else {
          router.replace('/login');
        }
      });
    });

    return () => bounceLoop.stop();
  }, [isAuthenticated, isLoading, router]);

  // Subtle natural riding angle
  const bikeRotation = bikeTilt.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-1.5deg']
  });

  return (
    <Animated.View style={[styles.container, { opacity: screenFade }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFC928" translucent={false} />

      {/* Cityscape & Yellow Road Background */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { opacity: bgOpacity }
        ]}
      >
        <Image
          source={require('../../assets/images/splash-city-bg.jpg')}
          style={styles.heroBackground}
          contentFit="cover"
          priority="high"
        />
      </Animated.View>

      {/* Animated Delivery Scooter: Rides smoothly from Left to Right */}
      <Animated.View
        style={[
          styles.bikeContainer,
          {
            transform: [
              { translateX: bikeTranslateX },
              { translateY: bikeBounceY },
              { rotate: bikeRotation }
            ]
          }
        ]}
      >
        <Image
          source={require('../../assets/images/rider-scooter.png')}
          style={styles.bikeImage}
          contentFit="contain"
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
                transform: [{ translateY: logoTranslateY }]
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
            { opacity: bottomBadgeOpacity }
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
    paddingVertical: 18,
    zIndex: 10
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

  // Animated Bike Container positioned naturally on the road level
  bikeContainer: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.18,
    width: BIKE_WIDTH,
    height: BIKE_HEIGHT,
    zIndex: 5
  },
  bikeImage: {
    width: '100%',
    height: '100%'
  },

  // Bottom Status Pill
  bottomStatusArea: {
    marginBottom: 20,
    alignItems: 'center'
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
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
