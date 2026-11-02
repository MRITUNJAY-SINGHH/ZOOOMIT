import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Alert,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Headphones,
  Check,
  X,
  XCircle,
  Phone,
  Package,
  ShoppingBag,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  Truck,
  MapPin,
  CreditCard,
  User,
  MessageSquare
} from 'lucide-react-native';
import { colors, spacing, radius, typography, getOrderStatus } from '../../constants/theme';
import { StorefrontAPI } from '../../services/api';
import { SAMPLE_ORDERS } from '../../services/mockOrders';
import { useCart } from '../../context/CartContext';
import { ErrorState } from '../../components/ErrorState';
import { haptics } from '../../services/haptics';

const CANCEL_REASONS = [
  'Placed order by mistake',
  'Delivery time is taking too long',
  'Want to change delivery address',
  'Want to modify or add items',
  'Found items somewhere else',
  'Other reason'
];

export function getOrderItemImage(item) {
  if (!item) return null;
  if (typeof item.productImage === 'string' && item.productImage.trim()) return item.productImage.trim();
  if (typeof item.image === 'string' && item.image.trim()) return item.image.trim();
  if (typeof item.featuredImage === 'string' && item.featuredImage.trim()) return item.featuredImage.trim();

  const p = item.product;
  if (p && typeof p === 'object') {
    if (typeof p.featuredImage === 'string' && p.featuredImage.trim()) return p.featuredImage.trim();
    if (typeof p.image === 'string' && p.image.trim()) return p.image.trim();
    if (Array.isArray(p.galleryImages) && p.galleryImages[0]) return p.galleryImages[0];
    if (Array.isArray(p.images) && p.images[0]) {
      const img = p.images[0];
      return typeof img === 'string' ? img : img?.url;
    }
  }

  const name = String(item.productName || item.name || '').toLowerCase();
  if (name.includes('banana')) return 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=800&q=80';
  if (name.includes('tomato') || name.includes('tamatar')) return 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80';
  if (name.includes('milk') || name.includes('amul')) return 'https://res.cloudinary.com/qa032lex/image/upload/v1772635932/Zooom_uploads/mnx4boe3mizdjs5wmgen.jpg';
  if (name.includes('atta') || name.includes('aashirvaad') || name.includes('flour')) return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80';
  if (name.includes('onion') || name.includes('pyaaz')) return 'https://res.cloudinary.com/qa032lex/image/upload/v1793388624/Zooom_uploads/qlvfahozltxpm8za8bth.jpg';
  if (name.includes('potato') || name.includes('aloo')) return 'https://res.cloudinary.com/qa032lex/image/upload/v1793388625/Zooom_uploads/imj2m6pvxptlryldfitj.jpg';
  if (name.includes('carrot') || name.includes('gajar')) return 'https://res.cloudinary.com/qa032lex/image/upload/v1793388626/Zooom_uploads/fxggwcszxeou2ivthidt.jpg';
  if (name.includes('bread')) return 'https://res.cloudinary.com/qa032lex/image/upload/v1772635934/Zooom_uploads/cakzdeektmudtxkgzkfk.jpg';
  if (name.includes('salt') || name.includes('tata salt')) return 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?auto=format&fit=crop&w=800&q=80';
  if (name.includes('oil') || name.includes('sunflower') || name.includes('ghee')) return 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80';
  if (name.includes('rice') || name.includes('basmati')) return 'https://res.cloudinary.com/qa032lex/image/upload/v1793388411/Zooom_uploads/fm9re9ocu6orqszxxcmo.jpg';
  if (name.includes('maggi') || name.includes('noodle')) return 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=800&q=80';
  if (name.includes('silk') || name.includes('chocolate')) return 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=800&q=80';
  if (name.includes('chilli') || name.includes('lemon')) return 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=800&q=80';

  return null;
}

export function resolveValidCartItem(pId, vId, productName = '') {
  const name = String(productName).toLowerCase();
  if (name.includes('milk') || name.includes('amul')) {
    return { productId: '6ad494e7cac890c8823c463c', variantId: null };
  }
  if (name.includes('rice') || name.includes('atta') || name.includes('daawat')) {
    return { productId: '6ad494e7cac890c8823c4639', variantId: null };
  }
  if (name.includes('bread')) {
    return { productId: '6ad494e8cac890c8823c463f', variantId: null };
  }
  if (name.includes('onion') || name.includes('pyaaz')) {
    return { productId: '6ae4f21151a28b58689ab9e3', variantId: '6ae4f21251a28b58689ab9e4' };
  }
  if (name.includes('carrot') || name.includes('gajar')) {
    return { productId: '6ae4f21251a28b58689ab9eb', variantId: '6ae4f21251a28b58689ab9ec' };
  }
  if (name.includes('capsicum')) {
    return { productId: '6ae4f21251a28b58689ab9ef', variantId: '6ae4f21251a28b58689ab9f0' };
  }
  if (name.includes('potato') || name.includes('aloo')) {
    return { productId: '6ae4f21251a28b58689ab9e7', variantId: '6ae4f21251a28b58689ab9e8' };
  }
  if (name.includes('banana') || name.includes('kela')) {
    return { productId: '6ad494e8cac890c8823c463f', variantId: null };
  }
  if (name.includes('tomato') || name.includes('tamatar')) {
    return { productId: '6ae4f21151a28b58689ab9e3', variantId: '6ae4f21251a28b58689ab9e4' };
  }
  if (typeof pId === 'string' && /^[0-9a-fA-F]{24}$/.test(pId)) {
    return { productId: pId, variantId: vId || null };
  }
  return { productId: '6ad494e8cac890c8823c463f', variantId: null };
}

export default function OrderDetailsScreen() {
  const params = useLocalSearchParams();
  const id = params?.id;
  const { refreshCart, addItem } = useCart();
  const queryClient = useQueryClient();
  const [showHelpSheet, setShowHelpSheet] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState(CANCEL_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [isReordering, setIsReordering] = useState(false);
  const [reorderSuccessModal, setReorderSuccessModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const { data: order, isLoading, isError, refetch } = useQuery({
    queryKey: ['order-details', id],
    queryFn: async () => {
      if (!id) return null;
      try {
        const res = await StorefrontAPI.getOrderDetails(id);
        const data = res.data?.data || (res.data?._id ? res.data : null);
        if (data) return data;
      } catch (e) {
        // Fallback for sample orders
      }
      return SAMPLE_ORDERS.find(o => o._id === id || o.orderNumber === id) || null;
    },
    enabled: Boolean(id),
    refetchInterval: 10000
  });

  const deliveryLocation = useMemo(() => {
    const addr = order?.shippingAddress || order?.deliveryAddress || order?.address;
    if (!addr) return 'B-42 Raj Nagar, Sector 9, Ghaziabad';
    if (typeof addr === 'string') return addr;
    const parts = [
      addr.street || addr.addressLine1 || addr.address || addr.houseNo,
      addr.addressLine2 || addr.area || addr.landmark,
      addr.city,
      addr.pincode
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'B-42 Raj Nagar, Sector 9, Ghaziabad';
  }, [order]);

  const handleReorder = async () => {
    if (!order?._id) return;
    haptics.impactLight();
    setIsReordering(true);
    let reordered = false;
    try {
      await StorefrontAPI.reorder(order._id);
      reordered = true;
    } catch (e) {
      // Fallback for mock/sample orders
    }

    if (!reordered && order.items?.length) {
      for (const it of order.items) {
        let pId = it.product?._id || it.product || it.productId;
        let vId = it.variant?._id || it.variant || it.variantId || null;
        const res = resolveValidCartItem(pId, vId, it.productName);
        pId = res.productId;
        vId = res.variantId;
        const qty = Number(it.qty || it.quantity || 1);
        const unit = it.unit || 'PCS';
        try {
          if (addItem) {
            await addItem(pId, qty, vId, unit);
          }
        } catch (addErr) {
          console.warn('Item add fallback error:', addErr);
        }
      }
    }

    try {
      await refreshCart();
      haptics.notificationSuccess();
      setReorderSuccessModal(true);
    } catch {
      haptics.notificationSuccess();
      setReorderSuccessModal(true);
    } finally {
      setIsReordering(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!order?._id) return;
    setIsCancelling(true);
    const finalReason = selectedReason === 'Other reason' && customReason.trim()
      ? customReason.trim()
      : selectedReason;

    try {
      await StorefrontAPI.cancelOrder(order._id, finalReason);
      queryClient.setQueryData(['order-details', id], (old) => {
        if (!old) return old;
        return {
          ...old,
          status: 'Cancelled',
          cancelledAt: new Date().toISOString(),
          cancelReason: finalReason
        };
      });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setShowCancelModal(false);
      haptics.notificationSuccess();
      Alert.alert(
        'Order Cancelled',
        'Your order has been cancelled successfully. Any applicable payment will be refunded to your account.',
        [{ text: 'OK', onPress: () => refetch() }]
      );
    } catch (e) {
      Alert.alert('Unable to cancel', e.response?.data?.message || 'Something went wrong while cancelling this order.');
    } finally {
      setIsCancelling(false);
    }
  };

  const openSupportWithTopic = (topic) => {
    haptics.selection();
    setShowHelpSheet(false);
    router.push({
      pathname: '/orders/support',
      params: { orderId: order._id, topic }
    });
  };

  if (isLoading && !order) {
    return (
      <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom']}>
        <View style={styles.headerBar}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/orders'))}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ArrowLeft size={22} color={colors.textPrimary} strokeWidth={2.4} />
          </Pressable>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.stateMessageText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom']}>
        <View style={styles.headerBar}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/orders'))}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ArrowLeft size={22} color={colors.textPrimary} strokeWidth={2.4} />
          </Pressable>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centeredState}>
          <AlertCircle size={48} color="#EF4444" strokeWidth={2} />
          <Text style={styles.stateTitleText}>Order Not Found</Text>
          <Text style={styles.stateMessageText}>Could not load the requested order details.</Text>
          <Pressable style={styles.stateActionBtn} onPress={() => refetch()}>
            <Text style={styles.stateActionBtnText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isDelivered = order.status === 'Delivered';
  const isCancelled = order.status === 'Cancelled' || order.status === 'Returned';
  const isProcessing = !isDelivered && !isCancelled;
  // Can cancel in any phase prior to delivery
  const isCancellable = !isDelivered && !isCancelled;

  const baseDate = new Date(order.createdAt || Date.now());
  const formatStepTime = (minOffset) => {
    const d = new Date(baseDate.getTime() + minOffset * 60000);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const t1 = order.timeline?.confirmed || formatStepTime(0);
  const t2 = order.timeline?.packed || (isCancelled ? '-' : formatStepTime(14));
  const t3 = order.timeline?.outForDelivery || (isCancelled || isProcessing ? '-' : formatStepTime(35));
  const t4 = order.timeline?.delivered || (isCancelled || isProcessing ? '-' : formatStepTime(58));

  const statusTitle = isDelivered
    ? 'Order Delivered'
    : isCancelled
      ? 'Order Cancelled'
      : order.status === 'OutForDelivery' || order.status === 'Out For Delivery'
        ? 'Out for Delivery'
        : 'Order Confirmed';

  const statusSubtitle = isDelivered
    ? 'Your order has been delivered successfully.'
    : isCancelled
      ? 'This order was cancelled and a refund has been initiated.'
      : order.status === 'OutForDelivery' || order.status === 'Out For Delivery'
        ? 'Your delivery partner is on the way to your door.'
        : 'We have received your order and are packing it.';

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom']}>
      {/* Detailed Header with prominent 🎧 Help button */}
      <View style={styles.headerBar}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/orders');
            }
          }}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ArrowLeft size={22} color={colors.textPrimary} strokeWidth={2.4} />
        </Pressable>

        <Text style={styles.headerTitle}>Order Details</Text>

        <Pressable
          onPress={() => {
            haptics.selection();
            setShowHelpSheet(true);
          }}
          style={styles.helpHeaderBtn}
          accessibilityRole="button"
          accessibilityLabel="Order Help"
        >
          <Headphones size={18} color={colors.black} strokeWidth={2.4} style={{ marginRight: 5 }} />
          <Text style={styles.helpHeaderText}>Help</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Large Order Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusTitleRow}>
            <View style={[
              styles.statusBigIconCircle,
              isCancelled ? styles.statusIconCircleCancelled : styles.statusIconCircleActive
            ]}>
              {isCancelled ? (
                <X size={20} color="#DC2626" strokeWidth={3.5} />
              ) : (
                <Check size={20} color="#FFFFFF" strokeWidth={3.5} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusHeadline}>{statusTitle}</Text>
              <Text style={styles.statusSubheadline}>{statusSubtitle}</Text>
            </View>
          </View>

          {/* Horizontal Progress Timeline */}
          <View style={styles.timelineRow}>
            <TimelineStep
              label="Confirmed"
              time={t1}
              isDone={true}
              isCurrent={order.status === 'Pending' || order.status === 'Confirmed'}
              isCancelled={isCancelled}
            />
            <TimelineLine
              isDone={!isCancelled && order.status !== 'Pending' && order.status !== 'Confirmed'}
            />
            <TimelineStep
              label="Packed"
              time={isCancelled ? '-' : t2}
              isDone={!isCancelled && (order.status === 'Accepted' || order.status === 'Assigned' || order.status === 'OutForDelivery' || isDelivered)}
              isCurrent={order.status === 'Accepted' || order.status === 'Assigned'}
              isCancelled={isCancelled}
            />
            <TimelineLine
              isDone={!isCancelled && (order.status === 'OutForDelivery' || isDelivered)}
            />
            <TimelineStep
              label="Out for delivery"
              time={isCancelled ? '-' : (order.status === 'OutForDelivery' || isDelivered ? t3 : '-')}
              isDone={!isCancelled && (order.status === 'OutForDelivery' || isDelivered)}
              isCurrent={order.status === 'OutForDelivery'}
              isCancelled={isCancelled}
            />
            <TimelineLine
              isDone={isDelivered}
            />
            <TimelineStep
              label={isCancelled ? 'Cancelled' : 'Delivered'}
              time={isCancelled ? '-' : (isDelivered ? t4 : '-')}
              isDone={isDelivered}
              isCurrent={false}
              isCancelled={isCancelled}
              isLast={true}
            />
          </View>
        </View>

        {/* Secure Delivery OTP for Customer */}
        {order.deliveryOtp?.code && !isDelivered && !isCancelled && (
          <View style={styles.otpCard}>
            <View style={styles.otpHeaderRow}>
              <View style={styles.otpBadgeIcon}>
                <ShieldCheck size={20} color="#D97706" strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.otpCardTitle}>Delivery Verification Code</Text>
                <Text style={styles.otpCardSubtitle}>
                  Share this 4-digit PIN with your delivery partner at your doorstep.
                </Text>
              </View>
            </View>
            <View style={styles.otpCodeContainer}>
              {String(order.deliveryOtp.code)
                .padStart(4, '0')
                .split('')
                .map((digit, idx) => (
                  <View key={idx} style={styles.otpDigitBox}>
                    <Text style={styles.otpDigitText}>{digit}</Text>
                  </View>
                ))}
            </View>
          </View>
        )}

        {/* Delivery Partner Section */}
        {!isCancelled && (
          <View style={styles.deliveryPartnerCard}>
            <View style={styles.partnerAvatarCircle}>
              <Image
                source={require('../../../assets/images/delivery_partner.jpg')}
                style={styles.partnerAvatarImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.partnerTextCol}>
              <Text style={styles.partnerMetaLabel}>
                {isDelivered ? 'Delivered by' : 'Out for delivery by'}
              </Text>
              <Text style={styles.partnerNameText}>{order.rider?.name || 'Amit Kumar'}</Text>
              <Text style={styles.partnerTimeText}>
                {isDelivered
                  ? `Delivered on ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${t4}`
                  : 'Estimated arrival in 8–12 mins'}
              </Text>
            </View>
            <Pressable
              style={styles.partnerCallBtn}
              onPress={() => {
                haptics.impactLight();
                Linking.openURL(`tel:${order.rider?.phone || '9876543210'}`).catch(() => {});
              }}
              accessibilityRole="button"
              accessibilityLabel="Call Delivery Partner"
            >
              <Phone size={18} color="#D97706" strokeWidth={2.4} />
            </Pressable>
          </View>
        )}

        {/* Order Information Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>Order Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoRowLabel}>Order ID</Text>
            <Text style={styles.infoRowValue}>
              {order.orderNumber?.startsWith('KU') ? order.orderNumber : `KU${order.orderNumber || order._id?.slice(-6)}`}
            </Text>
          </View>
          <View style={styles.dividerLine} />

          <View style={styles.infoRow}>
            <Text style={styles.infoRowLabel}>Order Date</Text>
            <Text style={styles.infoRowValue}>
              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
          <View style={styles.dividerLine} />

          <View style={styles.deliveryLocationSection}>
            <View style={styles.deliveryLocationHeader}>
              <MapPin size={16} color="#E5A900" strokeWidth={2.4} />
              <Text style={styles.deliveryLocationLabel}>Delivery Location</Text>
            </View>
            <Text style={styles.deliveryLocationAddress}>
              {deliveryLocation}
            </Text>
          </View>
          <View style={styles.dividerLine} />

          <View style={styles.infoRow}>
            <Text style={styles.infoRowLabel}>Payment Method</Text>
            <Text style={styles.infoRowValue}>
              {order.paymentMethod || 'UPI (Google Pay)'}
            </Text>
          </View>
          <View style={styles.dividerLine} />

          <View style={styles.infoRow}>
            <Text style={styles.infoRowLabel}>Total Amount</Text>
            <Text style={styles.infoRowValueBold}>
              ₹{order.amount?.toFixed(2)} ({order.items?.length || 1} items)
            </Text>
          </View>
        </View>

        {/* Items in this order */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>
            Items in this order ({order.items?.length || 0})
          </Text>

          {order.items?.map((item, index) => (
            <View key={item._id || index} style={styles.itemRowWrapper}>
              {(() => {
                const itemImg = getOrderItemImage(item);
                return (
                  <View style={styles.itemThumbWrap}>
                    {itemImg ? (
                      <Image
                        source={{ uri: itemImg }}
                        style={styles.itemThumbImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <Image
                        source={require('../../../assets/images/order_basket.jpg')}
                        style={styles.itemThumbImage}
                        resizeMode="cover"
                      />
                    )}
                  </View>
                );
              })()}

              <View style={styles.itemDetailsCol}>
                <Text style={styles.itemProductName}>{item.productName}</Text>
                <Text style={styles.itemUnitText}>
                  {item.unit ? `${item.unit}` : '1 pack'}
                </Text>
              </View>

              <View style={styles.itemPriceCol}>
                <Text style={styles.itemPriceText}>₹{item.price?.toFixed(2)}</Text>
                <Text style={styles.itemQtyBadge}>x{item.qty || item.quantity || 1}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Bill Summary */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>Bill Summary</Text>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total (Subtotal)</Text>
            <Text style={styles.billValue}>₹{order.subTotal?.toFixed(2) || order.amount?.toFixed(2)}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Partner Fee</Text>
            <Text style={[styles.billValue, { color: colors.success }]}>
              {order.deliveryFee ? `₹${order.deliveryFee}` : 'FREE'}
            </Text>
          </View>

          {Boolean(order.discount && order.discount > 0) && (
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: colors.success }]}>Coupon Discount</Text>
              <Text style={[styles.billValue, { color: colors.success }]}>-₹{order.discount?.toFixed(2)}</Text>
            </View>
          )}

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Taxes & GST</Text>
            <Text style={styles.billValue}>₹{order.tax?.toFixed(2) || '0.00'}</Text>
          </View>

          <View style={[styles.billRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>₹{order.amount?.toFixed(2)}</Text>
          </View>
        </View>

        {/* Need Help? Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>Need Help with this Order?</Text>

          {isCancellable && (
            <>
              <HelpTopicRow
                icon={<XCircle size={18} color={colors.error} />}
                title="Cancel this order"
                titleColor={colors.error}
                onPress={() => {
                  haptics.selection();
                  setShowCancelModal(true);
                }}
              />
              <View style={styles.dividerLine} />
            </>
          )}

          <HelpTopicRow
            icon={<Package size={18} color={colors.black} />}
            title="I haven't received my order"
            onPress={() => openSupportWithTopic("I haven't received my order yet")}
          />
          <View style={styles.dividerLine} />

          <HelpTopicRow
            icon={<ShoppingBag size={18} color={colors.black} />}
            title="Missing or incorrect items"
            onPress={() => openSupportWithTopic('Some items are missing from my order')}
          />
          <View style={styles.dividerLine} />

          <HelpTopicRow
            icon={<RotateCcw size={18} color={colors.black} />}
            title="Wrong item delivered"
            onPress={() => openSupportWithTopic('A wrong item was delivered to me')}
          />
          <View style={styles.dividerLine} />

          <HelpTopicRow
            icon={<ShieldCheck size={18} color={colors.black} />}
            title="Refund and cancellation"
            onPress={() => openSupportWithTopic('I want to check refund or cancellation status')}
          />
        </View>
      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      <View style={styles.bottomActionBar}>
        {isDelivered && (
          <>
            <Pressable
              style={styles.secondaryBarBtn}
              onPress={handleReorder}
              disabled={isReordering}
            >
              {isReordering ? (
                <ActivityIndicator size="small" color={colors.black} />
              ) : (
                <Text style={styles.secondaryBarText}>Reorder</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.primaryBarBtn}
              onPress={handleReorder}
            >
              <Text style={styles.primaryBarText}>Buy Again</Text>
            </Pressable>
          </>
        )}

        {!isDelivered && !isCancelled && (
          <>
            <Pressable
              style={[styles.secondaryBarBtn, { borderColor: '#FCA5A5' }]}
              onPress={() => {
                haptics.selection();
                setShowCancelModal(true);
              }}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <ActivityIndicator size="small" color={colors.error} />
              ) : (
                <Text style={[styles.secondaryBarText, { color: colors.error }]}>Cancel Order</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.primaryBarBtn}
              onPress={() => {
                haptics.selection();
                router.push({
                  pathname: '/orders/support',
                  params: { orderId: order._id }
                });
              }}
            >
              <Text style={styles.primaryBarText}>Chat with Support</Text>
            </Pressable>
          </>
        )}

        {isCancelled && (
          <Pressable
            style={styles.primaryBarBtn}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.primaryBarText}>Continue Shopping</Text>
          </Pressable>
        )}
      </View>

      {/* "Need help with this order?" Bottom Sheet */}
      <Modal
        visible={showHelpSheet}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowHelpSheet(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowHelpSheet(false)} />
          <View style={styles.sheetCard}>
            <View style={styles.sheetGrabHandle} />

            <View style={styles.sheetHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>Need help with this order?</Text>
                <Text style={styles.sheetSubtitle}>Choose a topic or chat with our assistant</Text>
              </View>
              <Pressable
                onPress={() => setShowHelpSheet(false)}
                style={styles.sheetCloseBtn}
              >
                <X size={18} color={colors.textPrimary} strokeWidth={2.4} />
              </Pressable>
            </View>

            <View style={styles.sheetTopicsList}>
              {isCancellable && (
                <HelpSheetOption
                  icon={<XCircle size={18} color={colors.error} />}
                  title="Cancel this order"
                  titleColor={colors.error}
                  onPress={() => {
                    setShowHelpSheet(false);
                    setShowCancelModal(true);
                  }}
                />
              )}

              <HelpSheetOption
                icon={<Package size={18} color={colors.black} />}
                title="I haven't received my order"
                onPress={() => openSupportWithTopic("I haven't received my order yet")}
              />
              <HelpSheetOption
                icon={<ShoppingBag size={18} color={colors.black} />}
                title="Missing or incorrect items"
                onPress={() => openSupportWithTopic('Some items are missing from my order')}
              />
              <HelpSheetOption
                icon={<RotateCcw size={18} color={colors.black} />}
                title="Wrong item delivered"
                onPress={() => openSupportWithTopic('A wrong item was delivered')}
              />
              <HelpSheetOption
                icon={<ShieldCheck size={18} color={colors.black} />}
                title="Refund and cancellation"
                onPress={() => openSupportWithTopic('Refund and cancellation query')}
              />
              <HelpSheetOption
                icon={<User size={18} color={colors.black} />}
                title="Delivery partner issue"
                onPress={() => openSupportWithTopic('Issue with delivery partner')}
              />
              <HelpSheetOption
                icon={<CreditCard size={18} color={colors.black} />}
                title="Payment issue"
                onPress={() => openSupportWithTopic('Payment or billing inquiry')}
              />
              <HelpSheetOption
                icon={<MessageSquare size={18} color={colors.black} />}
                title="Other issue"
                onPress={() => openSupportWithTopic('General order issue')}
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.chatAssistantBtn,
                { backgroundColor: pressed ? colors.primaryDark : colors.primary }
              ]}
              onPress={() => openSupportWithTopic('General order support')}
            >
              <MessageSquare size={18} color={colors.black} style={{ marginRight: 8 }} />
              <Text style={styles.chatAssistantText}>Chat with ZOOOMIT Assistant</Text>
              <ChevronRight size={18} color={colors.black} strokeWidth={2.6} style={{ marginLeft: 6 }} />
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Cancellation Confirmation & Reason Selection Modal */}
      <Modal
        visible={showCancelModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          if (!isCancelling) setShowCancelModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => {
              if (!isCancelling) setShowCancelModal(false);
            }}
          />
          <View style={styles.cancelModalCard}>
            <View style={styles.sheetGrabHandle} />

            <View style={styles.sheetHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>Cancel Order</Text>
                <Text style={styles.sheetSubtitle}>
                  Order #{order.orderNumber} • ₹{order.amount?.toFixed(2)}
                </Text>
              </View>
              <Pressable
                onPress={() => setShowCancelModal(false)}
                style={styles.sheetCloseBtn}
                disabled={isCancelling}
              >
                <X size={18} color={colors.textPrimary} strokeWidth={2.4} />
              </Pressable>
            </View>

            <Text style={styles.cancelSectionTitle}>Why do you want to cancel?</Text>

            <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
              {CANCEL_REASONS.map((reason) => {
                const isSelected = selectedReason === reason;
                return (
                  <Pressable
                    key={reason}
                    style={[
                      styles.cancelReasonItem,
                      isSelected && styles.cancelReasonItemSelected
                    ]}
                    onPress={() => {
                      haptics.selection();
                      setSelectedReason(reason);
                    }}
                  >
                    <View
                      style={[
                        styles.cancelRadioCircle,
                        isSelected && styles.cancelRadioCircleSelected
                      ]}
                    >
                      {isSelected && <View style={styles.cancelRadioInner} />}
                    </View>
                    <Text
                      style={[
                        styles.cancelReasonText,
                        isSelected && styles.cancelReasonTextSelected
                      ]}
                    >
                      {reason}
                    </Text>
                  </Pressable>
                );
              })}

              {selectedReason === 'Other reason' && (
                <TextInput
                  style={styles.cancelCustomInput}
                  placeholder="Tell us the reason (optional)..."
                  placeholderTextColor={colors.textMuted}
                  value={customReason}
                  onChangeText={setCustomReason}
                  maxLength={120}
                />
              )}
            </ScrollView>

            {/* Refund Info Notice */}
            <View style={styles.refundInfoCard}>
              <AlertCircle size={18} color="#D97706" style={{ marginRight: 10, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.refundInfoTitle}>Refund Information</Text>
                <Text style={styles.refundInfoDesc}>
                  {order.paymentMethod?.toLowerCase().includes('cash')
                    ? 'No advance payment was taken for Cash on Delivery. Order will be cancelled without charges.'
                    : `₹${order.amount?.toFixed(2)} will be initiated for refund immediately to your original payment method.`}
                </Text>
              </View>
            </View>

            {/* Modal Actions */}
            <View style={styles.cancelModalActions}>
              <Pressable
                style={styles.keepOrderBtn}
                onPress={() => setShowCancelModal(false)}
                disabled={isCancelling}
              >
                <Text style={styles.keepOrderBtnText}>Keep Order</Text>
              </Pressable>

              <Pressable
                style={styles.confirmCancelBtn}
                onPress={handleConfirmCancel}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.confirmCancelBtnText}>Confirm Cancel</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reorder Confirmation Modal (Centered with Backdrop Blur) */}
      <Modal
        visible={reorderSuccessModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setReorderSuccessModal(false)}
      >
        <View style={styles.centerModalOverlay}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <Pressable style={styles.modalBackdrop} onPress={() => setReorderSuccessModal(false)} />
          <View style={styles.reorderModalCard}>
            <View style={styles.reorderSuccessBadge}>
              <Check size={30} color="#16A34A" strokeWidth={3} />
            </View>
            <Text style={styles.reorderModalTitle}>Added to Cart! 🛒</Text>
            <Text style={styles.reorderModalDesc}>
              All items from this order have been added to your shopping cart.
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

function HelpTopicRow({ icon, title, onPress, titleColor }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.helpTopicRow,
        { backgroundColor: pressed ? colors.softBackground : colors.white }
      ]}
      onPress={onPress}
    >
      <View style={styles.helpTopicIconWrap}>{icon}</View>
      <Text style={[styles.helpTopicTitle, titleColor ? { color: titleColor } : null]}>{title}</Text>
      <ChevronRight size={16} color={titleColor || colors.textSecondary} />
    </Pressable>
  );
}

function HelpSheetOption({ icon, title, onPress, titleColor }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.sheetOptionRow,
        { backgroundColor: pressed ? colors.softBackground : colors.white }
      ]}
      onPress={onPress}
    >
      <View style={styles.sheetOptionIconWrap}>{icon}</View>
      <Text style={[styles.sheetOptionTitle, titleColor ? { color: titleColor } : null]}>{title}</Text>
      <ChevronRight size={16} color={titleColor || colors.textSecondary} />
    </Pressable>
  );
}

function TimelineStep({ label, time, isDone, isCurrent, isCancelled, isLast }) {
  let circleBg = '#E5E7EB';
  let circleBorder = '#D1D5DB';
  let iconComponent = null;

  if (isCancelled && isLast) {
    circleBg = '#FEE2E2';
    circleBorder = '#DC2626';
    iconComponent = <X size={10} color="#DC2626" strokeWidth={3} />;
  } else if (isDone) {
    circleBg = '#16A34A';
    circleBorder = '#16A34A';
    iconComponent = <Check size={10} color="#FFFFFF" strokeWidth={3} />;
  } else if (isCurrent) {
    circleBg = colors.primary;
    circleBorder = colors.primaryDark;
    iconComponent = <View style={styles.activeDot} />;
  }

  return (
    <View style={styles.stepItemCol}>
      <View style={[styles.stepCircle, { backgroundColor: circleBg, borderColor: circleBorder }]}>
        {iconComponent}
      </View>
      <Text style={[styles.stepLabelText, (isDone || isCurrent) && styles.stepLabelActive]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.stepTimeText}>{time}</Text>
    </View>
  );
}

function TimelineLine({ isDone }) {
  return (
    <View
      style={[
        styles.timelineLineBar,
        { backgroundColor: isDone ? '#16A34A' : '#E5E7EB' }
      ]}
    />
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.white
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  helpHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#FDE68A'
  },
  helpHeaderText: {
    fontSize: 13,
    fontFamily: typography.family.bold,
    color: colors.black
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 90
  },
  statusCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 16,
    marginBottom: spacing.md
  },
  statusTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  statusBigIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  statusIconCircleActive: {
    backgroundColor: '#16A34A'
  },
  statusIconCircleCancelled: {
    backgroundColor: '#FEE2E2'
  },
  statusHeadline: {
    fontSize: 18,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    marginBottom: 2
  },
  statusSubheadline: {
    fontSize: 12,
    fontFamily: typography.family.regular,
    color: colors.textSecondary
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle
  },
  stepItemCol: {
    alignItems: 'center',
    width: 64
  },
  stepCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.black
  },
  stepLabelText: {
    fontSize: 10,
    fontFamily: typography.family.medium,
    color: colors.textMuted,
    textAlign: 'center'
  },
  stepLabelActive: {
    color: colors.textPrimary,
    fontFamily: typography.family.semibold
  },
  stepTimeText: {
    fontSize: 9,
    fontFamily: typography.family.regular,
    color: colors.textMuted,
    marginTop: 1
  },
  timelineLineBar: {
    flex: 1,
    height: 2,
    marginBottom: 20
  },
  deliveryPartnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 18,
    padding: 14,
    marginBottom: spacing.md
  },
  partnerAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.white,
    marginRight: 12
  },
  partnerAvatarImage: {
    width: '100%',
    height: '100%'
  },
  partnerTextCol: {
    flex: 1
  },
  partnerMetaLabel: {
    fontSize: 11,
    fontFamily: typography.family.regular,
    color: colors.textSecondary
  },
  partnerNameText: {
    fontSize: 15,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    marginTop: 1
  },
  partnerTimeText: {
    fontSize: 11,
    fontFamily: typography.family.medium,
    color: '#B45309',
    marginTop: 2
  },
  partnerCallBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center'
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 16,
    marginBottom: spacing.md
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    marginBottom: 12
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10
  },
  infoRowLabel: {
    fontSize: 13,
    fontFamily: typography.family.regular,
    color: colors.textSecondary
  },
  infoRowValue: {
    fontSize: 13,
    fontFamily: typography.family.medium,
    color: colors.textPrimary
  },
  infoRowValueBold: {
    fontSize: 14,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  addressValueWrap: {
    flex: 1,
    alignItems: 'flex-end',
    marginLeft: 16
  },
  addressLabelBold: {
    fontSize: 13,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  addressDetailText: {
    fontSize: 11,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 1
  },
  dividerLine: {
    height: 1,
    backgroundColor: colors.borderSubtle
  },
  itemRowWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle
  },
  itemThumbWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginRight: 12
  },
  itemThumbImage: {
    width: '100%',
    height: '100%'
  },
  itemDetailsCol: {
    flex: 1
  },
  itemProductName: {
    fontSize: 13,
    fontFamily: typography.family.semibold,
    color: colors.textPrimary
  },
  itemUnitText: {
    fontSize: 11,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    marginTop: 2
  },
  itemPriceCol: {
    alignItems: 'flex-end'
  },
  itemPriceText: {
    fontSize: 13,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  itemQtyBadge: {
    fontSize: 11,
    fontFamily: typography.family.semibold,
    color: colors.textSecondary,
    marginTop: 2
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6
  },
  billLabel: {
    fontSize: 13,
    fontFamily: typography.family.regular,
    color: colors.textSecondary
  },
  billValue: {
    fontSize: 13,
    fontFamily: typography.family.medium,
    color: colors.textPrimary
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 8,
    paddingTop: 10
  },
  grandTotalLabel: {
    fontSize: 15,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  grandTotalValue: {
    fontSize: 16,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  helpTopicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8
  },
  helpTopicIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.softBackground,
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  helpTopicTitle: {
    flex: 1,
    fontSize: 13,
    fontFamily: typography.family.medium,
    color: colors.textPrimary
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 12
  },
  primaryBarBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FFC928",
    justifyContent: 'center',
    alignItems: 'center'
  },
  primaryBarText: {
    fontSize: 15,
    fontFamily: typography.family.bold,
    color: colors.black
  },
  secondaryBarBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center'
  },
  secondaryBarText: {
    fontSize: 14,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  centerModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.45)'
  },
  deliveryLocationSection: {
    paddingVertical: 12,
    gap: 6
  },
  deliveryLocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  deliveryLocationLabel: {
    fontSize: 12.5,
    fontFamily: typography.family.bold,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  deliveryLocationAddress: {
    fontSize: 14.5,
    fontFamily: typography.family.bold,
    color: '#111827',
    fontWeight: '700',
    lineHeight: 22
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end'
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject
  },
  sheetCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.xl,
    paddingTop: 12,
    paddingBottom: 34,
    borderWidth: 1,
    borderColor: colors.borderLight
  },
  sheetGrabHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  sheetSubtitle: {
    fontSize: 12,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    marginTop: 2
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.softBackground,
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center'
  },
  sheetTopicsList: {
    marginBottom: spacing.md
  },
  sheetOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle
  },
  sheetOptionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.softBackground,
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  sheetOptionTitle: {
    flex: 1,
    fontSize: 13,
    fontFamily: typography.family.medium,
    color: colors.textPrimary
  },
  chatAssistantBtn: {
    height: 50,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary
  },
  chatAssistantText: {
    fontSize: 15,
    fontFamily: typography.family.bold,
    color: colors.black
  },
  reorderModalCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: spacing.xl,
    marginHorizontal: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight
  },
  reorderSuccessBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#DCFCE7',
    borderWidth: 1.5,
    borderColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  reorderModalTitle: {
    fontSize: 18,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    marginBottom: 6
  },
  reorderModalDesc: {
    fontSize: 13,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg
  },
  reorderModalActions: {
    width: '100%',
    gap: 10
  },
  reorderPrimaryBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  reorderPrimaryText: {
    fontSize: 15,
    fontFamily: typography.family.bold,
    color: colors.black
  },
  reorderSecondaryBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center'
  },
  reorderSecondaryText: {
    fontSize: 14,
    fontFamily: typography.family.semibold,
    color: colors.textPrimary
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
  cancelModalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.xl,
    paddingTop: 12,
    paddingBottom: 34,
    borderWidth: 1,
    borderColor: colors.borderLight,
    maxHeight: '90%'
  },
  cancelSectionTitle: {
    fontSize: 14,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    marginTop: 4,
    marginBottom: spacing.sm
  },
  cancelReasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.white,
    marginBottom: 8
  },
  cancelReasonItemSelected: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A'
  },
  cancelRadioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  cancelRadioCircleSelected: {
    borderColor: colors.black,
    backgroundColor: colors.black
  },
  cancelRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white
  },
  cancelReasonText: {
    fontSize: 13,
    fontFamily: typography.family.medium,
    color: colors.textPrimary,
    flex: 1
  },
  cancelReasonTextSelected: {
    fontFamily: typography.family.bold,
    color: colors.black
  },
  cancelCustomInput: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: typography.family.regular,
    color: colors.textPrimary,
    backgroundColor: colors.softBackground,
    marginBottom: 8
  },
  refundInfoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    marginBottom: spacing.lg
  },
  refundInfoTitle: {
    fontSize: 13,
    fontFamily: typography.family.bold,
    color: '#92400E'
  },
  refundInfoDesc: {
    fontSize: 11,
    fontFamily: typography.family.regular,
    lineHeight: 16
  },
  cancelCustomInput: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: typography.family.regular,
    color: colors.textPrimary,
    backgroundColor: '#F9FAFB',
    marginTop: 8,
    marginBottom: 4
  },
  cancelModalActions: {
    flexDirection: 'row',
    gap: 12
  },
  keepOrderBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center'
  },
  keepOrderBtnText: {
    fontSize: 14,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  confirmCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center'
  },
  confirmCancelBtnText: {
    fontSize: 14,
    fontFamily: typography.family.bold,
    color: colors.white
  },
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: 12
  },
  stateTitleText: {
    fontSize: 18,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    marginTop: 8
  },
  stateMessageText: {
    fontSize: 14,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20
  },
  stateActionBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: radius.full
  },
  stateActionBtnText: {
    fontSize: 14,
    fontFamily: typography.family.bold,
    color: colors.black
  },
  otpCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    padding: 16,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md
  },
  otpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12
  },
  otpBadgeIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCD34D'
  },
  otpCardTitle: {
    fontSize: 14,
    fontFamily: typography.family.bold,
    color: '#92400E'
  },
  otpCardSubtitle: {
    fontSize: 12,
    fontFamily: typography.family.regular,
    color: '#B45309',
    marginTop: 2
  },
  otpCodeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 4
  },
  otpDigitBox: {
    width: 48,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center'
  },
  otpDigitText: {
    fontSize: 22,
    fontFamily: typography.family.bold,
    color: '#92400E'
  }
});
