import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, ChevronRight, RotateCcw, Package } from 'lucide-react-native';
import { colors, spacing, radius, typography, getOrderStatus } from '../../constants/theme';
import { StorefrontAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { EmptyState } from '../../components/EmptyState';

export default function OrdersScreen() {
  const { token } = useAuth();
  const { refreshCart } = useCart();
  const [reorderingId, setReorderingId] = useState(null);

  const { data: orders, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['customer-orders'],
    queryFn: async () => {
      const res = await StorefrontAPI.getOrders({ limit: 20 });
      return res.data?.data || [];
    },
    enabled: Boolean(token)
  });

  if (!token) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon={<ClipboardList size={48} color={colors.primary} />}
          title="Sign In to view your orders"
          description="Track active deliveries, view purchase history, and easily reorder past items."
          actionTitle="Sign In"
          onAction={() => router.push('/(auth)/login')}
        />
      </View>
    );
  }

  const handleReorder = async (orderId) => {
    setReorderingId(orderId);
    try {
      const res = await StorefrontAPI.reorder(orderId);
      await refreshCart();
      Alert.alert(
        'Added to Cart! 🛒',
        res.data?.message || 'Items from this order have been added to your cart.',
        [
          { text: 'View Cart', onPress: () => router.push('/(tabs)/cart') },
          { text: 'OK', style: 'cancel' }
        ]
      );
    } catch (e) {
      Alert.alert('Reorder Failed', e.response?.data?.message || 'Unable to reorder items');
    } finally {
      setReorderingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      ) : orders && orders.length > 0 ? (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const statusConfig = getOrderStatus(item.status);
            const isReordering = reorderingId === item._id;

            return (
              <TouchableOpacity
                style={styles.orderCard}
                onPress={() => router.push(`/orders/${item._id}`)}
                activeOpacity={0.8}
              >
                {/* Header Row */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
                    <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                    <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
                      {statusConfig.label}
                    </Text>
                  </View>
                </View>

                {/* Details Row */}
                <View style={styles.cardBody}>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Items</Text>
                    <Text style={styles.infoValue}>{item.itemCount || 1} Products</Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Total Amount</Text>
                    <Text style={styles.amountValue}>₹{item.amount}</Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Payment</Text>
                    <Text style={styles.infoValue}>{item.paymentStatus}</Text>
                  </View>
                </View>

                {/* Card Actions */}
                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={styles.reorderBtn}
                    onPress={() => handleReorder(item._id)}
                    disabled={isReordering}
                  >
                    {isReordering ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <>
                        <RotateCcw size={14} color={colors.primary} style={{ marginRight: 4 }} />
                        <Text style={styles.reorderBtnText}>Buy Again</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <View style={styles.trackLink}>
                    <Text style={styles.trackText}>Track / Details</Text>
                    <ChevronRight size={16} color={colors.textSecondary} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      ) : (
        <EmptyState
          icon={<Package size={48} color={colors.primary} />}
          title="No Orders Placed Yet"
          description="You haven't placed any orders yet. Start shopping and enjoy 15-minute delivery!"
          actionTitle="Start Shopping"
          onAction={() => router.push('/(tabs)')}
        />
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  headerTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.size.sm,
    color: colors.textSecondary
  },
  listContent: {
    padding: spacing.xl,
    paddingBottom: spacing['4xl']
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle
  },
  orderNumber: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary
  },
  orderDate: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginTop: 2
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full
  },
  statusBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md
  },
  infoCol: {
    flex: 1
  },
  infoLabel: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginBottom: 2
  },
  infoValue: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.textSecondary
  },
  amountValue: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.primary
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle
  },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySubtle,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primaryLight
  },
  reorderBtnText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.primary
  },
  trackLink: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  trackText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.textSecondary,
    marginRight: 2
  }
});
