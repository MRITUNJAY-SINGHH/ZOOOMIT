import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bell, 
  CheckCheck, 
  Package, 
  AlertCircle, 
  Sparkles 
} from 'lucide-react-native';
import { colors, spacing, radius, typography } from '../constants/theme';
import { StorefrontAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { EmptyState } from '../components/EmptyState';

export default function NotificationsScreen() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['notifications-list'],
    queryFn: async () => {
      const res = await StorefrontAPI.getNotifications();
      return res.data || { data: [], unreadCount: 0 };
    },
    enabled: Boolean(token)
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => StorefrontAPI.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-badge'] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => StorefrontAPI.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-badge'] });
    }
  });

  if (!token) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon={<Bell size={48} color={colors.black} />}
          title="Sign In to view notifications"
          description="Get live updates on your deliveries, refunds, and special discounts."
          actionTitle="Sign In"
          onAction={() => router.push('/(auth)/login')}
        />
      </View>
    );
  }

  const notifications = data?.data || [];
  const unreadCount = data?.unreadCount || 0;

  const handleNotificationPress = (notif) => {
    if (!notif.isRead) {
      markReadMutation.mutate(notif._id);
    }
    if (notif.order) {
      router.push(`/orders/${notif.order}`);
    }
  };

  const getIcon = (type) => {
    if (type?.includes('Order')) return <Package size={20} color={colors.black} />;
    if (type?.includes('Refund') || type?.includes('Support')) return <AlertCircle size={20} color={colors.secondary} />;
    return <Sparkles size={20} color={colors.black} />;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications ({unreadCount} unread)</Text>
        {unreadCount > 0 && (
          <TouchableOpacity 
            style={styles.markAllBtn}
            onPress={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            <CheckCheck size={16} color={colors.black} style={{ marginRight: 4 }} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.black} />
        </View>
      ) : notifications.length > 0 ? (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          refreshing={isRefetching}
          onRefresh={refetch}
          contentContainerStyle={{ padding: spacing.xl }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.itemCard, !item.isRead && styles.unreadItemCard]}
              onPress={() => handleNotificationPress(item)}
              activeOpacity={0.8}
            >
              <View style={styles.iconCircle}>
                {getIcon(item.type)}
              </View>

              <View style={styles.content}>
                <View style={styles.titleRow}>
                  <Text style={[styles.itemTitle, !item.isRead && styles.unreadTitle]}>
                    {item.title || item.type}
                  </Text>
                  {!item.isRead && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.itemMessage}>{item.message}</Text>
                <Text style={styles.itemTime}>
                  {new Date(item.createdAt).toLocaleDateString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: 'numeric',
                    month: 'short'
                  })}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <EmptyState
          icon={<Bell size={48} color={colors.black} />}
          title="No Notifications Yet"
          description="You're all caught up! Order updates and promotions will appear here."
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  headerTitle: {
    fontSize: typography.size.sm,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  markAllText: {
    fontSize: typography.size.xs,
    color: colors.black,
    fontFamily: typography.family.bold
  },
  itemCard: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm
  },
  unreadItemCard: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryLight
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.softBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md
  },
  content: {
    flex: 1
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2
  },
  itemTitle: {
    fontSize: typography.size.sm,
    fontFamily: typography.family.medium,
    color: colors.textPrimary
  },
  unreadTitle: {
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryDark
  },
  itemMessage: {
    fontSize: typography.size.xs,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4
  },
  itemTime: {
    fontSize: 10,
    fontFamily: typography.family.regular,
    color: colors.textMuted
  }
});
