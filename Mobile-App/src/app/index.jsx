import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { ShoppingBag, Zap } from 'lucide-react-native';
import { colors, typography, spacing } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

export default function SplashScreen() {
  const { token, isLoading } = useAuth();
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Smooth intro animation
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true
      })
    ]).start();

    // After animation and auth check, navigate
    if (!isLoading) {
      const timer = setTimeout(() => {
        if (token) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/login');
        }
      }, 1600);

      return () => clearTimeout(timer);
    }
  }, [isLoading, token]);

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        {/* Brand Icon Circle */}
        <View style={styles.iconCircle}>
          <ShoppingBag size={54} color="#ffffff" strokeWidth={2.2} />
          <View style={styles.zapBadge}>
            <Zap size={18} color="#ffffff" fill="#ffffff" />
          </View>
        </View>

        {/* Brand Name */}
        <Text style={styles.brandTitle}>KUIKLO</Text>
        
        {/* Tagline */}
        <View style={styles.taglineBadge}>
          <Text style={styles.taglineText}>⚡ 15-Min Superfast Delivery</Text>
        </View>
      </Animated.View>

      {/* Footer info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Fresh Groceries • Daily Essentials • Best Prices</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl
  },
  content: {
    alignItems: 'center'
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    position: 'relative'
  },
  zapBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.accent,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary
  },
  brandTitle: {
    fontSize: typography.size['4xl'],
    fontWeight: typography.weight.heavy,
    color: '#ffffff',
    letterSpacing: 4,
    marginBottom: spacing.sm
  },
  taglineBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 6,
    paddingHorizontal: spacing.lg,
    borderRadius: 20
  },
  taglineText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: '#ffffff'
  },
  footer: {
    position: 'absolute',
    bottom: spacing['3xl']
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium
  }
});
