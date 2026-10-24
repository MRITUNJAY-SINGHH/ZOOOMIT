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
import { ArrowLeft } from 'lucide-react-native';
import { typography } from '../constants/theme';
import { hapticFeedback } from '../services/haptics';

export default function TermsConditionsScreen() {
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

  // 10 Comprehensive, professional partner agreement sections
  const sections = [
    {
      number: '1',
      title: 'Engagement & Independent Partner Status',
      paragraphs: [
        'Independent Contractor Relationship: You acknowledge and agree that your registration with ZOOOMIT Technologies is as an independent third-party logistics partner. Nothing in this agreement constitutes an employer-employee relationship, agency, joint venture, or legal partnership.',
        'Flexible Operational Schedule: As an independent delivery partner, you have full discretion to choose when you log in and make yourself available to receive delivery orders by toggling your duty status between "Online" and "Offline". You are free to engage in other lawful commercial work when off duty.',
        'Identity & Onboarding Verification: Registration requires submission of authentic, government-recognized identification (Aadhaar/PAN), a valid driving license, and an active mobile number. Submission of falsified, borrowed, or expired documentation will result in immediate and permanent account deactivation.'
      ]
    },
    {
      number: '2',
      title: 'Delivery Allocation & Acceptance Protocol',
      paragraphs: [
        'Algorithmic Dispatch: When your duty status is set to "Online", available orders within your operational zone are dispatched based on GPS proximity, route efficiency, and vehicle type.',
        '60-Second Acceptance Timer: Each incoming order request rings with high-priority chime and provides a 60-second window to inspect pickup location, drop destination, and order details. If the timer elapses without acceptance, the order is promptly reassigned to the next available partner.',
        'Fulfillment Obligation: Once an order is accepted in the app, you enter into a binding operational commitment to head directly to the merchant pickup store without unapproved detours or cancellations.'
      ]
    },
    {
      number: '3',
      title: 'Store Hub Pickup & Order Checklist Verification',
      paragraphs: [
        'Designated Store Arrival: Upon arriving at the assigned merchant grocery hub, you must announce your Order ID to the dispatch or packing counter staff.',
        'Item & Bag Inspection: You must physically review all grocery items against the digital in-app checklist. Inspect bag seals, verify temperature-sensitive or fragile items, and confirm that liquid containers are intact before leaving the store.',
        'Confirming Custodial Responsibility: Tap "Confirm Pickup" in the application only after complete physical verification. Upon confirmation, you assume custodial responsibility for the safety and condition of all grocery items until successful doorstep handover.'
      ]
    },
    {
      number: '4',
      title: 'Safe Transit & Customer Doorstep OTP Handover',
      paragraphs: [
        'Direct Transit Route: After completing pickup, you must proceed immediately along the recommended route to the customer address provided in the application. Unauthorized stops, package tampering, or multi-app diversion while carrying customer goods is strictly prohibited.',
        'Mandatory 4-Digit Customer OTP: To guarantee delivery integrity and prevent false claims, every completed delivery requires the customer to provide a unique 4-digit One-Time Password (OTP) generated on their application.',
        'Strict No-OTP Delivery Prohibition: You must NEVER leave grocery packages unattended at doorsteps, gates, or hand over items without entering and verifying the customer OTP in your app. Delivering without valid OTP verification violates platform policy and constitutes a serious platform violation.'
      ]
    },
    {
      number: '5',
      title: 'Partner Engagement & Manual Compensation',
      paragraphs: [
        'Direct Owner Settlement: Delivery partners are engaged directly by the business merchant. All compensation, payments, allowances, and incentives are agreed upon and settled manually outside of the ZOOOMIT mobile application.',
        'No In-App Payouts or Balances: The ZOOOMIT application serves solely as an order dispatch, navigation, and fulfillment tracking tool. The app does not calculate, promise, track, or disburse partner earnings or balances.',
        'Shift and Duty Tracking: Completed delivery counts and operational history recorded in the app may be used by the store owner for shift reconciliation during external manual settlements.',
        'COD Customer Collection: For Cash-on-Delivery (COD) orders, partners must collect the exact invoice amount from the customer and remit the full amount to the store hub counter without deduction.'
      ]
    },
    {
      number: '6',
      title: 'Vehicle Compliance, Licenses & Road Safety',
      paragraphs: [
        'Authorized Vehicle Types: You may deliver orders only using the vehicle category registered on your profile (Motorcycle, Scooter, or Bicycle).',
        'Valid Documentation: Motorized vehicle operators must maintain a valid Permanent Driving License, active Vehicle Registration Certificate (RC), third-party motor insurance, and Pollution Under Control (PUC) certificate at all times.',
        'Road Safety & Mandatory Helmets: You must wear a certified safety helmet at all times while operating a two-wheeler on active duty. You must obey all speed limits, traffic signals, and traffic laws. ZOOOMIT is not responsible for traffic citations, challans, or accident liabilities incurred during delivery.'
      ]
    },
    {
      number: '7',
      title: 'Customer Privacy & Professional Code of Conduct',
      paragraphs: [
        'Strict Confidentiality: Customer personal data, including phone numbers, door addresses, and grocery order contents, is confidential. You must never copy, memorize, screenshot, or share customer contact details.',
        'Masked In-App Communication: Phone calls to customers must be conducted exclusively through the in-app coordination button and restricted solely to order transit coordination. Contacting customers after order completion is strictly forbidden and grounds for legal action.',
        'Professionalism: Delivery partners must maintain polite and respectful communication with store personnel, apartment security guards, and customers. Abusive language, harassment, discrimination, or physical confrontation results in permanent deactivation.'
      ]
    },
    {
      number: '8',
      title: 'Cancellations, Return Policy & Transit Emergencies',
      paragraphs: [
        'Unreachable Customer Protocol: If a customer is unresponsive at the drop location, you must make a minimum of 3 calling attempts over a 5-minute wait window and notify Dispatch Support through the app.',
        'Mandatory Return of Goods: Never discard, consume, or retain undelivered groceries. All unfulfilled deliveries must be returned intact to the originating store hub immediately.',
        'Breakdown or Emergency: In case of mechanical failure, flat tire, or medical emergency, immediately tap the Support button in the app so dispatch supervisors can reassign the order to an assisting partner.'
      ]
    },
    {
      number: '9',
      title: 'Platform Discipline, Penalties & Deactivation',
      paragraphs: [
        'Immediate Termination Grounds: ZOOOMIT reserves the right to immediately terminate partner account access for: (a) Attempting to bypass OTP verification; (b) Package tampering, item theft, or pilferage; (c) Sharing app login credentials with unauthorized individuals; (d) Driving under the influence of alcohol or drugs; (e) Failure to remit collected COD order amounts.',
        'Review & Audit: Terminated or suspended accounts are reviewed by the Partner Compliance Committee. Disciplinary actions and compensation adjustments are handled directly by the store management.'
      ]
    },
    {
      number: '10',
      title: 'Modifications, Grievances & Governing Law',
      paragraphs: [
        'Updates to Terms: ZOOOMIT reserves the right to modify these Terms and Conditions with prior in-app notice. Continued use of the application following updates constitutes acceptance of revised terms.',
        'Partner Support Contact: For contractual inquiries, account assistance, or dispute escalations, contact: Email: partners@zooomit.in | Phone: +91 1800 200 4000 (Toll-Free, 24/7).',
        'Jurisdiction: This agreement is governed by the laws of India. Any unresolved dispute shall be subject to arbitration in accordance with the Arbitration and Conciliation Act, under the jurisdiction of the company headquarters.'
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
          <Text style={styles.headerTitle}>Terms & Conditions</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Card containing all 10 detailed numbered sections */}
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
            By logging in and accepting orders, you agree to comply with all operational guidelines and safety protocols.
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
