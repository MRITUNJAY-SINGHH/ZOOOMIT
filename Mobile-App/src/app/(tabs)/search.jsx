import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Dimensions,
  Modal,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  Search,
  X,
  Clock,
  ChevronRight,
  SlidersHorizontal,
  ChevronDown,
  ArrowUpDown,
  Heart,
  Plus,
  Minus,
  Check,
  Star,
  ShoppingBag
} from 'lucide-react-native';
import { typography } from '../../constants/theme';
import { api } from '../../services/api';
import { ProductCard } from '../../components/product/ProductCard';
import { searchService } from '../../services/searchService';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useTabBarVisibility } from '../../context/TabBarVisibilityContext';
import { haptics } from '../../services/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FONTS = {
  heavy: typography?.family?.heavy || 'Gilroy-Heavy',
  bold: typography?.family?.bold || 'Gilroy-Bold',
  medium: typography?.family?.medium || 'Gilroy-Medium',
  regular: typography?.family?.regular || 'Gilroy-Regular'
};

const DEFAULT_RECENT_SEARCHES = ['Milk', 'Eggs', 'Bread', 'Chocolates', 'Detergent', 'Apples'];

const POPULAR_CATEGORIES = [
  {
    id: 'milk_dairy',
    name: 'Milk & Dairy',
    query: 'Milk',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400'
  },
  {
    id: 'fruits',
    name: 'Fruits',
    query: 'Fruits',
    image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400'
  },
  {
    id: 'vegetables',
    name: 'Vegetables',
    query: 'Vegetables',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400'
  },
  {
    id: 'chocolates',
    name: 'Chocolates',
    query: 'Chocolates',
    image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400'
  },
  {
    id: 'biscuits',
    name: 'Biscuits',
    query: 'Biscuits',
    image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400'
  },
  {
    id: 'chips_snacks',
    name: 'Chips & Snacks',
    query: 'Chips',
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400'
  },
  {
    id: 'cold_drinks',
    name: 'Cold Drinks',
    query: 'Cold Drinks',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400'
  },
  {
    id: 'ice_creams',
    name: 'Ice Creams',
    query: 'Ice Cream',
    image: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=400'
  },
  {
    id: 'atta_rice_dal',
    name: 'Atta, Rice & Dal',
    query: 'Atta',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'
  }
];


const SEARCH_TABS = ['All', 'Products', 'Categories', 'Brands'];

const PRICE_FILTER_OPTIONS = [
  'Under ₹50',
  '₹50 - ₹100',
  '₹100 - ₹200',
  '₹200 - ₹500',
  'Above ₹500'
];

const BRAND_FILTER_OPTIONS = [
  'Cadbury',
  'Nestle',
  'Ferrero Rocher',
  'Mars',
  "Hershey's",
  'Lindt',
  'Amul',
  'Others'
];

const RATING_FILTER_OPTIONS = ['4★ & above', '3★ & above', '2★ & above'];

const SORT_OPTIONS = [
  { id: 'default', label: 'Relevance' },
  { id: 'popular', label: 'Popularity' },
  { id: 'price_asc', label: 'Price: Low to High' },
  { id: 'price_desc', label: 'Price: High to Low' }
];

export default function SearchScreen() {
  const { onScrollHandler } = useTabBarVisibility();
  const { cart, addItem, updateItem, getItemQuantity } = useCart();
  const { isSaved, toggleSave } = useWishlist();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [recentSearches, setRecentSearches] = useState([]);

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState('default');

  const [selectedPriceRange, setSelectedPriceRange] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedRating, setSelectedRating] = useState(null);
  const [inStockOnly, setInStockOnly] = useState(true);

  const inputRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    searchService.getRecentSearches().then((saved) => {
      if (isMounted) {
        if (Array.isArray(saved) && saved.length > 0) {
          setRecentSearches(saved);
        } else {
          setRecentSearches(DEFAULT_RECENT_SEARCHES);
        }
      }
    }).catch(() => {
      if (isMounted) setRecentSearches(DEFAULT_RECENT_SEARCHES);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const { data: apiProducts = [], isLoading: catalogLoading, isError: catalogError, refetch: reloadCatalog } = useQuery({
    queryKey: ['storefront-products-search'],
    queryFn: async () => {
      const res = await api.get('/products', { params: { limit: 100 } });
      const data = res.data?.data ?? res.data;
      if (!Array.isArray(data)) throw new Error('Invalid store catalog');
      return data;
    }
  });
  const combinedCatalog = apiProducts;

  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const baseList = [
      q.charAt(0).toUpperCase() + q.slice(1),
      `${q.charAt(0).toUpperCase() + q.slice(1)} box`,
      `${q.charAt(0).toUpperCase() + q.slice(1)} gift pack`,
      `Cadbury ${q}`,
      'Dairy milk',
      `${q.charAt(0).toUpperCase() + q.slice(1)} biscuits`,
      `Dark ${q}`,
      `${q.charAt(0).toUpperCase() + q.slice(1)} ice cream`,
      'Ferrero rocher'
    ];

    const catalogMatches = combinedCatalog
      .filter((p) => (p.name || '').toLowerCase().includes(q))
      .map((p) => p.name);

    const merged = Array.from(new Set([...baseList, ...catalogMatches])).slice(0, 9);
    return merged;
  }, [searchQuery, combinedCatalog]);

  const searchResults = useMemo(() => {
    const q = (activeQuery || searchQuery).trim().toLowerCase();
    if (!q) return [];

    let list = combinedCatalog.filter((item) => {
      const nameMatch = (item.name || '').toLowerCase().includes(q);
      const catMatch = (item.category?.name || '').toLowerCase().includes(q);
      const brandMatch = (item.brand || '').toLowerCase().includes(q);
      return nameMatch || catMatch || brandMatch;
    });

    if (activeTab === 'Products') {
      list = list.filter((item) => !item.isCategoryItem);
    } else if (activeTab === 'Categories') {
      list = list.filter((item) => item.category?.name);
    } else if (activeTab === 'Brands') {
      list = list.filter((item) => item.brand);
    }

    if (inStockOnly) {
      list = list.filter((item) => (!item.isTrackInventory || Number(item.stock ?? 0) > 0));
    }

    if (selectedPriceRange) {
      list = list.filter((item) => {
        const p = item.sellingPrice || item.price || 0;
        if (selectedPriceRange === 'Under ₹50') return p < 50;
        if (selectedPriceRange === '₹50 - ₹100') return p >= 50 && p <= 100;
        if (selectedPriceRange === '₹100 - ₹200') return p >= 100 && p <= 200;
        if (selectedPriceRange === '₹200 - ₹500') return p >= 200 && p <= 500;
        if (selectedPriceRange === 'Above ₹500') return p > 500;
        return true;
      });
    }

    if (selectedBrand) {
      if (selectedBrand === 'Others') {
        const standard = ['Cadbury', 'Nestle', 'Ferrero Rocher', 'Mars', "Hershey's", 'Lindt', 'Amul'];
        list = list.filter((item) => !standard.includes(item.brand));
      } else {
        list = list.filter((item) => item.brand === selectedBrand);
      }
    }

    if (selectedRating) {
      const minRating = parseFloat(selectedRating);
      if (!isNaN(minRating)) {
        list = list.filter((item) => (item.rating || 0) >= minRating);
      }
    }

    if (sortBy === 'price_asc') {
      list.sort((a, b) => (a.sellingPrice || a.price || 0) - (b.sellingPrice || b.price || 0));
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => (b.sellingPrice || b.price || 0) - (a.sellingPrice || a.price || 0));
    } else if (sortBy === 'popular') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return list;
  }, [activeQuery, searchQuery, combinedCatalog, activeTab, inStockOnly, selectedPriceRange, selectedBrand, selectedRating, sortBy]);

  const addSearchToRecent = (term) => {
    if (!term || !term.trim()) return;
    const clean = term.trim();
    setRecentSearches((prev) => {
      const filtered = prev.filter((t) => t.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 10);
      searchService.addRecentSearch(clean).catch(() => {});
      return updated;
    });
  };

  const handleSelectSuggestion = (term) => {
    const q = term.trim();
    if (q) {
      haptics.selection();
      setSearchQuery(q);
      setActiveQuery(q);
      setIsInputFocused(false);
      inputRef.current?.blur();
      addSearchToRecent(q);
    }
  };

  const handleSearchSubmit = () => {
    const q = searchQuery.trim();
    if (q) {
      haptics.selection();
      setActiveQuery(q);
      setIsInputFocused(false);
      inputRef.current?.blur();
      addSearchToRecent(q);
    }
  };

  const handleClearRecent = () => {
    haptics.selection();
    setRecentSearches([]);
    searchService.clearRecentSearches().catch(() => {});
  };

  const handleClearQuery = () => {
    haptics.selection();
    setSearchQuery('');
    setActiveQuery('');
    inputRef.current?.focus();
  };

  const handleBackPress = () => {
    haptics.selection();
    if (activeQuery || searchQuery || isInputFocused) {
      setSearchQuery('');
      setActiveQuery('');
      setIsInputFocused(false);
      inputRef.current?.blur();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleAddToCart = (product) => {
    haptics.impactLight();
    const minQty = product.minSaleQty || 1;
    const unit = product.unit || product.sellingUnit || '1 pack';
    addItem(product._id, minQty, undefined, unit);
  };

  const handleQtyChange = (product, newQty) => {
    haptics.selection();
    const cartItem = cart?.items?.find((i) => i.product?._id === product._id && !i.variant);
    if (cartItem) {
      updateItem(cartItem._id, newQty);
    } else if (newQty > 0) {
      handleAddToCart(product);
    }
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedPriceRange) count++;
    if (selectedBrand) count++;
    if (selectedRating) count++;
    if (inStockOnly) count++;
    return count;
  }, [selectedPriceRange, selectedBrand, selectedRating, inStockOnly]);

  const handleClearFilters = () => {
    haptics.selection();
    setSelectedPriceRange(null);
    setSelectedBrand(null);
    setSelectedRating(null);
    setInStockOnly(false);
  };

  const isResultsView = Boolean(activeQuery && !isInputFocused);
  const isTypingView = Boolean(searchQuery.trim().length > 0 && isInputFocused);

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
          hitSlop={8}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color="#0F172A" strokeWidth={2.4} />
        </TouchableOpacity>

        <View style={styles.searchBarWrapper}>
          <Search size={18} color="#64748B" style={{ marginRight: 8 }} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search for 'Milk'"
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (!isInputFocused) setIsInputFocused(true);
            }}
            onFocus={() => setIsInputFocused(true)}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            autoCorrect={false}
          />

          {Boolean(searchQuery) && (
            <TouchableOpacity onPress={handleClearQuery} hitSlop={6} style={styles.clearIconBtn}>
              <View style={styles.clearIconCircle}>
                <X size={12} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            </TouchableOpacity>
          )}
        </View>

      </View>

      {isTypingView ? (
        <ScrollView
          style={styles.contentFlex}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {suggestions.map((item, idx) => (
            <TouchableOpacity
              key={idx.toString()}
              style={styles.suggestionRow}
              onPress={() => handleSelectSuggestion(item)}
              activeOpacity={0.7}
            >
              <View style={styles.suggestionLeft}>
                <Search size={16} color="#64748B" style={{ marginRight: 12 }} />
                <Text style={styles.suggestionText}>{item}</Text>
              </View>
              <ChevronRight size={16} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : isResultsView ? (
        <View style={styles.contentFlex}>
          <View style={styles.tabsRow}>
            {SEARCH_TABS.map((tab) => {
              const isSelected = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabItem, isSelected && styles.tabItemActive]}
                  onPress={() => {
                    haptics.selection();
                    setActiveTab(tab);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabItemText, isSelected && styles.tabItemTextActive]}>
                    {tab}
                  </Text>
                  {isSelected && <View style={styles.tabIndicator} />}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.filterChipsBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterChipsScroll}
            >
              <TouchableOpacity
                style={[
                  styles.filterActionButton,
                  activeFiltersCount > 0 && styles.filterActionButtonActive
                ]}
                onPress={() => {
                  haptics.selection();
                  setFilterModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <SlidersHorizontal
                  size={14}
                  color={activeFiltersCount > 0 ? '#2563EB' : '#0F172A'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.filterActionButtonText,
                    activeFiltersCount > 0 && styles.filterActionButtonTextActive
                  ]}
                >
                  Filters
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, Boolean(selectedPriceRange) && styles.filterChipActive]}
                onPress={() => {
                  haptics.selection();
                  setFilterModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    Boolean(selectedPriceRange) && styles.filterChipTextActive
                  ]}
                >
                  {selectedPriceRange || 'Price'}
                </Text>
                <ChevronDown
                  size={14}
                  color={selectedPriceRange ? '#2563EB' : '#64748B'}
                  style={{ marginLeft: 4 }}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, Boolean(selectedBrand) && styles.filterChipActive]}
                onPress={() => {
                  haptics.selection();
                  setFilterModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    Boolean(selectedBrand) && styles.filterChipTextActive
                  ]}
                >
                  {selectedBrand || 'Brand'}
                </Text>
                <ChevronDown
                  size={14}
                  color={selectedBrand ? '#2563EB' : '#64748B'}
                  style={{ marginLeft: 4 }}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.filterChip}
                onPress={() => {
                  haptics.selection();
                  setFilterModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.filterChipText}>FSSAI</Text>
                <ChevronDown size={14} color="#64748B" style={{ marginLeft: 4 }} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, Boolean(selectedRating) && styles.filterChipActive]}
                onPress={() => {
                  haptics.selection();
                  setFilterModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    Boolean(selectedRating) && styles.filterChipTextActive
                  ]}
                >
                  {selectedRating || 'Rating'}
                </Text>
                <ChevronDown
                  size={14}
                  color={selectedRating ? '#2563EB' : '#64748B'}
                  style={{ marginLeft: 4 }}
                />
              </TouchableOpacity>
            </ScrollView>
          </View>

          <View style={styles.resultsInfoRow}>
            <View>
              <Text style={styles.resultsTitleText}>
                Showing results for "{activeQuery}"
              </Text>
              <Text style={styles.resultsCountText}>
                {searchResults.length} products
              </Text>
            </View>

            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => {
                haptics.selection();
                setSortModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <ArrowUpDown size={14} color="#0F172A" style={{ marginRight: 5 }} />
              <Text style={styles.sortButtonText}>Sort</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.contentFlex}
            contentContainerStyle={styles.gridContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {searchResults.length === 0 ? (
              <View style={styles.emptyStateWrap}>{catalogLoading ? <Text>Loading products...</Text> : catalogError ? <TouchableOpacity onPress={() => reloadCatalog()}><Text>Could not load the store. Tap to retry.</Text></TouchableOpacity> : null}
                <ShoppingBag size={48} color="#94A3B8" style={{ marginBottom: 12 }} />
                <Text style={styles.emptyTitle}>No matching products</Text>
                <Text style={styles.emptyDesc}>
                  We couldn't find any products matching "{activeQuery}". Try adjusting your filters or search keywords.
                </Text>
                <TouchableOpacity
                  style={styles.emptyResetBtn}
                  onPress={handleClearFilters}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyResetBtnText}>Reset Filters</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.productsGrid}>
                {searchResults.map(product => <View key={product._id} style={{ width: '48%' }}><ProductCard product={product} /></View>)}
              </View>
            )}
          </ScrollView>
        </View>
      ) : (
        <ScrollView
          style={styles.contentFlex}
          contentContainerStyle={styles.landingScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {recentSearches.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                <TouchableOpacity onPress={handleClearRecent} hitSlop={6}>
                  <Text style={styles.sectionActionLink}>Clear All</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.recentTagsWrap}>
                {recentSearches.map((term, idx) => (
                  <TouchableOpacity
                    key={idx.toString()}
                    style={styles.recentPill}
                    onPress={() => handleSelectSuggestion(term)}
                    activeOpacity={0.7}
                  >
                    <Clock size={13} color="#64748B" style={{ marginRight: 6 }} />
                    <Text style={styles.recentPillText}>{term}</Text>
                    {idx === 0 && (
                      <ChevronRight size={13} color="#94A3B8" style={{ marginLeft: 4 }} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Popular Right Now</Text>
              <TouchableOpacity
                onPress={() => handleSelectSuggestion('Chocolates')}
                hitSlop={6}
              >
                <Text style={styles.sectionActionLink}>See All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.popularGrid}>
              {POPULAR_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.popularCategoryCard}
                  onPress={() => handleSelectSuggestion(cat.name)}
                  activeOpacity={0.8}
                >
                  <View style={styles.popularImgWrap}>
                    <Image
                      source={{ uri: cat.image }}
                      style={styles.popularImg}
                      contentFit="cover"
                      transition={200}
                    />
                  </View>
                  <Text style={styles.popularLabel} numberOfLines={2}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      <Modal
        visible={filterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.backdropDismiss} onPress={() => setFilterModalVisible(false)} />
          <View style={styles.filterModalCard}>
            <View style={styles.modalDragHandle} />

            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={handleClearFilters} hitSlop={6}>
                <Text style={styles.modalClearLink}>Clear All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScrollBody}>
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupTitle}>Price Range</Text>
                <View style={styles.pillGroupWrap}>
                  {PRICE_FILTER_OPTIONS.map((range) => {
                    const isSelected = selectedPriceRange === range;
                    return (
                      <TouchableOpacity
                        key={range}
                        style={[styles.filterPill, isSelected && styles.filterPillSelected]}
                        onPress={() => {
                          haptics.selection();
                          setSelectedPriceRange(isSelected ? null : range);
                        }}
                      >
                        <Text
                          style={[
                            styles.filterPillText,
                            isSelected && styles.filterPillTextSelected
                          ]}
                        >
                          {range}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.filterGroup}>
                <View style={styles.filterGroupHeaderRow}>
                  <Text style={styles.filterGroupTitle}>Brands</Text>
                  <TouchableOpacity hitSlop={6}>
                    <Text style={styles.filterGroupActionLink}>View All</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.pillGroupWrap}>
                  {BRAND_FILTER_OPTIONS.map((brand) => {
                    const isSelected = selectedBrand === brand;
                    return (
                      <TouchableOpacity
                        key={brand}
                        style={[styles.filterPill, isSelected && styles.filterPillSelected]}
                        onPress={() => {
                          haptics.selection();
                          setSelectedBrand(isSelected ? null : brand);
                        }}
                      >
                        <Text
                          style={[
                            styles.filterPillText,
                            isSelected && styles.filterPillTextSelected
                          ]}
                        >
                          {brand}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupTitle}>Ratings</Text>
                <View style={styles.pillGroupWrap}>
                  {RATING_FILTER_OPTIONS.map((rating) => {
                    const isSelected = selectedRating === rating;
                    return (
                      <TouchableOpacity
                        key={rating}
                        style={[styles.filterPill, isSelected && styles.filterPillSelected]}
                        onPress={() => {
                          haptics.selection();
                          setSelectedRating(isSelected ? null : rating);
                        }}
                      >
                        <Text
                          style={[
                            styles.filterPillText,
                            isSelected && styles.filterPillTextSelected
                          ]}
                        >
                          {rating}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupTitle}>Availability</Text>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>In Stock Only</Text>
                  <Switch
                    value={inStockOnly}
                    onValueChange={(val) => {
                      haptics.selection();
                      setInStockOnly(val);
                    }}
                    trackColor={{ false: '#E2E8F0', true: '#2563EB' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalBottomBar}>
              <TouchableOpacity
                style={styles.applyFilterBtn}
                onPress={() => {
                  haptics.selection();
                  setFilterModalVisible(false);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.applyFilterBtnText}>
                  Apply Filters ({searchResults.length || 24})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={sortModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.backdropDismiss} onPress={() => setSortModalVisible(false)} />
          <View style={styles.sortModalCard}>
            <View style={styles.modalDragHandle} />
            <Text style={styles.sortModalTitle}>Sort Products</Text>
            {SORT_OPTIONS.map((opt) => {
              const isSelected = sortBy === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={styles.sortOptionRow}
                  onPress={() => {
                    haptics.selection();
                    setSortBy(opt.id);
                    setSortModalVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.sortOptionText, isSelected && styles.sortOptionTextSelected]}>
                    {opt.label}
                  </Text>
                  {isSelected && <Check size={18} color="#2563EB" strokeWidth={2.8} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  contentFlex: {
    flex: 1
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  backButton: {
    width: 28,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6
  },
  searchBarWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 42
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#0F172A',
    paddingVertical: 0
  },
  clearIconBtn: {
    padding: 2
  },
  clearIconCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center'
  },
  landingScrollContent: {
    paddingBottom: 40
  },
  sectionContainer: {
    paddingTop: 18,
    paddingHorizontal: 16
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A'
  },
  sectionActionLink: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: '#2563EB'
  },
  recentTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  recentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  recentPillText: {
    fontFamily: FONTS.medium,
    fontSize: 12.5,
    color: '#334155'
  },
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10
  },
  popularCategoryCard: {
    width: (SCREEN_WIDTH - 52) / 3,
    alignItems: 'center',
    marginBottom: 14
  },
  popularImgWrap: {
    width: (SCREEN_WIDTH - 52) / 3,
    height: (SCREEN_WIDTH - 52) / 3,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 8
  },
  popularImg: {
    width: '100%',
    height: '100%'
  },
  popularLabel: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 15
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC'
  },
  suggestionLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  suggestionText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: '#1E293B'
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative'
  },
  tabItemActive: {},
  tabItemText: {
    fontFamily: FONTS.medium,
    fontSize: 13.5,
    color: '#64748B'
  },
  tabItemTextActive: {
    fontFamily: FONTS.bold,
    fontWeight: '800',
    color: '#2563EB'
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 32,
    height: 2.5,
    backgroundColor: '#2563EB',
    borderRadius: 2
  },
  filterChipsBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  filterChipsScroll: {
    paddingHorizontal: 16,
    gap: 8
  },
  filterActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  filterActionButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB'
  },
  filterActionButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A'
  },
  filterActionButtonTextActive: {
    color: '#2563EB'
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  filterChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB'
  },
  filterChipText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: '#475569'
  },
  filterChipTextActive: {
    fontFamily: FONTS.bold,
    color: '#2563EB',
    fontWeight: '700'
  },
  resultsInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF'
  },
  resultsTitleText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A'
  },
  resultsCountText: {
    fontFamily: FONTS.regular,
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  sortButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A'
  },
  gridContentContainer: {
    paddingHorizontal: 14,
    paddingBottom: 80
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12
  },
  productGridCard: {
    width: (SCREEN_WIDTH - 40) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    position: 'relative'
  },
  wishlistIconBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center'
  },
  productImgContainer: {
    width: '100%',
    height: 105,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 8
  },
  productImg: {
    width: '90%',
    height: '90%'
  },
  productCardTitle: {
    fontFamily: FONTS.bold,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 16,
    minHeight: 32,
    marginBottom: 2
  },
  productCardUnit: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: '#64748B',
    marginBottom: 6
  },
  ratingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 8
  },
  ratingBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A'
  },
  ratingCountText: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: '#64748B',
    marginLeft: 2
  },
  ratingDivider: {
    color: '#CBD5E1',
    marginHorizontal: 4,
    fontSize: 10
  },
  deliveryBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B'
  },
  productCardBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 'auto'
  },
  priceCol: {},
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4
  },
  sellingPriceText: {
    fontFamily: FONTS.heavy,
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A'
  },
  mrpText: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through'
  },
  discountPctText: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    fontWeight: '800',
    color: '#16A34A',
    marginTop: 1
  },
  cardAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#2563EB',
    paddingHorizontal: 4,
    paddingVertical: 2
  },
  cardStepperBtn: {
    padding: 3
  },
  cardStepperQty: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
    minWidth: 16,
    textAlign: 'center'
  },
  emptyStateWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24
  },
  emptyTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6
  },
  emptyDesc: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16
  },
  emptyResetBtn: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  emptyResetBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: '#2563EB'
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end'
  },
  backdropDismiss: {
    flex: 1
  },
  filterModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    maxHeight: '85%'
  },
  modalDragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  modalTitle: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A'
  },
  modalClearLink: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: '#2563EB'
  },
  modalScrollBody: {
    paddingHorizontal: 20,
    paddingVertical: 14
  },
  filterGroup: {
    marginBottom: 20
  },
  filterGroupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  filterGroupTitle: {
    fontFamily: FONTS.bold,
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10
  },
  filterGroupActionLink: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: '#2563EB'
  },
  pillGroupWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  filterPill: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  filterPillSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB'
  },
  filterPillText: {
    fontFamily: FONTS.medium,
    fontSize: 12.5,
    color: '#334155'
  },
  filterPillTextSelected: {
    fontFamily: FONTS.bold,
    color: '#2563EB',
    fontWeight: '700'
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  switchLabel: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: '#1E293B'
  },
  modalBottomBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  applyFilterBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  applyFilterBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  sortModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20
  },
  sortModalTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14
  },
  sortOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC'
  },
  sortOptionText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: '#334155'
  },
  sortOptionTextSelected: {
    fontFamily: FONTS.bold,
    color: '#2563EB',
    fontWeight: '800'
  }
});
