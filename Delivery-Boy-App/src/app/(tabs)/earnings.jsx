import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Dimensions,
  StatusBar
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import Svg, {
  Path,
  Rect,
  Circle,
  Line,
  G,
  Text as SvgText
} from 'react-native-svg';
import {
  Calendar,
  ShoppingBag,
  Clock,
  CheckCircle2,
  ChevronRight,
  Star,
  Flag,
  X,
  ShieldCheck,
  Coins,
  Store,
  Info
} from 'lucide-react-native';
import { colors, typography } from '../../constants/theme';
import { deliveryService } from '../../services/deliveryService';
import { hapticFeedback } from '../../services/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 4 Period Selector options: Overview (Store Cash Settlement default), Today, This Week, This Month
const PERIODS = [
  { id: 'overview', label: 'Overview' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' }
];

const formatRupees = (val) => {
  if (val === undefined || val === null || isNaN(Number(val))) return '0';
  return Number(val).toLocaleString('en-IN');
};

export default function EarningsScreen() {
  const insets = useSafeAreaInsets();

  // Default state is Store Cash Settlement Overview
  const [activePeriod, setActivePeriod] = useState('overview');
  const [selectedDayIndex, setSelectedDayIndex] = useState(5); // Default to Saturday
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [showAllTransactionsModal, setShowAllTransactionsModal] = useState(false);

  // Authoritative data structure
  const [earningsData, setEarningsData] = useState({
    period: 'overview',
    ratePerDelivery: 30,

    storeCashSettlement: {
      totalEarned: 240,
      cashCollected: 0,
      cashToCollect: 240,
      settlementStatus: 'Awaiting Collection',
      ratePerDelivery: 30,
      settlements: []
    },

    overview: {
      cashToCollect: 240,
      cashCollected: 0,
      totalEarned: 240,
      settlementStatus: 'Awaiting Collection',
      ratePerDelivery: 30,
      todayEarnings: 240,
      todayDeliveries: 8,
      thisMonthEarnings: 1240,
      thisMonthChange: '+18%',
      quickStats: {
        completed: 8,
        onlineTime: '6h 30m',
        activeDays: 4
      },
      settlementHistory: []
    },

    today: {
      totalEarnings: 240,
      comparison: '+12% vs yesterday',
      completedDeliveries: 8,
      pendingOrders: 1,
      ratePerDelivery: 30,
      onlineTime: '6h 30m',
      breakdown: {
        orderEarnings: 240,
        ordersCount: 8,
        avgOrderEarnings: 30,
        ratePerDelivery: 30
      }
    },

    week: {
      totalEarnings: 1680,
      comparison: '+15% vs last week',
      dateRange: 'This Week',
      ratePerDelivery: 30,
      chart: [
        { day: 'Mon', amount: 240, orders: 8, isToday: false },
        { day: 'Tue', amount: 270, orders: 9, isToday: false },
        { day: 'Wed', amount: 300, orders: 10, isToday: false },
        { day: 'Thu', amount: 210, orders: 7, isToday: false },
        { day: 'Fri', amount: 360, orders: 12, isToday: false },
        { day: 'Sat', amount: 240, orders: 8, isToday: true },
        { day: 'Sun', amount: 60, orders: 2, isToday: false }
      ],
      stats: {
        completedDeliveries: 56,
        onlineTime: '32h 40m',
        ratePerDelivery: 30
      },
      dailyList: [
        { dayLabel: 'Today', orderCount: 8, amount: 240 },
        { dayLabel: 'Yesterday', orderCount: 12, amount: 360 }
      ]
    },

    month: {
      totalEarnings: 6840,
      comparison: '+22% vs last month',
      monthLabel: 'Current Month',
      ratePerDelivery: 30,
      stats: {
        totalOrders: 228,
        avgEarningPerOrder: 30,
        activeDays: 24,
        onlineTime: '142h'
      },
      breakdown: {
        orderEarnings: 6840,
        totalDeliveries: 228,
        ratePerDelivery: 30
      },
      daysChart: Array.from({ length: 30 }, (_, i) => ({
        dayNumber: i + 1,
        amount: Math.round(150 + Math.sin(i * 0.7) * 120 + (i % 4 === 0 ? 150 : 0)),
        orders: 5 + (i % 5),
        isToday: i === 27
      }))
    },

    orders: [
      {
        _id: 'ord_1',
        orderNumber: 'KU102298',
        deliveredAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
        amount: 30,
        customerAddress: 'Tower 4, Green View Apartments',
        status: 'Completed',
        settlementStatus: 'Unsettled'
      },
      {
        _id: 'ord_2',
        orderNumber: 'KU102297',
        deliveredAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        amount: 30,
        customerAddress: 'Sector 14 Market Road',
        status: 'Completed',
        settlementStatus: 'Unsettled'
      },
      {
        _id: 'ord_3',
        orderNumber: 'KU102296',
        deliveredAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
        amount: 30,
        customerAddress: 'Block C, Tech Residency',
        status: 'Completed',
        settlementStatus: 'Unsettled'
      }
    ]
  });

  const fetchEarningsData = useCallback(async (p = activePeriod) => {
    try {
      const res = await deliveryService.getEarnings(p);
      if (res) {
        setEarningsData((prev) => ({
          ...prev,
          ...res,
          storeCashSettlement: { ...prev.storeCashSettlement, ...(res.storeCashSettlement || {}) },
          today: { ...prev.today, ...(res.today || {}) },
          week: { ...prev.week, ...(res.week || {}) },
          month: { ...prev.month, ...(res.month || {}) },
          overview: { ...prev.overview, ...(res.overview || {}) },
          orders: res.orders && res.orders.length > 0 ? res.orders : prev.orders
        }));
      }
    } catch {
      // Retain authoritative fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activePeriod]);

  useFocusEffect(
    useCallback(() => {
      fetchEarningsData(activePeriod);
    }, [fetchEarningsData, activePeriod])
  );

  const handlePeriodChange = (pId) => {
    if (activePeriod === pId) return;
    hapticFeedback.selection?.();
    setActivePeriod(pId);
  };

  const onRefresh = () => {
    setRefreshing(true);
    hapticFeedback.light?.();
    fetchEarningsData(activePeriod);
  };

  // Weekly Line Chart Calculations
  const chartWidth = Math.min(SCREEN_WIDTH - 64, 340);
  const chartHeight = 130;
  const weeklyPoints = useMemo(() => {
    const list = earningsData.week?.chart || [];
    if (list.length === 0) return [];

    const amounts = list.map((i) => i.amount);
    const min = Math.min(...amounts, 0);
    const max = Math.max(...amounts, 300);
    const range = max - min || 1;

    const stepX = (chartWidth - 40) / Math.max(1, list.length - 1);
    return list.map((item, idx) => {
      const x = 20 + idx * stepX;
      const normalizedY = (item.amount - min) / range;
      const y = chartHeight - 25 - normalizedY * (chartHeight - 55);
      return { ...item, x, y };
    });
  }, [earningsData.week?.chart, chartWidth]);

  const weeklyPathString = useMemo(() => {
    if (weeklyPoints.length === 0) return '';
    return weeklyPoints.reduce((acc, pt, i, arr) => {
      if (i === 0) return `M ${pt.x} ${pt.y}`;
      const prev = arr[i - 1];
      const cp1x = prev.x + (pt.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = prev.x + (pt.x - prev.x) / 2;
      const cp2y = pt.y;
      return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pt.x} ${pt.y}`;
    }, '');
  }, [weeklyPoints]);

  const selectedPoint = weeklyPoints[selectedDayIndex] || weeklyPoints[weeklyPoints.length - 2];

  // Helper for settlement status styling
  const renderStatusBadge = (status) => {
    const isCollected = status === 'Collected';
    const isPartial = status === 'Partially Collected';
    const bgColor = isCollected ? '#DCFCE7' : isPartial ? '#DBEAFE' : '#FEF3C7';
    const textColor = isCollected ? '#15803D' : isPartial ? '#1D4ED8' : '#B45309';

    return (
      <View style={[styles.statusBadgePill, { backgroundColor: bgColor }]}>
        <Text style={[styles.statusBadgeText, { color: textColor }]}>
          {status || 'Awaiting Collection'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top Header */}
        <View style={styles.headerBar}>
          <View>
            <Text style={styles.headerTitle}>Earnings</Text>
            <Text style={styles.headerSubtitle}>
              Rate: ₹{earningsData.ratePerDelivery || 30} per completed delivery
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              hapticFeedback.light?.();
              setShowSettlementModal(true);
            }}
            style={styles.calendarBtn}
            accessibilityLabel="Store Settlement Details"
            accessibilityRole="button"
          >
            <Store size={20} color="#111827" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* 4 Reporting Periods Selector */}
        <View style={styles.periodSelectorWrapper}>
          <View style={styles.periodPillContainer}>
            {PERIODS.map((period) => {
              const isActive = activePeriod === period.id;
              return (
                <TouchableOpacity
                  key={period.id}
                  activeOpacity={0.8}
                  onPress={() => handlePeriodChange(period.id)}
                  style={[styles.periodTab, isActive && styles.periodTabActive]}
                >
                  <Text style={[styles.periodTabText, isActive && styles.periodTabTextActive]}>
                    {period.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

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
          {loading && !refreshing && (
            <View style={{ paddingVertical: 10, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#FFC928" />
            </View>
          )}

          <>
            {/* ============================================================== */}
            {/* 1. DEFAULT OVERVIEW — STORE CASH SETTLEMENT                    */}
            {/* ============================================================== */}
            {activePeriod === 'overview' && (
              <View style={styles.stateWrapper}>
                {/* Store Cash Settlement Hero Card */}
                <View style={styles.settlementHeroCard}>
                  <View style={styles.settlementHeaderRow}>
                    <View style={styles.heroTitleGroup}>
                      <Text style={styles.settlementLabel}>STORE CASH SETTLEMENT</Text>
                      <Text style={styles.settlementNote}>Cash awaiting collection at store</Text>
                    </View>
                    {renderStatusBadge(
                      earningsData?.storeCashSettlement?.settlementStatus ||
                      earningsData?.overview?.settlementStatus
                    )}
                  </View>

                  <Text style={styles.settlementAmount}>
                    ₹{formatRupees(
                      earningsData?.storeCashSettlement?.cashToCollect ??
                      earningsData?.overview?.cashToCollect
                    )}
                  </Text>

                  <View style={styles.heroActionRow}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setShowSettlementModal(true)}
                      style={styles.viewSettlementBtn}
                    >
                      <Text style={styles.viewSettlementBtnText}>View Settlement Details</Text>
                    </TouchableOpacity>

                    <View style={styles.rateBadge}>
                      <Text style={styles.rateBadgeText}>
                        ₹{earningsData.ratePerDelivery || 30} / delivery
                      </Text>
                    </View>
                  </View>

                  {/* Translucent Coins Watermark */}
                  <View style={styles.coinsWatermark}>
                    <Coins size={78} color="#EAB308" strokeWidth={1.5} opacity={0.25} />
                  </View>
                </View>

                {/* 4-Stat Grid: Key Metrics */}
                <View style={styles.metricGrid2x2}>
                  <View style={styles.metricGridCard}>
                    <View style={[styles.gridIconCircle, { backgroundColor: '#FEF3C7' }]}>
                      <Coins size={18} color="#D97706" />
                    </View>
                    <Text style={styles.gridNumber}>
                      ₹{formatRupees(earningsData?.today?.totalEarnings ?? earningsData?.overview?.todayEarnings)}
                    </Text>
                    <Text style={styles.gridLabel}>Today's Earnings</Text>
                  </View>

                  <View style={styles.metricGridCard}>
                    <View style={[styles.gridIconCircle, { backgroundColor: '#DCFCE7' }]}>
                      <CheckCircle2 size={18} color="#16A34A" />
                    </View>
                    <Text style={styles.gridNumber}>
                      {earningsData?.today?.completedDeliveries ?? earningsData?.overview?.todayDeliveries ?? 0}
                    </Text>
                    <Text style={styles.gridLabel}>Completed Today</Text>
                  </View>

                  <View style={styles.metricGridCard}>
                    <View style={[styles.gridIconCircle, { backgroundColor: '#DBEAFE' }]}>
                      <Store size={18} color="#2563EB" />
                    </View>
                    <Text style={styles.gridNumber}>
                      ₹{earningsData.ratePerDelivery || 30}
                    </Text>
                    <Text style={styles.gridLabel}>Rate per Delivery</Text>
                  </View>

                  <View style={styles.metricGridCard}>
                    <View style={[styles.gridIconCircle, { backgroundColor: '#F3E8FF' }]}>
                      <ShieldCheck size={18} color="#9333EA" />
                    </View>
                    <Text style={styles.gridNumber}>
                      ₹{formatRupees(
                        earningsData?.storeCashSettlement?.cashCollected ??
                        earningsData?.overview?.cashCollected
                      )}
                    </Text>
                    <Text style={styles.gridLabel}>Cash Collected</Text>
                  </View>
                </View>

                {/* Store Cash Collection Notice Banner */}
                <View style={styles.collectionNoticeCard}>
                  <View style={styles.noticeIconCircle}>
                    <Store size={20} color="#D97706" strokeWidth={2.2} />
                  </View>
                  <View style={styles.noticeTextCol}>
                    <Text style={styles.noticeTitle}>Store Counter Settlement</Text>
                    <Text style={styles.noticeSub}>
                      Collect your delivery earnings in cash directly from the store hub counter at the end of your shift or day.
                    </Text>
                  </View>
                </View>

                {/* Store Cash Collections History */}
                <View style={styles.historySectionHeader}>
                  <Text style={styles.sectionTitle}>Store Cash Collections</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setShowSettlementModal(true)}
                  >
                    <Text style={styles.viewAllText}>Details</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.settlementCardList}>
                  {earningsData?.overview?.settlementHistory && earningsData.overview.settlementHistory.length > 0 ? (
                    earningsData.overview.settlementHistory.map((item) => (
                      <View key={item._id || item.id} style={styles.settlementRow}>
                        <View style={styles.settlementIconCircle}>
                          <Store size={20} color="#16A34A" strokeWidth={2} />
                        </View>
                        <View style={styles.settlementInfoCol}>
                          <Text style={styles.settlementDateText}>{item.date}</Text>
                          <Text style={styles.settlementStoreText}>
                            {item.storeName || 'ZOOOMIT Store Hub'}
                          </Text>
                        </View>
                        <View style={styles.settlementRightCol}>
                          <Text style={styles.settlementAmountText}>
                            ₹{formatRupees(item?.amount)}
                          </Text>
                          <View style={styles.successPill}>
                            <Text style={styles.successPillText}>{item.status || 'Collected'}</Text>
                          </View>
                        </View>
                      </View>
                    ))
                  ) : (
                    <View style={styles.emptySettlementBox}>
                      <Info size={24} color="#94A3B8" />
                      <Text style={styles.emptySettlementTitle}>No cash settlements recorded yet</Text>
                      <Text style={styles.emptySettlementSub}>
                        Your completed orders tally here. Visit the store hub dispatch counter at the end of your day to collect cash.
                      </Text>
                    </View>
                  )}
                </View>

                {/* Recent Earnings Section */}
                <View style={styles.historySectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Delivery Earnings</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setShowAllTransactionsModal(true)}
                  >
                    <Text style={styles.viewAllText}>View All</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.recentOrdersList}>
                  {earningsData.orders.slice(0, 5).map((ord) => (
                    <View key={ord._id} style={styles.recentOrderRow}>
                      <View style={styles.recentOrderIcon}>
                        <ShoppingBag size={18} color="#16A34A" />
                      </View>
                      <View style={styles.recentOrderInfo}>
                        <Text style={styles.recentOrderNumber}>#{ord.orderNumber}</Text>
                        <Text style={styles.recentOrderTime}>
                          {ord.deliveredAt ? new Date(ord.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Delivered'}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.recentOrderAmount}>+₹{ord.amount}</Text>
                        <View style={[
                          styles.orderSettledPill,
                          { backgroundColor: ord.settlementStatus === 'Settled' ? '#DCFCE7' : '#FEF3C7' }
                        ]}>
                          <Text style={[
                            styles.orderSettledText,
                            { color: ord.settlementStatus === 'Settled' ? '#15803D' : '#B45309' }
                          ]}>
                            {ord.settlementStatus || 'Unsettled'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ============================================================== */}
            {/* 2. TODAY — CLEAN & SIMPLE                                      */}
            {/* ============================================================== */}
            {activePeriod === 'today' && (
              <View style={styles.stateWrapper}>
                {/* Today's Earnings Card */}
                <View style={styles.todayHeroCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.todayHeroLabel}>Today's Earnings</Text>
                    <Text style={styles.todayHeroAmount}>
                      ₹{formatRupees(earningsData?.today?.totalEarnings)}
                    </Text>
                    <View style={styles.greenBadgePill}>
                      <Text style={styles.greenBadgeText}>
                        {earningsData.today.comparison}
                      </Text>
                    </View>
                  </View>

                  {/* Compact ascending bars */}
                  <View style={styles.miniBarGroup}>
                    {[14, 20, 26, 34, 46].map((h, i) => (
                      <View
                        key={i}
                        style={[
                          styles.miniBar,
                          { height: h, backgroundColor: i >= 2 ? '#FFC928' : '#FEF08A' }
                        ]}
                      />
                    ))}
                  </View>
                </View>

                {/* Today 3-Metric Row */}
                <View style={styles.threeStatRow}>
                  <View style={styles.statSquareCard}>
                    <Text style={styles.statBigNumber}>
                      {earningsData.today.completedDeliveries}
                    </Text>
                    <Text style={styles.statSquareLabel}>Completed</Text>
                  </View>

                  <View style={styles.statSquareCard}>
                    <Text style={styles.statBigNumber}>
                      {earningsData.today.pendingOrders}
                    </Text>
                    <Text style={styles.statSquareLabel}>Pending</Text>
                  </View>

                  <View style={styles.statSquareCard}>
                    <Text style={[styles.statBigNumber, { fontSize: 16 }]}>
                      ₹{earningsData.ratePerDelivery || 30}
                    </Text>
                    <Text style={styles.statSquareLabel}>Rate / Order</Text>
                  </View>
                </View>

                {/* Earnings Breakdown */}
                <View style={styles.cardBox}>
                  <Text style={styles.cardHeaderTitle}>Today's Compensation Breakdown</Text>

                  <View style={styles.breakdownRow}>
                    <View style={[styles.breakdownIconCircle, { backgroundColor: '#DCFCE7' }]}>
                      <ShoppingBag size={18} color="#16A34A" />
                    </View>
                    <View style={styles.breakdownInfoCol}>
                      <Text style={styles.breakdownItemTitle}>Delivered Orders</Text>
                      <Text style={styles.breakdownItemSub}>
                        {earningsData.today.breakdown?.ordersCount || earningsData.today.completedDeliveries} orders @ ₹{earningsData.ratePerDelivery || 30}/delivery
                      </Text>
                    </View>
                    <Text style={styles.breakdownItemAmount}>
                      ₹{earningsData.today.totalEarnings}
                    </Text>
                  </View>

                  <View style={styles.breakdownDivider} />

                  <View style={styles.breakdownRow}>
                    <View style={[styles.breakdownIconCircle, { backgroundColor: '#FEF3C7' }]}>
                      <Store size={18} color="#D97706" />
                    </View>
                    <View style={styles.breakdownInfoCol}>
                      <Text style={styles.breakdownItemTitle}>Cash to Collect from Store</Text>
                      <Text style={styles.breakdownItemSub}>
                        End of shift store counter collection
                      </Text>
                    </View>
                    <Text style={styles.breakdownItemAmount}>
                      ₹{formatRupees(
                        earningsData?.storeCashSettlement?.cashToCollect ??
                        earningsData?.today?.totalEarnings
                      )}
                    </Text>
                  </View>
                </View>

                {/* Recent Earnings List */}
                <View style={styles.historySectionHeader}>
                  <Text style={styles.sectionTitle}>Today's Deliveries</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setShowAllTransactionsModal(true)}
                  >
                    <Text style={styles.viewAllText}>View All</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.recentOrdersList}>
                  {earningsData.orders.slice(0, 4).map((ord) => (
                    <View key={ord._id} style={styles.recentOrderRow}>
                      <View style={styles.recentOrderIcon}>
                        <ShoppingBag size={18} color="#16A34A" />
                      </View>
                      <View style={styles.recentOrderInfo}>
                        <Text style={styles.recentOrderNumber}>#{ord.orderNumber}</Text>
                        <Text style={styles.recentOrderTime}>
                          {ord.customerAddress || 'Customer Address'}
                        </Text>
                      </View>
                      <Text style={styles.recentOrderAmount}>+₹{ord.amount}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ============================================================== */}
            {/* 3. THIS WEEK — DETAILED INSIGHTS                               */}
            {/* ============================================================== */}
            {activePeriod === 'week' && (
              <View style={styles.stateWrapper}>
                {/* Total Weekly Earnings with Interactive Line Chart */}
                <View style={styles.weeklyChartCard}>
                  <View style={styles.weeklyCardHeader}>
                    <View>
                      <Text style={styles.sectionSmallLabel}>Weekly Earnings</Text>
                      <View style={styles.weekHeaderRow}>
                        <Text style={styles.weekAmountText}>
                          ₹{formatRupees(earningsData?.week?.totalEarnings)}
                        </Text>
                        <View style={styles.greenBadgePill}>
                          <Text style={styles.greenBadgeText}>
                            {earningsData.week.comparison}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.rateBadge}>
                      <Text style={styles.rateBadgeText}>₹{earningsData.ratePerDelivery || 30}/order</Text>
                    </View>
                  </View>

                  {/* Interactive SVG Curve Chart */}
                  <View style={styles.svgContainer}>
                    <Svg width={chartWidth} height={chartHeight}>
                      <Path
                        d={weeklyPathString}
                        fill="none"
                        stroke="#FFC928"
                        strokeWidth={3}
                        strokeLinecap="round"
                      />

                      {/* Selected day vertical dashed line & tooltip */}
                      {selectedPoint && (
                        <G>
                          <Line
                            x1={selectedPoint.x}
                            y1={selectedPoint.y}
                            x2={selectedPoint.x}
                            y2={chartHeight - 15}
                            stroke="#111827"
                            strokeWidth={1.5}
                            strokeDasharray="3, 3"
                          />
                          <Rect
                            x={selectedPoint.x - 26}
                            y={Math.max(selectedPoint.y - 32, 2)}
                            width={52}
                            height={24}
                            rx={7}
                            fill="#111827"
                          />
                          <SvgText
                            x={selectedPoint.x}
                            y={Math.max(selectedPoint.y - 16, 17)}
                            fill="#FFFFFF"
                            fontSize="11.5"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            ₹{selectedPoint.amount}
                          </SvgText>
                        </G>
                      )}

                      {/* Point Circles on each day */}
                      {weeklyPoints.map((pt, i) => (
                        <Circle
                          key={i}
                          cx={pt.x}
                          cy={pt.y}
                          r={i === selectedDayIndex ? 5.5 : 4}
                          fill={i === selectedDayIndex ? '#111827' : '#FFC928'}
                          stroke="#FFFFFF"
                          strokeWidth={2}
                          onPress={() => {
                            hapticFeedback.selection?.();
                            setSelectedDayIndex(i);
                          }}
                        />
                      ))}
                    </Svg>

                    {/* Day Labels Row */}
                    <View style={styles.chartDaysRow}>
                      {earningsData.week.chart.map((d, idx) => {
                        const isSelected = idx === selectedDayIndex;
                        return (
                          <TouchableOpacity
                            key={idx}
                            activeOpacity={0.7}
                            onPress={() => {
                              hapticFeedback.selection?.();
                              setSelectedDayIndex(idx);
                            }}
                            style={styles.dayTouchCol}
                          >
                            <Text
                              style={[
                                styles.dayAxisLabel,
                                isSelected && styles.dayAxisLabelSelected
                              ]}
                            >
                              {d.day}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>

                {/* 4-Metric Grid */}
                <View style={styles.metricGrid2x2}>
                  <View style={styles.metricGridCard}>
                    <View style={[styles.gridIconCircle, { backgroundColor: '#DCFCE7' }]}>
                      <CheckCircle2 size={18} color="#16A34A" />
                    </View>
                    <Text style={styles.gridNumber}>
                      {earningsData.week.stats?.completedDeliveries || 0}
                    </Text>
                    <Text style={styles.gridLabel}>Completed</Text>
                  </View>

                  <View style={styles.metricGridCard}>
                    <View style={[styles.gridIconCircle, { backgroundColor: '#FFEDD5' }]}>
                      <Clock size={18} color="#EA580C" />
                    </View>
                    <Text style={styles.gridNumber}>
                      {earningsData.week.stats?.onlineTime || '28h'}
                    </Text>
                    <Text style={styles.gridLabel}>Online Time</Text>
                  </View>

                  <View style={styles.metricGridCard}>
                    <View style={[styles.gridIconCircle, { backgroundColor: '#FEF9C3' }]}>
                      <Coins size={18} color="#EAB308" />
                    </View>
                    <Text style={styles.gridNumber}>
                      ₹{earningsData.ratePerDelivery || 30}
                    </Text>
                    <Text style={styles.gridLabel}>Rate per Order</Text>
                  </View>

                  <View style={styles.metricGridCard}>
                    <View style={[styles.gridIconCircle, { backgroundColor: '#DBEAFE' }]}>
                      <Store size={18} color="#2563EB" />
                    </View>
                    <Text style={styles.gridNumber}>
                      ₹{formatRupees(
                        earningsData?.storeCashSettlement?.cashToCollect ??
                        earningsData?.overview?.cashToCollect
                      )}
                    </Text>
                    <Text style={styles.gridLabel}>Cash to Collect</Text>
                  </View>
                </View>

                {/* Daily Earnings List */}
                <Text style={styles.sectionTitle}>Daily Completed Deliveries</Text>
                <View style={styles.dailyCardList}>
                  {earningsData.week.dailyList.map((dayItem, index) => (
                    <TouchableOpacity
                      key={index}
                      activeOpacity={0.7}
                      onPress={() => {
                        hapticFeedback.selection?.();
                        setSelectedDayIndex(Math.min(index, 6));
                      }}
                      style={[
                        styles.dailyItemRow,
                        index === selectedDayIndex && styles.dailyItemRowSelected
                      ]}
                    >
                      <View style={styles.dailyIconBox}>
                        <ShoppingBag size={18} color="#16A34A" />
                      </View>
                      <View style={styles.dailyTextCol}>
                        <Text style={styles.dailyTitle}>{dayItem.dayLabel}</Text>
                        <Text style={styles.dailySub}>
                          {dayItem.orderCount} deliveries @ ₹{earningsData.ratePerDelivery || 30}
                        </Text>
                      </View>
                      <Text style={styles.dailyAmountText}>₹{dayItem.amount}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* ============================================================== */}
            {/* 4. THIS MONTH — SUMMARY & ANALYTICS                            */}
            {/* ============================================================== */}
            {activePeriod === 'month' && (
              <View style={styles.stateWrapper}>
                {/* Monthly Summary Card */}
                <View style={styles.monthHeroCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.todayHeroLabel}>This Month</Text>
                    <View style={styles.monthHeroAmountRow}>
                      <Text style={styles.monthHeroAmount}>
                        ₹{formatRupees(earningsData?.month?.totalEarnings)}
                      </Text>
                    </View>
                    <View style={styles.greenBadgePill}>
                      <Text style={styles.greenBadgeText}>
                        {earningsData.month.comparison}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.goldCoinsBox}>
                    <Coins size={44} color="#EAB308" strokeWidth={1.8} />
                  </View>
                </View>

                {/* Earnings Overview Bar Chart */}
                <View style={styles.cardBox}>
                  <View style={styles.overviewHeaderRow}>
                    <Text style={styles.cardHeaderTitle}>Daily Orders Trend (30 Days)</Text>
                    <View style={styles.rateBadge}>
                      <Text style={styles.rateBadgeText}>₹{earningsData.ratePerDelivery || 30}/order</Text>
                    </View>
                  </View>

                  {/* 30-Day Vertical Bars Container */}
                  <View style={styles.monthBarsContainer}>
                    {earningsData.month.daysChart.map((d, idx) => {
                      const h = Math.max(10, Math.min(65, (d.amount / 300) * 60));
                      return (
                        <View
                          key={idx}
                          style={[
                            styles.monthBar,
                            {
                              height: h,
                              backgroundColor: d.isToday ? '#FFC928' : '#FEF08A'
                            }
                          ]}
                        />
                      );
                    })}
                  </View>

                  {/* Day X-Axis Labels */}
                  <View style={styles.monthAxisRow}>
                    {[1, 5, 10, 15, 20, 25, 30].map((num) => (
                      <Text key={num} style={styles.monthAxisNum}>
                        {num}
                      </Text>
                    ))}
                  </View>

                  {/* Month Metrics Footer Row */}
                  <View style={styles.monthMetricsRow}>
                    <View style={styles.monthMetricCol}>
                      <Text style={styles.monthMetricLabel}>Total Deliveries</Text>
                      <Text style={styles.monthMetricVal}>
                        {earningsData.month.stats?.totalOrders || 0}
                      </Text>
                    </View>
                    <View style={styles.metricVDivider} />
                    <View style={styles.monthMetricCol}>
                      <Text style={styles.monthMetricLabel}>Rate per Delivery</Text>
                      <Text style={styles.monthMetricVal}>
                        ₹{earningsData.ratePerDelivery || 30}
                      </Text>
                    </View>
                    <View style={styles.metricVDivider} />
                    <View style={styles.monthMetricCol}>
                      <Text style={styles.monthMetricLabel}>Active Days</Text>
                      <Text style={styles.monthMetricVal}>
                        {earningsData.month.stats?.activeDays || 0}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Recent Earnings */}
                <View style={styles.historySectionHeader}>
                  <Text style={styles.sectionTitle}>Month Delivery Records</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setShowAllTransactionsModal(true)}
                  >
                    <Text style={styles.viewAllText}>View All</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.recentOrdersList}>
                  {earningsData.orders.slice(0, 4).map((ord) => (
                    <View key={ord._id} style={styles.recentOrderRow}>
                      <View style={styles.recentOrderIcon}>
                        <ShoppingBag size={18} color="#16A34A" />
                      </View>
                      <View style={styles.recentOrderInfo}>
                        <Text style={styles.recentOrderNumber}>#{ord.orderNumber}</Text>
                        <Text style={styles.recentOrderTime}>
                          {ord.deliveredAt ? new Date(ord.deliveredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Delivered'}
                        </Text>
                      </View>
                      <Text style={styles.recentOrderAmount}>+₹{ord.amount}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        </ScrollView>
      </SafeAreaView>

      {/* Store Cash Settlement Details Modal */}
      <Modal
        visible={showSettlementModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSettlementModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Store size={20} color="#111827" strokeWidth={2.2} />
                <Text style={styles.modalTitle}>Store Cash Settlement</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowSettlementModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBalanceBox}>
              <Text style={styles.modalBalanceLabel}>Cash Awaiting Collection</Text>
              <Text style={styles.modalBalanceAmount}>
                ₹{formatRupees(
                  earningsData?.storeCashSettlement?.cashToCollect ??
                  earningsData?.overview?.cashToCollect
                )}
              </Text>
              {renderStatusBadge(
                earningsData?.storeCashSettlement?.settlementStatus ||
                earningsData?.overview?.settlementStatus
              )}
            </View>

            <View style={styles.settlementDetailList}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Compensation Rate</Text>
                <Text style={styles.detailValue}>
                  ₹{earningsData.ratePerDelivery || 30} / delivery
                </Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Earned to Date</Text>
                <Text style={styles.detailValue}>
                  ₹{formatRupees(
                    earningsData?.storeCashSettlement?.totalEarned ??
                    earningsData?.overview?.totalEarned
                  )}
                </Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Cash Collected</Text>
                <Text style={styles.detailValue}>
                  ₹{formatRupees(
                    earningsData?.storeCashSettlement?.cashCollected ??
                    earningsData?.overview?.cashCollected
                  )}
                </Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Collection Location</Text>
                <Text style={styles.detailValue}>Store Dispatch Counter</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Settlement Timing</Text>
                <Text style={styles.detailValue}>End of shift / Daily</Text>
              </View>
            </View>

            <Text style={styles.modalInstructionsNote}>
              * Delivery earnings are calculated per completed delivery based on the admin rate and handed over in cash at the store hub counter.
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowSettlementModal(false)}
              style={styles.modalDoneBtn}
            >
              <Text style={styles.modalDoneBtnText}>Understood</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* View All Delivery Earnings History Modal */}
      <Modal
        visible={showAllTransactionsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAllTransactionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '80%' }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Delivery Earnings History</Text>
              <TouchableOpacity
                onPress={() => setShowAllTransactionsModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {earningsData.orders && earningsData.orders.length > 0 ? (
                earningsData.orders.map((ord) => (
                  <View key={ord._id} style={styles.recentOrderRow}>
                    <View style={styles.recentOrderIcon}>
                      <ShoppingBag size={18} color="#16A34A" />
                    </View>
                    <View style={styles.recentOrderInfo}>
                      <Text style={styles.recentOrderNumber}>#{ord.orderNumber}</Text>
                      <Text style={styles.recentOrderAddress} numberOfLines={1}>
                        {ord.customerAddress || 'Customer Location'}
                      </Text>
                      <Text style={styles.orderDeliverTime}>
                        {ord.deliveredAt ? new Date(ord.deliveredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Delivered'}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.recentOrderAmount}>+₹{ord.amount}</Text>
                      <View style={[
                        styles.orderSettledPill,
                        { backgroundColor: ord.settlementStatus === 'Settled' ? '#DCFCE7' : '#FEF3C7' }
                      ]}>
                        <Text style={[
                          styles.orderSettledText,
                          { color: ord.settlementStatus === 'Settled' ? '#15803D' : '#B45309' }
                        ]}>
                          {ord.settlementStatus || 'Unsettled'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                  <ShoppingBag size={32} color="#94A3B8" />
                  <Text style={{ fontFamily: typography.family.bold, fontSize: 14, color: '#111827', marginTop: 8 }}>
                    No completed orders yet
                  </Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowAllTransactionsModal(false)}
              style={[styles.modalDoneBtn, { marginTop: 14 }]}
            >
              <Text style={styles.modalDoneBtnText}>Close</Text>
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
  safeArea: {
    flex: 1
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF'
  },
  headerTitle: {
    fontFamily: typography.family.heavy,
    fontSize: 24,
    color: '#111827'
  },
  headerSubtitle: {
    fontFamily: typography.family.medium,
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  calendarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  periodSelectorWrapper: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  periodPillContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 3
  },
  periodTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center'
  },
  periodTabActive: {
    backgroundColor: '#FFC928'
  },
  periodTabText: {
    fontFamily: typography.family.medium,
    fontSize: 12.5,
    color: '#64748B'
  },
  periodTabTextActive: {
    fontFamily: typography.family.bold,
    color: '#111827'
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14
  },
  stateWrapper: {
    width: '100%'
  },

  // Store Cash Settlement Hero Card
  settlementHeroCard: {
    position: 'relative',
    backgroundColor: '#FEF08A',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FDE047',
    padding: 20,
    marginBottom: 14,
    overflow: 'hidden'
  },
  settlementHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  heroTitleGroup: {
    flex: 1
  },
  settlementLabel: {
    fontFamily: typography.family.bold,
    fontSize: 12,
    color: '#854D0E',
    letterSpacing: 0.5
  },
  settlementNote: {
    fontFamily: typography.family.regular,
    fontSize: 11.5,
    color: '#A16207',
    marginTop: 2
  },
  settlementAmount: {
    fontFamily: typography.family.heavy,
    fontSize: 34,
    color: '#111827',
    marginVertical: 8
  },
  heroActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4
  },
  viewSettlementBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  viewSettlementBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 12.5,
    color: '#111827'
  },
  rateBadge: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 5
  },
  rateBadgeText: {
    fontFamily: typography.family.bold,
    fontSize: 11,
    color: '#92400E'
  },
  coinsWatermark: {
    position: 'absolute',
    right: 14,
    bottom: 10
  },

  // Notice Banner
  collectionNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    padding: 14,
    marginBottom: 14
  },
  noticeIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  noticeTextCol: {
    flex: 1
  },
  noticeTitle: {
    fontFamily: typography.family.bold,
    fontSize: 13,
    color: '#92400E'
  },
  noticeSub: {
    fontFamily: typography.family.regular,
    fontSize: 11.5,
    color: '#B45309',
    marginTop: 2,
    lineHeight: 16
  },

  // 3-Metric Row
  threeStatRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14
  },
  statSquareCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statSquareLabel: {
    fontFamily: typography.family.medium,
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },
  statBigNumber: {
    fontFamily: typography.family.heavy,
    fontSize: 18,
    color: '#111827',
    marginBottom: 2
  },

  // Section Headers
  historySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4
  },
  sectionTitle: {
    fontFamily: typography.family.bold,
    fontSize: 15,
    color: '#111827'
  },
  viewAllText: {
    fontFamily: typography.family.bold,
    fontSize: 12.5,
    color: '#0284C7'
  },

  // Settlement Card List
  settlementCardList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    marginBottom: 14
  },
  settlementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  settlementIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  settlementInfoCol: {
    flex: 1
  },
  settlementDateText: {
    fontFamily: typography.family.bold,
    fontSize: 13.5,
    color: '#111827'
  },
  settlementStoreText: {
    fontFamily: typography.family.regular,
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2
  },
  settlementRightCol: {
    alignItems: 'flex-end'
  },
  settlementAmountText: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#111827'
  },
  emptySettlementBox: {
    paddingVertical: 24,
    alignItems: 'center',
    paddingHorizontal: 16
  },
  emptySettlementTitle: {
    fontFamily: typography.family.bold,
    fontSize: 13.5,
    color: '#111827',
    marginTop: 8
  },
  emptySettlementSub: {
    fontFamily: typography.family.regular,
    fontSize: 11.5,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16
  },

  // Design 1 — Today Card
  todayHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    padding: 18,
    marginBottom: 14
  },
  todayHeroLabel: {
    fontFamily: typography.family.medium,
    fontSize: 12,
    color: '#854D0E',
    marginBottom: 4
  },
  todayHeroAmount: {
    fontFamily: typography.family.heavy,
    fontSize: 30,
    color: '#111827',
    marginBottom: 4
  },
  miniBarGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 50
  },
  miniBar: {
    width: 6,
    borderRadius: 3
  },

  // Card Box (Breakdown)
  cardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 14
  },
  cardHeaderTitle: {
    fontFamily: typography.family.bold,
    fontSize: 15,
    color: '#111827',
    marginBottom: 12
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6
  },
  breakdownIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  breakdownInfoCol: {
    flex: 1
  },
  breakdownItemTitle: {
    fontFamily: typography.family.bold,
    fontSize: 13.5,
    color: '#111827'
  },
  breakdownItemSub: {
    fontFamily: typography.family.regular,
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2
  },
  breakdownItemAmount: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#111827'
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 6
  },

  // Recent Orders List
  recentOrdersList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    marginBottom: 14
  },
  recentOrderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  recentOrderIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  recentOrderInfo: {
    flex: 1
  },
  recentOrderNumber: {
    fontFamily: typography.family.bold,
    fontSize: 13.5,
    color: '#111827'
  },
  recentOrderTime: {
    fontFamily: typography.family.regular,
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1
  },
  recentOrderAddress: {
    fontFamily: typography.family.regular,
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1
  },
  orderDeliverTime: {
    fontFamily: typography.family.regular,
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 1
  },
  recentOrderAmount: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#16A34A'
  },
  orderSettledPill: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginTop: 2
  },
  orderSettledText: {
    fontFamily: typography.family.bold,
    fontSize: 10
  },

  // Design 2 — Weekly Chart Card
  weeklyChartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 18,
    marginBottom: 14
  },
  weeklyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  sectionSmallLabel: {
    fontFamily: typography.family.medium,
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4
  },
  weekHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2
  },
  weekAmountText: {
    fontFamily: typography.family.heavy,
    fontSize: 26,
    color: '#111827'
  },
  greenBadgePill: {
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  greenBadgeText: {
    fontFamily: typography.family.bold,
    fontSize: 11,
    color: '#15803D'
  },
  svgContainer: {
    alignItems: 'center',
    marginTop: 10
  },
  chartDaysRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: 8
  },
  dayTouchCol: {
    paddingVertical: 4,
    paddingHorizontal: 4
  },
  dayAxisLabel: {
    fontFamily: typography.family.medium,
    fontSize: 11.5,
    color: '#64748B'
  },
  dayAxisLabelSelected: {
    fontFamily: typography.family.bold,
    color: '#111827'
  },

  // 2x2 Metric Grid
  metricGrid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14
  },
  metricGridCard: {
    width: (SCREEN_WIDTH - 42) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 14,
    alignItems: 'center'
  },
  gridIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6
  },
  gridNumber: {
    fontFamily: typography.family.bold,
    fontSize: 16,
    color: '#111827'
  },
  gridLabel: {
    fontFamily: typography.family.medium,
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },

  // Daily Card List (Week)
  dailyCardList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    marginTop: 8,
    marginBottom: 14
  },
  dailyItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  dailyItemRowSelected: {
    backgroundColor: '#FFFBEB'
  },
  dailyIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  dailyTextCol: {
    flex: 1
  },
  dailyTitle: {
    fontFamily: typography.family.bold,
    fontSize: 13.5,
    color: '#111827'
  },
  dailySub: {
    fontFamily: typography.family.regular,
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2
  },
  dailyAmountText: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#111827'
  },

  // Design 4 — Month
  monthHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    padding: 18,
    marginBottom: 14
  },
  monthHeroAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4
  },
  monthHeroAmount: {
    fontFamily: typography.family.heavy,
    fontSize: 26,
    color: '#111827'
  },
  goldCoinsBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center'
  },

  // Month 30-Day Bar Overview
  overviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  monthBarsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 70,
    paddingVertical: 4
  },
  monthBar: {
    flex: 1,
    marginHorizontal: 1.5,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3
  },
  monthAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 6
  },
  monthAxisNum: {
    fontFamily: typography.family.regular,
    fontSize: 10.5,
    color: '#94A3B8'
  },
  monthMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  monthMetricCol: {
    flex: 1,
    alignItems: 'center'
  },
  monthMetricLabel: {
    fontFamily: typography.family.medium,
    fontSize: 10.5,
    color: '#64748B',
    marginBottom: 2,
    textAlign: 'center'
  },
  monthMetricVal: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#111827'
  },
  metricVDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB'
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  modalTitle: {
    fontFamily: typography.family.bold,
    fontSize: 16,
    color: '#111827'
  },
  modalCloseBtn: {
    padding: 4
  },
  modalBalanceBox: {
    backgroundColor: '#FEF08A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE047',
    padding: 16,
    alignItems: 'center',
    marginBottom: 14
  },
  modalBalanceLabel: {
    fontFamily: typography.family.medium,
    fontSize: 12,
    color: '#854D0E'
  },
  modalBalanceAmount: {
    fontFamily: typography.family.heavy,
    fontSize: 26,
    color: '#111827',
    marginVertical: 4
  },
  statusBadgePill: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 2
  },
  statusBadgeText: {
    fontFamily: typography.family.bold,
    fontSize: 11
  },
  settlementDetailList: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginBottom: 12
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6
  },
  detailLabel: {
    fontFamily: typography.family.medium,
    fontSize: 12,
    color: '#64748B'
  },
  detailValue: {
    fontFamily: typography.family.bold,
    fontSize: 12,
    color: '#111827'
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#E5E7EB'
  },
  modalInstructionsNote: {
    fontFamily: typography.family.regular,
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginBottom: 14
  },
  modalDoneBtn: {
    height: 46,
    backgroundColor: '#FFC928',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalDoneBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#111827'
  },
  successPill: {
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginTop: 2
  },
  successPillText: {
    fontFamily: typography.family.bold,
    fontSize: 10,
    color: '#15803D'
  }
});
