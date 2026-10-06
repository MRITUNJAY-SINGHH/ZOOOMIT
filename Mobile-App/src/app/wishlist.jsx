import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
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
  ChevronRight
} from 'lucide-react-native';
import { colors, typography } from '../constants/theme';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { haptics } from '../services/haptics';

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

  const cartTotalQty = cart?.items?.reduce((sum, i) => sum + (i.quantity || 1), 0) || 0;
  const cartGrandTotal = cart?.summary?.grandTotal || cart?.summary?.subTotal || 0;

  const handleBack = () => {
    haptics.selection();
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  const handleClearAll = async () => {
    if (isClearing) return;
    haptics.impactLight();
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
    const imageUrl = item.featuredImage || (item.galleryImages && item.galleryImages[0]) || null;

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
      >
        <View style={styles.imageBox}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} contentFit="contain" transition={200} />
          ) : (
            <ShoppingBag size={34} color={colors.textMuted} />
          )}
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discount}% OFF</Text>
            </View>
          )}
          <Pressable
            style={styles.heartBtn}
            onPress={() => {
              haptics.impactLight();
              toggleSave(item);
            }}
            hitSlop={8}
            accessibilityLabel="Remove from wishlist"
          >
            <Heart size={17} color="#E11D48" fill="#E11D48" />
          </Pressable>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.unitText} numberOfLines={1}>{unit}</Text>
          <Text style={styles.nameText} numberOfLines={2}>{item.name}</Text>

          <View style={styles.bottomRow}>
            <View>
              <Text style={styles.priceText}>₹{price}</Text>
              {mrp > price && <Text style={styles.mrpText}>₹{mrp}</Text>}
            </View>

            {currentQty > 0 ? (
              <View style={styles.stepper}>
                <Pressable onPress={handleDecrement} style={styles.stepBtn} hitSlop={6}>
                  <Minus size={14} color={colors.secondary} strokeWidth={3} />
                </Pressable>
                <Text style={styles.stepQty}>{currentQty}</Text>
                <Pressable onPress={handleIncrement} style={styles.stepBtn} hitSlop={6}>
                  <Plus size={14} color={colors.secondary} strokeWidth={3} />
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={handleAdd} style={styles.addBtn}>
                <Text style={styles.addBtnText}>ADD</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIcon}>
        <Heart size={38} color={colors.primaryDark} strokeWidth={1.8} />
      </View>
      <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
      <Text style={styles.emptyDesc}>Tap the heart on any product to save it here for later.</Text>
      <Pressable
        style={styles.emptyCta}
        onPress={() => {
          haptics.selection();
          router.replace('/(tabs)');
        }}
      >
        <Text style={styles.emptyCtaText}>Start shopping</Text>
      </Pressable>
    </View>
  );

  const count = savedProducts.length;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={handleBack} hitSlop={8} accessibilityLabel="Back">
          <ArrowLeft size={20} color={colors.textPrimary} strokeWidth={2.4} />
        </Pressable>
        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>Wishlist</Text>
          <Text style={styles.headerSub}>{count} {count === 1 ? 'item' : 'items'} saved</Text>
        </View>
        {count > 0 && (
          <Pressable style={styles.clearBtn} onPress={() => setShowClearModal(true)} hitSlop={8}>
            <Text style={styles.clearText}>Clear all</Text>
          </Pressable>
        )}
        <Pressable style={styles.searchBtn} accessibilityRole="button" accessibilityLabel="Search products" onPress={() => router.push('/(tabs)/search')}>
          <Search size={22} color="#17212B" />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primaryDark} />
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
            { paddingBottom: (cartTotalQty > 0 ? 96 : 24) + (count > 0 ? 76 : 0) + insets.bottom }
          ]}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          onRefresh={refreshWishlist}
          refreshing={false}
        />
      )}

      {count > 0 && !isLoading && (
        <View
          style={[
            styles.addAllWrap,
            { bottom: (cartTotalQty > 0 ? 76 : 0) + Math.max(insets.bottom, 12) }
          ]}
          pointerEvents="box-none"
        >
          <Pressable style={styles.addAllBtn} onPress={handleAddAllToCart} disabled={isAddingAll}>
            {isAddingAll ? (
              <ActivityIndicator size="small" color={colors.secondary} />
            ) : addedAllSuccess ? (
              <>
                <Check size={18} color={colors.secondary} strokeWidth={3} />
                <Text style={styles.addAllText}>Added to cart</Text>
              </>
            ) : (
              <>
                <ShoppingBag size={18} color={colors.secondary} strokeWidth={2.4} />
                <Text style={styles.addAllText}>Add all to cart</Text>
              </>
            )}
          </Pressable>
        </View>
      )}

      {cartTotalQty > 0 && (
        <View style={[styles.cartBarWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Pressable
            style={styles.cartBar}
            onPress={() => {
              haptics.selection();
              router.push('/(tabs)/cart');
            }}
          >
            <View>
              <Text style={styles.cartBarTitle}>{cartTotalQty} {cartTotalQty === 1 ? 'item' : 'items'} in cart</Text>
              <Text style={styles.cartBarPrice}>₹{cartGrandTotal}</Text>
            </View>
            <View style={styles.cartBarRight}>
              <Text style={styles.cartBarCta}>View cart</Text>
              <ChevronRight size={18} color={colors.white} strokeWidth={2.6} />
            </View>
          </Pressable>
        </View>
      )}

      <Modal
        visible={showClearModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => { if (!isClearing) setShowClearModal(false); }}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => { if (!isClearing) setShowClearModal(false); }} />
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <Trash2 size={24} color={colors.error} strokeWidth={2.2} />
            </View>
            <Text style={styles.modalTitle}>Clear wishlist?</Text>
            <Text style={styles.modalDesc}>This removes all saved items. You can save them again while browsing.</Text>
            <View style={styles.modalRow}>
              <Pressable style={[styles.modalCancel, isClearing && { opacity: 0.5 }]} onPress={() => setShowClearModal(false)} disabled={isClearing}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalConfirm} onPress={handleClearAll} disabled={isClearing}>
                {isClearing ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalConfirmText}>Clear all</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.softBackground },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingVertical: 10, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: '#F1F3F5' },
  searchBtn: { padding: 9 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  headerTitleCol: { flex: 1, alignItems: 'flex-start' },
  headerTitle: { fontSize: 17, fontFamily: F.bold, color: colors.textPrimary },
  headerSub: { fontSize: 12, fontFamily: F.regular, color: colors.textSecondary, marginTop: 1 },
  clearBtn: { paddingHorizontal: 4, alignItems: 'flex-end' },
  clearText: { fontSize: 13, fontFamily: F.bold, color: colors.error },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: SIDE, paddingTop: 14 },
  columnWrap: { gap: GAP, marginBottom: GAP },
  card: { width: CARD_WIDTH, backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.borderLight, overflow: 'hidden' },
  imageBox: { height: CARD_WIDTH * 0.85, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: 10 },
  image: { width: '100%', height: '100%' },
  discountBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: colors.primary, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  discountText: { fontSize: 10, fontFamily: F.bold, color: colors.secondary },
  heartBtn: { position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderLight },
  cardBody: { padding: 10, paddingTop: 4 },
  unitText: { fontSize: 11, fontFamily: F.medium, color: colors.textSecondary },
  nameText: { fontSize: 13, fontFamily: F.bold, color: colors.textPrimary, lineHeight: 17, minHeight: 34, marginTop: 2 },
  bottomRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 8 },
  priceText: { fontSize: 15, fontFamily: F.bold, color: colors.textPrimary },
  mrpText: { fontSize: 11, fontFamily: F.regular, color: colors.textMuted, textDecorationLine: 'line-through' },
  addBtn: { minWidth: 62, height: 32, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  addBtnText: { fontSize: 12.5, fontFamily: F.bold, color: colors.secondary },
  stepper: { flexDirection: 'row', alignItems: 'center', height: 32, borderRadius: 10, backgroundColor: colors.primary },
  stepBtn: { width: 28, height: 32, alignItems: 'center', justifyContent: 'center' },
  stepQty: { minWidth: 16, textAlign: 'center', fontSize: 13, fontFamily: F.bold, color: colors.secondary },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, paddingBottom: 60 },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontFamily: F.bold, color: colors.textPrimary, marginBottom: 6 },
  emptyDesc: { fontSize: 13, fontFamily: F.regular, color: colors.textSecondary, textAlign: 'center', lineHeight: 19, marginBottom: 20 },
  emptyCta: { height: 46, paddingHorizontal: 26, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  emptyCtaText: { fontSize: 14, fontFamily: F.bold, color: colors.secondary },
  addAllWrap: { position: 'absolute', left: 0, right: 0, paddingHorizontal: SIDE },
  addAllBtn: { height: 52, borderRadius: 16, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  addAllText: { fontSize: 15, fontFamily: F.bold, color: colors.secondary },
  cartBarWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: SIDE, paddingTop: 8, backgroundColor: colors.softBackground },
  cartBar: { height: 56, borderRadius: 16, backgroundColor: colors.secondary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  cartBarTitle: { fontSize: 12, fontFamily: F.medium, color: '#D0D5DD' },
  cartBarPrice: { fontSize: 15, fontFamily: F.bold, color: colors.white },
  cartBarRight: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  cartBarCta: { fontSize: 14, fontFamily: F.bold, color: colors.white },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 330, backgroundColor: colors.white, borderRadius: 20, padding: 20, alignItems: 'center' },
  modalIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.errorSubtle, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 17, fontFamily: F.bold, color: colors.textPrimary, marginBottom: 6 },
  modalDesc: { fontSize: 13, fontFamily: F.regular, color: colors.textSecondary, textAlign: 'center', lineHeight: 18, marginBottom: 18 },
  modalRow: { flexDirection: 'row', gap: 10, width: '100%' },
  modalCancel: { flex: 1, height: 44, borderRadius: 12, backgroundColor: colors.softBackground, alignItems: 'center', justifyContent: 'center' },
  modalCancelText: { fontSize: 14, fontFamily: F.bold, color: colors.textSecondary },
  modalConfirm: { flex: 1, height: 44, borderRadius: 12, backgroundColor: colors.error, alignItems: 'center', justifyContent: 'center' },
  modalConfirmText: { fontSize: 14, fontFamily: F.bold, color: '#fff' }
});
