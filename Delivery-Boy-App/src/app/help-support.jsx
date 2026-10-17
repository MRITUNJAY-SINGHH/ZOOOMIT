import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Linking,
  StatusBar,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Headphones,
  Search,
  Package,
  RotateCw,
  Bell,
  Coins,
  Clock,
  ChevronRight,
  MessageSquare,
  PhoneCall,
  MessageCircle,
  X
} from 'lucide-react-native';
import { typography } from '../constants/theme';
import { hapticFeedback } from '../services/haptics';
import PartnerBottomBar from '../components/PartnerBottomBar';

export default function HelpSupportScreen() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [contactModalVisible, setContactModalVisible] = useState(false);

  // 5 Popular Topics matching reference Screen 3 exactly
  const allTopics = [
    {
      id: 'orders',
      title: 'Orders and assignments',
      subtitle: 'New orders, accepting and cancellations',
      icon: Package,
      iconColor: '#EA580C',
      bgColor: '#FFF7ED',
      borderColor: '#FFEDD5',
      content: {
        heading: 'Orders & Assignment Protocol',
        points: [
          '• When a new order is assigned, you have 60 seconds to review the pickup location, delivery distance, and estimated compensation.',
          '• Tapping "Accept Order" reserves the assignment exclusively for you.',
          '• If you cannot fulfill an order due to a vehicle breakdown or emergency, notify dispatch immediately or use the Cancel with Reason feature to reassign safely without penalties.'
        ]
      }
    },
    {
      id: 'pickup_delivery',
      title: 'Pickup and delivery',
      subtitle: 'Pickup process, delivery process',
      icon: RotateCw,
      iconColor: '#16A34A',
      bgColor: '#F0FDF4',
      borderColor: '#DCFCE7',
      content: {
        heading: 'Pickup & Delivery Process',
        points: [
          '• Arrive at the store dispatch counter and check the order bill number.',
          '• Confirm that all grocery bags are safely sealed and tagged with the matching customer order number.',
          '• Follow the in-app GPS navigation to the customer delivery address and notify customer upon arrival.'
        ]
      }
    },
    {
      id: 'delivery_otp',
      title: 'Delivery OTP problems',
      subtitle: 'Issues with OTP verification',
      icon: Bell,
      iconColor: '#DC2626',
      bgColor: '#FEF2F2',
      borderColor: '#FEE2E2',
      content: {
        heading: 'OTP Verification Troubleshooting',
        points: [
          '• The customer receives a 4-digit verification code via SMS when your status is "Out for Delivery".',
          '• If the customer did not receive the OTP, tap "Resend OTP" on the order delivery card.',
          '• Never leave parcels without entering the verified customer OTP to ensure guaranteed delivery credit.'
        ]
      }
    },
    {
      id: 'earnings_cash',
      title: 'Earnings and cash collection',
      subtitle: 'Delivery earnings and store collection',
      icon: Coins,
      iconColor: '#15803D',
      bgColor: '#F0FDF4',
      borderColor: '#BBF7D0',
      content: {
        heading: 'Earnings & Cash Settlement',
        points: [
          '• You earn a fixed rate per completed delivery configured by the dispatch administration (e.g. ₹20 or ₹30 per order).',
          '• Uncollected earnings accumulate in your "Cash to Collect" account balance.',
          '• Collect your physical cash directly from the store hub counter at the end of your shift upon staff verification.'
        ]
      }
    },
    {
      id: 'app_login',
      title: 'App or login issue',
      subtitle: 'Login, account and technical issues',
      icon: Clock,
      iconColor: '#2563EB',
      bgColor: '#EFF6FF',
      borderColor: '#DBEAFE',
      content: {
        heading: 'Technical & Login Support',
        points: [
          '• If you encounter network connection drops, switch airplane mode off and on to re-establish the connection.',
          '• Keep location permissions set to "Allow all the time" so dispatch can match you with nearby orders.',
          '• For forgotten passwords or locked accounts, contact dispatch manager for an instant credential reset.'
        ]
      }
    }
  ];

  const filteredTopics = allTopics.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCallDispatcher = () => {
    hapticFeedback.medium?.();
    Linking.openURL('tel:18002004000').catch(() => {
      Alert.alert('Dispatch Helpline', 'Direct Helpline: +91 1800 200 4000');
    });
  };

  const handleWhatsAppSupport = () => {
    hapticFeedback.light?.();
    Linking.openURL(
      'whatsapp://send?phone=919876543210&text=Hello%20ZOOOMIT%20Dispatch%2C%20I%20am%20a%20delivery%20partner%20and%20need%20assistance.'
    ).catch(() => {
      Alert.alert('WhatsApp Care', 'WhatsApp Support: +91 98765 43210');
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />

      <SafeAreaView edges={['top']} style={styles.safeAreaHeader}>
        {/* Header Bar */}
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
          <Text style={styles.headerTitle}>Help & Support</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro Section matching reference */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconCircle}>
            <Headphones size={26} color="#111827" strokeWidth={2.2} />
          </View>
          <Text style={styles.heroTitle}>How can we help you?</Text>
          <Text style={styles.heroSubtitle}>
            Find answers to common questions or contact our support team.
          </Text>
        </View>

        {/* Search Field */}
        <View style={styles.searchContainer}>
          <Search size={18} color="#94A3B8" strokeWidth={2} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search help topics..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
          />
        </View>

        {/* Section Heading */}
        <Text style={styles.sectionHeading}>Popular Topics</Text>

        {/* Topics Container Card */}
        <View style={styles.topicsCard}>
          {filteredTopics.map((topic, index) => {
            const IconComp = topic.icon;
            const isLast = index === filteredTopics.length - 1;

            return (
              <React.Fragment key={topic.id}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    hapticFeedback.light?.();
                    setSelectedTopic(topic);
                  }}
                  style={styles.topicRow}
                  accessibilityRole="button"
                  accessibilityLabel={topic.title}
                >
                  {/* Icon Tile */}
                  <View
                    style={[
                      styles.iconTile,
                      {
                        backgroundColor: topic.bgColor,
                        borderColor: topic.borderColor
                      }
                    ]}
                  >
                    <IconComp size={20} color={topic.iconColor} strokeWidth={2} />
                  </View>

                  {/* Text Details */}
                  <View style={styles.topicTextCol}>
                    <Text style={styles.topicTitle}>{topic.title}</Text>
                    <Text style={styles.topicSubtitle}>{topic.subtitle}</Text>
                  </View>

                  {/* Right Chevron */}
                  <ChevronRight size={18} color="#94A3B8" strokeWidth={2} />
                </TouchableOpacity>

                {!isLast && <View style={styles.rowDivider} />}
              </React.Fragment>
            );
          })}
        </View>

        {/* Full-width Yellow Contact Support Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            hapticFeedback.medium?.();
            setContactModalVisible(true);
          }}
          style={styles.contactSupportBtn}
          accessibilityLabel="Contact Support"
          accessibilityRole="button"
        >
          <MessageSquare size={18} color="#111827" strokeWidth={2.2} style={{ marginRight: 8 }} />
          <Text style={styles.contactSupportBtnText}>Contact Support</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Fixed Bottom Navigation matching reference */}
      <PartnerBottomBar activeTab="profile" />

      {/* Topic Details Modal */}
      <Modal
        visible={Boolean(selectedTopic)}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedTopic(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeadingText} numberOfLines={1}>
                {selectedTopic?.content?.heading || selectedTopic?.title}
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSelectedTopic(null)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              {selectedTopic?.content?.points?.map((pt, idx) => (
                <Text key={idx} style={styles.topicPointText}>
                  {pt}
                </Text>
              ))}
            </ScrollView>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSelectedTopic(null)}
              style={styles.modalOkBtn}
            >
              <Text style={styles.modalOkBtnText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Contact Support Action Modal */}
      <Modal
        visible={contactModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setContactModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeadingText}>Contact Dispatch Support</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setContactModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.contactModalSub}>
              Our dispatch management desk is available 24/7 to assist active delivery riders.
            </Text>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={handleCallDispatcher}
              style={styles.channelCallBtn}
            >
              <PhoneCall size={18} color="#FFFFFF" strokeWidth={2.2} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.channelCallTitle}>Call Dispatch Helpline</Text>
                <Text style={styles.channelCallSub}>+91 1800 200 4000 (Toll Free)</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={handleWhatsAppSupport}
              style={styles.channelWhatsAppBtn}
            >
              <MessageCircle size={18} color="#15803D" strokeWidth={2.2} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.channelWhatsAppTitle}>WhatsApp Chat Support</Text>
                <Text style={styles.channelWhatsAppSub}>Instant chat for active deliveries</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingTop: 18,
    paddingBottom: 24
  },

  // Hero section
  heroSection: {
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 8
  },
  heroIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  heroTitle: {
    fontFamily: typography.family.heavy,
    fontSize: 20,
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center'
  },
  heroSubtitle: {
    fontFamily: typography.family.regular,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 290,
    lineHeight: 18
  },

  // Search input
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 20
  },
  searchIcon: {
    marginRight: 10
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.family.medium,
    fontSize: 14,
    color: '#111827'
  },

  // Section Heading
  sectionHeading: {
    fontFamily: typography.family.bold,
    fontSize: 16,
    color: '#111827',
    marginBottom: 10,
    paddingHorizontal: 2
  },

  // Topics Card
  topicsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 18
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13
  },
  iconTile: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  topicTextCol: {
    flex: 1,
    marginRight: 8
  },
  topicTitle: {
    fontFamily: typography.family.bold,
    fontSize: 14.5,
    color: '#111827'
  },
  topicSubtitle: {
    fontFamily: typography.family.regular,
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9'
  },

  // Full-width Yellow Contact Support Button
  contactSupportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFC928',
    borderRadius: 16,
    height: 52
  },
  contactSupportBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 15,
    color: '#111827'
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 20
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  modalHeadingText: {
    fontFamily: typography.family.heavy,
    fontSize: 17,
    color: '#111827',
    flex: 1,
    marginRight: 8
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  topicPointText: {
    fontFamily: typography.family.regular,
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    marginBottom: 10
  },
  modalOkBtn: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFC928',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8
  },
  modalOkBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#111827'
  },

  // Contact Channels
  contactModalSub: {
    fontFamily: typography.family.regular,
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16
  },
  channelCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10
  },
  channelCallTitle: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#FFFFFF'
  },
  channelCallSub: {
    fontFamily: typography.family.regular,
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 2
  },
  channelWhatsAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 14,
    padding: 14
  },
  channelWhatsAppTitle: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#15803D'
  },
  channelWhatsAppSub: {
    fontFamily: typography.family.regular,
    fontSize: 11.5,
    color: '#166534',
    marginTop: 2
  }
});
