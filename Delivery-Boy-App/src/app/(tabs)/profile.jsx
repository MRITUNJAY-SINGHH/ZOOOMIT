import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  User,
  Bike,
  ShieldCheck,
  CreditCard,
  Bell,
  HelpCircle,
  Info,
  LogOut,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  X
} from 'lucide-react-native';
import { colors, typography, radius, spacing } from '../../constants/theme';
import { AppHeader, AppButton } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { hapticFeedback } from '../../services/haptics';

export default function ProfileScreen() {
  const router = useRouter();
  const { partner, logout, isOnline } = useAuth();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [supportModalVisible, setSupportModalVisible] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out from your ZOOOMIT Delivery Partner account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          }
        }
      ]
    );
  };

  const partnerInitials = partner?.name
    ? partner.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'ZP';

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title="Partner Profile"
        subtitle="Manage your credentials, vehicle, and dispatch settings"
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Identity Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{partnerInitials}</Text>
          </View>
          <View style={styles.profileDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.partnerName}>{partner?.name || 'Delivery Partner'}</Text>
              <View style={styles.verifiedBadge}>
                <ShieldCheck size={12} color={colors.badgeDeliveredText} style={{ marginRight: 3 }} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Mail size={13} color={colors.textMuted} style={styles.infoIcon} />
              <Text style={styles.infoText}>{partner?.email || 'partner@zooomit.in'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Phone size={13} color={colors.textMuted} style={styles.infoIcon} />
              <Text style={styles.infoText}>{partner?.phone || '+91 98000 00000'}</Text>
            </View>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isOnline ? colors.success : colors.textMuted }
                ]}
              />
              <Text style={styles.statusLabelText}>
                {isOnline ? 'Currently Online' : 'Currently Offline'}
              </Text>
            </View>
          </View>
        </View>

        {/* Section: Vehicle & Documents */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Vehicle & Dispatch Info</Text>

          <View style={styles.rowItem}>
            <View style={styles.rowIconCircle}>
              <Bike size={18} color={colors.secondary} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Registered Vehicle</Text>
              <Text style={styles.rowSubtitle}>Two-Wheeler Motorcycle / Scooter</Text>
            </View>
            <View style={styles.regBadge}>
              <Text style={styles.regText}>DL-04-AB-2041</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.rowItem}>
            <View style={styles.rowIconCircle}>
              <ShieldCheck size={18} color={colors.success} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Driving License & KYC</Text>
              <Text style={styles.rowSubtitle}>Approved & Verified by Dispatch Admin</Text>
            </View>
            <Text style={styles.statusOkText}>Active</Text>
          </View>
        </View>

        {/* Section: Bank & Payouts */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Payout Details</Text>

          <View style={styles.rowItem}>
            <View style={styles.rowIconCircle}>
              <CreditCard size={18} color={colors.secondary} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Bank Account Transfer</Text>
              <Text style={styles.rowSubtitle}>HDFC Bank •••• 4092</Text>
            </View>
            <Text style={styles.verifiedSub}>Primary</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.rowItem}>
            <View style={styles.rowIconCircle}>
              <Text style={styles.upiIconText}>UPI</Text>
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Instant UPI ID</Text>
              <Text style={styles.rowSubtitle}>rider@okhdfcbank</Text>
            </View>
            <Text style={styles.verifiedSub}>Linked</Text>
          </View>
        </View>

        {/* Section: Preferences & App Settings */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>App Preferences</Text>

          <View style={styles.rowItem}>
            <View style={styles.rowIconCircle}>
              <Bell size={18} color={colors.secondary} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Push Notifications</Text>
              <Text style={styles.rowSubtitle}>High-priority new order sound & vibration</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={(val) => {
                hapticFeedback.selection();
                setPushEnabled(val);
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.secondary}
            />
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setSupportModalVisible(true)}
            style={styles.rowItem}
          >
            <View style={styles.rowIconCircle}>
              <HelpCircle size={18} color={colors.secondary} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Help & Support Hotline</Text>
              <Text style={styles.rowSubtitle}>Contact dispatch supervisor or hub manager</Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setAboutModalVisible(true)}
            style={styles.rowItem}
          >
            <View style={styles.rowIconCircle}>
              <Info size={18} color={colors.secondary} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>About ZOOOMIT Partner</Text>
              <Text style={styles.rowSubtitle}>Version 1.0.0 • Production Build</Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <AppButton
          title="Sign Out"
          variant="outline"
          icon={LogOut}
          onPress={handleLogout}
          style={styles.logoutBtn}
          textStyle={{ color: colors.error }}
        />
      </ScrollView>

      {/* Support Modal */}
      <Modal visible={supportModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dispatch Support</Text>
              <TouchableOpacity onPress={() => setSupportModalVisible(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Image
              source={require('../../../assets/images/support-illustration.png')}
              style={styles.modalIllustration}
              contentFit="contain"
            />
            <Text style={styles.modalText}>
              Need assistance on the road? Your dedicated ZOOOMIT hub dispatch helpline is active 24/7.
            </Text>
            <View style={styles.supportContactBox}>
              <Text style={styles.supportLabel}>DISPATCH HELPLINE</Text>
              <Text style={styles.supportNumber}>+91 1800 200 4000</Text>
              <Text style={styles.supportEmail}>dispatch@zooomit.in</Text>
            </View>
            <AppButton
              title="Close Support"
              variant="secondary"
              onPress={() => setSupportModalVisible(false)}
              style={{ marginTop: spacing.md }}
            />
          </View>
        </View>
      </Modal>

      {/* About Modal */}
      <Modal visible={aboutModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>About ZOOOMIT</Text>
              <TouchableOpacity onPress={() => setAboutModalVisible(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.aboutTagline}>Fast. Fresh. Instant.</Text>
            <Text style={styles.modalText}>
              ZOOOMIT Delivery Partner App empowers couriers with ultra-fast order acceptance, real-time turn-by-turn navigation, secure delivery OTP validation, and immediate earnings tracking.
            </Text>
            <View style={styles.versionInfo}>
              <Text style={styles.versionText}>Application: ZOOOMIT Delivery Partner</Text>
              <Text style={styles.versionText}>Version: 1.0.0 (Release Build)</Text>
              <Text style={styles.versionText}>Engine: Expo SDK 57 / React Native</Text>
            </View>
            <AppButton
              title="Done"
              variant="primary"
              onPress={() => setAboutModalVisible(false)}
              style={{ marginTop: spacing.md }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.softBackground
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl']
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  avatarText: {
    fontFamily: typography.family.heavy,
    fontSize: typography.size.xl,
    color: colors.secondary
  },
  profileDetails: {
    flex: 1
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2
  },
  partnerName: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.md,
    color: colors.textPrimary
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.badgeDelivered,
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.pill
  },
  verifiedText: {
    fontFamily: typography.family.bold,
    fontSize: 9,
    color: colors.badgeDeliveredText
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2
  },
  infoIcon: {
    marginRight: 4
  },
  infoText: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textSecondary
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5
  },
  statusLabelText: {
    fontFamily: typography.family.medium,
    fontSize: 11,
    color: colors.textMuted
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md
  },
  sectionTitle: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs
  },
  rowIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm
  },
  upiIconText: {
    fontFamily: typography.family.heavy,
    fontSize: 10,
    color: colors.secondary
  },
  rowContent: {
    flex: 1
  },
  rowTitle: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    color: colors.textPrimary
  },
  rowSubtitle: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 1
  },
  regBadge: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryDark,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm
  },
  regText: {
    fontFamily: typography.family.bold,
    fontSize: 10,
    color: '#854D0E'
  },
  statusOkText: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    color: colors.success
  },
  verifiedSub: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.xs,
    color: colors.textMuted
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.xs
  },
  logoutBtn: {
    marginTop: spacing.md,
    borderColor: colors.errorSubtle,
    backgroundColor: colors.surface
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.lg
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  modalTitle: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.md,
    color: colors.textPrimary
  },
  modalIllustration: {
    width: 130,
    height: 130,
    alignSelf: 'center',
    marginVertical: spacing.sm
  },
  modalText: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20
  },
  supportContactBox: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginVertical: spacing.md
  },
  supportLabel: {
    fontFamily: typography.family.bold,
    fontSize: 10,
    color: '#854D0E',
    letterSpacing: 0.5
  },
  supportNumber: {
    fontFamily: typography.family.heavy,
    fontSize: typography.size.lg,
    color: colors.secondary,
    marginTop: 2
  },
  supportEmail: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 2
  },
  aboutTagline: {
    fontFamily: typography.family.heavy,
    fontSize: typography.size.lg,
    color: colors.secondary,
    textAlign: 'center',
    marginVertical: spacing.xs
  },
  versionInfo: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginVertical: spacing.md,
    gap: 4
  },
  versionText: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textSecondary
  }
});
