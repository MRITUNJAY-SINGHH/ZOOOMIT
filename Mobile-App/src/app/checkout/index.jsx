import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { router } from 'expo-router';
import { 
  MapPin, 
  CreditCard, 
  Banknote, 
  ShieldCheck, 
  Clock, 
  Plus
} from 'lucide-react-native';
import { colors, spacing, typography } from '../../constants/theme';
import { StorefrontAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { AppButton } from '../../components/AppButton';
import { getOrderRecipient, clearOrderRecipient } from '../../services/recipientStore';

export default function CheckoutScreen() {
  const { customer, refreshProfile } = useAuth();
  const { cart, clearCart } = useCart();

  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [serviceability, setServiceability] = useState(null);
  const [serviceabilityLoading, setServiceabilityLoading] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const addresses = customer?.addresses || [];

  useEffect(() => {
    if (addresses.length > 0) {
      const def = addresses.find((a) => a.isDefault) || addresses[0];
      setSelectedAddressId(def._id);
    }
  }, [customer]);

  useEffect(() => {
    const checkArea = async () => {
      if (!selectedAddressId) return;
      const addr = addresses.find((a) => a._id === selectedAddressId);
      if (!addr) return;

      setServiceabilityLoading(true);
      try {
        const res = await StorefrontAPI.checkServiceability({
          zipCode: addr.zipCode,
          lat: addr.coordinates?.lat,
          lng: addr.coordinates?.lng
        });
        setServiceability(res.data);
      } catch (e) {
        console.warn('Serviceability error:', e);
      } finally {
        setServiceabilityLoading(false);
      }
    };

    checkArea();
  }, [selectedAddressId]);

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      Alert.alert('Delivery Address Required', 'Please add or select a delivery address');
      return;
    }

    if (cart.items.length === 0) {
      Alert.alert('Empty Cart', 'Your cart has no items to checkout');
      return;
    }

    setIsPlacingOrder(true);
    const recipient = getOrderRecipient();
    try {
      if (paymentMethod === 'Razorpay') {
        const intentRes = await StorefrontAPI.createPaymentIntent();
        const { orderId: rzpOrderId } = intentRes.data;

        const placeRes = await StorefrontAPI.placeOrder({
          addressId: selectedAddressId,
          ...(recipient ? { recipient } : {}),
          paymentMethod: 'Razorpay',
          razorpayOrderId: rzpOrderId,
          razorpayPaymentId: `pay_mock_${Date.now()}`,
          razorpaySignature: 'mock_signature_verified'
        });

        await clearCart();
        clearOrderRecipient();
        await refreshProfile();

        router.replace(`/orders/${placeRes.data.order.id}`);
      } else {
        const placeRes = await StorefrontAPI.placeOrder({
          addressId: selectedAddressId,
          ...(recipient ? { recipient } : {}),
          paymentMethod: 'COD'
        });

        await clearCart();
        clearOrderRecipient();
        await refreshProfile();

        router.replace(`/orders/${placeRes.data.order.id}`);
      }
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to place order. Please try again.';
      Alert.alert('Order Placement Failed', msg);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const selectedAddr = addresses.find((a) => a._id === selectedAddressId);
  const { subTotal, tax, discount, deliveryFee, grandTotal } = cart.summary;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MapPin size={20} color={colors.black} style={{ marginRight: spacing.sm }} />
              <Text style={styles.cardTitle}>Delivery Address</Text>
            </View>
            <TouchableOpacity 
              style={styles.changeBtn} 
              onPress={() => router.push('/addresses')}
            >
              <Text style={styles.changeBtnText}>
                {addresses.length > 0 ? 'Change / Add' : '+ Add Address'}
              </Text>
            </TouchableOpacity>
          </View>

          {selectedAddr ? (
            <View style={styles.addressBox}>
              <View style={styles.addressLabelBadge}>
                <Text style={styles.addressLabelText}>{selectedAddr.label}</Text>
              </View>
              <Text style={styles.addressStreet}>{selectedAddr.street}</Text>
              {Boolean(selectedAddr.landmark) && (
                <Text style={styles.addressLandmark}>Landmark: {selectedAddr.landmark}</Text>
              )}
              <Text style={styles.addressCity}>
                {selectedAddr.city}, {selectedAddr.state} - {selectedAddr.zipCode}
              </Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.addAddressBox}
              onPress={() => router.push('/addresses')}
            >
              <Plus size={20} color={colors.black} style={{ marginRight: 6 }} />
              <Text style={styles.addAddressText}>Add New Delivery Address</Text>
            </TouchableOpacity>
          )}

          {serviceabilityLoading ? (
            <View style={styles.serviceBox}>
              <ActivityIndicator size="small" color={colors.black} />
              <Text style={styles.serviceText}>Verifying delivery serviceability...</Text>
            </View>
          ) : serviceability ? (
            <View style={styles.serviceBox}>
              <Clock size={16} color={colors.black} style={{ marginRight: spacing.sm }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.serviceTitle}>⚡ Estimated Delivery: {serviceability.estimatedDelivery}</Text>
                <Text style={styles.serviceMsg}>{serviceability.message}</Text>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Method</Text>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'COD' && styles.paymentOptionActive]}
            onPress={() => setPaymentMethod('COD')}
            activeOpacity={0.8}
          >
            <View style={styles.paymentLeft}>
              <View style={[styles.radioCircle, paymentMethod === 'COD' && styles.radioCircleActive]}>
                {paymentMethod === 'COD' && <View style={styles.radioInner} />}
              </View>
              <Banknote size={22} color={colors.black} style={{ marginHorizontal: spacing.md }} />
              <View>
                <Text style={styles.paymentName}>Cash on Delivery (COD)</Text>
                <Text style={styles.paymentDesc}>Pay cash or UPI to delivery partner</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'Razorpay' && styles.paymentOptionActive]}
            onPress={() => setPaymentMethod('Razorpay')}
            activeOpacity={0.8}
          >
            <View style={styles.paymentLeft}>
              <View style={[styles.radioCircle, paymentMethod === 'Razorpay' && styles.radioCircleActive]}>
                {paymentMethod === 'Razorpay' && <View style={styles.radioInner} />}
              </View>
              <CreditCard size={22} color={colors.textSecondary} style={{ marginHorizontal: spacing.md }} />
              <View>
                <Text style={styles.paymentName}>Online Payment (Razorpay)</Text>
                <Text style={styles.paymentDesc}>UPI, Credit/Debit Cards, NetBanking</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Summary ({cart.items.length} items)</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Items Total</Text>
            <Text style={styles.summaryValue}>₹{subTotal.toFixed(2)}</Text>
          </View>

          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.success }]}>Coupon Savings</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>-₹{discount.toFixed(2)}</Text>
            </View>
          )}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>
              {deliveryFee === 0 ? <Text style={{ color: colors.success }}>FREE</Text> : `₹${deliveryFee}`}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Taxes (GST)</Text>
            <Text style={styles.summaryValue}>₹{tax.toFixed(2)}</Text>
          </View>

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalValue}>₹{grandTotal.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.guaranteeRow}>
          <ShieldCheck size={18} color={colors.black} style={{ marginRight: 6 }} />
          <Text style={styles.guaranteeText}>100% Secure Checkout • Authoritative Backend Verification</Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomTotal}>₹{grandTotal.toFixed(2)}</Text>
          <Text style={styles.bottomMethod}>{paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}</Text>
        </View>

        <AppButton
          title={paymentMethod === 'COD' ? 'Place Order' : 'Pay & Order'}
          onPress={handlePlaceOrder}
          loading={isPlacingOrder}
          variant="primary"
          style={{ minWidth: 170 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white
  },
  card: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  cardTitle: {
    fontSize: typography.size.md,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  changeBtn: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm
  },
  changeBtnText: {
    fontSize: typography.size.xs,
    fontFamily: typography.family.bold,
    color: colors.primaryDark
  },
  addressBox: {
    backgroundColor: colors.softBackground,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  addressLabelBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.primaryLight
  },
  addressLabelText: {
    fontSize: typography.size.xs - 1,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    textTransform: 'uppercase'
  },
  addressStreet: {
    fontSize: typography.size.sm,
    fontFamily: typography.family.semibold,
    color: colors.textPrimary
  },
  addressLandmark: {
    fontSize: typography.size.xs,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    marginTop: 2
  },
  addressCity: {
    fontSize: typography.size.xs,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    marginTop: 2
  },
  addAddressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.softBackground
  },
  addAddressText: {
    fontSize: typography.size.sm,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  serviceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primaryLight
  },
  serviceText: {
    fontSize: typography.size.xs,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    marginLeft: spacing.sm
  },
  serviceTitle: {
    fontSize: typography.size.xs,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  serviceMsg: {
    fontSize: typography.size.xs - 1,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    marginTop: 2
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
    backgroundColor: colors.white
  },
  paymentOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    borderWidth: 1.5
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center'
  },
  radioCircleActive: {
    borderColor: colors.primaryDark
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.black
  },
  paymentName: {
    fontSize: typography.size.sm,
    fontFamily: typography.family.semibold,
    color: colors.textPrimary
  },
  paymentDesc: {
    fontSize: typography.size.xs,
    fontFamily: typography.family.regular,
    color: colors.textMuted,
    marginTop: 2
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  summaryLabel: {
    fontSize: typography.size.sm,
    fontFamily: typography.family.regular,
    color: colors.textSecondary
  },
  summaryValue: {
    fontSize: typography.size.sm,
    fontFamily: typography.family.semibold,
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
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  totalValue: {
    fontSize: typography.size.xl,
    fontFamily: typography.family.extraBold,
    color: colors.black
  },
  guaranteeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginHorizontal: spacing.xl
  },
  guaranteeText: {
    fontSize: 11,
    fontFamily: typography.family.regular,
    color: colors.textMuted
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  bottomTotal: {
    fontSize: typography.size.xl,
    fontFamily: typography.family.extraBold,
    color: colors.textPrimary
  },
  bottomMethod: {
    fontSize: typography.size.xs,
    fontFamily: typography.family.regular,
    color: colors.textMuted
  }
});
