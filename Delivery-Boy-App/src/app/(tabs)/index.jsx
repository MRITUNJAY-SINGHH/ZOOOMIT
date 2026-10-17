import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  Linking,
  Dimensions,
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation
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
  Bell,
  CheckCircle2,
  Clock,
  Package,
  Coins,
  BarChart2,
  Store,
  ChevronRight,
  Navigation,
  Phone,
  Play,
  X,
  Check,
  RotateCcw,
  AlertCircle,
  ShoppingBag,
  Megaphone,
  Star
} from 'lucide-react-native';
import { colors, typography } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { deliveryService } from '../../services/deliveryService';
import { hapticFeedback } from '../../services/haptics';
import { ConfirmationModal } from '../../components/ConfirmationModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// BESPOKE SVG ILLUSTRATIONS (Matches Phone 3 Offline / Empty States)
// ============================================================================

/** Delivery Scooter Illustration for "No Active Delivery" empty state */
function ScooterIllustration() {
  return (
    <View style={styles.illustrationWrap}>
      <Svg width={130} height={92} viewBox="0 0 130 92">
        <Defs>
          <LinearGradient id="scooterGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FFC928" />
            <Stop offset="100%" stopColor="#F59E0B" />
          </LinearGradient>
          <LinearGradient id="boxGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FEF08A" />
            <Stop offset="100%" stopColor="#FFC928" />
          </LinearGradient>
        </Defs>

        {/* Road ground line */}
        <Path d="M 12 80 L 118 80" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />

        {/* Back Wheel */}
        <Circle cx="32" cy="68" r="12" fill="#1E293B" />
        <Circle cx="32" cy="68" r="6" fill="#F8FAFC" />
        <Circle cx="32" cy="68" r="2.5" fill="#64748B" />

        {/* Front Wheel */}
        <Circle cx="98" cy="68" r="12" fill="#1E293B" />
        <Circle cx="98" cy="68" r="6" fill="#F8FAFC" />
        <Circle cx="98" cy="68" r="2.5" fill="#64748B" />

        {/* Scooter Chassis Frame */}
        <Path
          d="M 32 68 L 48 68 Q 56 68 60 62 L 70 48 Q 74 42 84 42 L 90 42 L 96 64"
          fill="none"
          stroke="url(#scooterGrad)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Footrest plate */}
        <Path d="M 48 66 L 72 66" stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" />

        {/* Rear Body Panel */}
        <Path d="M 22 66 Q 26 48 44 48 L 54 48 Q 58 58 54 66 Z" fill="#F59E0B" />

        {/* Seat Cushion */}
        <Path d="M 35 46 Q 47 43 57 46 L 57 42 Q 47 39 35 42 Z" fill="#1E293B" />

        {/* Rear Delivery Trunk Box */}
        <Rect x="18" y="24" width="24" height="22" rx="4" fill="url(#boxGrad)" stroke="#D97706" strokeWidth="1.5" />
        <Rect x="18" y="32" width="24" height="3" fill="#D97706" opacity="0.35" />
        <Circle cx="30" cy="35" r="2" fill="#B45309" />

        {/* Steering Column & Handlebars */}
        <Path d="M 98 68 L 88 32" stroke="#64748B" strokeWidth="3.5" strokeLinecap="round" />
        <Path d="M 84 30 L 94 32" stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" />

        {/* Headlight */}
        <Circle cx="92" cy="34" r="3.5" fill="#FEF9C3" stroke="#F59E0B" strokeWidth="1.2" />

        {/* Front Mudguard */}
        <Path d="M 88 60 Q 98 52 106 62" stroke="#F59E0B" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      </Svg>
    </View>
  );
}

/** Open Parcel Box Illustration for "No New Offers" empty state */
function ParcelBoxIllustration() {
  return (
    <View style={styles.illustrationWrap}>
      <Svg width={130} height={92} viewBox="0 0 130 92">
        <Defs>
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

        {/* Subtle background glow circle */}
        <Circle cx="65" cy="48" r="38" fill="#FEF3C7" opacity="0.6" />

        {/* Sparkles */}
        <Path
          d="M 96 20 Q 97.5 24 102 25 Q 97.5 26 96 30 Q 94.5 26 90 25 Q 94.5 24 96 20 Z"
          fill="#FBBF24"
        />
        <Path
          d="M 34 34 Q 35 37 38 38 Q 35 39 34 42 Q 33 39 30 38 Q 33 37 34 34 Z"
          fill="#FDE68A"
        />

        {/* Inside Box Cavity */}
        <Polygon points="42,42 65,54 88,42 65,32" fill="url(#boxInside)" />

        {/* Box Left Front */}
        <Polygon points="42,42 65,54 65,79 42,67" fill="url(#boxFront)" />

        {/* Box Right Side */}
        <Polygon points="65,54 88,42 88,67 65,79" fill="url(#boxSide)" />

        {/* Open Flaps */}
        <Polygon points="42,42 65,32 55,24 32,32" fill="url(#flapGrad)" />
        <Polygon points="65,32 88,42 98,32 75,24" fill="#FCD34D" />
        <Polygon points="42,42 65,54 60,63 35,51" fill="#FBBF24" />
        <Polygon points="65,54 88,42 95,51 70,63" fill="#F59E0B" />
      </Svg>
    </View>
  );
}

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { partner, isOnline, toggleOnline } = useAuth();

  // Scroll & Sticky Animation Values
  const scrollY = useSharedValue(0);

  const FULL_HEADER_HEIGHT = insets.top + 96;
  const COMPACT_HEADER_HEIGHT = insets.top + 54;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    }
  });

  // State Management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);

  const [stats, setStats] = useState({
    todayEarnings: 0,
    todayCompleted: 0,
    todayPending: 0,
    totalDeliveries: 0,
    ratePerDelivery: 30,
    cashToCollect: 0,
    settlementStatus: 'Awaiting Collection',
    activeOrder: null,
    recentActivity: []
  });

  const [availableOffers, setAvailableOffers] = useState([]);
  const [selectedOfferToReject, setSelectedOfferToReject] = useState(null);
  const [acceptingId, setAcceptingId] = useState(null);
  const [rejecting, setRejecting] = useState(false);
  const [offerCountdown, setOfferCountdown] = useState(28);

  // Quick Notifications Modal
  const [notificationsList, setNotificationsList] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(3);
  const [showQuickNotifs, setShowQuickNotifs] = useState(false);

  // --------------------------------------------------------------------------
  // Data Fetching
  // --------------------------------------------------------------------------
  const fetchDashboardData = useCallback(async () => {
    try {
      const [dashData, offers, notifs] = await Promise.all([
        deliveryService.getDashboard().catch(() => ({})),
        deliveryService.getAvailableOrders().catch(() => []),
        deliveryService.getNotifications().catch(() => [])
      ]);

      setStats({
        todayEarnings: dashData.todayEarnings || 0,
        todayCompleted: dashData.todayCompleted || 0,
        todayPending: dashData.todayPending || 0,
        totalDeliveries: dashData.totalDeliveries || 0,
        ratePerDelivery: dashData.ratePerDelivery || 30,
        cashToCollect: dashData.cashToCollect || 0,
        settlementStatus: dashData.settlementStatus || 'Awaiting Collection',
        activeOrder: dashData.activeOrder || null,
        recentActivity: dashData.recentActivity || []
      });

      setAvailableOffers(Array.isArray(offers) ? offers : []);

      if (Array.isArray(notifs) && notifs.length > 0) {
        setNotificationsList(notifs);
        const unread = notifs.filter((n) => !n.isRead).length;
        setUnreadNotifCount(unread);
      }
    } catch (err) {
      console.warn('[Dashboard] Data fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    hapticFeedback.light?.();
    fetchDashboardData();
  };

  // Countdown timer for active offer
  useEffect(() => {
    if (!availableOffers.length || !isOnline) return;
    setOfferCountdown(28);
    const timer = setInterval(() => {
      setOfferCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          fetchDashboardData();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [availableOffers.length, isOnline, fetchDashboardData]);

  // --------------------------------------------------------------------------
  // Online / Offline Switch
  // --------------------------------------------------------------------------
  const handleToggleOnline = async () => {
    if (togglingOnline) return;
    setTogglingOnline(true);
    hapticFeedback.medium?.();

    try {
      await toggleOnline();
      hapticFeedback.success?.();
      fetchDashboardData();
    } catch (err) {
      hapticFeedback.error?.();
      Alert.alert(
        'Availability Error',
        err.response?.data?.message || 'Unable to update availability status. Please check your network connection.'
      );
    } finally {
      setTogglingOnline(false);
    }
  };

  // --------------------------------------------------------------------------
  // Atomic Accept Order
  // --------------------------------------------------------------------------
  const handleAcceptOrder = async (order) => {
    if (!order?._id || acceptingId) return;
    setAcceptingId(order._id);
    hapticFeedback.medium?.();

    try {
      await deliveryService.acceptOrder(order._id);
      hapticFeedback.success?.();

      setAvailableOffers((prev) => prev.filter((o) => o._id !== order._id));
      await fetchDashboardData();

      Alert.alert(
        'Delivery Assigned! 🛵',
        'You have claimed this order. Navigating to pickup details.',
        [{ text: 'View Order', onPress: () => router.push(`/order/${order._id}`) }]
      );
    } catch (err) {
      hapticFeedback.error?.();
      if (err.response?.status === 409) {
        Alert.alert(
          'Order Claimed by Another Partner',
          err.response.data?.message || 'Another partner already accepted this order. The offer has been refreshed.'
        );
        setAvailableOffers((prev) => prev.filter((o) => o._id !== order._id));
        fetchDashboardData();
      } else {
        Alert.alert('Unable to Accept', err.response?.data?.message || err.message);
      }
    } finally {
      setAcceptingId(null);
    }
  };

  // --------------------------------------------------------------------------
  // Decline Order
  // --------------------------------------------------------------------------
  const handleConfirmReject = async ({ reason, details }) => {
    if (!selectedOfferToReject) return;
    setRejecting(true);
    hapticFeedback.medium?.();

    try {
      await deliveryService.rejectOrder(selectedOfferToReject._id, `${reason} - ${details}`);
      setAvailableOffers((prev) => prev.filter((o) => o._id !== selectedOfferToReject._id));
      setSelectedOfferToReject(null);
      hapticFeedback.light?.();
      fetchDashboardData();
    } catch (err) {
      Alert.alert('Decline Error', err.response?.data?.message || 'Could not decline offer.');
    } finally {
      setRejecting(false);
    }
  };

  // Partner initials
  const partnerInitials = partner?.name
    ? partner.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'DR';

  const partnerDisplayName = partner?.name || 'Delivery Rider 1';

  // Format activity timestamp
  const formatDeliveredTime = (dateStr) => {
    if (!dateStr) return 'Delivered';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Delivered';
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // --------------------------------------------------------------------------
  // Reanimated Header Animations
  // --------------------------------------------------------------------------
  const headerContainerAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, 85],
      [FULL_HEADER_HEIGHT, COMPACT_HEADER_HEIGHT],
      Extrapolation.CLAMP
    );
    return { height };
  });

  const fullHeaderContentAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 45], [1, 0], Extrapolation.CLAMP);
    const translateY = interpolate(scrollY.value, [0, 45], [0, -10], Extrapolation.CLAMP);
    return {
      opacity,
      transform: [{ translateY }]
    };
  });

  const compactHeaderContentAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [45, 80], [0, 1], Extrapolation.CLAMP);
    return {
      opacity
    };
  });

  const compactStatsAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [80, 130], [0, 1], Extrapolation.CLAMP);
    const translateY = interpolate(scrollY.value, [80, 130], [-10, 0], Extrapolation.CLAMP);
    return {
      opacity,
      transform: [{ translateY }]
    };
  });

  // Current eligible offer
  const currentOffer = availableOffers.length > 0 ? availableOffers[0] : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFC928" translucent={false} />

      {/* ==================================================================== */}
      {/* STICKY HEADER (Yellow Collapsible Header + Compact Stats Bar)         */}
      {/* ==================================================================== */}
      <View style={styles.stickyHeaderWrapper}>
        <Animated.View style={[styles.yellowHeaderContainer, headerContainerAnimatedStyle]}>
          <View style={[styles.headerInner, { paddingTop: insets.top + 8 }]}>
            {/* 1. Left Avatar */}
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{partnerInitials}</Text>
            </View>

            {/* 2. Middle Content: Full Greeting vs Compact Name */}
            <View style={styles.headerMiddleCol}>
              {/* Full Greeting (Fades out when scrolled) */}
              <Animated.View
                pointerEvents="box-none"
                style={[styles.fullGreetingBox, fullHeaderContentAnimatedStyle]}
              >
                <Text style={styles.greetingSmall}>Hello,</Text>
                <Text style={styles.partnerNameText} numberOfLines={1}>
                  {partnerDisplayName}
                </Text>
                <Text style={styles.partnerRoleText}>Delivery Partner</Text>
              </Animated.View>

              {/* Compact Name (Fades in when scrolled) */}
              <Animated.View
                pointerEvents="box-none"
                style={[styles.compactNameBox, compactHeaderContentAnimatedStyle]}
              >
                <Text style={styles.compactPartnerNameText} numberOfLines={1}>
                  {partnerDisplayName}
                </Text>
              </Animated.View>
            </View>

            {/* 3. Right Group: Online/Offline Badge & Notification Bell */}
            <View style={styles.headerRightGroup}>
              <View
                style={[
                  styles.statusPill,
                  isOnline ? styles.statusPillOnline : styles.statusPillOffline
                ]}
              >
                <View
                  style={[
                    styles.statusPillDot,
                    { backgroundColor: isOnline ? '#16A34A' : '#64748B' }
                  ]}
                />
                <Text
                  style={[
                    styles.statusPillText,
                    { color: isOnline ? '#16A34A' : '#475569' }
                  ]}
                >
                  {isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => {
                  hapticFeedback.light?.();
                  setShowQuickNotifs(true);
                }}
                style={styles.bellButton}
                accessibilityLabel="Notifications"
                accessibilityRole="button"
              >
                <Bell size={19} color="#111827" strokeWidth={2.2} />
                {unreadNotifCount > 0 && (
                  <View style={styles.bellBadge}>
                    <Text style={styles.bellBadgeText}>
                      {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Compact Sticky Stats Bar (Phone 2 - Visible when scrolled past overview) */}
        <Animated.View
          pointerEvents="box-none"
          style={[styles.compactStatsBar, compactStatsAnimatedStyle]}
        >
          <View style={styles.compactStatItem}>
            <Text style={styles.compactStatValue}>₹{stats.todayEarnings}</Text>
            <Text style={styles.compactStatLabel}>Earnings</Text>
          </View>

          <View style={styles.compactStatDivider} />

          <View style={styles.compactStatItem}>
            <Text style={styles.compactStatValue}>{stats.todayCompleted}</Text>
            <Text style={styles.compactStatLabel}>Completed</Text>
          </View>

          <View style={styles.compactStatDivider} />

          <View style={styles.compactStatItem}>
            <Text
              style={[
                styles.compactStatValue,
                stats.todayPending > 0 && { color: '#EF4444' }
              ]}
            >
              {stats.todayPending}
            </Text>
            <Text style={styles.compactStatLabel}>Pending</Text>
          </View>

          <View style={styles.compactStatDivider} />

          <View style={styles.compactStatItem}>
            <Text style={styles.compactStatValue}>{stats.totalDeliveries}</Text>
            <Text style={styles.compactStatLabel}>Total</Text>
          </View>
        </Animated.View>
      </View>

      {/* ==================================================================== */}
      {/* MAIN VERTICAL SCROLL CONTAINER                                       */}
      {/* ==================================================================== */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: FULL_HEADER_HEIGHT + 14 }
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FFC928']}
            tintColor="#FFC928"
            progressViewOffset={FULL_HEADER_HEIGHT}
          />
        }
      >
        {/* ================================================================== */}
        {/* 1. ONLINE / OFFLINE TOGGLE CARD                                    */}
        {/* ================================================================== */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleLeftCol}>
            <View style={styles.toggleTitleRow}>
              <View
                style={[
                  styles.toggleDot,
                  { backgroundColor: isOnline ? '#16A34A' : '#EF4444' }
                ]}
              />
              <Text style={styles.toggleTitle}>
                {isOnline ? 'You are Online' : 'You are Offline'}
              </Text>
            </View>
            <Text style={styles.toggleSubtitle}>
              {isOnline
                ? 'Ready to receive delivery orders'
                : 'You will not receive new delivery offers'}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleToggleOnline}
            disabled={togglingOnline}
            style={[
              styles.switchTrack,
              { backgroundColor: isOnline ? '#22C55E' : '#EF4444' }
            ]}
            accessibilityRole="switch"
            accessibilityState={{ checked: isOnline }}
            accessibilityLabel={isOnline ? 'Switch to Offline' : 'Switch to Online'}
          >
            <View
              style={[
                styles.switchKnob,
                isOnline ? styles.switchKnobOnline : styles.switchKnobOffline
              ]}
            >
              {togglingOnline && (
                <ActivityIndicator
                  size="small"
                  color={isOnline ? '#16A34A' : '#EF4444'}
                />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* ================================================================== */}
        {/* 2. TODAY'S OVERVIEW (4 Stat Cards Grid)                            */}
        {/* ================================================================== */}
        <View style={styles.overviewRow}>
          {/* Today's Earnings */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/earnings')}
            style={styles.statCard}
          >
            <View style={[styles.statIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Coins size={16} color="#D97706" strokeWidth={2.4} />
            </View>
            <Text style={styles.statCardValue}>₹{stats.todayEarnings}</Text>
            <Text style={styles.statCardLabel}>Today's Earnings</Text>
          </TouchableOpacity>

          {/* Completed Today */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/orders')}
            style={styles.statCard}
          >
            <View style={[styles.statIconCircle, { backgroundColor: '#DCFCE7' }]}>
              <CheckCircle2 size={16} color="#16A34A" strokeWidth={2.4} />
            </View>
            <Text style={styles.statCardValue}>{stats.todayCompleted}</Text>
            <Text style={styles.statCardLabel}>Completed Today</Text>
          </TouchableOpacity>

          {/* Pending Orders */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/orders')}
            style={styles.statCard}
          >
            <View style={[styles.statIconCircle, { backgroundColor: '#FEE2E2' }]}>
              <Package size={16} color="#EF4444" strokeWidth={2.4} />
            </View>
            <Text
              style={[
                styles.statCardValue,
                stats.todayPending > 0 && { color: '#EF4444' }
              ]}
            >
              {stats.todayPending}
            </Text>
            <Text style={styles.statCardLabel}>Pending Orders</Text>
          </TouchableOpacity>

          {/* Total Deliveries */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/orders')}
            style={styles.statCard}
          >
            <View style={[styles.statIconCircle, { backgroundColor: '#DBEAFE' }]}>
              <BarChart2 size={16} color="#2563EB" strokeWidth={2.4} />
            </View>
            <Text style={styles.statCardValue}>{stats.totalDeliveries}</Text>
            <Text style={styles.statCardLabel}>Total Deliveries</Text>
          </TouchableOpacity>
        </View>

        {/* ================================================================== */}
        {/* 3. CASH TO COLLECT FROM STORE                                      */}
        {/* ================================================================== */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            hapticFeedback.light?.();
            router.push('/(tabs)/earnings');
          }}
          style={styles.cashCollectCard}
        >
          <View style={styles.cashCollectIconBox}>
            <Store size={22} color="#D97706" strokeWidth={2.2} />
          </View>
          <View style={styles.cashCollectMiddle}>
            <Text style={styles.cashCollectHeading}>Cash to Collect from Store</Text>
            <Text style={styles.cashCollectAmount}>₹{stats.cashToCollect}</Text>
            <Text style={styles.cashCollectSub}>
              {stats.cashToCollect === 0 && stats.todayCompleted > 0
                ? 'All earnings collected'
                : 'Awaiting collection'}
            </Text>
          </View>
          <ChevronRight size={20} color="#94A3B8" strokeWidth={2.2} />
        </TouchableOpacity>

        {/* ================================================================== */}
        {/* 4. ACTIVE DELIVERY                                                 */}
        {/* ================================================================== */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Active Delivery</Text>
          {stats.activeOrder && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push(`/order/${stats.activeOrder._id}`)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.viewDetailsText}>View Details &gt;</Text>
            </TouchableOpacity>
          )}
        </View>

        {stats.activeOrder ? (
          /* Card when partner HAS an ongoing assignment */
          <View style={styles.activeDeliveryCard}>
            {/* Top Badges Row */}
            <View style={styles.activeCardTopRow}>
              <View style={styles.orderAcceptedPill}>
                <Text style={styles.orderAcceptedText}>
                  {stats.activeOrder.status
                    ? stats.activeOrder.status.toUpperCase()
                    : 'ORDER ACCEPTED'}
                </Text>
              </View>

              <View style={styles.timeBadgePill}>
                <Clock size={12} color="#64748B" strokeWidth={2.2} style={{ marginRight: 4 }} />
                <Text style={styles.timeBadgeText}>15-20 min</Text>
              </View>
            </View>

            {/* Order ID */}
            <Text style={styles.activeOrderId}>
              #{stats.activeOrder.orderNumber || 'ZM102300'}
            </Text>

            {/* Route Timeline */}
            <View style={styles.routeContainer}>
              {/* Pickup Store */}
              <View style={styles.routeStepRow}>
                <View style={styles.pickupPinWrap}>
                  <View style={styles.pickupPinOuter}>
                    <View style={styles.pickupPinInner} />
                  </View>
                  <View style={styles.routeVerticalLine} />
                </View>

                <View style={styles.routeDetailsCol}>
                  <Text style={styles.routeStepLead}>Pickup from</Text>
                  <Text style={styles.routeStoreName}>
                    {stats.activeOrder.pickupLocation?.storeName ||
                      stats.activeOrder.store?.name ||
                      'ZOOOMIT Supermart Hub'}
                  </Text>
                  <Text style={styles.routeStoreAddress} numberOfLines={1}>
                    {stats.activeOrder.pickupLocation?.address ||
                      'Sector 4, Main Express Lane, Tech Park'}
                  </Text>
                </View>
              </View>

              {/* Delivery Drop-off */}
              <View style={styles.routeStepRow}>
                <View style={styles.dropoffPinWrap}>
                  <View style={styles.dropoffPinOuter}>
                    <View style={styles.dropoffPinInner} />
                  </View>
                </View>

                <View style={styles.routeDetailsCol}>
                  <Text style={styles.routeStepLead}>Deliver to</Text>
                  <Text style={styles.routeCustomerName}>
                    {stats.activeOrder.customer?.name ||
                      stats.activeOrder.shippingAddress?.contactName ||
                      'Customer'}
                  </Text>
                  <Text style={styles.routeCustomerAddress} numberOfLines={1}>
                    {stats.activeOrder.deliveryLocation?.formattedAddress ||
                      stats.activeOrder.shippingAddress?.formattedAddress ||
                      'Raj Nagar, Ghaziabad'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Info Pills */}
            <View style={styles.infoPillsRow}>
              <View style={styles.infoPillItem}>
                <ShoppingBag size={13} color="#64748B" strokeWidth={2.2} style={{ marginRight: 5 }} />
                <Text style={styles.infoPillText}>
                  {stats.activeOrder.items?.length || 3} items
                </Text>
              </View>

              <View style={styles.infoPillItem}>
                <Navigation size={13} color="#64748B" strokeWidth={2.2} style={{ marginRight: 5 }} />
                <Text style={styles.infoPillText}>
                  {stats.activeOrder.distance || '2.4 km'}
                </Text>
              </View>

              <View style={styles.infoPillItem}>
                <Clock size={13} color="#64748B" strokeWidth={2.2} style={{ marginRight: 5 }} />
                <Text style={styles.infoPillText}>15-20 min</Text>
              </View>
            </View>

            {/* Bottom Actions Row */}
            <View style={styles.activeActionsRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push(`/order/${stats.activeOrder._id}`)}
                style={styles.viewRouteBtn}
              >
                <Navigation size={17} color="#111827" strokeWidth={2.4} style={{ marginRight: 6 }} />
                <Text style={styles.viewRouteBtnText}>View Route</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => {
                  const phone =
                    stats.activeOrder.customer?.phone ||
                    stats.activeOrder.shippingAddress?.contactPhone ||
                    '+919876543210';
                  Linking.openURL(`tel:${phone}`);
                }}
                style={styles.callIconBtn}
                accessibilityLabel="Call Customer"
              >
                <Phone size={18} color="#111827" strokeWidth={2.2} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Empty State when NO ongoing assignment (Phone 3) */
          <View style={styles.emptyCardContainer}>
            <ScooterIllustration />
            <Text style={styles.emptyCardTitle}>No Active Delivery</Text>
            <Text style={styles.emptyCardSub}>
              {isOnline
                ? "You don't have an active delivery right now. High-priority orders in your hub will be assigned here."
                : "You don't have any active delivery right now.\nGo online to receive new offers."}
            </Text>

            {!isOnline && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleToggleOnline}
                style={styles.goOnlineBtn}
              >
                <Play size={14} color="#111827" fill="#111827" style={{ marginRight: 6 }} />
                <Text style={styles.goOnlineBtnText}>Go Online</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ================================================================== */}
        {/* 5. NEW DELIVERY OFFER                                              */}
        {/* ================================================================== */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>New Delivery Offer</Text>
          {isOnline && currentOffer && (
            <View style={styles.timerBadge}>
              <Clock size={12} color="#D97706" strokeWidth={2.2} style={{ marginRight: 4 }} />
              <Text style={styles.timerBadgeText}>{offerCountdown}s</Text>
            </View>
          )}
        </View>

        {isOnline && currentOffer ? (
          /* New Offer Available Card */
          <View style={styles.newOfferCard}>
            {/* Top Order ID & Earnings Badge */}
            <View style={styles.offerCardTopRow}>
              <View style={styles.offerIdRow}>
                <View style={styles.offerTagIconBox}>
                  <Coins size={14} color="#B45309" strokeWidth={2.2} />
                </View>
                <Text style={styles.offerOrderNumber}>
                  #{currentOffer.orderNumber || 'ZM102344'}
                </Text>
              </View>

              <View style={styles.earningsBox}>
                <Text style={styles.earningsBoxLead}>EARNINGS</Text>
                <Text style={styles.earningsBoxValue}>
                  ₹{currentOffer.estimatedEarnings || stats.ratePerDelivery || 30}
                </Text>
              </View>
            </View>

            {/* Offer Route */}
            <View style={styles.routeContainer}>
              {/* Pickup Store */}
              <View style={styles.routeStepRow}>
                <View style={styles.pickupPinWrap}>
                  <View style={styles.pickupPinOuter}>
                    <View style={styles.pickupPinInner} />
                  </View>
                  <View style={styles.routeVerticalLine} />
                </View>

                <View style={styles.routeDetailsCol}>
                  <Text style={styles.routeStoreName}>
                    {currentOffer.pickupLocation?.storeName || 'ZOOOMIT Supermart Hub'}
                  </Text>
                  <Text style={styles.routeStoreAddress} numberOfLines={1}>
                    {currentOffer.pickupLocation?.address ||
                      'Sector 4, Main Express Lane, Tech Park'}
                  </Text>
                </View>
              </View>

              {/* Delivery Drop-off */}
              <View style={styles.routeStepRow}>
                <View style={styles.dropoffPinWrap}>
                  <View style={styles.dropoffPinOuter}>
                    <View style={styles.dropoffPinInner} />
                  </View>
                </View>

                <View style={styles.routeDetailsCol}>
                  <Text style={styles.routeStepLead}>Deliver to</Text>
                  <Text style={styles.routeCustomerName}>
                    {currentOffer.deliveryLocation?.contactName || 'Walk In Customer 2'}
                  </Text>
                  <Text style={styles.routeCustomerAddress} numberOfLines={1}>
                    {currentOffer.deliveryLocation?.formattedAddress || 'Raj Nagar, Ghaziabad'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Info Pills */}
            <View style={styles.infoPillsRow}>
              <View style={styles.infoPillItem}>
                <ShoppingBag size={13} color="#64748B" strokeWidth={2.2} style={{ marginRight: 5 }} />
                <Text style={styles.infoPillText}>
                  {currentOffer.itemCount || 3} items
                </Text>
              </View>

              <View style={styles.infoPillItem}>
                <Navigation size={13} color="#64748B" strokeWidth={2.2} style={{ marginRight: 5 }} />
                <Text style={styles.infoPillText}>
                  {currentOffer.deliveryLocation?.distanceKm || '2.8'} km
                </Text>
              </View>

              <View style={styles.infoPillItem}>
                <Clock size={13} color="#64748B" strokeWidth={2.2} style={{ marginRight: 5 }} />
                <Text style={styles.infoPillText}>15-20 min</Text>
              </View>
            </View>

            {/* Offer Action Buttons (Decline / Accept Delivery) */}
            <View style={styles.offerActionsRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedOfferToReject(currentOffer)}
                style={styles.declineBtn}
                accessibilityLabel="Decline Offer"
              >
                <X size={16} color="#EF4444" strokeWidth={2.4} style={{ marginRight: 4 }} />
                <Text style={styles.declineBtnText}>Decline</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleAcceptOrder(currentOffer)}
                disabled={acceptingId === currentOffer._id}
                style={styles.acceptDeliveryBtn}
                accessibilityLabel="Accept Delivery"
              >
                {acceptingId === currentOffer._id ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Check size={17} color="#FFFFFF" strokeWidth={2.4} style={{ marginRight: 5 }} />
                    <Text style={styles.acceptDeliveryBtnText}>Accept Delivery</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Empty State when NO new offer available (Phone 3) */
          <View style={styles.emptyCardContainer}>
            <ParcelBoxIllustration />
            <Text style={styles.emptyCardTitle}>No New Offers</Text>
            <Text style={styles.emptyCardSub}>
              New delivery offers will appear here when available.
            </Text>
          </View>
        )}

        {/* ================================================================== */}
        {/* 6. TODAY'S ACTIVITY                                                */}
        {/* ================================================================== */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Today's Activity</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/orders')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.viewDetailsText}>View All &gt;</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityCardContainer}>
          {stats.recentActivity.length === 0 ? (
            <View style={styles.emptyActivityBox}>
              <CheckCircle2 size={32} color="#CBD5E1" strokeWidth={1.8} style={{ marginBottom: 6 }} />
              <Text style={styles.emptyActivityText}>No completed deliveries yet today</Text>
            </View>
          ) : (
            stats.recentActivity.slice(0, 4).map((item, idx) => (
              <TouchableOpacity
                key={item._id || idx}
                activeOpacity={0.7}
                onPress={() => router.push(`/order/${item._id}`)}
                style={[
                  styles.activityItemRow,
                  idx < Math.min(stats.recentActivity.length, 4) - 1 && styles.activityItemBorder
                ]}
              >
                {/* Left Green Check Icon */}
                <View style={styles.activityIconCircle}>
                  <CheckCircle2 size={18} color="#16A34A" strokeWidth={2.4} />
                </View>

                {/* Middle Info */}
                <View style={styles.activityMiddleCol}>
                  <Text style={styles.activityOrderNumber}>
                    #{item.orderNumber || 'ZM102275'}
                  </Text>
                  <Text style={styles.activityTimeText}>
                    Delivered • {formatDeliveredTime(item.deliveredAt)}
                  </Text>
                </View>

                {/* Right Amount & Chevron */}
                <View style={styles.activityRightRow}>
                  <Text style={styles.activityAmountText}>
                    +₹{item.riderEarnings || stats.ratePerDelivery || 30}
                  </Text>
                  <ChevronRight size={16} color="#94A3B8" strokeWidth={2} style={{ marginLeft: 4 }} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </Animated.ScrollView>

      {/* ==================================================================== */}
      {/* CONFIRMATION MODAL (DECLINING OFFER)                                 */}
      {/* ==================================================================== */}
      <ConfirmationModal
        visible={Boolean(selectedOfferToReject)}
        onClose={() => setSelectedOfferToReject(null)}
        onConfirm={handleConfirmReject}
        title="Decline Delivery Offer"
        subtitle="Please specify why you are declining this order so dispatch can reassign it."
        confirmText="Confirm Decline"
        loading={rejecting}
      />

      {/* ==================================================================== */}
      {/* QUICK NOTIFICATIONS MODAL                                            */}
      {/* ==================================================================== */}
      <Modal
        visible={showQuickNotifs}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowQuickNotifs(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowQuickNotifs(false)}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalContentCard}
            onPress={(e) => e?.stopPropagation?.()}
          >
            {/* Header */}
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Bell size={18} color="#111827" strokeWidth={2.4} style={{ marginRight: 6 }} />
                <Text style={styles.modalTitle}>Notifications</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowQuickNotifs(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* List */}
            <View style={styles.modalListContainer}>
              {notificationsList.length === 0 ? (
                <View style={styles.modalEmptyBox}>
                  <Text style={styles.modalEmptyText}>No new notifications</Text>
                </View>
              ) : (
                notificationsList.slice(0, 5).map((item) => (
                  <TouchableOpacity
                    key={item._id}
                    activeOpacity={0.7}
                    onPress={() => {
                      setShowQuickNotifs(false);
                      if (!item.isRead && item._id && !item._id.startsWith('seed_')) {
                        deliveryService.markNotificationRead(item._id).catch(() => {});
                        setNotificationsList((prev) =>
                          prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n))
                        );
                        setUnreadNotifCount((prev) => Math.max(0, prev - 1));
                      }
                      const orderId = item.data?.orderId || item.order?._id;
                      if (orderId && typeof orderId === 'string' && orderId.length > 10) {
                        router.push(`/order/${orderId}`);
                      } else {
                        router.push('/notifications');
                      }
                    }}
                    style={styles.notifRowItem}
                  >
                    <View style={styles.notifIconBox}>
                      <Bell size={16} color="#D97706" />
                      {!item.isRead && <View style={styles.unreadDot} />}
                    </View>
                    <View style={styles.notifTextCol}>
                      <Text style={styles.notifRowTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.notifRowSub} numberOfLines={1}>
                        {item.message?.replace(/\n.*/, '')}
                      </Text>
                    </View>
                    <ChevronRight size={14} color="#CBD5E1" />
                  </TouchableOpacity>
                ))
              )}
            </View>

            {/* View All Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setShowQuickNotifs(false);
                router.push('/notifications');
              }}
              style={styles.modalBottomBtn}
            >
              <Text style={styles.modalBottomBtnText}>View All Notifications</Text>
              <ChevronRight size={16} color="#111827" strokeWidth={2.4} />
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ============================================================================
// STYLES (STRICTLY NO SHADOWS - CLEAN ZOOOMIT AESTHETIC)
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },

  // --------------------------------------------------------------------------
  // STICKY HEADER
  // --------------------------------------------------------------------------
  stickyHeaderWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100
  },
  yellowHeaderContainer: {
    backgroundColor: '#FFC928',
    overflow: 'hidden'
  },
  headerInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  avatarText: {
    fontFamily: typography.family.heavy,
    fontSize: 17,
    color: '#111827'
  },
  headerMiddleCol: {
    flex: 1,
    justifyContent: 'center'
  },
  fullGreetingBox: {
    justifyContent: 'center'
  },
  greetingSmall: {
    fontFamily: typography.family.medium,
    fontSize: 12,
    color: '#374151',
    lineHeight: 14
  },
  partnerNameText: {
    fontFamily: typography.family.heavy,
    fontSize: 18,
    color: '#111827',
    letterSpacing: -0.2
  },
  partnerRoleText: {
    fontFamily: typography.family.medium,
    fontSize: 11.5,
    color: '#4B5563',
    lineHeight: 14
  },
  compactNameBox: {
    position: 'absolute',
    left: 0,
    right: 0,
    justifyContent: 'center'
  },
  compactPartnerNameText: {
    fontFamily: typography.family.heavy,
    fontSize: 16,
    color: '#111827',
    letterSpacing: -0.2
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1.5
  },
  statusPillOnline: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0'
  },
  statusPillOffline: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0'
  },
  statusPillDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5
  },
  statusPillText: {
    fontFamily: typography.family.bold,
    fontSize: 11.5
  },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  bellBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF'
  },
  bellBadgeText: {
    fontFamily: typography.family.bold,
    fontSize: 9,
    color: '#FFFFFF'
  },

  // Compact Sticky Stats Bar (Phone 2)
  compactStatsBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 9,
    paddingHorizontal: 12
  },
  compactStatItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4
  },
  compactStatValue: {
    fontFamily: typography.family.heavy,
    fontSize: 13,
    color: '#111827'
  },
  compactStatLabel: {
    fontFamily: typography.family.medium,
    fontSize: 11,
    color: '#64748B'
  },
  compactStatDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#E2E8F0'
  },

  // --------------------------------------------------------------------------
  // SCROLL CONTENT
  // --------------------------------------------------------------------------
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 110
  },

  // --------------------------------------------------------------------------
  // 1. ONLINE / OFFLINE TOGGLE CARD
  // --------------------------------------------------------------------------
  toggleCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  toggleLeftCol: {
    flex: 1,
    marginRight: 12
  },
  toggleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3
  },
  toggleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 7
  },
  toggleTitle: {
    fontFamily: typography.family.heavy,
    fontSize: 15,
    color: '#111827'
  },
  toggleSubtitle: {
    fontFamily: typography.family.medium,
    fontSize: 12,
    color: '#64748B'
  },
  switchTrack: {
    width: 52,
    height: 30,
    borderRadius: 15,
    padding: 2.5,
    justifyContent: 'center'
  },
  switchKnob: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  switchKnobOnline: {
    alignSelf: 'flex-end'
  },
  switchKnobOffline: {
    alignSelf: 'flex-start'
  },

  // --------------------------------------------------------------------------
  // 2. TODAY'S OVERVIEW (4 Stat Cards)
  // --------------------------------------------------------------------------
  overviewRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6
  },
  statCardValue: {
    fontFamily: typography.family.heavy,
    fontSize: 15.5,
    color: '#111827',
    marginBottom: 2
  },
  statCardLabel: {
    fontFamily: typography.family.medium,
    fontSize: 9.5,
    color: '#64748B',
    textAlign: 'center'
  },

  // --------------------------------------------------------------------------
  // 3. CASH TO COLLECT FROM STORE
  // --------------------------------------------------------------------------
  cashCollectCard: {
    backgroundColor: '#FFFDF5',
    borderWidth: 1.5,
    borderColor: '#FEF08A',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18
  },
  cashCollectIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  cashCollectMiddle: {
    flex: 1
  },
  cashCollectHeading: {
    fontFamily: typography.family.bold,
    fontSize: 13,
    color: '#111827',
    marginBottom: 2
  },
  cashCollectAmount: {
    fontFamily: typography.family.heavy,
    fontSize: 22,
    color: '#111827',
    letterSpacing: -0.3
  },
  cashCollectSub: {
    fontFamily: typography.family.medium,
    fontSize: 11,
    color: '#78716C',
    marginTop: 1
  },

  // --------------------------------------------------------------------------
  // SECTION HEADERS
  // --------------------------------------------------------------------------
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  sectionTitle: {
    fontFamily: typography.family.heavy,
    fontSize: 17,
    color: '#111827',
    letterSpacing: -0.2
  },
  viewDetailsText: {
    fontFamily: typography.family.bold,
    fontSize: 13,
    color: '#2563EB'
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  timerBadgeText: {
    fontFamily: typography.family.bold,
    fontSize: 11.5,
    color: '#D97706'
  },

  // --------------------------------------------------------------------------
  // 4. ACTIVE DELIVERY CARD
  // --------------------------------------------------------------------------
  activeDeliveryCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20
  },
  activeCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  orderAcceptedPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  orderAcceptedText: {
    fontFamily: typography.family.heavy,
    fontSize: 10.5,
    color: '#92400E',
    letterSpacing: 0.3
  },
  timeBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  timeBadgeText: {
    fontFamily: typography.family.medium,
    fontSize: 11,
    color: '#64748B'
  },
  activeOrderId: {
    fontFamily: typography.family.heavy,
    fontSize: 19,
    color: '#111827',
    marginBottom: 14
  },

  // Vertical Route Layout
  routeContainer: {
    marginBottom: 14
  },
  routeStepRow: {
    flexDirection: 'row'
  },
  pickupPinWrap: {
    alignItems: 'center',
    width: 20,
    marginRight: 10
  },
  pickupPinOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  pickupPinInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A'
  },
  routeVerticalLine: {
    width: 1.5,
    height: 36,
    backgroundColor: '#CBD5E1',
    marginVertical: 2
  },
  dropoffPinWrap: {
    alignItems: 'center',
    width: 20,
    marginRight: 10
  },
  dropoffPinOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center'
  },
  dropoffPinInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444'
  },
  routeDetailsCol: {
    flex: 1,
    paddingBottom: 6
  },
  routeStepLead: {
    fontFamily: typography.family.medium,
    fontSize: 10.5,
    color: '#64748B',
    marginBottom: 1
  },
  routeStoreName: {
    fontFamily: typography.family.bold,
    fontSize: 13.5,
    color: '#111827'
  },
  routeStoreAddress: {
    fontFamily: typography.family.regular,
    fontSize: 11.5,
    color: '#64748B'
  },
  routeCustomerName: {
    fontFamily: typography.family.bold,
    fontSize: 13.5,
    color: '#111827'
  },
  routeCustomerAddress: {
    fontFamily: typography.family.regular,
    fontSize: 11.5,
    color: '#64748B'
  },

  // Info Pills Row
  infoPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14
  },
  infoPillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  infoPillText: {
    fontFamily: typography.family.medium,
    fontSize: 11.5,
    color: '#475569'
  },

  // Bottom Action Row
  activeActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  viewRouteBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#FFC928',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  viewRouteBtnText: {
    fontFamily: typography.family.heavy,
    fontSize: 14,
    color: '#111827'
  },
  callIconBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center'
  },

  // Empty State Card (Phone 3)
  emptyCardContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20
  },
  illustrationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  emptyCardTitle: {
    fontFamily: typography.family.heavy,
    fontSize: 16,
    color: '#111827',
    marginBottom: 4
  },
  emptyCardSub: {
    fontFamily: typography.family.medium,
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12
  },
  goOnlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFC928',
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 12
  },
  goOnlineBtnText: {
    fontFamily: typography.family.heavy,
    fontSize: 13.5,
    color: '#111827'
  },

  // --------------------------------------------------------------------------
  // 5. NEW DELIVERY OFFER CARD
  // --------------------------------------------------------------------------
  newOfferCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20
  },
  offerCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  offerIdRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  offerTagIconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },
  offerOrderNumber: {
    fontFamily: typography.family.heavy,
    fontSize: 17,
    color: '#111827'
  },
  earningsBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FEF08A',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignItems: 'flex-end'
  },
  earningsBoxLead: {
    fontFamily: typography.family.bold,
    fontSize: 8.5,
    color: '#92400E',
    letterSpacing: 0.5
  },
  earningsBoxValue: {
    fontFamily: typography.family.heavy,
    fontSize: 15,
    color: '#111827'
  },
  offerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  declineBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  declineBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 13.5,
    color: '#EF4444'
  },
  acceptDeliveryBtn: {
    flex: 1.4,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  acceptDeliveryBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 13.5,
    color: '#FFFFFF'
  },

  // --------------------------------------------------------------------------
  // 6. TODAY'S ACTIVITY
  // --------------------------------------------------------------------------
  activityCardContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 10
  },
  emptyActivityBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24
  },
  emptyActivityText: {
    fontFamily: typography.family.medium,
    fontSize: 13,
    color: '#94A3B8'
  },
  activityItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  activityIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  activityMiddleCol: {
    flex: 1
  },
  activityOrderNumber: {
    fontFamily: typography.family.bold,
    fontSize: 13.5,
    color: '#111827',
    marginBottom: 1
  },
  activityTimeText: {
    fontFamily: typography.family.regular,
    fontSize: 11.5,
    color: '#64748B'
  },
  activityRightRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  activityAmountText: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#16A34A'
  },

  // --------------------------------------------------------------------------
  // QUICK NOTIFICATIONS MODAL
  // --------------------------------------------------------------------------
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContentCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden'
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  modalTitle: {
    fontFamily: typography.family.heavy,
    fontSize: 16,
    color: '#111827'
  },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalListContainer: {
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  modalEmptyBox: {
    paddingVertical: 20,
    alignItems: 'center'
  },
  modalEmptyText: {
    fontFamily: typography.family.medium,
    fontSize: 13,
    color: '#94A3B8'
  },
  notifRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC'
  },
  notifIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444'
  },
  notifTextCol: {
    flex: 1,
    marginRight: 8
  },
  notifRowTitle: {
    fontFamily: typography.family.bold,
    fontSize: 12.5,
    color: '#111827'
  },
  notifRowSub: {
    fontFamily: typography.family.regular,
    fontSize: 11,
    color: '#64748B'
  },
  modalBottomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  modalBottomBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 13,
    color: '#111827',
    marginRight: 4
  }
});
