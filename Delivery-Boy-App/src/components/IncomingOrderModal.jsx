import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Image
} from 'react-native';
import {
  X,
  Check,
  Clock,
  MapPin,
  Navigation,
  Package,
  Sparkles,
  ChevronRight,
  Star,
  ShoppingBag
} from 'lucide-react-native';
import { typography } from '../constants/theme';
import { hapticFeedback } from '../services/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const IncomingOrderModal = ({
  visible,
  order,
  onAccept,
  onDecline,
  onClose,
  accepting = false,
  countdownSeconds = 28
}) => {
  const [timeLeft, setTimeLeft] = useState(countdownSeconds || 28);
  const timerRef = useRef(null);

  // Initialize countdown when modal opens
  useEffect(() => {
    if (visible && order) {
      setTimeLeft(countdownSeconds || 28);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible, Boolean(order)]);

  // Auto-close safely when countdown reaches 0
  useEffect(() => {
    if (timeLeft === 0 && visible) {
      onClose?.();
    }
  }, [timeLeft, visible]);

  if (!visible || !order) return null;

  const orderNumber = order.orderNumber || 'ZM102344';
  const storeName = order.pickupLocation?.storeName || 'ZOOOMIT Supermart Hub';
  const storeAddress =
    order.pickupLocation?.address || 'Sector 4, Main Express Lane, Tech Park';
  const customerName =
    order.deliveryLocation?.contactName || order.customer?.name || 'Walk In Customer 2';
  const customerAddress =
    order.deliveryLocation?.formattedAddress || order.deliveryLocation?.city || 'Raj Nagar, Ghaziabad';
  const itemCount = order.itemCount || (order.items?.length ? order.items.length : 3);
  const distance = order.deliveryLocation?.distanceKm || order.distance || '2.8';

  // Format countdown string MM:SS
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const formattedCountdown = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // Item preview text
  const itemNames = Array.isArray(order.items) && order.items.length > 0
    ? order.items.map((i) => i.product?.name || i.name || 'Item').filter(Boolean).slice(0, 3).join(', ')
    : 'Fresh Apples, Amul Milk, Bread';
  const moreCount = Math.max(0, itemCount - 3);

  return (
    <Modal
      visible={Boolean(visible && order)}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Grab Handle */}
          <View style={styles.grabHandle} />

          {/* Close Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              hapticFeedback.light?.();
              onClose?.();
            }}
            style={styles.closeBtn}
            accessibilityLabel="Dismiss offer"
          >
            <X size={18} color="#64748B" strokeWidth={2.4} />
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Glowing 3D Parcel Graphic with Sparkles */}
            <View style={styles.illustrationWrapper}>
              <View style={styles.sparkleRaysCircle}>
                <View style={styles.sparkleTopLeft}>
                  <Sparkles size={16} color="#F59E0B" />
                </View>
                <View style={styles.sparkleTopRight}>
                  <Sparkles size={18} color="#F59E0B" />
                </View>
                <View style={styles.sparkleBottomLeft}>
                  <Sparkles size={14} color="#F59E0B" />
                </View>
                <View style={styles.sparkleBottomRight}>
                  <Sparkles size={14} color="#F59E0B" />
                </View>

                {/* 3D Yellow Box */}
                <View style={styles.box3DOuter}>
                  <View style={styles.box3DTopLid}>
                    <View style={styles.box3DTapeH} />
                  </View>
                  <View style={styles.box3DFace}>
                    <View style={styles.box3DTapeV} />
                  </View>
                </View>
              </View>
            </View>

            {/* Title & Subtitle */}
            <View style={styles.titleRow}>
              <Star size={20} color="#F59E0B" fill="#F59E0B" style={{ marginRight: 6 }} />
              <Text style={styles.titleText}>New Delivery Offer!</Text>
            </View>
            <Text style={styles.subtitleText}>A new order is available for you</Text>

            {/* Chips & Payment Row */}
            <View style={styles.topChipsRow}>
              {/* Order ID & Timer Left Group */}
              <View style={styles.topChipsLeft}>
                <View style={styles.orderIdChip}>
                  <View style={styles.coinIconBox}>
                    <ShoppingBag size={12} color="#854D0E" strokeWidth={2.4} />
                  </View>
                  <Text style={styles.orderIdText} numberOfLines={1} ellipsizeMode="tail">
                    #{orderNumber}
                  </Text>
                </View>

                {/* Countdown Timer Chip */}
                <View style={styles.timerChip}>
                  <Clock size={13} color="#DC2626" strokeWidth={2.4} style={{ marginRight: 4 }} />
                  <Text style={styles.timerText}>{formattedCountdown}</Text>
                </View>
              </View>

              {/* Payment Mode Pill */}
              <View style={styles.paymentPill}>
                <Text style={styles.paymentPillText}>
                  {(order.paymentMode || order.paymentMethod || '').toLowerCase().includes('cod') ? 'COD' : 'Paid Online'}
                </Text>
              </View>
            </View>

            {/* Route Details Card */}
            <View style={styles.routeCard}>
              {/* Pickup Store */}
              <View style={styles.routeRow}>
                <View style={styles.pickupPinWrap}>
                  <View style={styles.pickupPinCircle}>
                    <MapPin size={14} color="#16A34A" strokeWidth={2.4} />
                  </View>
                  <View style={styles.routeDottedLine} />
                </View>

                <View style={styles.routeTextCol}>
                  <Text style={styles.routeLeadPickup}>Pickup from</Text>
                  <Text style={styles.routeStoreTitle} numberOfLines={1}>
                    {storeName}
                  </Text>
                  <Text style={styles.routeAddressText} numberOfLines={1}>
                    {storeAddress}
                  </Text>
                </View>
              </View>

              {/* Deliver to */}
              <View style={[styles.routeRow, { marginTop: 10 }]}>
                <View style={styles.dropoffPinCircle}>
                  <MapPin size={14} color="#DC2626" strokeWidth={2.4} />
                </View>

                <View style={styles.routeTextCol}>
                  <Text style={styles.routeLeadDeliver}>Deliver to</Text>
                  <Text style={styles.routeCustomerTitle} numberOfLines={1}>
                    {customerName}
                  </Text>
                  <Text style={styles.routeAddressText} numberOfLines={1}>
                    {customerAddress}
                  </Text>
                </View>
              </View>
            </View>

            {/* 3 Meta Chips Row */}
            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <Package size={14} color="#475569" strokeWidth={2.2} style={{ marginRight: 5 }} />
                <Text style={styles.metaText}>{itemCount} items</Text>
              </View>

              <View style={styles.metaChip}>
                <Navigation size={14} color="#475569" strokeWidth={2.2} style={{ marginRight: 5 }} />
                <Text style={styles.metaText}>{distance} km</Text>
              </View>

              <View style={styles.metaChip}>
                <Clock size={14} color="#475569" strokeWidth={2.2} style={{ marginRight: 5 }} />
                <Text style={styles.metaText}>15-20 min</Text>
              </View>
            </View>

            {/* Item Preview Card */}
            <View style={styles.itemPreviewCard}>
              <View style={styles.itemThumbnailsGroup}>
                <View style={[styles.itemThumbBox, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={{ fontSize: 13 }}>🍎</Text>
                </View>
                <View style={[styles.itemThumbBox, { backgroundColor: '#DBEAFE', marginLeft: -8 }]}>
                  <Text style={{ fontSize: 13 }}>🥛</Text>
                </View>
              </View>

              <View style={styles.itemSummaryCol}>
                <Text style={styles.itemSummaryTitle} numberOfLines={1}>
                  {itemNames}
                </Text>
                {moreCount > 0 && (
                  <Text style={styles.itemSummaryMore}>+{moreCount} more items</Text>
                )}
              </View>

              <ChevronRight size={18} color="#94A3B8" strokeWidth={2.2} />
            </View>
          </ScrollView>

          {/* Bottom Action Buttons (Decline / Accept Delivery) */}
          <View style={styles.bottomActionsRow}>
            {/* Decline Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                hapticFeedback.warning?.();
                onDecline?.(order);
              }}
              style={styles.declineBtn}
              accessibilityLabel="Decline Delivery Offer"
            >
              <X size={18} color="#DC2626" strokeWidth={2.6} style={{ marginRight: 6 }} />
              <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>

            {/* Accept Delivery Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                hapticFeedback.success?.();
                onAccept?.(order);
              }}
              disabled={accepting}
              style={styles.acceptBtn}
              accessibilityLabel="Accept Delivery Offer"
            >
              {accepting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Check size={19} color="#FFFFFF" strokeWidth={2.6} style={{ marginRight: 6 }} />
                  <Text style={styles.acceptBtnText}>Accept Delivery</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.65)',
    justifyContent: 'flex-end'
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderColor: '#E5E7EB',
    maxHeight: '92%',
    paddingBottom: 24,
    position: 'relative'
  },
  grabHandle: {
    width: 44,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    alignItems: 'center'
  },

  // 3D Box Illustration
  illustrationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6
  },
  sparkleRaysCircle: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  sparkleTopLeft: {
    position: 'absolute',
    top: 0,
    left: 4
  },
  sparkleTopRight: {
    position: 'absolute',
    top: 4,
    right: 4
  },
  sparkleBottomLeft: {
    position: 'absolute',
    bottom: 6,
    left: 6
  },
  sparkleBottomRight: {
    position: 'absolute',
    bottom: 6,
    right: 6
  },
  box3DOuter: {
    width: 58,
    height: 52,
    alignItems: 'center'
  },
  box3DTopLid: {
    width: 58,
    height: 20,
    backgroundColor: '#FDE047',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1.5,
    borderColor: '#EAB308',
    alignItems: 'center',
    justifyContent: 'center'
  },
  box3DTapeH: {
    width: 20,
    height: 6,
    backgroundColor: '#CA8A04',
    borderRadius: 2
  },
  box3DFace: {
    width: 54,
    height: 32,
    backgroundColor: '#FACC15',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: '#EAB308',
    alignItems: 'center'
  },
  box3DTapeV: {
    width: 8,
    height: '100%',
    backgroundColor: '#EAB308'
  },

  // Title & Subtitle
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4
  },
  titleText: {
    fontFamily: typography.family.heavy,
    fontSize: 21,
    color: '#111827',
    fontWeight: '800'
  },
  subtitleText: {
    fontFamily: typography.family.medium,
    fontSize: 13.5,
    color: '#64748B',
    marginBottom: 16
  },

  // Chips Row
  topChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 14,
    gap: 8
  },
  topChipsLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
    marginRight: 6
  },
  orderIdChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FEF08A',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
    minWidth: 0
  },
  coinIconBox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
    flexShrink: 0
  },
  orderIdText: {
    fontFamily: typography.family.bold,
    fontSize: 12,
    color: '#854D0E',
    flexShrink: 1
  },
  timerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexShrink: 0
  },
  timerText: {
    fontFamily: typography.family.bold,
    fontSize: 12.5,
    color: '#DC2626'
  },
  paymentPill: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  paymentPillText: {
    fontFamily: typography.family.bold,
    fontSize: 12,
    color: '#1D4ED8'
  },

  // Route Card
  routeCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 12
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  pickupPinWrap: {
    alignItems: 'center',
    marginRight: 12
  },
  pickupPinCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  routeDottedLine: {
    width: 2,
    height: 26,
    backgroundColor: '#CBD5E1',
    marginVertical: 4
  },
  dropoffPinCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  routeTextCol: {
    flex: 1
  },
  routeLeadPickup: {
    fontFamily: typography.family.medium,
    fontSize: 11,
    color: '#16A34A',
    marginBottom: 1
  },
  routeLeadDeliver: {
    fontFamily: typography.family.medium,
    fontSize: 11,
    color: '#DC2626',
    marginBottom: 1
  },
  routeStoreTitle: {
    fontFamily: typography.family.bold,
    fontSize: 14.5,
    color: '#111827',
    marginBottom: 1
  },
  routeCustomerTitle: {
    fontFamily: typography.family.bold,
    fontSize: 14.5,
    color: '#111827',
    marginBottom: 1
  },
  routeAddressText: {
    fontFamily: typography.family.regular,
    fontSize: 12,
    color: '#64748B'
  },

  // Meta Chips
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    marginBottom: 12
  },
  metaChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 8
  },
  metaText: {
    fontFamily: typography.family.medium,
    fontSize: 12,
    color: '#334155'
  },

  // Item Preview Card
  itemPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: '100%'
  },
  itemThumbnailsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10
  },
  itemThumbBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  itemSummaryCol: {
    flex: 1
  },
  itemSummaryTitle: {
    fontFamily: typography.family.bold,
    fontSize: 13,
    color: '#111827'
  },
  itemSummaryMore: {
    fontFamily: typography.family.regular,
    fontSize: 11.5,
    color: '#64748B'
  },

  // Bottom Actions
  bottomActionsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
    width: '100%'
  },
  declineBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  declineBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 15,
    color: '#DC2626'
  },
  acceptBtn: {
    flex: 1.6,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  acceptBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 15,
    color: '#FFFFFF'
  }
});

export default IncomingOrderModal;
