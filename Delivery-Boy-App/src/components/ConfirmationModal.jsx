import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { X, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { colors, typography, radius, spacing } from '../constants/theme';
import { AppButton } from './AppButton';
import { hapticFeedback } from '../services/haptics';

const DEFAULT_REASONS = [
  'Vehicle problem / breakdown',
  'Store item unavailable / delay',
  'Incorrect / incomplete address',
  'Customer unreachable / phone switched off',
  'Severe weather / road blocked',
  'Personal medical emergency',
  'Other reason'
];

export const ConfirmationModal = ({
  visible,
  onClose,
  onConfirm,
  title = 'Select Cancellation Reason',
  subtitle = 'Please specify why you are declining or cancelling this delivery.',
  confirmText = 'Confirm & Submit',
  loading = false,
  reasons = DEFAULT_REASONS
}) => {
  const [selectedReason, setSelectedReason] = useState(reasons[0]);
  const [details, setDetails] = useState('');

  const handleConfirm = () => {
    if (!selectedReason) return;
    hapticFeedback.warning();
    onConfirm?.({ reason: selectedReason, details });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.alertCircle}>
                <AlertTriangle size={18} color={colors.warning} />
              </View>
              <Text style={styles.title}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>{subtitle}</Text>

          {/* Reason options */}
          <ScrollView style={styles.reasonsList} showsVerticalScrollIndicator={false}>
            {reasons.map((reason) => {
              const isSelected = selectedReason === reason;
              return (
                <TouchableOpacity
                  key={reason}
                  activeOpacity={0.7}
                  onPress={() => {
                    hapticFeedback.selection();
                    setSelectedReason(reason);
                  }}
                  style={[
                    styles.reasonItem,
                    isSelected && styles.reasonItemSelected
                  ]}
                >
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                    {isSelected && <View style={styles.radioInnerDot} />}
                  </View>
                  <Text style={[styles.reasonText, isSelected && styles.reasonTextSelected]}>
                    {reason}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Optional Additional details input */}
            <View style={styles.detailsBox}>
              <Text style={styles.detailsLabel}>Optional Note / Supervisor Remarks</Text>
              <TextInput
                value={details}
                onChangeText={setDetails}
                placeholder="Add extra context here..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={2}
                style={styles.detailsInput}
              />
            </View>
          </ScrollView>

          {/* Buttons */}
          <View style={styles.footerRow}>
            <AppButton
              title="Cancel"
              variant="outline"
              onPress={onClose}
              disabled={loading}
              style={{ flex: 1 }}
            />
            <AppButton
              title={confirmText}
              variant="danger"
              onPress={handleConfirm}
              loading={loading}
              style={{ flex: 1.5 }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.lg,
    maxHeight: '85%'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  alertCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.warningSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm
  },
  title: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.md,
    color: colors.textPrimary
  },
  closeBtn: {
    padding: spacing.xs
  },
  subtitle: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 18
  },
  reasonsList: {
    maxHeight: 280,
    marginBottom: spacing.md
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    marginBottom: spacing.xs,
    backgroundColor: colors.surfaceSubtle
  },
  reasonItemSelected: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.primarySoft
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm
  },
  radioCircleSelected: {
    borderColor: colors.primaryDark
  },
  radioInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryDark
  },
  reasonText: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.xs,
    color: colors.textPrimary,
    flex: 1
  },
  reasonTextSelected: {
    fontFamily: typography.family.bold,
    color: colors.secondary
  },
  detailsBox: {
    marginTop: spacing.sm
  },
  detailsLabel: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs
  },
  detailsInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    minHeight: 50,
    textAlignVertical: 'top'
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight
  }
});
