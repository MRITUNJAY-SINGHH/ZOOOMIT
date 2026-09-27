import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, BookOpen, Clock, AlertTriangle, Truck, HelpCircle } from 'lucide-react-native';
import { colors, typography, spacing } from '../constants/theme';
import { haptics } from '../services/haptics';

export default function TermsOfUseScreen() {
  const handleBack = () => {
    haptics.impactLight();
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} color={colors.textPrimary} strokeWidth={2.4} />
        </Pressable>
        <Text style={styles.headerTitle}>Terms of Use</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Badge Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconCircle}>
            <BookOpen size={28} color={colors.black} strokeWidth={2.4} />
          </View>
          <Text style={styles.heroTitle}>Customer Agreement</Text>
          <Text style={styles.heroSubtitle}>
            Kuiklo Quick Commerce Private Limited • Effective September 2026
          </Text>
        </View>

        {/* Section 1 */}
        <View style={styles.contentCard}>
          <View style={styles.cardHeaderRow}>
            <Clock size={18} color={colors.primaryDark} strokeWidth={2.4} />
            <Text style={styles.cardSectionTitle}>1. Account & OTP Verification</Text>
          </View>
          <Text style={styles.paragraph}>
            By creating an account on Kuiklo via your verified mobile phone number, you agree that you are solely responsible for all activities that occur under your account. You agree to safeguard your one-time passwords (OTP) and never share verification codes with third parties or delivery riders.
          </Text>
        </View>

        {/* Section 2 */}
        <View style={styles.contentCard}>
          <View style={styles.cardHeaderRow}>
            <Truck size={18} color={colors.primaryDark} strokeWidth={2.4} />
            <Text style={styles.cardSectionTitle}>2. Fast Delivery & Dark Store Service</Text>
          </View>
          <Text style={styles.paragraph}>
            Kuiklo strives to deliver grocery orders within 10-15 minutes from hyper-local fulfillment centers. Delivery estimates are subject to extreme weather, regional traffic restrictions, and order surge conditions. We will promptly notify you of any unexpected delay.
          </Text>
        </View>

        {/* Section 3 */}
        <View style={styles.contentCard}>
          <View style={styles.cardHeaderRow}>
            <AlertTriangle size={18} color={colors.primaryDark} strokeWidth={2.4} />
            <Text style={styles.cardSectionTitle}>3. Freshness Guarantee & Returns</Text>
          </View>
          <Text style={styles.paragraph}>
            Kuiklo guarantees fresh dairy, fruits, vegetables, and packaged daily staples. If an item arrives damaged, expired, or substandard:
          </Text>
          <Text style={styles.bulletPoint}>• Report the item via the Orders screen within 2 hours of delivery</Text>
          <Text style={styles.bulletPoint}>• Upload a photo of the affected product for instant approval</Text>
          <Text style={styles.bulletPoint}>• Refunds are credited immediately to your Kuiklo balance or original payment method</Text>
        </View>

        {/* Section 4 */}
        <View style={styles.contentCard}>
          <View style={styles.cardHeaderRow}>
            <HelpCircle size={18} color={colors.primaryDark} strokeWidth={2.4} />
            <Text style={styles.cardSectionTitle}>4. Support & Grievance Redressal</Text>
          </View>
          <Text style={styles.paragraph}>
            For complaints, service inquiries, or legal concerns regarding your Kuiklo shopping experience, contact our Grievance Officer at:
          </Text>
          <Text style={styles.contactEmail}>support@kuiklo.com</Text>
        </View>

        {/* Action Button */}
        <Pressable
          onPress={handleBack}
          style={styles.doneButton}
          accessibilityRole="button"
          accessibilityLabel="I Accept"
        >
          <Text style={styles.doneButtonText}>I Accept</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  headerRightSpacer: {
    width: 40
  },
  scrollContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl
  },
  heroCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: 20,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primaryLight
  },
  heroIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    marginBottom: 4
  },
  heroSubtitle: {
    fontSize: 12,
    fontFamily: typography.family.medium,
    color: colors.textSecondary,
    textAlign: 'center'
  },
  contentCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm
  },
  cardSectionTitle: {
    fontSize: 16,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  paragraph: {
    fontSize: 14,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.xs
  },
  bulletPoint: {
    fontSize: 13,
    fontFamily: typography.family.regular,
    color: colors.textPrimary,
    lineHeight: 20,
    marginTop: 4,
    paddingLeft: spacing.xs
  },
  contactEmail: {
    fontSize: 14,
    fontFamily: typography.family.bold,
    color: colors.primaryDark,
    marginTop: spacing.xs
  },
  doneButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md
  },
  doneButtonText: {
    fontSize: 16,
    fontFamily: typography.family.bold,
    color: '#FFFFFF'
  }
});
