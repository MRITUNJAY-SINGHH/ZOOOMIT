import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
  Dimensions,
  StatusBar
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing
} from 'react-native-reanimated';
import Svg, {
  Path,
  Rect,
  Circle,
  Polygon,
  G,
  Defs,
  LinearGradient,
  Stop
} from 'react-native-svg';
import {
  Search,
  SlidersHorizontal,
  ChevronRight,
  ShoppingBag,
  Utensils,
  Briefcase,
  Car,
  CircleDot,
  X,
  AlertCircle,
  RefreshCw,
  Calendar,
  Layers,
  RotateCcw
} from 'lucide-react-native';
import { colors, typography } from '../../constants/theme';
import { deliveryService } from '../../services/deliveryService';
import { hapticFeedback } from '../../services/haptics';
import { LoadingSkeleton, EmptyOrdersState, ErrorState } from '../../components/sharedStates';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(SCREEN_WIDTH * 0.84, 340);

// 3 Exact Status Tabs required by specification
const TABS = [
  { key: 'in_progress', label: 'In Progress', defaultCount: 0 },
  { key: 'completed', label: 'Completed', defaultCount: 0 },
  { key: 'cancelled', label: 'Cancelled', defaultCount: 0 }
];

// Expanded Sidebar Filter Options
const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest First' },
  { id: 'oldest', label: 'Oldest First' },
  { id: 'highest_earnings', label: 'Highest Earnings (₹)' },
  { id: 'shortest_distance', label: 'Shortest Distance' }
];

const CATEGORY_OPTIONS = [
  { id: 'all', label: 'All Categories' },
  { id: 'grocery', label: 'Grocery' },
  { id: 'food', label: 'Food' },
  { id: 'medicine', label: 'Medicine' }
];

const PAYMENT_OPTIONS = [
  { id: 'all', label: 'All Modes' },
  { id: 'online', label: 'Online / Paid' },
  { id: 'cod', label: 'Cash on Delivery' }
];

const DATE_OPTIONS = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' }
];

const DISTANCE_OPTIONS = [
  { id: 'all', label: 'Any Distance' },
  { id: 'under_2', label: 'Under 2 km' },
  { id: '2_to_5', label: '2 – 5 km' },
  { id: 'above_5', label: '5+ km' }
];

// Open Box SVG Illustration for Design 4 (Empty State)
function OpenBoxIllustration() {
  return (
    <View style={styles.boxIllustrationWrap}>
      <Svg width={180} height={160} viewBox="0 0 180 160">
        <Defs>
          {/* Subtle warm glow background */}
          <LinearGradient id="glowGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#FFFBEB" stopOpacity="0.2" />
          </LinearGradient>
          {/* Box gradients */}
          <LinearGradient id="boxFront" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#F59E0B" />
            <Stop offset="100%" stopColor="#D97706" />
          </LinearGradient>
          <LinearGradient id="boxSide" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#D97706" />
            <Stop offset="100%" stopColor="#B45309" />
          </LinearGradient>
          <LinearGradient id="boxInside" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#78350F" />
            <Stop offset="100%" stopColor="#92400E" />
          </LinearGradient>
          <LinearGradient id="flapGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FBBF24" />
            <Stop offset="100%" stopColor="#F59E0B" />
          </LinearGradient>
        </Defs>

        {/* Ambient Glow */}
        <Circle cx="90" cy="85" r="65" fill="url(#glowGrad)" />

        {/* Sparkles */}
        <Path
          d="M 138 35 Q 140 40 145 42 Q 140 44 138 49 Q 136 44 131 42 Q 136 40 138 35 Z"
          fill="#FBBF24"
        />
        <Path
          d="M 45 60 Q 46.5 64 50 65 Q 46.5 66 45 70 Q 43.5 66 40 65 Q 43.5 64 45 60 Z"
          fill="#FDE68A"
        />

        {/* Inside Box Cavity */}
        <Polygon points="54,65 90,82 126,65 90,52" fill="url(#boxInside)" />

        {/* Box Left Side */}
        <Polygon points="54,65 90,82 90,122 54,103" fill="url(#boxFront)" />

        {/* Box Right Side */}
        <Polygon points="90,82 126,65 126,103 90,122" fill="url(#boxSide)" />

        {/* Top Open Flap - Left */}
        <Polygon points="54,65 90,52 74,40 40,52" fill="url(#flapGrad)" />

        {/* Top Open Flap - Right */}
        <Polygon points="90,52 126,65 140,52 106,40" fill="#FCD34D" />

        {/* Front Open Flap - Left */}
        <Polygon points="54,65 90,82 82,96 44,78" fill="#FBBF24" />

        {/* Front Open Flap - Right */}
        <Polygon points="90,82 126,65 136,78 98,96" fill="#F59E0B" />

        {/* Center Tape / Accent */}
        <Polygon points="87,81 93,81 93,122 87,122" fill="#FEF3C7" opacity="0.6" />
      </Svg>
    </View>
  );
}

export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState('in_progress');
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState([]);
  const [tabCounts, setTabCounts] = useState({
    in_progress: 0,
    completed: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Search Bar Visibility
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const searchInputRef = useRef(null);

  // Filter Sidebar Drawer States
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [filterDistance, setFilterDistance] = useState('all');
  const [filterSortBy, setFilterSortBy] = useState('newest');

  // Temporary filter state inside sidebar
  const [tempType, setTempType] = useState('all');
  const [tempPayment, setTempPayment] = useState('all');
  const [tempDateRange, setTempDateRange] = useState('all');
  const [tempDistance, setTempDistance] = useState('all');
  const [tempSortBy, setTempSortBy] = useState('newest');

  // Reanimated Drawer Animation Values
  const slideAnim = useSharedValue(SIDEBAR_WIDTH);
  const backdropOpacity = useSharedValue(0);

  const sidebarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideAnim.value }]
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value
  }));

  const handleOpenSidebar = () => {
    hapticFeedback.light?.();
    setTempType(filterType);
    setTempPayment(filterPayment);
    setTempDateRange(filterDateRange);
    setTempDistance(filterDistance);
    setTempSortBy(filterSortBy);
    setShowFilterSidebar(true);
    slideAnim.value = withTiming(0, {
      duration: 250,
      easing: Easing.out(Easing.cubic)
    });
    backdropOpacity.value = withTiming(1, {
      duration: 250,
      easing: Easing.out(Easing.ease)
    });
  };

  const handleCloseSidebar = () => {
    hapticFeedback.light?.();
    slideAnim.value = withTiming(SIDEBAR_WIDTH, {
      duration: 200,
      easing: Easing.in(Easing.cubic)
    });
    backdropOpacity.value = withTiming(0, {
      duration: 200,
      easing: Easing.in(Easing.ease)
    });
    setTimeout(() => {
      setShowFilterSidebar(false);
    }, 210);
  };

  const handleApplyFilters = () => {
    hapticFeedback.success?.();
    setFilterType(tempType);
    setFilterPayment(tempPayment);
    setFilterDateRange(tempDateRange);
    setFilterDistance(tempDistance);
    setFilterSortBy(tempSortBy);
    handleCloseSidebar();
  };

  const handleResetFilters = () => {
    hapticFeedback.medium?.();
    setTempType('all');
    setTempPayment('all');
    setTempDateRange('all');
    setTempDistance('all');
    setTempSortBy('newest');
  };

  const handleClearAllAppliedFilters = () => {
    hapticFeedback.light?.();
    setFilterType('all');
    setFilterPayment('all');
    setFilterDateRange('all');
    setFilterDistance('all');
    setFilterSortBy('newest');
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterType !== 'all') count++;
    if (filterPayment !== 'all') count++;
    if (filterDateRange !== 'all') count++;
    if (filterDistance !== 'all') count++;
    if (filterSortBy !== 'newest') count++;
    return count;
  }, [filterType, filterPayment, filterDateRange, filterDistance, filterSortBy]);

  const fetchOrders = useCallback(async (statusKey = activeTab, search = searchQuery) => {
    try {
      setError(null);
      const res = await deliveryService.getOrders(statusKey, 1, 30, search);

      if (res && res.orders) {
        setOrders(res.orders);
        if (res.counts) {
          setTabCounts(res.counts);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to connect to delivery dispatch.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, searchQuery]);

  useFocusEffect(
    useCallback(() => {
      fetchOrders(activeTab, searchQuery);
    }, [fetchOrders, activeTab, searchQuery])
  );

  const handleTabChange = (key) => {
    if (activeTab === key) return;
    hapticFeedback.selection?.();
    setActiveTab(key);
    setLoading(true);
    fetchOrders(key, searchQuery);
  };

  const onRefresh = () => {
    setRefreshing(true);
    hapticFeedback.light?.();
    fetchOrders(activeTab, searchQuery);
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);
  };

  // Client-side filtering & sorting for immediate snappy responsiveness
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // 1. Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((o) => {
        const num = (o.orderNumber || '').toLowerCase();
        const pLoc = (o.pickupLocation || '').toLowerCase();
        const dLoc = (o.deliveryLocation || '').toLowerCase();
        const type = (o.orderType || '').toLowerCase();
        const payment = (o.paymentMethod || o.paymentMode || '').toLowerCase();
        return (
          num.includes(q) ||
          pLoc.includes(q) ||
          dLoc.includes(q) ||
          type.includes(q) ||
          payment.includes(q)
        );
      });
    }

    // 2. Order type filter
    if (filterType !== 'all') {
      result = result.filter((o) => {
        const type = (o.orderType || '').toLowerCase();
        if (filterType === 'grocery') return type.includes('grocery');
        if (filterType === 'food') return type.includes('food');
        if (filterType === 'medicine') return type.includes('medicine') || type.includes('pharma');
        return true;
      });
    }

    // 3. Payment Mode filter
    if (filterPayment !== 'all') {
      result = result.filter((o) => {
        const pm = (o.paymentMethod || o.paymentMode || '').toLowerCase();
        const isOnline = pm.includes('online') || pm.includes('upi') || pm.includes('card') || pm.includes('prepaid');
        if (filterPayment === 'online') return isOnline;
        if (filterPayment === 'cod') return !isOnline || pm.includes('cod') || pm.includes('cash');
        return true;
      });
    }

    // 4. Date Range filter
    if (filterDateRange !== 'all') {
      const now = Date.now();
      result = result.filter((o) => {
        if (!o.createdAt) return true;
        const diffMs = now - new Date(o.createdAt).getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        if (filterDateRange === 'today') return diffHours <= 24;
        if (filterDateRange === 'yesterday') return diffHours > 24 && diffHours <= 48;
        if (filterDateRange === 'week') return diffHours <= 24 * 7;
        if (filterDateRange === 'month') return diffHours <= 24 * 30;
        return true;
      });
    }

    // 5. Distance filter
    if (filterDistance !== 'all') {
      result = result.filter((o) => {
        const distNum = parseFloat(o.distance) || 0;
        if (filterDistance === 'under_2') return distNum <= 2.0;
        if (filterDistance === '2_to_5') return distNum > 2.0 && distNum <= 5.0;
        if (filterDistance === 'above_5') return distNum > 5.0;
        return true;
      });
    }

    // 6. Sort By
    if (filterSortBy === 'highest_earnings') {
      result.sort((a, b) => (Number(b.earnings) || 0) - (Number(a.earnings) || 0));
    } else if (filterSortBy === 'shortest_distance') {
      result.sort((a, b) => (parseFloat(a.distance) || 0) - (parseFloat(b.distance) || 0));
    } else if (filterSortBy === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    } else {
      // Default: newest
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return result;
  }, [orders, searchQuery, filterType, filterPayment, filterDateRange, filterDistance, filterSortBy]);

  // Relative Time Helper
  const getRelativeTime = (dateStr) => {
    if (!dateStr) return 'Just now';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Just now';
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  // Order category icon
  const renderOrderIcon = (orderType = '') => {
    const t = orderType.toLowerCase();
    if (t.includes('food')) {
      return (
        <View style={[styles.orderIconBox, { backgroundColor: '#FEE2E2' }]}>
          <Utensils size={20} color="#EA580C" strokeWidth={2.2} />
        </View>
      );
    }
    if (t.includes('medicine') || t.includes('pharma')) {
      return (
        <View style={[styles.orderIconBox, { backgroundColor: '#DBEAFE' }]}>
          <Briefcase size={20} color="#2563EB" strokeWidth={2.2} />
        </View>
      );
    }
    // Default: Grocery
    return (
      <View style={[styles.orderIconBox, { backgroundColor: '#FEF3C7' }]}>
        <ShoppingBag size={20} color="#D97706" strokeWidth={2.2} />
      </View>
    );
  };

  // Status badge styling
  const renderStatusBadge = (status = 'In Progress') => {
    const s = status.toLowerCase();
    if (s.includes('completed') || s.includes('delivered')) {
      return (
        <View style={[styles.statusBadge, styles.statusBadgeCompleted]}>
          <Text style={styles.statusBadgeTextCompleted}>Completed</Text>
        </View>
      );
    }
    if (s.includes('cancelled') || s.includes('rejected')) {
      return (
        <View style={[styles.statusBadge, styles.statusBadgeCancelled]}>
          <Text style={styles.statusBadgeTextCancelled}>Cancelled</Text>
        </View>
      );
    }
    return (
      <View style={[styles.statusBadge, styles.statusBadgeInProgress]}>
        <Text style={styles.statusBadgeTextInProgress}>In Progress</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* ============================================================== */}
        {/* HEADER BAR (Design 1)                                          */}
        {/* ============================================================== */}
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>Orders</Text>

          <View style={styles.headerRightButtons}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                hapticFeedback.light?.();
                if (isSearchVisible) {
                  setIsSearchVisible(false);
                  setSearchQuery('');
                } else {
                  setIsSearchVisible(true);
                  setTimeout(() => {
                    searchInputRef.current?.focus();
                  }, 120);
                }
              }}
              style={[
                styles.iconCircleBtn,
                (isSearchVisible || searchQuery.length > 0) && styles.iconCircleBtnActive
              ]}
              accessibilityLabel="Search Orders"
              accessibilityRole="button"
            >
              <Search size={20} color="#111827" strokeWidth={2.2} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleOpenSidebar}
              style={[
                styles.iconCircleBtn,
                activeFilterCount > 0 && styles.iconCircleBtnActive
              ]}
              accessibilityLabel="Filter Orders"
              accessibilityRole="button"
            >
              <SlidersHorizontal size={20} color="#111827" strokeWidth={2.2} />
              {activeFilterCount > 0 && (
                <View style={styles.headerFilterBadge}>
                  <Text style={styles.headerFilterBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ============================================================== */}
        {/* COLLAPSIBLE SEARCH BAR                                         */}
        {/* ============================================================== */}
        {isSearchVisible && (
          <View style={styles.searchSection}>
            <View style={styles.searchBarBox}>
              <Search size={18} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                ref={searchInputRef}
                value={searchQuery}
                onChangeText={handleSearchChange}
                placeholder="Search order #, location, type..."
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.searchClearBtn}
                >
                  <X size={15} color="#64748B" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                hapticFeedback.light?.();
                setIsSearchVisible(false);
                setSearchQuery('');
              }}
              style={styles.searchCloseBtn}
            >
              <Text style={styles.searchCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ============================================================== */}
        {/* 3 STATUS TABS (Design 1)                                       */}
        {/* ============================================================== */}
        <View style={styles.tabsSection}>
          <View style={styles.tabsRow}>
            {TABS.map((tab) => {
              const isSelected = activeTab === tab.key;
              const count = tabCounts[tab.key] ?? tab.defaultCount;

              return (
                <TouchableOpacity
                  key={tab.key}
                  activeOpacity={0.8}
                  onPress={() => handleTabChange(tab.key)}
                  style={[
                    styles.tabPill,
                    isSelected ? styles.tabPillSelected : styles.tabPillUnselected
                  ]}
                >
                  <Text
                    style={[
                      styles.tabLabel,
                      isSelected ? styles.tabLabelSelected : styles.tabLabelUnselected
                    ]}
                  >
                    {tab.label}
                  </Text>
                  <View
                    style={[
                      styles.tabBadge,
                      isSelected
                        ? styles.tabBadgeSelected
                        : tab.key === 'cancelled'
                        ? styles.tabBadgeCancelled
                        : styles.tabBadgeUnselected
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabBadgeText,
                        isSelected
                          ? styles.tabBadgeTextSelected
                          : tab.key === 'cancelled'
                          ? styles.tabBadgeTextCancelled
                          : styles.tabBadgeTextUnselected
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Active Filter Chips Bar */}
        {activeFilterCount > 0 && (
          <View style={styles.activeFiltersBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeFiltersScroll}>
              <Text style={styles.activeFilterLead}>Filters ({activeFilterCount}):</Text>

              {filterSortBy !== 'newest' && (
                <View style={styles.activeFilterTag}>
                  <Text style={styles.activeFilterTagText}>
                    {SORT_OPTIONS.find((s) => s.id === filterSortBy)?.label}
                  </Text>
                  <TouchableOpacity onPress={() => setFilterSortBy('newest')} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <X size={12} color="#854D0E" strokeWidth={2.4} />
                  </TouchableOpacity>
                </View>
              )}

              {filterType !== 'all' && (
                <View style={styles.activeFilterTag}>
                  <Text style={styles.activeFilterTagText}>
                    {CATEGORY_OPTIONS.find((c) => c.id === filterType)?.label}
                  </Text>
                  <TouchableOpacity onPress={() => setFilterType('all')} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <X size={12} color="#854D0E" strokeWidth={2.4} />
                  </TouchableOpacity>
                </View>
              )}

              {filterPayment !== 'all' && (
                <View style={styles.activeFilterTag}>
                  <Text style={styles.activeFilterTagText}>
                    {PAYMENT_OPTIONS.find((p) => p.id === filterPayment)?.label}
                  </Text>
                  <TouchableOpacity onPress={() => setFilterPayment('all')} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <X size={12} color="#854D0E" strokeWidth={2.4} />
                  </TouchableOpacity>
                </View>
              )}

              {filterDateRange !== 'all' && (
                <View style={styles.activeFilterTag}>
                  <Text style={styles.activeFilterTagText}>
                    {DATE_OPTIONS.find((d) => d.id === filterDateRange)?.label}
                  </Text>
                  <TouchableOpacity onPress={() => setFilterDateRange('all')} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <X size={12} color="#854D0E" strokeWidth={2.4} />
                  </TouchableOpacity>
                </View>
              )}

              {filterDistance !== 'all' && (
                <View style={styles.activeFilterTag}>
                  <Text style={styles.activeFilterTagText}>
                    {DISTANCE_OPTIONS.find((d) => d.id === filterDistance)?.label}
                  </Text>
                  <TouchableOpacity onPress={() => setFilterDistance('all')} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <X size={12} color="#854D0E" strokeWidth={2.4} />
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity onPress={handleClearAllAppliedFilters} style={styles.clearAllFiltersBtn}>
                <Text style={styles.clearAllFiltersText}>Clear All</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* ============================================================== */}
        {/* ORDERS LIST & EMPTY / ERROR STATES                             */}
        {/* ============================================================== */}
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#FFC928']}
              tintColor="#FFC928"
            />
          }
        >
          {loading ? (
            <LoadingSkeleton message="Loading your orders..." cardsCount={3} />
          ) : error ? (
            <ErrorState
              title="Unable to Load Orders"
              message={error}
              onRetry={() => {
                setLoading(true);
                fetchOrders(activeTab, searchQuery);
              }}
            />
          ) : filteredOrders.length === 0 ? (
            <EmptyOrdersState
              title="No Orders Yet"
              message={
                searchQuery.trim()
                  ? `No orders matching "${searchQuery}". Try searching a different location or order ID.`
                  : 'New delivery offers will appear here when available. Keep your app online to receive orders.'
              }
            />
          ) : (
            /* ========================================================== */
            /* DESIGN 1: ORDERS LIST (Clean Minimal Style)                */
            /* ========================================================== */
            filteredOrders.map((order) => {
              const orderIdStr = order.orderNumber
                ? `#${order.orderNumber}`
                : `#ZM${order._id ? order._id.slice(-6).toUpperCase() : '102300'}`;

              return (
                <TouchableOpacity
                  key={order._id}
                  activeOpacity={0.85}
                  onPress={() => {
                    hapticFeedback.light?.();
                    if (order._id && !order._id.startsWith('ord_demo_')) {
                      router.push(`/order/${order._id}`);
                    } else {
                      router.push('/(tabs)/orders');
                    }
                  }}
                  style={styles.orderCard}
                >
                  {/* Top Row: Icon + Number & Type (Left) + Status Badge & Time (Right) */}
                  <View style={styles.cardTopRow}>
                    {renderOrderIcon(order.orderType)}

                    <View style={styles.cardHeaderInfo}>
                      <Text style={styles.orderNumberText} numberOfLines={1}>
                        {orderIdStr}
                      </Text>
                      <Text style={styles.orderTypeText} numberOfLines={1}>
                        {order.orderType || 'Grocery Order'}
                      </Text>
                    </View>

                    <View style={styles.cardHeaderRight}>
                      {renderStatusBadge(order.status)}
                      <Text style={styles.timeAgoText}>
                        {getRelativeTime(order.createdAt)}
                      </Text>
                    </View>
                  </View>

                  {/* Middle Section: Pickup & Dropoff with Right Chevron */}
                  <View style={styles.locationsRow}>
                    <View style={styles.locationPinsCol}>
                      {/* Pickup */}
                      <View style={styles.locationItemRow}>
                        <View style={styles.greenDot} />
                        <Text style={styles.locationText} numberOfLines={1}>
                          {order.pickupLocation || 'ZOOOMIT Store, Shankar Vihar'}
                        </Text>
                      </View>

                      {/* Dropoff */}
                      <View style={[styles.locationItemRow, { marginTop: 8 }]}>
                        <View style={styles.redDot} />
                        <Text style={styles.locationText} numberOfLines={1}>
                          {order.deliveryLocation || 'Raj Nagar, Ghaziabad'}
                        </Text>
                      </View>
                    </View>

                    <ChevronRight size={18} color="#94A3B8" strokeWidth={2.2} style={styles.chevron} />
                  </View>

                  {/* Bottom Row: Items + Earnings + Distance */}
                  <View style={styles.cardFooterRow}>
                    <View style={styles.metricItem}>
                      <ShoppingBag size={15} color="#475569" strokeWidth={2} style={{ marginRight: 5 }} />
                      <Text style={styles.metricText}>
                        {order.itemCount || (order.items?.length ?? 5)} items
                      </Text>
                    </View>

                    <View style={styles.metricItem}>
                      <View style={styles.rupeeCircle}>
                        <Text style={styles.rupeeSymbol}>₹</Text>
                      </View>
                      <Text style={styles.metricTextBold}>
                        ₹{order.earnings || 120}
                      </Text>
                    </View>

                    <View style={styles.metricItem}>
                      <Car size={15} color="#475569" strokeWidth={2} style={{ marginRight: 5 }} />
                      <Text style={styles.metricText}>
                        {order.distance || '2.4 km'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>

      {/* ============================================================== */}
      {/* FILTER SIDEBAR DRAWER (Slide-In from Right)                    */}
      {/* ============================================================== */}
      <Modal
        visible={showFilterSidebar}
        transparent={true}
        animationType="none"
        onRequestClose={handleCloseSidebar}
      >
        <View style={styles.sidebarModalOverlay}>
          {/* Backdrop (tap to dismiss) */}
          <TouchableWithoutFeedback onPress={handleCloseSidebar}>
            <Animated.View style={[styles.sidebarBackdrop, backdropAnimatedStyle]} />
          </TouchableWithoutFeedback>

          {/* Sidebar Drawer Container */}
          <Animated.View style={[styles.sidebarDrawer, sidebarAnimatedStyle]}>
            <SafeAreaView edges={['top', 'bottom']} style={styles.sidebarSafeArea}>
              {/* Drawer Header */}
              <View style={styles.sidebarHeader}>
                <View style={styles.sidebarTitleRow}>
                  <SlidersHorizontal size={20} color="#111827" strokeWidth={2.4} style={{ marginRight: 8 }} />
                  <Text style={styles.sidebarTitle}>Filters</Text>
                  {activeFilterCount > 0 && (
                    <View style={styles.sidebarCountBadge}>
                      <Text style={styles.sidebarCountText}>{activeFilterCount}</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleCloseSidebar}
                  style={styles.sidebarCloseBtn}
                  accessibilityLabel="Close filter sidebar"
                >
                  <X size={20} color="#64748B" strokeWidth={2.2} />
                </TouchableOpacity>
              </View>

              {/* Scrollable Filters */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.sidebarScrollContent}
              >
                {/* 1. Sort By */}
                <Text style={styles.filterSectionLabel}>Sort By</Text>
                <View style={styles.filterPillsWrap}>
                  {SORT_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.id}
                      activeOpacity={0.75}
                      onPress={() => {
                        hapticFeedback.selection?.();
                        setTempSortBy(opt.id);
                      }}
                      style={[
                        styles.filterChip,
                        tempSortBy === opt.id && styles.filterChipActive
                      ]}
                    >
                      <Text style={[styles.filterChipText, tempSortBy === opt.id && styles.filterChipTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* 2. Order Category */}
                <Text style={[styles.filterSectionLabel, { marginTop: 22 }]}>Order Category</Text>
                <View style={styles.filterPillsWrap}>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      activeOpacity={0.75}
                      onPress={() => {
                        hapticFeedback.selection?.();
                        setTempType(cat.id);
                      }}
                      style={[
                        styles.filterChip,
                        tempType === cat.id && styles.filterChipActive
                      ]}
                    >
                      <Text style={[styles.filterChipText, tempType === cat.id && styles.filterChipTextActive]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* 3. Payment Mode */}
                <Text style={[styles.filterSectionLabel, { marginTop: 22 }]}>Payment Mode</Text>
                <View style={styles.filterPillsWrap}>
                  {PAYMENT_OPTIONS.map((pm) => (
                    <TouchableOpacity
                      key={pm.id}
                      activeOpacity={0.75}
                      onPress={() => {
                        hapticFeedback.selection?.();
                        setTempPayment(pm.id);
                      }}
                      style={[
                        styles.filterChip,
                        tempPayment === pm.id && styles.filterChipActive
                      ]}
                    >
                      <Text style={[styles.filterChipText, tempPayment === pm.id && styles.filterChipTextActive]}>
                        {pm.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* 4. Date Range */}
                <Text style={[styles.filterSectionLabel, { marginTop: 22 }]}>Date Range</Text>
                <View style={styles.filterPillsWrap}>
                  {DATE_OPTIONS.map((dr) => (
                    <TouchableOpacity
                      key={dr.id}
                      activeOpacity={0.75}
                      onPress={() => {
                        hapticFeedback.selection?.();
                        setTempDateRange(dr.id);
                      }}
                      style={[
                        styles.filterChip,
                        tempDateRange === dr.id && styles.filterChipActive
                      ]}
                    >
                      <Text style={[styles.filterChipText, tempDateRange === dr.id && styles.filterChipTextActive]}>
                        {dr.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* 5. Delivery Distance */}
                <Text style={[styles.filterSectionLabel, { marginTop: 22 }]}>Delivery Distance</Text>
                <View style={styles.filterPillsWrap}>
                  {DISTANCE_OPTIONS.map((dist) => (
                    <TouchableOpacity
                      key={dist.id}
                      activeOpacity={0.75}
                      onPress={() => {
                        hapticFeedback.selection?.();
                        setTempDistance(dist.id);
                      }}
                      style={[
                        styles.filterChip,
                        tempDistance === dist.id && styles.filterChipActive
                      ]}
                    >
                      <Text style={[styles.filterChipText, tempDistance === dist.id && styles.filterChipTextActive]}>
                        {dist.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Drawer Footer Actions */}
              <View style={styles.sidebarFooter}>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={handleResetFilters}
                  style={styles.sidebarResetBtn}
                >
                  <RotateCcw size={16} color="#64748B" strokeWidth={2.2} />
                  <Text style={styles.sidebarResetText}>Reset</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleApplyFilters}
                  style={styles.sidebarApplyBtn}
                >
                  <Text style={styles.sidebarApplyText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  safeArea: {
    flex: 1
  },

  // Header Bar (Design 1)
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF'
  },
  headerTitle: {
    fontFamily: typography.family.heavy,
    fontSize: 26,
    color: '#111827'
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  iconCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconCircleBtnActive: {
    borderColor: '#FFC928',
    backgroundColor: '#FFC928'
  },
  headerFilterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF'
  },
  headerFilterBadgeText: {
    fontFamily: typography.family.bold,
    fontSize: 9.5,
    color: '#FFFFFF'
  },

  // Search Input
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    gap: 10
  },
  searchBarBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 46
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.family.medium,
    fontSize: 13.5,
    color: '#111827',
    paddingVertical: 0
  },
  searchClearBtn: {
    padding: 4
  },
  searchCloseBtn: {
    paddingVertical: 8,
    paddingHorizontal: 6
  },
  searchCloseBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 13.5,
    color: '#D97706'
  },

  // Active Filter Chips Bar
  activeFiltersBar: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF'
  },
  activeFiltersScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  activeFilterLead: {
    fontFamily: typography.family.bold,
    fontSize: 11.5,
    color: '#64748B',
    marginRight: 2
  },
  activeFilterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4
  },
  activeFilterTagText: {
    fontFamily: typography.family.bold,
    fontSize: 11,
    color: '#854D0E'
  },
  clearAllFiltersBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  clearAllFiltersText: {
    fontFamily: typography.family.bold,
    fontSize: 11.5,
    color: '#EF4444'
  },

  // Status Tabs
  tabsSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF'
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  tabPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6
  },
  tabPillSelected: {
    backgroundColor: '#FFC928',
    borderColor: '#FFC928'
  },
  tabPillUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB'
  },
  tabLabel: {
    fontSize: 12.5
  },
  tabLabelSelected: {
    fontFamily: typography.family.bold,
    color: '#111827'
  },
  tabLabelUnselected: {
    fontFamily: typography.family.medium,
    color: '#64748B'
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabBadgeSelected: {
    backgroundColor: '#111827'
  },
  tabBadgeUnselected: {
    backgroundColor: '#78350F'
  },
  tabBadgeCancelled: {
    backgroundColor: '#EF4444'
  },
  tabBadgeText: {
    fontFamily: typography.family.bold,
    fontSize: 10.5
  },
  tabBadgeTextSelected: {
    color: '#FFFFFF'
  },
  tabBadgeTextUnselected: {
    color: '#FFFFFF'
  },
  tabBadgeTextCancelled: {
    color: '#FFFFFF'
  },

  // Scroll Content
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 110,
    flexGrow: 1
  },
  loadingContainer: {
    paddingVertical: 70,
    alignItems: 'center'
  },

  // Order Card (Design 1)
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 14
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14
  },
  orderIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  cardHeaderInfo: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8
  },
  orderNumberText: {
    fontFamily: typography.family.heavy,
    fontSize: 15,
    color: '#111827',
    letterSpacing: -0.2,
    marginBottom: 3
  },
  orderTypeText: {
    fontFamily: typography.family.medium,
    fontSize: 11.5,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4
  },
  cardHeaderRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 6
  },
  timeAgoText: {
    fontFamily: typography.family.medium,
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 4
  },

  // Status Badges
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-end'
  },
  statusBadgeInProgress: {
    backgroundColor: '#FEF08A'
  },
  statusBadgeCompleted: {
    backgroundColor: '#DCFCE7'
  },
  statusBadgeCancelled: {
    backgroundColor: '#FEE2E2'
  },
  statusBadgeTextInProgress: {
    fontFamily: typography.family.bold,
    fontSize: 10.5,
    color: '#854D0E'
  },
  statusBadgeTextCompleted: {
    fontFamily: typography.family.bold,
    fontSize: 10.5,
    color: '#15803D'
  },
  statusBadgeTextCancelled: {
    fontFamily: typography.family.bold,
    fontSize: 10.5,
    color: '#DC2626'
  },

  // Locations Section
  locationsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 12
  },
  locationPinsCol: {
    flex: 1,
    paddingRight: 12
  },
  locationItemRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  greenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#16A34A',
    marginRight: 10
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#DC2626',
    marginRight: 10
  },
  locationText: {
    flex: 1,
    fontFamily: typography.family.medium,
    fontSize: 13,
    color: '#334155'
  },
  chevron: {
    marginLeft: 6
  },

  // Bottom Row Metrics
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  metricText: {
    fontFamily: typography.family.medium,
    fontSize: 12.5,
    color: '#64748B'
  },
  metricTextBold: {
    fontFamily: typography.family.bold,
    fontSize: 13,
    color: '#111827'
  },
  rupeeCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.2,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4
  },
  rupeeSymbol: {
    fontFamily: typography.family.bold,
    fontSize: 10,
    color: '#475569',
    lineHeight: 12
  },

  // Empty State (Design 4)
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 30
  },
  boxIllustrationWrap: {
    marginBottom: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyTitle: {
    fontFamily: typography.family.heavy,
    fontSize: 22,
    color: '#111827',
    marginBottom: 8
  },
  emptySubtitle: {
    fontFamily: typography.family.regular,
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280
  },

  // Error State
  errorContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 20
  },
  errorTitle: {
    fontFamily: typography.family.bold,
    fontSize: 17,
    color: '#111827',
    marginBottom: 6
  },
  errorSubtitle: {
    fontFamily: typography.family.regular,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFC928',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12
  },
  retryBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 13.5,
    color: '#111827'
  },

  // Filter Sidebar Drawer
  sidebarModalOverlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: 'transparent'
  },
  sidebarBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 24, 39, 0.45)'
  },
  sidebarDrawer: {
    width: SIDEBAR_WIDTH,
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    borderLeftWidth: 1.5,
    borderLeftColor: '#E2E8F0'
  },
  sidebarSafeArea: {
    flex: 1
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  sidebarTitleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  sidebarTitle: {
    fontFamily: typography.family.heavy,
    fontSize: 18,
    color: '#111827',
    letterSpacing: -0.2
  },
  sidebarCountBadge: {
    backgroundColor: '#FFC928',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 8
  },
  sidebarCountText: {
    fontFamily: typography.family.bold,
    fontSize: 11,
    color: '#111827'
  },
  sidebarCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sidebarScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28
  },
  filterSectionLabel: {
    fontFamily: typography.family.bold,
    fontSize: 11.5,
    color: '#64748B',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6
  },
  filterPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  filterChip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0'
  },
  filterChipActive: {
    backgroundColor: '#FFC928',
    borderColor: '#FFC928'
  },
  filterChipText: {
    fontFamily: typography.family.medium,
    fontSize: 12.5,
    color: '#475569'
  },
  filterChipTextActive: {
    fontFamily: typography.family.bold,
    color: '#111827'
  },
  sidebarFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF'
  },
  sidebarResetBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  sidebarResetText: {
    fontFamily: typography.family.bold,
    fontSize: 13,
    color: '#64748B'
  },
  sidebarApplyBtn: {
    flex: 1.6,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#FFC928',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sidebarApplyText: {
    fontFamily: typography.family.heavy,
    fontSize: 13.5,
    color: '#111827'
  }
});
