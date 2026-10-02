import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Platform,
  Modal,
  Dimensions
} from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Heart,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Zap,
  Check,
  Sparkles,
  ChevronRight
} from 'lucide-react-native';
import { colors, spacing, radius, typography } from '../constants/theme';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { haptics } from '../services/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function WishlistScreen() {
  const insets = useSafeAreaInsets();
  const { savedProducts, toggleSave, isLoading, refreshWishlist } = useWishlist();
  const { cart, addItem, updateItem, getItemQuantity } = useCart();

  const [showClearModal, setShowClearModal] = useState(false);
  const [isAddingAll, setIsAddingAll] = useState(false);
  const [addedAllSuccess, setAddedAllSuccess] = useState(false);

  const cartTotalQty = cart?.items?.reduce((sum, i) => sum + (i.quantity || 1), 0) || 0;
  const cartGrandTotal = cart?.summary?.grandTotal || cart?.summary?.subTotal || 0;

  const handleBack = () => {
    haptics.selection();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)/profile');
    }
  };

  const handleClearAll = async () => {
    haptics.impactLight();
    setShowClearModal(false);
    for (const p of savedProducts) {
      await toggleSave(p);
    }
  };

  const handleAddAllToCart = async () => {
    if (!savedProducts || savedProducts.length === 0 || isAddingAll) return;
    haptics.impactMedium();
    setIsAddingAll(true);
    try {
      for (const item of savedProducts) {
        const variantId = item.variants?.[0]?._id || null;
        const unit = item.variants?.[0]?.conversionUnit || item.sellingUnit || item.baseUnit || 'PCS';
        await addItem(item._id, 1, variantId, unit);
      }
      haptics.notificationSuccess();
      setAddedAllSuccess(true);
      setTimeout(() => setAddedAllSuccess(false), 2500);
    } catch (e) {
    } finally {
      setIsAddingAll(false);
    }
  };

  const renderProductItem = ({ item }) => {
    const activeVariant = item.variants?.[0] || null;
    const price = activeVariant?.sellingPrice || item.sellingPrice || 0;
    const mrp = activeVariant?.mrp || item.mrp || price;
    const unit = activeVariant?.conversionUnit || item.sellingUnit || item.baseUnit || 'PCS';
    const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
    const variantId = activeVariant?._id || null;
    const currentQty = getItemQuantity(item._id, variantId);

    const imageUrl = item.featuredImage || (item.galleryImages && item.galleryImages[0]) || 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600';

    const handleItemAdd = () => {
      haptics.selection();
      addItem(item._id, 1, variantId, unit);
    };

    const handleIncrement = () => {
      haptics.selection();
      const cartItem = cart?.items?.find(
        i => i.product?._id === item._id && (variantId ? i.variant?._id === variantId : !i.variant)
      );
      if (cartItem) {
        updateItem(cartItem._id, currentQty + 1);
      } else {
        addItem(item._id, 1, variantId, unit);
      }
    };

    const handleDecrement = () => {
      haptics.selection();
      const cartItem = cart?.items?.find(
        i => i.product?._id === item._id && (variantId ? i.variant?._id === variantId : !i.variant)
      );
      if (cartItem) {
        updateItem(cartItem._id, currentQty - 1);
      }
    };

    return (
      <Pressable
        style={styles.productCard}
        onPress={() => {
          haptics.selection();
          router.push('/product/' + item._id);
        }}
      >
        <View style={styles.imageCol}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.productImage}
            contentFit="cover"
            transition={200}
          />
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discount}% OFF</Text>
            </View>
          )}
        </View>

        <View style={styles.infoCol}>
          <View style={styles.topRow}>
            <View style={styles.deliveryBadge}>
              <Zap size={10} color="#D97706" fill="#D97706" />
              <Text style={styles.deliveryText}>10 MINS</Text>
            </View>

            <Pressable
              style={styles.removeBtn}
              onPress={(e) => {
                e?.stopPropagation?.();
                haptics.impactLight();
                toggleSave(item);
              }}
              hitSlop={8}
            >
              <Trash2 size={16} color={colors.textSecondary} />
            </Pressable>
          </View>

          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>

          <Text style={styles.unitText}>
            {unit}
          </Text>

          <View style={styles.priceAndActionRow}>
            <View style={styles.priceCol}>
              <View style={styles.priceRow}>
                <Text style={styles.priceText}>₹{price}</Text>
                {mrp > price && (
                  <Text style={styles.mrpText}>₹{mrp}</Text>
                )}
              </View>
              {mrp > price && (
                <Text style={styles.saveText}>Save ₹{mrp - price}</Text>
              )}
            </View>

            <View style={styles.actionCol}>
              {currentQty > 0 ? (
                <View style={styles.qtyControl}>
                  <Pressable
                    style={styles.qtyBtn}
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      handleDecrement();
                    }}
                    hitSlop={4}
                  >
                    <Minus size={14} color={colors.black} strokeWidth={2.5} />
                  </Pressable>
                  <Text style={styles.qtyValue}>{currentQty}</Text>
                  <Pressable
                    style={styles.qtyBtn}
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      handleIncrement();
                    }}
                    hitSlop={4}
                  >
                    <Plus size={14} color={colors.black} strokeWidth={2.5} />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  style={styles.addBtn}
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    handleItemAdd();
                  }}
                >
                  <Text style={styles.addBtnText}>ADD</Text>
                  <Plus size={13} color={colors.black} strokeWidth={2.5} style={{ marginLeft: 3 }} />
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Heart size={44} color={colors.primaryDark} strokeWidth={2.2} fill="#FFF9E8" />
      </View>
      <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
      <Text style={styles.emptySubtitle}>
        Save your favorite daily essentials, fresh fruits, vegetables, and snacks to order them anytime in 10 minutes.
      </Text>
      <Pressable
        style={styles.emptyCtaBtn}
        onPress={() => {
          haptics.selection();
          router.push('/(tabs)');
        }}
      >
        <ShoppingBag size={18} color={colors.black} strokeWidth={2.2} style={{ marginRight: 8 }} />
        <Text style={styles.emptyCtaText}>Explore Groceries</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          style={styles.headerBackBtn}
          onPress={handleBack}
          hitSlop={8}
          accessibilityLabel="Back"
        >
          <ArrowLeft size={20} color={colors.textPrimary} strokeWidth={2.4} />
        </Pressable>

        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>My Wishlist</Text>
          <Text style={styles.headerSubtitle}>
            {savedProducts.length} {savedProducts.length === 1 ? 'item' : 'items'} saved
          </Text>
        </View>

        {savedProducts.length > 0 ? (
          <Pressable
            style={styles.headerClearBtn}
            onPress={() => setShowClearModal(true)}
            hitSlop={8}
          >
            <Text style={styles.headerClearText}>Clear All</Text>
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {savedProducts.length > 0 && (
        <View style={styles.topBanner}>
          <View style={styles.topBannerLeft}>
            <View style={styles.bannerBadge}>
              <Heart size={14} color="#D97706" fill="#D97706" />
            </View>
            <View>
              <Text style={styles.bannerTitle}>
                {savedProducts.length} Saved {savedProducts.length === 1 ? 'Product' : 'Products'}
              </Text>
              <Text style={styles.bannerSubtitle}>Ready to order instantly</Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.addAllBtn,
              pressed && { opacity: 0.9 }
            ]}
            onPress={handleAddAllToCart}
            disabled={isAddingAll}
          >
            {isAddingAll ? (
              <ActivityIndicator size="small" color={colors.black} />
            ) : addedAllSuccess ? (
              <>
                <Check size={14} color={colors.black} strokeWidth={2.5} style={{ marginRight: 4 }} />
                <Text style={styles.addAllText}>Added!</Text>
              </>
            ) : (
              <>
                <Plus size={14} color={colors.black} strokeWidth={2.5} style={{ marginRight: 4 }} />
                <Text style={styles.addAllText}>Add All</Text>
              </>
            )}
          </Pressable>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your wishlist...</Text>
        </View>
      ) : (
        <FlatList
          data={savedProducts}
          keyExtractor={(item) => item._id}
          renderItem={renderProductItem}
          contentContainerStyle={[
            styles.listContent,
            savedProducts.length === 0 && { flex: 1 },
            cartTotalQty > 0 && { paddingBottom: 100 }
          ]}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          onRefresh={refreshWishlist}
          refreshing={isLoading}
        />
      )}

      {cartTotalQty > 0 && (
        <View style={[styles.floatingCartWrap, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable
            style={styles.floatingCartBar}
            onPress={() => {
              haptics.selection();
              router.push('/(tabs)/cart');
            }}
          >
            <View style={styles.floatingCartLeft}>
              <View style={styles.cartIconCircle}>
                <ShoppingBag size={18} color={colors.white} strokeWidth={2.4} />
              </View>
              <View>
                <Text style={styles.floatingCartTitle}>
                  {cartTotalQty} {cartTotalQty === 1 ? 'item' : 'items'} in cart
                </Text>
                <Text style={styles.floatingCartPrice}>₹{cartGrandTotal}</Text>
              </View>
            </View>

            <View style={styles.floatingCartRight}>
              <Text style={styles.floatingCartCtaText}>View Cart</Text>
              <ChevronRight size={18} color={colors.white} strokeWidth={2.4} />
            </View>
          </Pressable>
        </View>
      )}

      <Modal
        visible={showClearModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setShowClearModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 70 : 50}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setShowClearModal(false)}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalIconBadge}>
              <Trash2 size={24} color={colors.error} strokeWidth={2.4} />
            </View>
            <Text style={styles.modalTitle}>Clear Wishlist?</Text>
            <Text style={styles.modalDesc}>
              Are you sure you want to remove all items from your wishlist? You can add items back anytime while browsing.
            </Text>
            <View style={styles.modalActionsRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalCancelBtn,
                  pressed && { backgroundColor: colors.softBackground }
                ]}
                onPress={() => setShowClearModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.modalConfirmBtn,
                  pressed && { opacity: 0.9 }
                ]}
                onPress={handleClearAll}
              >
                <Text style={styles.modalConfirmText}>Clear All</Text>
              </Pressable>
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
    backgroundColor: '#F8FAFC'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  headerBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitleCol: {
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: typography.family.medium,
    color: colors.textSecondary,
    marginTop: 1
  },
  headerClearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#FEE2E2'
  },
  headerClearText: {
    fontSize: 12,
    fontFamily: typography.family.semibold,
    color: colors.error
  },
  topBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FDE68A'
  },
  topBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  bannerBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  bannerTitle: {
    fontSize: 13,
    fontFamily: typography.family.bold,
    color: '#92400E'
  },
  bannerSubtitle: {
    fontSize: 11,
    fontFamily: typography.family.regular,
    color: '#B45309'
  },
  addAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20
  },
  addAllText: {
    fontSize: 12,
    fontFamily: typography.family.bold,
    color: colors.black
  },
  listContent: {
    padding: 16,
    gap: 12
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  imageCol: {
    width: 96,
    height: 96,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
    position: 'relative'
  },
  productImage: {
    width: '100%',
    height: '100%'
  },
  discountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#16A34A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8
  },
  discountText: {
    fontSize: 9,
    fontFamily: typography.family.bold,
    color: colors.white
  },
  infoCol: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between'
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3
  },
  deliveryText: {
    fontSize: 9,
    fontFamily: typography.family.bold,
    color: '#B45309'
  },
  removeBtn: {
    padding: 4
  },
  productName: {
    fontSize: 14,
    fontFamily: typography.family.semibold,
    color: colors.textPrimary,
    marginTop: 4,
    lineHeight: 19
  },
  unitText: {
    fontSize: 12,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    marginTop: 2
  },
  priceAndActionRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 8
  },
  priceCol: {},
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6
  },
  priceText: {
    fontSize: 16,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  mrpText: {
    fontSize: 12,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    textDecorationLine: 'line-through'
  },
  saveText: {
    fontSize: 10,
    fontFamily: typography.family.semibold,
    color: '#16A34A',
    marginTop: 1
  },
  actionCol: {},
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 14,
    minWidth: 70
  },
  addBtnText: {
    fontSize: 12,
    fontFamily: typography.family.bold,
    color: colors.black
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 8
  },
  qtyBtn: {
    padding: 2
  },
  qtyValue: {
    fontSize: 13,
    fontFamily: typography.family.bold,
    color: colors.black,
    minWidth: 16,
    textAlign: 'center'
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32
  },
  loadingText: {
    fontSize: 14,
    fontFamily: typography.family.medium,
    color: colors.textSecondary,
    marginTop: 12
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFBEB',
    borderWidth: 2,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center'
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 26
  },
  emptyCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24
  },
  emptyCtaText: {
    fontSize: 15,
    fontFamily: typography.family.bold,
    color: colors.black
  },
  floatingCartWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    backgroundColor: 'transparent'
  },
  floatingCartBar: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 22
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  cartIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center'
  },
  floatingCartTitle: {
    fontSize: 13,
    fontFamily: typography.family.bold,
    color: colors.white
  },
  floatingCartPrice: {
    fontSize: 12,
    fontFamily: typography.family.regular,
    color: '#94A3B8'
  },
  floatingCartRight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4
  },
  floatingCartCtaText: {
    fontSize: 13,
    fontFamily: typography.family.bold,
    color: colors.white
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.45)'
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  modalIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    marginBottom: 8
  },
  modalDesc: {
    fontSize: 13,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%'
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalCancelText: {
    fontSize: 14,
    fontFamily: typography.family.semibold,
    color: colors.textSecondary
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalConfirmText: {
    fontSize: 14,
    fontFamily: typography.family.bold,
    color: colors.white
  }
});
