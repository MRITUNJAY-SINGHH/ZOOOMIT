import React, { useState, useMemo, useEffect } from 'react';
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
import { StorefrontAPI, api } from '../../services/api';
import { CategorySidebar } from '../../components/category/CategorySidebar';
import { CategoryFilterBar } from '../../components/category/CategoryFilterBar';
import { CategoryProductGrid } from '../../components/category/CategoryProductGrid';
import { useCart } from '../../context/CartContext';
import { ProductQuickSheet } from '../../components/product/ProductQuickSheet';
import { haptics } from '../../services/haptics';

export default function CategoryDetailsScreen() {
  const { id: rawId } = useLocalSearchParams();
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const { cart } = useCart();

  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState(null);
  const [activeSort, setActiveSort] = useState('popular');
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [priceDropOnly, setPriceDropOnly] = useState(false);
  const [quickProduct, setQuickProduct] = useState(null);
  const [quickMode, setQuickMode] = useState('details');
  const [quickVariantId, setQuickVariantId] = useState(null);
  useEffect(() => { setSelectedSubcategoryId(null); setQuickProduct(null); }, [id]);
  const [selectedType, setSelectedType] = useState('ALL');

  // 1. Fetch Categories with subcategories
  const { data: categoriesData, isLoading: isCategoriesLoading, isError: categoriesError, refetch: refetchCategories } = useQuery({
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
    if (directMatch) {
      const parentId = typeof directMatch.parentCategory === 'string' ? directMatch.parentCategory : directMatch.parentCategory?._id;
      if (parentId) {
        const parent = categoriesData.find(c => c._id === parentId);
        if (parent) return parent;
      }
      return directMatch;
    }

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

    return null;
  }, [categoriesData, id]);

  // Subcategories to show in sidebar
  const sidebarCategories = useMemo(() => {
    if (!activeCategory) return [];
    const nested = activeCategory.subcategories || [];
    const flat = (categoriesData || []).filter(c => (typeof c.parentCategory === 'string' ? c.parentCategory : c.parentCategory?._id) === activeCategory._id);
    const subs = [...new Map([...nested, ...flat].filter(c => c.isActive !== false).map(c => [c._id, c])).values()];
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
    return [{ _id: 'ALL', name: activeCategory.name, image: activeCategory.image }];
  }, [activeCategory, categoriesData]);

  // Determine effective subcategory ID
  const effectiveSubcategoryId = useMemo(() => {
    if (selectedSubcategoryId) {
      return selectedSubcategoryId === 'ALL' ? null : selectedSubcategoryId;
    }
    // Only treat id as a subcategory if it explicitly matches one of the child subcategories
    if (activeCategory) {
      const subMatch = sidebarCategories.find(
        s => s._id === id || s.slug === id
      );
      if (subMatch) {
        return subMatch._id;
      }
    }
    return null;
  }, [selectedSubcategoryId, activeCategory, sidebarCategories, id]);

  // 2. Fetch Products for current category & subcategory
  const { 
    data: productsData, 
    isLoading: isProductsLoading, 
    isRefetching,
    isError: productsError,
    refetch 
  } = useQuery({
    queryKey: ['category-products', activeCategory?._id, effectiveSubcategoryId, activeSort],
    queryFn: async () => {
      const params = { limit: 50 };
      if (activeCategory?._id) params.category = activeCategory._id;
      if (effectiveSubcategoryId) params.subcategory = effectiveSubcategoryId;
      if (['price_asc', 'price_desc', 'discount_desc'].includes(activeSort)) params.sort = activeSort;
      const res = await api.get('/products', { params });
      const list = res.data?.data ?? res.data;
      if (!Array.isArray(list)) throw new Error('Invalid store catalog');
      return list;
    },
    enabled: Boolean(activeCategory?._id)
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

    if (priceDropOnly) list = list.filter(p => Number(p.mrp) > Number(p.sellingPrice) || p.variants?.some(v => Number(v.mrp) > Number(v.sellingPrice)));
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

    const low = p => p.variants?.length ? Math.min(...p.variants.map(v => Number(v.sellingPrice ?? p.sellingPrice ?? 0))) : Number(p.sellingPrice || 0);
    const discount = p => Math.max(0, ...[p, ...(p.variants || [])].map(v => Number(v.mrp) > 0 ? (Number(v.mrp) - Number(v.sellingPrice)) / Number(v.mrp) : 0));
    if (activeSort === 'price_asc') list.sort((a, b) => low(a) - low(b));
    if (activeSort === 'price_desc') list.sort((a, b) => low(b) - low(a));
    if (activeSort === 'discount_desc') list.sort((a, b) => discount(b) - discount(a));
    return list;
  }, [productsData, isVegOnly, inStockOnly, selectedBrand, selectedType, priceDropOnly, activeSort]);

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
    setPriceDropOnly(false);
    setActiveSort('popular');
    setIsVegOnly(false);
    setInStockOnly(false);
    setSelectedBrand(null);
    setSelectedType('ALL');
  };

  const pageTitle = sidebarCategories.find(c => c._id === effectiveSubcategoryId)?.name || activeCategory?.name || 'Category';
  const cartItemCount = cart?.items?.reduce((n, i) => n + Number(i.qty || 0), 0) || 0;
  const cartTotal = cart?.summary?.grandTotal || 0;

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
      {/* 2. Filter / Sort Row (Exact 4 pills: Filter, Sort By, Brand, Type) */}
      <CategoryFilterBar
        priceDropOnly={priceDropOnly}
        onTogglePriceDrop={() => setPriceDropOnly(v => !v)}
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


          {(categoriesError || productsError || (!isCategoriesLoading && !activeCategory)) ? <View style={styles.error}><Text style={styles.errorTitle}>{!activeCategory && !categoriesError ? 'Category not found' : 'Catalog could not be loaded'}</Text><Text style={styles.errorMessage}>Please try again. Your cart is unchanged.</Text><Pressable onPress={() => { refetchCategories(); refetch(); }} style={styles.retry}><Text>Retry</Text></Pressable></View> : <CategoryProductGrid
            products={filteredProducts}
            isLoading={isProductsLoading || isCategoriesLoading}
            isRefreshing={isRefetching}
            onRefresh={refetch}
            onProductPress={(prod) => {
              setQuickMode('details'); setQuickVariantId(null); setQuickProduct(prod);
            }}
            onVariantPress={(prod, variantId) => { setQuickMode('variants'); setQuickVariantId(variantId); setQuickProduct(prod); }}
            onRetry={handleResetFilters}
          />}
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
              router.push('/(tabs)/cart');
            }}
          >
            <View style={styles.cartBarLeft}>
              <View style={styles.cartIconCircle}>
                <ShoppingBag size={18} color="#FFFFFF" />
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
              <ChevronRight size={18} color="#FFFFFF" />
            </View>
          </Pressable>
        </View>
      )}

      {quickProduct && <ProductQuickSheet key={`${quickProduct._id}-${quickMode}`} product={quickProduct} mode={quickMode} initialVariantId={quickVariantId} onClose={() => setQuickProduct(null)} />}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  error: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 10 }, errorTitle: { fontSize: 16, fontFamily: typography.family.bold, textAlign: 'center' }, errorMessage: { color: '#888', textAlign: 'center', fontSize: 12 }, retry: { backgroundColor: colors.primary, borderRadius: 10, padding: 14 },
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
    textAlign: 'left',
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
    backgroundColor: '#fff'
  },
  productArea: {
    flex: 1,
    backgroundColor: '#fff'
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
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderTopWidth: 0
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
