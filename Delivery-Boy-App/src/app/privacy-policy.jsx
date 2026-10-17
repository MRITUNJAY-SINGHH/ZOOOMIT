import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  BackHandler
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react-native';
import { typography } from '../constants/theme';
import { hapticFeedback } from '../services/haptics';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const isNavigatingBack = useRef(false);

  // Debounced back navigation to prevent duplicate pop/push and looping
  const handleBack = () => {
    if (isNavigatingBack.current) return;
    isNavigatingBack.current = true;
    hapticFeedback.light?.();

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile');
    }

    setTimeout(() => {
      isNavigatingBack.current = false;
    }, 100);
  };

  useEffect(() => {
    const onBackPress = () => {
      handleBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, []);

  // Comprehensive, detailed delivery partner privacy policy
  const sections = [
    {
      number: '1',
      title: 'Information We Collect & Device Telemetry',
      paragraphs: [
        'Personal Identity Details: We collect your verified legal full name, registered mobile phone number, login email address, emergency contact numbers, and vehicle category (motorcycle, scooter, or bicycle).',
        'Real-Time Road Telemetry: When you are logged in and switched to "Online" status, we collect continuous foreground and background GPS location data, active route bearings, transit speed, and device network connectivity.',
        'Order Handover Verification: We record timestamps of store arrival, grocery pickup checklist completion, doorstep arrival, and encrypted hash records of customer OTP verification codes.',
        'Device & Diagnostic Telemetry: We collect device model, operating system version, battery status, and crash analytics to optimize app responsiveness and diagnose routing issues.'
      ]
    },
    {
      number: '2',
      title: 'How Your Information Is Used',
      paragraphs: [
        'Proximity Dispatch Matching: Your real-time road position is used by the automated dispatch engine to match you with pickup grocery stores and customer drops closest to you.',
        'Accurate Customer ETAs: Live telemetry computes precise arrival estimates for customer tracking screens and store packing desks.',
        'Compensation & Ledger Accuracy: Every delivered order is logged to compute your per-delivery compensation at the admin-configured rate and update your real-time "Cash to Collect" store balance.',
        'Safety & Dispute Resolution: In case of doorstep delivery disputes or missing packages, logged OTP handovers and GPS timestamps protect you against false non-delivery claims.'
      ]
    },
    {
      number: '3',
      title: 'Background GPS & Duty Tracking Policy',
      paragraphs: [
        'Active Duty Only: Background location access is utilized exclusively while your status toggle is set to "Online" and during active order fulfillment legs.',
        'Offline Privacy Guarantee: As soon as you toggle your status to "Offline" or log out of the application, all background location tracking immediately terminates.',
        'Restricted Access: Your exact live location is never made public on the web. It is visible only to dispatch supervisors and to the specific customer whose order you are actively delivering.'
      ]
    },
    {
      number: '4',
      title: 'Data Security & Storage Standards',
      paragraphs: [
        'End-to-End Encryption: All transmissions between the delivery app and ZOOOMIT cloud dispatch servers are secured with 256-bit TLS/SSL encryption.',
        'Secure Credential Storage: Session authorization tokens and sensitive caches are stored in device hardware keychains (Expo SecureStore) rather than unencrypted storage.',
        'Role-Based Staff Access: Partner profile information, phone numbers, and compensation history can only be accessed by authorized dispatch personnel with audited authentication.'
      ]
    },
    {
      number: '5',
      title: 'Customer Communications & Privacy Masking',
      paragraphs: [
        'Phone Number Protection: Calls made to customers through the in-app coordination button route through automated virtual masking servers where supported to protect your personal number.',
        'Non-Contact Rule: You must never copy, save, or use customer phone numbers or delivery addresses for personal communication outside the active delivery window.'
      ]
    },
    {
      number: '6',
      title: 'Store Cash Settlements & Financial Privacy',
      paragraphs: [
        'Ledger Records: Your delivery counts, configured rate per order, physical cash settlements collected at the store hub counter, and remaining balances are permanently logged for financial audits.',
        'No Sensitive Bank Storage: Because ZOOOMIT operates on the verified physical store cash settlement model, the application does not store bank account numbers, debit cards, or UPI PINs.'
      ]
    },
    {
      number: '7',
      title: 'Non-Sale of Data & Third-Party Disclosure',
      paragraphs: [
        'Zero Data Commercialization: ZOOOMIT does not sell, lease, or monetize delivery partner personal data, trip histories, or contact numbers to third-party advertisers or marketing agencies.',
        'Operational Service Providers: Data is shared strictly with core operational infrastructure providers, including cloud hosting facilities, mapping and route optimization APIs, and SMS dispatch gateways.'
      ]
    },
    {
      number: '8',
      title: 'Data Retention & Record Purging',
      paragraphs: [
        'Active Partner Records: Profile, delivery history, and settlement records are retained while your delivery partner agreement remains active.',
        'Statutory Compliance: In compliance with applicable commercial and tax regulations, order records and cash settlement logs are archived for a minimum statutory period of 3 years before automated purging.',
        'Account Closure: Upon formal disassociation from the fleet, your background telemetry is permanently deleted from operational tracking servers.'
      ]
    },
    {
      number: '9',
      title: 'Your Rights & Privacy Choices',
      paragraphs: [
        'Profile Accuracy: You can view your registered details in the Personal Information screen and request phone or credential corrections through your dispatch manager.',
        'Notification Controls: Manage order incoming alerts, vibrations, and status push notifications through the in-app settings or your device system settings.',
        'Data Inquiries: You may request a complete summary of your delivery records or report a privacy concern at any time.'
      ]
    },
    {
      number: '10',
      title: 'Contact Privacy Desk & Grievance Officer',
      paragraphs: [
        'Dispatch Privacy Office: For any questions, data access requests, or privacy grievances, reach out to our dedicated partner care desk:',
        'Email: privacy@zooomit.in\nHelpline: +91 1800 200 4000 (Toll Free, 24/7)\nHeadquarters: ZOOOMIT Technologies Pvt. Ltd., Fleet Operations Hub.',
        'Resolution SLA: All partner privacy inquiries are formally logged and responded to within 24 operational hours.'
      ]
    }
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />

      <SafeAreaView edges={['top']} style={styles.safeAreaHeader}>
        {/* Header Bar matching reference */}
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.backBtn}
            accessibilityLabel="Back"
            accessibilityRole="button"
          >
            <ArrowLeft size={22} color="#111827" strokeWidth={2.2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro Badge Card */}
        <View style={styles.introCard}>
          <View style={styles.shieldIconCircle}>
            <ShieldCheck size={22} color="#15803D" strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <Text style={styles.introCardTitle}>Delivery Partner Privacy Standard</Text>
              <View style={styles.activeTag}>
                <CheckCircle2 size={12} color="#15803D" strokeWidth={2.5} style={{ marginRight: 4 }} />
                <Text style={styles.activeTagText}>Active</Text>
              </View>
            </View>
            <Text style={styles.introCardSub}>
              Version 2.4 • Applicable to all registered two-wheeler and fleet delivery partners.
            </Text>
          </View>
        </View>

        {/* Content Card with 10 Detailed Numbered Sections */}
        <View style={styles.contentCard}>
          {sections.map((sec, index) => {
            const isLast = index === sections.length - 1;

            return (
              <React.Fragment key={sec.number}>
                <View style={styles.sectionRow}>
                  {/* Yellow Circle Number Badge matching reference */}
                  <View style={styles.numberBadge}>
                    <Text style={styles.numberText}>{sec.number}</Text>
                  </View>

                  {/* Section Title & Multiple Detailed Paragraphs */}
                  <View style={styles.sectionTextCol}>
                    <Text style={styles.sectionTitle}>{sec.title}</Text>
                    {sec.paragraphs.map((para, pIdx) => (
                      <Text key={pIdx} style={styles.sectionParagraph}>
                        {para}
                      </Text>
                    ))}
                  </View>
                </View>

                {!isLast && <View style={styles.rowDivider} />}
              </React.Fragment>
            );
          })}
        </View>

        {/* Footer Notice */}
        <View style={styles.footerBox}>
          <Text style={styles.footerText}>
            © 2026 ZOOOMIT Technologies Pvt. Ltd. All rights reserved.{'\n'}
            All partner telemetry and account records are protected under Indian IT Act and digital data protection guidelines.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  safeAreaHeader: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    fontFamily: typography.family.heavy,
    fontSize: 18,
    color: '#111827'
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40
  },

  // Intro Card
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 14
  },
  shieldIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2
  },
  introCardTitle: {
    fontFamily: typography.family.bold,
    fontSize: 14.5,
    color: '#111827'
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12
  },
  activeTagText: {
    fontFamily: typography.family.bold,
    fontSize: 11,
    color: '#15803D'
  },
  introCardSub: {
    fontFamily: typography.family.regular,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16
  },

  // Main Card
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16
  },

  // Yellow Circle Number Badge matching reference
  numberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFD233',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    marginTop: 2
  },
  numberText: {
    fontFamily: typography.family.heavy,
    fontSize: 14,
    color: '#111827'
  },

  sectionTextCol: {
    flex: 1
  },
  sectionTitle: {
    fontFamily: typography.family.bold,
    fontSize: 15.5,
    color: '#111827',
    marginBottom: 6
  },
  sectionParagraph: {
    fontFamily: typography.family.regular,
    fontSize: 13,
    color: '#475569',
    lineHeight: 19.5,
    marginBottom: 8
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9'
  },

  // Footer
  footerBox: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16
  },
  footerText: {
    fontFamily: typography.family.regular,
    fontSize: 11.5,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 17
  }
});
