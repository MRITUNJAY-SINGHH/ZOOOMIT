import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { 
  CheckCircle2, 
  HelpCircle,
  Package
} from 'lucide-react-native';
import { colors, spacing, radius, typography } from '../../constants/theme';
import { StorefrontAPI } from '../../services/api';
import { AppButton } from '../../components/AppButton';

const ISSUE_TYPES = [
  'Damaged Item',
  'Missing Item',
  'Expired Product',
  'Wrong Item',
  'Quality Issue',
  'Delivery Delay',
  'Return Request',
  'Other'
];

export default function IssueReportingScreen() {
  const params = useLocalSearchParams();
  const id = params?.id || params?.orderId;

  const [selectedItemId, setSelectedItemId] = useState(null);
  const [issueType, setIssueType] = useState(ISSUE_TYPES[0]);
  const [returnQty, setReturnQty] = useState('1');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketResult, setTicketResult] = useState(null);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order-details', id],
    queryFn: async () => {
      const res = await StorefrontAPI.getOrderDetails(id);
      return res.data?.data;
    },
    enabled: Boolean(id)
  });

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.black} />
      </View>
    );
  }

  const selectedItem = order?.items?.find((i) => i._id === selectedItemId) || order?.items?.[0];
  const maxEligibleQty = selectedItem ? (selectedItem.qty - (selectedItem.returnedQty || 0)) : 1;

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Description Required', 'Please provide details about the problem with your order.');
      return;
    }

    const qty = parseFloat(returnQty) || 1;
    if (qty <= 0 || qty > maxEligibleQty) {
      Alert.alert('Invalid Quantity', `Return quantity must be between 1 and ${maxEligibleQty}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await StorefrontAPI.createSupportTicket({
        orderId: order._id,
        orderItemId: selectedItem?._id,
        issueType,
        description: description.trim(),
        requestedReturnQty: qty
      });
      setTicketResult(res.data?.data);
    } catch (e) {
      Alert.alert('Submission Failed', e.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (ticketResult) {
    return (
      <View style={[styles.container, styles.centered, { padding: spacing.xl }]}>
        <View style={styles.successCard}>
          <CheckCircle2 size={54} color={colors.success} style={{ marginBottom: spacing.md }} />
          <Text style={styles.successTitle}>Ticket #{ticketResult.ticketNumber}</Text>
          <Text style={styles.successDesc}>
            Your support request has been registered. Our customer resolution team will review your request within 2-4 hours.
          </Text>

          <View style={styles.ticketDetailsBox}>
            <Text style={styles.ticketDetailRow}>
              <Text style={{ fontFamily: typography.family.bold }}>Status: </Text>{ticketResult.status}
            </Text>
            <Text style={styles.ticketDetailRow}>
              <Text style={{ fontFamily: typography.family.bold }}>Issue: </Text>{ticketResult.issueType}
            </Text>
            {ticketResult.refundAmount > 0 && (
              <Text style={styles.ticketDetailRow}>
                <Text style={{ fontFamily: typography.family.bold }}>Eligible Refund: </Text>₹{ticketResult.refundAmount}
              </Text>
            )}
          </View>

          <AppButton
            title="Back to Order Details"
            onPress={() => router.back()}
            variant="primary"
          />
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.xl }}>
      <View style={styles.header}>
        <HelpCircle size={28} color={colors.black} style={{ marginBottom: spacing.xs }} />
        <Text style={styles.title}>Report Problem or Return</Text>
        <Text style={styles.subtitle}>Order #{order?.orderNumber}</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionLabel}>Select the product with an issue:</Text>
        {order?.items?.map((item) => {
          const isSelected = (selectedItemId || order?.items?.[0]?._id) === item._id;
          return (
            <TouchableOpacity
              key={item._id}
              style={[styles.itemChoice, isSelected && styles.itemChoiceSelected]}
              onPress={() => setSelectedItemId(item._id)}
            >
              <Package size={20} color={isSelected ? colors.black : colors.textMuted} style={{ marginRight: spacing.sm }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemChoiceName, isSelected && styles.itemChoiceNameSelected]}>
                  {item.productName}
                </Text>
                <Text style={styles.itemChoiceMeta}>
                  Ordered: {item.qty} {item.unit} • ₹{item.price} each
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>What went wrong?</Text>
        <View style={styles.typesGrid}>
          {ISSUE_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.typePill, issueType === type && styles.typePillActive]}
              onPress={() => setIssueType(type)}
            >
              <Text style={[styles.typePillText, issueType === type && styles.typePillTextActive]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>
          Affected Quantity (Max {maxEligibleQty}):
        </Text>
        <TextInput
          style={styles.qtyInput}
          value={returnQty}
          onChangeText={setReturnQty}
          keyboardType="numeric"
          placeholder="e.g. 1"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>Description:</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Please describe the issue in detail..."
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        <AppButton
          title="Submit Support Ticket"
          onPress={handleSubmit}
          loading={isSubmitting}
          variant="primary"
          style={{ marginTop: spacing.xl }}
        />
      </View>
    </ScrollView>
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
    marginBottom: spacing.lg,
    alignItems: 'center'
  },
  title: {
    fontSize: typography.size.xl,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    marginTop: spacing.xs
  },
  subtitle: {
    fontSize: typography.size.sm,
    fontFamily: typography.family.regular,
    color: colors.textSecondary
  },
  formCard: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight
  },
  sectionLabel: {
    fontSize: typography.size.sm,
    fontFamily: typography.family.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm
  },
  itemChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.sm,
    backgroundColor: colors.softBackground
  },
  itemChoiceSelected: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.primarySoft,
    borderWidth: 1
  },
  itemChoiceName: {
    fontSize: typography.size.sm,
    fontFamily: typography.family.medium,
    color: colors.textPrimary
  },
  itemChoiceNameSelected: {
    color: colors.textPrimary,
    fontFamily: typography.family.bold
  },
  itemChoiceMeta: {
    fontSize: typography.size.xs,
    fontFamily: typography.family.regular,
    color: colors.textMuted,
    marginTop: 2
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2
  },
  typePill: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.white
  },
  typePillActive: {
    backgroundColor: colors.primary,
    borderWidth: 0,
    borderColor: 'transparent'
  },
  typePillText: {
    fontSize: typography.size.xs,
    fontFamily: typography.family.medium,
    color: colors.textSecondary
  },
  typePillTextActive: {
    color: colors.black,
    fontFamily: typography.family.bold
  },
  qtyInput: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 14,
    padding: spacing.md,
    fontSize: 16,
    fontFamily: typography.family.regular,
    color: colors.textPrimary,
    backgroundColor: colors.white
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 14,
    padding: spacing.md,
    fontSize: 15,
    fontFamily: typography.family.regular,
    color: colors.textPrimary,
    backgroundColor: colors.white,
    minHeight: 100,
    textAlignVertical: 'top'
  },
  successCard: {
    backgroundColor: colors.white,
    padding: spacing.xxl,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: colors.borderLight
  },
  successTitle: {
    fontSize: typography.size['2xl'],
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  successDesc: {
    fontSize: typography.size.sm,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg
  },
  ticketDetailsBox: {
    width: '100%',
    backgroundColor: colors.softBackground,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight
  },
  ticketDetailRow: {
    fontSize: typography.size.xs,
    fontFamily: typography.family.regular,
    color: colors.textPrimary,
    marginBottom: 4
  }
});
