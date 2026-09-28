import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Pressable 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Search, ShoppingBag, ChevronRight } from 'lucide-react-native';
import { colors, typography } from '../../constants/theme';
import { StorefrontAPI } from '../../services/api';
import { CategorySidebar } from '../../components/category/CategorySidebar';
import { CategoryFilterBar } from '../../components/category/CategoryFilterBar';
import { CategoryProductGrid } from '../../components/category/CategoryProductGrid';
import { useCart } from '../../context/CartContext';
import { haptics } from '../../services/haptics';
import { MOCK_PRODUCTS } from '../../services/mockProducts';
import { QuickProductSheet } from '../../components/product/QuickProductSheet';

export default function CategoryDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { cart } = useCart();

  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState(null);
  const [activeSort, setActiveSort] = useState('popular');
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedProductForSheet, setSelectedProductForSheet] = useState(null);
  const [quickSheetVisible, setQuickSheetVisible] = useState(false);

  // 1. Fetch Categories with subcategories
  const { data: categoriesData, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['categories-with-subcategories'],
    queryFn: async () => {
      const res = await StorefrontAPI.getCategories({ includeSubcategories: 'true' });
      return res.data?.data || [];
    }
  });

  // Find current active category / root category
  const activeCategory = useMemo(() => {
    if (!categoriesData || categoriesData.length === 0) return null;

    // Check if id matches any root category directly or by alias
    const directMatch = categoriesData.find(
      c => c._id === id || 
           c.slug === id || 
           (id === 'vegetables' && c.slug === 'fresh-vegetables') ||
           (c.name && id && c.name.toLowerCase() === id.toString().toLowerCase())
    );
    if (directMatch) return directMatch;

    // Check if id matches a subcategory
    for (const parent of categoriesData) {
      if (parent.subcategories) {
        const subMatch = parent.subcategories.find(
          s => s._id === id || s.slug === id
        );
        if (subMatch) {
          return parent;
        }
      }
    }

    return categoriesData[0] || null;
  }, [categoriesData, id]);

  // Subcategories to show in sidebar
  const sidebarCategories = useMemo(() => {
    if (!activeCategory) return [];
    const subs = activeCategory.subcategories || [];
    if (subs.length > 0) {
      // Include an "All" or self item at top if helpful
      return [
        {
          _id: 'ALL',
          name: activeCategory.name,
          image: activeCategory.image
        },
        ...subs
      ];
    }
    return [];
  }, [activeCategory]);

  // Determine effective subcategory ID
  const effectiveSubcategoryId = useMemo(() => {
    if (selectedSubcategoryId) {
      return selectedSubcategoryId === 'ALL' ? null : selectedSubcategoryId;
    }
    // Only treat id as a subcategory if it explicitly matches one of the child subcategories
    if (activeCategory && activeCategory.subcategories) {
      const subMatch = activeCategory.subcategories.find(
        s => s._id === id || s.slug === id
      );
      if (subMatch) {
        return subMatch._id;
      }
    }
    return null;
  }, [selectedSubcategoryId, activeCategory, id]);

  // 2. Fetch Products for current category & subcategory
  const { 
    data: productsData, 
    isLoading: isProductsLoading, 
    isRefetching, 
    refetch 
  } = useQuery({
    queryKey: ['category-products', activeCategory?._id, effectiveSubcategoryId, activeSort],
    queryFn: async () => {
      try {
        const params = {
          limit: 50
        };
        if (activeCategory?._id) {
          params.category = activeCategory._id;
        }
        if (effectiveSubcategoryId) {
          params.subcategory = effectiveSubcategoryId;
        }
        if (activeSort === 'price_asc') params.sort = 'price_asc';
        if (activeSort === 'price_desc') params.sort = 'price_desc';
        if (activeSort === 'discount_desc') params.sort = 'discount_desc';

        const res = await StorefrontAPI.getProducts(params);
        const list = res.data?.data || res.data;
        if (Array.isArray(list) && list.length > 0) {
          return list;
        }
      } catch (err) {
        console.log('[CategoryDetailsScreen] Products fetch error, using fallback:', err.message);
      }
      return MOCK_PRODUCTS;
    },
    enabled: true
  });

  // Dynamic list of available brands from products data
  const availableBrands = useMemo(() => {
    if (!productsData) return [];
    const set = new Set();
    productsData.forEach(p => {
      if (p.brand && typeof p.brand === 'string') {
        set.add(p.brand.trim());
      }
    });
    return Array.from(set);
  }, [productsData]);

  // Client-side filtering for veg / inStock / brand / type
  const filteredProducts = useMemo(() => {
    if (!productsData) return [];
    let list = [...productsData];

    if (isVegOnly || selectedType === 'VEG') {
      list = list.filter(p => p.isVeg !== false);
    }

    if (inStockOnly) {
      list = list.filter(p => !p.isTrackInventory || (p.stock || 0) > 0);
    }

    if (selectedBrand) {
      list = list.filter(p => p.brand === selectedBrand);
    }

    if (selectedType === 'ORGANIC') {
      list = list.filter(p => p.isOrganic || p.name?.toLowerCase().includes('organic'));
    } else if (selectedType === 'HYDROPONIC') {
      list = list.filter(p => p.isHydroponic || p.name?.toLowerCase().includes('hydroponic'));
    } else if (selectedType === 'FARM_FRESH') {
      list = list.filter(p => !p.isOrganic);
    }

    return list;
  }, [productsData, isVegOnly, inStockOnly, selectedBrand, selectedType]);

  const handleBackPress = () => {
    haptics.light();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleSearchPress = () => {
    haptics.light();
    router.push('/(tabs)/search');
  };

  const handleResetFilters = () => {
    setActiveSort('popular');
    setIsVegOnly(false);
    setInStockOnly(false);
    setSelectedBrand(null);
    setSelectedType('ALL');
  };

  const pageTitle = activeCategory?.name || 'Fresh Vegetables';
  const cartItemCount = cart?.totalItems || 0;
  const cartTotal = cart?.totalAmount || 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 1. Header (Clean, White, Zero Shadows) */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBackPress}
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeft size={22} color="#111827" />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {pageTitle}
        </Text>

        <TouchableOpacity
          onPress={handleSearchPress}
          style={styles.searchButton}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Search size={22} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* 2. Filter / Sort Row (Exact 4 pills: Filter, Sort By, Brand, Type) */}
      <CategoryFilterBar
        activeSort={activeSort}
        onSortChange={setActiveSort}
        isVegOnly={isVegOnly}
        onToggleVeg={() => setIsVegOnly(!isVegOnly)}
        inStockOnly={inStockOnly}
        onToggleInStock={() => setInStockOnly(!inStockOnly)}
        selectedBrand={selectedBrand}
        onBrandChange={setSelectedBrand}
        availableBrands={availableBrands}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        onResetFilters={handleResetFilters}
      />

      {/* 3. Main Split View: Sidebar + 2-Column Product Grid */}
      <View style={styles.body}>
        {sidebarCategories.length > 0 && (
          <CategorySidebar
            categories={sidebarCategories}
            selectedCategoryId={selectedSubcategoryId || (effectiveSubcategoryId ? id : 'ALL')}
            onSelectCategory={(item) => setSelectedSubcategoryId(item._id)}
          />
        )}

        <View style={styles.productArea}>
          <CategoryProductGrid
            products={filteredProducts}
            isLoading={isProductsLoading || isCategoriesLoading}
            isRefreshing={isRefetching}
            onRefresh={refetch}
            onProductPress={(prod) => {
              setSelectedProductForSheet(prod);
              setQuickSheetVisible(true);
            }}
            onRetry={handleResetFilters}
          />
        </View>
      </View>

      {/* 4. Bottom Sticky Cart Pill (Only when cart has items) */}
      {cartItemCount > 0 && (
        <View style={styles.cartBarContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.cartBar,
              pressed && styles.cartBarPressed
            ]}
            onPress={() => {
              haptics.medium();
              router.push('/checkout');
            }}
          >
            <View style={styles.cartBarLeft}>
              <View style={styles.cartIconCircle}>
                <ShoppingBag size={18} color="#111111" />
              </View>
              <View>
                <Text style={styles.cartBarCountText}>
                  {cartItemCount} {cartItemCount === 1 ? 'ITEM' : 'ITEMS'}
                </Text>
                <Text style={styles.cartBarTotalText}>₹{cartTotal}</Text>
              </View>
            </View>

            <View style={styles.cartBarRight}>
              <Text style={styles.cartBarActionText}>View Cart</Text>
              <ChevronRight size={18} color="#111111" />
            </View>
          </Pressable>
        </View>
      )}

      {/* 5. Quick Product Bottom Sheet (Screenshot 2) */}
      <QuickProductSheet
        visible={quickSheetVisible}
        product={selectedProductForSheet}
        onClose={() => setQuickSheetVisible(false)}
        onOpenFullDetails={(prod) => {
          setQuickSheetVisible(false);
          router.push(`/product/${prod._id}`);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start'
  },
  headerTitle: {
    flex: 1,
    fontFamily: typography.family.bold,
    fontSize: 18,
    color: '#111827',
    textAlign: 'center',
    fontWeight: '700',
    marginHorizontal: 8
  },
  searchButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-end'
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FAFAFA'
  },
  productArea: {
    flex: 1,
    backgroundColor: '#FAFAFA'
  },
  freeDeliveryBanner: {
    backgroundColor: '#E6FFFA',
    borderTopWidth: 1,
    borderTopColor: '#B2F5EA',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  freeDeliveryText: {
    fontFamily: typography.family.bold,
    fontSize: 12.5,
    color: '#0D9488',
    fontWeight: '700',
    letterSpacing: 0.4
  },
  freeDeliverySub: {
    fontFamily: typography.family.medium,
    fontWeight: '500',
    color: '#0F766E'
  },
  cartBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight
  },
  cartBar: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  cartBarPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }]
  },
  cartBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  cartIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  cartBarCountText: {
    fontFamily: typography.family.medium,
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '600'
  },
  cartBarTotalText: {
    fontFamily: typography.family.bold,
    fontSize: 15,
    color: '#111111',
    fontWeight: '700'
  },
  cartBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  cartBarActionText: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#111111',
    fontWeight: '700'
  }
});
