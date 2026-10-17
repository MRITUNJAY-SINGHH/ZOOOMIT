import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
  Dimensions,
  StatusBar
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
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
  Layers
} from 'lucide-react-native';
import { colors, typography } from '../../constants/theme';
import { deliveryService } from '../../services/deliveryService';
import { hapticFeedback } from '../../services/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 3 Exact Status Tabs required by specification
const TABS = [
  { key: 'in_progress', label: 'In Progress', defaultCount: 3 },
  { key: 'completed', label: 'Completed', defaultCount: 12 },
  { key: 'cancelled', label: 'Cancelled', defaultCount: 5 }
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
    in_progress: 3,
    completed: 12,
    cancelled: 5
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filter Modal
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');

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

  // Client-side filtering for immediate snappy responsiveness
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // 1. Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const num = (o.orderNumber || '').toLowerCase();
        const pLoc = (o.pickupLocation || '').toLowerCase();
        const dLoc = (o.deliveryLocation || '').toLowerCase();
        const type = (o.orderType || '').toLowerCase();
        const match = num.includes(q) || pLoc.includes(q) || dLoc.includes(q) || type.includes(q);
        if (!match) return false;
      }

      // 2. Order type filter from modal
      if (filterType !== 'all') {
        const type = (o.orderType || '').toLowerCase();
        if (filterType === 'grocery' && !type.includes('grocery')) return false;
        if (filterType === 'food' && !type.includes('food')) return false;
        if (filterType === 'medicine' && !type.includes('medicine')) return false;
      }

      return true;
    });
  }, [orders, searchQuery, filterType]);

  // Relative Time Helper
  const getRelativeTime = (dateStr) => {
    if (!dateStr) return '10 min ago';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Yesterday';
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
                // focus or toggle
              }}
              style={styles.iconCircleBtn}
              accessibilityLabel="Search Orders"
              accessibilityRole="button"
            >
              <Search size={20} color="#111827" strokeWidth={2.2} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                hapticFeedback.light?.();
                setShowFilterModal(true);
              }}
              style={[
                styles.iconCircleBtn,
                (filterType !== 'all' || filterDateRange !== 'all') && styles.iconCircleBtnActive
              ]}
              accessibilityLabel="Filter Orders"
              accessibilityRole="button"
            >
              <SlidersHorizontal size={20} color="#111827" strokeWidth={2.2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ============================================================== */}
        {/* SEARCH INPUT                                                   */}
        {/* ============================================================== */}
        <View style={styles.searchSection}>
          <View style={styles.searchBarBox}>
            <Search size={18} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              value={searchQuery}
              onChangeText={handleSearchChange}
              placeholder="Search by order ID or location"
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

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
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFC928" />
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <AlertCircle size={44} color="#EF4444" strokeWidth={1.8} style={{ marginBottom: 12 }} />
              <Text style={styles.errorTitle}>Unable to Load Orders</Text>
              <Text style={styles.errorSubtitle}>{error}</Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setLoading(true);
                  fetchOrders(activeTab, searchQuery);
                }}
                style={styles.retryBtn}
              >
                <RefreshCw size={16} color="#111827" strokeWidth={2.4} style={{ marginRight: 6 }} />
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filteredOrders.length === 0 ? (
            /* ========================================================== */
            /* DESIGN 4: NO ORDERS YET (Simple Clean Empty State)         */
            /* ========================================================== */
            <View style={styles.emptyStateContainer}>
              <OpenBoxIllustration />
              <Text style={styles.emptyTitle}>No Orders Yet</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery.trim()
                  ? `No orders matching "${searchQuery}". Try searching a different location or order ID.`
                  : 'New delivery requests will appear here when they are assigned to you.'}
              </Text>
            </View>
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
                  {/* Top Row: Icon + Number + Status Badge + Time */}
                  <View style={styles.cardTopRow}>
                    {renderOrderIcon(order.orderType)}

                    <View style={styles.cardHeaderInfo}>
                      <View style={styles.orderNumberRow}>
                        <Text style={styles.orderNumberText}>{orderIdStr}</Text>
                        {renderStatusBadge(order.status)}
                      </View>
                      <Text style={styles.orderTypeText}>
                        {order.orderType || 'Grocery Order'}
                      </Text>
                    </View>

                    <Text style={styles.timeAgoText}>
                      {getRelativeTime(order.createdAt)}
                    </Text>
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
      {/* FILTER MODAL                                                   */}
      {/* ============================================================== */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.filterModalOverlay}>
          <View style={styles.filterCard}>
            <View style={styles.filterHeaderRow}>
              <Text style={styles.filterTitle}>Filter Orders</Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                style={styles.filterCloseBtn}
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Order Category */}
            <Text style={styles.filterSectionLabel}>Order Category</Text>
            <View style={styles.filterPillsRow}>
              {[
                { id: 'all', label: 'All Orders' },
                { id: 'grocery', label: 'Grocery' },
                { id: 'food', label: 'Food' },
                { id: 'medicine', label: 'Medicine' }
              ].map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  activeOpacity={0.75}
                  onPress={() => {
                    hapticFeedback.selection?.();
                    setFilterType(cat.id);
                  }}
                  style={[
                    styles.filterChip,
                    filterType === cat.id && styles.filterChipActive
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filterType === cat.id && styles.filterChipTextActive
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Date Range */}
            <Text style={[styles.filterSectionLabel, { marginTop: 16 }]}>Date Range</Text>
            <View style={styles.filterPillsRow}>
              {[
                { id: 'all', label: 'All Time' },
                { id: 'today', label: 'Today' },
                { id: 'week', label: 'This Week' }
              ].map((dr) => (
                <TouchableOpacity
                  key={dr.id}
                  activeOpacity={0.75}
                  onPress={() => {
                    hapticFeedback.selection?.();
                    setFilterDateRange(dr.id);
                  }}
                  style={[
                    styles.filterChip,
                    filterDateRange === dr.id && styles.filterChipActive
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filterDateRange === dr.id && styles.filterChipTextActive
                    ]}
                  >
                    {dr.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.filterActionsRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setFilterType('all');
                  setFilterDateRange('all');
                  setShowFilterModal(false);
                }}
                style={styles.filterResetBtn}
              >
                <Text style={styles.filterResetBtnText}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowFilterModal(false)}
                style={styles.filterApplyBtn}
              >
                <Text style={styles.filterApplyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    backgroundColor: '#FFFBEB'
  },

  // Search Input
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF'
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    height: 46
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.family.regular,
    fontSize: 13.5,
    color: '#111827',
    paddingVertical: 0
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
    flex: 1
  },
  orderNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2
  },
  orderNumberText: {
    fontFamily: typography.family.heavy,
    fontSize: 15,
    color: '#111827'
  },
  orderTypeText: {
    fontFamily: typography.family.regular,
    fontSize: 12,
    color: '#64748B'
  },
  timeAgoText: {
    fontFamily: typography.family.regular,
    fontSize: 11.5,
    color: '#94A3B8'
  },

  // Status Badges
  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2
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

  // Filter Modal
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20
  },
  filterCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 20
  },
  filterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  filterTitle: {
    fontFamily: typography.family.bold,
    fontSize: 17,
    color: '#111827'
  },
  filterCloseBtn: {
    padding: 4
  },
  filterSectionLabel: {
    fontFamily: typography.family.bold,
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  filterPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
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
  filterActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22
  },
  filterResetBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  filterResetBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 13.5,
    color: '#475569'
  },
  filterApplyBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFC928',
    alignItems: 'center',
    justifyContent: 'center'
  },
  filterApplyBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 13.5,
    color: '#111827'
  }
});
