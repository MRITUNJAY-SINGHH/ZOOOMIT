import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { colors, spacing, typography } from '../constants/theme';
import { haptics } from '../services/haptics';

export function PageHeader({ title, right }) {
  const goBack = () => {
    haptics.impactLight();
    router.canGoBack() ? router.back() : router.replace('/(tabs)/profile');
  };

  return (
    <View style={styles.header}>
      <Pressable onPress={goBack} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back">
        <ArrowLeft size={20} color={colors.textPrimary} strokeWidth={2.4} />
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <View style={styles.right}>{right || <View style={styles.spacer} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 64,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    marginHorizontal: spacing.sm
  },
  right: { width: 40, alignItems: 'flex-end' },
  spacer: { width: 40, height: 40 }
});
