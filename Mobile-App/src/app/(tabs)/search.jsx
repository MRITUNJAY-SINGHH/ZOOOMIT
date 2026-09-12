import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  FlatList 
} from 'react-native';
import { Search, X, Clock, ArrowUpDown } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, radius, typography } from '../../constants/theme';
import { StorefrontAPI } from '../../services/api';
import { ProductCard } from '../../components/ProductCard';
import { ProductCardSkeleton } from '../../components/LoadingSkeleton';
import { EmptyState } from '../../components/EmptyState';

const POPULAR_SEARCHES = ['Milk', 'Atta', 'Sugar', 'Ghee', 'Paneer', 'Biscuits', 'Oil', 'Tea'];

export default function SearchScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [recentSearches, setRecentSearches] = useState(['Milk', 'Sugar', 'Rice']);
  const [sortBy, setSortBy] = useState('default');

  // Debounce search input (350ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm.trim());
      if (searchTerm.trim() && !recentSearches.includes(searchTerm.trim())) {
        setRecentSearches(prev => [searchTerm.trim(), ...prev.slice(0, 4)]);
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search', debouncedTerm, sortBy],
    queryFn: async () => {
      if (!debouncedTerm) return [];
      const res = await StorefrontAPI.getProducts({
        search: debouncedTerm,
        sort: sortBy !== 'default' ? sortBy : undefined,
        limit: 30
      });
      return res.data?.data || [];
    },
    enabled: Boolean(debouncedTerm)
  });

  const clearSearch = () => {
    setSearchTerm('');
    setDebouncedTerm('');
  };

  const handleSelectRecent = (term) => {
    setSearchTerm(term);
  };

  return (
    <View style={styles.container}>
      {/* Search Bar Header */}
      <View style={styles.header}>
        <View style={styles.inputContainer}>
          <Search size={20} color={colors.textMuted} style={{ marginRight: spacing.sm }} />
          <TextInput
            style={styles.input}
            placeholder="Search products, brands, essentials..."
            placeholderTextColor={colors.textMuted}
            value={searchTerm}
            onChangeText={setSearchTerm}
            autoFocus={false}
          />
          {Boolean(searchTerm) && (
            <TouchableOpacity onPress={clearSearch} style={{ padding: spacing.xs }}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Sorting Bar if searching */}
      {Boolean(debouncedTerm) && (
        <View style={styles.sortBar}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ArrowUpDown size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
            <Text style={styles.sortLabel}>Sort:</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {[
              { id: 'default', label: 'Relevance' },
              { id: 'popular', label: 'Popular' },
              { id: 'price_asc', label: 'Price: Low to High' },
              { id: 'price_desc', label: 'Price: High to Low' }
            ].map(item => (
              <TouchableOpacity
                key={item.id}
                style={[styles.sortPill, sortBy === item.id && styles.sortPillActive]}
                onPress={() => setSortBy(item.id)}
              >
                <Text style={[styles.sortPillText, sortBy === item.id && styles.sortPillTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Results or Discovery Feed */}
      {debouncedTerm ? (
        isLoading ? (
          <View style={styles.grid}>
            {[1, 2, 3, 4].map(k => (
              <View key={k} style={{ width: '48%' }}>
                <ProductCardSkeleton />
              </View>
            ))}
          </View>
        ) : searchResults && searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            keyExtractor={item => item._id}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: spacing.xl }}
            contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: spacing['4xl'] }}
            renderItem={({ item }) => (
              <View style={{ width: '48%' }}>
                <ProductCard product={item} />
              </View>
            )}
          />
        ) : (
          <EmptyState
            title="No items found"
            description={`We couldn't find any products matching "${debouncedTerm}". Check your spelling or try another keyword.`}
            actionTitle="Clear Search"
            onAction={clearSearch}
          />
        )
      ) : (
        <ScrollView style={styles.discoveryContainer} showsVerticalScrollIndicator={false}>
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Clock size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={styles.sectionTitle}>Recent Searches</Text>
                </View>
                <TouchableOpacity onPress={() => setRecentSearches([])}>
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.chipsRow}>
                {recentSearches.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.chip}
                    onPress={() => handleSelectRecent(item)}
                  >
                    <Text style={styles.chipText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Popular Suggestions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trending & Popular</Text>
            <View style={styles.chipsRow}>
              {POPULAR_SEARCHES.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.chip}
                  onPress={() => handleSelectRecent(item)}
                >
                  <Text style={styles.chipText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    height: 46
  },
  input: {
    flex: 1,
    fontSize: typography.size.md,
    color: colors.textPrimary
  },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  sortLabel: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginRight: 6
  },
  sortPill: {
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSubtle
  },
  sortPillActive: {
    backgroundColor: colors.primarySubtle,
    borderWidth: 1,
    borderColor: colors.primary
  },
  sortPillText: {
    fontSize: typography.size.xs,
    color: colors.textSecondary
  },
  sortPillTextActive: {
    color: colors.primary,
    fontWeight: typography.weight.bold
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: spacing.xl
  },
  discoveryContainer: {
    padding: spacing.xl
  },
  section: {
    marginBottom: spacing['2xl']
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  sectionTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm
  },
  clearText: {
    fontSize: typography.size.xs,
    color: colors.textMuted
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  chip: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full
  },
  chipText: {
    fontSize: typography.size.sm,
    color: colors.textPrimary
  }
});
