import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  Modal, 
  TouchableOpacity 
} from 'react-native';
import { SlidersHorizontal, TrendingDown, ChevronDown, X, Check } from 'lucide-react-native';
import { colors, typography } from '../../constants/theme';
import { haptics } from '../../services/haptics';

export const SORT_OPTIONS = [
  { label: 'Popularity', value: 'popular' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Discount: High to Low', value: 'discount_desc' }
];

export const TYPE_OPTIONS = [
  { label: 'All Types', value: 'ALL' },
  { label: 'Vegetarian Only', value: 'VEG' },
  { label: 'Organic', value: 'ORGANIC' },
  { label: 'Hydroponic', value: 'HYDROPONIC' },
  { label: 'Farm Fresh', value: 'FARM_FRESH' }
];

export const CategoryFilterBar = ({
  activeSort = 'popular',
  priceDropOnly = false,
  onTogglePriceDrop,
  onSortChange,
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
  style
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('filter'); // 'filter' | 'sort' | 'brand' | 'type'

  const hasActiveFilters = priceDropOnly || isVegOnly || inStockOnly || activeSort !== 'popular' || Boolean(selectedBrand) || (selectedType && selectedType !== 'ALL');

  const handleOpenFilter = () => {
    haptics.selection();
    setModalMode('filter');
    setModalVisible(true);
  };

  const handleOpenSort = () => {
    haptics.selection();
    setModalMode('sort');
    setModalVisible(true);
  };

  const handleOpenBrand = () => {
    haptics.selection();
    setModalMode('brand');
    setModalVisible(true);
  };

  const handleOpenType = () => {
    haptics.selection();
    setModalMode('type');
    setModalVisible(true);
  };

  const currentSortLabel = SORT_OPTIONS.find(s => s.value === activeSort)?.label || 'Sort By';
  const currentTypeLabel = TYPE_OPTIONS.find(t => t.value === selectedType)?.label || 'Type';

  return (
    <>
      <View style={[styles.container, style]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* 1. Filter Pill (Screen 1) */}
          <Pressable
            onPress={handleOpenFilter}
            style={({ pressed }) => [
              styles.pill,
              (isVegOnly || inStockOnly) && styles.pillActive,
              pressed && styles.pillPressed
            ]}
          >
            <SlidersHorizontal 
              size={18} 
              color={(isVegOnly || inStockOnly) ? '#111111' : '#4B5563'} 
              style={{ marginRight: 5 }} 
            />
            {(isVegOnly || inStockOnly) && (
              <View style={styles.activeDot} />
            )}
          </Pressable>

          {/* 2. Sort By Pill (Screen 1) */}
          <Pressable
            onPress={handleOpenSort}
            style={({ pressed }) => [
              styles.pill,
              activeSort !== 'popular' && styles.pillActive,
              pressed && styles.pillPressed
            ]}
          >
            <Text 
              style={[
                styles.pillText,
                activeSort !== 'popular' && styles.pillTextActive
              ]}
            >
              {activeSort !== 'popular' ? currentSortLabel : 'Sort By'}
            </Text>
            <ChevronDown 
              size={13} 
              color={activeSort !== 'popular' ? '#111111' : '#6B7280'} 
              style={{ marginLeft: 4 }} 
            />
          </Pressable>

          <Pressable onPress={onTogglePriceDrop} style={[styles.pill, priceDropOnly && styles.pillActive]} accessibilityLabel="Price drop products" accessibilityState={{ selected: priceDropOnly }}><TrendingDown size={15} color="#D94048" style={{ marginRight: 5 }} /><Text style={styles.pillText}>Price Drop</Text></Pressable>

          {/* 3. Brand Pill (Screen 1) */}
          <Pressable
            onPress={handleOpenBrand}
            style={({ pressed }) => [
              styles.pill,
              Boolean(selectedBrand) && styles.pillActive,
              pressed && styles.pillPressed
            ]}
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
              color={Boolean(selectedBrand) ? '#111111' : '#6B7280'} 
              style={{ marginLeft: 4 }} 
            />
          </Pressable>

          {/* 4. Type Pill (Screen 1) */}
          <Pressable
            onPress={handleOpenType}
            style={({ pressed }) => [
              styles.pill,
              ((selectedType && selectedType !== 'ALL') || isVegOnly) && styles.pillActive,
              pressed && styles.pillPressed
            ]}
          >
            <Text 
              style={[
                styles.pillText,
                ((selectedType && selectedType !== 'ALL') || isVegOnly) && styles.pillTextActive
              ]}
            >
              {selectedType && selectedType !== 'ALL' ? currentTypeLabel : (isVegOnly ? 'Veg Only' : 'Type')}
            </Text>
            <ChevronDown 
              size={13} 
              color={((selectedType && selectedType !== 'ALL') || isVegOnly) ? '#111111' : '#6B7280'} 
              style={{ marginLeft: 4 }} 
            />
          </Pressable>
        </ScrollView>
      </View>

      {/* Filter / Sort / Brand / Type Bottom Sheet Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable 
            style={styles.modalBackdrop} 
            onPress={() => setModalVisible(false)} 
          />
          <View style={styles.modalSheet}>
            {/* Header */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {modalMode === 'sort' && 'Sort Products'}
                {modalMode === 'filter' && 'Filter Products'}
                {modalMode === 'brand' && 'Select Brand'}
                {modalMode === 'type' && 'Product Type'}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.closeBtn}
              >
                <X size={20} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Sort Modal */}
            {modalMode === 'sort' && (
              <View style={styles.optionsList}>
                {SORT_OPTIONS.map((opt) => {
                  const isSelected = activeSort === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.optionRow,
                        isSelected && styles.optionRowSelected
                      ]}
                      onPress={() => {
                        haptics.selection();
                        onSortChange && onSortChange(opt.value);
                        setModalVisible(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected
                        ]}
                      >
                        {opt.label}
                      </Text>
                      {isSelected && (
                        <Check size={18} color="#111111" strokeWidth={2.5} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Filter Modal */}
            {modalMode === 'filter' && (
              <View style={styles.filterOptionsList}>
                <TouchableOpacity
                  style={styles.filterRow}
                  onPress={() => {
                    haptics.selection();
                    onToggleVeg && onToggleVeg();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.vegIconSquare}>
                      <View style={styles.vegIconCircle} />
                    </View>
                    <Text style={styles.filterLabel}>Vegetarian Items Only</Text>
                  </View>
                  <View style={[styles.checkbox, isVegOnly && styles.checkboxActive]}>
                    {isVegOnly && <Check size={14} color="#111111" strokeWidth={3} />}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.filterRow}
                  onPress={() => {
                    haptics.selection();
                    onToggleInStock && onToggleInStock();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.filterLabel}>In Stock Products Only</Text>
                  <View style={[styles.checkbox, inStockOnly && styles.checkboxActive]}>
                    {inStockOnly && <Check size={14} color="#111111" strokeWidth={3} />}
                  </View>
                </TouchableOpacity>

                <View style={styles.sheetActionRow}>
                  <TouchableOpacity
                    style={styles.clearBtn}
                    onPress={() => {
                      haptics.light();
                      onResetFilters && onResetFilters();
                      setModalVisible(false);
                    }}
                  >
                    <Text style={styles.clearBtnText}>Clear All</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.applyBtn}
                    onPress={() => {
                      haptics.medium();
                      setModalVisible(false);
                    }}
                  >
                    <Text style={styles.applyBtnText}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Brand Modal */}
            {modalMode === 'brand' && (
              <View style={styles.optionsList}>
                <TouchableOpacity
                  style={[
                    styles.optionRow,
                    !selectedBrand && styles.optionRowSelected
                  ]}
                  onPress={() => {
                    haptics.selection();
                    onBrandChange && onBrandChange(null);
                    setModalVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionText, !selectedBrand && styles.optionTextSelected]}>
                    All Brands
                  </Text>
                  {!selectedBrand && <Check size={18} color="#111111" strokeWidth={2.5} />}
                </TouchableOpacity>

                {(availableBrands.length > 0 ? availableBrands : ['Kuiklo Fresh', 'Organic Tattva', 'Fresho', 'Safal']).map((b) => {
                  const isSelected = selectedBrand === b;
                  return (
                    <TouchableOpacity
                      key={b}
                      style={[
                        styles.optionRow,
                        isSelected && styles.optionRowSelected
                      ]}
                      onPress={() => {
                        haptics.selection();
                        onBrandChange && onBrandChange(b);
                        setModalVisible(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                        {b}
                      </Text>
                      {isSelected && <Check size={18} color="#111111" strokeWidth={2.5} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Type Modal */}
            {modalMode === 'type' && (
              <View style={styles.optionsList}>
                {TYPE_OPTIONS.map((t) => {
                  const isSelected = (selectedType || 'ALL') === t.value;
                  return (
                    <TouchableOpacity
                      key={t.value}
                      style={[
                        styles.optionRow,
                        isSelected && styles.optionRowSelected
                      ]}
                      onPress={() => {
                        haptics.selection();
                        if (t.value === 'VEG') {
                          if (!isVegOnly) onToggleVeg && onToggleVeg();
                        }
                        onTypeChange && onTypeChange(t.value);
                        setModalVisible(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                        {t.label}
                      </Text>
                      {isSelected && <Check size={18} color="#111111" strokeWidth={2.5} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 8
  },
  scrollContent: {
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center'
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8
  },
  pillActive: {
    borderColor: '#111111',
    backgroundColor: '#F3F4F6'
  },
  pillPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }]
  },
  pillText: {
    fontFamily: typography.family.medium,
    fontSize: 12.5,
    color: '#374151'
  },
  pillTextActive: {
    color: '#111111',
    fontFamily: typography.family.bold,
    fontWeight: '700'
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#111111',
    marginLeft: 5
  },
  vegIconSquare: {
    width: 13,
    height: 13,
    borderWidth: 1.2,
    borderColor: '#16A34A',
    backgroundColor: colors.white,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8
  },
  vegIconCircle: {
    width: 5.5,
    height: 5.5,
    borderRadius: 3,
    backgroundColor: '#16A34A'
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)'
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 32,
    paddingTop: 16
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  sheetTitle: {
    fontFamily: typography.family.bold,
    fontSize: 16.5,
    color: '#111827',
    fontWeight: '700'
  },
  closeBtn: {
    padding: 4
  },
  optionsList: {
    paddingTop: 8
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20
  },
  optionRowSelected: {
    backgroundColor: '#F9FAFB'
  },
  optionText: {
    fontFamily: typography.family.medium,
    fontSize: 14.5,
    color: '#374151'
  },
  optionTextSelected: {
    fontFamily: typography.family.bold,
    color: '#111827',
    fontWeight: '700'
  },
  filterOptionsList: {
    paddingHorizontal: 20,
    paddingTop: 14
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  filterLabel: {
    fontFamily: typography.family.medium,
    fontSize: 14,
    color: '#1F2937'
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  sheetActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24
  },
  clearBtn: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center'
  },
  clearBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '700'
  },
  applyBtn: {
    flex: 2,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  applyBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: colors.white,
    fontWeight: '700'
  }
});
