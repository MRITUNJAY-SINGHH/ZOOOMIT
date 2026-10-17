import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  StatusBar,
  BackHandler
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import {
  ArrowLeft,
  CheckCircle2,
  Trash2,
  Bell,
  Package,
  Wallet,
  Megaphone,
  AlertCircle,
  Star,
  MapPin,
  ShoppingBag,
  Store,
  ChevronRight,
  Clock,
  X,
  Sparkles,
  Coins
} from 'lucide-react-native';
import { colors, typography } from '../constants/theme';
import { deliveryService } from '../services/deliveryService';
import { hapticFeedback } from '../services/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Category Filters
const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'orders', label: 'Orders' },
  { id: 'earnings', label: 'Earnings' },
  { id: 'incentives', label: 'Incentives' }
];

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isNavigatingBack = useRef(false);

  // Debounced back navigation to prevent duplicate pop/push and looping
  const handleBack = () => {
    if (isNavigatingBack.current) return;
    isNavigatingBack.current = true;
    hapticFeedback.light?.();

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/dashboard');
    }

    setTimeout(() => {
      isNavigatingBack.current = false;
    }, 400);
  };

  useEffect(() => {
    const onBackPress = () => {
      handleBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, []);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');

  // Modals
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showMarkAllModal, setShowMarkAllModal] = useState(false);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await deliveryService.getNotifications();
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (err) {
      console.warn('[Notifications] Fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    hapticFeedback.light?.();
    fetchNotifications();
  };

  // Unread count
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  // Counts by category
  const categoryCounts = useMemo(() => {
    const counts = { all: notifications.length, orders: 0, earnings: 0, incentives: 0 };
    notifications.forEach((n) => {
      const type = n.type || '';
      const cat = n.data?.category?.toLowerCase() || '';
      if (cat === 'orders' || type.includes('Order') || type.includes('Rating')) {
        counts.orders++;
      } else if (cat === 'earnings' || cat === 'payments' || cat === 'settlements' || type.includes('Earning') || type.includes('Settlement') || type.includes('Payment')) {
        counts.earnings++;
      } else if (cat === 'incentives' || type.includes('Incentive')) {
        counts.incentives++;
      }
    });
    return counts;
  }, [notifications]);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    if (activeCategory === 'all') return notifications;
    return notifications.filter((n) => {
      const type = n.type || '';
      const cat = n.data?.category?.toLowerCase() || '';
      if (activeCategory === 'orders') {
        return cat === 'orders' || type.includes('Order') || type.includes('Rating');
      }
      if (activeCategory === 'earnings') {
        return cat === 'earnings' || cat === 'payments' || cat === 'settlements' || type.includes('Earning') || type.includes('Settlement') || type.includes('Payment');
      }
      if (activeCategory === 'incentives') {
        return cat === 'incentives' || type.includes('Incentive');
      }
      return true;
    });
  }, [notifications, activeCategory]);

  // Group by Today, Yesterday, Earlier
  const groupedNotifications = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const groups = {
      today: [],
      yesterday: [],
      earlier: []
    };

    filteredNotifications.forEach((item) => {
      const created = new Date(item.createdAt || Date.now());
      if (created >= todayStart) {
        groups.today.push(item);
      } else if (created >= yesterdayStart) {
        groups.yesterday.push(item);
      } else {
        groups.earlier.push(item);
      }
    });

    return groups;
  }, [filteredNotifications]);

  // Handle Mark All Read
  const handleConfirmMarkAllRead = async () => {
    setProcessingAction(true);
    setActionError('');
    try {
      await deliveryService.markAllNotificationsRead();
      hapticFeedback.success?.();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
      setShowMarkAllModal(false);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not mark notifications as read.');
      hapticFeedback.error?.();
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle Clear All
  const handleConfirmClearAll = async () => {
    setProcessingAction(true);
    setActionError('');
    try {
      await deliveryService.clearAllNotifications();
      hapticFeedback.success?.();
      setNotifications([]);
      setShowClearAllModal(false);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not clear notifications.');
      hapticFeedback.error?.();
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle Single Item Tap
  const handleItemPress = async (item) => {
    hapticFeedback.light?.();
    if (!item.isRead && item._id && !item._id.startsWith('seed_')) {
      try {
        await deliveryService.markNotificationRead(item._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n))
        );
      } catch {
        // Optimistic update fallback
        setNotifications((prev) =>
          prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n))
        );
      }
    } else if (!item.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n))
      );
    }

    setSelectedNotification(item);
  };

  // Format Time Helper
  const formatNotificationTime = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).toUpperCase();
  };

  // Render Icon according to notification type
  const renderNotificationIcon = (type) => {
    switch (type) {
      case 'New Order Available':
      case 'New Order':
        return (
          <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
            <Bell size={20} color="#D97706" strokeWidth={2.2} />
          </View>
        );
      case 'Order Accepted':
      case 'Order Delivered':
        return (
          <View style={[styles.iconContainer, { backgroundColor: '#DCFCE7' }]}>
            <CheckCircle2 size={20} color="#16A34A" strokeWidth={2.2} />
          </View>
        );
      case 'Payment Received':
      case 'Earning Recorded':
      case 'Store Cash Settlement':
        return (
          <View style={[styles.iconContainer, { backgroundColor: '#DCFCE7' }]}>
            <Coins size={20} color="#16A34A" strokeWidth={2.2} />
          </View>
        );
      case 'New Incentive':
      case 'Incentive':
        return (
          <View style={[styles.iconContainer, { backgroundColor: '#FFEDD5' }]}>
            <Megaphone size={20} color="#EA580C" strokeWidth={2.2} />
          </View>
        );
      case 'Order Cancelled':
        return (
          <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
            <Bell size={20} color="#DC2626" strokeWidth={2.2} />
          </View>
        );
      case 'High Rating Received':
      case 'Rating':
        return (
          <View style={[styles.iconContainer, { backgroundColor: '#F3E8FF' }]}>
            <Star size={20} color="#9333EA" fill="#9333EA" strokeWidth={1.5} />
          </View>
        );
      case 'App Update':
      default:
        return (
          <View style={[styles.iconContainer, { backgroundColor: '#E0F2FE' }]}>
            <Bell size={20} color="#0284C7" strokeWidth={2.2} />
          </View>
        );
    }
  };

  // Render single notification card
  const renderCard = (item) => {
    return (
      <TouchableOpacity
        key={item._id}
        activeOpacity={0.7}
        onPress={() => handleItemPress(item)}
        style={[styles.notificationCard, !item.isRead && styles.notificationCardUnread]}
      >
        <View style={styles.cardLeftBox}>
          {renderNotificationIcon(item.type)}
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>

        <View style={styles.cardCenterCol}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardMessage} numberOfLines={2}>
            {item.message}
          </Text>
        </View>

        <View style={styles.cardRightCol}>
          <Text style={styles.cardTimeText}>{formatNotificationTime(item.createdAt)}</Text>
          <ChevronRight size={16} color="#94A3B8" style={{ marginTop: 6 }} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top Header Bar */}
        <View style={styles.headerBar}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleBack}
              style={styles.backBtn}
              accessibilityLabel="Back"
              accessibilityRole="button"
            >
              <ArrowLeft size={22} color="#111827" strokeWidth={2.2} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notifications</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                if (unreadCount === 0) return;
                hapticFeedback.light?.();
                setActionError('');
                setShowMarkAllModal(true);
              }}
              style={[styles.actionBtn, unreadCount === 0 && { opacity: 0.45 }]}
              disabled={unreadCount === 0}
            >
              <CheckCircle2 size={18} color="#111827" strokeWidth={2} />
              <Text style={styles.actionBtnText}>Mark All Read</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                if (notifications.length === 0) return;
                hapticFeedback.light?.();
                setActionError('');
                setShowClearAllModal(true);
              }}
              style={[styles.actionBtn, notifications.length === 0 && { opacity: 0.45 }]}
              disabled={notifications.length === 0}
            >
              <Trash2 size={18} color="#111827" strokeWidth={2} />
              <Text style={styles.actionBtnText}>Clear All</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Filter Pills */}
        <View style={styles.categoryBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              const count = categoryCounts[cat.id] ?? 0;
              return (
                <TouchableOpacity
                  key={cat.id}
                  activeOpacity={0.8}
                  onPress={() => {
                    hapticFeedback.selection?.();
                    setActiveCategory(cat.id);
                  }}
                  style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                >
                  <Text style={[styles.categoryLabel, isActive && styles.categoryLabelActive]}>
                    {cat.label}
                  </Text>
                  <View style={[styles.categoryCountBadge, isActive && styles.categoryCountBadgeActive]}>
                    <Text style={[styles.categoryCountText, isActive && styles.categoryCountTextActive]}>
                      {count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Main List */}
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
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
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#FFC928" />
            </View>
          ) : filteredNotifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Bell size={42} color="#94A3B8" strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptySub}>
                {activeCategory === 'all'
                  ? "You're all caught up! New delivery alerts, payment notices, and incentives will appear here."
                  : `No ${activeCategory} notifications found at the moment.`}
              </Text>
            </View>
          ) : (
            <>
              {/* Today Section */}
              {groupedNotifications.today.length > 0 && (
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionHeaderTitle}>Today</Text>
                  {groupedNotifications.today.map(renderCard)}
                </View>
              )}

              {/* Yesterday Section */}
              {groupedNotifications.yesterday.length > 0 && (
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionHeaderTitle}>Yesterday</Text>
                  {groupedNotifications.yesterday.map(renderCard)}
                </View>
              )}

              {/* Earlier Section */}
              {groupedNotifications.earlier.length > 0 && (
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionHeaderTitle}>Earlier</Text>
                  {groupedNotifications.earlier.map(renderCard)}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* ====================================================================== */}
      {/* SCREEN 3: NOTIFICATION DETAILS MODAL                                   */}
      {/* ====================================================================== */}
      <Modal
        visible={Boolean(selectedNotification)}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setSelectedNotification(null)}
      >
        <SafeAreaView style={styles.detailPageContainer}>
          <View style={styles.detailHeaderBar}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSelectedNotification(null)}
              style={styles.backBtn}
            >
              <ArrowLeft size={22} color="#111827" strokeWidth={2.2} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notification Details</Text>
            <View style={{ width: 40 }} />
          </View>

          {selectedNotification && (
            <ScrollView
              contentContainerStyle={styles.detailScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Hero Banner Card */}
              <View style={styles.detailHeroCard}>
                <View style={styles.detailHeroIconBox}>
                  <Bell size={26} color="#D97706" strokeWidth={2.2} />
                  {!selectedNotification.isRead && <View style={styles.unreadDot} />}
                </View>

                <View style={styles.detailHeroTextCol}>
                  <Text style={styles.detailHeroTitle}>{selectedNotification.title}</Text>
                  <Text style={styles.detailHeroOrderNum}>
                    {selectedNotification.data?.orderNumber
                      ? `#${selectedNotification.data.orderNumber}`
                      : selectedNotification.title}
                  </Text>
                  <Text style={styles.detailHeroTime}>
                    {formatNotificationTime(selectedNotification.createdAt)}
                  </Text>
                </View>
              </View>

              {/* Message Box */}
              <View style={styles.detailContentBox}>
                <Text style={styles.detailLeadMessage}>
                  {selectedNotification.message.replace(/\n.*/, '')}
                </Text>

                {/* Key Attributes list */}
                <View style={styles.detailAttrList}>
                  <View style={styles.detailAttrRow}>
                    <View style={[styles.attrIconCircle, { backgroundColor: '#FEE2E2' }]}>
                      <MapPin size={18} color="#DC2626" />
                    </View>
                    <Text style={styles.attrText}>
                      {selectedNotification.data?.distance || '1.2 km away'}
                    </Text>
                  </View>

                  <View style={styles.detailAttrRow}>
                    <View style={[styles.attrIconCircle, { backgroundColor: '#FEF3C7' }]}>
                      <ShoppingBag size={18} color="#D97706" />
                    </View>
                    <Text style={styles.attrText}>
                      {selectedNotification.data?.itemsSummary || '8 items • ~₹60'}
                    </Text>
                  </View>

                  <View style={styles.detailAttrRow}>
                    <View style={[styles.attrIconCircle, { backgroundColor: '#DBEAFE' }]}>
                      <Store size={18} color="#2563EB" />
                    </View>
                    <Text style={styles.attrText}>
                      {selectedNotification.data?.pickupLocation || 'ZOOOMIT Store, Shankar Vihar'}
                    </Text>
                  </View>

                  <View style={styles.detailAttrRow}>
                    <View style={[styles.attrIconCircle, { backgroundColor: '#DCFCE7' }]}>
                      <MapPin size={18} color="#16A34A" />
                    </View>
                    <Text style={styles.attrText}>
                      {selectedNotification.data?.deliveryLocation || 'Raj Nagar, Ghaziabad'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Action Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  const targetOrderId =
                    selectedNotification.data?.orderId ||
                    selectedNotification.order?._id ||
                    selectedNotification.data?.orderNumber;
                  setSelectedNotification(null);
                  if (targetOrderId && typeof targetOrderId === 'string' && targetOrderId.length > 10) {
                    router.push(`/order/${targetOrderId}`);
                  } else {
                    router.push('/(tabs)/orders');
                  }
                }}
                style={styles.viewOrderBtn}
              >
                <Text style={styles.viewOrderBtnText}>View Order</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* ====================================================================== */}
      {/* SCREEN 3 POPUP: MARK ALL READ CONFIRMATION                             */}
      {/* ====================================================================== */}
      <Modal
        visible={showMarkAllModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !processingAction && setShowMarkAllModal(false)}
      >
        <View style={styles.blurModalContainer}>
          <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill}>
            <View style={styles.backdropDimmer} />
          </BlurView>

          <View style={styles.dialogCard}>
            <View style={[styles.dialogIconCircle, { backgroundColor: '#DCFCE7' }]}>
              <CheckCircle2 size={32} color="#16A34A" strokeWidth={2.4} />
            </View>

            <Text style={styles.dialogTitle}>Mark All as Read?</Text>
            <Text style={styles.dialogMessage}>
              All unread notifications will be marked as read.
            </Text>

            {actionError ? <Text style={styles.dialogErrorText}>{actionError}</Text> : null}

            <View style={styles.dialogButtonsRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowMarkAllModal(false)}
                disabled={processingAction}
                style={styles.dialogCancelBtn}
              >
                <Text style={styles.dialogCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleConfirmMarkAllRead}
                disabled={processingAction}
                style={styles.dialogConfirmBtn}
              >
                {processingAction ? (
                  <ActivityIndicator size="small" color="#111827" />
                ) : (
                  <Text style={styles.dialogConfirmText}>Mark All Read</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ====================================================================== */}
      {/* SCREEN 4: CLEAR ALL NOTIFICATIONS CONFIRMATION POPUP                   */}
      {/* ====================================================================== */}
      <Modal
        visible={showClearAllModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !processingAction && setShowClearAllModal(false)}
      >
        <View style={styles.blurModalContainer}>
          <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill}>
            <View style={styles.backdropDimmer} />
          </BlurView>

          <View style={styles.dialogCard}>
            <View style={[styles.dialogIconCircle, { backgroundColor: '#FEE2E2' }]}>
              <Trash2 size={30} color="#DC2626" strokeWidth={2.2} />
            </View>

            <Text style={styles.dialogTitle}>Clear All Notifications?</Text>
            <Text style={styles.dialogMessage}>
              This will permanently remove all notifications from your list. This action cannot be undone.
            </Text>

            {actionError ? <Text style={styles.dialogErrorText}>{actionError}</Text> : null}

            <View style={styles.dialogButtonsRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowClearAllModal(false)}
                disabled={processingAction}
                style={styles.dialogCancelBtn}
              >
                <Text style={styles.dialogCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleConfirmClearAll}
                disabled={processingAction}
                style={styles.dialogConfirmBtn}
              >
                {processingAction ? (
                  <ActivityIndicator size="small" color="#111827" />
                ) : (
                  <Text style={styles.dialogConfirmText}>Clear All</Text>
                )}
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
    backgroundColor: '#F8F9FA'
  },
  safeArea: {
    flex: 1
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },
  headerTitle: {
    fontFamily: typography.family.bold,
    fontSize: 20,
    color: '#111827'
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4
  },
  actionBtnText: {
    fontFamily: typography.family.medium,
    fontSize: 10,
    color: '#475569',
    marginTop: 2
  },

  // Category Pills
  categoryBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  categoryScroll: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 8
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    gap: 6
  },
  categoryPillActive: {
    backgroundColor: '#FFC928'
  },
  categoryLabel: {
    fontFamily: typography.family.medium,
    fontSize: 13,
    color: '#475569'
  },
  categoryLabelActive: {
    fontFamily: typography.family.bold,
    color: '#111827'
  },
  categoryCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#E2E8F0'
  },
  categoryCountBadgeActive: {
    backgroundColor: '#EAB308'
  },
  categoryCountText: {
    fontFamily: typography.family.bold,
    fontSize: 11,
    color: '#334155'
  },
  categoryCountTextActive: {
    color: '#111827'
  },

  // Scroll content
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16
  },
  loadingBox: {
    paddingVertical: 80,
    alignItems: 'center'
  },
  sectionBlock: {
    marginBottom: 20
  },
  sectionHeaderTitle: {
    fontFamily: typography.family.bold,
    fontSize: 15,
    color: '#111827',
    marginBottom: 10
  },

  // Notification Card
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 10
  },
  notificationCardUnread: {
    borderColor: '#FDE047',
    backgroundColor: '#FFFDF5'
  },
  cardLeftBox: {
    position: 'relative',
    marginRight: 12
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF'
  },
  cardCenterCol: {
    flex: 1,
    marginRight: 8
  },
  cardTitle: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#111827',
    marginBottom: 2
  },
  cardMessage: {
    fontFamily: typography.family.regular,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16
  },
  cardRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  cardTimeText: {
    fontFamily: typography.family.medium,
    fontSize: 11,
    color: '#94A3B8'
  },

  // Empty State
  emptyContainer: {
    paddingVertical: 70,
    alignItems: 'center',
    paddingHorizontal: 24
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  emptyTitle: {
    fontFamily: typography.family.bold,
    fontSize: 18,
    color: '#111827',
    marginBottom: 8
  },
  emptySub: {
    fontFamily: typography.family.regular,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19
  },

  // Screen 3: Detail Modal
  detailPageContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  detailHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  detailScrollContent: {
    padding: 16
  },
  detailHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    padding: 16,
    marginBottom: 16
  },
  detailHeroIconBox: {
    position: 'relative',
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  detailHeroTextCol: {
    flex: 1
  },
  detailHeroTitle: {
    fontFamily: typography.family.bold,
    fontSize: 16,
    color: '#111827'
  },
  detailHeroOrderNum: {
    fontFamily: typography.family.heavy,
    fontSize: 18,
    color: '#111827',
    marginVertical: 2
  },
  detailHeroTime: {
    fontFamily: typography.family.regular,
    fontSize: 11.5,
    color: '#94A3B8'
  },
  detailContentBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 18,
    marginBottom: 20
  },
  detailLeadMessage: {
    fontFamily: typography.family.medium,
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    marginBottom: 16
  },
  detailAttrList: {
    gap: 14
  },
  detailAttrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  attrIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  attrText: {
    fontFamily: typography.family.medium,
    fontSize: 13,
    color: '#111827',
    flex: 1
  },
  viewOrderBtn: {
    height: 50,
    backgroundColor: '#FFC928',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  viewOrderBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 15,
    color: '#111827'
  },

  // Screen 4 & Confirmation Blur Popups
  blurModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  backdropDimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 24, 39, 0.45)'
  },
  dialogCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 24,
    alignItems: 'center'
  },
  dialogIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14
  },
  dialogTitle: {
    fontFamily: typography.family.bold,
    fontSize: 18,
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8
  },
  dialogMessage: {
    fontFamily: typography.family.regular,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20
  },
  dialogErrorText: {
    fontFamily: typography.family.medium,
    fontSize: 12,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 12
  },
  dialogButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%'
  },
  dialogCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  dialogCancelText: {
    fontFamily: typography.family.bold,
    fontSize: 13.5,
    color: '#334155'
  },
  dialogConfirmBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#FFC928',
    alignItems: 'center',
    justifyContent: 'center'
  },
  dialogConfirmText: {
    fontFamily: typography.family.bold,
    fontSize: 13.5,
    color: '#111827'
  }
});
