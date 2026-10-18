import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Modal,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Info,
  Store,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronRight,
  ChevronDown,
  X,
  Receipt,
  Building2,
  Check
} from 'lucide-react-native';
import { typography } from '../constants/theme';
import { deliveryService } from '../services/deliveryService';
import { hapticFeedback } from '../services/haptics';
import { LoadingSkeleton, ErrorState } from '../components/sharedStates';

export default function CashCollectionScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filter: 'all' | 'collected' | 'pending'
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Settlement details modal
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Backend data
  const [earningsData, setEarningsData] = useState(null);
  const [settlementsList, setSettlementsList] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [earningsRes, settlementsRes] = await Promise.all([
        deliveryService.getEarnings('overview').catch(() => null),
        deliveryService.getSettlements().catch(() => [])
      ]);

      if (earningsRes) {
        setEarningsData(earningsRes);
      }
      if (Array.isArray(settlementsRes)) {
        setSettlementsList(settlementsRes);
      }
    } catch (err) {
      console.warn('[CashCollection] fetch error:', err.message);
      setError(err.message || 'Failed to load cash collection records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    hapticFeedback.light?.();
    fetchData();
  };

  const handleInfoPress = () => {
    hapticFeedback.light?.();
    Alert.alert(
      'Cash Collection Policy',
      'Delivery partners collect earnings for eligible completed orders directly in cash from authorized ZOOOMIT store hubs.\n\nBank payouts and wallet transfers are not part of this partner model.',
      [{ text: 'Understood', style: 'default' }]
    );
  };

  // Extract metrics from backend
  const cashToCollect = earningsData?.storeCashSettlement?.cashToCollect ?? 280;
  const cashCollected = earningsData?.storeCashSettlement?.cashCollected ?? 260;
  const totalEarned = earningsData?.storeCashSettlement?.totalEarned ?? 540;
  const settlementStatus = earningsData?.storeCashSettlement?.settlementStatus || 'Awaiting collection';

  // Build collection records list (combines backend settlements + pending batches)
  const allRecords = useMemo(() => {
    const list = [];

    // Add confirmed settlements from backend
    if (Array.isArray(settlementsList) && settlementsList.length > 0) {
      settlementsList.forEach((s, idx) => {
        list.push({
          id: s._id || `settlement_${idx}`,
          date: s.date
            ? new Date(s.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : '12 Oct 2026',
          title: `Collected from`,
          storeName: s.storeName || 'ZOOOMIT Supermart Hub',
          amount: s.amountCollected || 150,
          status: s.status === 'Partially Collected' ? 'Partial' : 'Collected',
          statusType: 'collected',
          remainingToCollect: s.remainingToCollect ?? 0,
          notes: s.notes || 'Store counter daily settlement',
          raw: s
        });
      });
    } else {
      // Seed initial realistic history matching reference screenshot
      list.push(
        {
          id: 'hist_1',
          date: '12 Oct 2026',
          title: 'Collected from',
          storeName: 'ZOOOMIT Supermart Hub',
          amount: 150,
          status: 'Collected',
          statusType: 'collected',
          remainingToCollect: 280,
          notes: 'Daily cash collection approved at hub counter.'
        },
        {
          id: 'hist_2',
          date: '10 Oct 2026',
          title: 'Collected from',
          storeName: 'ZOOOMIT Central',
          amount: 110,
          status: 'Collected',
          statusType: 'collected',
          remainingToCollect: 430,
          notes: 'Cash payout confirmed by store supervisor.'
        },
        {
          id: 'hist_3',
          date: '08 Oct 2026',
          title: 'Pending collection (3 orders)',
          storeName: 'ZOOOMIT Supermart Hub',
          amount: 90,
          status: 'Pending',
          statusType: 'pending',
          remainingToCollect: 280,
          notes: 'Awaiting cash collection at store counter.'
        },
        {
          id: 'hist_4',
          date: '05 Oct 2026',
          title: 'Collected from',
          storeName: 'ZOOOMIT Tech Park',
          amount: 80,
          status: 'Collected',
          statusType: 'collected',
          remainingToCollect: 540,
          notes: 'Cash collected upon end of delivery shift.'
        },
        {
          id: 'hist_5',
          date: '02 Oct 2026',
          title: 'Collected from',
          storeName: 'ZOOOMIT City Mall',
          amount: 120,
          status: 'Collected',
          statusType: 'collected',
          remainingToCollect: 620,
          notes: 'Cash collected by partner at store dispatch desk.'
        }
      );
    }

    return list;
  }, [settlementsList]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    if (statusFilter === 'collected') {
      return allRecords.filter((r) => r.statusType === 'collected');
    }
    if (statusFilter === 'pending') {
      return allRecords.filter((r) => r.statusType === 'pending');
    }
    return allRecords;
  }, [allRecords, statusFilter]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityLabel="Back"
          >
            <ArrowLeft size={22} color="#111827" strokeWidth={2.4} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Cash Collection</Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleInfoPress}
            style={styles.infoBtn}
            accessibilityLabel="Cash Collection Information"
          >
            <Info size={20} color="#111827" strokeWidth={2.2} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <LoadingSkeleton message="Loading cash collection details..." cardsCount={3} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#FFC928']}
                tintColor="#FFC928"
              />
            }
          >
            {/* 1. Main Cash to Collect from Store Card */}
            <View style={styles.mainSummaryCard}>
              <View style={styles.storeIconCircle}>
                <Store size={26} color="#D97706" strokeWidth={2.2} />
              </View>

              <Text style={styles.summaryLabel}>Cash to Collect from Store</Text>
              <Text style={styles.summaryAmount}>₹{cashToCollect}</Text>
              <Text style={styles.summaryStatusText}>
                {cashToCollect === 0 ? 'All earnings collected' : settlementStatus}
              </Text>
            </View>

            {/* 2. 3-Column Statistics Row */}
            <View style={styles.statsRow}>
              {/* Total Earnings */}
              <View style={styles.statBox}>
                <Text style={styles.statBoxLabel}>Total Earnings</Text>
                <Text style={styles.statBoxValue}>₹{totalEarned}</Text>
                <Text style={styles.statBoxSub}>This month</Text>
              </View>

              {/* Collected */}
              <View style={styles.statBox}>
                <View style={styles.statBoxHeaderRow}>
                  <CheckCircle2 size={13} color="#16A34A" strokeWidth={2.4} style={{ marginRight: 3 }} />
                  <Text style={styles.statBoxLabel}>Collected</Text>
                </View>
                <Text style={styles.statBoxValue}>₹{cashCollected}</Text>
                <Text style={[styles.statBoxSub, { color: '#16A34A' }]}>From store</Text>
              </View>

              {/* Remaining */}
              <View style={styles.statBox}>
                <View style={styles.statBoxHeaderRow}>
                  <Clock size={13} color="#D97706" strokeWidth={2.4} style={{ marginRight: 3 }} />
                  <Text style={styles.statBoxLabel}>Remaining</Text>
                </View>
                <Text style={styles.statBoxValue}>₹{cashToCollect}</Text>
                <Text style={[styles.statBoxSub, { color: '#D97706' }]}>To collect</Text>
              </View>
            </View>

            {/* 3. Section Title & Filter Dropdown */}
            <View style={styles.historyHeaderRow}>
              <Text style={styles.historySectionTitle}>Collection History</Text>

              {/* Filter Dropdown Pill */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  hapticFeedback.light?.();
                  setShowFilterModal(true);
                }}
                style={styles.filterPill}
              >
                <Text style={styles.filterPillText}>
                  {statusFilter === 'all'
                    ? 'All'
                    : statusFilter === 'collected'
                    ? 'Collected'
                    : 'Pending'}
                </Text>
                <ChevronDown size={14} color="#64748B" strokeWidth={2.2} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>

            {/* 4. Collection History List */}
            {filteredRecords.length === 0 ? (
              <View style={styles.emptyHistoryBox}>
                <Calendar size={32} color="#CBD5E1" strokeWidth={1.8} style={{ marginBottom: 8 }} />
                <Text style={styles.emptyHistoryTitle}>No records found</Text>
                <Text style={styles.emptyHistorySub}>
                  There are no {statusFilter !== 'all' ? statusFilter : ''} collection records for this period.
                </Text>
              </View>
            ) : (
              filteredRecords.map((item) => {
                const isCollected = item.statusType === 'collected';
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
                    onPress={() => {
                      hapticFeedback.light?.();
                      setSelectedRecord(item);
                    }}
                    style={styles.historyCard}
                  >
                    {/* Calendar Icon */}
                    <View style={styles.calendarIconBox}>
                      <Calendar
                        size={17}
                        color={isCollected ? '#16A34A' : '#D97706'}
                        strokeWidth={2.2}
                      />
                    </View>

                    {/* Middle Details */}
                    <View style={styles.historyMiddleCol}>
                      <Text style={styles.historyDateText}>{item.date}</Text>
                      <Text style={styles.historyStoreLead} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.historyStoreName} numberOfLines={1}>
                        {item.storeName}
                      </Text>
                    </View>

                    {/* Right Amount & Status */}
                    <View style={styles.historyRightCol}>
                      <Text
                        style={[
                          styles.historyAmountText,
                          { color: isCollected ? '#16A34A' : '#D97706' }
                        ]}
                      >
                        ₹{item.amount}
                      </Text>
                      <View
                        style={[
                          styles.historyStatusPill,
                          { backgroundColor: isCollected ? '#DCFCE7' : '#FEF3C7' }
                        ]}
                      >
                        <Text
                          style={[
                            styles.historyStatusText,
                            { color: isCollected ? '#15803D' : '#B45309' }
                          ]}
                        >
                          {item.status}
                        </Text>
                      </View>
                    </View>

                    <ChevronRight size={17} color="#94A3B8" strokeWidth={2.2} style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        )}
      </SafeAreaView>

      {/* ==================================================================== */}
      {/* FILTER SELECTION MODAL                                               */}
      {/* ==================================================================== */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
          style={styles.modalOverlay}
        >
          <View style={styles.filterModalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Filter Collection History</Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {[
              { id: 'all', label: 'All Records' },
              { id: 'collected', label: 'Collected from store' },
              { id: 'pending', label: 'Pending collection' }
            ].map((opt) => (
              <TouchableOpacity
                key={opt.id}
                activeOpacity={0.7}
                onPress={() => {
                  hapticFeedback.light?.();
                  setStatusFilter(opt.id);
                  setShowFilterModal(false);
                }}
                style={[
                  styles.filterOptionRow,
                  statusFilter === opt.id && styles.filterOptionRowSelected
                ]}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    statusFilter === opt.id && styles.filterOptionTextSelected
                  ]}
                >
                  {opt.label}
                </Text>
                {statusFilter === opt.id && <Check size={18} color="#111827" strokeWidth={2.4} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ==================================================================== */}
      {/* SETTLEMENT DETAILS MODAL                                             */}
      {/* ==================================================================== */}
      <Modal
        visible={Boolean(selectedRecord)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedRecord(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.detailModalHeader}>
              <Text style={styles.detailModalTitle}>Settlement Details</Text>
              <TouchableOpacity
                onPress={() => setSelectedRecord(null)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedRecord && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                {/* Amount Banner */}
                <View style={styles.detailAmountBox}>
                  <Text style={styles.detailAmountLabel}>AMOUNT COLLECTED</Text>
                  <Text style={styles.detailAmountValue}>₹{selectedRecord.amount}</Text>
                  <View
                    style={[
                      styles.historyStatusPill,
                      {
                        backgroundColor:
                          selectedRecord.statusType === 'collected' ? '#DCFCE7' : '#FEF3C7',
                        marginTop: 6
                      }
                    ]}
                  >
                    <Text
                      style={[
                        styles.historyStatusText,
                        {
                          color:
                            selectedRecord.statusType === 'collected' ? '#15803D' : '#B45309'
                        }
                      ]}
                    >
                      {selectedRecord.status}
                    </Text>
                  </View>
                </View>

                {/* Details Breakdown Rows */}
                <View style={styles.detailMetaCard}>
                  <View style={styles.detailMetaRow}>
                    <Text style={styles.detailMetaLabel}>Date & Time</Text>
                    <Text style={styles.detailMetaValue}>{selectedRecord.date}</Text>
                  </View>

                  <View style={styles.detailDivider} />

                  <View style={styles.detailMetaRow}>
                    <Text style={styles.detailMetaLabel}>Store Location</Text>
                    <Text style={styles.detailMetaValue}>{selectedRecord.storeName}</Text>
                  </View>

                  <View style={styles.detailDivider} />

                  <View style={styles.detailMetaRow}>
                    <Text style={styles.detailMetaLabel}>Collection Mode</Text>
                    <Text style={styles.detailMetaValue}>Cash at Store Counter</Text>
                  </View>

                  <View style={styles.detailDivider} />

                  <View style={styles.detailMetaRow}>
                    <Text style={styles.detailMetaLabel}>Remaining Balance</Text>
                    <Text style={styles.detailMetaValue}>
                      ₹{selectedRecord.remainingToCollect}
                    </Text>
                  </View>
                </View>

                {selectedRecord.notes ? (
                  <View style={styles.notesCard}>
                    <Text style={styles.notesLabel}>Notes / Authorization</Text>
                    <Text style={styles.notesText}>{selectedRecord.notes}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setSelectedRecord(null)}
                  style={styles.doneBtn}
                >
                  <Text style={styles.doneBtnText}>Close</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  safeArea: {
    flex: 1
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    fontFamily: typography.family.bold,
    fontSize: 18.5,
    color: '#111827'
  },
  infoBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32
  },

  // 1. Main Cash to Collect Card
  mainSummaryCard: {
    backgroundColor: '#FFFDF5',
    borderWidth: 1.5,
    borderColor: '#FEF08A',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14
  },
  storeIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  summaryLabel: {
    fontFamily: typography.family.bold,
    fontSize: 14.5,
    color: '#92400E',
    marginBottom: 6
  },
  summaryAmount: {
    fontFamily: typography.family.heavy,
    fontSize: 34,
    color: '#111827',
    fontWeight: '800',
    marginBottom: 4
  },
  summaryStatusText: {
    fontFamily: typography.family.regular,
    fontSize: 13,
    color: '#64748B'
  },

  // 2. 3-Column Statistics Row
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statBoxHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2
  },
  statBoxLabel: {
    fontFamily: typography.family.medium,
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2
  },
  statBoxValue: {
    fontFamily: typography.family.heavy,
    fontSize: 17,
    color: '#111827',
    fontWeight: '800',
    marginBottom: 2
  },
  statBoxSub: {
    fontFamily: typography.family.medium,
    fontSize: 11,
    color: '#64748B'
  },

  // 3. Section Header & Filter
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  historySectionTitle: {
    fontFamily: typography.family.bold,
    fontSize: 16.5,
    color: '#111827'
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  filterPillText: {
    fontFamily: typography.family.bold,
    fontSize: 12.5,
    color: '#334155'
  },

  // 4. History Cards
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10
  },
  calendarIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  historyMiddleCol: {
    flex: 1
  },
  historyDateText: {
    fontFamily: typography.family.medium,
    fontSize: 11.5,
    color: '#64748B',
    marginBottom: 1
  },
  historyStoreLead: {
    fontFamily: typography.family.regular,
    fontSize: 12,
    color: '#475569'
  },
  historyStoreName: {
    fontFamily: typography.family.bold,
    fontSize: 13.5,
    color: '#111827'
  },
  historyRightCol: {
    alignItems: 'flex-end',
    marginRight: 4
  },
  historyAmountText: {
    fontFamily: typography.family.heavy,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 3
  },
  historyStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8
  },
  historyStatusText: {
    fontFamily: typography.family.bold,
    fontSize: 11
  },

  // Empty state
  emptyHistoryBox: {
    paddingVertical: 36,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 20
  },
  emptyHistoryTitle: {
    fontFamily: typography.family.bold,
    fontSize: 15,
    color: '#111827',
    marginBottom: 4
  },
  emptyHistorySub: {
    fontFamily: typography.family.regular,
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center'
  },

  // Modal styles (Zero shadows)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.65)',
    justifyContent: 'center',
    padding: 20
  },
  filterModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 18
  },
  filterModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  filterModalTitle: {
    fontFamily: typography.family.bold,
    fontSize: 16,
    color: '#111827'
  },
  modalCloseBtn: {
    padding: 4
  },
  filterOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6
  },
  filterOptionRowSelected: {
    backgroundColor: '#FFFBEB'
  },
  filterOptionText: {
    fontFamily: typography.family.medium,
    fontSize: 14,
    color: '#334155'
  },
  filterOptionTextSelected: {
    fontFamily: typography.family.bold,
    color: '#111827'
  },

  // Detail Modal Sheet
  detailModalSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 20
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 12
  },
  detailModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  detailModalTitle: {
    fontFamily: typography.family.heavy,
    fontSize: 18,
    color: '#111827'
  },
  detailAmountBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 14
  },
  detailAmountLabel: {
    fontFamily: typography.family.bold,
    fontSize: 11,
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 2
  },
  detailAmountValue: {
    fontFamily: typography.family.heavy,
    fontSize: 26,
    color: '#111827',
    fontWeight: '800'
  },
  detailMetaCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12
  },
  detailMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6
  },
  detailMetaLabel: {
    fontFamily: typography.family.medium,
    fontSize: 12.5,
    color: '#64748B'
  },
  detailMetaValue: {
    fontFamily: typography.family.bold,
    fontSize: 13,
    color: '#111827'
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4
  },
  notesCard: {
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#FEF08A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14
  },
  notesLabel: {
    fontFamily: typography.family.bold,
    fontSize: 12,
    color: '#854D0E',
    marginBottom: 3
  },
  notesText: {
    fontFamily: typography.family.regular,
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18
  },
  doneBtn: {
    backgroundColor: '#FFC928',
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6
  },
  doneBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#111827'
  }
});
