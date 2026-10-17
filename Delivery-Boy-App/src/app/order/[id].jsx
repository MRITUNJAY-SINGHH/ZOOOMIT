import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  Store,
  MapPin,
  Phone,
  Package,
  CheckSquare,
  Square,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  X
} from 'lucide-react-native';
import { colors, typography, radius, spacing } from '../../constants/theme';
import {
  AppHeader,
  AppButton,
  StatusBadge,
  OrderStatusTimeline,
  LocationSummary,
  OTPInput,
  ConfirmationModal
} from '../../components';
import { deliveryService } from '../../services/deliveryService';
import { hapticFeedback } from '../../services/haptics';

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});

  // Modals
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [successDelivered, setSuccessDelivered] = useState(false);

  const [loadError, setLoadError] = useState(null);

  const fetchDetails = useCallback(async () => {
    try {
      setLoadError(null);
      const res = await deliveryService.getOrderDetails(id);
      setOrderData(res);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not load order details.';
      setLoadError(msg);
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const order = orderData?.order;
  const pickup = orderData?.pickup || {
    storeName: 'ZOOOMIT Supermart Hub',
    address: 'Sector 4, Main Express Lane, Tech Park',
    latitude: 28.6139,
    longitude: 77.2090,
    phone: '+91 98765 43210'
  };
  const delivery = orderData?.delivery || {
    customerName: order?.shippingAddress?.contactName || order?.customer?.name || 'Customer',
    phone: order?.shippingAddress?.contactPhone || order?.customer?.phone || '',
    formattedAddress: order?.shippingAddress?.formattedAddress || 'Customer Address',
    latitude: 28.6280,
    longitude: 77.2180
  };

  const currentStatus = order?.status || 'Assigned';

  const toggleCheckItem = (index) => {
    hapticFeedback.selection();
    setCheckedItems((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleCall = (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert('Phone Unavailable', 'No contact number provided.');
      return;
    }
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert('Call Failed', 'Unable to initiate call from this device.');
    });
  };

  // State transitions
  const handleTransition = async (nextStatus, note = '') => {
    setActionLoading(true);
    hapticFeedback.medium();
    try {
      await deliveryService.updateOrderStatus(order._id, nextStatus, note);
      hapticFeedback.success();
      await fetchDetails();
    } catch (err) {
      hapticFeedback.error();
      Alert.alert('Status Error', err.response?.data?.message || 'Failed to update order status.');
    } finally {
      setActionLoading(false);
    }
  };

  // OTP Verification
  const handleVerifyOtp = async () => {
    if (enteredOtp.length !== 4) {
      setOtpError('Please enter all 4 digits');
      return;
    }

    setActionLoading(true);
    setOtpError('');
    hapticFeedback.medium();

    try {
      await deliveryService.verifyDeliveryOtp(order._id, enteredOtp);
      hapticFeedback.success();
      setSuccessDelivered(true);
      setOtpModalVisible(false);
      await fetchDetails();
    } catch (err) {
      hapticFeedback.error();
      setOtpError(err.response?.data?.message || 'Incorrect OTP code. Please ask customer to recheck.');
    } finally {
      setActionLoading(false);
    }
  };

  // Cancellation
  const handleCancelOrder = async ({ reason, details }) => {
    setActionLoading(true);
    try {
      await deliveryService.cancelOrder(order._id, reason, details);
      hapticFeedback.warning();
      setCancelModalVisible(false);
      Alert.alert('Order Returned', 'The delivery has been unassigned and returned to dispatch.');
      router.replace('/(tabs)/orders');
    } catch (err) {
      Alert.alert('Cancellation Failed', err.response?.data?.message || 'Could not cancel order.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader title="Order Details" showBack />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primaryDark} />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader title="Order Details" showBack />
        <View style={[styles.centerContainer, { paddingHorizontal: spacing.lg }]}>
          <AlertTriangle size={48} color={colors.warning} style={{ marginBottom: spacing.md }} />
          <Text style={[styles.modalTitle, { textAlign: 'center', marginBottom: spacing.xs }]}>
            {loadError || 'Order details unavailable'}
          </Text>
          <Text style={[styles.billLabel, { textAlign: 'center', marginBottom: spacing.lg }]}>
            Unable to fetch order information from the server.
          </Text>
          <AppButton title="Try Again" onPress={fetchDetails} />
        </View>
      </SafeAreaView>
    );
  }

  const itemsList = order.items || [];
  const allItemsChecked = itemsList.length > 0 && itemsList.every((_, idx) => checkedItems[idx]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title={`Order #${order.orderNumber}`}
        subtitle="Delivery Lifecycle & Verification"
        showBack
        rightAction={<StatusBadge status={currentStatus} />}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Timeline */}
        <OrderStatusTimeline currentStatus={currentStatus} style={styles.timelineSection} />

        {/* Step 1: Pickup Location Card */}
        <LocationSummary
          type="pickup"
          title={pickup.storeName}
          address={pickup.address}
          contactPhone={pickup.phone}
          latitude={pickup.latitude}
          longitude={pickup.longitude}
          distanceKm={1.2}
          onCall={handleCall}
        />

        {/* Step 2: Delivery Customer Destination Card */}
        <LocationSummary
          type="delivery"
          title={delivery.customerName}
          address={delivery.formattedAddress}
          contactName={delivery.customerName}
          contactPhone={delivery.phone}
          latitude={delivery.latitude}
          longitude={delivery.longitude}
          distanceKm={2.8}
          onCall={handleCall}
        />

        {/* Item Collection Checklist */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Order Items Checklist</Text>
              <Text style={styles.sectionSubtitle}>
                Verify each item at the hub before confirming pickup
              </Text>
            </View>
            <View style={styles.itemCountTag}>
              <Package size={13} color="#854D0E" style={{ marginRight: 4 }} />
              <Text style={styles.itemCountTagText}>{itemsList.length} Items</Text>
            </View>
          </View>

          {itemsList.map((item, index) => {
            const isChecked = Boolean(checkedItems[index]);
            return (
              <TouchableOpacity
                key={item._id || index}
                activeOpacity={0.7}
                onPress={() => toggleCheckItem(index)}
                style={[styles.itemRow, isChecked && styles.itemRowChecked]}
              >
                <View style={styles.checkIcon}>
                  {isChecked ? (
                    <CheckSquare size={20} color={colors.success} />
                  ) : (
                    <Square size={20} color={colors.textMuted} />
                  )}
                </View>
                <View style={styles.itemDetails}>
                  <Text style={[styles.itemName, isChecked && styles.itemNameChecked]}>
                    {item.productName || 'Grocery Item'}
                  </Text>
                  <Text style={styles.itemMeta}>
                    Qty: {item.qty} {item.unit || 'PCS'} • ₹{item.price}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>₹{item.total || item.price * (item.qty || 1)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Order Payment & Total Summary */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Bill Summary</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Payment Method</Text>
            <Text style={styles.billValue}>{order.paymentMethod || 'COD'} ({order.paymentStatus})</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Total Order Value</Text>
            <Text style={styles.billValue}>₹{order.amount}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Your Delivery Pay</Text>
            <Text style={[styles.billValue, { color: colors.success, fontFamily: typography.family.bold }]}>
              +₹45
            </Text>
          </View>
        </View>

        {/* Cancel / Reject Option */}
        {currentStatus !== 'Delivered' && currentStatus !== 'Cancelled' && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setCancelModalVisible(true)}
            style={styles.cancelTrigger}
          >
            <AlertTriangle size={15} color={colors.error} style={{ marginRight: 6 }} />
            <Text style={styles.cancelTriggerText}>Need to decline or return order to dispatch?</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Floating Bottom Action Bar */}
      <View style={styles.bottomBar}>
        {currentStatus === 'Assigned' && (
          <View style={styles.actionRow}>
            <AppButton
              title="Decline"
              variant="outline"
              onPress={() => setCancelModalVisible(true)}
              style={{ flex: 1 }}
            />
            <AppButton
              title="Accept Order"
              variant="primary"
              onPress={() => handleTransition('Accepted')}
              loading={actionLoading}
              style={{ flex: 1.8 }}
            />
          </View>
        )}

        {currentStatus === 'Accepted' && (
          <AppButton
            title="Mark Arrived at Store"
            variant="primary"
            onPress={() => handleTransition('Arrived at Store')}
            loading={actionLoading}
            style={{ width: '100%' }}
          />
        )}

        {currentStatus === 'Arrived at Store' && (
          <AppButton
            title={allItemsChecked ? "Confirm Items Picked Up" : "Check items & Confirm Pickup"}
            variant="primary"
            onPress={() => handleTransition('Picked Up')}
            loading={actionLoading}
            style={{ width: '100%' }}
          />
        )}

        {currentStatus === 'Picked Up' && (
          <AppButton
            title="Start Delivery (Out for Delivery)"
            variant="primary"
            onPress={() => handleTransition('Out For Delivery')}
            loading={actionLoading}
            style={{ width: '100%' }}
          />
        )}

        {(currentStatus === 'Out For Delivery' || currentStatus === 'OutForDelivery') && (
          <AppButton
            title="Verify 4-Digit Delivery OTP"
            variant="primary"
            onPress={() => {
              setEnteredOtp('');
              setOtpError('');
              setOtpModalVisible(true);
            }}
            loading={actionLoading}
            style={{ width: '100%' }}
          />
        )}

        {currentStatus === 'Delivered' && (
          <View style={styles.completedBox}>
            <CheckCircle2 size={20} color={colors.success} style={{ marginRight: 8 }} />
            <Text style={styles.completedText}>Order Successfully Delivered & Verified!</Text>
          </View>
        )}
      </View>

      {/* Delivery OTP Verification Modal (Section 16) */}
      <Modal visible={otpModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.shieldCircle}>
                <ShieldCheck size={20} color="#854D0E" />
              </View>
              <Text style={styles.modalTitle}>Customer Delivery OTP</Text>
              <TouchableOpacity onPress={() => setOtpModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.otpPromptText}>
              Ask customer for their 4-digit secret delivery OTP to verify receipt and complete delivery.
            </Text>

            <OTPInput
              length={4}
              onChangeOtp={setEnteredOtp}
              onComplete={(code) => setEnteredOtp(code)}
              error={Boolean(otpError)}
            />

            {Boolean(otpError) && <Text style={styles.otpErrorText}>{otpError}</Text>}

            <AppButton
              title="Verify & Complete Delivery"
              variant="primary"
              onPress={handleVerifyOtp}
              loading={actionLoading}
              disabled={enteredOtp.length !== 4}
              style={{ marginTop: spacing.md }}
            />
          </View>
        </View>
      </Modal>

      {/* Success Celebration Modal */}
      <Modal visible={successDelivered} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Image
              source={require('../../../assets/images/delivery-success.png')}
              style={styles.successImage}
              contentFit="contain"
            />
            <Text style={styles.successTitle}>Delivery Completed! 🎉</Text>
            <Text style={styles.successSubtitle}>
              Order #{order.orderNumber} successfully completed and verified. ₹45 has been credited to your earnings.
            </Text>
            <AppButton
              title="Back to Dashboard"
              variant="primary"
              onPress={() => {
                setSuccessDelivered(false);
                router.replace('/(tabs)');
              }}
              style={{ marginTop: spacing.lg }}
            />
          </View>
        </View>
      </Modal>

      {/* Cancellation with Reason Modal (Section 17) */}
      <ConfirmationModal
        visible={cancelModalVisible}
        onClose={() => setCancelModalVisible(false)}
        onConfirm={handleCancelOrder}
        title="Decline / Return Order"
        subtitle="Select a reason to return this order to dispatch for reassignment."
        confirmText="Confirm Reassignment"
        loading={actionLoading}
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
    paddingBottom: 110
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl
  },
  timelineSection: {
    marginBottom: spacing.md
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm
  },
  sectionTitle: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    color: colors.textPrimary
  },
  sectionSubtitle: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 2
  },
  itemCountTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryDark,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill
  },
  itemCountTagText: {
    fontFamily: typography.family.bold,
    fontSize: 10,
    color: '#854D0E'
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight
  },
  itemRowChecked: {
    backgroundColor: colors.successSubtle,
    borderRadius: radius.sm,
    paddingHorizontal: 6
  },
  checkIcon: {
    marginRight: spacing.sm
  },
  itemDetails: {
    flex: 1
  },
  itemName: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    color: colors.textPrimary
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary
  },
  itemMeta: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 2
  },
  itemTotal: {
    fontFamily: typography.family.heavy,
    fontSize: typography.size.sm,
    color: colors.textPrimary
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs
  },
  billLabel: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textSecondary
  },
  billValue: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    color: colors.textPrimary
  },
  cancelTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md
  },
  cancelTriggerText: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.xs,
    color: colors.error
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1.5,
    borderTopColor: colors.borderLight,
    padding: spacing.md,
    paddingBottom: spacing.lg
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  completedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.badgeDelivered,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: radius.md,
    padding: spacing.md
  },
  completedText: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    color: colors.badgeDeliveredText
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.lg
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs
  },
  shieldCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm
  },
  modalTitle: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.md,
    color: colors.textPrimary,
    flex: 1
  },
  closeBtn: {
    padding: spacing.xs
  },
  otpPromptText: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginVertical: spacing.sm,
    lineHeight: 18
  },
  otpErrorText: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.xs,
    color: colors.error,
    textAlign: 'center',
    marginVertical: spacing.xs
  },
  successImage: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    marginBottom: spacing.sm
  },
  successTitle: {
    fontFamily: typography.family.heavy,
    fontSize: typography.size.xl,
    color: colors.textPrimary,
    textAlign: 'center'
  },
  successSubtitle: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: spacing.sm,
    lineHeight: 20
  }
});
