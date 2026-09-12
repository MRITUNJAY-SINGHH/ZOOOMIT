import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { 
  ShieldCheck, 
  Zap, 
  Percent, 
  Info,
  Plus
} from 'lucide-react-native';
import { colors, spacing, radius, typography, shadows } from '../../constants/theme';
import { StorefrontAPI } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { QuantityStepper } from '../../components/QuantityStepper';
import { ErrorState } from '../../components/ErrorState';

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { getItemQuantity, addItem, updateItem, cart } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState(null);

  const { data: product, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['product-details', id],
    queryFn: async () => {
      const res = await StorefrontAPI.getProductDetails(id);
      return res.data?.data;
    },
    enabled: Boolean(id)
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
          title="Product Not Found"
          message={error?.message || 'The requested product could not be loaded.'}
          onRetry={() => refetch()}
        />
      </View>
    );
  }

  const selectedVariant = product.variants?.find((v) => v._id === selectedVariantId) || null;
  const price = selectedVariant?.sellingPrice || product.sellingPrice;
  const mrp = selectedVariant?.mrp || product.mrp;
  const unit = selectedVariant?.conversionUnit || product.sellingUnit || product.baseUnit || 'PCS';
  const minQty = product.rules?.minQty || product.minSaleQty || 1;
  const maxQty = product.rules?.maxQty || product.maxSaleQty || 100;
  const step = product.rules?.step || product.qtyStep || 1;

  const currentQty = getItemQuantity(product._id, selectedVariant?._id);
  const hasDiscount = mrp && mrp > price;
  const discountPercent = hasDiscount 
    ? Math.round(((mrp - price) / mrp) * 100) 
    : 0;

  const handleAdd = () => {
    addItem(product._id, minQty, selectedVariant?._id, unit);
  };

  const handleIncrement = () => {
    const cartItem = cart.items.find(
      i => i.product._id === product._id && (selectedVariant ? i.variant?._id === selectedVariant._id : !i.variant)
    );
    if (cartItem) {
      updateItem(cartItem._id, Math.round((currentQty + step) * 1000) / 1000);
    }
  };

  const handleDecrement = () => {
    const cartItem = cart.items.find(
      i => i.product._id === product._id && (selectedVariant ? i.variant?._id === selectedVariant._id : !i.variant)
    );
    if (cartItem) {
      const nextQty = Math.round((currentQty - step) * 1000) / 1000;
      updateItem(cartItem._id, nextQty < minQty ? 0 : nextQty);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        {/* Product Image Section */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.featuredImage || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800' }}
            style={styles.productImage}
            contentFit="contain"
            transition={300}
          />
          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Percent size={12} color="#fff" style={{ marginRight: 2 }} />
              <Text style={styles.discountText}>{discountPercent}% OFF</Text>
            </View>
          )}
        </View>

        {/* Product Details Header */}
        <View style={styles.detailsCard}>
          {Boolean(product.brand) && (
            <Text style={styles.brandText}>{product.brand}</Text>
          )}
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.unitText}>{unit}</Text>

          {/* Pricing Row */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{price}</Text>
            {hasDiscount && (
              <Text style={styles.mrp}>MRP ₹{mrp}</Text>
            )}
            <View style={styles.inclusiveBadge}>
              <Text style={styles.inclusiveText}>Inclusive of all taxes</Text>
            </View>
          </View>

          {/* Quantity Rules Highlight */}
          <View style={styles.rulesCard}>
            <Info size={16} color={colors.secondary} style={{ marginRight: spacing.sm }} />
            <Text style={styles.rulesText}>
              Min Order: {minQty} {unit} • Increments of {step} {unit} (Max {maxQty} {unit})
            </Text>
          </View>
        </View>

        {/* Variants Selector if product has variants */}
        {product.variants && product.variants.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Select Pack / Size</Text>
            <View style={styles.variantsRow}>
              {/* Default Base Variant */}
              <TouchableOpacity
                style={[
                  styles.variantPill,
                  selectedVariantId === null && styles.variantPillActive
                ]}
                onPress={() => setSelectedVariantId(null)}
              >
                <Text style={[
                  styles.variantPillName,
                  selectedVariantId === null && styles.variantPillNameActive
                ]}>
                  Standard ({product.sellingUnit || product.baseUnit})
                </Text>
                <Text style={[
                  styles.variantPillPrice,
                  selectedVariantId === null && styles.variantPillPriceActive
                ]}>
                  ₹{product.sellingPrice}
                </Text>
              </TouchableOpacity>

              {/* Other Variants */}
              {product.variants.map((v) => {
                const isSelected = selectedVariantId === v._id;
                return (
                  <TouchableOpacity
                    key={v._id}
                    style={[styles.variantPill, isSelected && styles.variantPillActive]}
                    onPress={() => setSelectedVariantId(v._id)}
                  >
                    <Text style={[styles.variantPillName, isSelected && styles.variantPillNameActive]}>
                      {v.name}
                    </Text>
                    <Text style={[styles.variantPillPrice, isSelected && styles.variantPillPriceActive]}>
                      ₹{v.sellingPrice}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Superfast Delivery Promise */}
        <View style={styles.featureCard}>
          <View style={styles.featureRow}>
            <Zap size={20} color={colors.primary} style={{ marginRight: spacing.md }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>Superfast 15-25 Mins Delivery</Text>
              <Text style={styles.featureSubtitle}>Packed fresh at our local micro-fulfillment center</Text>
            </View>
          </View>
          <View style={[styles.featureRow, { marginTop: spacing.md }]}>
            <ShieldCheck size={20} color={colors.secondary} style={{ marginRight: spacing.md }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>100% Quality Guarantee</Text>
              <Text style={styles.featureSubtitle}>Hassle-free returns or refunds if any item is damaged</Text>
            </View>
          </View>
        </View>

        {/* Description & Tax Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Product Details</Text>
          <Text style={styles.description}>
            {product.description || 'Fresh, high-quality grocery item verified by Kuiklo quality assurance.'}
          </Text>

          {Boolean(product.taxInfo) && (
            <View style={styles.taxDetailsBox}>
              <Text style={styles.taxTitle}>Tax & Compliance Information</Text>
              <Text style={styles.taxLine}>• GST Rate: {product.taxInfo.taxRate}% (HSN: {product.taxInfo.hsnCode || 'N/A'})</Text>
              <Text style={styles.taxLine}>• Tax Mode: {product.taxInfo.taxMode}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky Bottom Add to Cart Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomPrice}>₹{price}</Text>
          <Text style={styles.bottomUnit}>{unit}</Text>
        </View>

        {currentQty > 0 ? (
          <QuantityStepper
            quantity={currentQty}
            minQty={minQty}
            maxQty={maxQty}
            step={step}
            unit={unit}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            style={{ minWidth: 160 }}
          />
        ) : (
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAdd}
            activeOpacity={0.8}
          >
            <Plus size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.addButtonText}>Add to Cart</Text>
          </TouchableOpacity>
        )}
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
  imageContainer: {
    height: 260,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  productImage: {
    width: '80%',
    height: '80%'
  },
  discountBadge: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm
  },
  discountText: {
    color: '#fff',
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold
  },
  detailsCard: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  brandText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    lineHeight: 28,
    marginBottom: spacing.xs
  },
  unitText: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    marginBottom: spacing.md
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  price: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.heavy,
    color: colors.textPrimary
  },
  mrp: {
    fontSize: typography.size.md,
    color: colors.textMuted,
    textDecorationLine: 'line-through'
  },
  inclusiveBadge: {
    backgroundColor: colors.surfaceSubtle,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.xs,
    marginLeft: spacing.xs
  },
  inclusiveText: {
    fontSize: typography.size.xs,
    color: colors.textSecondary
  },
  rulesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondarySubtle,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  rulesText: {
    fontSize: typography.size.xs,
    color: colors.secondary,
    fontWeight: typography.weight.medium
  },
  sectionCard: {
    backgroundColor: colors.surface,
    marginTop: spacing.md,
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  sectionTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md
  },
  variantsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  variantPill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle
  },
  variantPillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySubtle
  },
  variantPillName: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.textPrimary
  },
  variantPillNameActive: {
    color: colors.primary,
    fontWeight: typography.weight.bold
  },
  variantPillPrice: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 2
  },
  variantPillPriceActive: {
    color: colors.primary
  },
  featureCard: {
    backgroundColor: colors.surface,
    marginTop: spacing.md,
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  featureTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary,
    marginBottom: 2
  },
  featureSubtitle: {
    fontSize: typography.size.xs,
    color: colors.textSecondary
  },
  description: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    lineHeight: 22
  },
  taxDetailsBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md
  },
  taxTitle: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  taxLine: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    lineHeight: 18
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
  bottomPrice: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.heavy,
    color: colors.textPrimary
  },
  bottomUnit: {
    fontSize: typography.size.xs,
    color: colors.textMuted
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing['2xl'],
    borderRadius: radius.lg,
    minWidth: 160,
    justifyContent: 'center'
  },
  addButtonText: {
    color: '#fff',
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold
  }
});
