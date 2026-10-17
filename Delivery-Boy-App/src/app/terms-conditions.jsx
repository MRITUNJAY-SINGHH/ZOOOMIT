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

export default function TermsConditionsScreen() {
  const router = useRouter();

  // Exactly 5 numbered sections matching reference Screen 7
  const sections = [
    {
      number: '1',
      title: 'Using the App',
      body: 'You agree to use the app only for legitimate delivery purposes and in accordance with these terms.'
    },
    {
      number: '2',
      title: 'Delivery Responsibilities',
      body: 'You are responsible for completing assigned deliveries carefully, following the provided instructions and maintaining good service standards.'
    },
    {
      number: '3',
      title: 'Order Handling',
      body: 'You must follow the pickup and delivery process, verify customer details when required and complete deliveries as per the app workflow.'
    },
    {
      number: '4',
      title: 'Account Access',
      body: 'You are responsible for keeping your account secure and must not share your login credentials with anyone.'
    },
    {
      number: '5',
      title: 'Support and Changes',
      body: 'We may update these terms from time to time. Continued use of the app means you accept the updated terms.'
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
          <Text style={styles.headerTitle}>Terms & Conditions</Text>
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
