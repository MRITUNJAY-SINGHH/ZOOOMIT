import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert
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
  AlertCircle
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
    activeOrder: null,
    recentActivity: []
  });
  const [availableOffers, setAvailableOffers] = useState([]);
  const [selectedOfferToReject, setSelectedOfferToReject] = useState(null);
  const [acceptingId, setAcceptingId] = useState(null);
  const [rejecting, setRejecting] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [dashData, offers] = await Promise.all([
        deliveryService.getDashboard().catch(() => ({})),
        deliveryService.getAvailableOrders().catch(() => [])
      ]);

      setStats({
        todayEarnings: dashData.todayEarnings || 0,
        todayCompleted: dashData.todayCompleted || 0,
        todayPending: dashData.todayPending || 0,
        totalDeliveries: dashData.totalDeliveries || 0,
        activeOrder: dashData.activeOrder || null,
        recentActivity: dashData.recentActivity || []
      });

      setAvailableOffers(offers || []);
    } catch (err) {
      console.warn('[Dashboard] Data fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
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
        {/* Top Partner Header */}
        <View style={styles.header}>
          <View style={styles.headerUser}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{partnerInitials}</Text>
            </View>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.partnerName} numberOfLines={1}>{partner?.name || 'Delivery Partner'}</Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => Alert.alert('Notifications', 'Push notification channel is active and synced with ZOOOMIT dispatch.')}
            style={styles.notifBtn}
          >
            <Bell size={20} color={colors.secondary} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
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
              subtitle="Base pay + tips"
              icon={Wallet}
              variant="highlight"
            />
            <DashboardStatCard
              title="Completed"
              value={String(stats.todayCompleted)}
              subtitle="Orders delivered"
              icon={CheckCircle2}
            />
          </View>
          <View style={[styles.statsGrid, { marginTop: spacing.md }]}>
            <DashboardStatCard
              title="Pending / Active"
              value={String(stats.todayPending)}
              subtitle="Orders in queue"
              icon={Clock}
            />
            <DashboardStatCard
              title="Total Deliveries"
              value={String(stats.totalDeliveries)}
              subtitle="All-time completed"
              icon={Package}
            />
          </View>
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
  }
});
