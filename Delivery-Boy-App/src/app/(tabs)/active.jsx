import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Zap,
  Clock,
  MapPin,
  Store,
  Package,
  Navigation,
  RefreshCw,
  ShoppingBag,
  Utensils,
  Briefcase,
  Check,
  X,
  Radio,
  WifiOff
} from 'lucide-react-native';
import { colors, typography } from '../../constants/theme';
import { deliveryService } from '../../services/deliveryService';
import { useAuth } from '../../context/AuthContext';
import { hapticFeedback } from '../../services/haptics';
import { LoadingSkeleton, ErrorState } from '../../components/sharedStates';

export default function ActiveOrdersScreen() {
  const router = useRouter();
  const { isOnline, toggleOnline } = useAuth();

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLivePolling, setIsLivePolling] = useState(false);
  const [error, setError] = useState(null);

  // Per-order action loading states
  const [acceptingId, setAcceptingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);

  // Fetch upcoming available orders
  const fetchUpcomingOrders = useCallback(async (silent = false) => {
    try {
      if (!silent) setError(null);
      if (silent) setIsLivePolling(true);

      const res = await deliveryService.getAvailableOrders();
      if (Array.isArray(res)) {
        setOffers(res);
      }
    } catch (err) {
      if (!silent) {
        setError(err.response?.data?.message || err.message || 'Unable to load upcoming delivery orders.');
      }
    } finally {
      if (!silent) {
        setLoading(false);
        setRefreshing(false);
      }
      setIsLivePolling(false);
    }
  }, []);

  // Live auto-refresh polling every 5 seconds when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchUpcomingOrders();

      const pollTimer = setInterval(() => {
        fetchUpcomingOrders(true);
      }, 5000);

      return () => {
        clearInterval(pollTimer);
      };
    }, [fetchUpcomingOrders])
  );

  const onRefresh = () => {
    setRefreshing(true);
    hapticFeedback.light?.();
    fetchUpcomingOrders();
  };

  // Strictly sort newest offers at the top, older below
  const sortedOffers = useMemo(() => {
    const list = [...offers];
    list.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return String(b.orderNumber || b._id || '').localeCompare(String(a.orderNumber || a._id || ''));
    });
    return list;
  }, [offers]);

  // Handle Accept Order
  const handleAccept = async (order) => {
    try {
      setAcceptingId(order._id);
      hapticFeedback.medium?.();

      const res = await deliveryService.acceptOrder(order._id);
      hapticFeedback.success?.();

      // Remove from upcoming offers
      setOffers((prev) => prev.filter((o) => o._id !== order._id));

      Alert.alert(
        'Delivery Accepted! 🛵',
        `Order #${order.orderNumber} is now assigned to you. Go to the pickup store to start this delivery.`,
        [
          {
            text: 'View in Orders',
            onPress: () => router.push('/(tabs)/orders')
          },
          {
            text: 'Start Delivery',
            style: 'default',
            onPress: () => {
              if (order._id && !order._id.startsWith('ord_')) {
                router.push(`/order/${order._id}`);
              } else {
                router.push('/(tabs)/orders');
              }
            }
          }
        ]
      );
    } catch (err) {
      hapticFeedback.error?.();
      Alert.alert(
        'Could Not Accept',
        err.response?.data?.message || err.message || 'Order was already claimed by another partner or is no longer available.'
      );
      fetchUpcomingOrders();
    } finally {
      setAcceptingId(null);
    }
  };

  // Handle Reject / Decline Order
  const handleReject = async (order) => {
    try {
      setRejectingId(order._id);
      hapticFeedback.light?.();

      await deliveryService.rejectOrder(order._id, 'Passed by partner');

      // Instantly remove from view
      setOffers((prev) => prev.filter((o) => o._id !== order._id));
    } catch (err) {
      // Still remove locally so rider is not blocked
      setOffers((prev) => prev.filter((o) => o._id !== order._id));
    } finally {
      setRejectingId(null);
    }
  };

  // Order category icon
  const renderCategoryIcon = (orderType = '') => {
    const t = (orderType || '').toLowerCase();
    if (t.includes('food')) {
      return (
        <View style={[styles.categoryIconBox, { backgroundColor: '#FEE2E2' }]}>
          <Utensils size={18} color="#EA580C" strokeWidth={2.2} />
        </View>
      );
    }
    if (t.includes('medicine') || t.includes('pharma')) {
      return (
        <View style={[styles.categoryIconBox, { backgroundColor: '#DBEAFE' }]}>
          <Briefcase size={18} color="#2563EB" strokeWidth={2.2} />
        </View>
      );
    }
    return (
      <View style={[styles.categoryIconBox, { backgroundColor: '#FEF3C7' }]}>
        <ShoppingBag size={18} color="#D97706" strokeWidth={2.2} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* ============================================================== */}
        {/* TOP HEADER BAR                                                 */}
        {/* ============================================================== */}
        <View style={styles.headerBar}>
          <View>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Upcoming Orders</Text>
              <View style={styles.offerCountPill}>
                <Text style={styles.offerCountPillText}>{sortedOffers.length} New</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>Accept or decline new delivery assignments</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => {
              hapticFeedback.light?.();
              fetchUpcomingOrders(false);
            }}
            style={styles.refreshBtn}
            accessibilityLabel="Refresh upcoming orders"
          >
            <RefreshCw
              size={16}
              color="#111827"
              strokeWidth={2.4}
              style={isLivePolling ? styles.spinningIcon : undefined}
            />
          </TouchableOpacity>
        </View>

        {/* ============================================================== */}
        {/* OFFLINE NOTICE BANNER (If rider is offline)                    */}
        {/* ============================================================== */}
        {!isOnline && (
          <View style={styles.offlineBanner}>
            <View style={styles.offlineBannerLeft}>
              <WifiOff size={18} color="#991B1B" strokeWidth={2.2} style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.offlineBannerTitle}>You are currently Offline</Text>
                <Text style={styles.offlineBannerSub}>Go online to receive and accept new delivery offers</Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => toggleOnline?.(true)}
              style={styles.goOnlineBtn}
            >
              <Text style={styles.goOnlineBtnText}>Go Online</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ============================================================== */}
        {/* UPCOMING OFFERS LIST                                           */}
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
            <LoadingSkeleton message="Searching for upcoming orders..." cardsCount={3} />
          ) : error ? (
            <ErrorState
              title="Unable to Load Upcoming Orders"
              message={error}
              onRetry={() => {
                setLoading(true);
                fetchUpcomingOrders();
              }}
            />
          ) : sortedOffers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.radarCircle}>
                <Radio size={40} color="#047857" strokeWidth={2.2} />
              </View>
              <Text style={styles.emptyTitle}>No Upcoming Orders Right Now</Text>
              <Text style={styles.emptySubtitle}>
                {isOnline
                  ? 'Your app is online and listening for new delivery assignments. New orders will appear here automatically.'
                  : 'You are currently offline. Turn on your online status to receive new delivery orders.'}
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push('/(tabs)/orders')}
                style={styles.emptyOrdersHistoryBtn}
              >
                <Text style={styles.emptyOrdersHistoryBtnText}>View All Orders History</Text>
              </TouchableOpacity>
            </View>
          ) : (
            sortedOffers.map((order, index) => {
              const orderIdStr = order.orderNumber
                ? `#${order.orderNumber}`
                : `#ZM${order._id ? order._id.slice(-6).toUpperCase() : '102388'}`;

              const isLatest = index === 0;
              const isAccepting = acceptingId === order._id;
              const isRejecting = rejectingId === order._id;
              const isAnyBusy = Boolean(acceptingId || rejectingId);

              const storeName = order.pickupLocation?.storeName || 'ZOOOMIT Supermart Hub';
              const storeAddress = order.pickupLocation?.address || 'Sector 4, Main Express Lane';
              const customerName = order.deliveryLocation?.contactName || 'Customer';
              const customerAddress = order.deliveryLocation?.formattedAddress || order.deliveryLocation?.street || 'Customer Address';
              const itemsCount = order.itemCount || 1;
              const distanceKm = order.deliveryLocation?.distanceKm || order.pickupLocation?.distanceKm || 2.4;
              const paymentMode = (order.paymentMode || order.paymentMethod || 'Online').toLowerCase();
              const isCod = paymentMode.includes('cod') || paymentMode.includes('cash');

              return (
                <View
                  key={order._id || `offer-${index}`}
                  style={[
                    styles.offerCard,
                    isLatest && styles.offerCardLatest
                  ]}
                >
                  {/* Top Bar: Order ID + Category + Live Offer Tag */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardHeaderLeft}>
                      {renderCategoryIcon(order.orderType)}
                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={styles.orderNumberText}>{orderIdStr}</Text>
                          {isLatest && (
                            <View style={styles.latestTag}>
                              <Text style={styles.latestTagText}>⚡ NEWEST</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.orderCategoryText}>
                          {order.orderType || 'Grocery Order'}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.paymentPill, isCod ? styles.paymentCod : styles.paymentOnline]}>
                      <Text style={[styles.paymentPillText, isCod ? styles.paymentTextCod : styles.paymentTextOnline]}>
                        {isCod ? 'COD' : 'Paid Online'}
                      </Text>
                    </View>
                  </View>

                  {/* Route Information: Pickup Store & Customer Drop */}
                  <View style={styles.routeContainer}>
                    {/* Pickup Store */}
                    <View style={styles.routeRow}>
                      <View style={styles.iconCircleStore}>
                        <Store size={14} color="#15803D" strokeWidth={2.4} />
                      </View>
                      <View style={styles.routeDetails}>
                        <Text style={styles.routeRole}>PICKUP STORE</Text>
                        <Text style={styles.locationTitle} numberOfLines={1}>{storeName}</Text>
                        <Text style={styles.locationSubtitle} numberOfLines={1}>{storeAddress}</Text>
                      </View>
                    </View>

                    <View style={styles.routeDivider} />

                    {/* Customer Drop */}
                    <View style={styles.routeRow}>
                      <View style={styles.iconCircleDrop}>
                        <MapPin size={14} color="#DC2626" strokeWidth={2.4} />
                      </View>
                      <View style={styles.routeDetails}>
                        <Text style={styles.routeRole}>DELIVER TO</Text>
                        <Text style={styles.locationTitle} numberOfLines={1}>{customerName}</Text>
                        <Text style={styles.locationSubtitle} numberOfLines={1}>{customerAddress}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Meta Chips: Items & Distance */}
                  <View style={styles.metaRow}>
                    <View style={styles.metaChip}>
                      <Package size={13} color="#475569" strokeWidth={2} style={{ marginRight: 4 }} />
                      <Text style={styles.metaText}>{itemsCount} Item{itemsCount > 1 ? 's' : ''}</Text>
                    </View>

                    <View style={styles.metaChip}>
                      <Navigation size={13} color="#475569" strokeWidth={2} style={{ marginRight: 4 }} />
                      <Text style={styles.metaText}>{distanceKm} km est.</Text>
                    </View>

                    <View style={styles.metaChip}>
                      <Clock size={13} color="#D97706" strokeWidth={2} style={{ marginRight: 4 }} />
                      <Text style={[styles.metaText, { color: '#B45309', fontFamily: typography.family.bold }]}>
                        Waiting Response
                      </Text>
                    </View>
                  </View>

                  {/* ========================================================== */}
                  {/* TWO ACTION BUTTONS: DECLINE (Reject) & ACCEPT DELIVERY    */}
                  {/* ========================================================== */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleReject(order)}
                      disabled={isAnyBusy}
                      style={[styles.declineBtn, isRejecting && { opacity: 0.7 }]}
                    >
                      {isRejecting ? (
                        <ActivityIndicator size="small" color="#DC2626" />
                      ) : (
                        <>
                          <X size={16} color="#DC2626" strokeWidth={2.5} style={{ marginRight: 6 }} />
                          <Text style={styles.declineBtnText}>Decline</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.88}
                      onPress={() => handleAccept(order)}
                      disabled={isAnyBusy}
                      style={[styles.acceptBtn, isAccepting && { opacity: 0.7 }]}
                    >
                      {isAccepting ? (
                        <ActivityIndicator size="small" color="#111827" />
                      ) : (
                        <>
                          <Check size={18} color="#111827" strokeWidth={2.8} style={{ marginRight: 6 }} />
                          <Text style={styles.acceptBtnText}>Accept Delivery</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  safeArea: {
    flex: 1
  },

  // Header Bar
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerTitle: {
    fontFamily: typography.family.heavy,
    fontSize: 21,
    color: '#111827',
    letterSpacing: -0.3
  },
  headerSubtitle: {
    fontFamily: typography.family.medium,
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  offerCountPill: {
    backgroundColor: '#FEF08A',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#FDE047'
  },
  offerCountPillText: {
    fontFamily: typography.family.bold,
    fontSize: 11,
    color: '#854D0E'
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  spinningIcon: {
    transform: [{ rotate: '45deg' }]
  },

  // Offline Notice Banner
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FEF2F2',
    borderBottomWidth: 1,
    borderBottomColor: '#FEE2E2'
  },
  offlineBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10
  },
  offlineBannerTitle: {
    fontFamily: typography.family.bold,
    fontSize: 12.5,
    color: '#991B1B'
  },
  offlineBannerSub: {
    fontFamily: typography.family.medium,
    fontSize: 11,
    color: '#B91C1C',
    marginTop: 1
  },
  goOnlineBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  goOnlineBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 12,
    color: '#FFFFFF'
  },

  // Scroll Content
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    flexGrow: 1
  },

  // Offer Card
  offerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 14
  },
  offerCardLatest: {
    borderColor: '#FFC928',
    borderWidth: 2,
    backgroundColor: '#FFFCF2'
  },

  // Card Header Row
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8
  },
  categoryIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  orderNumberText: {
    fontFamily: typography.family.heavy,
    fontSize: 15,
    color: '#111827',
    letterSpacing: -0.2
  },
  latestTag: {
    backgroundColor: '#FFC928',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6
  },
  latestTagText: {
    fontFamily: typography.family.heavy,
    fontSize: 9.5,
    color: '#111827'
  },
  orderCategoryText: {
    fontFamily: typography.family.medium,
    fontSize: 11.5,
    color: '#64748B',
    textTransform: 'uppercase',
    marginTop: 1
  },

  paymentPill: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8
  },
  paymentCod: {
    backgroundColor: '#FEF3C7'
  },
  paymentOnline: {
    backgroundColor: '#DCFCE7'
  },
  paymentPillText: {
    fontFamily: typography.family.bold,
    fontSize: 11
  },
  paymentTextCod: {
    color: '#B45309'
  },
  paymentTextOnline: {
    color: '#15803D'
  },

  // Route Section
  routeContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconCircleStore: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  iconCircleDrop: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  routeDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#CBD5E1',
    marginLeft: 13.5,
    marginVertical: 3
  },
  routeDetails: {
    flex: 1
  },
  routeRole: {
    fontFamily: typography.family.bold,
    fontSize: 9.5,
    color: '#94A3B8',
    letterSpacing: 0.4
  },
  locationTitle: {
    fontFamily: typography.family.bold,
    fontSize: 13,
    color: '#111827',
    marginTop: 1
  },
  locationSubtitle: {
    fontFamily: typography.family.medium,
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1
  },

  // Meta Row
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  metaText: {
    fontFamily: typography.family.medium,
    fontSize: 11.5,
    color: '#475569'
  },

  // Actions Row: Decline & Accept
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  declineBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  declineBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 13.5,
    color: '#DC2626'
  },
  acceptBtn: {
    flex: 1.6,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#FFC928',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  acceptBtnText: {
    fontFamily: typography.family.heavy,
    fontSize: 13.5,
    color: '#111827'
  },

  // Empty State
  emptyContainer: {
    paddingVertical: 70,
    alignItems: 'center',
    paddingHorizontal: 24
  },
  radarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  emptyTitle: {
    fontFamily: typography.family.heavy,
    fontSize: 18,
    color: '#111827',
    marginBottom: 8
  },
  emptySubtitle: {
    fontFamily: typography.family.medium,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20
  },
  emptyOrdersHistoryBtn: {
    backgroundColor: '#FFC928',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12
  },
  emptyOrdersHistoryBtnText: {
    fontFamily: typography.family.heavy,
    fontSize: 13,
    color: '#111827'
  }
});
