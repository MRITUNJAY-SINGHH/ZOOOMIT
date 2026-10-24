import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  BackHandler,
  Linking,
  Modal,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Headphones,
  PhoneCall,
  MessageCircle,
  FileText,
  Send,
  CheckCircle2,
  X
} from 'lucide-react-native';
import { typography } from '../constants/theme';
import { deliveryService } from '../services/deliveryService';
import { hapticFeedback } from '../services/haptics';
import PartnerBottomBar from '../components/PartnerBottomBar';

export default function ContactSupportScreen() {
  const router = useRouter();
  const { categoryId = 'delivery_issue' } = useLocalSearchParams();
  const isNavigatingBack = useRef(false);

  const [category, setCategory] = useState(
    categoryId === 'orders' || categoryId === 'pickup_delivery' || categoryId === 'delivery_otp'
      ? 'delivery_issue'
      : categoryId === 'app_login'
      ? 'app_problem'
      : 'delivery_issue'
  );

  const [orderId, setOrderId] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketResult, setTicketResult] = useState(null);

  const issueCategories = [
    { id: 'delivery_issue', label: 'Active Order Issue' },
    { id: 'app_problem', label: 'App Technical Bug' },
    { id: 'suggestion', label: 'Shift & Scheduling' },
    { id: 'general_feedback', label: 'General Support' }
  ];

  // Debounced back navigation to prevent duplicate pop/push and looping
  const handleBack = () => {
    if (isNavigatingBack.current) return;
    isNavigatingBack.current = true;
    hapticFeedback.light?.();

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/help-support');
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

  const handleCallSupport = () => {
    hapticFeedback.medium?.();
    Linking.openURL('tel:18002004000').catch(() => {
      Alert.alert('Dispatch Helpline', 'Direct Helpline: +91 1800 200 4000');
    });
  };

  const handleWhatsApp = () => {
    hapticFeedback.light?.();
    Linking.openURL(
      'whatsapp://send?phone=919876543210&text=Hello%20ZOOOMIT%20Dispatch%2C%20I%20am%20a%20delivery%20partner%20and%20need%20assistance.'
    ).catch(() => {
      Alert.alert('WhatsApp Care', 'WhatsApp Support: +91 98765 43210');
    });
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Required Field', 'Please describe your problem so our team can resolve it.');
      return;
    }

    try {
      setIsSubmitting(true);
      hapticFeedback.medium?.();

      const res = await deliveryService.submitFeedback(
        category,
        description.trim(),
        orderId.trim()
      );

      const refId = res.feedbackId
        ? `ZP-${res.feedbackId.toString().slice(-6).toUpperCase()}`
        : `ZP-${Math.floor(100000 + Math.random() * 900000)}`;

      hapticFeedback.success?.();
      setTicketResult({
        referenceId: refId,
        message: res.message || 'Support request submitted successfully.'
      });
      setDescription('');
      setOrderId('');
    } catch (err) {
      hapticFeedback.error?.();
      Alert.alert('Submission Error', err.message || 'Unable to submit support request. Please try again or call dispatch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />

      <SafeAreaView edges={['top']} style={styles.safeAreaHeader}>
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.backBtn}
            accessibilityLabel="Back to Help & Support"
            accessibilityRole="button"
          >
            <ArrowLeft size={22} color="#111827" strokeWidth={2.2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contact Support</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Direct Emergency Dispatch Helplines */}
        <View style={styles.channelsCard}>
          <View style={styles.channelsHeaderRow}>
            <View style={styles.headphoneIconBox}>
              <Headphones size={20} color="#111827" strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.channelsCardTitle}>Instant Dispatch Helpline</Text>
              <Text style={styles.channelsCardSub}>
                Available 24/7 for urgent order, vehicle, or doorstep road support.
              </Text>
            </View>
          </View>

          <View style={styles.channelsBtnRow}>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={handleCallSupport}
              style={styles.callChannelBtn}
              accessibilityRole="button"
              accessibilityLabel="Call Dispatch"
            >
              <PhoneCall size={16} color="#FFFFFF" strokeWidth={2.2} style={{ marginRight: 6 }} />
              <Text style={styles.callChannelText}>Call Dispatch</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={handleWhatsApp}
              style={styles.whatsappChannelBtn}
              accessibilityRole="button"
              accessibilityLabel="WhatsApp Support"
            >
              <MessageCircle size={16} color="#15803D" strokeWidth={2.2} style={{ marginRight: 6 }} />
              <Text style={styles.whatsappChannelText}>WhatsApp Care</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Title */}
        <Text style={styles.formSectionTitle}>Raise a Support Request</Text>
        <Text style={styles.formSectionSubtitle}>
          Select your issue category and submit your request. A supervisor will review it promptly.
        </Text>

        {/* Issue Category Pills */}
        <Text style={styles.inputLabel}>Issue Category</Text>
        <View style={styles.categoryPillsWrap}>
          {issueCategories.map((cat) => {
            const isSelected = category === cat.id;

            return (
              <TouchableOpacity
                key={cat.id}
                activeOpacity={0.7}
                onPress={() => {
                  hapticFeedback.selection?.();
                  setCategory(cat.id);
                }}
                style={[
                  styles.categoryPill,
                  isSelected && styles.categoryPillSelected
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isSelected && styles.categoryPillTextSelected
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Optional Order ID Field */}
        <Text style={styles.inputLabel}>Order ID (Optional)</Text>
        <View style={styles.inputWrapper}>
          <FileText size={18} color="#94A3B8" strokeWidth={2} style={styles.inputPrefixIcon} />
          <TextInput
            value={orderId}
            onChangeText={setOrderId}
            placeholder="Enter order ID (e.g. #ZM102300)"
            placeholderTextColor="#94A3B8"
            style={styles.textInput}
          />
        </View>

        {/* Description Field */}
        <Text style={styles.inputLabel}>Describe the Problem</Text>
        <View style={styles.textareaWrapper}>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the issue in detail so the hub team can resolve it...&#10;(Max 500 characters)"
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={5}
            maxLength={500}
            style={styles.textareaInput}
            textAlignVertical="top"
          />
          <Text style={styles.charCounter}>{description.length}/500</Text>
        </View>

        {/* Submit Request Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={styles.submitBtn}
          accessibilityRole="button"
          accessibilityLabel="Submit Support Request"
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#111827" />
          ) : (
            <>
              <Send size={18} color="#111827" strokeWidth={2.2} style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>Submit Support Request</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Fixed Bottom Navigation */}
      <PartnerBottomBar activeTab="profile" />

      {/* Ticket Success Confirmation Modal */}
      <Modal
        visible={Boolean(ticketResult)}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setTicketResult(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.successIconCircle}>
              <CheckCircle2 size={32} color="#15803D" strokeWidth={2.4} />
            </View>

            <Text style={styles.modalSuccessTitle}>Request Submitted</Text>
            <Text style={styles.modalRefText}>
              Reference Ticket: <Text style={styles.modalRefBold}>{ticketResult?.referenceId}</Text>
            </Text>

            <Text style={styles.modalMessageText}>
              Your support request has been logged in the dispatch portal. A supervisor will review the details and contact you if needed.
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setTicketResult(null);
                router.navigate('/help-support');
              }}
              style={styles.modalDoneBtn}
            >
              <Text style={styles.modalDoneText}>Done</Text>
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
    paddingTop: 16,
    paddingBottom: 110
  },

  // Channels Card
  channelsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 20
  },
  channelsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14
  },
  headphoneIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  channelsCardTitle: {
    fontFamily: typography.family.bold,
    fontSize: 15,
    color: '#111827',
    marginBottom: 2
  },
  channelsCardSub: {
    fontFamily: typography.family.regular,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16
  },
  channelsBtnRow: {
    flexDirection: 'row',
    gap: 10
  },
  callChannelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    borderRadius: 12,
    height: 42
  },
  callChannelText: {
    fontFamily: typography.family.bold,
    fontSize: 13,
    color: '#FFFFFF'
  },
  whatsappChannelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 12,
    height: 42
  },
  whatsappChannelText: {
    fontFamily: typography.family.bold,
    fontSize: 13,
    color: '#15803D'
  },

  // Form Section
  formSectionTitle: {
    fontFamily: typography.family.heavy,
    fontSize: 16,
    color: '#111827',
    marginBottom: 4,
    paddingHorizontal: 2
  },
  formSectionSubtitle: {
    fontFamily: typography.family.regular,
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
    paddingHorizontal: 2
  },
  inputLabel: {
    fontFamily: typography.family.bold,
    fontSize: 13.5,
    color: '#111827',
    marginBottom: 8,
    paddingHorizontal: 2
  },

  // Category Pills
  categoryPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB'
  },
  categoryPillSelected: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D'
  },
  categoryPillText: {
    fontFamily: typography.family.medium,
    fontSize: 12.5,
    color: '#475569'
  },
  categoryPillTextSelected: {
    fontFamily: typography.family.bold,
    color: '#111827'
  },

  // Inputs
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 16
  },
  inputPrefixIcon: {
    marginRight: 10
  },
  textInput: {
    flex: 1,
    fontFamily: typography.family.medium,
    fontSize: 14,
    color: '#111827'
  },
  textareaWrapper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
    minHeight: 120,
    marginBottom: 18
  },
  textareaInput: {
    fontFamily: typography.family.regular,
    fontSize: 14,
    color: '#111827',
    minHeight: 80
  },
  charCounter: {
    fontFamily: typography.family.regular,
    fontSize: 11.5,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 4
  },

  // Submit Button
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFC928',
    borderRadius: 16,
    height: 52
  },
  submitBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 15,
    color: '#111827'
  },

  // Modal
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
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 24,
    alignItems: 'center'
  },
  successIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  modalSuccessTitle: {
    fontFamily: typography.family.heavy,
    fontSize: 18,
    color: '#111827',
    marginBottom: 6
  },
  modalRefText: {
    fontFamily: typography.family.medium,
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12
  },
  modalRefBold: {
    fontFamily: typography.family.heavy,
    color: '#111827'
  },
  modalMessageText: {
    fontFamily: typography.family.regular,
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20
  },
  modalDoneBtn: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFC928',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%'
  },
  modalDoneText: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#111827'
  }
});
