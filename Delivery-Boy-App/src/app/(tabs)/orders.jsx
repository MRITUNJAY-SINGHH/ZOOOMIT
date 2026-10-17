import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Search, Filter, AlertCircle } from 'lucide-react-native';
import { colors, typography, radius, spacing } from '../../constants/theme';
import { OrderCard, EmptyState, AppHeader } from '../../components';
import { deliveryService } from '../../services/deliveryService';
import { hapticFeedback } from '../../services/haptics';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New / Assigned' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' }
];

export default function OrdersScreen() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrders = async (tabKey = activeTab) => {
    try {
      setError(null);
      const res = await deliveryService.getOrders(tabKey);
      setOrders(res.orders || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders(activeTab);
    }, [activeTab])
  );

  const handleTabChange = (key) => {
    hapticFeedback.selection();
    setActiveTab(key);
    setLoading(true);
    fetchOrders(key);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders(activeTab);
  };

  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const orderNum = (o.orderNumber || '').toLowerCase();
    const customer = (o.customer?.name || o.shippingAddress?.contactName || '').toLowerCase();
    const address = (o.shippingAddress?.formattedAddress || o.shippingAddress?.city || '').toLowerCase();
    return orderNum.includes(q) || customer.includes(q) || address.includes(q);
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title="Delivery Orders"
        subtitle="Track, pickup, and complete customer deliveries"
      />

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={18} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by order # or customer..."
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        <FlatList
          data={TABS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.tabsScroll}
          renderItem={({ item }) => {
            const isActive = activeTab === item.key;
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleTabChange(item.key)}
                style={[
                  styles.tabChip,
                  isActive && styles.tabChipActive
                ]}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Orders List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primaryDark} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <AlertCircle size={36} color={colors.error} style={{ marginBottom: spacing.sm }} />
          <Text style={styles.errorTitle}>Error Loading Orders</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity onPress={() => fetchOrders(activeTab)} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primaryDark]} />}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPress={() => router.push(`/order/${item._id}`)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              type="orders"
              title="No orders found"
              message={
                searchQuery
                  ? 'No orders match your search term.'
                  : activeTab === 'all'
                  ? 'You do not have any orders assigned yet. Stay online to receive deliveries!'
                  : `No orders currently in "${activeTab}" status.`
              }
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.softBackground
  },
  searchSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface
  },
  searchBar: {
    height: 44,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2
  },
  searchIcon: {
    marginRight: spacing.sm
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    height: '100%'
  },
  tabsContainer: {
    backgroundColor: colors.surface,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.borderLight
  },
  tabsScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm
  },
  tabChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border
  },
  tabChipActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary
  },
  tabText: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.xs,
    color: colors.textSecondary
  },
  tabTextActive: {
    fontFamily: typography.family.bold,
    color: colors.white
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl']
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl
  },
  errorTitle: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.md,
    color: colors.textPrimary
  },
  errorSub: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: spacing.xs
  },
  retryBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primaryDark
  },
  retryText: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    color: colors.secondary
  }
});
