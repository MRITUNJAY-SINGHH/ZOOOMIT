import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  TextInput,
  Modal,
  Animated,
  PanResponder,
  useWindowDimensions,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import {
  ArrowLeft,
  MapPin,
  ChevronDown,
  MoreVertical,
  Trash2,
  Zap,
  Bookmark,
  Plus,
  Minus,
  ChevronRight,
  Info,
  Heart,
  ChevronsRight,
  Check,
  X,
  ShieldCheck,
  Percent,
  CreditCard,
  Smartphone,
  Banknote,
  Tag,
  AlertCircle,
  Sparkles,
  TicketPercent,
  ShoppingBasket
} from 'lucide-react-native';
import { colors, spacing, radius, typography } from '../../constants/theme';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { StorefrontAPI } from '../../services/api';
import OrderForSomeoneElse from '../../components/cart/OrderForSomeoneElse';
import { setOrderRecipient } from '../../services/recipientStore';
import { haptics } from '../../services/haptics';
import { MOCK_PRODUCTS } from '../../services/mockProducts';

const FONTS = {
  heavy: typography?.family?.heavy || 'Gilroy-Heavy',
  bold: typography?.family?.bold || 'Gilroy-Bold',
  medium: typography?.family?.medium || 'Gilroy-Medium',
  regular: typography?.family?.regular || 'Gilroy-Regular',
  light: typography?.family?.light || 'Gilroy-Light'
};

const SAMPLE_CART_ITEMS = [
  {
    _id: 'cart_item_1',
    product: {
      _id: 'prod_gz_guava',
      name: 'Go Zero Spicy Guava Guilt Free Ice Cream Cup',
      featuredImage: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300'
    },
    unit: '100 ml',
    price: 77,
    mrp: 105,
    qty: 1
  },
  {
    _id: 'cart_item_2',
    product: {
      _id: 'prod_gz_sitaphal',
      name: 'Go Zero Simply Sitaphal Guilt Free Ice Cream Cup',
      featuredImage: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=300'
    },
    unit: '100 ml',
    price: 92,
    mrp: 105,
    qty: 1
  },
  {
    _id: 'cart_item_3',
    product: {
      _id: 'prod_gz_death_choco',
      name: 'Go Zero Death by Chocolate Guilt Free Ice Cream Cone',
      featuredImage: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=300'
    },
    unit: '120 ml',
    price: 73,
    mrp: 110,
    qty: 1
  }
];

const RECOMMENDED_PRODUCTS = [
  {
    _id: 'rec_amul_milk',
    name: 'Amul Gold Milk',
    unit: '1 L',
    price: 68,
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=250'
  },
  {
    _id: 'rec_lays_classic',
    name: "Lay's Classic",
    unit: '52 g',
    price: 20,
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=250'
  },
  {
    _id: 'rec_coca_cola',
    name: 'Coca-Cola',
    unit: '750 ml',
    price: 40,
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=250'
  },
  {
    _id: 'rec_cadbury_dairy',
    name: 'Cadbury Dairy Milk',
    unit: '120 g',
    price: 110,
    image: 'https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=250'
  }
];

const PAYMENT_METHODS = [
  { key: 'UPI', title: 'UPI', sub: 'GPay, PhonePe, Paytm', badge: 'UPI', Icon: Smartphone, action: 'pay' },
  { key: 'Card', title: 'Credit / Debit Card', sub: 'Secure payment via Razorpay', badge: 'Card', Icon: CreditCard, action: 'pay' },
  { key: 'COD', title: 'Cash on Delivery', sub: 'Pay when your order arrives', badge: 'COD', Icon: Banknote, action: 'place' }
];

const AVAILABLE_COUPONS = [
  {
    code: 'WELCOME50',
    isNew: true,
    title: 'Flat ₹50 OFF',
    desc: 'Save ₹50 on your grocery orders above ₹199',
    discount: 50,
    minOrder: 199
  },
  {
    code: 'KUIKLO100',
    isNew: true,
    title: 'Flat ₹100 OFF',
    desc: 'Save ₹100 on orders above ₹499 for superfast delivery',
    discount: 100,
    minOrder: 499
  },
  {
    code: 'FREESHIP',
    title: 'Free Delivery',
    desc: 'Zero delivery fee on all daily staples and snacks',
    discount: 25,
    minOrder: 99
  },
  {
    code: 'SUPER20',
    title: '20% OFF',
    desc: 'Get 20% discount up to ₹75 on fresh dairy & snacks',
    discount: 45,
    minOrder: 249
  }
];

const InteractiveStepper = ({ item, currentQty, onIncrement, onDecrement }) => {
  const scaleMinus = useRef(new Animated.Value(1)).current;
  const scalePlus = useRef(new Animated.Value(1)).current;
  const scaleQty = useRef(new Animated.Value(1)).current;

  const triggerPress = (scaleVal, cb) => {
    Animated.sequence([
      Animated.timing(scaleVal, {
        toValue: 0.8,
        duration: 60,
        useNativeDriver: true
      }),
      Animated.spring(scaleVal, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true
      })
    ]).start();

    Animated.sequence([
      Animated.timing(scaleQty, {
        toValue: 1.25,
        duration: 70,
        useNativeDriver: true
      }),
      Animated.spring(scaleQty, {
        toValue: 1,
        friction: 4,
        tension: 90,
        useNativeDriver: true
      })
    ]).start();

    cb();
  };

  return (
    <View style={styles.interactiveStepperWrap}>
      <Animated.View style={{ transform: [{ scale: scaleMinus }] }}>
        <TouchableOpacity
          style={styles.interactiveStepperBtn}
          onPress={() => triggerPress(scaleMinus, () => onDecrement(item))}
          activeOpacity={0.7}
          hitSlop={6}
        >
          <Minus size={13} color={colors.black} strokeWidth={2.8} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={{ transform: [{ scale: scaleQty }] }}>
        <Text style={styles.interactiveStepperQty}>{currentQty}</Text>
      </Animated.View>

      <Animated.View style={{ transform: [{ scale: scalePlus }] }}>
        <TouchableOpacity
          style={styles.interactiveStepperBtn}
          onPress={() => triggerPress(scalePlus, () => onIncrement(item))}
          activeOpacity={0.7}
          hitSlop={6}
        >
          <Plus size={13} color={colors.black} strokeWidth={2.8} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 62 + (Platform.OS === 'ios' ? Math.max(insets.bottom, 10) : 8);
  const { width: screenWidth } = useWindowDimensions();
  const { customer } = useAuth();
  const {
    cart,
    isLoading,
    updateItem,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon,
    addItem
  } = useCart();

  const [clearModalVisible, setClearModalVisible] = useState(false);
  const [overflowMenuVisible, setOverflowMenuVisible] = useState(false);
  const [isClearingCart, setIsClearingCart] = useState(false);
  const { toggleSave, isSaved } = useWishlist();
  const [couponModalVisible, setCouponModalVisible] = useState(false);
  const [policyModalVisible, setPolicyModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('UPI');
  const activePayment = PAYMENT_METHODS.find((p) => p.key === selectedPayment) || PAYMENT_METHODS[0];
  const ActivePayIcon = activePayment.Icon;


  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [couponInputText, setCouponInputText] = useState('');
  const [couponError, setCouponError] = useState('');
  const [localAppliedCoupon, setLocalAppliedCoupon] = useState(null);

  const [localItems, setLocalItems] = useState(SAMPLE_CART_ITEMS);
  const [optimisticQtyMap, setOptimisticQtyMap] = useState({});

  const getEffectiveQty = (item) => {
    if (optimisticQtyMap[item._id] !== undefined) {
      return optimisticQtyMap[item._id];
    }
    return item.qty || 1;
  };
  const [orderPlacedSuccess, setOrderPlacedSuccess] = useState(false);
  const [recipient, setRecipient] = useState(null);

  const isRealCartActive = Boolean(cart?.items && cart.items.length > 0);
  const items = isRealCartActive ? cart.items : localItems;

  const defaultAddress = customer?.addresses?.find((a) => a.isDefault) || customer?.addresses?.[0];
  const addressText = defaultAddress
    ? `${defaultAddress.street || ''}, ${defaultAddress.city || ''}`.trim()
    : 'House No 172, Shankar Vihar Colony, Guddu Kirana Store, 663, L...';

  const itemTotalOriginal = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = item.mrp || Math.round((item.price || 99) * 1.35);
      const qty = optimisticQtyMap[item._id] !== undefined ? optimisticQtyMap[item._id] : (item.qty || 1);
      return sum + price * qty;
    }, 0);
  }, [items, optimisticQtyMap]);

  const itemTotalDiscounted = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = item.price || 99;
      const qty = optimisticQtyMap[item._id] !== undefined ? optimisticQtyMap[item._id] : (item.qty || 1);
      return sum + price * qty;
    }, 0);
  }, [items, optimisticQtyMap]);

  const handlingFeeOriginal = 12.07;
  const handlingFeeActual = 7.0;
  const deliveryPartnerFeeOriginal = 16.0;
  const deliveryPartnerFeeActual = 0.0;

  const activeAppliedCoupon = cart?.appliedCoupon || localAppliedCoupon;
  const activeCouponDiscount = cart?.summary?.discount || (cart?.appliedCoupon?.discount) || (localAppliedCoupon?.discount || 0);

  const finalPayable = Math.max(
    0,
    itemTotalDiscounted + handlingFeeActual + deliveryPartnerFeeActual - activeCouponDiscount
  );

  const handleQtyIncrement = (item) => {
    haptics.selection();
    const currentQty = getEffectiveQty(item);
    const newQty = currentQty + 1;
    setOptimisticQtyMap((prev) => ({ ...prev, [item._id]: newQty }));
    if (!isRealCartActive) {
      setLocalItems((prev) =>
        prev.map((i) => (i._id === item._id ? { ...i, qty: newQty } : i))
      );
    }
    if (isRealCartActive && updateItem) {
      updateItem(item._id, newQty).catch(() => {});
    }
  };

  const handleQtyDecrement = (item) => {
    haptics.selection();
    const currentQty = getEffectiveQty(item);
    if (currentQty <= 1) {
      setOptimisticQtyMap((prev) => {
        const next = { ...prev };
        delete next[item._id];
        return next;
      });
      handleItemDelete(item);
    } else {
      const newQty = currentQty - 1;
      setOptimisticQtyMap((prev) => ({ ...prev, [item._id]: newQty }));
      if (!isRealCartActive) {
        setLocalItems((prev) =>
          prev.map((i) => (i._id === item._id ? { ...i, qty: newQty } : i))
        );
      }
      if (isRealCartActive && updateItem) {
        updateItem(item._id, newQty).catch(() => {});
      }
    }
  };

  const handleItemDelete = (item) => {
    haptics.impactLight();
    if (isRealCartActive && removeItem) {
      removeItem(item._id);
    } else {
      setLocalItems((prev) => prev.filter((i) => i._id !== item._id));
    }
  };

  const handleMoveToWishlist = (item) => {
    haptics.selection();
    const id = item.product?._id || item._id;
    setWishlistIds((prev) => new Set(prev).add(id));
    if (item.product?._id && toggleSave && !isSaved(item.product._id)) {
      toggleSave(item.product);
    }
    handleItemDelete(item);
  };

  const toggleWishlist = (id) => {
    haptics.selection();
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirmClearCart = async () => {
    if (isClearingCart) return;
    haptics.notificationSuccess();
    setIsClearingCart(true);
    try {
      if (isRealCartActive && clearCart) {
        await clearCart();
        setLocalItems([]);
      } else {
        setLocalItems([]);
      }
    } finally {
      setIsClearingCart(false);
      setClearModalVisible(false);
    }
  };

  const handleApplyCouponFromList = async (codeToApply) => {
    haptics.selection();
    setCouponError('');
    const code = (codeToApply || '').trim().toUpperCase();
    if (!code) {
      setCouponError('Please enter a coupon code');
      return;
    }

    const foundCoupon = AVAILABLE_COUPONS.find((c) => c.code.toUpperCase() === code);
    const minOrderRequired = foundCoupon ? (foundCoupon.minOrder || 0) : 149;

    if (itemTotalDiscounted < minOrderRequired) {
      const diff = Math.ceil(minOrderRequired - itemTotalDiscounted);
      setCouponError(`Add items worth ₹${diff} more to apply this coupon`);
      return;
    }

    let discountAmt = 50;
    if (foundCoupon) {
      discountAmt = typeof foundCoupon.discount === 'number'
        ? foundCoupon.discount
        : Math.min(150, Math.round(itemTotalDiscounted * 0.15));
    } else {
      discountAmt = Math.min(100, Math.round(itemTotalDiscounted * 0.1));
    }

    if (isRealCartActive && applyCoupon) {
      try {
        const res = await applyCoupon(code);
        if (res && res.success) {
          setLocalAppliedCoupon(null);
          setCouponInputText('');
          setCouponModalVisible(false);
          return;
        }
      } catch (e) {
      }
    }

    setLocalAppliedCoupon({
      code: code,
      discount: discountAmt,
      title: foundCoupon ? foundCoupon.title : 'Discount Applied'
    });
    setCouponInputText('');
    setCouponModalVisible(false);
  };

  const handleRemoveCoupon = async () => {
    haptics.selection();
    setLocalAppliedCoupon(null);
    if (isRealCartActive && removeCoupon) {
      try {
        await removeCoupon();
      } catch (e) {
      }
    }
  };

  const handleAddRecommended = (recProduct) => {
    haptics.selection();
    if (isRealCartActive && addItem) {
      addItem(recProduct._id, 1, null, recProduct.unit);
    } else {
      setLocalItems((prev) => {
        const existing = prev.find((p) => p.product?._id === recProduct._id);
        if (existing) {
          return prev.map((p) =>
            p.product?._id === recProduct._id ? { ...p, qty: p.qty + 1 } : p
          );
        }
        return [
          ...prev,
          {
            _id: `cart_item_${Date.now()}`,
            product: {
              _id: recProduct._id,
              name: recProduct.name,
              featuredImage: recProduct.image
            },
            unit: recProduct.unit,
            price: recProduct.price,
            mrp: Math.round(recProduct.price * 1.3),
            qty: 1
          }
        ];
      });
    }
  };

  const handleRecipientChange = (next) => {
    setRecipient(next);
    setOrderRecipient(next);
  };

  const handlePaymentSuccess = () => {
    haptics.notificationSuccess();
    setOrderPlacedSuccess(true);
  };

  if (items.length === 0 && !isClearingCart) {
    return (
      <View style={styles.screenRoot}>
        <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 12) }]}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.headerBackBtn}
              onPress={() => {
                haptics.selection();
                if (router.canGoBack()) router.back();
                else router.replace('/(tabs)');
              }}
              hitSlop={10}
              activeOpacity={0.7}
            >
              <ArrowLeft size={21} color="#0F172A" strokeWidth={2.4} />
            </TouchableOpacity>
            <Text style={styles.cartHeaderMainTitle}>My Cart</Text>
            <View style={{ width: 36 }} />
          </View>
        </View>
        <View style={styles.emptyCartWrap}>
          <View style={styles.emptyCartIcon}>
            <ShoppingBasket size={40} color="#E5A900" strokeWidth={1.8} />
          </View>
          <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
          <Text style={styles.emptyCartDesc}>Add groceries and essentials to get them delivered in minutes.</Text>
          <TouchableOpacity
            style={styles.emptyCartBtn}
            onPress={() => {
              haptics.selection();
              router.replace('/(tabs)');
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.emptyCartBtnText}>Start shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screenRoot}>
      {overflowMenuVisible && (
        <Pressable
          style={styles.overflowBackdrop}
          onPress={() => setOverflowMenuVisible(false)}
          accessibilityLabel="Close menu"
        />
      )}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => {
              haptics.selection();
              if (router.canGoBack()) router.back();
              else router.replace('/(tabs)');
            }}
            hitSlop={10}
            activeOpacity={0.7}
          >
            <ArrowLeft size={21} color="#0F172A" strokeWidth={2.4} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerAddressWrap}
            onPress={() => {
              haptics.selection();
              router.push('/addresses');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.headerHomeRow}>
              <MapPin size={15} color="#0F172A" strokeWidth={2.4} style={{ marginRight: 5 }} />
              <Text style={styles.headerHomeTitle}>HOME</Text>
              <ChevronDown size={14} color="#0F172A" strokeWidth={2.5} style={{ marginLeft: 3 }} />
            </View>
            <Text style={styles.headerAddressSubtitle} numberOfLines={1} ellipsizeMode="tail">
              {addressText}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerMenuBtn}
            onPress={() => {
              haptics.selection();
              setOverflowMenuVisible((prev) => !prev);
            }}
            hitSlop={10}
            activeOpacity={0.7}
          >
            <MoreVertical size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {overflowMenuVisible && (
          <View style={[styles.overflowDropdown, { top: Math.max(insets.top, 12) + 48 }]}>
            <TouchableOpacity
              style={styles.overflowDropdownItem}
              onPress={() => {
                setOverflowMenuVisible(false);
                setClearModalVisible(true);
              }}
            >
              <Trash2 size={16} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={styles.overflowDropdownText}>Clear Cart</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + 100 }]}
      >
        <View style={styles.cartCard}>
          <View style={styles.cartCardHeader}>
            <View style={styles.cartHeaderLeftCol}>
              <Text style={styles.cartHeaderMainTitle}>Cart</Text>
              <View style={styles.cartItemsCountBadge}>
                <Text style={styles.cartItemsCountBadgeText}>
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </Text>
              </View>
            </View>
          </View>

          {items.map((item, idx) => {
            const product = item.product || {};
            const imgUri =
              product.featuredImage ||
              product.image ||
              'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200';
            const price = item.price || 99;
            const mrp = item.mrp || Math.round(price * 1.35);

            return (
              <View
                key={item._id || idx}
                style={[styles.cartItemRow, idx > 0 && styles.cartItemRowBorder]}
              >
                <View style={styles.itemImageWrap}>
                  <Image source={{ uri: imgUri }} style={styles.itemImage} contentFit="cover" />
                </View>

                <View style={styles.itemDetailsCol}>
                  <Text style={styles.itemNameText} numberOfLines={2}>
                    {product.name || 'Grocery Item'}
                  </Text>
                  <Text style={styles.itemUnitText}>{item.unit || '1 pack'}</Text>
                  <View style={styles.itemPriceRow}>
                    <Text style={styles.itemSellingPrice}>₹{price}</Text>
                    {mrp > price && <Text style={styles.itemMrpText}>₹{mrp}</Text>}
                  </View>
                  <TouchableOpacity
                    style={styles.moveToWishlistRow}
                    onPress={() => handleMoveToWishlist(item)}
                    activeOpacity={0.7}
                  >
                    <Bookmark size={11} color="#64748B" style={{ marginRight: 3 }} />
                    <Text style={styles.moveToWishlistText}>Move to wishlist</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.itemActionsCol}>
                  <InteractiveStepper
                    item={item}
                    currentQty={getEffectiveQty(item)}
                    onIncrement={handleQtyIncrement}
                    onDecrement={handleQtyDecrement}
                  />
                </View>
              </View>
            );
          })}

          <TouchableOpacity
            style={styles.addMoreItemsBtn}
            onPress={() => {
              haptics.selection();
              router.push('/(tabs)');
            }}
            activeOpacity={0.8}
          >
            <Plus size={16} color="#0F172A" strokeWidth={2.6} style={{ marginRight: 6 }} />
            <Text style={styles.addMoreItemsText}>Add more items</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.savingsSection}>
          <Text style={styles.sectionHeaderLabel}>SAVINGS CORNER</Text>
          <TouchableOpacity
            style={[styles.couponCard, Boolean(activeAppliedCoupon) && styles.couponCardApplied]}
            onPress={() => {
              haptics.selection();
              setCouponModalVisible(true);
            }}
            activeOpacity={0.85}
          >
            <View style={[styles.couponIconCircle, Boolean(activeAppliedCoupon) && { backgroundColor: '#16A34A' }]}>
              {activeAppliedCoupon ? (
                <Check size={20} color={colors.white} strokeWidth={3} />
              ) : (
                <TicketPercent size={22} color={colors.black} strokeWidth={2.2} />
              )}
            </View>
            <View style={styles.couponCardTextCol}>
              <Text style={styles.couponCardTitle}>
                {activeAppliedCoupon ? `'${activeAppliedCoupon.code}' applied` : 'Apply coupon'}
              </Text>
              <Text style={[styles.couponCardSubtitle, Boolean(activeAppliedCoupon) && { color: '#15803D', fontWeight: '600' }]}>
                {activeAppliedCoupon
                  ? `You saved ₹${activeCouponDiscount} on this order`
                  : 'Unlock offers and save on this order'}
              </Text>
            </View>
            {activeAppliedCoupon ? (
              <TouchableOpacity
                style={styles.couponRemoveBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  handleRemoveCoupon();
                }}
                hitSlop={8}
                activeOpacity={0.7}
              >
                <Text style={styles.couponRemoveBtnText}>Remove</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.couponViewPill}>
                <Text style={styles.couponViewPillText}>View offers</Text>
                <ChevronRight size={14} color={colors.black} strokeWidth={2.6} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <OrderForSomeoneElse recipient={recipient} onChange={handleRecipientChange} />

        <View style={styles.billCard}>
          <Text style={styles.billCardTitle}>Bill Details</Text>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <View style={styles.billValueCol}>
              <Text style={styles.billMrpStrikethrough}>₹{itemTotalOriginal.toFixed(2)}</Text>
              <Text style={styles.billValueText}>₹{itemTotalDiscounted.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Handling Fee</Text>
            <View style={styles.billValueCol}>
              <Text style={styles.billMrpStrikethrough}>₹{handlingFeeOriginal.toFixed(2)}</Text>
              <Text style={styles.billValueText}>₹{handlingFeeActual.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.billRow}>
            <View style={styles.billLabelWithIcon}>
              <Text style={styles.billLabel}>Delivery Partner Fee</Text>
              <Info size={13} color="#94A3B8" style={{ marginLeft: 4 }} />
            </View>
            <View style={styles.billValueCol}>
              <Text style={styles.billMrpStrikethrough}>
                ₹{deliveryPartnerFeeOriginal.toFixed(2)}
              </Text>
              <Text style={styles.billFreeText}>FREE</Text>
            </View>
          </View>

          {activeCouponDiscount > 0 && (
              <View style={styles.billRow}>
                <Text style={[styles.billLabel, { color: '#16A34A' }]}>
                  Coupon Discount {activeAppliedCoupon ? `(${activeAppliedCoupon.code})` : ''}
                </Text>
              <Text style={[styles.billValueText, { color: '#16A34A' }]}>
                -₹{activeCouponDiscount.toFixed(2)}
              </Text>
            </View>
          )}

          <View style={styles.billDivider} />

          <View style={styles.toPayRow}>
            <Text style={styles.toPayLabel}>To Pay</Text>
            <Text style={styles.toPayValue}>₹{finalPayable.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.cancellationCard}>
          <Text style={styles.cancellationText}>
            <Text style={styles.cancellationNoteBold}>NOTE: </Text>
            Orders cannot be cancelled and are non-refundable once packed for delivery.
          </Text>
          <TouchableOpacity
            style={styles.cancellationLinkRow}
            onPress={() => {
              haptics.selection();
              setPolicyModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.cancellationLinkText}>Read cancellation policy</Text>
            <ChevronRight size={14} color={colors.primaryDark} style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View
        style={[
          styles.paymentBarContainer,
          { bottom: tabBarHeight, paddingBottom: 12 }
        ]}
      >
        <TouchableOpacity
          style={styles.paymentMethodSelector}
          onPress={() => {
            haptics.selection();
            setPaymentModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <View style={styles.upiBadgeIconWrap}>
            <ActivePayIcon size={18} color={colors.black} strokeWidth={2.3} />
          </View>
          <View style={styles.payUsingCol}>
            <Text style={styles.payUsingLabel}>Pay using</Text>
            <View style={styles.payMethodNameRow}>
              <Text style={styles.payMethodNameText} numberOfLines={1}>{activePayment.title}</Text>
              <ChevronDown size={14} color="#0F172A" strokeWidth={2.5} style={{ marginLeft: 2 }} />
            </View>
          </View>
        </TouchableOpacity>

        <SlideToPayButton
          amount={finalPayable}
          mode={activePayment.action}
          onSuccess={handlePaymentSuccess}
          screenWidth={screenWidth}
        />
      </View>

      <Modal
        visible={clearModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => { if (!isClearingCart) setClearModalVisible(false); }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.clearConfirmModalCard}>
            <View style={styles.clearIconCircle}>
              <Trash2 size={26} color="#EF4444" />
            </View>
            <Text style={styles.clearModalTitle}>Clear Cart?</Text>
            <Text style={styles.clearModalDesc}>
              Are you sure you want to remove all items from your cart? You can add fresh items anytime.
            </Text>
            <View style={styles.clearModalActionsRow}>
              <TouchableOpacity
                style={[styles.clearModalCancelBtn, isClearingCart && { opacity: 0.5 }]}
                disabled={isClearingCart}
                onPress={() => setClearModalVisible(false)}
              >
                <Text style={styles.clearModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.clearModalConfirmBtn, isClearingCart && { opacity: 0.85 }]}
                disabled={isClearingCart}
                onPress={handleConfirmClearCart}
              >
                {isClearingCart ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.clearModalConfirmText}>Clear Cart</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={couponModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCouponModalVisible(false)}
      >
        <View style={styles.bottomSheetBackdrop}>
          <Pressable style={styles.backdropDismiss} onPress={() => setCouponModalVisible(false)} />
          <View style={styles.couponBottomSheetCard}>
            <View style={styles.couponHeaderRow}>
              <View style={styles.couponHeaderLeft}>
                <View style={styles.couponHeaderIconCircle}>
                  <Percent size={18} color="#D97706" strokeWidth={2.6} />
                </View>
                <View>
                  <Text style={styles.bottomSheetTitle}>Coupons & Offers</Text>
                  <Text style={styles.couponHeaderSubtitle}>Apply coupons for instant savings</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setCouponModalVisible(false)}
                hitSlop={8}
                style={styles.couponCloseCircle}
              >
                <X size={18} color="#64748B" strokeWidth={2.4} />
              </TouchableOpacity>
            </View>

            <View style={styles.couponInputCard}>
              <View style={styles.couponInputWrapper}>
                <Tag size={16} color="#64748B" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.couponTextInput}
                  placeholder="Enter coupon code (e.g. WELCOME50)"
                  placeholderTextColor="#94A3B8"
                  value={couponInputText}
                  onChangeText={(t) => {
                    setCouponInputText(t.toUpperCase());
                    setCouponError('');
                  }}
                  autoCapitalize="characters"
                />
              </View>
              <TouchableOpacity
                style={[
                  styles.couponApplyBtn,
                  !couponInputText.trim() && styles.couponApplyBtnDisabled
                ]}
                onPress={() => handleApplyCouponFromList(couponInputText)}
                disabled={!couponInputText.trim()}
              >
                <Text style={styles.couponApplyBtnText}>APPLY</Text>
              </TouchableOpacity>
            </View>

            {Boolean(couponError) && (
              <View style={styles.couponErrorBanner}>
                <AlertCircle size={14} color="#DC2626" style={{ marginRight: 6 }} />
                <Text style={styles.couponErrorText}>{couponError}</Text>
              </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }} contentContainerStyle={{ paddingTop: 10 }}>
              {AVAILABLE_COUPONS.map((cp) => {
                const isEligible = itemTotalDiscounted >= (cp.minOrder || 0);
                const difference = (cp.minOrder || 0) - itemTotalDiscounted;
                const isApplied = Boolean(activeAppliedCoupon) && activeAppliedCoupon.code === cp.code;

                return (
                  <View key={cp.code} style={styles.ticketCard}>
                    {cp.isNew && (
                      <View style={styles.ticketNewBadge}>
                        <Text style={styles.ticketNewBadgeText}>New</Text>
                      </View>
                    )}
                    <View style={styles.ticketNotchTop} />
                    <View style={styles.ticketNotchBottom} />
                    <View style={styles.ticketIconCol}>
                      <View style={styles.ticketIconTile}>
                        <TicketPercent size={28} color={colors.primaryDark} strokeWidth={2.2} />
                      </View>
                    </View>
                    <View style={styles.ticketDivider} />
                    <View style={styles.ticketBody}>
                      <Text style={styles.ticketLabel}>Special Discount · {cp.code}</Text>
                      <Text style={styles.ticketOffer}>{cp.title}</Text>
                      <Text style={styles.ticketDesc} numberOfLines={2}>{cp.desc}</Text>
                      <View style={styles.ticketFooterRow}>
                        {isApplied ? (
                          <View style={styles.ticketAppliedBadge}>
                            <Check size={12} color="#15803D" strokeWidth={2.8} />
                            <Text style={styles.ticketAppliedText}>APPLIED</Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={[styles.ticketApplyBtn, !isEligible && styles.ticketApplyBtnDimmed]}
                            onPress={() => handleApplyCouponFromList(cp.code)}
                            disabled={!isEligible}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.ticketApplyText, !isEligible && styles.ticketApplyTextDimmed]}>
                              Apply
                            </Text>
                            <ChevronRight
                              size={14}
                              color={!isEligible ? '#94A3B8' : colors.primaryDark}
                              strokeWidth={2.6}
                            />
                          </TouchableOpacity>
                        )}
                        <Text style={isEligible ? styles.ticketUnlockText : styles.ticketLockedText}>
                          {isEligible ? 'Unlocked for this order' : `Add ₹${difference} more to unlock`}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={policyModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPolicyModalVisible(false)}
      >
        <View style={styles.bottomSheetBackdrop}>
          <Pressable style={styles.backdropDismiss} onPress={() => setPolicyModalVisible(false)} />
          <View style={styles.policyBottomSheetCard}>
            <View style={styles.bottomSheetDragHandle} />
            <View style={styles.bottomSheetHeaderRow}>
              <Text style={styles.bottomSheetTitle}>Cancellation Policy</Text>
              <TouchableOpacity onPress={() => setPolicyModalVisible(false)} hitSlop={8}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360 }}>
              <Text style={styles.policyBodyText}>
                1. <Text style={styles.policyBodyBold}>Instant Fulfillment:</Text> Because orders are packed immediately in our dark store within 2-3 minutes, orders cannot be cancelled once packed.
                {'\n\n'}
                2. <Text style={styles.policyBodyBold}>Damaged or Missing Items:</Text> If any item is damaged, spoiled, or missing upon delivery, contact customer support within 2 hours for instant refund or replacement.
                {'\n\n'}
                3. <Text style={styles.policyBodyBold}>Refund Processing:</Text> Online payment refunds are processed directly back to your source account within 2-4 business days.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={paymentModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.bottomSheetBackdrop}>
          <Pressable style={styles.backdropDismiss} onPress={() => setPaymentModalVisible(false)} />
          <View style={styles.policyBottomSheetCard}>
            <View style={styles.bottomSheetDragHandle} />
            <View style={styles.bottomSheetHeaderRow}>
              <Text style={styles.bottomSheetTitle}>Select Payment Method</Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)} hitSlop={8}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={{ gap: 10, paddingVertical: 10 }}>
              {PAYMENT_METHODS.map((m) => {
                const isSelected = selectedPayment === m.key;
                const MIcon = m.Icon;
                return (
                  <TouchableOpacity
                    key={m.key}
                    style={[styles.paymentOptionItem, isSelected && styles.paymentOptionActive]}
                    activeOpacity={0.85}
                    onPress={() => {
                      haptics.selection();
                      setSelectedPayment(m.key);
                      setPaymentModalVisible(false);
                    }}
                  >
                    <View style={styles.payOptIconTile}>
                      <MIcon size={20} color={colors.black} strokeWidth={2.2} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.paymentOptionText}>{m.title}</Text>
                      <Text style={styles.payOptSub}>{m.sub}</Text>
                    </View>
                    <View style={[styles.payRadio, isSelected && styles.payRadioActive]}>
                      {isSelected && <Check size={13} color={colors.black} strokeWidth={3.5} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={orderPlacedSuccess}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setOrderPlacedSuccess(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.successModalCard}>
            <View style={styles.successIconCircle}>
              <Check size={36} color="#FFFFFF" strokeWidth={3.5} />
            </View>
            <Text style={styles.successModalTitle}>Order Placed! 🎉</Text>
            <Text style={styles.successModalDesc}>
              Your superfast delivery of fresh items is being prepared and will arrive in 9 minutes!
            </Text>
            <TouchableOpacity
              style={styles.successModalBtn}
              onPress={() => {
                setOrderPlacedSuccess(false);
                router.replace('/(tabs)/orders');
              }}
            >
              <Text style={styles.successModalBtnText}>Track Order</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SlideToPayButton({ amount, mode, onSuccess, screenWidth }) {
  const containerWidth = Math.min(240, Math.max(190, screenWidth * 0.58));
  const buttonHeight = 48;
  const knobSize = 40;
  const maxSlide = containerWidth - knobSize - 8;

  const panX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0) {
          const val = Math.min(gestureState.dx, maxSlide);
          panX.setValue(val);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx >= maxSlide * 0.75) {
          Animated.timing(panX, {
            toValue: maxSlide,
            duration: 150,
            useNativeDriver: true
          }).start(() => {
            onSuccess();
            setTimeout(() => {
              panX.setValue(0);
            }, 600);
          });
        } else {
          Animated.spring(panX, {
            toValue: 0,
            friction: 6,
            useNativeDriver: true
          }).start();
        }
      }
    })
  ).current;

  const textOpacity = panX.interpolate({
    inputRange: [0, maxSlide * 0.6],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });

  return (
    <View style={[styles.slideTrack, { width: containerWidth, height: buttonHeight }]}>
      <Animated.Text style={[styles.slideText, { opacity: textOpacity }]} numberOfLines={1}>
        {mode === 'place' ? 'Slide to Place Order' : `Slide to Pay | ₹${Math.round(amount)}`}
      </Animated.Text>

      <Animated.View
        style={[
          styles.slideKnob,
          {
            width: knobSize,
            height: knobSize,
            borderRadius: knobSize / 2,
            transform: [{ translateX: panX }]
          }
        ]}
        {...panResponder.panHandlers}
      >
        <ChevronsRight size={22} color={colors.black} strokeWidth={2.8} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingBottom: 10,
    zIndex: 50
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6
  },
  headerAddressWrap: {
    flex: 1,
    paddingHorizontal: 4
  },
  headerHomeRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerHomeTitle: {
    fontFamily: FONTS.heavy,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '900',
    letterSpacing: 0.3
  },
  headerAddressSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1
  },
  headerMenuBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  overflowDropdown: {
    position: 'absolute',
    right: 14,
    top: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 100
  },
  emptyCartWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 90
  },
  emptyCartIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFF4C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18
  },
  emptyCartTitle: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6
  },
  emptyCartDesc: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20
  },
  emptyCartBtn: {
    backgroundColor: '#FFC928',
    paddingHorizontal: 26,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyCartBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    fontWeight: '800',
    color: '#111827'
  },
  overflowBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40
  },
  overflowDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  overflowDropdownText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: '#EF4444'
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 10
  },
  cartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 14,
    marginBottom: 16
  },
    cartHeaderLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  cartHeaderMainTitle: {
    fontFamily: FONTS.bold,
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3
  },
  cartItemsCountBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.primaryLight
  },
  cartItemsCountBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark
  },
  interactiveStepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: colors.primaryLight,
    paddingHorizontal: 4,
    paddingVertical: 3
  },
  interactiveStepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primaryLight
  },
  interactiveStepperQty: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    fontWeight: '800',
    color: colors.black,
    minWidth: 22,
    textAlign: 'center',
    marginHorizontal: 4
  },
  cartCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC'
  },
  slaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  slaTimeText: {
    fontFamily: FONTS.heavy,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '900',
    marginRight: 8
  },
  
  itemsCountText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: '#64748B'
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12
  },
  cartItemRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC'
  },
  itemImageWrap: {
    width: 58,
    height: 58,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  itemImage: {
    width: '100%',
    height: '100%'
  },
  itemDetailsCol: {
    flex: 1,
    marginRight: 10,
    justifyContent: 'center'
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
    gap: 6
  },
  itemNameText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
    lineHeight: 17
  },
  itemUnitText: {
    fontFamily: FONTS.regular,
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2
  },
  moveToWishlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  moveToWishlistText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: '#64748B'
  },
  itemRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 56
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    height: 28,
    paddingHorizontal: 3
  },
  stepperBtn: {
    width: 22,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepperQtyText: {
    fontFamily: FONTS.bold,
    fontSize: 12.5,
    color: colors.black,
    fontWeight: '800'
  },
  itemActionsCol: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  couponHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  couponHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  couponHeaderIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  couponHeaderSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#64748B',
    marginTop: 2
  },
  couponCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  couponInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14
  },
  couponInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  couponApplyBtnDisabled: {
    backgroundColor: '#E2E8F0'
  },
  couponErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12
  },
  ticketCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.primarySoft,
    borderRadius: 18,
    marginBottom: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    position: 'relative'
  },
  ticketNewBadge: {
    position: 'absolute',
    top: -7,
    left: 16,
    backgroundColor: colors.secondary,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    zIndex: 2
  },
  ticketNewBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4
  },
  ticketNotchTop: {
    position: 'absolute',
    top: -8,
    left: 78,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    zIndex: 1
  },
  ticketNotchBottom: {
    position: 'absolute',
    bottom: -8,
    left: 78,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    zIndex: 1
  },
  ticketIconCol: {
    justifyContent: 'center'
  },
  ticketIconTile: {
    width: 62,
    height: 62,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center'
  },
  ticketDivider: {
    width: 0,
    marginHorizontal: 12,
    borderLeftWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#E9CE7A'
  },
  ticketBody: {
    flex: 1,
    justifyContent: 'center'
  },
  ticketLabel: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: '#8A6D1F',
    marginBottom: 3
  },
  ticketOffer: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '800',
    marginBottom: 2
  },
  ticketDesc: {
    fontFamily: FONTS.regular,
    fontSize: 11.5,
    color: '#7A651F',
    lineHeight: 16,
    marginBottom: 8
  },
  ticketFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  ticketApplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 2
  },
  ticketApplyBtnDimmed: {
    opacity: 0.5
  },
  ticketApplyText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: colors.primaryDark,
    fontWeight: '800'
  },
  ticketApplyTextDimmed: {
    color: '#94A3B8'
  },
  ticketAppliedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 4
  },
  ticketAppliedText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D'
  },
  ticketUnlockText: {
    fontFamily: FONTS.semibold,
    fontSize: 10.5,
    color: '#16A34A'
  },
  ticketLockedText: {
    fontFamily: FONTS.medium,
    fontSize: 10.5,
    color: '#B45309'
  },

  itemPriceCol: {
    alignItems: 'flex-end'
  },
  itemMrpText: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: '#94A3B8',
    textDecorationLine: 'line-through'
  },
  itemSellingPrice: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '800'
  },
  itemDeleteBtn: {
    padding: 3
  },
  addMoreItemsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 40,
    marginTop: 8
  },
  addMoreItemsText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700'
  },
  savingsSection: {
    marginBottom: 16
  },
  sectionHeaderLabel: {
    fontFamily: FONTS.heavy,
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingHorizontal: 4
  },
  couponCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 14
  },
  couponCardApplied: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC'
  },
  couponViewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingLeft: 11,
    paddingRight: 7,
    paddingVertical: 6
  },
  couponViewPillText: {
    fontFamily: FONTS.bold,
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.black
  },
  couponIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  couponCardTextCol: {
    flex: 1
  },
  couponCardTitle: {
    fontFamily: FONTS.bold,
    fontSize: 13.5,
    color: '#0F172A',
    fontWeight: '800'
  },
  couponCardSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 11.5,
    color: '#64748B'
  },
  couponRemoveBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA'
  },
  payOptIconTile: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  payOptSub: { fontFamily: FONTS.regular, fontSize: 11.5, color: '#64748B', marginTop: 1 },
  payRadio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  payRadioActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  couponRemoveBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626'
  },
  recommendationsSection: {
    marginBottom: 16
  },
  recommendationsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4
  },
  recommendationsTitle: {
    fontFamily: FONTS.bold,
    fontSize: 14.5,
    color: '#0F172A',
    fontWeight: '800'
  },
  seeAllText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: colors.primaryDark,
    fontWeight: '700'
  },
  recommendationsScroll: {
    gap: 10,
    paddingHorizontal: 2
  },
  recProductCard: {
    width: 116,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 8
  },
  recImgWrap: {
    width: '100%',
    height: 80,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 6
  },
  recImg: {
    width: '80%',
    height: '80%'
  },
  recWishBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  recAddBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  recProdName: {
    fontFamily: FONTS.bold,
    fontSize: 11.5,
    color: '#0F172A',
    fontWeight: '700'
  },
  recProdUnit: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: '#64748B',
    marginTop: 1
  },
  recProdPrice: {
    fontFamily: FONTS.bold,
    fontSize: 12.5,
    color: '#0F172A',
    fontWeight: '800',
    marginTop: 3
  },
  billCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 14,
    marginBottom: 16
  },
  billCardTitle: {
    fontFamily: FONTS.bold,
    fontSize: 14.5,
    color: '#0F172A',
    fontWeight: '800',
    marginBottom: 12
  },
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  billLabelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  billLabel: {
    fontFamily: FONTS.regular,
    fontSize: 12.5,
    color: '#475569'
  },
  billValueCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  billMrpStrikethrough: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through'
  },
  billValueText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700'
  },
  billFreeText: {
    fontFamily: FONTS.heavy,
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '900'
  },
  billDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 6
  },
  toPayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6
  },
  toPayLabel: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '800'
  },
  toPayValue: {
    fontFamily: FONTS.heavy,
    fontSize: 17,
    color: '#0F172A',
    fontWeight: '900'
  },
  cancellationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 14,
    marginBottom: 10
  },
  cancellationText: {
    fontFamily: FONTS.regular,
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16
  },
  cancellationNoteBold: {
    fontFamily: FONTS.bold,
    color: '#EF4444',
    fontWeight: '800'
  },
  cancellationLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6
  },
  cancellationLinkText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: colors.primaryDark,
    fontWeight: '700'
  },
  paymentBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  paymentMethodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10
  },
  upiBadgeIconWrap: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginRight: 8
  },
  upiBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryDark
  },
  payUsingCol: {
    flex: 1
  },
  payUsingLabel: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '700',
    color: '#475569'
  },
  payMethodNameRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  payMethodNameText: {
    flexShrink: 1,
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '800'
  },
  slideTrack: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden'
  },
  slideText: {
    position: 'absolute',
    left: 48,
    right: 8,
    textAlign: 'center',
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: colors.black,
    fontWeight: '800'
  },
  slideKnob: {
    position: 'absolute',
    left: 4,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  clearConfirmModalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center'
  },
  clearIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  clearModalTitle: {
    fontFamily: FONTS.bold,
    fontSize: 17,
    color: '#0F172A',
    fontWeight: '800',
    marginBottom: 6
  },
  clearModalDesc: {
    fontFamily: FONTS.regular,
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18
  },
  clearModalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%'
  },
  clearModalCancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  clearModalCancelText: {
    fontFamily: FONTS.bold,
    fontSize: 13.5,
    color: '#475569',
    fontWeight: '700'
  },
  clearModalConfirmBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center'
  },
  clearModalConfirmText: {
    fontFamily: FONTS.bold,
    fontSize: 13.5,
    color: '#FFFFFF',
    fontWeight: '700'
  },
  bottomSheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end'
  },
  backdropDismiss: {
    flex: 1
  },
  couponBottomSheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    maxHeight: '80%'
  },
  policyBottomSheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    maxHeight: '70%'
  },
  bottomSheetDragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 14
  },
  bottomSheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  bottomSheetTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '800'
  },
  couponInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 44,
    marginBottom: 12
  },
  couponTextInput: {
    flex: 1,
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: '#0F172A'
  },
  couponApplyBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  couponApplyBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 11.5,
    color: '#FFFFFF',
    fontWeight: '800'
  },
  couponErrorText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: '#EF4444',
    marginBottom: 10
  },
  couponItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 12,
    marginBottom: 10
  },
  couponItemLeft: {
    flex: 1,
    marginRight: 10
  },
  couponBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginBottom: 4
  },
  couponBadgeText: {
    fontFamily: FONTS.heavy,
    fontSize: 10.5,
    color: colors.primaryDark,
    fontWeight: '900'
  },
  couponItemTitle: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700'
  },
  couponItemDesc: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },
  couponItemApplyBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  couponItemApplyText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: colors.primaryDark,
    fontWeight: '700'
  },
  policyBodyText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#334155',
    lineHeight: 20
  },
  policyBodyBold: {
    fontFamily: FONTS.bold,
    color: '#0F172A',
    fontWeight: '800'
  },
  paymentOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14
  },
  paymentOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  paymentOptionText: {
    fontFamily: FONTS.bold,
    fontSize: 13.5,
    color: '#0F172A'
  },
  successModalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center'
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14
  },
  successModalTitle: {
    fontFamily: FONTS.heavy,
    fontSize: 19,
    color: '#0F172A',
    fontWeight: '900',
    marginBottom: 6
  },
  successModalDesc: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20
  },
  successModalBtn: {
    width: '100%',
    height: 44,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  successModalBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: colors.black,
    fontWeight: '800'
  }
});
