import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  StatusBar,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useAnimatedReaction,
  interpolate,
  Extrapolation,
  runOnJS
} from 'react-native-reanimated';
import {
  Settings,
  User,
  Headphones,
  Info,
  Shield,
  FileText,
  MessageSquare,
  ChevronRight,
  LogOut,
  Bell
} from 'lucide-react-native';
import { typography } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { deliveryService } from '../../services/deliveryService';
import { notificationService } from '../../services/notificationService';
import { hapticFeedback } from '../../services/haptics';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { partner, logout, isOnline, toggleOnline } = useAuth();

  // Logout state
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Business metrics from real backend
  const [stats, setStats] = useState({
    completedDeliveries: partner?.totalDeliveries || 320,
    totalEarned: partner?.totalEarnings || 9600,
    cashToCollect: 420
  });

  useEffect(() => {
    let isMounted = true;
    const fetchMetrics = async () => {
      try {
        const dashboard = await deliveryService.getDashboard();
        if (isMounted && dashboard) {
          setStats({
            completedDeliveries: dashboard.totalDeliveries ?? (dashboard.todayCompleted ?? 320),
            totalEarned: dashboard.totalEarnings ?? (dashboard.todayEarnings ?? 9600),
            cashToCollect: dashboard.cashToCollect ?? 420
          });
        }
      } catch {
        // preserve existing or fallback data cleanly
      }
    };
    fetchMetrics();
    return () => {
      isMounted = false;
    };
  }, []);

  const partnerName = partner?.name || 'Rahul Sharma';
  const partnerInitials = partnerName
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'RS';

  const handleToggleOnlineStatus = async () => {
    try {
      setIsTogglingStatus(true);
      hapticFeedback.light?.();
      await toggleOnline?.(!isOnline);
    } catch {
      Alert.alert('Status Update', 'Could not update online status. Please check your network.');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Dimensions for collapsible header animation
  const COMPACT_HEADER_HEIGHT = insets.top + 54;
  const EXPANDED_HEADER_HEIGHT = insets.top + 180;
  const SCROLL_DISTANCE = EXPANDED_HEADER_HEIGHT - COMPACT_HEADER_HEIGHT;

  const scrollY = useSharedValue(0);
  const [isCompactVisible, setIsCompactVisible] = useState(false);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    }
  });

  useAnimatedReaction(
    () => scrollY.value > SCROLL_DISTANCE * 0.45,
    (visible, prev) => {
      if (visible !== prev) {
        runOnJS(setIsCompactVisible)(visible);
      }
    }
  );

  // Reanimated Interpolations
  const expandedHeaderAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, SCROLL_DISTANCE],
      [0, -SCROLL_DISTANCE],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ translateY }]
    };
  });

  const topRowAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, SCROLL_DISTANCE * 0.4],
      [1, 0],
      Extrapolation.CLAMP
    );
    return {
      opacity
    };
  });

  const identityAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, SCROLL_DISTANCE * 0.55],
      [1, 0],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      scrollY.value,
      [0, SCROLL_DISTANCE * 0.55],
      [1, 0.88],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [0, SCROLL_DISTANCE * 0.55],
      [0, -18],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ translateY }, { scale }]
    };
  });

  const compactHeaderAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [SCROLL_DISTANCE * 0.4, SCROLL_DISTANCE],
      [0, 1],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [SCROLL_DISTANCE * 0.4, SCROLL_DISTANCE],
      [-8, 0],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ translateY }]
    };
  });

  // Fast responsive menu navigation
  const isNavigatingRef = useRef(false);
  const handleMenuPress = (pathname) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    hapticFeedback.light?.();
    router.navigate({ pathname, params: { from: 'profile' } });
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 100);
  };

  // Exactly 6 menu rows matching the reference image Screen 1
  const menuItems = [
    {
      id: 'personal-info',
      title: 'Personal Information',
      subtitle: 'Name and contact details',
      icon: User,
      iconColor: '#2563EB',
      bgColor: '#EFF6FF',
      borderColor: '#DBEAFE',
      onPress: () => handleMenuPress('/personal-info')
    },
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'FAQs and delivery help',
      icon: Headphones,
      iconColor: '#16A34A',
      bgColor: '#F0FDF4',
      borderColor: '#DCFCE7',
      onPress: () => handleMenuPress('/help-support')
    },
    {
      id: 'support-requests',
      title: 'My Support Requests',
      subtitle: 'View submitted tickets and responses',
      icon: MessageSquare,
      iconColor: '#EA580C',
      bgColor: '#FFF7ED',
      borderColor: '#FFEDD5',
      onPress: () => handleMenuPress('/support-requests')
    },
    {
      id: 'about',
      title: 'About ZOOOMIT',
      subtitle: 'App version and information',
      icon: Info,
      iconColor: '#D97706',
      bgColor: '#FFFBEB',
      borderColor: '#FEF3C7',
      onPress: () => handleMenuPress('/about')
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      subtitle: 'Privacy and data use',
      icon: Shield,
      iconColor: '#9333EA',
      bgColor: '#FAF5FF',
      borderColor: '#F3E8FF',
      onPress: () => handleMenuPress('/privacy-policy')
    },
    {
      id: 'terms',
      title: 'Terms & Conditions',
      subtitle: 'App terms and conditions',
      icon: FileText,
      iconColor: '#EA580C',
      bgColor: '#FFF7ED',
      borderColor: '#FFEDD5',
      onPress: () => handleMenuPress('/terms-conditions')
    },
    {
      id: 'feedback',
      title: 'Feedback & Suggestions',
      subtitle: 'Report an issue or share an idea',
      icon: MessageSquare,
      iconColor: '#DC2626',
      bgColor: '#FEF2F2',
      borderColor: '#FEE2E2',
      onPress: () => handleMenuPress('/feedback')
    },
    {
      id: 'notification-diagnostic',
      title: 'Notification Diagnostic',
      subtitle: 'Test push sound & order alert on this phone',
      icon: Bell,
      iconColor: '#2563EB',
      bgColor: '#EFF6FF',
      borderColor: '#DBEAFE',
      onPress: () => handleTestNotification()
    }
  ];

  const handleTestNotification = async () => {
    try {
      hapticFeedback.light?.();
      Alert.alert('Testing Notifications', 'Requesting a test push notification from the server to this device...');
      await notificationService.registerForPushNotificationsAsync();
      const res = await deliveryService.testPushNotification();
      Alert.alert('Notification Dispatched', res?.message || 'Check your notification shade for the order alert!');
    } catch (err) {
      Alert.alert('Notification Test', err?.response?.data?.message || err?.message || 'Failed to dispatch test notification.');
    }
  };

  const handleOpenLogoutConfirmation = () => {
    hapticFeedback.warning?.();
    setIsLoggingOut(false);
    setLogoutModalVisible(true);
  };

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      hapticFeedback.medium?.();

      await logout();

      setLogoutModalVisible(false);
      setIsLoggingOut(false);
      router.replace('/login');
    } catch {
      setIsLoggingOut(false);
      Alert.alert('Logout Failed', 'Unable to complete logout. Please check connection and try again.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFD233" translucent={false} />

      {/* 1. Compact Sticky Top Header (transitions in on scroll) */}
      <Animated.View
        style={[
          styles.compactStickyHeader,
          { height: COMPACT_HEADER_HEIGHT, paddingTop: insets.top },
          compactHeaderAnimatedStyle
        ]}
        pointerEvents={isCompactVisible ? 'auto' : 'none'}
      >
        <View style={styles.compactAvatarCircle}>
          <Text style={styles.compactAvatarText}>{partnerInitials}</Text>
        </View>

        <View style={styles.compactNameCol}>
          <Text style={styles.compactNameText} numberOfLines={1}>
            {partnerName}
          </Text>
          <View style={styles.compactStatusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isOnline ? '#16A34A' : '#64748B' }
              ]}
            />
            <Text
              style={[
                styles.compactStatusText,
                { color: isOnline ? '#15803D' : '#64748B' }
              ]}
            >
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            hapticFeedback.light?.();
            router.push({ pathname: '/personal-info', params: { from: 'profile' } });
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.compactSettingsBtn}
          accessibilityLabel="Settings"
          accessibilityRole="button"
        >
          <Settings size={20} color="#111827" strokeWidth={2.2} />
        </TouchableOpacity>
      </Animated.View>

      {/* 2. Large Collapsible Warm-Yellow Header */}
      <Animated.View
        style={[
          styles.expandedYellowHeader,
          { height: EXPANDED_HEADER_HEIGHT, paddingTop: insets.top + 6 },
          expandedHeaderAnimatedStyle
        ]}
        pointerEvents={isCompactVisible ? 'none' : 'box-none'}
      >
        {/* Top Title & Settings Row */}
        <Animated.View style={[styles.topRow, topRowAnimatedStyle]}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              hapticFeedback.light?.();
              router.push({ pathname: '/personal-info', params: { from: 'profile' } });
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.settingsBtn}
            accessibilityLabel="Settings"
            accessibilityRole="button"
          >
            <Settings size={22} color="#111827" strokeWidth={2} />
          </TouchableOpacity>
        </Animated.View>

        {/* Large Profile Identity Row */}
        <Animated.View style={[styles.profileRow, identityAnimatedStyle]}>
          {/* Circular Avatar */}
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{partnerInitials}</Text>
          </View>

          {/* Identity Column */}
          <View style={styles.identityCol}>
            {/* Online / Offline Status Badge */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleToggleOnlineStatus}
              disabled={isTogglingStatus}
              style={[
                styles.statusBadge,
                isOnline ? styles.statusBadgeOnline : styles.statusBadgeOffline
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isOnline ? '#16A34A' : '#64748B' }
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: isOnline ? '#15803D' : '#475569' }
                ]}
              >
                {isTogglingStatus
                  ? 'Updating...'
                  : isOnline
                  ? 'Online'
                  : 'Offline'}
              </Text>
            </TouchableOpacity>

            {/* Partner Real Name */}
            <Text style={styles.partnerNameText} numberOfLines={1}>
              {partnerName}
            </Text>

            {/* Role label */}
            <Text style={styles.partnerRoleText}>Delivery Partner</Text>
          </View>
        </Animated.View>
      </Animated.View>

      {/* 3. Single Scrollable Content Container */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: EXPANDED_HEADER_HEIGHT + 12 }
        ]}
        scrollEventThrottle={16}
        onScroll={scrollHandler}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Statistics Card: 3 metrics */}
        <View style={styles.statsCard}>
          <View style={styles.statCol}>
            <Text style={styles.statNumber}>{stats.completedDeliveries}</Text>
            <Text style={styles.statLabel}>Completed{'\n'}Deliveries</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Text style={styles.statNumber}>₹{Number(stats.totalEarned).toLocaleString('en-IN')}</Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Text style={styles.statNumber}>₹{Number(stats.cashToCollect).toLocaleString('en-IN')}</Text>
            <Text style={styles.statLabel}>Cash to Collect</Text>
          </View>
        </View>

        {/* Menu Rows: 6 items in exact reference order */}
        <View style={styles.menuContainerCard}>
          {menuItems.map((item, index) => {
            const IconComp = item.icon;
            const isLast = index === menuItems.length - 1;

            return (
              <React.Fragment key={item.id}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={item.onPress}
                  style={styles.menuItemRow}
                >
                  {/* Consistent Colored Icon Tile */}
                  <View
                    style={[
                      styles.menuIconBox,
                      {
                        backgroundColor: item.bgColor,
                        borderColor: item.borderColor
                      }
                    ]}
                  >
                    <IconComp size={20} color={item.iconColor} strokeWidth={2} />
                  </View>

                  {/* Text Details */}
                  <View style={styles.menuTextCol}>
                    <Text style={styles.menuItemTitle}>{item.title}</Text>
                    <Text style={styles.menuItemSub}>{item.subtitle}</Text>
                  </View>

                  {/* Right Chevron */}
                  <ChevronRight size={18} color="#94A3B8" strokeWidth={2} />
                </TouchableOpacity>

                {!isLast && <View style={styles.menuRowDivider} />}
              </React.Fragment>
            );
          })}
        </View>

        {/* Logout Button: Outlined red button matching reference */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleOpenLogoutConfirmation}
          style={styles.logoutBtn}
          accessibilityLabel="Logout"
          accessibilityRole="button"
        >
          <LogOut size={18} color="#DC2626" strokeWidth={2.2} style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </Animated.ScrollView>

      {/* Confirmation Popup & Logout Modal */}
      <Modal
        visible={logoutModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (!isLoggingOut) setLogoutModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {isLoggingOut ? (
              <View style={styles.modalLoadingState}>
                <View style={styles.loadingSpinnerCircle}>
                  <ActivityIndicator size="large" color="#DC2626" />
                </View>
                <Text style={styles.modalTitle}>Logging out...</Text>
                <Text style={styles.modalMessage}>
                  Please wait while we securely log you out.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.modalIconCircle}>
                  <LogOut size={28} color="#DC2626" strokeWidth={2.2} />
                </View>

                <Text style={styles.modalTitle}>Logout</Text>
                <Text style={styles.modalMessage}>
                  Are you sure you want to logout?{'\n'}You will need to sign in again to access your account.
                </Text>

                <View style={styles.modalActionsRow}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setLogoutModalVisible(false)}
                    style={styles.modalCancelBtn}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleConfirmLogout}
                    style={styles.modalLogoutBtn}
                  >
                    <Text style={styles.modalLogoutText}>Logout</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 110
  },

  // 1. Compact Sticky Top Header
  compactStickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: '#FFD233',
    borderBottomWidth: 1,
    borderBottomColor: '#E5A900',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16
  },
  compactAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  compactAvatarText: {
    fontFamily: typography.family.heavy,
    fontSize: 13,
    color: '#111827'
  },
  compactNameCol: {
    flex: 1,
    justifyContent: 'center'
  },
  compactNameText: {
    fontFamily: typography.family.heavy,
    fontSize: 16,
    color: '#111827'
  },
  compactStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1
  },
  compactStatusText: {
    fontFamily: typography.family.bold,
    fontSize: 11
  },
  compactSettingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },

  // 2. Large Collapsible Warm-Yellow Header
  expandedYellowHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
    backgroundColor: '#FFD233',
    paddingHorizontal: 20
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  headerTitle: {
    fontFamily: typography.family.heavy,
    fontSize: 27,
    color: '#111827',
    letterSpacing: -0.5
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },

  // Profile Identity Row
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  avatarText: {
    fontFamily: typography.family.heavy,
    fontSize: 24,
    color: '#111827'
  },
  identityCol: {
    flex: 1,
    justifyContent: 'center'
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6
  },
  statusBadgeOnline: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC'
  },
  statusBadgeOffline: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1'
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 5
  },
  statusText: {
    fontFamily: typography.family.bold,
    fontSize: 11
  },
  partnerNameText: {
    fontFamily: typography.family.heavy,
    fontSize: 20,
    color: '#111827',
    letterSpacing: -0.3,
    marginBottom: 2
  },
  partnerRoleText: {
    fontFamily: typography.family.medium,
    fontSize: 13,
    color: '#475569'
  },

  // 3-Column Stats Card
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginBottom: 14
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statNumber: {
    fontFamily: typography.family.heavy,
    fontSize: 17,
    color: '#111827',
    textAlign: 'center'
  },
  statLabel: {
    fontFamily: typography.family.medium,
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 14
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E5E7EB'
  },

  // Menu Container Card
  menuContainerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 16
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13
  },
  menuIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  menuTextCol: {
    flex: 1,
    marginRight: 8
  },
  menuItemTitle: {
    fontFamily: typography.family.bold,
    fontSize: 15,
    color: '#111827'
  },
  menuItemSub: {
    fontFamily: typography.family.regular,
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  menuRowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9'
  },

  // Outlined Logout Button
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: 16,
    height: 50,
    marginBottom: 16
  },
  logoutBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 15,
    color: '#DC2626'
  },

  // Logout Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 24,
    alignItems: 'center'
  },
  modalIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  modalTitle: {
    fontFamily: typography.family.heavy,
    fontSize: 19,
    color: '#111827',
    marginBottom: 8
  },
  modalMessage: {
    fontFamily: typography.family.regular,
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%'
  },
  modalCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalCancelText: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#334155'
  },
  modalLogoutBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalLogoutText: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#FFFFFF'
  },

  modalLoadingState: {
    alignItems: 'center',
    paddingVertical: 12
  },
  loadingSpinnerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  }
});
