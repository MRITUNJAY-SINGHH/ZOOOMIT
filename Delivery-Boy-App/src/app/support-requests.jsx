import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  StatusBar,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Plus,
  ChevronRight,
  MessageSquare,
  FileText,
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Check
} from 'lucide-react-native';
import { typography } from '../constants/theme';
import { deliveryService } from '../services/deliveryService';
import { hapticFeedback } from '../services/haptics';
import { LoadingSkeleton, ErrorState } from '../components/sharedStates';

const CATEGORIES = [
  'Order not assigned',
  'Pickup or store issue',
  'Delivery OTP problem',
  'Customer or address issue',
  'Earnings or cash-collection issue',
  'App or login issue',
  'Other'
];

export default function SupportRequestsScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Active filter tab: 'all' | 'open' | 'in_progress' | 'resolved'
  const [activeTab, setActiveTab] = useState('all');

  // Tickets data & counts from backend
  const [tickets, setTickets] = useState([]);
  const [counts, setCounts] = useState({
    all: 5,
    open: 2,
    in_progress: 1,
    resolved: 2
  });

  // New Support Request Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [newCategory, setNewCategory] = useState(CATEGORIES[0]);
  const [newOrderId, setNewOrderId] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Ticket Details / Messages Modal State
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const fetchTickets = useCallback(async (tab = activeTab) => {
    try {
      setError(null);
      const res = await deliveryService.getSupportTickets(tab);
      if (res && Array.isArray(res.tickets)) {
        setTickets(res.tickets);
        if (res.counts) setCounts(res.counts);
      }
    } catch (err) {
      console.warn('[SupportRequests] fetch error:', err.message);
      setError(err.message || 'Failed to load support requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchTickets(activeTab);
  }, [activeTab, fetchTickets]);

  const onRefresh = () => {
    setRefreshing(true);
    hapticFeedback.light?.();
    fetchTickets(activeTab);
  };

  // Submit New Support Request
  const handleSubmitNew = async () => {
    if (!newDescription.trim()) {
      setFormError('Please enter a description of the issue');
      return;
    }
    if (newDescription.trim().length < 10) {
      setFormError('Please provide more details (at least 10 characters)');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      hapticFeedback.medium?.();
      const res = await deliveryService.createSupportTicket({
        category: newCategory,
        orderId: newOrderId.trim(),
        description: newDescription.trim()
      });

      setShowNewModal(false);
      setNewOrderId('');
      setNewDescription('');
      setNewCategory(CATEGORIES[0]);

      Alert.alert(
        'Request Submitted',
        `Your support request #${res.ticket?.ticketNumber || ''} has been submitted. Our team will review and respond shortly.`
      );

      // Refresh tickets
      await fetchTickets(activeTab);
    } catch (err) {
      setFormError(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Reply
  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket?._id) return;
    setSendingReply(true);
    try {
      hapticFeedback.light?.();
      const res = await deliveryService.replySupportTicket(selectedTicket._id, replyText.trim());
      setReplyText('');
      if (res?.ticket) {
        setSelectedTicket(res.ticket);
        setTickets((prev) =>
          prev.map((t) => (t._id === res.ticket._id ? res.ticket : t))
        );
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const getStatusBadgeStyle = (status) => {
    const s = String(status).toLowerCase();
    if (s === 'open') {
      return {
        bg: '#FFEDD5',
        text: '#C2410C'
      };
    }
    if (s.includes('progress')) {
      return {
        bg: '#DBEAFE',
        text: '#1D4ED8'
      };
    }
    return {
      bg: '#DCFCE7',
      text: '#15803D'
    };
  };

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

          <Text style={styles.headerTitle}>My Support Requests</Text>

          <View style={{ width: 36 }} />
        </View>

        {/* Top Full-width Yellow Button: + New Support Request */}
        <View style={styles.topBtnWrapper}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              hapticFeedback.light?.();
              setFormError('');
              setShowNewModal(true);
            }}
            style={styles.newRequestBtn}
            accessibilityLabel="Create New Support Request"
          >
            <Plus size={18} color="#111827" strokeWidth={2.8} style={{ marginRight: 6 }} />
            <Text style={styles.newRequestBtnText}>New Support Request</Text>
          </TouchableOpacity>
        </View>

        {/* Status Filter Tabs: All (5) | Open (2) | In Progress (1) | Resolved (2) */}
        <View style={styles.tabsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScroll}
          >
            {[
              { id: 'all', label: `All (${counts.all ?? 0})` },
              { id: 'open', label: `Open (${counts.open ?? 0})` },
              { id: 'in_progress', label: `In Progress (${counts.in_progress ?? 0})` },
              { id: 'resolved', label: `Resolved (${counts.resolved ?? 0})` }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  activeOpacity={0.75}
                  onPress={() => {
                    hapticFeedback.light?.();
                    setActiveTab(tab.id);
                  }}
                  style={[styles.tabPill, isActive && styles.tabPillActive]}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Support Tickets List */}
        {loading ? (
          <LoadingSkeleton message="Loading support requests..." cardsCount={3} />
        ) : error ? (
          <ErrorState message={error} onRetry={() => fetchTickets(activeTab)} />
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
            {tickets.length === 0 ? (
              <View style={styles.emptyTicketsBox}>
                <MessageSquare size={34} color="#CBD5E1" strokeWidth={1.8} style={{ marginBottom: 8 }} />
                <Text style={styles.emptyTicketsTitle}>No Support Requests</Text>
                <Text style={styles.emptyTicketsSub}>
                  {activeTab !== 'all'
                    ? `You don't have any ${activeTab.replace('_', ' ')} requests.`
                    : 'Need help with an order or your delivery earnings? Tap "New Support Request" above.'}
                </Text>
              </View>
            ) : (
              tickets.map((ticket) => {
                const badge = getStatusBadgeStyle(ticket.status);
                const messageCount = ticket.messages?.length || 1;
                const dateStr = ticket.createdAt
                  ? new Date(ticket.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })
                  : '12 Oct 2026, 2:30 PM';

                return (
                  <TouchableOpacity
                    key={ticket._id || ticket.ticketNumber}
                    activeOpacity={0.8}
                    onPress={() => {
                      hapticFeedback.light?.();
                      setSelectedTicket(ticket);
                    }}
                    style={styles.ticketCard}
                  >
                    {/* Top Row: Ticket ID, Date & Status Badge */}
                    <View style={styles.ticketCardTopRow}>
                      <View>
                        <Text style={styles.ticketNumberText}>#{ticket.ticketNumber}</Text>
                        <Text style={styles.ticketDateText}>{dateStr}</Text>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                          <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                            {ticket.status}
                          </Text>
                        </View>
                        <ChevronRight
                          size={17}
                          color="#94A3B8"
                          strokeWidth={2.2}
                          style={{ marginLeft: 6 }}
                        />
                      </View>
                    </View>

                    {/* Category Title */}
                    <Text style={styles.ticketCategoryTitle} numberOfLines={1}>
                      {ticket.category}
                    </Text>

                    {/* Short Description */}
                    <Text style={styles.ticketDescriptionText} numberOfLines={2}>
                      {ticket.description}
                    </Text>

                    {/* Bottom Chips: Order ID + Response Count */}
                    <View style={styles.ticketFooterRow}>
                      <View style={styles.footerChip}>
                        <FileText size={12} color="#64748B" strokeWidth={2.2} style={{ marginRight: 4 }} />
                        <Text style={styles.footerChipText}>
                          {ticket.orderId ? `Order #${ticket.orderId}` : 'No Order ID'}
                        </Text>
                      </View>

                      <View style={styles.footerChip}>
                        <MessageSquare size={12} color="#64748B" strokeWidth={2.2} style={{ marginRight: 4 }} />
                        <Text style={styles.footerChipText}>{messageCount}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        )}
      </SafeAreaView>

      {/* ==================================================================== */}
      {/* NEW SUPPORT REQUEST MODAL FORM                                       */}
      {/* ==================================================================== */}
      <Modal
        visible={showNewModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!submitting) setShowNewModal(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.newModalCard}>
            <View style={styles.newModalHeader}>
              <Text style={styles.newModalTitle}>New Support Request</Text>
              <TouchableOpacity
                onPress={() => {
                  if (!submitting) setShowNewModal(false);
                }}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#64748B" strokeWidth={2.4} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
              {formError ? (
                <View style={styles.errorBanner}>
                  <AlertCircle size={15} color="#DC2626" style={{ marginRight: 6 }} />
                  <Text style={styles.errorBannerText}>{formError}</Text>
                </View>
              ) : null}

              {/* Category Selector */}
              <Text style={styles.fieldLabel}>Issue Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    activeOpacity={0.75}
                    onPress={() => setNewCategory(cat)}
                    style={[
                      styles.categoryChoicePill,
                      newCategory === cat && styles.categoryChoicePillActive
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryChoiceText,
                        newCategory === cat && styles.categoryChoiceTextActive
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Order ID Input */}
              <Text style={styles.fieldLabel}>Order ID (Optional)</Text>
              <TextInput
                value={newOrderId}
                onChangeText={setNewOrderId}
                placeholder="e.g. ZM102300"
                placeholderTextColor="#94A3B8"
                style={styles.textInput}
                autoCapitalize="characters"
              />

              {/* Description Input */}
              <Text style={styles.fieldLabel}>Description *</Text>
              <TextInput
                value={newDescription}
                onChangeText={setNewDescription}
                placeholder="Describe the issue you are facing in detail..."
                placeholderTextColor="#94A3B8"
                style={[styles.textInput, styles.textArea]}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              {/* Submit Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSubmitNew}
                disabled={submitting}
                style={styles.submitBtn}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#111827" />
                ) : (
                  <>
                    <Send size={16} color="#111827" strokeWidth={2.4} style={{ marginRight: 6 }} />
                    <Text style={styles.submitBtnText}>Submit Request</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ==================================================================== */}
      {/* TICKET DETAILS & CONVERSATION MODAL                                  */}
      {/* ==================================================================== */}
      <Modal
        visible={Boolean(selectedTicket)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedTicket(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.detailSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.newModalHeader}>
              <View>
                <Text style={styles.detailTicketNumber}>#{selectedTicket?.ticketNumber}</Text>
                <Text style={styles.detailTicketCategory}>{selectedTicket?.category}</Text>
              </View>

              <TouchableOpacity
                onPress={() => setSelectedTicket(null)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#64748B" strokeWidth={2.4} />
              </TouchableOpacity>
            </View>

            {selectedTicket && (
              <>
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380, paddingHorizontal: 4 }}>
                  {/* Status Banner */}
                  <View style={styles.detailMetaBanner}>
                    <View>
                      <Text style={styles.detailBannerLead}>Current Status</Text>
                      <Text style={styles.detailBannerStatus}>{selectedTicket.status}</Text>
                    </View>
                    {selectedTicket.orderId ? (
                      <View style={styles.detailOrderBadge}>
                        <Text style={styles.detailOrderText}>Order #{selectedTicket.orderId}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Messages / Conversation Thread */}
                  <Text style={styles.conversationHeader}>Conversation</Text>
                  <View style={styles.messagesContainer}>
                    {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                      selectedTicket.messages.map((m, idx) => {
                        const isRider = m.sender === 'rider';
                        return (
                          <View
                            key={idx}
                            style={[
                              styles.messageBubble,
                              isRider ? styles.riderBubble : styles.supportBubble
                            ]}
                          >
                            <Text style={styles.messageSenderLead}>
                              {isRider ? 'You' : 'ZOOOMIT Support'}
                            </Text>
                            <Text style={styles.messageText}>{m.text}</Text>
                            <Text style={styles.messageTimeText}>
                              {m.createdAt
                                ? new Date(m.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : ''}
                            </Text>
                          </View>
                        );
                      })
                    ) : (
                      <View style={styles.initialDescBox}>
                        <Text style={styles.messageText}>{selectedTicket.description}</Text>
                      </View>
                    )}
                  </View>
                </ScrollView>

                {/* Reply Input Row */}
                {selectedTicket.status !== 'Resolved' ? (
                  <View style={styles.replyRow}>
                    <TextInput
                      value={replyText}
                      onChangeText={setReplyText}
                      placeholder="Type your reply here..."
                      placeholderTextColor="#94A3B8"
                      style={styles.replyInput}
                    />
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleSendReply}
                      disabled={sendingReply || !replyText.trim()}
                      style={[
                        styles.sendBtn,
                        (!replyText.trim() || sendingReply) && { opacity: 0.5 }
                      ]}
                    >
                      {sendingReply ? (
                        <ActivityIndicator size="small" color="#111827" />
                      ) : (
                        <Send size={18} color="#111827" strokeWidth={2.4} />
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.resolvedFooter}>
                    <CheckCircle2 size={16} color="#16A34A" style={{ marginRight: 6 }} />
                    <Text style={styles.resolvedFooterText}>
                      This ticket has been marked as resolved.
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </KeyboardAvoidingView>
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

  // Top Yellow Button
  topBtnWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  newRequestBtn: {
    backgroundColor: '#FFC928',
    height: 46,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  newRequestBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 15,
    color: '#111827'
  },

  // Filter Tabs
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 10
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row'
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9'
  },
  tabPillActive: {
    backgroundColor: '#111827'
  },
  tabText: {
    fontFamily: typography.family.medium,
    fontSize: 13,
    color: '#475569'
  },
  tabTextActive: {
    fontFamily: typography.family.bold,
    color: '#FFFFFF'
  },

  // Scroll Content
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32
  },

  // Ticket Card (No shadows)
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 12
  },
  ticketCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  ticketNumberText: {
    fontFamily: typography.family.heavy,
    fontSize: 15.5,
    color: '#111827',
    fontWeight: '800'
  },
  ticketDateText: {
    fontFamily: typography.family.regular,
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 1
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 10
  },
  statusBadgeText: {
    fontFamily: typography.family.bold,
    fontSize: 11.5
  },
  ticketCategoryTitle: {
    fontFamily: typography.family.bold,
    fontSize: 14.5,
    color: '#111827',
    marginBottom: 4
  },
  ticketDescriptionText: {
    fontFamily: typography.family.regular,
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12
  },
  ticketFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 10
  },
  footerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  footerChipText: {
    fontFamily: typography.family.medium,
    fontSize: 11.5,
    color: '#475569'
  },

  // Empty state
  emptyTicketsBox: {
    paddingVertical: 44,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyTicketsTitle: {
    fontFamily: typography.family.bold,
    fontSize: 16,
    color: '#111827',
    marginBottom: 4
  },
  emptyTicketsSub: {
    fontFamily: typography.family.regular,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18
  },

  // Modal styles (No shadows)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.65)',
    justifyContent: 'flex-end'
  },
  newModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderColor: '#E5E7EB',
    padding: 20,
    maxHeight: '85%'
  },
  newModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  newModalTitle: {
    fontFamily: typography.family.heavy,
    fontSize: 18,
    color: '#111827'
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12
  },
  errorBannerText: {
    fontFamily: typography.family.medium,
    fontSize: 12.5,
    color: '#DC2626'
  },
  fieldLabel: {
    fontFamily: typography.family.bold,
    fontSize: 13,
    color: '#334155',
    marginBottom: 6,
    marginTop: 8
  },
  categoryScroll: {
    marginBottom: 10
  },
  categoryChoicePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8
  },
  categoryChoicePillActive: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE047'
  },
  categoryChoiceText: {
    fontFamily: typography.family.medium,
    fontSize: 12.5,
    color: '#475569'
  },
  categoryChoiceTextActive: {
    fontFamily: typography.family.bold,
    color: '#92400E'
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    fontFamily: typography.family.regular,
    marginBottom: 10
  },
  textArea: {
    height: 90
  },
  submitBtn: {
    backgroundColor: '#FFC928',
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10
  },
  submitBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 15,
    color: '#111827'
  },

  // Detail Sheet
  detailSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderColor: '#E5E7EB',
    padding: 20,
    maxHeight: '90%'
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 10
  },
  detailTicketNumber: {
    fontFamily: typography.family.heavy,
    fontSize: 17,
    color: '#111827'
  },
  detailTicketCategory: {
    fontFamily: typography.family.medium,
    fontSize: 12.5,
    color: '#64748B'
  },
  detailMetaBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14
  },
  detailBannerLead: {
    fontFamily: typography.family.medium,
    fontSize: 11,
    color: '#64748B'
  },
  detailBannerStatus: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#111827'
  },
  detailOrderBadge: {
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FEF08A',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  detailOrderText: {
    fontFamily: typography.family.bold,
    fontSize: 11.5,
    color: '#854D0E'
  },
  conversationHeader: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#111827',
    marginBottom: 8
  },
  messagesContainer: {
    gap: 8,
    marginBottom: 12
  },
  messageBubble: {
    borderRadius: 14,
    padding: 10,
    maxWidth: '85%'
  },
  riderBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF08A'
  },
  supportBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  initialDescBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12
  },
  messageSenderLead: {
    fontFamily: typography.family.bold,
    fontSize: 10.5,
    color: '#64748B',
    marginBottom: 2
  },
  messageText: {
    fontFamily: typography.family.regular,
    fontSize: 13,
    color: '#111827',
    lineHeight: 18
  },
  messageTimeText: {
    fontFamily: typography.family.regular,
    fontSize: 10,
    color: '#94A3B8',
    alignSelf: 'flex-end',
    marginTop: 4
  },
  replyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB'
  },
  replyInput: {
    flex: 1,
    height: 42,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 13.5,
    fontFamily: typography.family.regular,
    color: '#111827'
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFC928',
    alignItems: 'center',
    justifyContent: 'center'
  },
  resolvedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    padding: 10,
    marginTop: 8
  },
  resolvedFooterText: {
    fontFamily: typography.family.medium,
    fontSize: 12.5,
    color: '#15803D'
  }
});
