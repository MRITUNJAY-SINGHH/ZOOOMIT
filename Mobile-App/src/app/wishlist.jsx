import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Dimensions
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Search,
  Heart,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Check,
  ChevronRight,
  Package
} from 'lucide-react-native';
import { colors, typography } from '../constants/theme';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { haptics } from '../services/haptics';
import { getProductImage } from '../components/product/ProductCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GAP = 12;
const SIDE = 16;
const CARD_WIDTH = (SCREEN_WIDTH - SIDE * 2 - GAP) / 2;
const F = typography.family;

export default function WishlistScreen() {
  const insets = useSafeAreaInsets();
  const { savedProducts, toggleSave, isLoading, refreshWishlist } = useWishlist();
  const { cart, addItem, updateItem, getItemQuantity } = useCart();

  const [showClearModal, setShowClearModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isAddingAll, setIsAddingAll] = useState(false);
  const [addedAllSuccess, setAddedAllSuccess] = useState(false);

  const cartTotalQty = cart?.items?.reduce((sum, i) => sum + (i.qty || i.quantity || 1), 0) || 0;
  const cartGrandTotal = cart?.summary?.grandTotal || cart?.summary?.subTotal || 0;
  const count = savedProducts.length;

  const handleBack = () => {
    haptics.selection();
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  const handleClearAll = async () => {
    if (isClearing) return;
    haptics.light();
    setIsClearing(true);
    try {
      for (const p of [...savedProducts]) {
        await toggleSave(p);
      }
    } finally {
      setIsClearing(false);
      setShowClearModal(false);
    }
  };

  // Add all items from wishlist to cart in parallel
  const handleAddAllToCart = async () => {
    if (!savedProducts || savedProducts.length === 0 || isAddingAll) return;
    haptics.selection();
    setIsAddingAll(true);
    try {
      await Promise.allSettled(
        savedProducts.map((item) => {
          const variantId = item.variants?.[0]?._id || null;
          const unit =
            item.variants?.[0]?.conversionUnit ||
            item.sellingUnit ||
            item.baseUnit ||
            'PCS';
          return addItem(item._id, 1, variantId, unit);
        })
      );
      haptics.notificationSuccess();
      setAddedAllSuccess(true);
      setTimeout(() => setAddedAllSuccess(false), 2500);
    } catch (e) {
      console.warn('Failed to add all items to cart:', e);
    } finally {
      setIsAddingAll(false);
    }
  };

  const renderProductItem = ({ item }) => {
    const activeVariant = item.variants?.[0] || null;
    const price = Number(activeVariant?.sellingPrice ?? item.sellingPrice ?? 0);
    const mrp = Number(activeVariant?.mrp ?? item.mrp ?? price);
    const unit = activeVariant?.conversionUnit || item.sellingUnit || item.baseUnit || 'PCS';
    const discount = mrp > price && mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;
    const variantId = activeVariant?._id || null;
    const currentQty = getItemQuantity(item._id, variantId);
    const imageUrl = getProductImage(item);

    const findCartItem = () =>
      cart?.items?.find(
        (i) => i.product?._id === item._id && (variantId ? i.variant?._id === variantId : !i.variant)
      );

    const handleAdd = () => {
      haptics.selection();
      addItem(item._id, 1, variantId, unit);
    };

    const handleIncrement = () => {
      haptics.selection();
      const cartItem = findCartItem();
      if (cartItem) updateItem(cartItem._id, currentQty + 1);
      else addItem(item._id, 1, variantId, unit);
    };

    const handleDecrement = () => {
      haptics.selection();
      const cartItem = findCartItem();
      if (cartItem) updateItem(cartItem._id, currentQty - 1);
    };

    return (
      <Pressable
        style={styles.card}
        onPress={() => {
          haptics.selection();
          router.push('/product/' + item._id);
        }}
        accessibilityRole="button"
        accessibilityLabel={`View ${item.name}`}
      >
        {/* Product Image Area */}
        <View style={styles.imageBox}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              contentFit="contain"
              transition={150}
            />
          ) : (
            <Package size={34} color="#9CA3AF" />
          )}

          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discount}% OFF</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.heartBtn}
            onPress={(e) => {
              e.stopPropagation();
              haptics.light();
              toggleSave(item);
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Remove from wishlist"
          >
            <Heart size={16} color="#E11D48" fill="#E11D48" />
          </TouchableOpacity>
        </View>

        {/* Product Details */}
        <View style={styles.cardBody}>
          <Text style={styles.unitText} numberOfLines={1}>
            {activeVariant?.name || unit}
          </Text>
          <Text style={styles.nameText} numberOfLines={2}>
            {item.name}
          </Text>

          {/* Price & Action Row */}
          <View style={styles.bottomRow}>
            <View>
              <Text style={styles.priceText}>₹{price}</Text>
              {mrp > price && <Text style={styles.mrpText}>₹{mrp}</Text>}
            </View>

            {currentQty > 0 ? (
              <View style={styles.stepper}>
                <TouchableOpacity
                  onPress={handleDecrement}
                  style={styles.stepBtn}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel="Decrease quantity"
                >
                  <Minus size={14} color="#111827" strokeWidth={2.8} />
                </TouchableOpacity>
                <Text style={styles.stepQty}>{currentQty}</Text>
                <TouchableOpacity
                  onPress={handleIncrement}
                  style={styles.stepBtn}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel="Increase quantity"
                >
                  <Plus size={14} color="#111827" strokeWidth={2.8} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleAdd}
                style={styles.addBtn}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`Add ${item.name} to cart`}
              >
                <Text style={styles.addBtnText}>ADD</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIcon}>
        <Heart size={38} color="#111827" strokeWidth={1.8} />
      </View>
      <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
      <Text style={styles.emptyDesc}>
        Tap the bookmark or heart on any product to save it here for later.
      </Text>
      <TouchableOpacity
        style={styles.emptyCta}
        onPress={() => {
          haptics.selection();
          router.replace('/(tabs)');
        }}
        activeOpacity={0.88}
      >
        <Text style={styles.emptyCtaText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      {/* 1. Header (Clean, White, Zero Shadows) */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ArrowLeft size={20} color="#111827" strokeWidth={2.4} />
        </TouchableOpacity>

        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>Wishlist</Text>
          <Text style={styles.headerSub}>
            {count} {count === 1 ? 'item' : 'items'} saved
          </Text>
        </View>

        {count > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => setShowClearModal(true)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Clear wishlist"
          >
            <Text style={styles.clearText}>Clear all</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.searchBtn}
          accessibilityRole="button"
          accessibilityLabel="Search products"
          onPress={() => router.push('/(tabs)/search')}
        >
          <Search size={22} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* 2. Content List */}
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#FEDC4A" />
        </View>
      ) : (
        <FlatList
          data={savedProducts}
          keyExtractor={(item) => item._id}
          renderItem={renderProductItem}
          numColumns={2}
          columnWrapperStyle={count > 0 ? styles.columnWrap : undefined}
          contentContainerStyle={[
            styles.listContent,
            count === 0 && { flexGrow: 1 },
            { paddingBottom: (count > 0 ? 84 : 20) + insets.bottom }
          ]}
          ListHeaderComponent={
            count > 0 ? (
              <View style={styles.topActionBar}>
                <Text style={styles.topActionCount}>
                  Saved Items ({count})
                </Text>
                <TouchableOpacity
                  style={styles.topAddAllBtn}
                  onPress={handleAddAllToCart}
                  disabled={isAddingAll}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Add all items to cart"
                >
                  {isAddingAll ? (
                    <ActivityIndicator size="small" color="#111827" />
                  ) : addedAllSuccess ? (
                    <>
                      <Check size={14} color="#111827" strokeWidth={3} />
                      <Text style={styles.topAddAllText}>Added to cart!</Text>
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={14} color="#111827" strokeWidth={2.4} />
                      <Text style={styles.topAddAllText}>Add all to cart</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : null
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          onRefresh={refreshWishlist}
          refreshing={false}
        />
      )}

      {/* 3. Sticky Bottom Action Bar (Zero Shadows, Clean Borders) */}
      {count > 0 && !isLoading && (
        <View style={[styles.bottomBarWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {cartTotalQty > 0 ? (
            <TouchableOpacity
              style={styles.cartBar}
              onPress={() => {
                haptics.selection();
                router.push('/(tabs)/cart');
              }}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="View cart"
            >
              <View>
                <Text style={styles.cartBarTitle}>
                  {cartTotalQty} {cartTotalQty === 1 ? 'item' : 'items'} in cart
                </Text>
                <Text style={styles.cartBarPrice}>₹{cartGrandTotal}</Text>
              </View>
              <View style={styles.cartBarRight}>
                <Text style={styles.cartBarCta}>View Cart</Text>
                <ChevronRight size={18} color="#FFFFFF" strokeWidth={2.6} />
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.addAllBtn}
              onPress={handleAddAllToCart}
              disabled={isAddingAll}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Add all items to cart"
            >
              {isAddingAll ? (
                <ActivityIndicator size="small" color="#111827" />
              ) : addedAllSuccess ? (
                <>
                  <Check size={18} color="#111827" strokeWidth={3} />
                  <Text style={styles.addAllText}>Added to cart!</Text>
                </>
              ) : (
                <>
                  <ShoppingBag size={18} color="#111827" strokeWidth={2.4} />
                  <Text style={styles.addAllText}>Add all to cart</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 4. Clear Confirmation Modal (Zero Shadows) */}
      <Modal
        visible={showClearModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (!isClearing) setShowClearModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => {
              if (!isClearing) setShowClearModal(false);
            }}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <Trash2 size={24} color="#DC2626" strokeWidth={2.2} />
            </View>
            <Text style={styles.modalTitle}>Clear wishlist?</Text>
            <Text style={styles.modalDesc}>
              This will remove all saved items. You can save them again anytime while browsing.
            </Text>
            <View style={styles.modalRow}>
              <TouchableOpacity
                style={[styles.modalCancel, isClearing && { opacity: 0.5 }]}
                onPress={() => setShowClearModal(false)}
                disabled={isClearing}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirm}
                onPress={handleClearAll}
                disabled={isClearing}
              >
                {isClearing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmText}>Clear all</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5'
  },
  searchBtn: {
    padding: 8
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitleCol: {
    flex: 1,
    alignItems: 'flex-start'
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: F.bold,
    color: '#111827'
  },
  headerSub: {
    fontSize: 12,
    fontFamily: F.regular,
    color: '#6B7280',
    marginTop: 1
  },
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  clearText: {
    fontSize: 13,
    fontFamily: F.bold,
    color: '#DC2626'
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  topActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 4
  },
  topActionCount: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  topAddAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#FEDC4A',
    borderWidth: 1,
    borderColor: '#FEDC4A'
  },
  topAddAllText: {
    fontFamily: F.bold,
    fontSize: 12.5,
    color: '#111827'
  },
  listContent: {
    paddingHorizontal: SIDE,
    paddingTop: 4
  },
  columnWrap: {
    gap: GAP,
    marginBottom: GAP
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F3F5',
    overflow: 'hidden'
  },
  imageBox: {
    height: CARD_WIDTH * 0.9,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    position: 'relative'
  },
  image: {
    width: '90%',
    height: '90%'
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FEDC4A',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2
  },
  discountText: {
    fontSize: 9.5,
    fontFamily: F.bold,
    color: '#111827'
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  cardBody: {
    padding: 10,
    paddingTop: 6
  },
  unitText: {
    fontSize: 11,
    fontFamily: F.medium,
    color: '#6B7280',
    marginBottom: 2
  },
  nameText: {
    fontSize: 13,
    fontFamily: F.bold,
    color: '#111827',
    lineHeight: 17,
    minHeight: 34,
    marginBottom: 6
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4
  },
  priceText: {
    fontSize: 15,
    fontFamily: F.bold,
    color: '#111827'
  },
  mrpText: {
    fontSize: 11,
    fontFamily: F.regular,
    color: '#9CA3AF',
    textDecorationLine: 'line-through'
  },
  addBtn: {
    minWidth: 58,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#FEDC4A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12
  },
  addBtnText: {
    fontSize: 12,
    fontFamily: F.bold,
    color: '#111827'
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    borderRadius: 9,
    backgroundColor: '#FEDC4A'
  },
  stepBtn: {
    width: 26,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepQty: {
    minWidth: 16,
    textAlign: 'center',
    fontSize: 13,
    fontFamily: F.bold,
    color: '#111827'
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingBottom: 60
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: F.bold,
    color: '#111827',
    marginBottom: 6
  },
  emptyDesc: {
    fontSize: 13,
    fontFamily: F.regular,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20
  },
  emptyCta: {
    height: 46,
    paddingHorizontal: 26,
    borderRadius: 12,
    backgroundColor: '#FEDC4A',
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyCtaText: {
    fontSize: 14,
    fontFamily: F.bold,
    color: '#111827'
  },
  bottomBarWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SIDE,
    paddingTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6'
  },
  addAllBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: '#FEDC4A',
    borderWidth: 1,
    borderColor: '#FEDC4A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  addAllText: {
    fontSize: 15,
    fontFamily: F.bold,
    color: '#111827'
  },
  cartBar: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#111827',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18
  },
  cartBarTitle: {
    fontSize: 11.5,
    fontFamily: F.medium,
    color: '#9CA3AF'
  },
  cartBarPrice: {
    fontSize: 15,
    fontFamily: F.bold,
    color: '#FFFFFF'
  },
  cartBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  cartBarCta: {
    fontSize: 14,
    fontFamily: F.bold,
    color: '#FFFFFF'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 20,
    alignItems: 'center'
  },
  modalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: F.bold,
    color: '#111827',
    marginBottom: 6
  },
  modalDesc: {
    fontSize: 13,
    fontFamily: F.regular,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18
  },
  modalRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%'
  },
  modalCancel: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalCancelText: {
    fontSize: 14,
    fontFamily: F.bold,
    color: '#374151'
  },
  modalConfirm: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalConfirmText: {
    fontSize: 14,
    fontFamily: F.bold,
    color: '#FFFFFF'
  }
});
