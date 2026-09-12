import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { 
  Tag, 
  Check, 
  Trash2, 
  AlertCircle, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  ShoppingBag 
} from 'lucide-react-native';
import { colors, spacing, radius, typography, shadows } from '../../constants/theme';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { QuantityStepper } from '../../components/QuantityStepper';
import { AppButton } from '../../components/AppButton';
import { EmptyState } from '../../components/EmptyState';

export default function CartScreen() {
  const { token, customer } = useAuth();
  const { 
    cart, 
    isLoading, 
    updateItem, 
    removeItem, 
    clearCart, 
    applyCoupon, 
    removeCoupon 
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState('');

  if (!token) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon={<ShoppingBag size={48} color={colors.primary} />}
          title="Sign In to view your cart"
          description="Your cart is synced with your Kuiklo account across devices."
          actionTitle="Sign In"
          onAction={() => router.push('/(auth)/login')}
        />
      </View>
    );
  }

  if (isLoading && cart.items.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Syncing your cart...</Text>
      </View>
    );
  }

  if (cart.items.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon={<ShoppingBag size={48} color={colors.primary} />}
          title="Your Cart is Empty"
          description="Looks like you haven't added anything to your cart yet. Explore our fresh groceries and daily essentials!"
          actionTitle="Shop Groceries"
          onAction={() => router.push('/(tabs)')}
        />
      </View>
    );
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponMessage('');
    const res = await applyCoupon(couponCode.trim().toUpperCase());
    setCouponLoading(false);
    setCouponMessage(res.message);
    if (res.success) {
      setCouponCode('');
    }
  };

  const handleClearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearCart }
      ]
    );
  };

  const handleProceedToCheckout = () => {
    router.push('/checkout');
  };

  const { subTotal, tax, cgst, sgst, discount, deliveryFee, grandTotal } = cart.summary;
  const freeDeliveryThreshold = 499;
  const awayFromFree = Math.max(0, freeDeliveryThreshold - subTotal);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        {/* Header with clear action */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Shopping Cart ({cart.items.length})</Text>
          <TouchableOpacity onPress={handleClearCart} style={styles.clearBtn}>
            <Trash2 size={16} color={colors.error} />
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* Stale Data / Quantity Warnings if any */}
        {Boolean(cart.warnings && cart.warnings.length > 0) && (
          <View style={styles.warningBox}>
            <AlertCircle size={18} color={colors.warning} style={{ marginRight: spacing.sm, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              {cart.warnings?.map((w, idx) => (
                <Text key={idx} style={styles.warningText}>• {w}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Free Delivery Bar */}
        <View style={styles.deliveryBanner}>
          <Zap size={18} color={colors.primary} style={{ marginRight: spacing.sm }} />
          {awayFromFree === 0 ? (
            <Text style={styles.deliveryBannerText}>
              🎉 You unlocked <Text style={{ fontWeight: 'bold' }}>FREE Delivery!</Text>
            </Text>
          ) : (
            <Text style={styles.deliveryBannerText}>
              Add <Text style={{ fontWeight: 'bold' }}>₹{awayFromFree.toFixed(0)}</Text> more to get FREE Delivery!
            </Text>
          )}
        </View>

        {/* Cart Items List */}
        <View style={styles.itemsCard}>
          {cart.items.map((item) => (
            <View key={item._id} style={styles.itemRow}>
              <Image
                source={{ uri: item.product.featuredImage || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200' }}
                style={styles.itemImage}
                contentFit="contain"
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.product.name}
                </Text>
                <Text style={styles.itemUnit}>{item.unit}</Text>
                <Text style={styles.itemPrice}>₹{item.price}</Text>
              </View>

              <View style={styles.itemActions}>
                <QuantityStepper
                  quantity={item.qty}
                  minQty={item.product.minSaleQty || 1}
                  maxQty={item.product.maxSaleQty || 100}
                  step={item.product.qtyStep || 1}
                  unit={item.unit}
                  onIncrement={() => updateItem(item._id, item.qty + (item.product.qtyStep || 1))}
                  onDecrement={() => {
                    const step = item.product.qtyStep || 1;
                    const min = item.product.minSaleQty || 1;
                    if (item.qty <= min) removeItem(item._id);
                    else updateItem(item._id, item.qty - step);
                  }}
                />
                <Text style={styles.itemTotal}>₹{item.total}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Coupon Section */}
        <View style={styles.couponCard}>
          {cart.appliedCoupon ? (
            <View style={styles.appliedCouponRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Check size={18} color={colors.success} style={{ marginRight: spacing.sm }} />
                <View>
                  <Text style={styles.appliedCouponCode}>'{cart.appliedCoupon.code}' Applied</Text>
                  <Text style={styles.appliedCouponSaving}>Saved ₹{cart.appliedCoupon.discount}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={removeCoupon}>
                <Text style={styles.removeCouponText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View style={styles.couponInputRow}>
                <Tag size={18} color={colors.textMuted} style={{ marginRight: spacing.sm }} />
                <TextInput
                  style={styles.couponInput}
                  placeholder="Enter Coupon Code (e.g. KUIKLO100)"
                  placeholderTextColor={colors.textMuted}
                  value={couponCode}
                  onChangeText={(text) => {
                    setCouponCode(text.toUpperCase());
                    if (couponMessage) setCouponMessage('');
                  }}
                  autoCapitalize="characters"
                />
                <TouchableOpacity 
                  onPress={handleApplyCoupon}
                  disabled={!couponCode.trim() || couponLoading}
                  style={[styles.applyBtn, !couponCode.trim() && { opacity: 0.5 }]}
                >
                  {couponLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text style={styles.applyBtnText}>APPLY</Text>
                  )}
                </TouchableOpacity>
              </View>
              {Boolean(couponMessage) && (
                <Text style={styles.couponMessageText}>{couponMessage}</Text>
              )}
            </View>
          )}
        </View>

        {/* Bill Summary */}
        <View style={styles.billCard}>
          <Text style={styles.billTitle}>Bill Details</Text>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total (Subtotal)</Text>
            <Text style={styles.billValue}>₹{subTotal.toFixed(2)}</Text>
          </View>

          {discount > 0 && (
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: colors.success }]}>Coupon Discount</Text>
              <Text style={[styles.billValue, { color: colors.success }]}>-₹{discount.toFixed(2)}</Text>
            </View>
          )}

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Partner Fee</Text>
            <Text style={styles.billValue}>
              {deliveryFee === 0 ? <Text style={{ color: colors.success }}>FREE</Text> : `₹${deliveryFee}`}
            </Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Taxes & GST (Included)</Text>
            <Text style={styles.billSubValue}>
              ₹{tax.toFixed(2)} (CGST ₹{cgst.toFixed(2)} + SGST ₹{sgst.toFixed(2)})
            </Text>
          </View>

          <View style={[styles.billRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>To Pay</Text>
            <Text style={styles.grandTotalValue}>₹{grandTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* Safe Cancellation Policy */}
        <View style={styles.policyRow}>
          <ShieldCheck size={16} color={colors.textMuted} style={{ marginRight: 6 }} />
          <Text style={styles.policyText}>Safe packing • Contactless delivery available</Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomBarPrice}>₹{grandTotal.toFixed(2)}</Text>
          <Text style={styles.bottomBarSavings}>
            {discount > 0 ? `Saved ₹${discount} with coupon` : 'Authoritative prices'}
          </Text>
        </View>

        <AppButton
          title="Proceed to Checkout"
          onPress={handleProceedToCheckout}
          icon={<ArrowRight size={18} color="#fff" />}
          style={{ minWidth: 190 }}
        />
      </View>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm
  },
  headerTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  clearText: {
    fontSize: typography.size.xs,
    color: colors.error,
    marginLeft: 4,
    fontWeight: typography.weight.medium
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: colors.warningSubtle,
    borderWidth: 1,
    borderColor: colors.warning,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md
  },
  warningText: {
    fontSize: typography.size.xs,
    color: colors.warning,
    lineHeight: 16
  },
  deliveryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySubtle,
    marginHorizontal: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.md
  },
  deliveryBannerText: {
    fontSize: typography.size.sm,
    color: colors.primaryDark
  },
  itemsCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xl,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle
  },
  itemInfo: {
    flex: 1,
    paddingHorizontal: spacing.md
  },
  itemName: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary,
    marginBottom: 2
  },
  itemUnit: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginBottom: 4
  },
  itemPrice: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary
  },
  itemActions: {
    alignItems: 'flex-end'
  },
  itemTotal: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginTop: spacing.xs
  },
  couponCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xl,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  couponInputRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  couponInput: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    fontWeight: typography.weight.semibold
  },
  applyBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2
  },
  applyBtnText: {
    color: colors.primary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold
  },
  appliedCouponRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  appliedCouponCode: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary
  },
  appliedCouponSaving: {
    fontSize: typography.size.xs,
    color: colors.success,
    fontWeight: typography.weight.medium
  },
  removeCouponText: {
    fontSize: typography.size.xs,
    color: colors.error,
    fontWeight: typography.weight.bold
  },
  couponMessageText: {
    fontSize: typography.size.xs,
    color: colors.error,
    marginTop: spacing.xs
  },
  billCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xl,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  billTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  billLabel: {
    fontSize: typography.size.sm,
    color: colors.textSecondary
  },
  billValue: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary
  },
  billSubValue: {
    fontSize: typography.size.xs,
    color: colors.textMuted
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.xs
  },
  grandTotalLabel: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary
  },
  grandTotalValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.heavy,
    color: colors.primary
  },
  policyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl
  },
  policyText: {
    fontSize: typography.size.xs,
    color: colors.textMuted
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.lg
  },
  bottomBarPrice: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.heavy,
    color: colors.textPrimary
  },
  bottomBarSavings: {
    fontSize: typography.size.xs,
    color: colors.textSecondary
  }
});
