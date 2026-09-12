import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  FlatList,
  Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { 
  MapPin, 
  ChevronDown, 
  Bell, 
  Search as SearchIcon, 
  Sparkles 
} from 'lucide-react-native';
import { colors, spacing, radius, typography, shadows } from '../../constants/theme';
import { StorefrontAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ProductCard } from '../../components/ProductCard';
import { ProductCardSkeleton, SkeletonBox } from '../../components/LoadingSkeleton';
import { ErrorState } from '../../components/ErrorState';

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width - spacing.xl * 2;

export default function HomeScreen() {
  const { customer } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState(null);

  // 1. Fetch Banners
  const { 
    data: bannersData, 
    isLoading: bannersLoading, 
    refetch: refetchBanners 
  } = useQuery({
    queryKey: ['banners'],
    queryFn: async () => {
      const res = await StorefrontAPI.getBanners();
      return res.data?.data || [];
    }
  });

  // 2. Fetch Categories
  const { 
    data: categoriesData, 
    isLoading: categoriesLoading, 
    refetch: refetchCategories 
  } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await StorefrontAPI.getCategories();
      return res.data?.data || [];
    }
  });

  // 3. Fetch Featured / Deals Products
  const { 
    data: productsData, 
    isLoading: productsLoading, 
    isError: productsError, 
    error: productsErr,
    refetch: refetchProducts 
  } = useQuery({
    queryKey: ['products', selectedCategory],
    queryFn: async () => {
      const res = await StorefrontAPI.getProducts({
        category: selectedCategory || undefined,
        limit: 20
      });
      return res.data?.data || [];
    }
  });

  // 4. Fetch Unread Notifications
  const { data: notifsData } = useQuery({
    queryKey: ['notifications-badge'],
    queryFn: async () => {
      const res = await StorefrontAPI.getNotifications();
      return res.data || { unreadCount: 0 };
    },
    enabled: Boolean(customer)
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchBanners(),
      refetchCategories(),
      refetchProducts()
    ]);
    setRefreshing(false);
  };

  const defaultAddress = customer?.addresses?.find((a) => a.isDefault) || customer?.addresses?.[0];
  const addressLabel = defaultAddress 
    ? `${defaultAddress.label} - ${defaultAddress.street || defaultAddress.city}`
    : 'Select Delivery Address';

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.locationContainer}
          onPress={() => router.push('/addresses')}
          activeOpacity={0.7}
        >
          <View style={styles.locationIconCircle}>
            <MapPin size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.deliveryTime}>⚡ 15-25 MINS</Text>
              <ChevronDown size={14} color={colors.textPrimary} style={{ marginLeft: 2 }} />
            </View>
            <Text style={styles.addressText} numberOfLines={1}>
              {addressLabel}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Notifications Bell */}
        <TouchableOpacity 
          style={styles.bellButton}
          onPress={() => router.push('/notifications')}
          activeOpacity={0.7}
        >
          <Bell size={22} color={colors.textPrimary} />
          {Boolean(notifsData?.unreadCount) && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>
                {notifsData.unreadCount > 9 ? '9+' : notifsData.unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Main Scrollable Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        contentContainerStyle={{ paddingBottom: spacing['4xl'] }}
      >
        {/* Search Bar CTA */}
        <TouchableOpacity 
          style={styles.searchBar}
          onPress={() => router.push('/(tabs)/search')}
          activeOpacity={0.8}
        >
          <SearchIcon size={20} color={colors.textMuted} style={{ marginRight: spacing.sm }} />
          <Text style={styles.searchPlaceholder}>Search for "milk", "atta", "chips", "sugar"...</Text>
        </TouchableOpacity>

        {/* Dynamic Promotional Banners */}
        {bannersLoading ? (
          <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.lg }}>
            <SkeletonBox height={140} borderRadius={radius.xl} />
          </View>
        ) : bannersData && bannersData.length > 0 ? (
          <FlatList
            data={bannersData}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            snapToInterval={BANNER_WIDTH + spacing.md}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.md }}
            keyExtractor={(item, index) => item._id || String(index)}
            renderItem={({ item }) => (
              <View 
                style={[
                  styles.bannerCard, 
                  { backgroundColor: item.backgroundColor || colors.primary }
                ]}
              >
                <View style={styles.bannerTextContainer}>
                  <Text style={styles.bannerTitle}>{item.title}</Text>
                  {Boolean(item.subtitle) && (
                    <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
                  )}
                </View>
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.bannerImage}
                  contentFit="cover"
                />
              </View>
            )}
          />
        ) : null}

        {/* Categories Scroller */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
        </View>

        {categoriesLoading ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: spacing.xl }}>
            {[1, 2, 3, 4, 5].map(k => (
              <View key={k} style={{ marginRight: spacing.md, alignItems: 'center' }}>
                <SkeletonBox width={64} height={64} borderRadius={32} />
                <SkeletonBox width={50} height={10} style={{ marginTop: 6 }} />
              </View>
            ))}
          </ScrollView>
        ) : categoriesData && categoriesData.length > 0 ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.md }}
          >
            <TouchableOpacity 
              style={[
                styles.categoryPill, 
                selectedCategory === null && styles.categoryPillActive
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[
                styles.categoryPillText,
                selectedCategory === null && styles.categoryPillTextActive
              ]}>
                All Items
              </Text>
            </TouchableOpacity>

            {categoriesData.map((cat) => {
              const isActive = selectedCategory === cat._id;
              return (
                <TouchableOpacity
                  key={cat._id}
                  style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                  onPress={() => setSelectedCategory(isActive ? null : cat._id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.categoryPillText, isActive && styles.categoryPillTextActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}

        {/* Featured Products / Deals Grid */}
        <View style={[styles.sectionHeader, { marginTop: spacing.xl }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Sparkles size={18} color={colors.accent} style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>
              {selectedCategory ? 'Category Products' : 'Popular Essentials'}
            </Text>
          </View>
        </View>

        {productsLoading ? (
          <View style={styles.grid}>
            {[1, 2, 3, 4, 5, 6].map(k => (
              <View key={k} style={{ width: '48%' }}>
                <ProductCardSkeleton />
              </View>
            ))}
          </View>
        ) : productsError ? (
          <ErrorState
            message={productsErr?.message || 'Failed to load products'}
            onRetry={() => refetchProducts()}
          />
        ) : productsData && productsData.length > 0 ? (
          <View style={styles.grid}>
            {productsData.map((product) => (
              <View key={product._id} style={{ width: '48%' }}>
                <ProductCard product={product} />
              </View>
            ))}
          </View>
        ) : (
          <View style={{ padding: spacing.xl, alignItems: 'center' }}>
            <Text style={{ color: colors.textMuted }}>No products available in this category</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md
  },
  locationIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primarySubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm
  },
  deliveryTime: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.heavy,
    color: colors.textPrimary,
    letterSpacing: 0.5
  },
  addressText: {
    fontSize: typography.size.xs,
    color: colors.textSecondary
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  bellBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.error,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3
  },
  bellBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: typography.weight.bold
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm
  },
  searchPlaceholder: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    flex: 1
  },
  bannerCard: {
    width: BANNER_WIDTH,
    height: 140,
    borderRadius: radius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    ...shadows.md
  },
  bannerTextContainer: {
    flex: 1,
    paddingRight: spacing.sm
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    marginBottom: 4
  },
  bannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: typography.size.xs,
    lineHeight: 16
  },
  bannerImage: {
    width: 100,
    height: 100,
    borderRadius: radius.md
  },
  sectionHeader: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
    marginTop: spacing.sm
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary
  },
  categoryPill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border
  },
  categoryPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  categoryPillText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.textSecondary
  },
  categoryPillTextActive: {
    color: '#ffffff',
    fontWeight: typography.weight.bold
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl
  }
});
