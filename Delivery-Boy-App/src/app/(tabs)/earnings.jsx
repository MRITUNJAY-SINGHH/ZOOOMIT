import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import {
  Wallet,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Gift,
  HelpCircle,
  ArrowUpRight
} from 'lucide-react-native';
import { colors, typography, radius, spacing } from '../../constants/theme';
import { AppHeader, EmptyState } from '../../components';
import { deliveryService } from '../../services/deliveryService';
import { hapticFeedback } from '../../services/haptics';

const PERIOD_TABS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' }
];

export default function EarningsScreen() {
  const [period, setPeriod] = useState('today');
  const [data, setData] = useState({
    totalEarnings: 0,
    baseEarnings: 0,
    bonusIncentives: 0,
    totalDeliveries: 0,
    avgEarningsPerOrder: 0,
    payoutStatus: 'Eligible for weekly cycle',
    nextPayoutDate: 'Next Monday',
    orders: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEarnings = async (p = period) => {
    try {
      const res = await deliveryService.getEarnings(p);
      setData(res);
    } catch (err) {
      console.warn('[Earnings] Fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchEarnings(period);
    }, [period])
  );

  const handlePeriodChange = (p) => {
    hapticFeedback.selection();
    setPeriod(p);
    setLoading(true);
    fetchEarnings(p);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEarnings(period);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title="My Earnings"
        subtitle="Delivery payouts and performance bonuses"
      />

      {/* Period Tabs */}
      <View style={styles.periodRow}>
        {PERIOD_TABS.map((tab) => {
          const isActive = period === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.8}
              onPress={() => handlePeriodChange(tab.key)}
              style={[styles.periodChip, isActive && styles.periodChipActive]}
            >
              <Text style={[styles.periodText, isActive && styles.periodTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primaryDark]} />}
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primaryDark} />
          </View>
        ) : (
          <>
            {/* Big Total Earnings Banner */}
            <View style={styles.totalBanner}>
              <View style={styles.bannerHeader}>
                <View style={styles.walletIconCircle}>
                  <Wallet size={20} color={colors.secondary} />
                </View>
                <View style={styles.payoutBadge}>
                  <Text style={styles.payoutBadgeText}>{data.payoutStatus}</Text>
                </View>
              </View>
              <Text style={styles.totalLabel}>TOTAL EARNED ({period.toUpperCase()})</Text>
              <Text style={styles.totalValue}>₹{data.totalEarnings}</Text>
              <View style={styles.bannerFooter}>
                <Calendar size={13} color="#854D0E" style={{ marginRight: 4 }} />
                <Text style={styles.nextPayoutText}>Direct Payout: {data.nextPayoutDate}</Text>
              </View>
            </View>

            {/* Quick Metrics 2x1 Grid */}
            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>COMPLETED DELIVERIES</Text>
                <Text style={styles.metricValue}>{data.totalDeliveries}</Text>
                <Text style={styles.metricSub}>Orders completed</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>AVG. PER DELIVERY</Text>
                <Text style={styles.metricValue}>₹{data.avgEarningsPerOrder}</Text>
                <Text style={styles.metricSub}>Base + performance</Text>
              </View>
            </View>

            {/* Breakdown Card */}
            <View style={styles.breakdownCard}>
              <Text style={styles.sectionHeading}>Earnings Breakdown</Text>

              <View style={styles.breakdownRow}>
                <View style={styles.breakdownLeft}>
                  <CheckCircle2 size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                  <Text style={styles.breakdownTitle}>Delivery Base Pay ({data.totalDeliveries} × ₹45)</Text>
                </View>
                <Text style={styles.breakdownAmount}>₹{data.baseEarnings}</Text>
              </View>

              <View style={styles.breakdownDivider} />

              <View style={styles.breakdownRow}>
                <View style={styles.breakdownLeft}>
                  <Gift size={16} color="#A16207" style={{ marginRight: 8 }} />
                  <Text style={styles.breakdownTitle}>Incentives & Shift Bonus</Text>
                </View>
                <Text style={[styles.breakdownAmount, { color: colors.success }]}>
                  +₹{data.bonusIncentives}
                </Text>
              </View>

              <View style={styles.breakdownDivider} />

              <View style={[styles.breakdownRow, { marginTop: spacing.xs }]}>
                <Text style={styles.breakdownNetLabel}>Net Total Payable</Text>
                <Text style={styles.breakdownNetAmount}>₹{data.totalEarnings}</Text>
              </View>
            </View>

            {/* Orders Breakdown History */}
            <View style={styles.historySection}>
              <Text style={styles.sectionHeading}>Completed Orders in this Period</Text>

              {data.orders.length === 0 ? (
                <EmptyState
                  type="earnings"
                  title="No completed deliveries"
                  message={`You have not completed any deliveries ${period === 'today' ? 'today' : 'in this time period'}. Go online to start earning!`}
                />
              ) : (
                data.orders.map((o) => (
                  <View key={o._id} style={styles.historyCard}>
                    <View style={styles.historyLeft}>
                      <Text style={styles.historyOrderNumber}>#{o.orderNumber}</Text>
                      <Text style={styles.historyAddress} numberOfLines={1}>{o.customerAddress}</Text>
                      <Text style={styles.historyTime}>
                        {o.deliveredAt
                          ? new Date(o.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Delivered'}
                      </Text>
                    </View>
                    <View style={styles.historyRight}>
                      <Text style={styles.historyAmount}>+₹{o.amount}</Text>
                      <View style={styles.settledBadge}>
                        <Text style={styles.settledText}>Completed</Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.softBackground
  },
  periodRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.borderLight,
    gap: spacing.sm
  },
  periodChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center'
  },
  periodChipActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary
  },
  periodText: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.xs,
    color: colors.textSecondary
  },
  periodTextActive: {
    fontFamily: typography.family.bold,
    color: colors.white
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl']
  },
  centerContainer: {
    padding: spacing.xxxl,
    alignItems: 'center'
  },
  totalBanner: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.primaryDark,
    padding: spacing.lg,
    marginBottom: spacing.md
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs
  },
  walletIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primaryDark
  },
  payoutBadge: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primaryDark,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill
  },
  payoutBadgeText: {
    fontFamily: typography.family.bold,
    fontSize: 10,
    color: '#854D0E',
    letterSpacing: 0.3
  },
  totalLabel: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    color: '#854D0E',
    letterSpacing: 0.5,
    marginTop: spacing.xs
  },
  totalValue: {
    fontFamily: typography.family.heavy,
    fontSize: typography.size['4xl'],
    color: colors.secondary,
    marginVertical: 2
  },
  bannerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.primary
  },
  nextPayoutText: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.xs,
    color: '#854D0E'
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md
  },
  metricLabel: {
    fontFamily: typography.family.bold,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 0.4
  },
  metricValue: {
    fontFamily: typography.family.heavy,
    fontSize: typography.size.xl,
    color: colors.textPrimary,
    marginVertical: 2
  },
  metricSub: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textSecondary
  },
  breakdownCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md
  },
  sectionHeading: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.md,
    color: colors.textPrimary,
    marginBottom: spacing.md
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  breakdownTitle: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.xs,
    color: colors.textPrimary
  },
  breakdownAmount: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    color: colors.textPrimary
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.xs
  },
  breakdownNetLabel: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    color: colors.textPrimary
  },
  breakdownNetAmount: {
    fontFamily: typography.family.heavy,
    fontSize: typography.size.md,
    color: colors.secondary
  },
  historySection: {
    marginTop: spacing.sm
  },
  historyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  historyLeft: {
    flex: 1,
    marginRight: spacing.sm
  },
  historyOrderNumber: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    color: colors.textPrimary
  },
  historyAddress: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 2
  },
  historyTime: {
    fontFamily: typography.family.regular,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2
  },
  historyRight: {
    alignItems: 'flex-end'
  },
  historyAmount: {
    fontFamily: typography.family.heavy,
    fontSize: typography.size.md,
    color: colors.success
  },
  settledBadge: {
    backgroundColor: colors.badgeDelivered,
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginTop: 3
  },
  settledText: {
    fontFamily: typography.family.bold,
    fontSize: 10,
    color: colors.badgeDeliveredText
  }
});
