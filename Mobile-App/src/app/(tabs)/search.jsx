import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  X,
  ArrowLeft,
  SlidersHorizontal,
  ArrowUpDown,
  TrendingUp,
  Plus,
  Minus,
  Check,
  ChevronRight,
  Clock
} from 'lucide-react-native';
import { colors, spacing, radius, typography } from '../../constants/theme';
import { StorefrontAPI } from '../../services/api';
import { searchService } from '../../services/searchService';
import { useCart } from '../../context/CartContext';
import { haptics } from '../../services/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const POPULAR_CATEGORY_CARDS = [
  {
    id: 'fruits_veg',
    name: 'Fruits & Vegetables',
    query: 'Fruits & Vegetables',
    image: require('../../../assets/images/categories/fruits_veggies.jpg'),
    bgColor: '#FFFBF0'
  },
  {
    id: 'dairy_milk',
    name: 'Dairy & Milk',
    query: 'Dairy & Milk',
    image: require('../../../assets/images/categories/dairy_milk.jpg'),
    bgColor: '#F0F9FF'
  },
  {
    id: 'snacks_bev',
    name: 'Snacks & Beverages',
    query: 'Snacks & Beverages',
    image: require('../../../assets/images/categories/snacks_beverages.jpg'),
    bgColor: '#FFF7ED'
  },
  {
    id: 'atta_rice_dal',
    name: 'Atta, Rice & Dal',
    query: 'Atta, Rice & Dal',
    image: require('../../../assets/images/categories/atta_rice_dal.jpg'),
    bgColor: '#FAF5EF'
  },
  {
    id: 'masala_spices',
    name: 'Masala & Spices',
    query: 'Masala & Spices',
    image: require('../../../assets/images/categories/masala_spices.jpg'),
    bgColor: '#FEF2F2'
  },
  {
    id: 'personal_care',
    name: 'Personal Care',
    query: 'Personal Care',
    image: require('../../../assets/images/categories/personal_care.jpg'),
    bgColor: '#F0FDF4'
  }
];

const TRENDING_SEARCH_PILLS = [
  'Milk',
  'Banana',
  'Tomato',
  'Eggs',
  'Potato',
  'Onion',
  'Maggi',
  'Biscuits'
];

const POPULAR_SEARCH_FALLBACKS = [
  'Milk',
  'Rice',
  'Atta',
  'Oil',
  'Biscuits',
  'Vegetables'
];

const SORT_OPTIONS = [
  { id: 'default', label: 'Relevance' },
  { id: 'popular', label: 'Popularity' },
  { id: 'price_asc', label: 'Price: Low to High' },
  { id: 'price_desc', label: 'Price: High to Low' }
];

function ScalePressable({ children, onPress, style, disabled, ...props }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        style,
        !disabled && pressed && { transform: [{ scale: 0.96 }] }
      ]}
      {...props}
    >
      {children}
    </Pressable>
  );
}

export default function SearchScreen() {
  const { cart, addItem, updateItem, getItemQuantity } = useCart();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [sortBy, setSortBy] = useState('default');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const inputRef = useRef(null);

  useEffect(() => {
    searchService.getRecentSearches().then(setRecentSearches);
  }, []);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length >= 2) {
      setSuggestions(searchService.getSuggestions(trimmed));
    } else {
      setSuggestions([]);
    }

    const timer = setTimeout(() => {
      setDebouncedQuery(trimmed);
      if (trimmed) {
        searchService.addRecentSearch(trimmed).then(setRecentSearches);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchData, isLoading: isSearchLoading } = useQuery({
    queryKey: ['smart-search', debouncedQuery, sortBy, selectedCategoryFilter],
    queryFn: () =>
      searchService.executeSmartSearch({
        query: debouncedQuery,
        sort: sortBy,
        category: selectedCategoryFilter
      }),
    enabled: Boolean(debouncedQuery)
  });

  const { data: landingProducts = [] } = useQuery({
    queryKey: ['landing-featured-products'],
    queryFn: async () => {
      const res = await StorefrontAPI.getProducts({ limit: 8, isFeatured: true });
      return res.data?.data || [];
    },
    enabled: !debouncedQuery
  });

  const { data: allCategories = [] } = useQuery({
    queryKey: ['all-categories-filter'],
    queryFn: async () => {
      const res = await StorefrontAPI.getCategories();
      return res.data?.data || [];
    }
  });

  const handleClear = () => {
    haptics.selection();
    setSearchQuery('');
    setDebouncedQuery('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const handleSelectQuery = (term) => {
    haptics.impactLight();
    setSearchQuery(term);
    setDebouncedQuery(term);
    setSuggestions([]);
    inputRef.current?.blur();
  };

  const handleAddToCart = (product) => {
    haptics.impactLight();
    const minQty = product.minSaleQty || 1;
    const unit = product.sellingUnit || product.baseUnit || 'PCS';
    addItem(product._id, minQty, undefined, unit);
  };

  const handleIncrement = (product) => {
    haptics.selection();
    const cartItem = cart?.items?.find((i) => i.product?._id === product._id && !i.variant);
    if (cartItem) {
      const step = product.qtyStep || 1;
      updateItem(cartItem._id, Math.round((cartItem.qty + step) * 1000) / 1000);
    }
  };

  const handleDecrement = (product) => {
    haptics.selection();
    const cartItem = cart?.items?.find((i) => i.product?._id === product._id && !i.variant);
    if (cartItem) {
      const step = product.qtyStep || 1;
      const minQty = product.minSaleQty || 1;
      const nextQty = Math.round((cartItem.qty - step) * 1000) / 1000;
      updateItem(cartItem._id, nextQty < minQty ? 0 : nextQty);
    }
  };

  const isSearching = Boolean(debouncedQuery);
  const products = searchData?.products || [];
  const topResult = searchData?.topResult || null;
  const matchingCategories = searchData?.categories || [];
  const counts = searchData?.counts || { all: 0, products: 0, categories: 0 };
  const didYouMean = searchData?.didYouMean || null;

  return (
    <SafeAreaView style={styles.screenContainer} edges={['top']}>
      {/* Top Header / Search Bar */}
      <View style={styles.topHeaderArea}>
        {isSearching ? (
          <View style={styles.resultsHeaderRow}>
            <Pressable
              onPress={() => {
                haptics.selection();
                setSearchQuery('');
                setDebouncedQuery('');
              }}
              style={styles.backBtn}
              accessibilityRole="button"
              accessibilityLabel="Back to search landing"
            >
              <ArrowLeft size={22} color={colors.textPrimary} strokeWidth={2.4} />
            </Pressable>

            <View style={[styles.searchInputWrapper, isFocused && styles.searchInputFocused]}>
              <Search size={18} color={colors.textMuted} strokeWidth={2.4} style={{ marginRight: 8 }} />
              <TextInput
                ref={inputRef}
                style={styles.textInputStyle}
                placeholder="Search products, brands or categories"
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                returnKeyType="search"
                autoCorrect={false}
              />
              {Boolean(searchQuery) && (
                <Pressable onPress={handleClear} style={styles.clearIconBtn}>
                  <X size={14} color={colors.textSecondary} strokeWidth={2.6} />
                </Pressable>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.landingHeaderWrap}>
            <Text style={styles.landingTitle}>Search</Text>
            <Text style={styles.landingSubtitle}>Find your favorite products</Text>

            <View style={[styles.searchInputWrapper, isFocused && styles.searchInputFocused, { marginTop: spacing.md }]}>
              <Search size={19} color={colors.textMuted} strokeWidth={2.4} style={{ marginRight: 10 }} />
              <TextInput
                ref={inputRef}
                style={styles.textInputStyle}
                placeholder="Search for products, brands or categories"
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                returnKeyType="search"
                autoCorrect={false}
              />
              {Boolean(searchQuery) && (
                <Pressable onPress={handleClear} style={styles.clearIconBtn}>
                  <X size={14} color={colors.textSecondary} strokeWidth={2.6} />
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* Live Search Suggestions Dropdown */}
        {Boolean(suggestions.length > 0 && isFocused) && (
          <View style={styles.suggestionsContainer}>
            {suggestions.map((sug, idx) => (
              <Pressable
                key={idx}
                style={styles.suggestionRow}
                onPress={() => handleSelectQuery(sug.split(' (')[0])}
              >
                <Search size={14} color={colors.textMuted} style={{ marginRight: 10 }} />
                <Text style={styles.suggestionText}>{sug}</Text>
                <ChevronRight size={14} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Main Content Area */}
      {isSearching ? (
        <View style={styles.resultsMainContainer}>
          {/* Results Scope Tabs: All (count), Products (count), Categories (count) */}
          <View style={styles.tabsRow}>
            <ScalePressable
              onPress={() => {
                haptics.selection();
                setActiveTab('All');
              }}
              style={[styles.scopeTabPill, activeTab === 'All' ? styles.scopeTabActive : styles.scopeTabInactive]}
            >
              <Text style={[styles.scopeTabText, activeTab === 'All' ? styles.scopeTextActive : styles.scopeTextInactive]}>
                All ({counts.all})
              </Text>
            </ScalePressable>

            <ScalePressable
              onPress={() => {
                haptics.selection();
                setActiveTab('Products');
              }}
              style={[styles.scopeTabPill, activeTab === 'Products' ? styles.scopeTabActive : styles.scopeTabInactive]}
            >
              <Text style={[styles.scopeTabText, activeTab === 'Products' ? styles.scopeTextActive : styles.scopeTextInactive]}>
                Products ({counts.products})
              </Text>
            </ScalePressable>

            <ScalePressable
              onPress={() => {
                haptics.selection();
                setActiveTab('Categories');
              }}
              style={[styles.scopeTabPill, activeTab === 'Categories' ? styles.scopeTabActive : styles.scopeTabInactive]}
            >
              <Text style={[styles.scopeTabText, activeTab === 'Categories' ? styles.scopeTextActive : styles.scopeTextInactive]}>
                Categories ({counts.categories})
              </Text>
            </ScalePressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.resultsScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {isSearchLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.black} />
                <Text style={styles.loadingLabel}>Searching fresh products...</Text>
              </View>
            ) : products.length > 0 || matchingCategories.length > 0 ? (
              <>
                {/* Top Result Card */}
                {Boolean(topResult && (activeTab === 'All' || activeTab === 'Products')) && (
                  <View style={styles.sectionWrap}>
                    <Text style={styles.sectionHeading}>Top Result</Text>
                    <View style={styles.topResultCard}>
                      <View style={styles.topResultImgWrap}>
                        <Image
                          source={{
                            uri: topResult.featuredImage || 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400'
                          }}
                          style={styles.topResultImg}
                          resizeMode="cover"
                        />
                      </View>

                      <View style={styles.topResultInfoCol}>
                        <Text style={styles.topResultName} numberOfLines={1}>{topResult.name}</Text>
                        <Text style={styles.topResultUnit}>
                          {topResult.sellingUnit || topResult.baseUnit || '1 unit'}
                        </Text>
                        <Text style={styles.topResultPrice}>₹{topResult.sellingPrice?.toFixed(2)}</Text>
                      </View>

                      <ProductActionButton
                        product={topResult}
                        quantity={getItemQuantity(topResult._id)}
                        onAdd={() => handleAddToCart(topResult)}
                        onIncrement={() => handleIncrement(topResult)}
                        onDecrement={() => handleDecrement(topResult)}
                      />
                    </View>
                  </View>
                )}

                {/* Categories Matching Tab or Section */}
                {Boolean(matchingCategories.length > 0 && (activeTab === 'All' || activeTab === 'Categories')) && (
                  <View style={styles.sectionWrap}>
                    <Text style={styles.sectionHeading}>Categories</Text>
                    <View style={styles.categoriesGridRow}>
                      {matchingCategories.map((cat) => (
                        <ScalePressable
                          key={cat._id}
                          style={styles.matchingCatCard}
                          onPress={() => {
                            haptics.selection();
                            setSelectedCategoryFilter(cat._id);
                          }}
                        >
                          <Text style={styles.matchingCatName}>{cat.name}</Text>
                          <ChevronRight size={16} color={colors.textSecondary} />
                        </ScalePressable>
                      ))}
                    </View>
                  </View>
                )}

                {/* Products List Section */}
                {(activeTab === 'All' || activeTab === 'Products') && (
                  <View style={styles.sectionWrap}>
                    <View style={styles.productsHeaderRow}>
                      <Text style={styles.sectionHeading}>Products</Text>
                      <View style={styles.filterActionsRow}>
                        <ScalePressable
                          onPress={() => setShowFilterModal(true)}
                          style={styles.filterSortBtn}
                        >
                          <ArrowUpDown size={14} color={colors.textPrimary} strokeWidth={2.2} style={{ marginRight: 4 }} />
                          <Text style={styles.filterSortBtnText}>Sort</Text>
                        </ScalePressable>

                        <ScalePressable
                          onPress={() => setShowFilterModal(true)}
                          style={[styles.filterSortBtn, Boolean(selectedCategoryFilter) && styles.filterSortBtnActive]}
                        >
                          <SlidersHorizontal size={14} color={colors.textPrimary} strokeWidth={2.2} style={{ marginRight: 4 }} />
                          <Text style={styles.filterSortBtnText}>
                            {selectedCategoryFilter ? 'Filtered' : 'Filter'}
                          </Text>
                        </ScalePressable>
                      </View>
                    </View>

                    <View style={styles.productsListWrap}>
                      {products.map((item) => (
                        <View key={item._id} style={styles.productListItemRow}>
                          <Pressable
                            style={styles.productRowTouchable}
                            onPress={() => router.push(`/product/${item._id}`)}
                          >
                            <View style={styles.productRowImgWrap}>
                              <Image
                                source={{
                                  uri: item.featuredImage || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'
                                }}
                                style={styles.productRowImg}
                                resizeMode="cover"
                              />
                            </View>

                            <View style={styles.productRowDetailsCol}>
                              <Text style={styles.productRowName} numberOfLines={1}>{item.name}</Text>
                              <Text style={styles.productRowUnit}>
                                {item.sellingUnit || item.baseUnit || '1 unit'}
                              </Text>
                              <Text style={styles.productRowPrice}>₹{item.sellingPrice?.toFixed(2)}</Text>
                            </View>
                          </Pressable>

                          <ProductActionButton
                            product={item}
                            quantity={getItemQuantity(item._id)}
                            onAdd={() => handleAddToCart(item)}
                            onIncrement={() => handleIncrement(item)}
                            onDecrement={() => handleDecrement(item)}
                          />
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.emptyStateWrap}>
                <Text style={styles.emptyTitle}>No products found</Text>
                <Text style={styles.emptyDesc}>
                  We couldn't find any results for "{debouncedQuery}".
                </Text>

                {Boolean(didYouMean) && (
                  <View style={styles.didYouMeanBox}>
                    <Text style={styles.didYouMeanLabel}>Did you mean:</Text>
                    <ScalePressable
                      style={styles.didYouMeanBtn}
                      onPress={() => handleSelectQuery(didYouMean)}
                    >
                      <Text style={styles.didYouMeanText}>{didYouMean}</Text>
                    </ScalePressable>
                  </View>
                )}

                <View style={styles.emptyPopularBlock}>
                  <Text style={styles.emptyPopularTitle}>Try Searching For</Text>
                  <View style={styles.pillsWrap}>
                    {POPULAR_SEARCH_FALLBACKS.map((term, idx) => (
                      <ScalePressable
                        key={idx}
                        style={styles.trendingPill}
                        onPress={() => handleSelectQuery(term)}
                      >
                        <Text style={styles.trendingPillText}>{term}</Text>
                      </ScalePressable>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      ) : (
        /* Search Landing View */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.landingScrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Popular Categories Grid (2 rows x 3 columns) */}
          <View style={styles.landingSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitleBold}>Popular Categories</Text>
              <Pressable
                onPress={() => router.push('/category/vegetables')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.viewAllText}>View All &gt;</Text>
              </Pressable>
            </View>

            <View style={styles.categoryCardsGrid}>
              {POPULAR_CATEGORY_CARDS.map((cat) => (
                <ScalePressable
                  key={cat.id}
                  style={[styles.categoryCard, { backgroundColor: cat.bgColor }]}
                  onPress={() => {
                    if (cat.id === 'fruits_veg') {
                      router.push('/category/vegetables');
                    } else {
                      handleSelectQuery(cat.query);
                    }
                  }}
                >
                  <View style={styles.categoryImgWrap}>
                    <Image source={cat.image} style={styles.categoryCardImg} resizeMode="contain" />
                  </View>
                  <Text style={styles.categoryCardLabel} numberOfLines={2}>
                    {cat.name}
                  </Text>
                </ScalePressable>
              ))}
            </View>
          </View>

          {/* Trending Searches */}
          <View style={styles.landingSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.rowAlign}>
                <TrendingUp size={16} color="#D97706" strokeWidth={2.4} style={{ marginRight: 6 }} />
                <Text style={styles.sectionTitleBold}>Trending Searches</Text>
              </View>
            </View>

            <View style={styles.pillsWrap}>
              {TRENDING_SEARCH_PILLS.map((pill, idx) => (
                <ScalePressable
                  key={idx}
                  style={styles.trendingPill}
                  onPress={() => handleSelectQuery(pill)}
                >
                  <Text style={styles.trendingPillText}>{pill}</Text>
                </ScalePressable>
              ))}
            </View>
          </View>

          {/* Recently Viewed / Recommended Carousel */}
          <View style={styles.landingSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitleBold}>Recently Viewed</Text>
              <Pressable
                onPress={() => router.push('/(tabs)')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.viewAllText}>View All &gt;</Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentViewedScroll}
            >
              {landingProducts.slice(0, 6).map((item) => {
                const qty = getItemQuantity(item._id);
                return (
                  <View key={item._id} style={styles.recentViewedCard}>
                    <Pressable
                      onPress={() => router.push(`/product/${item._id}`)}
                      style={{ alignItems: 'center' }}
                    >
                      <View style={styles.recentViewedImgWrap}>
                        <Image
                          source={{
                            uri: item.featuredImage || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'
                          }}
                          style={styles.recentViewedImg}
                          resizeMode="cover"
                        />
                      </View>
                      <Text style={styles.recentViewedTitle} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.recentViewedUnit}>
                        {item.sellingUnit || item.baseUnit || '1 unit'}
                      </Text>
                    </Pressable>

                    <View style={styles.recentViewedBottomRow}>
                      <Text style={styles.recentViewedPrice}>
                        ₹{item.sellingPrice?.toFixed(2)}
                      </Text>

                      {qty > 0 ? (
                        <View style={styles.miniStepperWrap}>
                          <Pressable
                            onPress={() => handleDecrement(item)}
                            style={styles.miniStepBtn}
                          >
                            <Minus size={11} color={colors.black} strokeWidth={2.8} />
                          </Pressable>
                          <Text style={styles.miniStepQty}>{qty}</Text>
                          <Pressable
                            onPress={() => handleIncrement(item)}
                            style={styles.miniStepBtn}
                          >
                            <Plus size={11} color={colors.black} strokeWidth={2.8} />
                          </Pressable>
                        </View>
                      ) : (
                        <ScalePressable
                          style={styles.circlePlusBtn}
                          onPress={() => handleAddToCart(item)}
                        >
                          <Plus size={14} color={colors.black} strokeWidth={3} />
                        </ScalePressable>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </ScrollView>
      )}

      {/* Sort & Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowFilterModal(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Sort & Filter</Text>
              <Pressable onPress={() => setShowFilterModal(false)} style={styles.modalCloseBtn}>
                <X size={18} color={colors.textPrimary} strokeWidth={2.4} />
              </Pressable>
            </View>

            {/* Sort Options */}
            <Text style={styles.filterSectionTitle}>Sort By</Text>
            <View style={styles.filterPillsWrap}>
              {SORT_OPTIONS.map((item) => (
                <Pressable
                  key={item.id}
                  style={[
                    styles.filterModalPill,
                    sortBy === item.id ? styles.filterModalPillActive : styles.filterModalPillInactive
                  ]}
                  onPress={() => {
                    haptics.selection();
                    setSortBy(item.id);
                  }}
                >
                  <Text style={[
                    styles.filterModalPillText,
                    sortBy === item.id ? styles.filterModalTextActive : styles.filterModalTextInactive
                  ]}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Category Filter */}
            {allCategories.length > 0 && (
              <>
                <Text style={[styles.filterSectionTitle, { marginTop: spacing.md }]}>Category</Text>
                <View style={styles.filterPillsWrap}>
                  <Pressable
                    style={[
                      styles.filterModalPill,
                      !selectedCategoryFilter ? styles.filterModalPillActive : styles.filterModalPillInactive
                    ]}
                    onPress={() => {
                      haptics.selection();
                      setSelectedCategoryFilter(null);
                    }}
                  >
                    <Text style={[
                      styles.filterModalPillText,
                      !selectedCategoryFilter ? styles.filterModalTextActive : styles.filterModalTextInactive
                    ]}>
                      All Categories
                    </Text>
                  </Pressable>

                  {allCategories.slice(0, 8).map((cat) => (
                    <Pressable
                      key={cat._id}
                      style={[
                        styles.filterModalPill,
                        selectedCategoryFilter === cat._id ? styles.filterModalPillActive : styles.filterModalPillInactive
                      ]}
                      onPress={() => {
                        haptics.selection();
                        setSelectedCategoryFilter(cat._id);
                      }}
                    >
                      <Text style={[
                        styles.filterModalPillText,
                        selectedCategoryFilter === cat._id ? styles.filterModalTextActive : styles.filterModalTextInactive
                      ]}>
                        {cat.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            {/* Modal Actions */}
            <View style={styles.modalActionButtonsRow}>
              <Pressable
                style={styles.resetModalBtn}
                onPress={() => {
                  haptics.selection();
                  setSortBy('default');
                  setSelectedCategoryFilter(null);
                }}
              >
                <Text style={styles.resetModalBtnText}>Reset</Text>
              </Pressable>

              <Pressable
                style={styles.applyModalBtn}
                onPress={() => {
                  haptics.selection();
                  setShowFilterModal(false);
                }}
              >
                <Text style={styles.applyModalBtnText}>Apply</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ProductActionButton({ product, quantity, onAdd, onIncrement, onDecrement }) {
  if (quantity > 0) {
    return (
      <View style={styles.stepperContainer}>
        <Pressable onPress={onDecrement} style={styles.stepperBtn}>
          <Minus size={13} color={colors.black} strokeWidth={2.8} />
        </Pressable>
        <Text style={styles.stepperQtyText}>{quantity}</Text>
        <Pressable onPress={onIncrement} style={styles.stepperBtn}>
          <Plus size={13} color={colors.black} strokeWidth={2.8} />
        </Pressable>
      </View>
    );
  }

  return (
    <ScalePressable style={styles.addBtn} onPress={onAdd}>
      <Text style={styles.addBtnText}>Add</Text>
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.white
  },
  topHeaderArea: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle
  },
  landingHeaderWrap: {
    paddingVertical: spacing.xs
  },
  landingTitle: {
    fontSize: 26,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5
  },
  landingSubtitle: {
    fontSize: 13,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    marginTop: 2
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center'
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    height: 48,
    paddingHorizontal: 14
  },
  searchInputFocused: {
    borderColor: colors.primaryDark
  },
  textInputStyle: {
    flex: 1,
    fontSize: 14,
    fontFamily: typography.family.medium,
    color: colors.textPrimary,
    paddingVertical: 0
  },
  clearIconBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.softBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 70,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 99,
    paddingVertical: 4
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: typography.family.medium,
    color: colors.textPrimary
  },
  landingScrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 50
  },
  landingSection: {
    marginBottom: spacing.xl
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm + 2
  },
  rowAlign: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  sectionTitleBold: {
    fontSize: 16,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    letterSpacing: -0.2
  },
  viewAllText: {
    fontSize: 12,
    fontFamily: typography.family.semibold,
    color: colors.textSecondary
  },
  categoryCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10
  },
  categoryCard: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - 20) / 3,
    height: 106,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  categoryImgWrap: {
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 6
  },
  categoryCardImg: {
    width: '100%',
    height: '100%'
  },
  categoryCardLabel: {
    fontSize: 11,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 14
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  trendingPill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.softBackground,
    borderWidth: 1,
    borderColor: colors.border
  },
  trendingPillText: {
    fontSize: 13,
    fontFamily: typography.family.medium,
    color: colors.textPrimary
  },
  recentViewedScroll: {
    gap: 12,
    paddingVertical: 2
  },
  recentViewedCard: {
    width: 124,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 10
  },
  recentViewedImgWrap: {
    width: 90,
    height: 75,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.softBackground,
    marginBottom: 6
  },
  recentViewedImg: {
    width: '100%',
    height: '100%'
  },
  recentViewedTitle: {
    fontSize: 12,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    width: '100%'
  },
  recentViewedUnit: {
    fontSize: 11,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    marginTop: 1
  },
  recentViewedBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8
  },
  recentViewedPrice: {
    fontSize: 13,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  circlePlusBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  miniStepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 4,
    height: 26
  },
  miniStepBtn: {
    padding: 2
  },
  miniStepQty: {
    fontSize: 11,
    fontFamily: typography.family.bold,
    color: colors.black,
    marginHorizontal: 4
  },
  resultsMainContainer: {
    flex: 1
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle
  },
  scopeTabPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  scopeTabActive: {
    backgroundColor: colors.primary,
    borderWidth: 0,
    borderColor: 'transparent'
  },
  scopeTabInactive: {
    backgroundColor: colors.white,
    borderColor: colors.border
  },
  scopeTabText: {
    fontSize: 13,
    fontFamily: typography.family.medium
  },
  scopeTextActive: {
    fontFamily: typography.family.bold,
    color: colors.black
  },
  scopeTextInactive: {
    fontFamily: typography.family.medium,
    color: colors.textSecondary
  },
  resultsScrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 50
  },
  sectionWrap: {
    marginBottom: spacing.lg
  },
  sectionHeading: {
    fontSize: 16,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  topResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E8',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FFE8A3',
    padding: 12
  },
  topResultImgWrap: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.white,
    marginRight: 12
  },
  topResultImg: {
    width: '100%',
    height: '100%'
  },
  topResultInfoCol: {
    flex: 1
  },
  topResultName: {
    fontSize: 15,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  topResultUnit: {
    fontSize: 12,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    marginTop: 2
  },
  topResultPrice: {
    fontSize: 15,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    marginTop: 3
  },
  productsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs
  },
  filterActionsRow: {
    flexDirection: 'row',
    gap: 8
  },
  filterSortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white
  },
  filterSortBtnActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryDark
  },
  filterSortBtnText: {
    fontSize: 12,
    fontFamily: typography.family.medium,
    color: colors.textPrimary
  },
  productsListWrap: {
    gap: 8
  },
  productListItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 12
  },
  productRowTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  productRowImgWrap: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.softBackground,
    marginRight: 12
  },
  productRowImg: {
    width: '100%',
    height: '100%'
  },
  productRowDetailsCol: {
    flex: 1
  },
  productRowName: {
    fontSize: 14,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  productRowUnit: {
    fontSize: 12,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    marginTop: 2
  },
  productRowPrice: {
    fontSize: 14,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    marginTop: 3
  },
  addBtn: {
    width: 68,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  addBtnText: {
    fontSize: 13,
    fontFamily: typography.family.bold,
    color: colors.black
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 36,
    paddingHorizontal: 6
  },
  stepperBtn: {
    padding: 6
  },
  stepperQtyText: {
    fontSize: 13,
    fontFamily: typography.family.bold,
    color: colors.black,
    minWidth: 18,
    textAlign: 'center'
  },
  matchingCatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.softBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8
  },
  matchingCatName: {
    fontSize: 14,
    fontFamily: typography.family.semibold,
    color: colors.textPrimary
  },
  categoriesGridRow: {
    gap: 8
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center'
  },
  loadingLabel: {
    marginTop: 12,
    fontSize: 13,
    fontFamily: typography.family.medium,
    color: colors.textSecondary
  },
  emptyStateWrap: {
    paddingVertical: 40,
    alignItems: 'center'
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    marginBottom: 4
  },
  emptyDesc: {
    fontSize: 13,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16
  },
  didYouMeanBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#FFE8A3',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20
  },
  didYouMeanLabel: {
    fontSize: 13,
    fontFamily: typography.family.medium,
    color: colors.textSecondary,
    marginRight: 6
  },
  didYouMeanBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  didYouMeanText: {
    fontSize: 13,
    fontFamily: typography.family.bold,
    color: colors.black
  },
  emptyPopularBlock: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10
  },
  emptyPopularTitle: {
    fontSize: 14,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    marginBottom: 10
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end'
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  modalCloseBtn: {
    padding: 4
  },
  filterSectionTitle: {
    fontSize: 14,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    marginBottom: 8
  },
  filterPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  filterModalPill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1
  },
  filterModalPillActive: {
    backgroundColor: colors.primary,
    borderWidth: 0,
    borderColor: 'transparent'
  },
  filterModalPillInactive: {
    backgroundColor: colors.white,
    borderColor: colors.border
  },
  filterModalPillText: {
    fontSize: 13,
    fontFamily: typography.family.medium
  },
  filterModalTextActive: {
    fontFamily: typography.family.bold,
    color: colors.black
  },
  filterModalTextInactive: {
    fontFamily: typography.family.medium,
    color: colors.textSecondary
  },
  modalActionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: spacing.xl
  },
  resetModalBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center'
  },
  resetModalBtnText: {
    fontSize: 14,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  applyModalBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  applyModalBtnText: {
    fontSize: 14,
    fontFamily: typography.family.bold,
    color: colors.black
  }
});
