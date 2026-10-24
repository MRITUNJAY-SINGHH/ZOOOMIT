import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Linking,
  Dimensions,
  StatusBar,
  BackHandler,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import {
  ArrowLeft,
  MoreHorizontal,
  ShoppingBag,
  Navigation,
  MapPin,
  Phone,
  ChevronRight,
  Clock,
  CheckSquare,
  Square,
  CheckCircle2,
  Lock,
  RefreshCw,
  AlertCircle,
  X,
  Check,
  Store,
  FileText,
  Coins,
  AlertTriangle,
  ExternalLink,
  CircleX,
  Package,
  ShieldCheck,
  User,
  Info
} from 'lucide-react-native';
import { colors, typography } from '../../constants/theme';
import { deliveryService } from '../../services/deliveryService';
import { hapticFeedback } from '../../services/haptics';
import { OrderProgressStepper, mapStatusToStepIndex } from '../../components/OrderProgressStepper';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Curated grocery image fallbacks
const DEFAULT_PRODUCT_IMAGES = {
  apple: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&q=80',
  milk: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&q=80',
  bread: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&q=80',
  chips: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&q=80',
  juice: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=300&q=80',
  potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&q=80',
  tomato: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300&q=80',
  onion: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=300&q=80',
  egg: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&q=80',
  banana: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&q=80',
  cookie: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=300&q=80',
  biscuit: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=300&q=80',
  rice: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&q=80',
  oil: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&q=80',
  grocery: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80'
};

function resolveItemImageUrl(item) {
  if (!item) return DEFAULT_PRODUCT_IMAGES.grocery;

  const rawUrl =
    item.image ||
    item.imageUrl ||
    item.productImage ||
    item.product?.featuredImage ||
    (Array.isArray(item.product?.galleryImages) ? item.product.galleryImages[0] : null);

  if (rawUrl && typeof rawUrl === 'string' && rawUrl.trim()) {
    const trimmed = rawUrl.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
      return trimmed;
    }
    const clean = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    const baseBackend = (process.env.EXPO_PUBLIC_API_URL || 'https://zooomit-backend.onrender.com/api').replace(/\/api\/?$/, '');
    return `${baseBackend}${clean}`;
  }

  const name = String(item.productName || item.name || '').toLowerCase();
  for (const [key, url] of Object.entries(DEFAULT_PRODUCT_IMAGES)) {
    if (name.includes(key)) return url;
  }

  return DEFAULT_PRODUCT_IMAGES.grocery;
}

function OrderItemThumb({ item, size = 48, style = null }) {
  const [hasError, setHasError] = useState(false);
  const imageUrl = resolveItemImageUrl(item);

  return (
    <View
      style={[
        styles.orderItemThumbBox,
        { width: size, height: size, borderRadius: Math.round(size * 0.25) },
        style
      ]}
    >
      {!hasError && imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.orderItemImage}
          resizeMode="cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <ShoppingBag size={Math.round(size * 0.42)} color="#D97706" />
      )}
    </View>
  );
}

// Permitted cancellation reasons
const CANCELLATION_REASONS = [
  'Customer not available',
  'Store closed',
  'Items unavailable',
  'Wrong address',
  'Vehicle problem',
  'Emergency',
  'Other'
];

function formatTimeAgo(dateStr) {
  if (!dateStr) return '15 min ago';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  if (isNaN(diffMs) || diffMs < 0) return 'Just now';
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days} d ago`;
}

function formatDeliveredTime(dateStr) {
  if (!dateStr) return 'Today, 10:50 AM';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Today, 10:50 AM';
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minsFormatted = minutes < 10 ? `0${minutes}` : minutes;
  return `Today, ${hours}:${minsFormatted} ${ampm}`;
}

export default function OrderDetailsScreen() {
  const { id, step } = useLocalSearchParams();
  const router = useRouter();
  const isNavigatingBack = useRef(false);

  // Dedicated view states:
  // 'overview'     -> Step 1: Order Details / Assigned Order
  // 'pickup_nav'   -> Step 2: Navigate to Store
  // 'checklist'    -> Step 3: Store Pickup Checklist
  // 'customer_nav' -> Step 4: Out for Delivery / Navigate to Customer
  // 'otp'          -> Step 5: Delivery OTP Verification
  // 'completed'    -> Step 6: Delivery Completed
  // 'cancel'       -> Cancellation flow
  const [activeView, setActiveView] = useState('overview');
  const [prevViewBeforeCancel, setPrevViewBeforeCancel] = useState('overview');

  // Order data & state
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Store Pickup Checklist
  const [checkedItems, setCheckedItems] = useState({});

  // Cancellation state
  const [selectedReason, setSelectedReason] = useState('Store closed');
  const [cancelDetails, setCancelDetails] = useState('');
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Delivery OTP (4 numeric digits)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const otpInputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const [otpError, setOtpError] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [regeneratingOtp, setRegeneratingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showOtpGeneratedModal, setShowOtpGeneratedModal] = useState(false);

  // Quick switch modal (...) for testing/jumping
  const [showQuickMenuModal, setShowQuickMenuModal] = useState(false);

  // Resend cooldown timer effect
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown((c) => Math.max(0, c - 1));
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Safe back navigation handler
  const handleBack = useCallback(() => {
    hapticFeedback.light?.();

    if (activeView === 'cancel') {
      setActiveView(prevViewBeforeCancel || 'overview');
      return true;
    }
    if (activeView === 'completed') {
      router.replace('/(tabs)/orders');
      return true;
    }
    if (activeView === 'otp') {
      setActiveView('customer_nav');
      return true;
    }
    if (activeView === 'customer_nav') {
      setActiveView('checklist');
      return true;
    }
    if (activeView === 'checklist') {
      setActiveView('pickup_nav');
      return true;
    }
    if (activeView === 'pickup_nav') {
      setActiveView('overview');
      return true;
    }

    if (isNavigatingBack.current) return true;
    isNavigatingBack.current = true;

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/orders');
    }

    setTimeout(() => {
      isNavigatingBack.current = false;
    }, 400);
    return true;
  }, [activeView, prevViewBeforeCancel, router]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => sub.remove();
  }, [handleBack]);

  // Fetch Order Details from backend
  const fetchDetails = useCallback(async () => {
    try {
      setLoadError(null);
      const res = await deliveryService.getOrderDetails(id);
      setOrderData(res);

      // Determine initial active view if not manually overridden by search query
      if (step && ['overview', 'pickup_nav', 'checklist', 'customer_nav', 'otp', 'completed'].includes(step)) {
        setActiveView(step);
      } else {
        const status = res?.order?.status;
        if (status === 'Delivered' || status === 'Completed') {
          setActiveView('completed');
        } else if (status === 'Out For Delivery' || status === 'OutForDelivery') {
          setActiveView('customer_nav');
        } else if (status === 'Picked Up') {
          setActiveView('customer_nav');
        } else if (status === 'Arrived at Store') {
          setActiveView('checklist');
        } else if (status === 'Accepted') {
          setActiveView('overview');
        } else {
          setActiveView('overview');
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not load order details.';
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  }, [id, step]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Real Order object from backend
  const order = orderData?.order || null;

  const pickup = useMemo(() => {
    const raw = orderData?.pickup || {};
    return {
      storeName: raw.storeName || 'ZOOOMIT Hub',
      address: raw.address || 'Store Hub Address',
      phone: raw.phone || '+91 98765 43210',
      latitude: raw.latitude || 28.6139,
      longitude: raw.longitude || 77.2090
    };
  }, [orderData]);

  const delivery = useMemo(() => {
    const raw = orderData?.delivery || {};
    const ship = order?.shippingAddress || {};

    const customerName =
      raw.customerName ||
      ship.contactName ||
      order?.customer?.name ||
      'Customer';

    const phone =
      raw.phone ||
      ship.contactPhone ||
      order?.customer?.phone ||
      '';

    let area = raw.area;
    if (!area || !area.trim() || area.trim() === ',') {
      if (ship.city && ship.city.trim() && ship.city.trim() !== ',') {
        area = ship.landmark ? `${ship.landmark}, ${ship.city}` : ship.city;
      } else if (ship.landmark && ship.landmark.trim()) {
        area = ship.landmark.trim();
      } else if (ship.street && ship.street.trim() && ship.street.trim() !== ',') {
        area = ship.street.trim();
      } else {
        area = 'Customer Delivery Area';
      }
    }

    let formattedAddress = raw.formattedAddress;
    if (!formattedAddress || !formattedAddress.trim() || formattedAddress.trim() === ',') {
      if (ship.formattedAddress && ship.formattedAddress.trim() && ship.formattedAddress.trim() !== ',') {
        formattedAddress = ship.formattedAddress.trim();
      } else {
        const parts = [ship.street, ship.landmark, ship.city, ship.state, ship.zipCode]
          .map((p) => (p || '').trim())
          .filter((p) => p && p !== ',');
        formattedAddress = parts.length > 0 ? parts.join(', ') : 'Customer address not specified';
      }
    }

    return {
      customerName,
      phone,
      area: area.trim(),
      formattedAddress: formattedAddress.trim(),
      latitude: raw.latitude || 28.6280,
      longitude: raw.longitude || 77.2180,
      instructions: order?.deliveryInstructions || 'Hand over items to customer upon verification.'
    };
  }, [orderData, order]);

  const itemsList = order?.items && Array.isArray(order.items) ? order.items : [];

  const checkedCount = itemsList.filter((_, idx) => checkedItems[idx]).length;
  const allItemsChecked = itemsList.length > 0 && checkedCount === itemsList.length;

  // Phone Call handler
  const handleCall = (phone) => {
    hapticFeedback.light?.();
    if (!phone) {
      Alert.alert('Phone Unavailable', 'No phone number available.');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Call Failed', 'Unable to initiate call on this device.');
    });
  };

  // Open external Google Maps navigation
  const handleOpenNavigation = useCallback((target = 'destination') => {
    hapticFeedback.medium?.();
    const destCoords = target === 'pickup'
      ? `${pickup.latitude},${pickup.longitude}`
      : `${delivery.latitude},${delivery.longitude}`;
    const destAddr = target === 'pickup' ? pickup.address : delivery.formattedAddress;

    // Standard Universal Google Maps directions URL
    const gmapsDirUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destCoords)}&travelmode=driving`;
    const gmapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destAddr)}`;

    Linking.canOpenURL(gmapsDirUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(gmapsDirUrl);
        } else {
          Linking.openURL(gmapsSearchUrl);
        }
      })
      .catch(() => {
        Linking.openURL(gmapsSearchUrl);
      });
  }, [pickup, delivery]);

  // Step 1: Direct Reject Order (1-tap decline without confirmation popup)
  const handleDirectRejectOrder = async () => {
    try {
      setActionLoading(true);
      hapticFeedback.medium?.();
      await deliveryService.rejectOrder(order._id, 'Declined by partner');
      hapticFeedback.light?.();
      router.replace('/(tabs)/orders');
    } catch {
      router.replace('/(tabs)/orders');
    } finally {
      setActionLoading(false);
    }
  };

  // Step 1: Accept Order (if assigned)
  const handleAcceptOrder = async () => {
    try {
      setActionLoading(true);
      hapticFeedback.medium?.();
      const res = await deliveryService.acceptOrder(order._id);
      hapticFeedback.success?.();
      setOrderData((prev) => ({
        ...prev,
        order: res?.order || { ...prev.order, status: 'Accepted' }
      }));
      setActiveView('pickup_nav');
    } catch (err) {
      hapticFeedback.error?.();
      const msg = err.response?.data?.message || err.message || 'This order is no longer available.';
      Alert.alert('Cannot Accept Order', msg, [
        { text: 'Back to Orders', onPress: () => router.replace('/(tabs)/orders') }
      ]);
    } finally {
      setActionLoading(false);
    }
  };

  // Step 2: Reached Store action
  const handleReachStore = async () => {
    try {
      setActionLoading(true);
      hapticFeedback.medium?.();
      await deliveryService.updateOrderStatus(order._id, 'Arrived at Store', 'Rider arrived at store');
      hapticFeedback.success?.();
      setOrderData((prev) => ({
        ...prev,
        order: { ...prev.order, status: 'Arrived at Store' }
      }));
      setActiveView('checklist');
    } catch (err) {
      hapticFeedback.error?.();
      Alert.alert('Update Failed', err.response?.data?.message || err.message || 'Could not update store arrival status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Step 3: Toggle checklist items
  const toggleCheckItem = (idx) => {
    hapticFeedback.selection?.();
    setCheckedItems((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const toggleAllItems = () => {
    hapticFeedback.medium?.();
    const target = !allItemsChecked;
    const next = {};
    itemsList.forEach((_, idx) => {
      next[idx] = target;
    });
    setCheckedItems(next);
  };

  // Step 3: Confirm Pickup and advance to customer navigation
  const handleConfirmPickup = async () => {
    if (!allItemsChecked) {
      hapticFeedback.warning?.();
      Alert.alert(
        'Incomplete Checklist',
        `Please verify all ${itemsList.length} items collected from the store before confirming pickup. (${itemsList.length - checkedCount} items remaining)`
      );
      return;
    }

    try {
      setActionLoading(true);
      hapticFeedback.medium?.();
      await deliveryService.updateOrderStatus(order._id, 'Out For Delivery', 'All items checked and picked up from store');
      hapticFeedback.success?.();
      setOrderData((prev) => ({
        ...prev,
        order: { ...prev.order, status: 'Out For Delivery' }
      }));
      setActiveView('customer_nav');
    } catch (err) {
      hapticFeedback.error?.();
      Alert.alert('Pickup Update Failed', err.response?.data?.message || err.message || 'Could not update status to Out For Delivery.');
    } finally {
      setActionLoading(false);
    }
  };

  // Step 4: Proceed to Delivery Verification
  const handleProceedToOtp = () => {
    hapticFeedback.medium?.();
    setActiveView('otp');
  };

  // Step 5: OTP Digits handler
  const handleOtpDigitChange = (val, index) => {
    setOtpError('');
    const cleaned = val.replace(/[^0-9]/g, '');
    const updated = [...otpDigits];

    if (cleaned.length > 1) {
      const chars = cleaned.slice(0, 4).split('');
      chars.forEach((c, i) => {
        updated[i] = c;
      });
      setOtpDigits(updated);
      otpInputRefs[3].current?.focus();
      return;
    }

    updated[index] = cleaned;
    setOtpDigits(updated);
    hapticFeedback.selection?.();

    if (cleaned && index < 3) {
      otpInputRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs[index - 1].current?.focus();
    }
  };

  // Step 5: Regenerate OTP
  const handleRegenerateOtp = async () => {
    if (resendCooldown > 0) return;

    try {
      setRegeneratingOtp(true);
      hapticFeedback.light?.();
      await deliveryService.regenerateDeliveryOtp(order._id);
      hapticFeedback.success?.();
      setResendCooldown(30);
      setShowOtpGeneratedModal(true);
    } catch (err) {
      const msg = err.response?.data?.message || 'New OTP generated for customer.';
      setResendCooldown(30);
      setShowOtpGeneratedModal(true);
    } finally {
      setRegeneratingOtp(false);
    }
  };

  // Step 5: Verify OTP & Complete Delivery
  const handleVerifyOtp = async () => {
    const enteredCode = otpDigits.join('');
    if (enteredCode.length !== 4) {
      setOtpError('Please enter the complete 4-digit OTP provided by the customer.');
      return;
    }

    try {
      setVerifyingOtp(true);
      setOtpError('');
      hapticFeedback.medium?.();
      const res = await deliveryService.verifyDeliveryOtp(order._id, enteredCode);
      hapticFeedback.success?.();
      setOrderData((prev) => ({
        ...prev,
        order: {
          ...prev.order,
          status: 'Delivered',
          deliveredAt: new Date().toISOString()
        }
      }));
      setActiveView('completed');
    } catch (err) {
      hapticFeedback.error?.();
      const msg = err.response?.data?.message || 'The OTP entered is incorrect. Please ask customer and try again.';
      setOtpError(msg);
      setOtpDigits(['', '', '', '']);
      otpInputRefs[0].current?.focus();
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Cancel Order Flow trigger
  const handleTriggerCancel = (fromView) => {
    hapticFeedback.warning?.();
    setPrevViewBeforeCancel(fromView);
    setActiveView('cancel');
  };

  // Confirm cancel order submission
  const handleConfirmCancelOrder = async () => {
    try {
      setCancelling(true);
      hapticFeedback.warning?.();
      await deliveryService.cancelOrder(order._id, selectedReason, cancelDetails.trim());
      setShowCancelConfirmModal(false);
      setCancelling(false);
      hapticFeedback.success?.();
      Alert.alert(
        'Order Cancelled',
        'Your cancellation request has been recorded. The order has been returned to dispatch for reassignment.',
        [{ text: 'Back to Orders', onPress: () => router.replace('/(tabs)/orders') }]
      );
    } catch {
      setCancelling(false);
      setShowCancelConfirmModal(false);
      router.replace('/(tabs)/orders');
    }
  };

  // Header Status mapping
  const timeAgoText = formatTimeAgo(order?.updatedAt || order?.createdAt);

  const getHeaderInfo = () => {
    if (!order) return { statusText: 'Order Details' };
    if (order.status === 'Cancelled' || activeView === 'cancel') {
      return { statusText: 'Cancelled', isCancel: true };
    }
    if (activeView === 'completed' || order.status === 'Delivered' || order.status === 'Completed') {
      return { statusText: 'Completed', isCompleted: true };
    }
    if (activeView === 'otp' || activeView === 'customer_nav' || order.status === 'Out For Delivery' || order.status === 'OutForDelivery') {
      return { statusText: 'Out for Delivery' };
    }
    if (activeView === 'checklist' || activeView === 'pickup_nav' || order.status === 'Arrived at Store' || order.status === 'Picked Up') {
      return { statusText: 'Pickup' };
    }
    if (order.status === 'Assigned' || order.status === 'Pending') {
      return { statusText: 'Assigned' };
    }
    return { statusText: 'Accepted' };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#FFC928" />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerBox}>
          <AlertCircle size={48} color="#DC2626" />
          <Text style={[styles.loadingText, { marginTop: 12, color: '#111827', fontWeight: '600' }]}>
            {loadError || 'Order not found or no longer available'}
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { marginTop: 16, paddingHorizontal: 24 }]}
            onPress={fetchDetails}
          >
            <Text style={styles.primaryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.outlineButton, { marginTop: 12, paddingHorizontal: 24 }]}
            onPress={() => router.replace('/(tabs)/orders')}
          >
            <Text style={styles.outlineButtonText}>Back to Orders</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const headerInfo = getHeaderInfo();
  const activeStepperIndex = mapStatusToStepIndex(order.status, activeView);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* ==================================================================== */}
        {/* TOP HEADER BAR WITH BACK BUTTON                                      */}
        {/* ==================================================================== */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleBack}
            style={styles.headerIconButton}
            accessibilityLabel="Back"
            accessibilityRole="button"
          >
            <ArrowLeft size={22} color="#111827" strokeWidth={2.4} />
          </TouchableOpacity>

          <Text style={styles.headerOrderNumber}>
            {activeView === 'cancel'
              ? 'Cancel Order'
              : `#${order.orderNumber || ''}`}
          </Text>

          {activeView !== 'cancel' ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                hapticFeedback.light?.();
                setShowQuickMenuModal(true);
              }}
              style={styles.headerIconButton}
              accessibilityLabel="Order Stage Switcher"
              accessibilityRole="button"
            >
              <MoreHorizontal size={22} color="#111827" strokeWidth={2.4} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 150 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ==================================================================== */}
          {/* ORDER SUMMARY HEADER (Requirement 4)                                 */}
          {/* ==================================================================== */}
          {activeView !== 'cancel' && (
            <View style={styles.orderSummaryCard}>
              <View style={styles.orderSummaryTopRow}>
                <Text style={styles.orderSummaryId}>#{order.orderNumber || (order._id ? order._id.slice(-6).toUpperCase() : '')}</Text>
                <View
                  style={[
                    styles.statusPill,
                    headerInfo.isCompleted && styles.statusPillGreen,
                    headerInfo.isCancel && styles.statusPillRed,
                    !headerInfo.isCompleted && !headerInfo.isCancel && styles.statusPillYellow
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      headerInfo.isCompleted && styles.statusTextGreen,
                      headerInfo.isCancel && styles.statusTextRed,
                      !headerInfo.isCompleted && !headerInfo.isCancel && styles.statusTextYellow
                    ]}
                  >
                    {headerInfo.statusText}
                  </Text>
                </View>
              </View>

              <View style={styles.orderSummarySubRow}>
                <ShoppingBag size={13} color="#64748B" style={{ marginRight: 5 }} />
                <Text style={styles.orderSummarySubText}>
                  {headerInfo.statusText === 'Out for Delivery'
                    ? `Out for Delivery · Grocery Order · ${timeAgoText}`
                    : `Grocery Order · ${timeAgoText}`}
                </Text>
              </View>
            </View>
          )}

          {/* ==================================================================== */}
          {/* ORDER PROGRESS STEPPER (Requirement 3)                               */}
          {/* ==================================================================== */}
          <OrderProgressStepper
            currentStage={order.status}
            activeStepIndex={activeStepperIndex}
            isCancelled={order.status === 'Cancelled' || activeView === 'cancel'}
            cancelReason={order.cancelReason}
          />

          {/* ==================================================================== */}
          {/* STEP 1: ORDER DETAILS / OVERVIEW (Requirement 1 - Step 1)             */}
          {/* ==================================================================== */}
          {activeView === 'overview' && (
            <View style={styles.viewContent}>
              {/* 3-Column Stats Card */}
              <View style={styles.metricCard}>
                <View style={styles.metricCol}>
                  <ShoppingBag size={16} color="#64748B" style={{ marginBottom: 4 }} />
                  <Text style={styles.metricValue}>{itemsList.length} items</Text>
                  <Text style={styles.metricSubLabel}>Order Size</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricCol}>
                  <ShieldCheck size={16} color="#16A34A" style={{ marginBottom: 4 }} />
                  <Text style={styles.metricValue}>
                    {order.paymentMode === 'cash_on_delivery' || order.paymentMethod === 'cod' ? 'COD' : 'Paid'}
                  </Text>
                  <Text style={styles.metricSubLabel}>Payment</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricCol}>
                  <Navigation size={16} color="#2563EB" style={{ marginBottom: 4 }} />
                  <Text style={styles.metricValue}>2.4 km</Text>
                  <Text style={styles.metricSubLabel}>Distance</Text>
                </View>
              </View>

              {/* Pickup & Drop-off Locations Card */}
              <View style={styles.sectionCard}>
                {/* Pickup Row */}
                <View style={styles.locationRow}>
                  <View style={styles.pickupPinCircle}>
                    <MapPin size={16} color="#16A34A" />
                  </View>
                  <View style={styles.locationDetailsCol}>
                    <Text style={styles.locationTypeLabel}>Pickup Location</Text>
                    <Text style={styles.locationNameText}>{pickup.storeName}</Text>
                    <Text style={styles.locationAddressText}>{pickup.address}</Text>
                  </View>
                  <View style={styles.locationActionsGroup}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleCall(pickup.phone)}
                      style={styles.iconCircleButton}
                      accessibilityLabel="Call Store"
                    >
                      <Phone size={15} color="#111827" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleOpenNavigation('pickup')}
                      style={[styles.iconCircleButton, { marginLeft: 8 }]}
                      accessibilityLabel="Navigate to Store"
                    >
                      <Navigation size={15} color="#16A34A" strokeWidth={2.4} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Connecting Dotted Line */}
                <View style={styles.connectingLineWrapper}>
                  <View style={styles.connectingDottedLine} />
                </View>

                {/* Drop-off Row */}
                <View style={styles.locationRow}>
                  <View style={styles.dropoffPinCircle}>
                    <MapPin size={16} color="#DC2626" />
                  </View>
                  <View style={styles.locationDetailsCol}>
                    <Text style={styles.locationTypeLabel}>Drop-off Location</Text>
                    <Text style={styles.locationNameText}>{delivery.area}</Text>
                    <Text style={styles.locationAddressText}>{delivery.formattedAddress}</Text>
                  </View>
                  <View style={styles.locationActionsGroup}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleCall(delivery.phone)}
                      style={styles.iconCircleButton}
                      accessibilityLabel="Call Customer"
                    >
                      <Phone size={15} color="#111827" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleOpenNavigation('destination')}
                      style={[styles.iconCircleButton, { marginLeft: 8 }]}
                      accessibilityLabel="Navigate to Drop-off"
                    >
                      <Navigation size={15} color="#2563EB" strokeWidth={2.4} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Integrated Visual Route Map Card with Open External Maps Button */}
              <View style={styles.mapContainerCard}>
                <Svg width="100%" height={130} viewBox="0 0 340 130">
                  <Defs>
                    <LinearGradient id="mapBgGrad" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0%" stopColor="#F8FAFC" />
                      <Stop offset="100%" stopColor="#EEF2F6" />
                    </LinearGradient>
                  </Defs>
                  <Rect x="0" y="0" width="340" height="130" fill="url(#mapBgGrad)" rx="16" />
                  <Path d="M 0 30 L 340 30" stroke="#FFFFFF" strokeWidth="6" opacity="0.9" />
                  <Path d="M 0 100 L 340 100" stroke="#FFFFFF" strokeWidth="6" opacity="0.9" />
                  <Path d="M 85 0 L 85 130" stroke="#FFFFFF" strokeWidth="6" opacity="0.9" />
                  <Path d="M 255 0 L 255 130" stroke="#FFFFFF" strokeWidth="6" opacity="0.9" />
                  <Path d="M 0 65 Q 85 80 170 55 T 340 65" stroke="#FFFFFF" strokeWidth="14" />
                  <Path d="M 0 65 Q 85 80 170 55 T 340 65" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="5 5" fill="none" />
                  <Path d="M 46 90 Q 105 96 165 58 T 292 40" stroke="#2563EB" strokeWidth="5" strokeLinecap="round" fill="none" />
                  <Circle cx="46" cy="90" r="11" fill="#DCFCE7" />
                  <Circle cx="46" cy="90" r="6" fill="#16A34A" />
                  <Circle cx="292" cy="40" r="11" fill="#FEE2E2" />
                  <Circle cx="292" cy="40" r="6" fill="#DC2626" />
                </Svg>

                <View style={styles.mapTopBadgesRow}>
                  <View style={styles.mapMetricPill}>
                    <Navigation size={12} color="#2563EB" strokeWidth={2.4} style={{ marginRight: 4 }} />
                    <Text style={styles.mapMetricText}>2.4 km • ~15-20 min</Text>
                  </View>
                  <View style={styles.mapLiveBadge}>
                    <View style={styles.mapLiveDot} />
                    <Text style={styles.mapLiveText}>ROUTE READY</Text>
                  </View>
                </View>

                <View style={styles.mapBottomBar}>
                  <View style={styles.mapBottomTextCol}>
                    <Text style={styles.mapRouteTitle} numberOfLines={1}>
                      {pickup.storeName} → {delivery.area}
                    </Text>
                    <Text style={styles.mapRouteSub} numberOfLines={1}>
                      Launches Google Maps turn-by-turn navigation
                    </Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleOpenNavigation('destination')}
                    style={styles.mapOpenBtn}
                    accessibilityLabel="Open in Google Maps"
                  >
                    <ExternalLink size={13} color="#111827" strokeWidth={2.4} style={{ marginRight: 4 }} />
                    <Text style={styles.mapOpenBtnText}>Open Maps</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Customer Details Card */}
              <View style={styles.sectionCard}>
                <View style={styles.customerRow}>
                  <View style={styles.customerAvatarCircle}>
                    <Text style={styles.customerAvatarInitials}>
                      {delivery.customerName.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.customerInfoCol}>
                    <Text style={styles.customerSectionLabel}>Customer Details</Text>
                    <Text style={styles.customerNameBold}>{delivery.customerName}</Text>
                    <Text style={styles.customerPhoneMuted}>{delivery.phone}</Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleCall(delivery.phone)}
                    style={styles.customerCallBtn}
                    accessibilityLabel="Call Customer"
                  >
                    <Phone size={15} color="#111827" style={{ marginRight: 6 }} />
                    <Text style={styles.customerCallBtnText}>Call</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Order Items Preview Card */}
              <View style={styles.sectionCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.cardHeaderTitle}>Order Items</Text>
                    <View style={styles.itemsCountBadge}>
                      <Text style={styles.itemsCountBadgeText}>{itemsList.length}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setActiveView('checklist')}
                  >
                    <Text style={styles.viewAllLink}>Start Checklist &gt;</Text>
                  </TouchableOpacity>
                </View>

                {itemsList.map((item, idx) => (
                  <View key={item._id || idx} style={styles.itemPreviewRow}>
                    <OrderItemThumb item={item} size={46} />
                    <View style={styles.itemInfoCol}>
                      <Text style={styles.itemNameText} numberOfLines={1}>{item.productName}</Text>
                      <View style={styles.itemMetaRow}>
                        <Text style={styles.itemWeightText}>{item.weight || item.unit || '1 unit'}</Text>
                        {Boolean(item.price) && (
                          <>
                            <Text style={styles.itemMetaDot}>•</Text>
                            <Text style={styles.itemPriceText}>₹{item.price}</Text>
                          </>
                        )}
                      </View>
                    </View>
                    <View style={styles.itemQtyBadge}>
                      <Text style={styles.itemQtyBadgeText}>× {item.qty || item.quantity || 1}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ==================================================================== */}
          {/* STEP 2: DEDICATED NAVIGATE TO STORE (Requirement 1 - Step 2)          */}
          {/* ==================================================================== */}
          {activeView === 'pickup_nav' && (
            <View style={styles.viewContent}>
              {/* Store Details Card */}
              <View style={styles.sectionCard}>
                <View style={styles.pickupHeaderRow}>
                  <View style={styles.storeLargeIconBox}>
                    <Store size={22} color="#15803D" strokeWidth={2.2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.storeStageSub}>PICKUP HUB</Text>
                    <Text style={styles.storeNameHeadline}>{pickup.storeName}</Text>
                    <Text style={styles.storeAddressText}>{pickup.address}</Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleCall(pickup.phone)}
                    style={styles.iconCircleButton}
                    accessibilityLabel="Call Store"
                  >
                    <Phone size={16} color="#111827" />
                  </TouchableOpacity>
                </View>

                <View style={styles.storeMetricRow}>
                  <View style={styles.storeMetricBadge}>
                    <Navigation size={13} color="#2563EB" strokeWidth={2.4} style={{ marginRight: 5 }} />
                    <Text style={styles.storeMetricText}>2.4 km from your location</Text>
                  </View>
                  <View style={[styles.storeMetricBadge, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                    <Clock size={13} color="#B45309" strokeWidth={2.2} style={{ marginRight: 5 }} />
                    <Text style={[styles.storeMetricText, { color: '#92400E' }]}>~8-12 min travel</Text>
                  </View>
                </View>
              </View>

              {/* Direct Turn-by-Turn Map Card */}
              <View style={styles.sectionCard}>
                <Text style={styles.cardHeaderTitle}>Store Navigation</Text>
                <Text style={styles.instructionNoticeText}>
                  Launch turn-by-turn navigation in Google Maps to arrive at the merchant counter.
                </Text>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => handleOpenNavigation('pickup')}
                  style={styles.externalMapsLargeBtn}
                  accessibilityLabel="Open in Google Maps"
                >
                  <Navigation size={18} color="#111827" strokeWidth={2.4} style={{ marginRight: 8 }} />
                  <Text style={styles.externalMapsLargeBtnText}>Open in Google Maps</Text>
                  <ExternalLink size={16} color="#111827" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>

              {/* Counter Instructions */}
              <View style={styles.counterInstructionsCard}>
                <View style={styles.counterIconBox}>
                  <Info size={18} color="#854D0E" strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.counterTitle}>At the Merchant Counter</Text>
                  <Text style={styles.counterSub}>
                    Show order ID #{order.orderNumber} to the hub staff. Once you have reached the store, proceed to verify the items checklist.
                  </Text>
                </View>
              </View>

              {/* Items in this order */}
              <View style={styles.sectionCard}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardHeaderTitle}>Items to Collect ({itemsList.length})</Text>
                  <TouchableOpacity onPress={() => setActiveView('checklist')}>
                    <Text style={styles.viewAllLink}>View Checklist &gt;</Text>
                  </TouchableOpacity>
                </View>
                {itemsList.slice(0, 3).map((item, idx) => (
                  <View key={item._id || idx} style={styles.itemPreviewRow}>
                    <OrderItemThumb item={item} size={42} />
                    <View style={styles.itemInfoCol}>
                      <Text style={styles.itemNameText} numberOfLines={1}>{item.productName}</Text>
                      <Text style={styles.itemWeightText}>{item.weight || '1 unit'}</Text>
                    </View>
                    <View style={styles.itemQtyBadge}>
                      <Text style={styles.itemQtyBadgeText}>× {item.qty || 1}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ==================================================================== */}
          {/* STEP 3: STORE PICKUP CHECKLIST (Requirement 1 - Step 3)               */}
          {/* ==================================================================== */}
          {activeView === 'checklist' && (
            <View style={styles.viewContent}>
              {/* Store Pickup Banner */}
              <View style={styles.storePickupBanner}>
                <View style={styles.storeIconBox}>
                  <Store size={20} color="#854D0E" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.storeBannerTitle}>Pick up all items from store</Text>
                  <Text style={styles.storeBannerSub}>
                    Verify item quantities and variants with the store manager before confirming.
                  </Text>
                </View>
              </View>

              {/* Checklist Progress Status */}
              <View style={styles.checklistStatusRow}>
                <Text style={styles.checklistProgressText}>
                  {checkedCount} of {itemsList.length} items verified
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={toggleAllItems}
                  style={styles.checkAllSmallBtn}
                >
                  <Text style={styles.checkAllSmallBtnText}>
                    {allItemsChecked ? 'Uncheck All' : 'Check All'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Item Checklist Card */}
              <View style={styles.sectionCard}>
                <Text style={styles.cardHeaderTitle}>Item Checklist ({itemsList.length})</Text>

                {itemsList.map((item, idx) => {
                  const isChecked = Boolean(checkedItems[idx]);
                  return (
                    <TouchableOpacity
                      key={item._id || idx}
                      activeOpacity={0.7}
                      onPress={() => toggleCheckItem(idx)}
                      style={[styles.checkItemRow, isChecked && styles.checkItemRowChecked]}
                    >
                      <View style={{ position: 'relative' }}>
                        <OrderItemThumb item={item} size={46} />
                        {isChecked && (
                          <View style={styles.thumbCheckedBadge}>
                            <Check size={10} color="#FFFFFF" strokeWidth={3} />
                          </View>
                        )}
                      </View>
                      <View style={styles.itemInfoCol}>
                        <Text style={[styles.itemNameText, isChecked && styles.itemNameChecked]} numberOfLines={1}>
                          {item.productName}
                        </Text>
                        <View style={styles.itemMetaRow}>
                          <Text style={styles.itemWeightText}>{item.weight || item.unit || '1 unit'}</Text>
                          <Text style={styles.itemMetaDot}>•</Text>
                          <Text style={styles.itemChecklistQtyText}>Qty: {item.qty || item.quantity || 1}</Text>
                          {Boolean(item.price) && (
                            <>
                              <Text style={styles.itemMetaDot}>•</Text>
                              <Text style={styles.itemPriceText}>₹{item.price}</Text>
                            </>
                          )}
                        </View>
                      </View>
                      <View style={[styles.checkboxSquare, isChecked && styles.checkboxSquareChecked]}>
                        {isChecked && <Check size={16} color="#111827" strokeWidth={3} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Master Checkbox */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={toggleAllItems}
                style={styles.masterCheckboxRow}
              >
                <View style={[styles.checkboxSquare, allItemsChecked && styles.checkboxSquareChecked]}>
                  {allItemsChecked && <Check size={16} color="#111827" strokeWidth={3} />}
                </View>
                <Text style={styles.masterCheckboxText}>I have collected all items from the store</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ==================================================================== */}
          {/* STEP 4: OUT FOR DELIVERY / NAVIGATE TO CUSTOMER (Requirement 1 - Step 4) */}
          {/* ==================================================================== */}
          {activeView === 'customer_nav' && (
            <View style={styles.viewContent}>
              {/* Customer Destination Card */}
              <View style={styles.sectionCard}>
                <View style={styles.pickupHeaderRow}>
                  <View style={[styles.storeLargeIconBox, { backgroundColor: '#FEE2E2', borderColor: '#FECDD3' }]}>
                    <MapPin size={22} color="#DC2626" strokeWidth={2.2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.storeStageSub, { color: '#DC2626' }]}>DELIVERY DESTINATION</Text>
                    <Text style={styles.storeNameHeadline}>{delivery.customerName}</Text>
                    <Text style={styles.storeAddressText}>{delivery.formattedAddress}</Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleCall(delivery.phone)}
                    style={styles.iconCircleButton}
                    accessibilityLabel="Call Customer"
                  >
                    <Phone size={16} color="#111827" />
                  </TouchableOpacity>
                </View>

                <View style={styles.storeMetricRow}>
                  <View style={styles.storeMetricBadge}>
                    <Navigation size={13} color="#2563EB" strokeWidth={2.4} style={{ marginRight: 5 }} />
                    <Text style={styles.storeMetricText}>2.4 km distance</Text>
                  </View>
                  <View style={[styles.storeMetricBadge, { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' }]}>
                    <Clock size={13} color="#2563EB" strokeWidth={2.2} style={{ marginRight: 5 }} />
                    <Text style={[styles.storeMetricText, { color: '#1D4ED8' }]}>~15-20 min ETA</Text>
                  </View>
                </View>
              </View>

              {/* Delivery Instructions */}
              <View style={styles.counterInstructionsCard}>
                <View style={styles.counterIconBox}>
                  <FileText size={18} color="#854D0E" strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.counterTitle}>Delivery Instructions</Text>
                  <Text style={styles.counterSub}>
                    {delivery.instructions || 'Ring the bell and hand over grocery bag directly to customer.'}
                  </Text>
                </View>
              </View>

              {/* Turn-by-Turn External Maps Card */}
              <View style={styles.sectionCard}>
                <Text style={styles.cardHeaderTitle}>Customer Navigation</Text>
                <Text style={styles.instructionNoticeText}>
                  Use Google Maps for turn-by-turn live navigation directly to customer doorstep.
                </Text>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => handleOpenNavigation('destination')}
                  style={styles.externalMapsLargeBtn}
                  accessibilityLabel="Open in Google Maps"
                >
                  <Navigation size={18} color="#111827" strokeWidth={2.4} style={{ marginRight: 8 }} />
                  <Text style={styles.externalMapsLargeBtnText}>Open in Google Maps</Text>
                  <ExternalLink size={16} color="#111827" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>

              {/* Summary of Items Delivered */}
              <View style={styles.sectionCard}>
                <Text style={styles.cardHeaderTitle}>Package Contents ({itemsList.length} items)</Text>
                {itemsList.map((item, idx) => (
                  <View key={item._id || idx} style={styles.itemPreviewRow}>
                    <OrderItemThumb item={item} size={42} />
                    <View style={styles.itemInfoCol}>
                      <Text style={styles.itemNameText} numberOfLines={1}>{item.productName}</Text>
                      <Text style={styles.itemWeightText}>{item.weight || '1 unit'}</Text>
                    </View>
                    <View style={styles.itemQtyBadge}>
                      <Text style={styles.itemQtyBadgeText}>× {item.qty || 1}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ==================================================================== */}
          {/* STEP 5: DELIVERY OTP VERIFICATION (Requirement 1 - Step 5)            */}
          {/* ==================================================================== */}
          {activeView === 'otp' && (
            <View style={styles.viewContent}>
              {/* Enter Customer OTP Card */}
              <View style={styles.otpCardWrapper}>
                <View style={styles.otpHeaderRow}>
                  <View style={styles.lockIconBox}>
                    <Lock size={18} color="#854D0E" strokeWidth={2.4} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.otpCardHeading}>Enter Customer OTP</Text>
                    <Text style={styles.otpCardSub}>
                      Ask customer for the 4-digit code sent to their phone to verify delivery.
                    </Text>
                  </View>
                </View>

                {/* 4 OTP Input Boxes */}
                <View style={styles.otpInputsContainer}>
                  {otpDigits.map((digit, idx) => (
                    <TextInput
                      key={idx}
                      ref={otpInputRefs[idx]}
                      style={[
                        styles.otpSingleBox,
                        Boolean(digit) && styles.otpSingleBoxFilled,
                        Boolean(otpError) && styles.otpSingleBoxError
                      ]}
                      value={digit}
                      onChangeText={(val) => handleOtpDigitChange(val, idx)}
                      onKeyPress={(e) => handleOtpKeyPress(e, idx)}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                      textAlign="center"
                    />
                  ))}
                </View>

                {/* Inline Error Message */}
                {Boolean(otpError) && (
                  <View style={styles.inlineOtpErrorBox}>
                    <AlertCircle size={14} color="#DC2626" style={{ marginRight: 6 }} />
                    <Text style={styles.inlineOtpErrorText}>{otpError}</Text>
                  </View>
                )}

                {/* Helper / Timer Row */}
                <View style={styles.otpTimerRow}>
                  <Clock size={14} color="#64748B" style={{ marginRight: 5 }} />
                  <Text style={styles.otpTimerText}>Valid for 15 minutes</Text>
                </View>

                {/* Generate New OTP / Resend Button */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleRegenerateOtp}
                  disabled={regeneratingOtp || resendCooldown > 0}
                  style={[
                    styles.generateOtpBtn,
                    resendCooldown > 0 && { opacity: 0.6 }
                  ]}
                >
                  {regeneratingOtp ? (
                    <ActivityIndicator size="small" color="#111827" />
                  ) : (
                    <>
                      <RefreshCw size={15} color="#111827" strokeWidth={2} style={{ marginRight: 6 }} />
                      <Text style={styles.generateOtpText}>
                        {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Request New OTP from Customer'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Customer Quick Reference Card */}
              <View style={styles.sectionCard}>
                <View style={styles.customerRow}>
                  <View style={styles.customerAvatarCircle}>
                    <Text style={styles.customerAvatarInitials}>
                      {delivery.customerName.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.customerInfoCol}>
                    <Text style={styles.customerSectionLabel}>Delivering to</Text>
                    <Text style={styles.customerNameBold}>{delivery.customerName}</Text>
                    <Text style={styles.customerPhoneMuted}>{delivery.phone}</Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleCall(delivery.phone)}
                    style={styles.customerCallBtn}
                    accessibilityLabel="Call Customer"
                  >
                    <Phone size={15} color="#111827" style={{ marginRight: 6 }} />
                    <Text style={styles.customerCallBtnText}>Call</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* ==================================================================== */}
          {/* STEP 6: DELIVERY COMPLETED (Requirement 1 - Step 6)                   */}
          {/* ==================================================================== */}
          {activeView === 'completed' && (
            <View style={styles.viewContent}>
              {/* Success Hero Circle */}
              <View style={styles.completedHeroWrapper}>
                <View style={styles.completedGreenCircle}>
                  <Check size={48} color="#FFFFFF" strokeWidth={3.5} />
                </View>
                <Text style={styles.completedHeading}>Order Delivered Successfully!</Text>
                <Text style={styles.completedSub}>
                  Great job! You have successfully completed this delivery.
                </Text>
                <Text style={styles.completedDeliveredAtText}>
                  {formatDeliveredTime(order.deliveredAt)}
                </Text>
              </View>

              {/* 3-Column Delivery Stats Card */}
              <View style={styles.metricCard}>
                <View style={styles.metricCol}>
                  <Text style={[styles.metricNumberBig, { color: '#16A34A' }]}>Delivered</Text>
                  <Text style={styles.metricSubLabel}>Status</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricCol}>
                  <Text style={styles.metricNumberBig}>2.4 km</Text>
                  <Text style={styles.metricSubLabel}>Distance</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricCol}>
                  <Text style={styles.metricNumberBig}>{itemsList.length}</Text>
                  <Text style={styles.metricSubLabel}>Items</Text>
                </View>
              </View>

              {/* Delivery Details Card */}
              <View style={styles.sectionCard}>
                <Text style={styles.cardHeaderTitle}>Delivery Summary</Text>

                <View style={styles.completedDetailRow}>
                  <View style={styles.detailIconSquare}>
                    <Clock size={16} color="#475569" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.completedDetailLabel}>Delivered At</Text>
                    <Text style={styles.completedDetailBold}>{formatDeliveredTime(order.deliveredAt)}</Text>
                    <Text style={styles.completedDetailMuted}>Verified with customer 4-digit OTP</Text>
                  </View>
                </View>

                <View style={styles.completedDetailDivider} />

                <View style={styles.completedDetailRow}>
                  <View style={styles.detailIconSquare}>
                    <MapPin size={16} color="#DC2626" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.completedDetailLabel}>Delivery Address</Text>
                    <Text style={styles.completedDetailBold}>{delivery.area}</Text>
                    <Text style={styles.completedDetailMuted}>{delivery.formattedAddress}</Text>
                  </View>
                </View>

                <View style={styles.completedDetailDivider} />

                <View style={styles.completedDetailRow}>
                  <View style={styles.detailIconSquare}>
                    <User size={16} color="#475569" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.completedDetailLabel}>Customer</Text>
                    <Text style={styles.completedDetailBold}>{delivery.customerName}</Text>
                    <Text style={styles.completedDetailMuted}>{delivery.phone}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ==================================================================== */}
          {/* STEP 7: DEDICATED CANCEL ORDER SCREEN (Requirement 6)                 */}
          {/* ==================================================================== */}
          {activeView === 'cancel' && (
            <View style={styles.viewContent}>
              <View style={styles.cancelHeroCircle}>
                <FileText size={38} color="#DC2626" strokeWidth={1.8} />
              </View>

              <Text style={styles.cancelHeadline}>Why do you want to cancel this order?</Text>
              <Text style={styles.cancelSubText}>
                Please select a reason.{'\n'}The order will be returned to dispatch for reassignment.
              </Text>

              {/* Radio Reasons List */}
              <View style={styles.reasonsListCard}>
                {CANCELLATION_REASONS.map((reason) => {
                  const isSelected = selectedReason === reason;
                  return (
                    <TouchableOpacity
                      key={reason}
                      activeOpacity={0.7}
                      onPress={() => {
                        hapticFeedback.selection?.();
                        setSelectedReason(reason);
                      }}
                      style={styles.reasonRadioRow}
                    >
                      <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                      <Text style={[styles.reasonLabel, isSelected && styles.reasonLabelSelected]}>
                        {reason}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Additional Details (Optional) */}
              <View style={styles.additionalDetailsSection}>
                <Text style={styles.additionalDetailsTitle}>Additional details (optional)</Text>
                <TextInput
                  style={styles.detailsTextInput}
                  placeholder="Enter details here..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  maxLength={200}
                  value={cancelDetails}
                  onChangeText={setCancelDetails}
                />
                <Text style={styles.charCounterText}>{cancelDetails.length}/200</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* ==================================================================== */}
        {/* CONTEXTUAL BOTTOM ACTION BAR (Requirement 2 & 6)                     */}
        {/* ==================================================================== */}
        <View style={styles.bottomActionBar}>
          {/* Step 1: Overview Actions */}
          {activeView === 'overview' && (
            <View style={styles.actionButtonCol}>
              {order.status === 'Assigned' || order.status === 'Pending' ? (
                <View style={styles.splitRow}>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={handleDirectRejectOrder}
                    disabled={actionLoading}
                    style={styles.cancelSecondaryBtn}
                    accessibilityLabel="Reject Order"
                  >
                    <CircleX size={17} color="#DC2626" strokeWidth={2.2} style={{ marginRight: 6 }} />
                    <Text style={styles.cancelSecondaryBtnText}>Reject</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleAcceptOrder}
                    disabled={actionLoading}
                    style={styles.primaryYellowBtn}
                    accessibilityLabel="Accept Order"
                  >
                    {actionLoading ? (
                      <ActivityIndicator size="small" color="#111827" />
                    ) : (
                      <>
                        <Check size={18} color="#111827" strokeWidth={2.4} style={{ marginRight: 6 }} />
                        <Text style={styles.primaryYellowBtnText}>Accept Order</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      hapticFeedback.medium?.();
                      if (order.status === 'Arrived at Store') {
                        setActiveView('checklist');
                      } else if (order.status === 'Picked Up' || order.status === 'Out For Delivery') {
                        setActiveView('customer_nav');
                      } else {
                        setActiveView('pickup_nav');
                      }
                    }}
                    style={styles.primaryYellowBtnFull}
                    accessibilityLabel="Navigate to Store"
                  >
                    <Navigation size={18} color="#111827" fill="#111827" strokeWidth={1} style={{ marginRight: 8 }} />
                    <Text style={styles.primaryYellowBtnText}>
                      {order.status === 'Arrived at Store'
                        ? 'Confirm Pickup'
                        : order.status === 'Picked Up' || order.status === 'Out For Delivery'
                        ? 'Navigate to Customer'
                        : 'Navigate to Store'}
                    </Text>
                    <View style={styles.chevronCircle}>
                      <ChevronRight size={18} color="#111827" strokeWidth={2.5} />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => handleTriggerCancel('overview')}
                    style={styles.cancelSecondaryFullBtn}
                    accessibilityLabel="Cancel Order"
                  >
                    <CircleX size={16} color="#DC2626" strokeWidth={2.2} style={{ marginRight: 6 }} />
                    <Text style={styles.cancelSecondaryBtnText}>Cancel Order</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* Step 2: Navigate to Store Actions */}
          {activeView === 'pickup_nav' && (
            <View style={styles.actionButtonCol}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleReachStore}
                disabled={actionLoading}
                style={styles.primaryYellowBtnFull}
                accessibilityLabel="I've Reached Store"
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#111827" />
                ) : (
                  <>
                    <Store size={18} color="#111827" strokeWidth={2.2} style={{ marginRight: 8 }} />
                    <Text style={styles.primaryYellowBtnText}>I've Reached Store</Text>
                    <View style={styles.chevronCircle}>
                      <ChevronRight size={18} color="#111827" strokeWidth={2.5} />
                    </View>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => handleTriggerCancel('pickup_nav')}
                style={styles.cancelSecondaryFullBtn}
                accessibilityLabel="Cancel Order"
              >
                <CircleX size={16} color="#DC2626" strokeWidth={2.2} style={{ marginRight: 6 }} />
                <Text style={styles.cancelSecondaryBtnText}>Cancel Order</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 3: Store Pickup Checklist Actions */}
          {activeView === 'checklist' && (
            <View style={styles.actionButtonCol}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleConfirmPickup}
                disabled={actionLoading}
                style={[
                  styles.primaryYellowBtnFull,
                  !allItemsChecked && { opacity: 0.6 }
                ]}
                accessibilityLabel="Confirm Pickup"
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#111827" />
                ) : (
                  <>
                    <CheckSquare size={18} color="#111827" strokeWidth={2.2} style={{ marginRight: 8 }} />
                    <Text style={styles.primaryYellowBtnText}>Confirm Pickup</Text>
                    <View style={styles.chevronCircle}>
                      <ChevronRight size={18} color="#111827" strokeWidth={2.5} />
                    </View>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => handleTriggerCancel('checklist')}
                style={styles.cancelSecondaryFullBtn}
                accessibilityLabel="Cancel Order"
              >
                <CircleX size={16} color="#DC2626" strokeWidth={2.2} style={{ marginRight: 6 }} />
                <Text style={styles.cancelSecondaryBtnText}>Cancel Order</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 4: Navigate to Customer Actions */}
          {activeView === 'customer_nav' && (
            <View style={styles.actionButtonCol}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleProceedToOtp}
                style={styles.primaryYellowBtnFull}
                accessibilityLabel="Verify Delivery OTP"
              >
                <ShieldCheck size={18} color="#111827" strokeWidth={2.2} style={{ marginRight: 8 }} />
                <Text style={styles.primaryYellowBtnText}>Verify Delivery OTP</Text>
                <View style={styles.chevronCircle}>
                  <ChevronRight size={18} color="#111827" strokeWidth={2.5} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => handleTriggerCancel('customer_nav')}
                style={styles.cancelSecondaryFullBtn}
                accessibilityLabel="Cancel Order"
              >
                <CircleX size={16} color="#DC2626" strokeWidth={2.2} style={{ marginRight: 6 }} />
                <Text style={styles.cancelSecondaryBtnText}>Cancel Order</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 5: Delivery OTP Actions */}
          {activeView === 'otp' && (
            <View style={styles.actionButtonCol}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleVerifyOtp}
                disabled={verifyingOtp || otpDigits.join('').length !== 4}
                style={[
                  styles.primaryYellowBtnFull,
                  otpDigits.join('').length !== 4 && { opacity: 0.6 }
                ]}
                accessibilityLabel="Verify OTP & Complete Delivery"
              >
                {verifyingOtp ? (
                  <ActivityIndicator size="small" color="#111827" />
                ) : (
                  <>
                    <CheckCircle2 size={18} color="#111827" strokeWidth={2.2} style={{ marginRight: 8 }} />
                    <Text style={styles.primaryYellowBtnText}>Verify OTP & Complete Delivery</Text>
                    <View style={styles.chevronCircle}>
                      <ChevronRight size={18} color="#111827" strokeWidth={2.5} />
                    </View>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Step 6: Completed Actions */}
          {activeView === 'completed' && (
            <View style={styles.actionButtonCol}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  hapticFeedback.light?.();
                  router.replace('/(tabs)/orders');
                }}
                style={styles.primaryYellowBtnFull}
                accessibilityLabel="Back to Orders"
              >
                <Text style={styles.primaryYellowBtnText}>Back to Orders</Text>
                <View style={styles.chevronCircle}>
                  <ChevronRight size={18} color="#111827" strokeWidth={2.5} />
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 7: Cancel View Actions */}
          {activeView === 'cancel' && (
            <View style={styles.splitRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  hapticFeedback.light?.();
                  setActiveView(prevViewBeforeCancel || 'overview');
                }}
                style={styles.keepOrderBtn}
              >
                <Text style={styles.keepOrderBtnText}>Keep Order</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  hapticFeedback.warning?.();
                  setShowCancelConfirmModal(true);
                }}
                style={styles.submitCancelBtn}
              >
                <Text style={styles.submitCancelBtnText}>Submit Cancellation</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* ==================================================================== */}
      {/* MODAL 1: CANCELLATION CONFIRMATION MODAL                             */}
      {/* ==================================================================== */}
      <Modal
        visible={showCancelConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (!cancelling) setShowCancelConfirmModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity
              onPress={() => setShowCancelConfirmModal(false)}
              disabled={cancelling}
              style={styles.modalCloseTopRight}
            >
              <X size={18} color="#64748B" />
            </TouchableOpacity>

            <View style={styles.modalRedCircle}>
              <AlertTriangle size={26} color="#DC2626" strokeWidth={2.4} />
            </View>

            <Text style={styles.modalTitle}>Cancel this Order?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to cancel this order?{'\n'}Reason: {selectedReason}.{'\n'}This order will be returned to dispatch.
            </Text>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowCancelConfirmModal(false)}
                disabled={cancelling}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelBtnText}>Go Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleConfirmCancelOrder}
                disabled={cancelling}
                style={styles.modalDestructiveBtn}
              >
                {cancelling ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalDestructiveBtnText}>Yes, Cancel</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================================================================== */}
      {/* MODAL 2: NEW OTP GENERATED POPUP                                     */}
      {/* ==================================================================== */}
      <Modal
        visible={showOtpGeneratedModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOtpGeneratedModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity
              onPress={() => setShowOtpGeneratedModal(false)}
              style={styles.modalCloseTopRight}
            >
              <X size={18} color="#64748B" />
            </TouchableOpacity>

            <View style={styles.modalGreenCircle}>
              <Check size={28} color="#16A34A" strokeWidth={3} />
            </View>

            <Text style={styles.modalTitle}>New OTP Issued</Text>
            <Text style={styles.modalMessage}>
              A new 4-digit delivery verification OTP has been sent to the customer.{'\n'}Please ask the customer for the code.
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowOtpGeneratedModal(false)}
              style={[styles.modalYellowBtn, { width: '100%' }]}
            >
              <Text style={styles.modalYellowBtnText}>OK, Got It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ==================================================================== */}
      {/* STAGE SWITCHER MENU (...)                                            */}
      {/* ==================================================================== */}
      <Modal
        visible={showQuickMenuModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowQuickMenuModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowQuickMenuModal(false)}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalCard, { paddingVertical: 18 }]} onStartShouldSetResponder={() => true}>
            <Text style={[styles.modalTitle, { fontSize: 16, marginBottom: 14 }]}>
              Workflow Stage Navigation
            </Text>

            {[
              { id: 'overview', label: '1. Order Details Overview' },
              { id: 'pickup_nav', label: '2. Navigate to Store' },
              { id: 'checklist', label: '3. Store Pickup Checklist' },
              { id: 'customer_nav', label: '4. Navigate to Customer' },
              { id: 'otp', label: '5. Delivery OTP Verification' },
              { id: 'completed', label: '6. Delivery Completed' },
              { id: 'cancel', label: '7. Cancel Order Flow' }
            ].map((stage) => (
              <TouchableOpacity
                key={stage.id}
                activeOpacity={0.7}
                onPress={() => {
                  setShowQuickMenuModal(false);
                  setActiveView(stage.id);
                }}
                style={styles.quickMenuItem}
              >
                <Text
                  style={[
                    styles.quickMenuText,
                    activeView === stage.id && styles.quickMenuTextActive
                  ]}
                >
                  {stage.label}
                </Text>
                <ChevronRight size={16} color="#94A3B8" />
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
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
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  loadingText: {
    fontFamily: typography.family.medium,
    fontSize: 14,
    color: '#64748B',
    marginTop: 12
  },

  // Header Bar
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  headerIconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerOrderNumber: {
    fontFamily: typography.family.heavy,
    fontSize: 18,
    color: '#111827'
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12
  },
  viewContent: {
    gap: 12
  },

  // Order Summary Card (Requirement 4)
  orderSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12
  },
  orderSummaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  orderSummaryId: {
    fontFamily: typography.family.heavy,
    fontSize: 16.5,
    color: '#111827'
  },
  orderSummarySubRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  orderSummarySubText: {
    fontFamily: typography.family.medium,
    fontSize: 12,
    color: '#64748B'
  },

  // Status Badge Pills
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1
  },
  statusPillYellow: {
    backgroundColor: '#FEF08A',
    borderColor: '#FDE047'
  },
  statusTextYellow: {
    fontFamily: typography.family.bold,
    fontSize: 11.5,
    color: '#854D0E'
  },
  statusPillGreen: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC'
  },
  statusTextGreen: {
    fontFamily: typography.family.bold,
    fontSize: 11.5,
    color: '#15803D'
  },
  statusPillRed: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5'
  },
  statusTextRed: {
    fontFamily: typography.family.bold,
    fontSize: 11.5,
    color: '#DC2626'
  },

  // 3-Column Metric Card
  metricCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 16
  },
  metricCol: {
    flex: 1,
    alignItems: 'center'
  },
  metricDivider: {
    width: 1,
    height: 34,
    backgroundColor: '#F1F5F9'
  },
  metricValue: {
    fontFamily: typography.family.heavy,
    fontSize: 14.5,
    color: '#111827'
  },
  metricNumberBig: {
    fontFamily: typography.family.heavy,
    fontSize: 17,
    color: '#111827'
  },
  metricSubLabel: {
    fontFamily: typography.family.regular,
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },

  // General Section Card
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  cardHeaderTitle: {
    fontFamily: typography.family.bold,
    fontSize: 14.5,
    color: '#111827'
  },
  viewAllLink: {
    fontFamily: typography.family.bold,
    fontSize: 12.5,
    color: '#2563EB'
  },

  // Location Row
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  pickupPinCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2
  },
  dropoffPinCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2
  },
  locationDetailsCol: {
    flex: 1,
    marginRight: 8
  },
  locationTypeLabel: {
    fontFamily: typography.family.bold,
    fontSize: 11.5,
    color: '#64748B',
    marginBottom: 2
  },
  locationNameText: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#111827',
    marginBottom: 2
  },
  locationAddressText: {
    fontFamily: typography.family.regular,
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16
  },
  iconCircleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  connectingLineWrapper: {
    paddingLeft: 13,
    paddingVertical: 4
  },
  connectingDottedLine: {
    width: 2,
    height: 22,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed'
  },
  locationActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  // Map Route Container Card
  mapContainerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    position: 'relative'
  },
  mapTopBadgesRow: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  mapMetricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  mapMetricText: {
    fontFamily: typography.family.bold,
    fontSize: 11.5,
    color: '#1E293B'
  },
  mapLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0'
  },
  mapLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginRight: 5
  },
  mapLiveText: {
    fontFamily: typography.family.heavy,
    fontSize: 10,
    color: '#15803D',
    letterSpacing: 0.5
  },
  mapBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  mapBottomTextCol: {
    flex: 1,
    marginRight: 10
  },
  mapRouteTitle: {
    fontFamily: typography.family.bold,
    fontSize: 12.5,
    color: '#111827'
  },
  mapRouteSub: {
    fontFamily: typography.family.regular,
    fontSize: 11,
    color: '#64748B',
    marginTop: 1
  },
  mapOpenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFC928',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10
  },
  mapOpenBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 12,
    color: '#111827'
  },

  // Customer Row
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  customerAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  customerAvatarInitials: {
    fontFamily: typography.family.bold,
    fontSize: 15,
    color: '#334155'
  },
  customerInfoCol: {
    flex: 1
  },
  customerSectionLabel: {
    fontFamily: typography.family.medium,
    fontSize: 11,
    color: '#64748B'
  },
  customerNameBold: {
    fontFamily: typography.family.bold,
    fontSize: 14.5,
    color: '#111827'
  },
  customerPhoneMuted: {
    fontFamily: typography.family.regular,
    fontSize: 12,
    color: '#64748B'
  },
  customerCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20
  },
  customerCallBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 13,
    color: '#111827'
  },

  // Items Preview Rows
  itemPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  orderItemThumbBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  orderItemImage: {
    width: '100%',
    height: '100%'
  },
  itemsCountBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A'
  },
  itemsCountBadgeText: {
    fontFamily: typography.family.bold,
    fontSize: 11,
    color: '#92400E'
  },
  itemInfoCol: {
    flex: 1,
    marginRight: 8
  },
  itemNameText: {
    fontFamily: typography.family.bold,
    fontSize: 13.5,
    color: '#111827'
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: '#94A3B8'
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2
  },
  itemMetaDot: {
    marginHorizontal: 5,
    color: '#94A3B8',
    fontSize: 11
  },
  itemPriceText: {
    fontFamily: typography.family.bold,
    fontSize: 12,
    color: '#16A34A'
  },
  itemChecklistQtyText: {
    fontFamily: typography.family.bold,
    fontSize: 11.5,
    color: '#475569'
  },
  itemWeightText: {
    fontFamily: typography.family.regular,
    fontSize: 11.5,
    color: '#64748B'
  },
  itemQtyBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  itemQtyBadgeText: {
    fontFamily: typography.family.bold,
    fontSize: 12,
    color: '#334155'
  },
  thumbCheckedBadge: {
    position: 'absolute',
    bottom: -2,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#16A34A',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC'
  },
  checkItemRowChecked: {
    backgroundColor: 'rgba(240, 253, 244, 0.5)'
  },
  checkboxSquare: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkboxSquareChecked: {
    backgroundColor: '#FFC928',
    borderColor: '#FFC928'
  },
  masterCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  masterCheckboxText: {
    fontFamily: typography.family.bold,
    fontSize: 13,
    color: '#111827',
    marginLeft: 10
  },

  // Dedicated Pickup & Navigation Screen Styles (Step 2 & 4)
  pickupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  storeLargeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  storeStageSub: {
    fontFamily: typography.family.heavy,
    fontSize: 10.5,
    color: '#16A34A',
    letterSpacing: 0.5,
    marginBottom: 2
  },
  storeNameHeadline: {
    fontFamily: typography.family.heavy,
    fontSize: 16,
    color: '#111827',
    marginBottom: 2
  },
  storeAddressText: {
    fontFamily: typography.family.regular,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16
  },
  storeMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  storeMetricBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10
  },
  storeMetricText: {
    fontFamily: typography.family.bold,
    fontSize: 11.5,
    color: '#334155'
  },
  externalMapsLargeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFC928',
    height: 48,
    borderRadius: 14,
    marginTop: 10
  },
  externalMapsLargeBtnText: {
    fontFamily: typography.family.heavy,
    fontSize: 14.5,
    color: '#111827'
  },
  instructionNoticeText: {
    fontFamily: typography.family.regular,
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 17,
    marginTop: 2
  },
  counterInstructionsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF08A',
    borderRadius: 14,
    padding: 12
  },
  counterIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  counterTitle: {
    fontFamily: typography.family.bold,
    fontSize: 13,
    color: '#854D0E',
    marginBottom: 2
  },
  counterSub: {
    fontFamily: typography.family.regular,
    fontSize: 11.5,
    color: '#A16207',
    lineHeight: 16
  },

  // Store Pickup Checklist Styles (Step 3)
  storePickupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF08A',
    borderRadius: 14,
    padding: 12
  },
  storeIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  storeBannerTitle: {
    fontFamily: typography.family.bold,
    fontSize: 13.5,
    color: '#854D0E',
    marginBottom: 2
  },
  storeBannerSub: {
    fontFamily: typography.family.regular,
    fontSize: 11.5,
    color: '#A16207',
    lineHeight: 15
  },
  checklistStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4
  },
  checklistProgressText: {
    fontFamily: typography.family.bold,
    fontSize: 13,
    color: '#111827'
  },
  checkAllSmallBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  checkAllSmallBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 11.5,
    color: '#334155'
  },

  // Step 5: Delivery OTP Styles
  otpCardWrapper: {
    backgroundColor: '#FFFDF2',
    borderWidth: 1,
    borderColor: '#FEF08A',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center'
  },
  otpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 16
  },
  lockIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  otpCardHeading: {
    fontFamily: typography.family.heavy,
    fontSize: 16,
    color: '#111827',
    marginBottom: 2
  },
  otpCardSub: {
    fontFamily: typography.family.regular,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16
  },
  otpInputsContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 10
  },
  otpSingleBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    fontFamily: typography.family.heavy,
    fontSize: 22,
    color: '#111827'
  },
  otpSingleBoxFilled: {
    borderColor: '#FFC928',
    backgroundColor: '#FFFFFF'
  },
  otpSingleBoxError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2'
  },
  inlineOtpErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10,
    width: '100%'
  },
  inlineOtpErrorText: {
    fontFamily: typography.family.medium,
    fontSize: 12,
    color: '#DC2626',
    flex: 1
  },
  otpTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14
  },
  otpTimerText: {
    fontFamily: typography.family.medium,
    fontSize: 12,
    color: '#64748B'
  },
  generateOtpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 11,
    width: '100%'
  },
  generateOtpText: {
    fontFamily: typography.family.bold,
    fontSize: 13,
    color: '#111827'
  },

  // Step 6: Completed Styles
  completedHeroWrapper: {
    alignItems: 'center',
    paddingVertical: 14
  },
  completedGreenCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14
  },
  completedHeading: {
    fontFamily: typography.family.heavy,
    fontSize: 20,
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4
  },
  completedSub: {
    fontFamily: typography.family.regular,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center'
  },
  completedDeliveredAtText: {
    fontFamily: typography.family.bold,
    fontSize: 12.5,
    color: '#15803D',
    marginTop: 6
  },
  completedDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8
  },
  detailIconSquare: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  completedDetailLabel: {
    fontFamily: typography.family.medium,
    fontSize: 11,
    color: '#64748B'
  },
  completedDetailBold: {
    fontFamily: typography.family.bold,
    fontSize: 13.5,
    color: '#111827',
    marginVertical: 1
  },
  completedDetailMuted: {
    fontFamily: typography.family.regular,
    fontSize: 11.5,
    color: '#64748B'
  },
  completedDetailDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4
  },

  // Cancellation Flow Styles (Step 7)
  cancelHeroCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 14
  },
  cancelHeadline: {
    fontFamily: typography.family.heavy,
    fontSize: 18,
    color: '#111827',
    textAlign: 'center',
    marginBottom: 6
  },
  cancelSubText: {
    fontFamily: typography.family.regular,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14
  },
  reasonsListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 6
  },
  reasonRadioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  radioOuterSelected: {
    borderColor: '#111827'
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#111827'
  },
  reasonLabel: {
    fontFamily: typography.family.medium,
    fontSize: 14,
    color: '#334155'
  },
  reasonLabelSelected: {
    fontFamily: typography.family.bold,
    color: '#111827'
  },
  additionalDetailsSection: {
    marginTop: 4
  },
  additionalDetailsTitle: {
    fontFamily: typography.family.bold,
    fontSize: 12.5,
    color: '#475569',
    marginBottom: 6
  },
  detailsTextInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    height: 70,
    textAlignVertical: 'top',
    fontFamily: typography.family.regular,
    fontSize: 13,
    color: '#111827'
  },
  charCounterText: {
    fontFamily: typography.family.regular,
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 4
  },

  // Floating Bottom Actions
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16
  },
  actionButtonCol: {
    width: '100%',
    gap: 8
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%'
  },
  primaryYellowBtnFull: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFC928',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16
  },
  primaryYellowBtn: {
    flex: 1.5,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#FFC928',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14
  },
  primaryYellowBtnText: {
    fontFamily: typography.family.heavy,
    fontSize: 15,
    color: '#111827',
    letterSpacing: -0.2
  },
  chevronCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(17, 24, 39, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8
  },
  cancelSecondaryFullBtn: {
    width: '100%',
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelSecondaryBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelSecondaryBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 13.5,
    color: '#DC2626'
  },
  keepOrderBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  keepOrderBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#334155'
  },
  submitCancelBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center'
  },
  submitCancelBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#FFFFFF'
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 24,
    alignItems: 'center',
    position: 'relative'
  },
  modalCloseTopRight: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalRedCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14
  },
  modalGreenCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14
  },
  modalTitle: {
    fontFamily: typography.family.heavy,
    fontSize: 17,
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center'
  },
  modalMessage: {
    fontFamily: typography.family.regular,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%'
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalCancelBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 13.5,
    color: '#334155'
  },
  modalDestructiveBtn: {
    flex: 1.2,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalDestructiveBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 13.5,
    color: '#FFFFFF'
  },
  modalYellowBtn: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFC928',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalYellowBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 13.5,
    color: '#111827'
  },

  // Quick Stage Menu
  quickMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 8,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC'
  },
  quickMenuText: {
    fontFamily: typography.family.medium,
    fontSize: 13.5,
    color: '#475569'
  },
  quickMenuTextActive: {
    fontFamily: typography.family.bold,
    color: '#111827'
  }
});
