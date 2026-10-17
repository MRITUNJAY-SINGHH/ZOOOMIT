import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { typography } from '../constants/theme';
import { hapticFeedback } from '../services/haptics';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  // Exactly 5 numbered sections matching reference Screen 6
  const sections = [
    {
      number: '1',
      title: 'Information We Use',
      body: 'We collect basic information such as your name, contact details and app usage data to provide and improve our services.'
    },
    {
      number: '2',
      title: 'How Information Is Used',
      body: 'Your information is used to manage deliveries, support your account and improve the app experience.'
    },
    {
      number: '3',
      title: 'Data Protection',
      body: 'We take appropriate measures to protect your information and prevent unauthorized access, disclosure or misuse.'
    },
    {
      number: '4',
      title: 'Your Choices',
      body: 'You can contact us if you have any questions about your information or want to request changes, where applicable.'
    },
    {
      number: '5',
      title: 'Contact',
      body: 'If you have any concerns about this Privacy Policy, please reach out to our support team through the app.'
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
            onPress={() => {
              hapticFeedback.light?.();
              router.back();
            }}
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
        {/* Card containing all 5 numbered sections */}
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

                  {/* Section Title & Body */}
                  <View style={styles.sectionTextCol}>
                    <Text style={styles.sectionTitle}>{sec.title}</Text>
                    <Text style={styles.sectionBody}>{sec.body}</Text>
                  </View>
                </View>

                {!isLast && <View style={styles.rowDivider} />}
              </React.Fragment>
            );
          })}
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
    paddingVertical: 8
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
    fontSize: 15,
    color: '#111827'
  },

  sectionTextCol: {
    flex: 1
  },
  sectionTitle: {
    fontFamily: typography.family.bold,
    fontSize: 15.5,
    color: '#111827',
    marginBottom: 4
  },
  sectionBody: {
    fontFamily: typography.family.regular,
    fontSize: 13,
    color: '#475569',
    lineHeight: 19
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9'
  }
});
