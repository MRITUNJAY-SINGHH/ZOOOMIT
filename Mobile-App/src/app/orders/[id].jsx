import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { 
  Package, 
  CheckCircle2, 
  Truck, 
  HelpCircle, 
  ShieldAlert,
  MapPin
} from 'lucide-react-native';
import { colors, spacing, radius, typography, getOrderStatus } from '../../constants/theme';
import { StorefrontAPI } from '../../services/api';
import { AppButton } from '../../components/AppButton';
import { ErrorState } from '../../components/ErrorState';

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [isCancelling, setIsCancelling] = useState(false);

  const { data: order, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['order-details', id],
    queryFn: async () => {
      const res = await StorefrontAPI.getOrderDetails(id);
      return res.data?.data;
    },
    enabled: Boolean(id),
    refetchInterval: 10000 // Auto-poll tracking status every 10s
  });

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Fetching order details...</Text>
      </View>
    );
  }

  if (isError || !order) {
    return (
      <View style={styles.container}>
        <ErrorState
          title="Order Not Found"
          message={error?.message || 'Unable to load order details'}
          onRetry={() => refetch()}
        />
      </View>
    );
  }

  const statusConfig = getOrderStatus(order.status);
  const isCancellable = ['Pending', 'Confirmed'].includes(order.status);

  const handleCancelOrder = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setIsCancelling(true);
            try {
              await StorefrontAPI.cancelOrder(order._id, 'Cancelled by customer');
              Alert.alert('Order Cancelled', 'Your order has been cancelled.');
              refetch();
            } catch (e) {
              Alert.alert('Cancellation Error', e.response?.data?.message || 'Failed to cancel order');
            } finally {
              setIsCancelling(false);
            }
          }
        }
      ]
    );
  };

  const steps = [
    { key: 'Confirmed', label: 'Order Confirmed', icon: CheckCircle2 },
    { key: 'Accepted', label: 'Packing Items', icon: Package },
    { key: 'OutForDelivery', label: 'Out for Delivery', icon: Truck },
    { key: 'Delivered', label: 'Delivered', icon: CheckCircle2 }
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing['4xl'] }}>
        {/* Order Header & Status Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
              <Text style={styles.orderDate}>
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
              <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          <Text style={styles.statusDescription}>{statusConfig.description}</Text>

          {/* Secure Delivery OTP if eligible */}
          {order.deliveryOtp?.active && (
            <View style={styles.otpBanner}>
              <ShieldAlert size={20} color={colors.warning} style={{ marginRight: spacing.sm }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.otpTitle}>Delivery Handover OTP</Text>
                <Text style={styles.otpDesc}>Share this code with your delivery partner upon arrival:</Text>
                <Text style={styles.otpCode}>• • • •</Text>
              </View>
            </View>
          )}
        </View>

        {/* Step Timeline */}
        {order.status !== 'Cancelled' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tracking Status</Text>
            <View style={styles.timeline}>
              {steps.map((step, idx) => {
                const isPassed = statusConfig.stepIndex >= idx + 1;
                const isCurrent = statusConfig.stepIndex === idx + 1;
                const IconComponent = step.icon;

                return (
                  <View key={step.key} style={styles.timelineStep}>
                    <View style={styles.timelineIndicatorCol}>
                      <View style={[
                        styles.timelineCircle, 
                        isPassed && styles.timelineCirclePassed,
                        isCurrent && styles.timelineCircleCurrent
                      ]}>
                        <IconComponent size={14} color={isPassed ? '#fff' : colors.textMuted} />
                      </View>
                      {idx < steps.length - 1 && (
                        <View style={[
                          styles.timelineLine,
                          isPassed && statusConfig.stepIndex > idx + 1 && styles.timelineLinePassed
                        ]} />
                      )}
                    </View>

                    <View style={styles.timelineContent}>
                      <Text style={[
                        styles.stepLabel,
                        isPassed && styles.stepLabelActive
                      ]}>
                        {step.label}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Delivery Address Snapshot */}
        {Boolean(order.shippingAddress) && (
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
              <MapPin size={18} color={colors.primary} style={{ marginRight: spacing.sm }} />
              <Text style={styles.cardTitle}>Delivery Address</Text>
            </View>
            <Text style={styles.addressText}>
              {order.shippingAddress.label} • {order.shippingAddress.street}, {order.shippingAddress.city} - {order.shippingAddress.zipCode}
            </Text>
          </View>
        )}

        {/* Ordered Items List */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Items ({order.items?.length || 0})</Text>
          {order.items?.map((item) => (
            <View key={item._id} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.productName}</Text>
                <Text style={styles.itemMeta}>
                  Qty: {item.qty} {item.unit} • ₹{item.price} each
                </Text>
              </View>
              <Text style={styles.itemTotal}>₹{item.total}</Text>
            </View>
          ))}
        </View>

        {/* Order Bill Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Details</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{order.subTotal?.toFixed(2)}</Text>
          </View>

          {order.discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.success }]}>Discount</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>-₹{order.discount?.toFixed(2)}</Text>
            </View>
          )}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Taxes (GST)</Text>
            <Text style={styles.summaryValue}>₹{order.tax?.toFixed(2)}</Text>
          </View>

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{order.amount?.toFixed(2)}</Text>
          </View>

          <View style={{ marginTop: spacing.sm }}>
            <Text style={styles.paymentStatusText}>
              Payment Status: <Text style={{ fontWeight: 'bold' }}>{order.paymentStatus}</Text> ({order.paymentMethod || 'COD'})
            </Text>
          </View>
        </View>

        {/* Order Issue / Problem Reporting CTA */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.issueButton}
            onPress={() => router.push(`/orders/${order._id}/issue`)}
            activeOpacity={0.8}
          >
            <HelpCircle size={20} color={colors.primary} style={{ marginRight: spacing.sm }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.issueTitle}>Having an issue with this order?</Text>
              <Text style={styles.issueSubtitle}>Report missing or damaged products for returns & refunds</Text>
            </View>
          </TouchableOpacity>

          {/* Cancellation button if eligible */}
          {isCancellable && (
            <AppButton
              title="Cancel Order"
              onPress={handleCancelOrder}
              variant="outline"
              isLoading={isCancelling}
              style={{ marginTop: spacing.md, borderColor: colors.error }}
              textStyle={{ color: colors.error }}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.size.sm,
    color: colors.textSecondary
  },
  headerCard: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  orderNumber: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary
  },
  orderDate: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginTop: 2
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full
  },
  statusBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold
  },
  statusDescription: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm
  },
  otpBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.warningSubtle,
    borderWidth: 1,
    borderColor: colors.warning,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginTop: spacing.md
  },
  otpTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.warning
  },
  otpDesc: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 2
  },
  otpCode: {
    fontSize: 20,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    letterSpacing: 4,
    marginTop: 4
  },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border
  },
  cardTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md
  },
  timeline: {
    paddingLeft: spacing.xs
  },
  timelineStep: {
    flexDirection: 'row',
    minHeight: 52
  },
  timelineIndicatorCol: {
    alignItems: 'center',
    width: 28
  },
  timelineCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center'
  },
  timelineCirclePassed: {
    backgroundColor: colors.primary
  },
  timelineCircleCurrent: {
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.primarySubtle
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginVertical: 2
  },
  timelineLinePassed: {
    backgroundColor: colors.primary
  },
  timelineContent: {
    flex: 1,
    paddingLeft: spacing.md,
    paddingTop: 2
  },
  stepLabel: {
    fontSize: typography.size.sm,
    color: colors.textMuted
  },
  stepLabelActive: {
    fontWeight: typography.weight.bold,
    color: colors.textPrimary
  },
  addressText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    lineHeight: 20
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle
  },
  itemName: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.textPrimary
  },
  itemMeta: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginTop: 2
  },
  itemTotal: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs + 2
  },
  summaryLabel: {
    fontSize: typography.size.sm,
    color: colors.textSecondary
  },
  summaryValue: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.textPrimary
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.xs
  },
  totalLabel: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary
  },
  totalValue: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.primary
  },
  paymentStatusText: {
    fontSize: typography.size.xs,
    color: colors.textSecondary
  },
  actionSection: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg
  },
  issueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border
  },
  issueTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.primary
  },
  issueSubtitle: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 2
  }
});
