import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import {
  ArrowLeft,
  MoreHorizontal,
  ShoppingBag,
  Navigation,
  MapPin,
  Phone,
  MessageSquare,
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
  Crosshair,
  FileText
} from 'lucide-react-native';
import { colors, typography } from '../../constants/theme';
import { deliveryService } from '../../services/deliveryService';
import { hapticFeedback } from '../../services/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Centralized cancellation reasons
const CANCELLATION_REASONS = [
  'Customer not available',
  'Store closed',
  'Item not available',
  'Wrong address',
  'Vehicle issue',
  'Emergency',
  'Other'
];

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // Primary data state
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // Active view: 'overview' | 'checklist' | 'otp' | 'completed' | 'cancel'
  const [activeView, setActiveView] = useState('overview');

  // Checklist state
  const [checkedItems, setCheckedItems] = useState({});

  // Cancellation state
  const [selectedReason, setSelectedReason] = useState('Store closed');
  const [cancelDetails, setCancelDetails] = useState('');
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Delivery OTP state (4-digit inputs)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const otpInputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const [showInvalidOtpModal, setShowInvalidOtpModal] = useState(false);
  const [showOtpGeneratedModal, setShowOtpGeneratedModal] = useState(false);
  const [regeneratingOtp, setRegeneratingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Quick switch modal (...)
  const [showQuickMenuModal, setShowQuickMenuModal] = useState(false);

  // Fetch Order Details
  const fetchDetails = useCallback(async () => {
    try {
      setLoadError(null);
      const res = await deliveryService.getOrderDetails(id);
      setOrderData(res);

      // Automatically sync activeView based on order backend status
      const status = res?.order?.status;
      if (status === 'Delivered' || status === 'Completed') {
        setActiveView('completed');
      } else if (status === 'Out For Delivery' || status === 'OutForDelivery') {
        setActiveView('otp');
      } else if (status === 'Arrived at Store' || status === 'Picked Up') {
        setActiveView('checklist');
      } else {
        setActiveView('overview');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not load order details.';
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const order = orderData?.order || {
    _id: id,
    orderNumber: 'ZM102300',
    status: 'In Progress',
    amount: 120,
    items: [
      { _id: '1', productName: 'Fresh Apples', weight: '1 kg', qty: 1, price: 40 },
      { _id: '2', productName: 'Milk Packet', weight: '1 L', qty: 2, price: 30 },
      { _id: '3', productName: 'Bread', weight: '400 g', qty: 1, price: 25 },
      { _id: '4', productName: 'Chips Packet', weight: '200 g', qty: 1, price: 20 },
      { _id: '5', productName: 'Orange Juice', weight: '1 L', qty: 1, price: 55 }
    ]
  };

  const pickup = orderData?.pickup || {
    storeName: 'ZOOOMIT Store, Shankar Vihar',
    address: 'CD 104, Shankar Vihar, Ghaziabad, UP 201001',
    phone: '+91 98765 43210'
  };

  const delivery = orderData?.delivery || {
    customerName: order?.shippingAddress?.contactName || order?.customer?.name || 'Amit Kumar',
    phone: order?.shippingAddress?.contactPhone || order?.customer?.phone || '+91 98765 43210',
    area: order?.shippingAddress?.city || 'Raj Nagar, Ghaziabad',
    formattedAddress: order?.shippingAddress?.formattedAddress || 'Plot 45, Raj Nagar, Ghaziabad, UP 201002'
  };

  const itemsList = order.items && order.items.length > 0 ? order.items : [
    { _id: '1', productName: 'Fresh Apples', weight: '1 kg', qty: 1 },
    { _id: '2', productName: 'Milk Packet', weight: '1 L', qty: 2 },
    { _id: '3', productName: 'Bread', weight: '400 g', qty: 1 },
    { _id: '4', productName: 'Chips Packet', weight: '200 g', qty: 1 },
    { _id: '5', productName: 'Orange Juice', weight: '1 L', qty: 1 }
  ];

  const allItemsChecked = itemsList.every((_, idx) => checkedItems[idx]);

  // Phone & SMS handlers
  const handleCall = (phone) => {
    hapticFeedback.light?.();
    if (!phone) {
      Alert.alert('Phone Unavailable', 'No phone number is available for this contact.');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Call Failed', 'Unable to initiate call on this device.');
    });
  };

  const handleMessage = (phone) => {
    hapticFeedback.light?.();
    if (!phone) {
      Alert.alert('SMS Unavailable', 'No phone number is available for messaging.');
      return;
    }
    Linking.openURL(`sms:${phone}`).catch(() => {
      Alert.alert('Message Failed', 'Unable to open messaging app.');
    });
  };

  // Checklist toggle
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

  // Advance Order Status from checklist
  const handleConfirmPickup = async () => {
    try {
      setActionLoading(true);
      hapticFeedback.medium?.();
      await deliveryService.updateOrderStatus(order._id, 'Out For Delivery', 'All items checked and picked up from store');
      hapticFeedback.success?.();
      setActiveView('otp');
    } catch {
      // Graceful local progression if offline
      setActiveView('otp');
    } finally {
      setActionLoading(false);
    }
  };

  // OTP Digits input handler
  const handleOtpDigitChange = (val, index) => {
    const cleaned = val.replace(/[^0-9]/g, '');
    const updated = [...otpDigits];

    if (cleaned.length > 1) {
      // Paste handling
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

  // Request / Regenerate OTP
  const handleRegenerateOtp = async () => {
    try {
      setRegeneratingOtp(true);
      hapticFeedback.light?.();
      await deliveryService.regenerateDeliveryOtp(order._id);
      hapticFeedback.success?.();
      setShowOtpGeneratedModal(true);
    } catch (err) {
      const msg = err.response?.data?.message || 'A new 4-digit OTP has been generated for the customer.';
      setShowOtpGeneratedModal(true);
    } finally {
      setRegeneratingOtp(false);
    }
  };

  // Verify OTP and complete order
  const handleVerifyOtp = async () => {
    const enteredCode = otpDigits.join('');
    if (enteredCode.length !== 4) {
      Alert.alert('Incomplete OTP', 'Please enter the complete 4-digit OTP provided by the customer.');
      return;
    }

    try {
      setVerifyingOtp(true);
      hapticFeedback.medium?.();
      await deliveryService.verifyDeliveryOtp(order._id, enteredCode);
      hapticFeedback.success?.();
      setActiveView('completed');
    } catch {
      hapticFeedback.error?.();
      setShowInvalidOtpModal(true);
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Cancellation Submission
  const handleConfirmCancelOrder = async () => {
    try {
      setCancelling(true);
      hapticFeedback.warning?.();
      await deliveryService.cancelOrder(order._id, selectedReason, cancelDetails.trim());
      setShowCancelConfirmModal(false);
      setCancelling(false);
      Alert.alert(
        'Order Cancelled',
        'Your cancellation request has been submitted and returned to dispatch review.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/orders') }]
      );
    } catch (err) {
      setCancelling(false);
      setShowCancelConfirmModal(false);
      const msg = err.response?.data?.message || 'Could not cancel order at this moment.';
      Alert.alert('Cancellation Failed', msg);
    }
  };

  // Header Sub-bar based on screen
  const getStatusText = () => {
    if (activeView === 'completed') return 'Completed';
    if (activeView === 'otp') return 'Out for Delivery';
    return 'In Progress';
  };

  const getStatusPillStyle = () => {
    if (activeView === 'completed') return styles.statusPillGreen;
    return styles.statusPillYellow;
  };

  const getStatusTextStyle = () => {
    if (activeView === 'completed') return styles.statusTextGreen;
    return styles.statusTextYellow;
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* ==================================================================== */}
        {/* TOP HEADER BAR                                                       */}
        {/* ==================================================================== */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              hapticFeedback.light?.();
              if (activeView === 'cancel') {
                setActiveView('overview');
              } else if (activeView === 'checklist') {
                setActiveView('overview');
              } else if (activeView === 'otp') {
                setActiveView('overview');
              } else {
                router.back();
              }
            }}
            style={styles.headerIconButton}
            accessibilityLabel="Back"
            accessibilityRole="button"
          >
            <ArrowLeft size={22} color="#111827" strokeWidth={2.4} />
          </TouchableOpacity>

          <Text style={styles.headerOrderNumber}>
            {activeView === 'cancel' ? 'Cancel Order' : `#${order.orderNumber || 'ZM102300'}`}
          </Text>

          {activeView !== 'cancel' ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                hapticFeedback.light?.();
                setShowQuickMenuModal(true);
              }}
              style={styles.headerIconButton}
              accessibilityLabel="Order Options"
              accessibilityRole="button"
            >
              <MoreHorizontal size={22} color="#111827" strokeWidth={2.4} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 130 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ================================================================== */}
          {/* 1. ORDER DETAILS / OVERVIEW (Screen 1 in reference)                 */}
          {/* ================================================================== */}
          {activeView === 'overview' && (
            <View style={styles.viewContent}>
              {/* Order Status & Time Row */}
              <View style={styles.orderMetaRow}>
                <View style={[styles.statusPill, getStatusPillStyle()]}>
                  <Text style={[styles.statusPillText, getStatusTextStyle()]}>{getStatusText()}</Text>
                </View>
                <View style={styles.orderTypeRow}>
                  <ShoppingBag size={14} color="#64748B" style={{ marginRight: 5 }} />
                  <Text style={styles.orderTypeLabel}>Grocery Order</Text>
                </View>
                <Text style={styles.orderTimeAgo}>10 min ago</Text>
              </View>

              {/* 3-Column Stats Card */}
              <View style={styles.metricCard}>
                <View style={styles.metricCol}>
                  <ShoppingBag size={16} color="#64748B" style={{ marginBottom: 4 }} />
                  <Text style={styles.metricValue}>{itemsList.length} items</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricCol}>
                  <Text style={styles.metricCurrencySymbol}>₹</Text>
                  <Text style={styles.metricValue}>₹{order.amount || 120}</Text>
                  <Text style={styles.metricSubLabel}>Earnings</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricCol}>
                  <Navigation size={16} color="#64748B" style={{ marginBottom: 4 }} />
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
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleCall(pickup.phone)}
                    style={styles.iconCircleButton}
                  >
                    <Phone size={16} color="#111827" />
                  </TouchableOpacity>
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
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleCall(delivery.phone)}
                    style={styles.iconCircleButton}
                  >
                    <Phone size={16} color="#111827" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Interactive Route Map Preview Card */}
              <View style={styles.mapContainerCard}>
                <Svg width="100%" height={110} viewBox="0 0 320 110">
                  <Path d="M 0 35 Q 80 55 160 35 T 320 45" stroke="#F1F5F9" strokeWidth={18} fill="none" />
                  <Path d="M 40 110 L 95 0" stroke="#F8FAFC" strokeWidth={12} fill="none" />
                  <Path d="M 220 110 L 260 0" stroke="#F8FAFC" strokeWidth={12} fill="none" />
                  <Path
                    d="M 45 75 C 90 95, 140 25, 200 65 S 275 45, 275 45"
                    stroke="#3B82F6"
                    strokeWidth={3.5}
                    strokeLinecap="round"
                    strokeDasharray="6 4"
                    fill="none"
                  />
                  <Circle cx={45} cy={75} r={8} fill="#22C55E" />
                  <Circle cx={45} cy={75} r={3.5} fill="#FFFFFF" />
                  <Circle cx={275} cy={45} r={8} fill="#EF4444" />
                  <Circle cx={275} cy={45} r={3.5} fill="#FFFFFF" />
                </Svg>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => hapticFeedback.selection?.()}
                  style={styles.crosshairButton}
                >
                  <Crosshair size={18} color="#475569" strokeWidth={2.2} />
                </TouchableOpacity>
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
                  <View style={styles.customerActionButtonsRow}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleCall(delivery.phone)}
                      style={styles.iconCircleButton}
                    >
                      <Phone size={16} color="#111827" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleMessage(delivery.phone)}
                      style={[styles.iconCircleButton, { marginLeft: 8 }]}
                    >
                      <MessageSquare size={16} color="#111827" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Order Items Preview */}
              <View style={styles.sectionCard}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardHeaderTitle}>Order Items ({itemsList.length})</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setActiveView('checklist')}
                  >
                    <Text style={styles.viewAllLink}>View All &gt;</Text>
                  </TouchableOpacity>
                </View>

                {itemsList.slice(0, 3).map((item, idx) => (
                  <View key={item._id || idx} style={styles.itemPreviewRow}>
                    <View style={styles.itemIconThumb}>
                      <Text style={{ fontSize: 18 }}>
                        {idx === 0 ? '🍎' : idx === 1 ? '🥛' : '🍞'}
                      </Text>
                    </View>
                    <View style={styles.itemInfoCol}>
                      <Text style={styles.itemNameText}>{item.productName}</Text>
                      <Text style={styles.itemWeightText}>{item.weight || '1 unit'}</Text>
                    </View>
                    <Text style={styles.itemQtyMultiplier}>x{item.qty || 1}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ================================================================== */}
          {/* 2. DEDICATED CANCEL ORDER SCREEN (Screen 2 in reference)            */}
          {/* ================================================================== */}
          {activeView === 'cancel' && (
            <View style={styles.viewContent}>
              {/* Illustration Icon */}
              <View style={styles.cancelHeroCircle}>
                <FileText size={38} color="#DC2626" strokeWidth={1.8} />
              </View>

              <Text style={styles.cancelHeadline}>Why do you want to cancel this order?</Text>
              <Text style={styles.cancelSubText}>
                Please select a reason.{'\n'}This will be sent to the system for review.
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

          {/* ================================================================== */}
          {/* 3. PICKUP CHECKLIST SCREEN (Screen 3 in reference)                  */}
          {/* ================================================================== */}
          {activeView === 'checklist' && (
            <View style={styles.viewContent}>
              {/* Meta Row */}
              <View style={styles.orderMetaRow}>
                <View style={[styles.statusPill, styles.statusPillYellow]}>
                  <Text style={[styles.statusPillText, styles.statusTextYellow]}>In Progress</Text>
                </View>
                <View style={styles.orderTypeRow}>
                  <ShoppingBag size={14} color="#64748B" style={{ marginRight: 5 }} />
                  <Text style={styles.orderTypeLabel}>Grocery Order</Text>
                </View>
                <Text style={styles.orderTimeAgo}>10 min ago</Text>
              </View>

              {/* 3-Column Metric Card */}
              <View style={styles.metricCard}>
                <View style={styles.metricCol}>
                  <ShoppingBag size={16} color="#64748B" style={{ marginBottom: 4 }} />
                  <Text style={styles.metricValue}>{itemsList.length} items</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricCol}>
                  <Text style={styles.metricCurrencySymbol}>₹</Text>
                  <Text style={styles.metricValue}>₹{order.amount || 120}</Text>
                  <Text style={styles.metricSubLabel}>Earnings</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricCol}>
                  <Navigation size={16} color="#64748B" style={{ marginBottom: 4 }} />
                  <Text style={styles.metricValue}>2.4 km</Text>
                  <Text style={styles.metricSubLabel}>Distance</Text>
                </View>
              </View>

              {/* Store Pickup Banner */}
              <View style={styles.storePickupBanner}>
                <View style={styles.storeIconBox}>
                  <Store size={20} color="#854D0E" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.storeBannerTitle}>Pick up all items from the store</Text>
                  <Text style={styles.storeBannerSub}>
                    Please confirm that you have collected the following items.
                  </Text>
                </View>
              </View>

              {/* Item Checklist Card */}
              <View style={styles.sectionCard}>
                <Text style={styles.cardHeaderTitle}>Item Checklist ({itemsList.length})</Text>

                {itemsList.map((item, idx) => {
                  const isChecked = Boolean(checkedItems[idx]);
                  const emoji = idx === 0 ? '🍎' : idx === 1 ? '🥛' : idx === 2 ? '🍞' : idx === 3 ? '🥔' : '🧃';
                  return (
                    <TouchableOpacity
                      key={item._id || idx}
                      activeOpacity={0.7}
                      onPress={() => toggleCheckItem(idx)}
                      style={styles.checkItemRow}
                    >
                      <View style={styles.itemIconThumb}>
                        <Text style={{ fontSize: 20 }}>{emoji}</Text>
                      </View>
                      <View style={styles.itemInfoCol}>
                        <Text style={[styles.itemNameText, isChecked && styles.itemNameChecked]}>
                          {item.productName}
                        </Text>
                        <Text style={styles.itemWeightText}>{item.weight || '1 unit'}</Text>
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
                <Text style={styles.masterCheckboxText}>I have collected all items</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ================================================================== */}
          {/* 4. DELIVERY OTP VERIFICATION (Screen 4 in reference)                */}
          {/* ================================================================== */}
          {activeView === 'otp' && (
            <View style={styles.viewContent}>
              {/* Meta Row */}
              <View style={styles.orderMetaRow}>
                <View style={[styles.statusPill, styles.statusPillYellow]}>
                  <Text style={[styles.statusPillText, styles.statusTextYellow]}>Out for Delivery</Text>
                </View>
                <View style={styles.orderTypeRow}>
                  <ShoppingBag size={14} color="#64748B" style={{ marginRight: 5 }} />
                  <Text style={styles.orderTypeLabel}>Grocery Order</Text>
                </View>
                <Text style={styles.orderTimeAgo}>15 min ago</Text>
              </View>

              {/* 3-Column Metric Card */}
              <View style={styles.metricCard}>
                <View style={styles.metricCol}>
                  <ShoppingBag size={16} color="#64748B" style={{ marginBottom: 4 }} />
                  <Text style={styles.metricValue}>{itemsList.length} items</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricCol}>
                  <Text style={styles.metricCurrencySymbol}>₹</Text>
                  <Text style={styles.metricValue}>₹{order.amount || 120}</Text>
                  <Text style={styles.metricSubLabel}>Earnings</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricCol}>
                  <Navigation size={16} color="#64748B" style={{ marginBottom: 4 }} />
                  <Text style={styles.metricValue}>2.4 km</Text>
                  <Text style={styles.metricSubLabel}>Distance</Text>
                </View>
              </View>

              {/* Enter Customer OTP Card (Clean ZOOOMIT Yellow Card) */}
              <View style={styles.otpCardWrapper}>
                <View style={styles.otpHeaderRow}>
                  <View style={styles.lockIconBox}>
                    <Lock size={18} color="#854D0E" strokeWidth={2.4} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.otpCardHeading}>Enter Customer OTP</Text>
                    <Text style={styles.otpCardSub}>
                      Ask the customer for the 4-digit code to complete the delivery.
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
                        Boolean(digit) && styles.otpSingleBoxFilled
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

                {/* Helper / Timer Row */}
                <View style={styles.otpTimerRow}>
                  <Clock size={14} color="#64748B" style={{ marginRight: 5 }} />
                  <Text style={styles.otpTimerText}>Valid for 5 minutes</Text>
                </View>

                {/* Secondary Action: Generate New OTP */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleRegenerateOtp}
                  disabled={regeneratingOtp}
                  style={styles.generateOtpBtn}
                >
                  {regeneratingOtp ? (
                    <ActivityIndicator size="small" color="#111827" />
                  ) : (
                    <>
                      <RefreshCw size={15} color="#111827" strokeWidth={2} style={{ marginRight: 6 }} />
                      <Text style={styles.generateOtpText}>Generate New OTP</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Delivery Destination Card */}
              <View style={styles.sectionCard}>
                <View style={styles.locationRow}>
                  <View style={styles.dropoffPinCircle}>
                    <MapPin size={16} color="#DC2626" />
                  </View>
                  <View style={styles.locationDetailsCol}>
                    <Text style={styles.locationTypeLabel}>Delivery to</Text>
                    <Text style={styles.locationNameText}>{delivery.area}</Text>
                    <Text style={styles.locationAddressText}>{delivery.formattedAddress}</Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleCall(delivery.phone)}
                    style={styles.iconCircleButton}
                  >
                    <Phone size={16} color="#111827" />
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
                  <View style={styles.customerActionButtonsRow}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleCall(delivery.phone)}
                      style={styles.iconCircleButton}
                    >
                      <Phone size={16} color="#111827" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleMessage(delivery.phone)}
                      style={[styles.iconCircleButton, { marginLeft: 8 }]}
                    >
                      <MessageSquare size={16} color="#111827" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ================================================================== */}
          {/* 5. ORDER COMPLETED SCREEN (Screen 5 in reference)                   */}
          {/* ================================================================== */}
          {activeView === 'completed' && (
            <View style={styles.viewContent}>
              {/* Meta Row */}
              <View style={styles.orderMetaRow}>
                <View style={[styles.statusPill, styles.statusPillGreen]}>
                  <Text style={[styles.statusPillText, styles.statusTextGreen]}>Completed</Text>
                </View>
                <Text style={styles.orderTimeAgo}>Today, 10:50 AM</Text>
              </View>

              {/* Success Hero Circle */}
              <View style={styles.completedHeroWrapper}>
                <View style={styles.completedGreenCircle}>
                  <Check size={48} color="#FFFFFF" strokeWidth={3.5} />
                </View>
                <Text style={styles.completedHeading}>Order Delivered Successfully!</Text>
                <Text style={styles.completedSub}>
                  Great job! You have successfully completed the delivery.
                </Text>
              </View>

              {/* 3-Column Metric Card */}
              <View style={styles.metricCard}>
                <View style={styles.metricCol}>
                  <Text style={styles.metricNumberBig}>₹{order.riderEarnings || 30}</Text>
                  <Text style={styles.metricSubLabel}>Earned Pay</Text>
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
                <Text style={styles.cardHeaderTitle}>Delivery Details</Text>

                <View style={styles.completedDetailRow}>
                  <View style={styles.detailIconSquare}>
                    <Clock size={16} color="#475569" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.completedDetailLabel}>Delivery Time</Text>
                    <Text style={styles.completedDetailBold}>20 min</Text>
                    <Text style={styles.completedDetailMuted}>10:30 AM - 10:50 AM</Text>
                  </View>
                </View>

                <View style={styles.completedDetailDivider} />

                <View style={styles.completedDetailRow}>
                  <View style={styles.detailIconSquare}>
                    <MapPin size={16} color="#DC2626" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.completedDetailLabel}>Delivery Location</Text>
                    <Text style={styles.completedDetailBold}>{delivery.area}</Text>
                    <Text style={styles.completedDetailMuted}>{delivery.formattedAddress}</Text>
                  </View>
                </View>

                <View style={styles.completedDetailDivider} />

                <View style={styles.completedDetailRow}>
                  <View style={styles.detailIconSquare}>
                    <Text style={{ fontSize: 13, fontWeight: 'bold' }}>👤</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.completedDetailLabel}>Customer</Text>
                    <Text style={styles.completedDetailBold}>{delivery.customerName}</Text>
                    <Text style={styles.completedDetailMuted}>{delivery.phone}</Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleCall(delivery.phone)}
                    style={styles.iconCircleButton}
                  >
                    <Phone size={16} color="#111827" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* ==================================================================== */}
        {/* FLOATING BOTTOM ACTION BUTTONS                                       */}
        {/* ==================================================================== */}
        <View style={styles.bottomActionBar}>
          {/* Screen 1 (Overview) Actions: Cancel Order + View Route */}
          {activeView === 'overview' && (
            <View style={styles.overviewBottomButtons}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  hapticFeedback.warning?.();
                  setActiveView('cancel');
                }}
                style={styles.cancelOrderBtn}
              >
                <Clock size={16} color="#DC2626" strokeWidth={2.2} style={{ marginRight: 6 }} />
                <Text style={styles.cancelOrderBtnText}>Cancel Order</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  hapticFeedback.medium?.();
                  setActiveView('checklist');
                }}
                style={styles.primaryYellowBtn}
              >
                <Text style={styles.primaryYellowBtnText}>View Route</Text>
                <View style={styles.chevronCircle}>
                  <ChevronRight size={18} color="#111827" strokeWidth={2.5} />
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Screen 2 (Cancel Order) Actions: Keep Order + Submit Cancellation */}
          {activeView === 'cancel' && (
            <View style={styles.cancelBottomButtonsRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  hapticFeedback.light?.();
                  setActiveView('overview');
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

          {/* Screen 3 (Checklist) Actions: Confirm Pickup */}
          {activeView === 'checklist' && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleConfirmPickup}
              disabled={actionLoading}
              style={styles.primaryYellowBtn}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#111827" />
              ) : (
                <>
                  <Text style={styles.primaryYellowBtnText}>Confirm Pickup</Text>
                  <View style={styles.chevronCircle}>
                    <ChevronRight size={18} color="#111827" strokeWidth={2.5} />
                  </View>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Screen 4 (OTP) Actions: Verify OTP & Complete */}
          {activeView === 'otp' && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleVerifyOtp}
              disabled={verifyingOtp || otpDigits.join('').length !== 4}
              style={[
                styles.primaryYellowBtn,
                otpDigits.join('').length !== 4 && { opacity: 0.6 }
              ]}
            >
              {verifyingOtp ? (
                <ActivityIndicator size="small" color="#111827" />
              ) : (
                <>
                  <Text style={styles.primaryYellowBtnText}>Verify OTP & Complete</Text>
                  <View style={styles.chevronCircle}>
                    <ChevronRight size={18} color="#111827" strokeWidth={2.5} />
                  </View>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Screen 5 (Completed) Actions: Back to Orders */}
          {activeView === 'completed' && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                hapticFeedback.light?.();
                router.replace('/(tabs)/orders');
              }}
              style={styles.primaryYellowBtn}
            >
              <Text style={styles.primaryYellowBtnText}>Back to Orders</Text>
              <View style={styles.chevronCircle}>
                <ChevronRight size={18} color="#111827" strokeWidth={2.5} />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      {/* ==================================================================== */}
      {/* MODAL 1: CANCELLATION CONFIRMATION POPUP                             */}
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
              <Text style={styles.modalExclamation}>!</Text>
            </View>

            <Text style={styles.modalTitle}>Cancel this Order?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to cancel this order?{'\n'}This action will be sent to the system for review.
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
                  <Text style={styles.modalDestructiveBtnText}>Yes, Cancel Order</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================================================================== */}
      {/* MODAL 2: INVALID OTP POPUP                                           */}
      {/* ==================================================================== */}
      <Modal
        visible={showInvalidOtpModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInvalidOtpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity
              onPress={() => setShowInvalidOtpModal(false)}
              style={styles.modalCloseTopRight}
            >
              <X size={18} color="#64748B" />
            </TouchableOpacity>

            <View style={styles.modalRedCircle}>
              <X size={26} color="#DC2626" strokeWidth={2.6} />
            </View>

            <Text style={styles.modalTitle}>Invalid OTP</Text>
            <Text style={styles.modalMessage}>
              The OTP you entered is incorrect.{'\n'}Please try again.
            </Text>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowInvalidOtpModal(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setShowInvalidOtpModal(false);
                  setOtpDigits(['', '', '', '']);
                  otpInputRefs[0].current?.focus();
                }}
                style={styles.modalYellowBtn}
              >
                <Text style={styles.modalYellowBtnText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================================================================== */}
      {/* MODAL 3: NEW OTP GENERATED POPUP                                     */}
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

            <Text style={styles.modalTitle}>New OTP Generated</Text>
            <Text style={styles.modalMessage}>
              A new 4-digit OTP has been generated.{'\n'}Please ask the customer for the new code.
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowOtpGeneratedModal(false)}
              style={[styles.modalYellowBtn, { width: '100%' }]}
            >
              <Text style={styles.modalYellowBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ==================================================================== */}
      {/* QUICK WORKFLOW SWITCH MODAL (...)                                    */}
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
          <View style={[styles.modalCard, { paddingVertical: 18 }]}>
            <Text style={[styles.modalTitle, { fontSize: 16, marginBottom: 14 }]}>
              Jump to Stage
            </Text>

            {[
              { id: 'overview', label: '1. Order Details Overview' },
              { id: 'checklist', label: '2. Store Pickup Checklist' },
              { id: 'otp', label: '3. Delivery OTP Verification' },
              { id: 'completed', label: '4. Order Completed' },
              { id: 'cancel', label: '5. Cancel Order Flow' }
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

  // Top Header Bar
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

  // Status & Time row
  orderMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
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
    fontSize: 12,
    color: '#854D0E'
  },
  statusPillGreen: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC'
  },
  statusTextGreen: {
    fontFamily: typography.family.bold,
    fontSize: 12,
    color: '#15803D'
  },
  orderTypeRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  orderTypeLabel: {
    fontFamily: typography.family.medium,
    fontSize: 12.5,
    color: '#64748B'
  },
  orderTimeAgo: {
    fontFamily: typography.family.regular,
    fontSize: 12,
    color: '#94A3B8'
  },

  // 3-Column Metric Card
  metricCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
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
    height: 36,
    backgroundColor: '#F1F5F9'
  },
  metricCurrencySymbol: {
    fontFamily: typography.family.heavy,
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2
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
    borderRadius: 18,
    borderWidth: 1.5,
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

  // Map Route Container Card
  mapContainerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    height: 110,
    overflow: 'hidden',
    position: 'relative'
  },
  crosshairButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center'
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
  customerActionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  // Items Preview Rows
  itemPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC'
  },
  itemIconThumb: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  itemInfoCol: {
    flex: 1
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
  itemWeightText: {
    fontFamily: typography.family.regular,
    fontSize: 11.5,
    color: '#64748B'
  },
  itemQtyMultiplier: {
    fontFamily: typography.family.bold,
    fontSize: 13,
    color: '#475569'
  },

  // ========================================================================
  // Screen 2: Dedicated Cancel Order Screen Styles
  // ========================================================================
  cancelHeroCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16
  },
  cancelHeadline: {
    fontFamily: typography.family.heavy,
    fontSize: 19,
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
    marginBottom: 16
  },
  reasonsListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
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
    borderWidth: 1.5,
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

  // ========================================================================
  // Screen 3: Checklist Styles
  // ========================================================================
  storePickupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FEF08A',
    borderRadius: 16,
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
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC'
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
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  masterCheckboxText: {
    fontFamily: typography.family.bold,
    fontSize: 13.5,
    color: '#111827',
    marginLeft: 10
  },

  // ========================================================================
  // Screen 4: Delivery OTP Styles
  // ========================================================================
  otpCardWrapper: {
    backgroundColor: '#FFFDF2',
    borderWidth: 1.5,
    borderColor: '#FEF08A',
    borderRadius: 18,
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
    marginBottom: 12
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
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: '100%'
  },
  generateOtpText: {
    fontFamily: typography.family.bold,
    fontSize: 13,
    color: '#111827'
  },

  // ========================================================================
  // Screen 5: Completed Styles
  // ========================================================================
  completedHeroWrapper: {
    alignItems: 'center',
    paddingVertical: 16
  },
  completedGreenCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
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

  // ========================================================================
  // FLOATING BOTTOM ACTION BAR & BUTTONS
  // ========================================================================
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20
  },
  overviewBottomButtons: {
    flexDirection: 'row',
    gap: 12
  },
  cancelOrderBtn: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelOrderBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#DC2626'
  },
  primaryYellowBtn: {
    flex: 1.6,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#FFC928',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16
  },
  primaryYellowBtnText: {
    fontFamily: typography.family.heavy,
    fontSize: 15,
    color: '#111827',
    marginRight: 8
  },
  chevronCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(17, 24, 39, 0.08)',
    alignItems: 'center',
    justifyContent: 'center'
  },

  // Cancel Bottom Buttons Row
  cancelBottomButtonsRow: {
    flexDirection: 'row',
    gap: 12
  },
  keepOrderBtn: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
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
    flex: 1.6,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center'
  },
  submitCancelBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#FFFFFF'
  },

  // ========================================================================
  // POPUP MODALS COMMON
  // ========================================================================
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
    borderWidth: 1.5,
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
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14
  },
  modalGreenCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14
  },
  modalExclamation: {
    fontSize: 28,
    fontWeight: '900',
    color: '#DC2626'
  },
  modalTitle: {
    fontFamily: typography.family.heavy,
    fontSize: 18,
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
    marginBottom: 20
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
    borderWidth: 1.5,
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
    flex: 1.2,
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

  // Quick menu
  quickMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC'
  },
  quickMenuText: {
    fontFamily: typography.family.medium,
    fontSize: 14,
    color: '#475569'
  },
  quickMenuTextActive: {
    fontFamily: typography.family.bold,
    color: '#111827'
  }
});
