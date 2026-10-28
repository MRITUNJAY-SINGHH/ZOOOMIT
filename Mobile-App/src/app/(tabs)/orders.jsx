import React, { useState, useMemo, useRef } from 'react';
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
  Modal,
  Animated,
  ScrollView,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
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
import { SAMPLE_ORDERS } from '../../services/mockOrders';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { EmptyState } from '../../components/EmptyState';
import { haptics } from '../../services/haptics';
import { useTabBarVisibility } from '../../context/TabBarVisibilityContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FILTER_TABS = ['All', 'Delivered', 'Processing', 'Cancelled'];

export default function OrdersScreen() {
  const { token } = useAuth();
  const { refreshCart } = useCart();
  const { onScrollHandler } = useTabBarVisibility();

  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [reorderingId, setReorderingId] = useState(null);
  const [reorderSuccessModal, setReorderSuccessModal] = useState(false);

  const searchAnim = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef(null);

  const { data: fetchedOrders, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['customer-orders', token],
    queryFn: async () => {
      try {
        const res = await StorefrontAPI.getOrders({ limit: 50 });
        const raw = res?.data;
        const list = Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.orders)
          ? raw.orders
          : [];
        if (list.length > 0) return list;
      } catch (err) {
        console.warn('Storefront getOrders failed, using sample orders:', err?.message || err);
      }
      return SAMPLE_ORDERS;
    }
  });

  const orders = fetchedOrders || [];

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

  const openSearch = () => {
    haptics.selection();
    setIsSearchOpen(true);
    Animated.spring(searchAnim, {
      toValue: 1,
      friction: 8,
      tension: 65,
      useNativeDriver: false
    }).start(() => {
      searchInputRef.current?.focus();
    });
  };

  const closeSearch = () => {
    haptics.selection();
    setSearchQuery('');
    Animated.timing(searchAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false
    }).start(() => {
      setIsSearchOpen(false);
    });
  };

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
      <View style={styles.headerBar}>
        <Pressable
          style={styles.backButton}
          onPress={() => {
            haptics.selection();
            if (isSearchOpen) {
              closeSearch();
            } else if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)');
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ArrowLeft size={20} color={colors.textPrimary} strokeWidth={2.4} />
        </Pressable>

        {!isSearchOpen ? (
          <>
            <View style={styles.headerTitleCol}>
              <Text style={styles.headerTitle}>My Orders</Text>
            </View>

            <Pressable
              style={styles.searchIconButton}
              onPress={openSearch}
              accessibilityRole="button"
              accessibilityLabel="Search orders"
            >
              <Search size={18} color={colors.textPrimary} strokeWidth={2.2} />
            </Pressable>
          </>
        ) : (
          <Animated.View
            style={[
              styles.animatedSearchWrap,
              {
                opacity: searchAnim,
                transform: [
                  {
                    translateX: searchAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0]
                    })
                  }
                ]
              }
            ]}
          >
            <View style={styles.searchInputCapsule}>
              <Search size={16} color="#64748B" style={{ marginRight: 8 }} />
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Search by Order # or item name..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {Boolean(searchQuery) && (
                <Pressable onPress={() => setSearchQuery('')} style={styles.clearSearchBtn} hitSlop={8}>
                  <X size={14} color="#64748B" />
                </Pressable>
              )}
            </View>

            <Pressable onPress={closeSearch} style={styles.cancelSearchBtn} hitSlop={8}>
              <Text style={styles.cancelSearchText}>Cancel</Text>
            </Pressable>
          </Animated.View>
        )}
      </View>

      {!token && (
        <View style={styles.guestBanner}>
          <View style={styles.guestBannerTextCol}>
            <Text style={styles.guestBannerTitle}>Track Your Orders</Text>
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

      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
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
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      ) : filteredOrders.length > 0 ? (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item, index) => item._id || item.id || item.orderNumber || String(index)}
          onScroll={onScrollHandler}
          scrollEventThrottle={16}
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
          <Text style={styles.cardOrderNumber} numberOfLines={1}>Order #{order.orderNumber}</Text>
          <Text style={styles.cardOrderDate} numberOfLines={1}>{formatDate(order.createdAt)}</Text>
          <Text style={styles.cardOrderAmount}>₹{(Number(order.amount ?? order.total ?? order.grandTotal ?? 0)).toFixed(2)}</Text>
        </View>

        <View style={[styles.statusBadgePill, badgeStyle]}>
          <Text style={[styles.statusBadgeLabel, badgeTextStyle]}>{statusLabel}</Text>
        </View>
      </Pressable>

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
        />
      </Pressable>

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
                <ActivityIndicator size="small" color={colors.textPrimary} />
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
                styles.secondaryActionBtn,
                { backgroundColor: pressed ? colors.softBackground : colors.white }
              ]}
              onPress={openOrderDetails}
            >
              <Text style={styles.secondaryActionText}>Track Order</Text>
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

        {isCancelled && (
          <Pressable
            style={({ pressed }) => [
              styles.primaryActionBtn,
              styles.fullWidthBtn,
              { backgroundColor: pressed ? colors.primaryDark : colors.primary }
            ]}
            onPress={openOrderDetails}
          >
            <Text style={styles.primaryActionText}>View Details</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function TimelineStep({ label, time, state, themeColor }) {
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
      <Text style={styles.stepTimeText} numberOfLines={1}>{time}</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.softBackground,
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  headerTitleCol: {
    flex: 1,
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    fontWeight: '800',
    letterSpacing: -0.3
  },
  searchIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.softBackground,
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center'
  },
  animatedSearchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  searchInputCapsule: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 40
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: typography.family.medium,
    color: '#0F172A',
    paddingVertical: 0
  },
  clearSearchBtn: {
    padding: 4
  },
  cancelSearchBtn: {
    paddingHorizontal: 6,
    paddingVertical: 6
  },
  cancelSearchText: {
    fontFamily: typography.family.bold,
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7'
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.softBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingHorizontal: 14,
    paddingVertical: spacing.sm
  },
  guestBannerTextCol: {
    flex: 1,
    marginRight: 12
  },
  guestBannerTitle: {
    fontSize: 13,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  guestBannerSubtitle: {
    fontSize: 11,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    marginTop: 2
  },
  guestBannerBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  guestBannerBtnText: {
    fontSize: 12,
    fontFamily: typography.family.bold,
    color: '#FFFFFF'
  },
  tabsContainer: {
    backgroundColor: colors.white,
    paddingVertical: 6
  },
  tabsScrollContent: {
    paddingHorizontal: 14,
    gap: 8
  },
  filterTabPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
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
    fontSize: 12.5,
    fontFamily: typography.family.medium
  },
  filterTabTextActive: {
    fontFamily: typography.family.bold,
    color: '#FFFFFF'
  },
  filterTabTextInactive: {
    fontFamily: typography.family.medium,
    color: colors.textSecondary
  },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: spacing.xs,
    paddingBottom: 110
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
    width: 50,
    height: 50,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginRight: 10
  },
  basketThumbnail: {
    width: '100%',
    height: '100%'
  },
  cardInfoCol: {
    flex: 1,
    marginRight: 8
  },
  cardOrderNumber: {
    fontSize: 14.5,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  cardOrderDate: {
    fontSize: 11.5,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    marginTop: 2
  },
  cardOrderAmount: {
    fontSize: 14.5,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    marginTop: 2
  },
  statusBadgePill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start'
  },
  statusBadgeLabel: {
    fontSize: 11,
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
    paddingVertical: 12,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle
  },
  stepItemCol: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2
  },
  stepCircle: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF'
  },
  stepLabelText: {
    fontSize: 9.5,
    fontFamily: typography.family.medium,
    color: colors.textMuted,
    textAlign: 'center',
    width: '100%'
  },
  stepLabelActive: {
    color: colors.textPrimary,
    fontFamily: typography.family.semibold
  },
  stepTimeText: {
    fontSize: 8.5,
    fontFamily: typography.family.regular,
    color: colors.textMuted,
    marginTop: 1,
    textAlign: 'center'
  },
  timelineLineBar: {
    flex: 0.8,
    height: 2,
    marginBottom: 18
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4
  },
  primaryActionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  primaryActionText: {
    fontSize: 13.5,
    fontFamily: typography.family.bold,
    color: '#FFFFFF'
  },
  secondaryActionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center'
  },
  secondaryActionText: {
    fontSize: 13.5,
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
    width: '100%',
    maxWidth: 340,
    alignItems: 'center'
  },
  reorderSuccessBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  reorderModalTitle: {
    fontSize: 18,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  reorderModalDesc: {
    fontSize: 13,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg
  },
  reorderModalActions: {
    width: '100%',
    gap: spacing.sm
  },
  reorderPrimaryBtn: {
    height: 46,
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center'
  },
  reorderPrimaryText: {
    fontSize: 15,
    fontFamily: typography.family.bold,
    color: '#FFFFFF'
  },
  reorderSecondaryBtn: {
    height: 46,
    backgroundColor: colors.softBackground,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center'
  },
  reorderSecondaryText: {
    fontSize: 15,
    fontFamily: typography.family.medium,
    color: colors.textSecondary
  }
});
