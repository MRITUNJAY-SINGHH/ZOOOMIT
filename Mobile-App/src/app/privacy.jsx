import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, ShieldCheck, Lock, Eye, FileText, Mail } from 'lucide-react-native';
import { colors, typography, spacing } from '../constants/theme';
import { haptics } from '../services/haptics';

export default function PrivacyPolicyScreen() {
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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Badge Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconCircle}>
            <ShieldCheck size={28} color={colors.black} strokeWidth={2.4} />
          </View>
          <Text style={styles.heroTitle}>Your Privacy Matters</Text>
          <Text style={styles.heroSubtitle}>
            Kuiklo Quick Commerce Private Limited • Effective September 2026
          </Text>
        </View>

        {/* Section 1 */}
        <View style={styles.contentCard}>
          <View style={styles.cardHeaderRow}>
            <Eye size={18} color={colors.primaryDark} strokeWidth={2.4} />
            <Text style={styles.cardSectionTitle}>1. Information We Collect</Text>
          </View>
          <Text style={styles.paragraph}>
            When you use Kuiklo, we collect information necessary to deliver groceries quickly and reliably:
          </Text>
          <Text style={styles.bulletPoint}>• Mobile number and OTP verification credentials</Text>
          <Text style={styles.bulletPoint}>• Delivery addresses, floor/apartment details, and delivery instructions</Text>
          <Text style={styles.bulletPoint}>• Order history, item preferences, and customer support interactions</Text>
          <Text style={styles.bulletPoint}>• Device identifiers, operating system version, and crash diagnostic logs</Text>
        </View>

        {/* Section 2 */}
        <View style={styles.contentCard}>
          <View style={styles.cardHeaderRow}>
            <FileText size={18} color={colors.primaryDark} strokeWidth={2.4} />
            <Text style={styles.cardSectionTitle}>2. How We Use Your Data</Text>
          </View>
          <Text style={styles.paragraph}>
            We use the information we collect to:
          </Text>
          <Text style={styles.bulletPoint}>• Process and dispatch 10-15 minute grocery deliveries to your exact doorstep</Text>
          <Text style={styles.bulletPoint}>• Facilitate real-time order tracking with assigned delivery partners</Text>
          <Text style={styles.bulletPoint}>• Provide customer support, issue resolutions, and automated refund processing</Text>
          <Text style={styles.bulletPoint}>• Prevent fraudulent transactions, unauthorized account access, and abuse</Text>
        </View>

        {/* Section 3 */}
        <View style={styles.contentCard}>
          <View style={styles.cardHeaderRow}>
            <Lock size={18} color={colors.primaryDark} strokeWidth={2.4} />
            <Text style={styles.cardSectionTitle}>3. Payment & Data Security</Text>
          </View>
          <Text style={styles.paragraph}>
            Kuiklo does not store your full debit/credit card numbers or UPI MPINs. All payment transactions are processed through RBI-authorized, PCI-DSS compliant payment gateways with bank-grade 256-bit SSL encryption.
          </Text>
        </View>

        {/* Section 4 */}
        <View style={styles.contentCard}>
          <View style={styles.cardHeaderRow}>
            <Mail size={18} color={colors.primaryDark} strokeWidth={2.4} />
            <Text style={styles.cardSectionTitle}>4. Contact & Account Rights</Text>
          </View>
          <Text style={styles.paragraph}>
            You have the right to request deletion of your account and personal data at any time. For questions regarding our privacy practices, contact our Data Protection Officer at:
          </Text>
          <Text style={styles.contactEmail}>privacy@kuiklo.com</Text>
        </View>

        {/* Action Button */}
        <Pressable
          onPress={handleBack}
          style={styles.doneButton}
          accessibilityRole="button"
          accessibilityLabel="I Understand"
        >
          <Text style={styles.doneButtonText}>I Understand</Text>
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
