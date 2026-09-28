import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Pressable, 
  Modal, 
  ActivityIndicator 
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { 
  ChevronRight, 
  RotateCcw, 
  Truck, 
  Headphones, 
  Tag, 
  Store, 
  ChevronsRight, 
  X, 
  CheckCircle2 
} from 'lucide-react-native';
import { colors, typography } from '../../constants/theme';
import { StorefrontAPI } from '../../services/api';
import { ProductImageGallery } from '../../components/product/ProductImageGallery';
import { ProductVariantSelector } from '../../components/product/ProductVariantSelector';
import { ProductInfoTabs } from '../../components/product/ProductInfoTabs';
import { SimilarProducts } from '../../components/product/SimilarProducts';
import { SellerDetails } from '../../components/product/SellerDetails';
import { ProductBottomBar } from '../../components/product/ProductBottomBar';
import { ErrorState } from '../../components/ErrorState';
import { haptics } from '../../services/haptics';

import { findMockProduct } from '../../services/mockProducts';

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams();
  const scrollViewRef = useRef(null);

  const cleanId = React.useMemo(() => {
    if (!id) return '';
    const raw = Array.isArray(id) ? id[0] : id;
    try {
      return decodeURIComponent(raw).trim();
    } catch (e) {
      return String(raw).trim();
    }
  }, [id]);

  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [offersModalVisible, setOffersModalVisible] = useState(false);

  // 1. Fetch Product Details with variants & similar products from real backend
  const { 
    data: product, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['product-details', cleanId],
    queryFn: async () => {
      try {
        const res = await StorefrontAPI.getProductDetails(cleanId);
        const prodData = res.data?.data || res.data;
        if (prodData && prodData.name) {
          return prodData;
        }
      } catch (err) {
        console.log('[ProductDetailsScreen] Fetch error, using fallback:', err.message);
      }
      return findMockProduct(cleanId);
    },
    enabled: Boolean(cleanId)
  });

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    );
  }

  if (isError || !product) {
    return (
      <View style={styles.container}>
        <ErrorState
          title="Product Unavailable"
          message={error?.message || 'This product could not be found or is currently unavailable.'}
          onRetry={() => refetch()}
        />
      </View>
    );
  }

  // Active Variant Calculation
  const variants = product.variants || [];
  const selectedVariant = variants.find(v => v._id === selectedVariantId) || variants[0] || null;

  const handleSelectVariant = (variantId) => {
    setSelectedVariantId(variantId);
  };

  const handleScrollToSimilar = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const categoryId = product.category?._id || product.category;
  const categoryName = product.category?.name || 'Fruits & Vegetables';

  const handleExploreCategory = () => {
    haptics.selection();
    if (categoryId) {
      router.push(`/category/${categoryId}`);
    } else {
      router.push('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={true}
      >
        {/* 1. Hero Product Gallery with Micro-interactions */}
        <ProductImageGallery
          product={product}
          onViewSimilar={handleScrollToSimilar}
        />

        {/* 2. Main Product Info */}
        <View style={styles.infoCard}>
          <Text style={styles.productName}>{product.name}</Text>
          
          {Boolean(product.subtitle) && (
            <Text style={styles.subtitle}>{product.subtitle}</Text>
          )}

          <Text style={styles.quantityLabel}>
            Quantity: {selectedVariant?.name || `${product.minSaleQty || 1} ${product.sellingUnit || product.baseUnit || 'PCS'}`}
          </Text>

          {/* Variant / Pack Selector */}
          {variants.length > 0 && (
            <ProductVariantSelector
              variants={variants}
              selectedVariantId={selectedVariant?._id}
              onSelectVariant={handleSelectVariant}
              defaultProduct={product}
            />
          )}

          {/* Payment Offers Row */}
          <Pressable
            style={({ pressed }) => [
              styles.paymentOffersRow,
              pressed && styles.paymentOffersRowPressed
            ]}
            onPress={() => {
              haptics.selection();
              setOffersModalVisible(true);
            }}
          >
            <View style={styles.offersHeaderRow}>
              <Text style={styles.offersTitle}>Payment Offers</Text>
              <ChevronRight size={16} color="#6B7280" />
            </View>
            <View style={styles.offerBadgeRow}>
              <View style={styles.offerTagCircle}>
                <Tag size={13} color="#7C3AED" />
              </View>
              <Text style={styles.offerAmountText}>₹100 OFF</Text>
              <Text style={styles.offerSubText}>with select bank cards & UPI</Text>
            </View>
          </Pressable>

          {/* Service Promises Row (48 Hours Refund, Fast Delivery, 24/7 Support) */}
          <View style={styles.servicePromisesRow}>
            <View style={styles.promiseItem}>
              <View style={styles.promiseIconWrap}>
                <RotateCcw size={16} color="#374151" />
              </View>
              <Text style={styles.promiseTitle}>48 Hours</Text>
              <Text style={styles.promiseSubtitle}>Refund*</Text>
            </View>

            <View style={styles.promiseDivider} />

            <View style={styles.promiseItem}>
              <View style={styles.promiseIconWrap}>
                <Truck size={16} color="#374151" />
              </View>
              <Text style={styles.promiseTitle}>Fast</Text>
              <Text style={styles.promiseSubtitle}>Delivery</Text>
            </View>

            <View style={styles.promiseDivider} />

            <View style={styles.promiseItem}>
              <View style={styles.promiseIconWrap}>
                <Headphones size={16} color="#374151" />
              </View>
              <Text style={styles.promiseTitle}>24/7</Text>
              <Text style={styles.promiseSubtitle}>Support</Text>
            </View>
          </View>
        </View>

        {/* 3. Product Information Tabs (Highlights, Description, Health benefits, Storage) */}
        <View style={styles.sectionWrap}>
          <ProductInfoTabs product={product} />
        </View>

        {/* 4. Explore Category Link Banner */}
        <Pressable
          style={({ pressed }) => [
            styles.exploreCategoryBanner,
            pressed && styles.exploreCategoryBannerPressed
          ]}
          onPress={handleExploreCategory}
        >
          <View style={styles.exploreLeft}>
            <Store size={18} color="#2563EB" style={{ marginRight: 8 }} />
            <Text style={styles.exploreText} numberOfLines={1}>
              Explore all {categoryName} items
            </Text>
          </View>
          <ChevronsRight size={18} color="#2563EB" />
        </Pressable>

        {/* 5. Similar Products (Horizontal Scroll) */}
        {product.similarProducts && product.similarProducts.length > 0 && (
          <View style={styles.sectionWrap}>
            <SimilarProducts products={product.similarProducts} />
          </View>
        )}

        {/* 6. Expandable Seller Details & Other Information */}
        <View style={styles.sectionWrap}>
          <SellerDetails product={product} />
        </View>
      </ScrollView>

      {/* 7. Sticky Bottom Purchase Bar */}
      <ProductBottomBar
        product={product}
        selectedVariant={selectedVariant}
      />

      {/* Payment Offers Bottom Sheet Modal */}
      <Modal
        visible={offersModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setOffersModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable 
            style={styles.modalBackdrop} 
            onPress={() => setOffersModalVisible(false)} 
          />
          <View style={styles.offersModalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Available Offers</Text>
              <TouchableOpacity
                onPress={() => setOffersModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={20} color="#374151" />
              </TouchableOpacity>
            </View>

            <View style={styles.offersList}>
              <View style={styles.offerItemCard}>
                <CheckCircle2 size={18} color="#16A34A" style={{ marginTop: 2 }} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.offerItemTitle}>Flat ₹100 OFF with KUIKLO100</Text>
                  <Text style={styles.offerItemDesc}>
                    Get ₹100 instant discount on grocery orders above ₹499. Apply coupon at checkout.
                  </Text>
                </View>
              </View>

              <View style={[styles.offerItemCard, { marginTop: 12 }]}>
                <CheckCircle2 size={18} color="#16A34A" style={{ marginTop: 2 }} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.offerItemTitle}>FREE Delivery on orders above ₹99</Text>
                  <Text style={styles.offerItemDesc}>
                    Applicable automatically for all quick-commerce delivery addresses in your zone.
                  </Text>
                </View>
              </View>

              <View style={[styles.offerItemCard, { marginTop: 12 }]}>
                <CheckCircle2 size={18} color="#16A34A" style={{ marginTop: 2 }} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.offerItemTitle}>5% Cashback with Kuiklo Pay UPI</Text>
                  <Text style={styles.offerItemDesc}>
                    Pay using any supported UPI app to receive 5% cashback credited to your wallet.
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setOffersModalVisible(false)}
            >
              <Text style={styles.modalCloseBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA'
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  loadingText: {
    marginTop: 12,
    fontFamily: typography.family.medium,
    fontSize: 14,
    color: '#6B7280'
  },
  scrollContent: {
    paddingBottom: 110
  },
  infoCard: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight
  },
  productName: {
    fontFamily: typography.family.bold,
    fontSize: 21,
    color: '#111827',
    fontWeight: '700',
    lineHeight: 27
  },
  subtitle: {
    fontFamily: typography.family.medium,
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 8
  },
  quantityLabel: {
    fontFamily: typography.family.bold,
    fontSize: 13.5,
    color: '#374151',
    fontWeight: '600',
    marginVertical: 4
  },
  paymentOffersRow: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 12,
    marginTop: 14
  },
  paymentOffersRowPressed: {
    backgroundColor: '#F3F4F6'
  },
  offersHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  offersTitle: {
    fontFamily: typography.family.bold,
    fontSize: 13.5,
    color: '#1F2937',
    fontWeight: '700'
  },
  offerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  offerTagCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6
  },
  offerAmountText: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '700',
    marginRight: 6
  },
  offerSubText: {
    fontFamily: typography.family.regular,
    fontSize: 12,
    color: '#6B7280'
  },
  servicePromisesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginTop: 14
  },
  promiseItem: {
    flex: 1,
    alignItems: 'center'
  },
  promiseIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4
  },
  promiseTitle: {
    fontFamily: typography.family.bold,
    fontSize: 11.5,
    color: '#1F2937',
    fontWeight: '700'
  },
  promiseSubtitle: {
    fontFamily: typography.family.regular,
    fontSize: 11,
    color: '#6B7280'
  },
  promiseDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.borderLight
  },
  sectionWrap: {
    backgroundColor: colors.white,
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderLight
  },
  exploreCategoryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 14
  },
  exploreCategoryBannerPressed: {
    backgroundColor: '#DBEAFE'
  },
  exploreLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  exploreText: {
    fontFamily: typography.family.bold,
    fontSize: 13,
    color: '#1E40AF',
    fontWeight: '700'
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)'
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject
  },
  offersModalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight
  },
  modalTitle: {
    fontFamily: typography.family.bold,
    fontSize: 17,
    color: '#111827',
    fontWeight: '700'
  },
  offersList: {
    paddingVertical: 16
  },
  offerItemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    padding: 12
  },
  offerItemTitle: {
    fontFamily: typography.family.bold,
    fontSize: 13.5,
    color: '#111827',
    fontWeight: '700',
    marginBottom: 3
  },
  offerItemDesc: {
    fontFamily: typography.family.regular,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16
  },
  modalCloseBtn: {
    backgroundColor: colors.primary,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10
  },
  modalCloseBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 14.5,
    color: '#111111',
    fontWeight: '700'
  }
});
