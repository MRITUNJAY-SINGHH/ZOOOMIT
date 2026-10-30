import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  useWindowDimensions
} from 'react-native';
import {
  SlidersHorizontal,
  TrendingDown,
  ChevronDown,
  X,
  Check,
  ArrowUpDown,
  CircleDollarSign,
  Tag,
  Leaf,
  Boxes,
  Sparkles,
  RotateCcw
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { colors, typography } from '../../constants/theme';
import { haptics } from '../../services/haptics';

export const SORT_OPTIONS = [
  { label: 'Popularity', value: 'popular', subtitle: 'Default relevance and top sellers' },
  { label: 'Price: Low to High', value: 'price_asc', subtitle: 'Affordable and budget-friendly items' },
  { label: 'Price: High to Low', value: 'price_desc', subtitle: 'Premium quality and larger packs' },
  { label: 'Discount: High to Low', value: 'discount_desc', subtitle: 'Biggest savings and best deals' }
];

export const PRICE_RANGE_OPTIONS = [
  { label: 'All Prices', value: null },
  { label: 'Under ₹50', value: 'under_50' },
  { label: '₹50 - ₹100', value: '50_100' },
  { label: '₹100 - ₹200', value: '100_200' },
  { label: 'Above ₹200', value: 'above_200' }
];

export const TYPE_OPTIONS = [
  { label: 'All Types', value: 'ALL', subtitle: 'Show all grocery items' },
  { label: 'Farm Fresh', value: 'FARM_FRESH', subtitle: 'Directly sourced fresh daily harvest' },
  { label: 'Organic', value: 'ORGANIC', subtitle: '100% certified organic produce' },
  { label: 'Hydroponic', value: 'HYDROPONIC', subtitle: 'Soil-free clean mineral-grown' },
  { label: 'Vegetarian Only', value: 'VEG', subtitle: 'Exclusively vegetarian products' }
];

const FILTER_TABS = [
  { key: 'price', label: 'Price', Icon: CircleDollarSign },
  { key: 'brand', label: 'Brand', Icon: Tag },
  { key: 'dietary', label: 'Dietary', Icon: Leaf },
  { key: 'stock', label: 'Availability', Icon: Boxes },
  { key: 'type', label: 'Type', Icon: Sparkles },
  { key: 'sort', label: 'Sort By', Icon: ArrowUpDown }
];

export const CategoryFilterBar = ({
  activeSort = 'popular',
  onSortChange,
  priceDropOnly = false,
  onTogglePriceDrop,
  selectedPriceRange = null,
  onPriceRangeChange,
  isVegOnly = false,
  onToggleVeg,
  inStockOnly = false,
  onToggleInStock,
  selectedBrand = null,
  onBrandChange,
  availableBrands = [],
  selectedType = 'ALL',
  onTypeChange,
  onResetFilters,
  totalProductsCount = 0,
  style
}) => {
  const { height } = useWindowDimensions();

  // Modal visibility states
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('price');

  // Animation values for Quick Sort
  const sortAnim = useRef(new Animated.Value(0)).current;
  // Animation values for Full Filter Sheet
  const filterAnim = useRef(new Animated.Value(0)).current;

  // Count active filters (excluding default sort)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (activeSort !== 'popular') count++;
    if (priceDropOnly) count++;
    if (selectedPriceRange) count++;
    if (isVegOnly) count++;
    if (inStockOnly) count++;
    if (selectedBrand) count++;
    if (selectedType && selectedType !== 'ALL') count++;
    return count;
  }, [activeSort, priceDropOnly, selectedPriceRange, isVegOnly, inStockOnly, selectedBrand, selectedType]);

  const hasActiveFilters = activeFiltersCount > 0;

  // Open Quick Sort Modal
  const openSortModal = () => {
    haptics.selection();
    setSortModalVisible(true);
    Animated.timing(sortAnim, {
      toValue: 1,
      duration: 220,
      easing: Easing.bezier(0.2, 0.9, 0.3, 1),
      useNativeDriver: true
    }).start();
  };

  const closeSortModal = () => {
    haptics.selection();
    Animated.timing(sortAnim, {
      toValue: 0,
      duration: 160,
      easing: Easing.bezier(0.3, 0, 0.8, 0.15),
      useNativeDriver: true
    }).start(() => setSortModalVisible(false));
  };

  // Open Full Filter Modal
  const openFilterModal = (tab = 'price') => {
    haptics.selection();
    setActiveTab(tab);
    setFilterModalVisible(true);
    Animated.timing(filterAnim, {
      toValue: 1,
      duration: 240,
      easing: Easing.bezier(0.2, 0.9, 0.3, 1),
      useNativeDriver: true
    }).start();
  };

  const closeFilterModal = () => {
    haptics.selection();
    Animated.timing(filterAnim, {
      toValue: 0,
      duration: 170,
      easing: Easing.bezier(0.3, 0, 0.8, 0.15),
      useNativeDriver: true
    }).start(() => setFilterModalVisible(false));
  };

  const handleSelectSort = (val) => {
    haptics.selection();
    onSortChange?.(val);
    setTimeout(() => {
      closeSortModal();
    }, 120);
  };

  const currentSortLabel = useMemo(() => {
    const found = SORT_OPTIONS.find((s) => s.value === activeSort);
    return found ? found.label : 'Sort By';
  }, [activeSort]);

  // Interpolations
  const sortTranslateY = sortAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [350, 0]
  });
  const sortBackdropOpacity = sortAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  const filterTranslateY = filterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [550, 0]
  });
  const filterBackdropOpacity = filterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  return (
    <>
      {/* ============================================================ */}
      {/* 1. HORIZONTAL FILTER & SORT PILLS BAR (CLEAN QUICK-COMMERCE) */}
      {/* ============================================================ */}
      <View style={[styles.barRoot, style]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.barScrollContent}
        >
          {/* Main Filter Button (Icon + Active Count Badge) */}
          <TouchableOpacity
            style={[
              styles.filterIconBtn,
              hasActiveFilters && styles.filterIconBtnActive
            ]}
            onPress={() => openFilterModal('price')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Open all filters"
          >
            <SlidersHorizontal
              size={15}
              color={hasActiveFilters ? '#111827' : '#4B5563'}
              strokeWidth={2.4}
            />
            {hasActiveFilters && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Quick Sort Pill */}
          <TouchableOpacity
            style={[
              styles.pill,
              activeSort !== 'popular' && styles.pillActive
            ]}
            onPress={openSortModal}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.pillText,
                activeSort !== 'popular' && styles.pillTextActive
              ]}
              numberOfLines={1}
            >
              {activeSort !== 'popular' ? currentSortLabel : 'Sort By'}
            </Text>
            <ChevronDown
              size={13}
              color={activeSort !== 'popular' ? '#111827' : '#6B7280'}
              strokeWidth={2.2}
            />
          </TouchableOpacity>

          {/* Price Drop Deals Pill */}
          <TouchableOpacity
            style={[
              styles.pill,
              priceDropOnly && styles.pillActive
            ]}
            onPress={() => {
              haptics.selection();
              onTogglePriceDrop?.();
            }}
            activeOpacity={0.8}
          >
            <TrendingDown size={14} color="#DC2626" strokeWidth={2.4} />
            <Text style={[styles.pillText, priceDropOnly && styles.pillTextActive]}>
              Price Drop
            </Text>
          </TouchableOpacity>

          {/* Brand Filter Pill */}
          <TouchableOpacity
            style={[
              styles.pill,
              Boolean(selectedBrand) && styles.pillActive
            ]}
            onPress={() => openFilterModal('brand')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.pillText,
                Boolean(selectedBrand) && styles.pillTextActive
              ]}
              numberOfLines={1}
            >
              {selectedBrand || 'Brand'}
            </Text>
            <ChevronDown
              size={13}
              color={selectedBrand ? '#111827' : '#6B7280'}
              strokeWidth={2.2}
            />
          </TouchableOpacity>

          {/* In Stock Availability Pill */}
          <TouchableOpacity
            style={[
              styles.pill,
              inStockOnly && styles.pillActive
            ]}
            onPress={() => {
              haptics.selection();
              onToggleInStock?.();
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillText, inStockOnly && styles.pillTextActive]}>
              In Stock
            </Text>
          </TouchableOpacity>

          {/* Dietary (Veg Only) Pill */}
          <TouchableOpacity
            style={[
              styles.pill,
              isVegOnly && styles.pillVegActive
            ]}
            onPress={() => {
              haptics.selection();
              onToggleVeg?.();
            }}
            activeOpacity={0.8}
          >
            <View style={styles.vegMark}>
              <View style={styles.vegDot} />
            </View>
            <Text style={[styles.pillText, isVegOnly && styles.pillVegTextActive]}>
              Veg Only
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ============================================================ */}
      {/* 2. DEDICATED QUICK SORT BOTTOM SHEET                         */}
      {/* ============================================================ */}
      <Modal
        visible={sortModalVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeSortModal}
      >
        <View style={styles.modalOverlay}>
          {/* Blurred Dimmed Backdrop */}
          <Animated.View
            style={[StyleSheet.absoluteFill, { opacity: sortBackdropOpacity }]}
            pointerEvents="none"
          >
            <BlurView
              intensity={Platform.OS === 'ios' ? 50 : 35}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.62)' }]} />
          </Animated.View>

          <Pressable style={styles.outsideTapArea} onPress={closeSortModal} />

          {/* Bottom Sheet Card */}
          <Animated.View
            style={[
              styles.sortSheetContainer,
              { transform: [{ translateY: sortTranslateY }] }
            ]}
          >
            {/* Grabber Handle */}
            <View style={styles.sheetHandleWrap}>
              <View style={styles.sheetHandle} />
            </View>

            {/* Header */}
            <View style={styles.sortHeader}>
              <Text style={styles.sheetMainTitle}>Sort By</Text>
              <TouchableOpacity
                style={styles.sheetCloseBtn}
                onPress={closeSortModal}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close sort"
              >
                <X size={18} color="#111827" strokeWidth={2.4} />
              </TouchableOpacity>
            </View>

            {/* Sort Options List */}
            <View style={styles.sortList}>
              {SORT_OPTIONS.map((opt) => {
                const isSelected = activeSort === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.sortOptionCard,
                      isSelected && styles.sortOptionCardSelected
                    ]}
                    onPress={() => handleSelectSort(opt.value)}
                    activeOpacity={0.75}
                  >
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text
                        style={[
                          styles.sortOptionLabel,
                          isSelected && styles.sortOptionLabelSelected
                        ]}
                      >
                        {opt.label}
                      </Text>
                      <Text style={styles.sortOptionSub}>{opt.subtitle}</Text>
                    </View>

                    <View
                      style={[
                        styles.radioCircle,
                        isSelected && styles.radioCircleSelected
                      ]}
                    >
                      {isSelected && <Check size={12} color="#111827" strokeWidth={3.4} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* ============================================================ */}
      {/* 3. COMPREHENSIVE FILTER SIDEBAR SHEET (SPLIT VIEW)           */}
      {/* ============================================================ */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeFilterModal}
      >
        <View style={styles.modalOverlay}>
          {/* Blurred Dimmed Backdrop */}
          <Animated.View
            style={[StyleSheet.absoluteFill, { opacity: filterBackdropOpacity }]}
            pointerEvents="none"
          >
            <BlurView
              intensity={Platform.OS === 'ios' ? 50 : 35}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.62)' }]} />
          </Animated.View>

          <Pressable style={styles.outsideTapArea} onPress={closeFilterModal} />

          {/* Filter Sheet Container */}
          <Animated.View
            style={[
              styles.filterSheetContainer,
              {
                height: Math.min(height * 0.78, 620),
                transform: [{ translateY: filterTranslateY }]
              }
            ]}
          >
            {/* Grabber Handle */}
            <View style={styles.sheetHandleWrap}>
              <View style={styles.sheetHandle} />
            </View>

            {/* Header */}
            <View style={styles.filterHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.sheetMainTitle}>Filters</Text>
                {hasActiveFilters && (
                  <View style={styles.activePill}>
                    <Text style={styles.activePillText}>{activeFiltersCount} applied</Text>
                  </View>
                )}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {hasActiveFilters && (
                  <TouchableOpacity
                    onPress={() => {
                      haptics.light();
                      onResetFilters?.();
                    }}
                    hitSlop={8}
                  >
                    <Text style={styles.resetText}>Reset All</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.sheetCloseBtn}
                  onPress={closeFilterModal}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Close filters"
                >
                  <X size={18} color="#111827" strokeWidth={2.4} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Split Content: Left Sidebar Tabs + Right Options */}
            <View style={styles.splitBody}>
              {/* Left Tabs Column */}
              <View style={styles.leftColumn}>
                {FILTER_TABS.map((tab) => {
                  const isActive = activeTab === tab.key;
                  const Icon = tab.Icon;

                  // Active filter dot indicator check
                  let hasFilterActive = false;
                  if (tab.key === 'sort' && activeSort !== 'popular') hasFilterActive = true;
                  if (tab.key === 'price' && (selectedPriceRange || priceDropOnly)) hasFilterActive = true;
                  if (tab.key === 'brand' && selectedBrand) hasFilterActive = true;
                  if (tab.key === 'dietary' && isVegOnly) hasFilterActive = true;
                  if (tab.key === 'stock' && inStockOnly) hasFilterActive = true;
                  if (tab.key === 'type' && selectedType !== 'ALL') hasFilterActive = true;

                  return (
                    <TouchableOpacity
                      key={tab.key}
                      style={[
                        styles.leftTabBtn,
                        isActive && styles.leftTabBtnActive
                      ]}
                      onPress={() => {
                        haptics.selection();
                        setActiveTab(tab.key);
                      }}
                      activeOpacity={0.8}
                    >
                      {isActive && <View style={styles.activeTabAccentBar} />}
                      <View style={styles.tabIconWrap}>
                        <Icon
                          size={16}
                          color={isActive ? '#111827' : '#6B7280'}
                          strokeWidth={isActive ? 2.4 : 1.8}
                        />
                        {hasFilterActive && <View style={styles.tabActiveDot} />}
                      </View>
                      <Text
                        style={[
                          styles.tabTitleText,
                          isActive && styles.tabTitleTextActive
                        ]}
                        numberOfLines={1}
                      >
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Right Options Column */}
              <ScrollView
                style={styles.rightColumn}
                contentContainerStyle={styles.rightScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* 1. Price Range Tab */}
                {activeTab === 'price' && (
                  <View style={styles.panelSection}>
                    <Text style={styles.panelHeading}>Price Range</Text>
                    <View style={styles.optionsList}>
                      {PRICE_RANGE_OPTIONS.map((opt) => {
                        const isSelected = selectedPriceRange === opt.value;
                        return (
                          <TouchableOpacity
                            key={String(opt.value)}
                            style={[
                              styles.filterOptionCard,
                              isSelected && styles.filterOptionCardSelected
                            ]}
                            onPress={() => {
                              haptics.selection();
                              onPriceRangeChange?.(opt.value);
                            }}
                            activeOpacity={0.75}
                          >
                            <Text
                              style={[
                                styles.optionLabel,
                                isSelected && styles.optionLabelSelected
                              ]}
                            >
                              {opt.label}
                            </Text>
                            <View
                              style={[
                                styles.radioCircle,
                                isSelected && styles.radioCircleSelected
                              ]}
                            >
                              {isSelected && <Check size={12} color="#111827" strokeWidth={3.4} />}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Price Drop Deals Card */}
                    <View style={styles.subCardWrap}>
                      <TouchableOpacity
                        style={[
                          styles.toggleCard,
                          priceDropOnly && styles.toggleCardActive
                        ]}
                        onPress={() => {
                          haptics.selection();
                          onTogglePriceDrop?.();
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                          <TrendingDown size={18} color="#DC2626" strokeWidth={2.4} />
                          <View>
                            <Text style={styles.toggleCardTitle}>Price Drop Only</Text>
                            <Text style={styles.toggleCardSub}>Items with active discounts</Text>
                          </View>
                        </View>
                        <View
                          style={[
                            styles.checkboxBox,
                            priceDropOnly && styles.checkboxBoxActive
                          ]}
                        >
                          {priceDropOnly && <Check size={12} color="#111827" strokeWidth={3.4} />}
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* 2. Brand Tab */}
                {activeTab === 'brand' && (
                  <View style={styles.panelSection}>
                    <Text style={styles.panelHeading}>Select Brand</Text>
                    <View style={styles.optionsList}>
                      {/* All Brands option */}
                      <TouchableOpacity
                        style={[
                          styles.filterOptionCard,
                          !selectedBrand && styles.filterOptionCardSelected
                        ]}
                        onPress={() => {
                          haptics.selection();
                          onBrandChange?.(null);
                        }}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.optionLabel,
                            !selectedBrand && styles.optionLabelSelected
                          ]}
                        >
                          All Brands
                        </Text>
                        <View
                          style={[
                            styles.radioCircle,
                            !selectedBrand && styles.radioCircleSelected
                          ]}
                        >
                          {!selectedBrand && <Check size={12} color="#111827" strokeWidth={3.4} />}
                        </View>
                      </TouchableOpacity>

                      {/* Brand List */}
                      {availableBrands.map((b) => {
                        const isSelected = selectedBrand === b;
                        return (
                          <TouchableOpacity
                            key={b}
                            style={[
                              styles.filterOptionCard,
                              isSelected && styles.filterOptionCardSelected
                            ]}
                            onPress={() => {
                              haptics.selection();
                              onBrandChange?.(b);
                            }}
                            activeOpacity={0.75}
                          >
                            <Text
                              style={[
                                styles.optionLabel,
                                isSelected && styles.optionLabelSelected
                              ]}
                            >
                              {b}
                            </Text>
                            <View
                              style={[
                                styles.radioCircle,
                                isSelected && styles.radioCircleSelected
                              ]}
                            >
                              {isSelected && <Check size={12} color="#111827" strokeWidth={3.4} />}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* 3. Dietary Tab */}
                {activeTab === 'dietary' && (
                  <View style={styles.panelSection}>
                    <Text style={styles.panelHeading}>Dietary Preferences</Text>
                    <TouchableOpacity
                      style={[
                        styles.toggleCard,
                        isVegOnly && styles.toggleCardActive
                      ]}
                      onPress={() => {
                        haptics.selection();
                        onToggleVeg?.();
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                        <View style={styles.vegMarkLarge}>
                          <View style={styles.vegDotLarge} />
                        </View>
                        <View>
                          <Text style={styles.toggleCardTitle}>Vegetarian Only</Text>
                          <Text style={styles.toggleCardSub}>Exclude non-veg products</Text>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.checkboxBox,
                          isVegOnly && styles.checkboxBoxActive
                        ]}
                      >
                        {isVegOnly && <Check size={12} color="#111827" strokeWidth={3.4} />}
                      </View>
                    </TouchableOpacity>
                  </View>
                )}

                {/* 4. Availability Tab */}
                {activeTab === 'stock' && (
                  <View style={styles.panelSection}>
                    <Text style={styles.panelHeading}>Availability</Text>
                    <TouchableOpacity
                      style={[
                        styles.toggleCard,
                        inStockOnly && styles.toggleCardActive
                      ]}
                      onPress={() => {
                        haptics.selection();
                        onToggleInStock?.();
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                        <Boxes size={20} color="#111827" strokeWidth={2.2} />
                        <View>
                          <Text style={styles.toggleCardTitle}>In Stock Only</Text>
                          <Text style={styles.toggleCardSub}>Hide items out of stock</Text>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.checkboxBox,
                          inStockOnly && styles.checkboxBoxActive
                        ]}
                      >
                        {inStockOnly && <Check size={12} color="#111827" strokeWidth={3.4} />}
                      </View>
                    </TouchableOpacity>
                  </View>
                )}

                {/* 5. Product Type Tab */}
                {activeTab === 'type' && (
                  <View style={styles.panelSection}>
                    <Text style={styles.panelHeading}>Product Category Type</Text>
                    <View style={styles.optionsList}>
                      {TYPE_OPTIONS.map((opt) => {
                        const isSelected = selectedType === opt.value;
                        return (
                          <TouchableOpacity
                            key={opt.value}
                            style={[
                              styles.filterOptionCard,
                              isSelected && styles.filterOptionCardSelected
                            ]}
                            onPress={() => {
                              haptics.selection();
                              onTypeChange?.(opt.value);
                            }}
                            activeOpacity={0.75}
                          >
                            <View style={{ flex: 1, marginRight: 10 }}>
                              <Text
                                style={[
                                  styles.optionLabel,
                                  isSelected && styles.optionLabelSelected
                                ]}
                              >
                                {opt.label}
                              </Text>
                              {opt.subtitle ? (
                                <Text style={styles.optionSubText}>{opt.subtitle}</Text>
                              ) : null}
                            </View>
                            <View
                              style={[
                                styles.radioCircle,
                                isSelected && styles.radioCircleSelected
                              ]}
                            >
                              {isSelected && <Check size={12} color="#111827" strokeWidth={3.4} />}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* 6. Sort By Tab */}
                {activeTab === 'sort' && (
                  <View style={styles.panelSection}>
                    <Text style={styles.panelHeading}>Sort Products</Text>
                    <View style={styles.optionsList}>
                      {SORT_OPTIONS.map((opt) => {
                        const isSelected = activeSort === opt.value;
                        return (
                          <TouchableOpacity
                            key={opt.value}
                            style={[
                              styles.filterOptionCard,
                              isSelected && styles.filterOptionCardSelected
                            ]}
                            onPress={() => {
                              haptics.selection();
                              onSortChange?.(opt.value);
                            }}
                            activeOpacity={0.75}
                          >
                            <View style={{ flex: 1, marginRight: 10 }}>
                              <Text
                                style={[
                                  styles.optionLabel,
                                  isSelected && styles.optionLabelSelected
                                ]}
                              >
                                {opt.label}
                              </Text>
                              <Text style={styles.optionSubText}>{opt.subtitle}</Text>
                            </View>
                            <View
                              style={[
                                styles.radioCircle,
                                isSelected && styles.radioCircleSelected
                              ]}
                            >
                              {isSelected && <Check size={12} color="#111827" strokeWidth={3.4} />}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </ScrollView>
            </View>

            {/* Sticky Bottom Actions Bar */}
            <View style={styles.filterFooter}>
              <TouchableOpacity
                style={styles.footerResetBtn}
                onPress={() => {
                  haptics.light();
                  onResetFilters?.();
                }}
                activeOpacity={0.7}
              >
                <RotateCcw size={15} color="#4B5563" strokeWidth={2.2} />
                <Text style={styles.footerResetText}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.footerApplyBtn}
                onPress={closeFilterModal}
                activeOpacity={0.88}
              >
                <Text style={styles.footerApplyText}>
                  Apply Filters {totalProductsCount > 0 ? `(${totalProductsCount})` : ''}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

const F = typography.family;

const styles = StyleSheet.create({
  // 1. Top Bar & Pills
  barRoot: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 9
  },
  barScrollContent: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center'
  },
  filterIconBtn: {
    width: 36,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  filterIconBtnActive: {
    borderColor: '#FEDC4A',
    backgroundColor: '#FFFDF0'
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#FEDC4A',
    alignItems: 'center',
    justifyContent: 'center'
  },
  filterBadgeText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#111827'
  },
  pill: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  pillActive: {
    borderColor: '#FEDC4A',
    backgroundColor: '#FFFDF0'
  },
  pillText: {
    fontFamily: F.medium,
    fontSize: 12.5,
    color: '#374151'
  },
  pillTextActive: {
    fontFamily: F.bold,
    color: '#111827'
  },
  pillVegActive: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4'
  },
  pillVegTextActive: {
    fontFamily: F.bold,
    color: '#16A34A'
  },
  vegMark: {
    width: 13,
    height: 13,
    borderRadius: 3,
    borderWidth: 1.4,
    borderColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center'
  },
  vegDot: {
    width: 5.5,
    height: 5.5,
    borderRadius: 3,
    backgroundColor: '#16A34A'
  },
  vegMarkLarge: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.8,
    borderColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center'
  },
  vegDotLarge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A'
  },

  // Modal Overlays
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent'
  },
  outsideTapArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1
  },

  // 2. Dedicated Quick Sort Sheet
  sortSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 24,
    zIndex: 2,
    elevation: 20
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingVertical: 10
  },
  sheetHandle: {
    width: 44,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: '#D1D5DB'
  },
  sortHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  sheetMainTitle: {
    fontFamily: F.bold,
    fontSize: 17,
    color: '#111827'
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sortList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10
  },
  sortOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  sortOptionCardSelected: {
    borderColor: '#FEDC4A',
    backgroundColor: '#FFFDF0'
  },
  sortOptionLabel: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#111827',
    marginBottom: 2
  },
  sortOptionLabelSelected: {
    color: '#111827'
  },
  sortOptionSub: {
    fontFamily: F.regular,
    fontSize: 11.5,
    color: '#6B7280'
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  radioCircleSelected: {
    borderColor: '#FEDC4A',
    backgroundColor: '#FEDC4A'
  },

  // 3. Comprehensive Filter Sidebar Sheet
  filterSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    overflow: 'hidden',
    zIndex: 2,
    elevation: 20
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  activePill: {
    backgroundColor: '#FEDC4A',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8
  },
  activePillText: {
    fontFamily: F.bold,
    fontSize: 10.5,
    color: '#111827'
  },
  resetText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#D97706'
  },
  splitBody: {
    flex: 1,
    flexDirection: 'row'
  },
  leftColumn: {
    width: 120,
    backgroundColor: '#F9FAFB',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    paddingVertical: 6
  },
  leftTabBtn: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    position: 'relative'
  },
  leftTabBtnActive: {
    backgroundColor: '#FFFFFF'
  },
  activeTabAccentBar: {
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 6,
    width: 3.5,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: '#FEDC4A'
  },
  tabIconWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  tabActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FEDC4A'
  },
  tabTitleText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: '#6B7280'
  },
  tabTitleTextActive: {
    fontFamily: F.bold,
    color: '#111827'
  },
  rightColumn: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  rightScrollContent: {
    padding: 16
  },
  panelSection: {
    gap: 12
  },
  panelHeading: {
    fontFamily: F.bold,
    fontSize: 14.5,
    color: '#111827',
    marginBottom: 2
  },
  optionsList: {
    gap: 8
  },
  filterOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 13,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  filterOptionCardSelected: {
    borderColor: '#FEDC4A',
    backgroundColor: '#FFFDF0'
  },
  optionLabel: {
    fontFamily: F.medium,
    fontSize: 13.5,
    color: '#374151'
  },
  optionLabelSelected: {
    fontFamily: F.bold,
    color: '#111827'
  },
  optionSubText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2
  },
  subCardWrap: {
    marginTop: 8
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  toggleCardActive: {
    borderColor: '#FEDC4A',
    backgroundColor: '#FFFDF0'
  },
  toggleCardTitle: {
    fontFamily: F.bold,
    fontSize: 13.5,
    color: '#111827'
  },
  toggleCardSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkboxBoxActive: {
    borderColor: '#FEDC4A',
    backgroundColor: '#FEDC4A'
  },

  // Footer Actions
  filterFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF'
  },
  footerResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB'
  },
  footerResetText: {
    fontFamily: F.bold,
    fontSize: 13.5,
    color: '#374151'
  },
  footerApplyBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FEDC4A',
    alignItems: 'center',
    justifyContent: 'center'
  },
  footerApplyText: {
    fontFamily: F.bold,
    fontSize: 14.5,
    color: '#111827'
  }
});
