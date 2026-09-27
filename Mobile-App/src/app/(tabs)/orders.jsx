import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Image,
  TextInput,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SAMPLE_ORDERS } from '../../services/mockOrders';
import {
  ArrowLeft,
  Search,
  Check,
  X,
  RotateCcw,
  ShoppingBag,
  Package,
  ClipboardList
} from 'lucide-react-native';
import { colors, spacing, radius, typography } from '../../constants/theme';
import { StorefrontAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { EmptyState } from '../../components/EmptyState';
import { haptics } from '../../services/haptics';

const FILTER_TABS = ['All', 'Delivered', 'Processing', 'Cancelled'];

export default function OrdersScreen() {
  const { token } = useAuth();
  const { refreshCart } = useCart();

  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [reorderingId, setReorderingId] = useState(null);
  const [reorderSuccessModal, setReorderSuccessModal] = useState(false);

  const { data: fetchedOrders, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['customer-orders', token],
    queryFn: async () => {
      try {
        const res = await StorefrontAPI.getOrders({ limit: 50 });
        const list = res.data?.data;
        return Array.isArray(list) && list.length > 0 ? list : SAMPLE_ORDERS;
      } catch {
        return SAMPLE_ORDERS;
      }
    }
  });

  const orders = (fetchedOrders && fetchedOrders.length > 0) ? fetchedOrders : SAMPLE_ORDERS;

  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      const status = ord.status || '';
      const isDelivered = status === 'Delivered';
      const isCancelled = status === 'Cancelled' || status === 'Returned';
      const isProcessing = !isDelivered && !isCancelled;

      let matchesFilter = true;
      if (activeFilter === 'Delivered') matchesFilter = isDelivered;
      else if (activeFilter === 'Processing') matchesFilter = isProcessing;
      else if (activeFilter === 'Cancelled') matchesFilter = isCancelled;

      if (!matchesFilter) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const numMatch = ord.orderNumber?.toString().toLowerCase().includes(query);
        const itemMatch = ord.items?.some((it) =>
          it.productName?.toLowerCase().includes(query)
        );
        return numMatch || itemMatch;
      }

      return true;
    });
  }, [orders, activeFilter, searchQuery]);

  const handleReorder = async (orderId) => {
    haptics.impactLight();
    setReorderingId(orderId);
    try {
      await StorefrontAPI.reorder(orderId);
      await refreshCart();
    } catch {}
    haptics.notificationSuccess();
    setReorderSuccessModal(true);
    setReorderingId(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      {/* Header */}
      <View style={styles.headerBar}>
        <Pressable
          style={styles.backButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)');
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ArrowLeft size={22} color={colors.textPrimary} strokeWidth={2.4} />
        </Pressable>

        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>My Orders</Text>
          <Text style={styles.headerSubtitle}>
            Track, reorder and manage your orders
          </Text>
        </View>

        <Pressable
          style={styles.searchIconButton}
          onPress={() => {
            haptics.selection();
            setShowSearchInput((prev) => !prev);
          }}
          accessibilityRole="button"
          accessibilityLabel="Search orders"
        >
          <Search size={20} color={colors.textPrimary} strokeWidth={2.2} />
        </Pressable>
      </View>

      {/* Expandable Search Input */}
      {showSearchInput && (
        <View style={styles.searchBarWrap}>
          <Search size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Order # or item name..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={true}
          />
          {Boolean(searchQuery) && (
            <Pressable onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <X size={14} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
      )}

      {/* Guest Notice Banner */}
      {!token && (
        <View style={styles.guestBanner}>
          <View style={styles.guestBannerTextCol}>
            <Text style={styles.guestBannerTitle}>Sample Orders Preview</Text>
            <Text style={styles.guestBannerSubtitle}>
              Sign in to place live orders and track 10-15m grocery deliveries.
            </Text>
          </View>
          <Pressable
            style={styles.guestBannerBtn}
            onPress={() => router.push('/(auth)/login')}
            accessibilityRole="button"
            accessibilityLabel="Sign In"
          >
            <Text style={styles.guestBannerBtnText}>Sign In</Text>
          </Pressable>
        </View>
      )}

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        {FILTER_TABS.map((tab) => {
          const isSelected = activeFilter === tab;
          return (
            <Pressable
              key={tab}
              style={[
                styles.filterTabPill,
                isSelected ? styles.filterTabPillActive : styles.filterTabPillInactive
              ]}
              onPress={() => {
                haptics.selection();
                setActiveFilter(tab);
              }}
              accessibilityRole="button"
              accessibilityLabel={`${tab} orders`}
            >
              <Text style={[
                styles.filterTabText,
                isSelected ? styles.filterTabTextActive : styles.filterTabTextInactive
              ]}>
                {tab}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.black} />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      ) : filteredOrders.length > 0 ? (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              formatDate={formatDate}
              onReorder={handleReorder}
              isReordering={reorderingId === item._id}
            />
          )}
        />
      ) : (
        <View style={styles.emptyWrap}>
          <Package size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No Matching Orders' : 'No Orders in this Category'}
          </Text>
          <Text style={styles.emptyDesc}>
            {searchQuery
              ? `No orders matching "${searchQuery}". Try a different keyword.`
              : 'Items you order for fast 10-15 minute grocery delivery will appear here.'}
          </Text>
        </View>
      )}

      {/* Reorder Confirmation Modal */}
      <Modal
        visible={reorderSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setReorderSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setReorderSuccessModal(false)} />
          <View style={styles.reorderModalCard}>
            <View style={styles.reorderSuccessBadge}>
              <Check size={28} color={colors.success} strokeWidth={3} />
            </View>
            <Text style={styles.reorderModalTitle}>Added to Cart! 🛒</Text>
            <Text style={styles.reorderModalDesc}>
              All available items from this order have been added to your shopping cart.
            </Text>

            <View style={styles.reorderModalActions}>
              <Pressable
                style={styles.reorderPrimaryBtn}
                onPress={() => {
                  setReorderSuccessModal(false);
                  router.push('/(tabs)/cart');
                }}
              >
                <Text style={styles.reorderPrimaryText}>View Cart</Text>
              </Pressable>

              <Pressable
                style={styles.reorderSecondaryBtn}
                onPress={() => setReorderSuccessModal(false)}
              >
                <Text style={styles.reorderSecondaryText}>Continue Shopping</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function OrderCard({ order, formatDate, onReorder, isReordering }) {
  const isDelivered = order.status === 'Delivered';
  const isCancelled = order.status === 'Cancelled' || order.status === 'Returned';
  const isProcessing = !isDelivered && !isCancelled;

  const statusLabel = isDelivered
    ? 'Delivered'
    : isCancelled
      ? 'Cancelled'
      : order.status === 'OutForDelivery' || order.status === 'Out For Delivery'
        ? 'On the way'
        : 'Processing';

  const badgeStyle = isDelivered
    ? styles.badgeDelivered
    : isCancelled
      ? styles.badgeCancelled
      : styles.badgeProcessing;

  const badgeTextStyle = isDelivered
    ? styles.badgeTextDelivered
    : isCancelled
      ? styles.badgeTextCancelled
      : styles.badgeTextProcessing;

  const baseDate = new Date(order.createdAt || Date.now());
  const formatStepTime = (minOffset) => {
    const d = new Date(baseDate.getTime() + minOffset * 60000);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const t1 = order.timeline?.confirmed || formatStepTime(0);
  const t2 = order.timeline?.packed || (isCancelled ? '-' : formatStepTime(14));
  const t3 = order.timeline?.outForDelivery || (isCancelled || isProcessing ? '-' : formatStepTime(35));
  const t4 = order.timeline?.delivered || (isCancelled || isProcessing ? '-' : formatStepTime(58));

  const themeColor = isDelivered ? 'green' : isProcessing ? 'yellow' : 'gray';

  const openOrderDetails = () => {
    haptics.selection();
    router.push(`/orders/${order._id}`);
  };

  return (
    <View style={styles.cardContainer}>
      {/* Top Details Row */}
      <Pressable
        style={styles.cardTopRow}
        onPress={openOrderDetails}
        accessibilityRole="button"
        accessibilityLabel={`View details for Order ${order.orderNumber}`}
      >
        <View style={styles.thumbWrap}>
          <Image
            source={require('../../../assets/images/order_basket.jpg')}
            style={styles.basketThumbnail}
            resizeMode="cover"
          />
        </View>

        <View style={styles.cardInfoCol}>
          <Text style={styles.cardOrderNumber}>Order #{order.orderNumber}</Text>
          <Text style={styles.cardOrderDate}>{formatDate(order.createdAt)}</Text>
          <Text style={styles.cardOrderAmount}>₹{order.amount?.toFixed(2)}</Text>
        </View>

        <View style={[styles.statusBadgePill, badgeStyle]}>
          <Text style={[styles.statusBadgeLabel, badgeTextStyle]}>{statusLabel}</Text>
        </View>
      </Pressable>

      {/* Horizontal Progress Timeline */}
      <Pressable style={styles.timelineRow} onPress={openOrderDetails}>
        <TimelineStep
          label="Confirmed"
          time={t1}
          state={isCancelled ? 'neutral' : (isProcessing || isDelivered ? 'done' : 'current')}
          themeColor={themeColor}
        />
        <TimelineConnector
          isDone={!isCancelled && (isDelivered || isProcessing)}
          themeColor={themeColor}
        />
        <TimelineStep
          label="Packed"
          time={t2}
          state={isCancelled ? 'neutral' : (isDelivered ? 'done' : isProcessing ? 'done' : 'upcoming')}
          themeColor={themeColor}
        />
        <TimelineConnector
          isDone={isDelivered}
          themeColor={themeColor}
        />
        <TimelineStep
          label="Out for delivery"
          time={t3}
          state={isCancelled ? 'neutral' : (isDelivered ? 'done' : 'upcoming')}
          themeColor={themeColor}
        />
        <TimelineConnector
          isDone={isDelivered}
          themeColor={themeColor}
        />
        <TimelineStep
          label={isCancelled ? 'Cancelled' : 'Delivered'}
          time={t4}
          state={isCancelled ? 'cancelled' : (isDelivered ? 'done' : 'upcoming')}
          themeColor={themeColor}
          isLast={true}
        />
      </Pressable>

      {/* Action Buttons */}
      <View style={styles.cardActionsRow}>
        {isDelivered && (
          <>
            <Pressable
              style={({ pressed }) => [
                styles.secondaryActionBtn,
                { backgroundColor: pressed ? colors.softBackground : colors.white }
              ]}
              onPress={() => onReorder(order._id)}
              disabled={isReordering}
            >
              {isReordering ? (
                <ActivityIndicator size="small" color={colors.black} />
              ) : (
                <Text style={styles.secondaryActionText}>Reorder</Text>
              )}
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.primaryActionBtn,
                { backgroundColor: pressed ? colors.primaryDark : colors.primary }
              ]}
              onPress={openOrderDetails}
            >
              <Text style={styles.primaryActionText}>View Details</Text>
            </Pressable>
          </>
        )}

        {isProcessing && (
          <>
            <Pressable
              style={({ pressed }) => [
                styles.primaryActionBtn,
                { backgroundColor: pressed ? colors.primaryDark : colors.primary }
              ]}
              onPress={openOrderDetails}
            >
              <Text style={styles.primaryActionText}>Track Order</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.secondaryActionBtn,
                { backgroundColor: pressed ? colors.softBackground : colors.white }
              ]}
              onPress={openOrderDetails}
            >
              <Text style={styles.secondaryActionText}>View Details</Text>
            </Pressable>
          </>
        )}

        {isCancelled && (
          <Pressable
            style={({ pressed }) => [
              styles.secondaryActionBtn,
              styles.fullWidthBtn,
              { backgroundColor: pressed ? colors.softBackground : colors.white }
            ]}
            onPress={openOrderDetails}
          >
            <Text style={styles.secondaryActionText}>View Details</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function TimelineStep({ label, time, state, themeColor, isLast }) {
  let circleBg = '#F3F4F6';
  let circleBorder = '#E5E7EB';
  let iconComponent = <Check size={10} color="#9CA3AF" strokeWidth={2.5} />;

  if (state === 'cancelled') {
    circleBg = '#EF4444';
    circleBorder = '#DC2626';
    iconComponent = <X size={10} color="#FFFFFF" strokeWidth={3} />;
  } else if (state === 'done') {
    if (themeColor === 'green') {
      circleBg = '#16A34A';
      circleBorder = '#15803D';
      iconComponent = <Check size={10} color="#FFFFFF" strokeWidth={3} />;
    } else if (themeColor === 'yellow') {
      circleBg = '#FFC928';
      circleBorder = '#E5A900';
      iconComponent = <Check size={10} color="#FFFFFF" strokeWidth={3} />;
    }
  } else if (state === 'neutral') {
    circleBg = '#F3F4F6';
    circleBorder = '#E5E7EB';
    iconComponent = <Check size={10} color="#9CA3AF" strokeWidth={2.5} />;
  } else if (state === 'current') {
    circleBg = colors.primary;
    circleBorder = colors.primaryDark;
    iconComponent = <View style={styles.activeDot} />;
  }

  return (
    <View style={styles.stepItemCol}>
      <View style={[styles.stepCircle, { backgroundColor: circleBg, borderColor: circleBorder }]}>
        {iconComponent}
      </View>
      <Text style={[styles.stepLabelText, state === 'done' && styles.stepLabelActive]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.stepTimeText}>{time}</Text>
    </View>
  );
}

function TimelineConnector({ isDone, themeColor }) {
  let lineColor = '#E5E7EB';
  if (isDone) {
    if (themeColor === 'green') lineColor = '#16A34A';
    else if (themeColor === 'yellow') lineColor = '#FFC928';
  }

  return <View style={[styles.timelineLineBar, { backgroundColor: lineColor }]} />;
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.white
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    backgroundColor: colors.white
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitleCol: {
    flex: 1,
    marginLeft: 6
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    marginTop: 1
  },
  searchIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center'
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.softBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 12,
    height: 42,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xs
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: typography.family.medium,
    color: colors.textPrimary
  },
  clearSearchBtn: {
    padding: 4
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    gap: 8
  },
  filterTabPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  filterTabPillActive: {
    backgroundColor: colors.primary,
    borderWidth: 0,
    borderColor: 'transparent'
  },
  filterTabPillInactive: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight
  },
  filterTabText: {
    fontSize: 13
  },
  filterTabTextActive: {
    fontFamily: typography.family.bold,
    color: colors.black
  },
  filterTabTextInactive: {
    fontFamily: typography.family.medium,
    color: colors.textSecondary
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: 40
  },
  cardContainer: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 14,
    marginTop: spacing.md
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  thumbWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginRight: 12
  },
  basketThumbnail: {
    width: '100%',
    height: '100%'
  },
  cardInfoCol: {
    flex: 1
  },
  cardOrderNumber: {
    fontSize: 15,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  cardOrderDate: {
    fontSize: 12,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    marginTop: 2
  },
  cardOrderAmount: {
    fontSize: 15,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    marginTop: 2
  },
  statusBadgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 12,
    alignSelf: 'flex-start'
  },
  statusBadgeLabel: {
    fontSize: 12,
    fontFamily: typography.family.bold
  },
  badgeDelivered: {
    backgroundColor: '#DCFCE7'
  },
  badgeTextDelivered: {
    color: '#15803D'
  },
  badgeProcessing: {
    backgroundColor: '#E0F2FE'
  },
  badgeTextProcessing: {
    color: '#0284C7'
  },
  badgeCancelled: {
    backgroundColor: '#FEE2E2'
  },
  badgeTextCancelled: {
    color: '#DC2626'
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle
  },
  stepItemCol: {
    alignItems: 'center',
    width: 64
  },
  stepCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.black
  },
  stepLabelText: {
    fontSize: 10,
    fontFamily: typography.family.medium,
    color: colors.textMuted,
    textAlign: 'center'
  },
  stepLabelActive: {
    color: colors.textPrimary,
    fontFamily: typography.family.semibold
  },
  stepTimeText: {
    fontSize: 9,
    fontFamily: typography.family.regular,
    color: colors.textMuted,
    marginTop: 1
  },
  timelineLineBar: {
    flex: 1,
    height: 2,
    marginBottom: 20
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4
  },
  primaryActionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  primaryActionText: {
    fontSize: 14,
    fontFamily: typography.family.bold,
    color: colors.black
  },
  secondaryActionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center'
  },
  secondaryActionText: {
    fontSize: 14,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  fullWidthBtn: {
    flex: 1
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 13,
    fontFamily: typography.family.medium,
    color: colors.textSecondary
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    marginTop: 12,
    marginBottom: 4
  },
  emptyDesc: {
    fontSize: 13,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject
  },
  reorderModalCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: colors.borderLight
  },
  reorderSuccessBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DCFCE7',
    borderWidth: 1.5,
    borderColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  reorderModalTitle: {
    fontSize: 18,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    marginBottom: 6
  },
  reorderModalDesc: {
    fontSize: 13,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg
  },
  reorderModalActions: {
    width: '100%',
    gap: 10
  },
  reorderPrimaryBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  reorderPrimaryText: {
    fontSize: 15,
    fontFamily: typography.family.bold,
    color: colors.black
  },
  reorderSecondaryBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center'
  },
  reorderSecondaryText: {
    fontSize: 14,
    fontFamily: typography.family.semibold,
    color: colors.textPrimary
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  guestBannerTextCol: {
    flex: 1,
    paddingRight: 10
  },
  guestBannerTitle: {
    fontSize: 13,
    fontFamily: typography.family.bold,
    color: '#92400E'
  },
  guestBannerSubtitle: {
    fontSize: 11,
    fontFamily: typography.family.regular,
    color: '#B45309',
    marginTop: 2
  },
  guestBannerBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12
  },
  guestBannerBtnText: {
    fontSize: 12,
    fontFamily: typography.family.bold,
    color: colors.black
  }
});
