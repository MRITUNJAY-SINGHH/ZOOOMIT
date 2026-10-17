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
  Alert,
  BackHandler
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  AlertTriangle,
  Bug,
  Lightbulb,
  MessageSquare,
  FileText,
  Send,
  CheckCircle2
} from 'lucide-react-native';
import { typography } from '../constants/theme';
import { deliveryService } from '../services/deliveryService';
import { hapticFeedback } from '../services/haptics';

export default function FeedbackScreen() {
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

  const [selectedCategory, setSelectedCategory] = useState('delivery_issue');
  const [orderId, setOrderId] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // 4 Selectable categories in 2x2 grid matching reference Screen 4
  const categories = [
    {
      id: 'delivery_issue',
      title: 'Report a\nDelivery issue',
      icon: AlertTriangle,
      iconColor: '#D97706'
    },
    {
      id: 'app_problem',
      title: 'Report an\nApp Problem',
      icon: Bug,
      iconColor: '#475569'
    },
    {
      id: 'suggestion',
      title: 'Suggest an\nImprovement',
      icon: Lightbulb,
      iconColor: '#475569'
    },
    {
      id: 'general_feedback',
      title: 'Share General\nFeedback',
      icon: MessageSquare,
      iconColor: '#475569'
    }
  ];

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Required Field', 'Please describe the issue or share your feedback.');
      return;
    }

    try {
      setIsSubmitting(true);
      hapticFeedback.medium?.();

      await deliveryService.submitFeedback(
        selectedCategory,
        description.trim(),
        orderId.trim()
      );

      hapticFeedback.success?.();
      setIsSubmitted(true);
      setDescription('');
      setOrderId('');
    } catch (err) {
      hapticFeedback.error?.();
      Alert.alert('Submission Failed', err.message || 'Unable to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <Text style={styles.headerTitle}>Feedback & Suggestions</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 2x2 Grid of Feedback Categories matching reference */}
        <View style={styles.categoriesGrid}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const IconComp = cat.icon;

            return (
              <TouchableOpacity
                key={cat.id}
                activeOpacity={0.75}
                onPress={() => {
                  hapticFeedback.selection?.();
                  setSelectedCategory(cat.id);
                  if (isSubmitted) setIsSubmitted(false);
                }}
                style={[
                  styles.categoryCard,
                  isSelected && styles.categoryCardSelected
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <IconComp
                  size={26}
                  color={isSelected ? '#D97706' : '#64748B'}
                  strokeWidth={2}
                  style={styles.categoryIcon}
                />
                <Text
                  style={[
                    styles.categoryTitle,
                    isSelected && styles.categoryTitleSelected
                  ]}
                >
                  {cat.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Order ID Field (Optional) */}
        <Text style={styles.inputLabel}>Order ID (Optional)</Text>
        <View style={styles.orderIdInputWrapper}>
          <FileText size={18} color="#94A3B8" strokeWidth={2} style={styles.inputPrefixIcon} />
          <TextInput
            value={orderId}
            onChangeText={(text) => {
              setOrderId(text);
              if (isSubmitted) setIsSubmitted(false);
            }}
            placeholder="Enter order ID (e.g. #ZM102300)"
            placeholderTextColor="#94A3B8"
            style={styles.orderIdInput}
          />
        </View>

        {/* Tell Us More Field */}
        <Text style={styles.inputLabel}>Tell us more</Text>
        <View style={styles.textareaWrapper}>
          <TextInput
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              if (isSubmitted) setIsSubmitted(false);
            }}
            placeholder="Describe the issue or share your feedback...&#10;(Max 500 characters)"
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={5}
            maxLength={500}
            style={styles.textareaInput}
            textAlignVertical="top"
          />
          <Text style={styles.charCounter}>{description.length}/500</Text>
        </View>

        {/* Submit Button matching reference */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={styles.submitBtn}
          accessibilityLabel="Submit Feedback"
          accessibilityRole="button"
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#111827" />
          ) : (
            <>
              <Send size={18} color="#111827" strokeWidth={2.2} style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>Submit Feedback</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Feedback Submitted Card matching reference Screen 4 */}
        {isSubmitted && (
          <View style={styles.successBanner}>
            <View style={styles.successIconCircle}>
              <CheckCircle2 size={24} color="#16A34A" strokeWidth={2.4} />
            </View>
            <View style={styles.successTextCol}>
              <Text style={styles.successTitle}>Feedback Submitted!</Text>
              <Text style={styles.successSubtitle}>
                Thank you for your feedback. We appreciate your time.
              </Text>
            </View>
          </View>
        )}
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

  // 2x2 Grid of Categories
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  categoryCardSelected: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D'
  },
  categoryIcon: {
    marginBottom: 10
  },
  categoryTitle: {
    fontFamily: typography.family.bold,
    fontSize: 13,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 18
  },
  categoryTitleSelected: {
    color: '#111827'
  },

  // Labels
  inputLabel: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#111827',
    marginBottom: 8,
    paddingHorizontal: 2
  },

  // Order ID input
  orderIdInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 18
  },
  inputPrefixIcon: {
    marginRight: 10
  },
  orderIdInput: {
    flex: 1,
    fontFamily: typography.family.medium,
    fontSize: 14,
    color: '#111827'
  },

  // Textarea
  textareaWrapper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
    minHeight: 130,
    marginBottom: 20
  },
  textareaInput: {
    fontFamily: typography.family.regular,
    fontSize: 14,
    color: '#111827',
    minHeight: 90
  },
  charCounter: {
    fontFamily: typography.family.regular,
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 4
  },

  // Full-width Submit button
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFC928',
    borderRadius: 16,
    height: 52,
    marginBottom: 16
  },
  submitBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 15,
    color: '#111827'
  },

  // Feedback Submitted Success Banner matching reference
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    borderRadius: 16,
    padding: 16
  },
  successIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  successTextCol: {
    flex: 1
  },
  successTitle: {
    fontFamily: typography.family.bold,
    fontSize: 15,
    color: '#15803D',
    marginBottom: 2
  },
  successSubtitle: {
    fontFamily: typography.family.regular,
    fontSize: 12.5,
    color: '#166534',
    lineHeight: 17
  }
});
