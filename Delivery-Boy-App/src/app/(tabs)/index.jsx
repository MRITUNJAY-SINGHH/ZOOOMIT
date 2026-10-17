import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Wallet,
  CheckCircle2,
  Clock,
  Package,
  Bell,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Megaphone,
  Star,
  Store,
  Coins
} from 'lucide-react-native';
import { colors, typography, radius, spacing } from '../../constants/theme';
import {
  OnlineStatusToggle,
  DashboardStatCard,
  IncomingOrderCard,
  ConfirmationModal,
  EmptyState,
  StatusBadge
} from '../../components';
import { useAuth } from '../../context/AuthContext';
import { deliveryService } from '../../services/deliveryService';
import { hapticFeedback } from '../../services/haptics';

export default function DashboardScreen() {
  const router = useRouter();
  const { partner, isOnline } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  // Notifications State
  const [notificationsList, setNotificationsList] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(5);
  const [showQuickNotifs, setShowQuickNotifs] = useState(false);

  const fetchDashboardData = async () => {
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

      setAvailableOffers(offers || []);

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
  };

  const getRelativeTime = (dateStr) => {
    if (!dateStr) return '2 min ago';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Yesterday';
  };

  const renderQuickIcon = (type) => {
    switch (type) {
      case 'New Order Available':
      case 'New Order':
        return (
          <View style={[styles.quickIconBox, { backgroundColor: '#FEF3C7' }]}>
            <Bell size={18} color="#D97706" strokeWidth={2.2} />
          </View>
        );
      case 'Order Accepted':
      case 'Order Delivered':
        return (
          <View style={[styles.quickIconBox, { backgroundColor: '#DCFCE7' }]}>
            <CheckCircle2 size={18} color="#16A34A" strokeWidth={2.2} />
          </View>
        );
      case 'Payment Received':
      case 'Earning Recorded':
      case 'Store Cash Settlement':
        return (
          <View style={[styles.quickIconBox, { backgroundColor: '#DCFCE7' }]}>
            <Coins size={18} color="#16A34A" strokeWidth={2.2} />
          </View>
        );
      case 'New Incentive':
      case 'Incentive':
        return (
          <View style={[styles.quickIconBox, { backgroundColor: '#FFEDD5' }]}>
            <Megaphone size={18} color="#EA580C" strokeWidth={2.2} />
          </View>
        );
      case 'Order Cancelled':
        return (
          <View style={[styles.quickIconBox, { backgroundColor: '#FEE2E2' }]}>
            <Bell size={20} color="#DC2626" strokeWidth={2.2} />
          </View>
        );
      case 'High Rating Received':
      case 'Rating':
        return (
          <View style={[styles.quickIconBox, { backgroundColor: '#F3E8FF' }]}>
            <Star size={18} color="#9333EA" fill="#9333EA" strokeWidth={1.5} />
          </View>
        );
      default:
        return (
          <View style={[styles.quickIconBox, { backgroundColor: '#E0F2FE' }]}>
            <Bell size={18} color="#0284C7" strokeWidth={2.2} />
          </View>
        );
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Section 11: Atomic Order Acceptance
  const handleAcceptOrder = async (order) => {
    setAcceptingId(order._id);
    hapticFeedback.medium();

    try {
      const res = await deliveryService.acceptOrder(order._id);
      hapticFeedback.success();

      // Remove from available offers
      setAvailableOffers((prev) => prev.filter((o) => o._id !== order._id));

      Alert.alert(
        'Delivery Assigned! 🛵',
        'You have successfully claimed this order. Navigating to pickup details.',
        [{ text: 'View Order', onPress: () => router.push(`/order/${order._id}`) }]
      );

      fetchDashboardData();
    } catch (err) {
      hapticFeedback.error();
      if (err.response?.status === 409) {
        // Critical Rule 11: Conflict response handled gracefully
        Alert.alert(
          'Order Claimed by Another Partner',
          err.response.data?.message || 'Another partner already accepted this order. The offer has been refreshed.'
        );
        setAvailableOffers((prev) => prev.filter((o) => o._id !== order._id));
      } else {
        Alert.alert('Unable to Accept', err.response?.data?.message || err.message);
      }
    } finally {
      setAcceptingId(null);
    }
  };

  const handleConfirmReject = async ({ reason, details }) => {
    if (!selectedOfferToReject) return;
    setRejecting(true);
    try {
      await deliveryService.rejectOrder(selectedOfferToReject._id, `${reason} - ${details}`);
      setAvailableOffers((prev) => prev.filter((o) => o._id !== selectedOfferToReject._id));
      setSelectedOfferToReject(null);
      hapticFeedback.light();
    } catch (err) {
      Alert.alert('Decline Error', err.response?.data?.message || 'Could not decline offer.');
    } finally {
      setRejecting(false);
    }
  };

  const partnerInitials = partner?.name
    ? partner.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'ZP';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primaryDark]} />}
      >
        {/* Top Partner Header (Screen 1) */}
        <View style={styles.header}>
          <View style={styles.headerUser}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{partnerInitials}</Text>
            </View>
            <View>
              <Text style={styles.welcomeText}>Hello,</Text>
              <Text style={styles.partnerName} numberOfLines={1}>
                {partner?.name || 'Rahul Sharma'}
              </Text>
              <Text style={styles.partnerRoleText}>Delivery Partner</Text>
            </View>
          </View>

          <View style={styles.headerRightGroup}>
            <View style={styles.headerOnlinePill}>
              <View style={[styles.onlineDot, { backgroundColor: isOnline ? '#16A34A' : '#94A3B8' }]} />
              <Text style={styles.onlinePillText}>{isOnline ? 'Online' : 'Offline'}</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                hapticFeedback.light?.();
                setShowQuickNotifs(true);
              }}
              style={styles.notifBtn}
              accessibilityLabel="Notifications"
            >
              <Bell size={20} color="#111827" strokeWidth={2} />
              {unreadNotifCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>
                    {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Online/Offline Interactive Toggle */}
        <OnlineStatusToggle style={styles.onlineToggle} />

        {/* Active Ongoing Order Banner (if in progress) */}
        {stats.activeOrder && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push(`/order/${stats.activeOrder._id}`)}
            style={styles.activeOrderBanner}
          >
            <View style={styles.activeBannerTop}>
              <View style={styles.activePulseRow}>
                <View style={styles.greenPulse} />
                <Text style={styles.activeBannerLabel}>ACTIVE DELIVERY IN PROGRESS</Text>
              </View>
              <StatusBadge status={stats.activeOrder.status} />
            </View>
            <Text style={styles.activeOrderNumber}>#{stats.activeOrder.orderNumber}</Text>
            <View style={styles.activeBannerBottom}>
              <Text style={styles.activeCustomerName}>
                Deliver to: {stats.activeOrder.customer?.name || stats.activeOrder.shippingAddress?.contactName || 'Customer'}
              </Text>
              <View style={styles.resumeRow}>
                <Text style={styles.resumeText}>Resume Step</Text>
                <ArrowRight size={14} color={colors.secondary} />
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* New Order Available Highlight Cards */}
        {isOnline && availableOffers.length > 0 && (
          <View style={styles.offersSection}>
            <Text style={styles.sectionHeading}>
              High-Priority Offers ({availableOffers.length})
            </Text>
            {availableOffers.map((offer) => (
              <IncomingOrderCard
                key={offer._id}
                order={offer}
                onAccept={handleAcceptOrder}
                onReject={(o) => setSelectedOfferToReject(o)}
                accepting={acceptingId === offer._id}
                rejecting={rejecting && selectedOfferToReject?._id === offer._id}
              />
            ))}
          </View>
        )}

        {/* Dashboard Statistics Grid */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionHeading}>Today's Overview</Text>
          <View style={styles.statsGrid}>
            <DashboardStatCard
              title="Today's Earnings"
              value={`₹${stats.todayEarnings}`}
              subtitle={stats.ratePerDelivery ? `₹${stats.ratePerDelivery}/order • Store cash` : 'Store cash settlement'}
              icon={Coins}
              variant="highlight"
              onPress={() => router.push('/(tabs)/earnings')}
            />
            <DashboardStatCard
              title="Completed"
              value={String(stats.todayCompleted)}
              subtitle="Orders delivered"
              icon={CheckCircle2}
              onPress={() => router.push('/(tabs)/orders')}
            />
          </View>
          <View style={[styles.statsGrid, { marginTop: spacing.md }]}>
            <DashboardStatCard
              title="Pending / Active"
              value={String(stats.todayPending)}
              subtitle="Orders in queue"
              icon={Clock}
              onPress={() => router.push('/(tabs)/orders')}
            />
            <DashboardStatCard
              title="Total Deliveries"
              value={String(stats.totalDeliveries)}
              subtitle="All-time completed"
              icon={Package}
              onPress={() => router.push('/(tabs)/orders')}
            />
          </View>

          {/* Compact Cash to Collect Summary Banner */}
          {stats.cashToCollect > 0 && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push('/(tabs)/earnings')}
              style={styles.cashCollectBanner}
            >
              <View style={styles.cashCollectIconCircle}>
                <Store size={20} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cashCollectTitle}>Cash to Collect from Store</Text>
                <Text style={styles.cashCollectSub}>
                  ₹{stats.cashToCollect} awaiting counter collection ({stats.settlementStatus || 'Awaiting Collection'})
                </Text>
              </View>
              <ArrowRight size={16} color="#D97706" />
            </TouchableOpacity>
          )}
        </View>

        {/* Offline Alert when partner is offline */}
        {!isOnline && (
          <View style={styles.offlineCard}>
            <AlertCircle size={22} color="#854D0E" style={{ marginRight: spacing.sm }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.offlineTitle}>You are currently Offline</Text>
              <Text style={styles.offlineSubtitle}>
                Switch your status to Online above to start receiving new delivery orders in your zone.
              </Text>
            </View>
          </View>
        )}

        {/* Recent Activity List */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionHeading}>Recent Completed Orders</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {stats.recentActivity.length === 0 ? (
            <EmptyState
              type="orders"
              title="No recent deliveries"
              message="Your completed orders for today will appear here as you finish deliveries."
            />
          ) : (
            stats.recentActivity.map((item) => (
              <TouchableOpacity
                key={item._id}
                activeOpacity={0.7}
                onPress={() => router.push(`/order/${item._id}`)}
                style={styles.recentCard}
              >
                <View style={styles.recentLeft}>
                  <View style={styles.recentIconBox}>
                    <CheckCircle2 size={18} color={colors.success} />
                  </View>
                  <View>
                    <Text style={styles.recentOrderNum}>#{item.orderNumber}</Text>
                    <Text style={styles.recentTime}>
                      {item.deliveredAt
                        ? new Date(item.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Completed'}
                    </Text>
                  </View>
                </View>
                <View style={styles.recentRight}>
                  <Text style={styles.recentPay}>+₹45</Text>
                  <Text style={styles.recentDeliveredTag}>Delivered</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Confirmation Modal for declining offer */}
      <ConfirmationModal
        visible={Boolean(selectedOfferToReject)}
        onClose={() => setSelectedOfferToReject(null)}
        onConfirm={handleConfirmReject}
        title="Decline Delivery Offer"
        subtitle="Please specify why you are declining this order so dispatch can reassign it."
        confirmText="Confirm Decline"
        loading={rejecting}
      />

      {/* Quick Notifications Popup Modal (Screen 1) */}
      <Modal
        visible={showQuickNotifs}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowQuickNotifs(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowQuickNotifs(false)}
          style={styles.quickModalOverlay}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.quickCardContainer}
            onPress={(e) => e?.stopPropagation?.()}
          >
            {/* Header */}
            <View style={styles.quickHeaderRow}>
              <Text style={styles.quickHeaderTitle}>Quick Notifications</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setShowQuickNotifs(false);
                  router.push('/notifications');
                }}
              >
                <Text style={styles.quickViewAllLink}>View All</Text>
              </TouchableOpacity>
            </View>

            {/* List */}
            <View style={styles.quickItemsList}>
              {notificationsList.length === 0 ? (
                <View style={styles.quickEmptyBox}>
                  <Text style={styles.quickEmptyText}>No new notifications</Text>
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
                    style={styles.quickItemRow}
                  >
                    <View style={styles.quickIconWrap}>
                      {renderQuickIcon(item.type)}
                      {!item.isRead && <View style={styles.quickRedDot} />}
                    </View>

                    <View style={styles.quickTextCol}>
                      <Text style={styles.quickItemTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.quickItemSub} numberOfLines={1}>
                        {item.message.replace(/\n.*/, '')}
                      </Text>
                    </View>

                    <View style={styles.quickRightCol}>
                      <Text style={styles.quickTimeText}>
                        {getRelativeTime(item.createdAt)}
                      </Text>
                      <ChevronRight size={14} color="#94A3B8" />
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>

            {/* Bottom Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setShowQuickNotifs(false);
                router.push('/notifications');
              }}
              style={styles.quickBottomBtn}
            >
              <Text style={styles.quickBottomBtnText}>View All Notifications</Text>
              <ChevronRight size={16} color="#111827" strokeWidth={2.4} />
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.softBackground
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl']
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  headerUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm
  },
  avatarText: {
    fontFamily: typography.family.heavy,
    fontSize: typography.size.md,
    color: colors.secondary
  },
  welcomeText: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.xs,
    color: colors.textSecondary
  },
  partnerName: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.md,
    color: colors.textPrimary
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryDark
  },
  onlineToggle: {
    marginBottom: spacing.lg
  },
  activeOrderBanner: {
    backgroundColor: colors.primarySoft,
    borderWidth: 2,
    borderColor: colors.primaryDark,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg
  },
  activeBannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  activePulseRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  greenPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: 6
  },
  activeBannerLabel: {
    fontFamily: typography.family.bold,
    fontSize: 10,
    color: '#854D0E',
    letterSpacing: 0.5
  },
  activeOrderNumber: {
    fontFamily: typography.family.heavy,
    fontSize: typography.size.xl,
    color: colors.secondary,
    marginVertical: 2
  },
  activeBannerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.primaryLight
  },
  activeCustomerName: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.xs,
    color: colors.textPrimary,
    flex: 1
  },
  resumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm
  },
  resumeText: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    color: colors.secondary,
    marginRight: 4
  },
  offersSection: {
    marginBottom: spacing.md
  },
  sectionHeading: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.md,
    color: colors.textPrimary,
    marginBottom: spacing.sm
  },
  statsSection: {
    marginBottom: spacing.lg
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md
  },
  offlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningSubtle,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg
  },
  offlineTitle: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    color: '#854D0E'
  },
  offlineSubtitle: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: '#A16207',
    marginTop: 2
  },
  recentSection: {
    marginBottom: spacing.lg
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  viewAllText: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    color: colors.secondary
  },
  recentCard: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  recentLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  recentIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.successSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm
  },
  recentOrderNum: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    color: colors.textPrimary
  },
  recentTime: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textMuted
  },
  recentRight: {
    alignItems: 'flex-end'
  },
  recentPay: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    color: colors.success
  },
  recentDeliveredTag: {
    fontFamily: typography.family.regular,
    fontSize: 10,
    color: colors.textMuted
  },

  // Screen 1 Header Additions
  partnerRoleText: {
    fontFamily: typography.family.medium,
    fontSize: 11,
    color: '#64748B',
    marginTop: 1
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  headerOnlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 6
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4
  },
  onlinePillText: {
    fontFamily: typography.family.bold,
    fontSize: 12,
    color: '#15803D'
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF'
  },
  notifBadgeText: {
    fontFamily: typography.family.bold,
    fontSize: 9.5,
    color: '#FFFFFF'
  },

  // Screen 1: Quick Notifications Card Overlay
  quickModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16
  },
  quickCardContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 18
  },
  quickHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  quickHeaderTitle: {
    fontFamily: typography.family.bold,
    fontSize: 16,
    color: '#111827'
  },
  quickViewAllLink: {
    fontFamily: typography.family.bold,
    fontSize: 13,
    color: '#2563EB'
  },
  quickItemsList: {
    gap: 10,
    marginBottom: 16
  },
  quickItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  quickIconWrap: {
    position: 'relative',
    marginRight: 10
  },
  quickIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  quickRedDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#FFFFFF'
  },
  quickTextCol: {
    flex: 1,
    marginRight: 8
  },
  quickItemTitle: {
    fontFamily: typography.family.bold,
    fontSize: 13,
    color: '#111827'
  },
  quickItemSub: {
    fontFamily: typography.family.regular,
    fontSize: 11,
    color: '#64748B',
    marginTop: 1
  },
  quickRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  quickTimeText: {
    fontFamily: typography.family.regular,
    fontSize: 10.5,
    color: '#94A3B8',
    marginBottom: 2
  },
  quickBottomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFC928',
    borderRadius: 14,
    height: 48,
    gap: 6
  },
  quickBottomBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#111827'
  },
  quickEmptyBox: {
    paddingVertical: 20,
    alignItems: 'center'
  },
  quickEmptyText: {
    fontFamily: typography.family.regular,
    fontSize: 13,
    color: '#94A3B8'
  },
  cashCollectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    padding: 14,
    marginTop: 12
  },
  cashCollectIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  cashCollectTitle: {
    fontFamily: typography.family.bold,
    fontSize: 13,
    color: '#92400E'
  },
  cashCollectSub: {
    fontFamily: typography.family.regular,
    fontSize: 11.5,
    color: '#B45309',
    marginTop: 2
  }
});
