import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  BackHandler,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Search,
  ChevronDown,
  ChevronUp,
  Package,
  RotateCw,
  Bell,
  Coins,
  Clock,
  HelpCircle,
  MessageSquare,
  X
} from 'lucide-react-native';
import { typography } from '../constants/theme';
import { hapticFeedback } from '../services/haptics';
import { FAQ_CATEGORIES, FAQ_ITEMS } from '../constants/faqData';
import PartnerBottomBar from '../components/PartnerBottomBar';

const isFabric = Boolean(global.nativeFabricUIManager || global._IS_FABRIC);
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental && !isFabric) {
  try {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  } catch {}
}

const ICON_MAP = {
  Package,
  RotateCw,
  Bell,
  Coins,
  Clock
};

export default function HelpTopicScreen() {
  const router = useRouter();
  const { categoryId = 'orders' } = useLocalSearchParams();
  const isNavigatingBack = useRef(false);
  const isNavigatingRef = useRef(false);

  const [expandedId, setExpandedId] = useState(null);
  const [topicSearch, setTopicSearch] = useState('');

  const category = FAQ_CATEGORIES.find((c) => c.id === categoryId) || FAQ_CATEGORIES[0];
  const IconComp = ICON_MAP[category.iconName] || HelpCircle;

  const categoryQuestions = FAQ_ITEMS.filter((item) => item.categoryId === category.id);

  const filteredQuestions = categoryQuestions.filter((q) => {
    if (!topicSearch.trim()) return true;
    const query = topicSearch.toLowerCase().trim();
    return (
      q.question.toLowerCase().includes(query) ||
      q.answer.toLowerCase().includes(query) ||
      q.keywords.some((kw) => kw.toLowerCase().includes(query))
    );
  });

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

  const handleContactDeskPress = () => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    hapticFeedback.medium?.();
    router.push({ pathname: '/contact-support', params: { categoryId: category.id } });
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 500);
  };

  const toggleExpand = (id) => {
    hapticFeedback.selection?.();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
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
            accessibilityLabel="Back to Help Topics"
            accessibilityRole="button"
          >
            <ArrowLeft size={22} color="#111827" strokeWidth={2.2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {category.shortTitle || category.title}
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Topic Banner Card */}
        <View style={styles.bannerCard}>
          <View
            style={[
              styles.bannerIconCircle,
              { backgroundColor: category.bgColor, borderColor: category.borderColor }
            ]}
          >
            <IconComp size={24} color={category.iconColor} strokeWidth={2.2} />
          </View>
          <Text style={styles.bannerTitle}>{category.title}</Text>
          <Text style={styles.bannerDescription}>{category.description}</Text>
        </View>

        {/* In-topic Search Input */}
        <View style={styles.searchWrapper}>
          <Search size={18} color="#94A3B8" strokeWidth={2} style={styles.searchIcon} />
          <TextInput
            value={topicSearch}
            onChangeText={setTopicSearch}
            placeholder={`Search in ${category.shortTitle}...`}
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
          />
          {topicSearch.length > 0 && (
            <TouchableOpacity
              onPress={() => setTopicSearch('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.clearBtn}
            >
              <X size={16} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>

        {/* Section Title */}
        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionHeading}>
            Frequently Asked Questions ({filteredQuestions.length})
          </Text>
        </View>

        {/* FAQ Accordion List */}
        {filteredQuestions.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <HelpCircle size={36} color="#94A3B8" strokeWidth={1.8} style={{ marginBottom: 10 }} />
            <Text style={styles.emptyStateTitle}>No questions found</Text>
            <Text style={styles.emptyStateText}>
              No questions matched "{topicSearch}". Try using different keywords or contact support.
            </Text>
          </View>
        ) : (
          filteredQuestions.map((item) => {
            const isExpanded = expandedId === item.id;

            return (
              <View
                key={item.id}
                style={[
                  styles.faqCard,
                  isExpanded && styles.faqCardExpanded
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => toggleExpand(item.id)}
                  style={styles.questionHeader}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isExpanded }}
                >
                  <Text style={styles.questionText}>{item.question}</Text>
                  {isExpanded ? (
                    <ChevronUp size={20} color="#D97706" strokeWidth={2.2} style={styles.chevronIcon} />
                  ) : (
                    <ChevronDown size={20} color="#94A3B8" strokeWidth={2} style={styles.chevronIcon} />
                  )}
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.answerBox}>
                    <Text style={styles.answerText}>{item.answer}</Text>
                  </View>
                )}
              </View>
            );
          })
        )}

        {/* Still Need Help CTA Card */}
        <View style={styles.needHelpCard}>
          <Text style={styles.needHelpTitle}>Still need assistance?</Text>
          <Text style={styles.needHelpSubtitle}>
            Our dispatch support desk is available to assist active delivery riders.
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleContactDeskPress}
            style={styles.contactDeskBtn}
            accessibilityRole="button"
            accessibilityLabel="Contact Support Desk"
          >
            <MessageSquare size={17} color="#111827" strokeWidth={2.2} style={{ marginRight: 8 }} />
            <Text style={styles.contactDeskBtnText}>Contact Support Desk</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Fixed Bottom Navigation */}
      <PartnerBottomBar activeTab="profile" />
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
    fontSize: 17,
    color: '#111827',
    flex: 1,
    textAlign: 'center'
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 110
  },

  // Banner
  bannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 18,
    alignItems: 'center',
    marginBottom: 16
  },
  bannerIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  bannerTitle: {
    fontFamily: typography.family.heavy,
    fontSize: 18,
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center'
  },
  bannerDescription: {
    fontFamily: typography.family.regular,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 300
  },

  // In-topic search
  searchWrapper: {
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
  searchIcon: {
    marginRight: 10
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.family.medium,
    fontSize: 14,
    color: '#111827'
  },
  clearBtn: {
    padding: 4
  },

  // Section Heading
  sectionHeadingRow: {
    marginBottom: 12,
    paddingHorizontal: 2
  },
  sectionHeading: {
    fontFamily: typography.family.bold,
    fontSize: 14.5,
    color: '#111827'
  },

  // FAQ Accordion Cards
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginBottom: 10,
    overflow: 'hidden'
  },
  faqCardExpanded: {
    borderColor: '#FCD34D',
    backgroundColor: '#FFFFFF'
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16
  },
  questionText: {
    flex: 1,
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
    marginRight: 10
  },
  chevronIcon: {
    marginLeft: 4
  },
  answerBox: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  answerText: {
    fontFamily: typography.family.regular,
    fontSize: 13.5,
    color: '#475569',
    lineHeight: 20
  },

  // Empty State
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 24,
    alignItems: 'center',
    marginBottom: 16
  },
  emptyStateTitle: {
    fontFamily: typography.family.bold,
    fontSize: 15,
    color: '#111827',
    marginBottom: 4
  },
  emptyStateText: {
    fontFamily: typography.family.regular,
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18
  },

  // Still Need Help
  needHelpCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FEF08A',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10
  },
  needHelpTitle: {
    fontFamily: typography.family.bold,
    fontSize: 15,
    color: '#92400E',
    marginBottom: 4
  },
  needHelpSubtitle: {
    fontFamily: typography.family.regular,
    fontSize: 12.5,
    color: '#B45309',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14
  },
  contactDeskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFC928',
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 20,
    width: '100%'
  },
  contactDeskBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#111827'
  }
});
