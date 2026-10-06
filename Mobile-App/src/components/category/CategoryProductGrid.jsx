import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  RefreshControl, 
  TouchableOpacity 
} from 'react-native';
import { ProductCard } from '../product/ProductCard';
import { ProductCardSkeleton } from '../LoadingSkeleton';
import { colors, typography } from '../../constants/theme';
import { ShoppingBag, RefreshCw } from 'lucide-react-native';

export const CategoryProductGrid = ({
  products = [],
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  onProductPress,
  onVariantPress,
  onRetry,
  headerComponent,
  footerComponent,
  style
}) => {
  if (isLoading && (!products || products.length === 0)) {
    return (
      <View style={[styles.container, styles.loadingContainer, style]}>
        <View style={styles.gridRow}>
          <View style={styles.gridCol}>
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </View>
          <View style={styles.gridCol}>
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </View>
        </View>
      </View>
    );
  }

  if (!isLoading && (!products || products.length === 0)) {
    return (
      <View style={[styles.container, styles.emptyContainer, style]}>
        <View style={styles.emptyIconWrap}>
          <ShoppingBag size={32} color="#9CA3AF" />
        </View>
        <Text style={styles.emptyTitle}>No Products Found</Text>
        <Text style={styles.emptySubtitle}>
          We couldn't find items matching your selection. Please try other filters or categories.
        </Text>
        {onRetry && (
          <TouchableOpacity 
            style={styles.retryBtn} 
            onPress={onRetry}
            activeOpacity={0.8}
          >
            <RefreshCw size={14} color="#111111" style={{ marginRight: 6 }} />
            <Text style={styles.retryBtnText}>Reset / Refresh</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const renderProductItem = ({ item }) => {
    return (
      <View style={styles.cardWrapper}>
        <ProductCard 
          product={item} 
          onPress={onProductPress}
          onVariantPress={onVariantPress} 
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <FlatList
        data={products}
        keyExtractor={(item) => item._id || item.slug || item.name}
        renderItem={renderProductItem}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={headerComponent}
        ListFooterComponent={footerComponent}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          ) : undefined
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  listContent: {
    paddingHorizontal: 6,
    paddingTop: 8,
    paddingBottom: 100
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    gap: 8
  },
  cardWrapper: {
    flex: 1,
    maxWidth: '49%'
  },
  loadingContainer: {
    padding: 8
  },
  gridRow: {
    flexDirection: 'row',
    gap: 8
  },
  gridCol: {
    flex: 1,
    gap: 8
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 40
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  emptyTitle: {
    fontFamily: typography.family.bold,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 6,
    fontWeight: '700'
  },
  emptySubtitle: {
    fontFamily: typography.family.regular,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20
  },
  retryBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 13,
    color: '#111111',
    fontWeight: '700'
  }
});
