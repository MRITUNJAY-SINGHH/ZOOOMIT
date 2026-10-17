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
  Headphones,
  Search,
  Package,
  RotateCw,
  Bell,
  Coins,
  Clock,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  HelpCircle,
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

export default function HelpSupportScreen() {
  const router = useRouter();
  const { from } = useLocalSearchParams();
  const isNavigatingBack = useRef(false);
  const isNavigatingRef = useRef(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSearchId, setExpandedSearchId] = useState(null);

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

  const handleCategoryPress = (categoryId) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    hapticFeedback.light?.();
    router.push({
      pathname: '/help-topic',
      params: { categoryId }
    });
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 500);
  };

  const handleContactSupportPress = () => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    hapticFeedback.medium?.();
    router.push('/contact-support');
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 500);
  };

  // Global search filtering across all questions
  const isSearching = searchQuery.trim().length > 0;
  const filteredFaqs = isSearching
    ? FAQ_ITEMS.filter((item) => {
        const query = searchQuery.toLowerCase().trim();
        return (
          item.question.toLowerCase().includes(query) ||
          item.answer.toLowerCase().includes(query) ||
          item.keywords.some((kw) => kw.toLowerCase().includes(query))
        );
      })
    : [];

  const toggleSearchExpand = (id) => {
    hapticFeedback.selection?.();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSearchId(expandedSearchId === id ? null : id);
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
            accessibilityLabel="Back to Profile"
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
        keyboardShouldPersistTaps="handled"
      >
        {/* Intro Section matching reference Screen 3 */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconCircle}>
            <Headphones size={26} color="#111827" strokeWidth={2.2} />
          </View>
          <Text style={styles.heroTitle}>How can we help you?</Text>
          <Text style={styles.heroSubtitle}>
            Find answers to common questions or contact our support team.
          </Text>
        </View>

        {/* Functional Search Field */}
        <View style={styles.searchContainer}>
          <Search size={18} color="#94A3B8" strokeWidth={2} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search help topics..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.clearSearchBtn}
            >
              <X size={16} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>

        {/* Dynamic Content: Search Results OR 5 Popular Category Rows */}
        {isSearching ? (
          <View style={styles.searchResultsContainer}>
            <View style={styles.searchHeadingRow}>
              <Text style={styles.sectionHeading}>
                Search Results ({filteredFaqs.length})
              </Text>
            </View>

            {filteredFaqs.length === 0 ? (
              <View style={styles.emptySearchCard}>
                <HelpCircle size={36} color="#94A3B8" strokeWidth={1.8} style={{ marginBottom: 10 }} />
                <Text style={styles.emptySearchTitle}>No matching questions found</Text>
                <Text style={styles.emptySearchText}>
                  We couldn't find any FAQs matching "{searchQuery}". Try different keywords or contact our dispatch team below.
                </Text>
              </View>
            ) : (
              filteredFaqs.map((faq) => {
                const isExpanded = expandedSearchId === faq.id;
                const cat = FAQ_CATEGORIES.find((c) => c.id === faq.categoryId);

                return (
                  <View
                    key={faq.id}
                    style={[
                      styles.searchFaqCard,
                      isExpanded && styles.searchFaqCardExpanded
                    ]}
                  >
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => toggleSearchExpand(faq.id)}
                      style={styles.searchFaqHeader}
                      accessibilityRole="button"
                    >
                      <View style={{ flex: 1 }}>
                        {cat && (
                          <View
                            style={[
                              styles.catBadgePill,
                              { backgroundColor: cat.bgColor, borderColor: cat.borderColor }
                            ]}
                          >
                            <Text style={[styles.catBadgeText, { color: cat.iconColor }]}>
                              {cat.shortTitle}
                            </Text>
                          </View>
                        )}
                        <Text style={styles.searchFaqQuestion}>{faq.question}</Text>
                      </View>
                      {isExpanded ? (
                        <ChevronUp size={20} color="#D97706" strokeWidth={2.2} style={styles.searchChevron} />
                      ) : (
                        <ChevronDown size={20} color="#94A3B8" strokeWidth={2} style={styles.searchChevron} />
                      )}
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.searchFaqAnswerBox}>
                        <Text style={styles.searchFaqAnswerText}>{faq.answer}</Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        ) : (
          <>
            {/* Section Heading */}
            <Text style={styles.sectionHeading}>Popular Topics</Text>

            {/* 5 Popular Categories matching reference Screen 3 */}
            <View style={styles.topicsCard}>
              {FAQ_CATEGORIES.map((cat, index) => {
                const IconComp = ICON_MAP[cat.iconName] || Package;
                const isLast = index === FAQ_CATEGORIES.length - 1;

                return (
                  <React.Fragment key={cat.id}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleCategoryPress(cat.id)}
                      style={styles.topicRow}
                      accessibilityRole="button"
                      accessibilityLabel={cat.title}
                    >
                      {/* Consistent Icon Tile */}
                      <View
                        style={[
                          styles.iconTile,
                          {
                            backgroundColor: cat.bgColor,
                            borderColor: cat.borderColor
                          }
                        ]}
                      >
                        <IconComp size={20} color={cat.iconColor} strokeWidth={2} />
                      </View>

                      {/* Text Details */}
                      <View style={styles.topicTextCol}>
                        <Text style={styles.topicTitle}>{cat.title}</Text>
                        <Text style={styles.topicSubtitle}>{cat.subtitle}</Text>
                      </View>

                      {/* Right Chevron */}
                      <ChevronRight size={18} color="#94A3B8" strokeWidth={2} />
                    </TouchableOpacity>

                    {!isLast && <View style={styles.rowDivider} />}
                  </React.Fragment>
                );
              })}
            </View>
          </>
        )}

        {/* Full-width Yellow Contact Support Button matching reference */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleContactSupportPress}
          style={styles.contactSupportBtn}
          accessibilityLabel="Contact Support"
          accessibilityRole="button"
        >
          <MessageSquare size={18} color="#111827" strokeWidth={2.2} style={{ marginRight: 8 }} />
          <Text style={styles.contactSupportBtnText}>Contact Support</Text>
        </TouchableOpacity>
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
    fontSize: 18,
    color: '#111827'
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 110
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
  clearSearchBtn: {
    padding: 4
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

  // Search Results
  searchResultsContainer: {
    marginBottom: 18
  },
  searchHeadingRow: {
    marginBottom: 8
  },
  searchFaqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginBottom: 10,
    overflow: 'hidden'
  },
  searchFaqCardExpanded: {
    borderColor: '#FCD34D'
  },
  searchFaqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14
  },
  catBadgePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 6
  },
  catBadgeText: {
    fontFamily: typography.family.bold,
    fontSize: 10.5
  },
  searchFaqQuestion: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#111827',
    lineHeight: 19
  },
  searchChevron: {
    marginLeft: 8
  },
  searchFaqAnswerBox: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  searchFaqAnswerText: {
    fontFamily: typography.family.regular,
    fontSize: 13,
    color: '#475569',
    lineHeight: 19
  },
  emptySearchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 24,
    alignItems: 'center',
    marginBottom: 12
  },
  emptySearchTitle: {
    fontFamily: typography.family.bold,
    fontSize: 15,
    color: '#111827',
    marginBottom: 6
  },
  emptySearchText: {
    fontFamily: typography.family.regular,
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18
  }
});
