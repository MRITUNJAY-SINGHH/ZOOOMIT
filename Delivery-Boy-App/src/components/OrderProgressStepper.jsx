import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Check, AlertTriangle } from 'lucide-react-native';
import { colors, typography } from '../constants/theme';

export const ORDER_STAGES = [
  { key: 'assigned', label: 'Assigned', step: 1 },
  { key: 'accepted', label: 'Accepted', step: 2 },
  { key: 'pickup', label: 'Pickup', step: 3 },
  { key: 'out_for_delivery', label: 'Out for Delivery', step: 4 },
  { key: 'completed', label: 'Completed', step: 5 }
];

export function mapStatusToStepIndex(status, activeView) {
  if (status === 'Cancelled' || activeView === 'cancel') return -1;
  if (status === 'Delivered' || status === 'Completed' || activeView === 'completed') return 4;
  if (status === 'Out For Delivery' || status === 'OutForDelivery' || activeView === 'customer_nav' || activeView === 'otp') {
    return 3;
  }
  if (status === 'Picked Up' || status === 'Arrived at Store' || activeView === 'pickup_nav' || activeView === 'checklist') {
    return 2;
  }
  if (status === 'Accepted') {
    if (activeView === 'pickup_nav' || activeView === 'checklist') return 2;
    return 1;
  }
  if (status === 'Assigned' || status === 'Pending') {
    return 0;
  }
  return 1;
}

export function OrderProgressStepper({
  currentStage,
  activeStepIndex = null,
  isCancelled = false,
  cancelReason = '',
  style = null
}) {
  // Resolve effective active step index
  let activeIndex = 0;
  if (isCancelled || currentStage === 'Cancelled') {
    activeIndex = -1;
  } else if (typeof activeStepIndex === 'number') {
    activeIndex = activeStepIndex;
  } else if (currentStage) {
    activeIndex = mapStatusToStepIndex(currentStage);
  }

  if (isCancelled || activeIndex === -1) {
    return (
      <View style={[styles.cancelledBanner, style]}>
        <View style={styles.cancelledIconCircle}>
          <AlertTriangle size={15} color="#DC2626" strokeWidth={2.4} />
        </View>
        <View style={styles.cancelledTextCol}>
          <Text style={styles.cancelledTitle}>Order Cancelled</Text>
          <Text style={styles.cancelledSub} numberOfLines={1}>
            {cancelReason || 'Returned to dispatch for reassignment'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {ORDER_STAGES.map((stage, idx) => {
          const isCompleted = idx < activeIndex;
          const isActive = idx === activeIndex;
          const isUpcoming = idx > activeIndex;
          const isLast = idx === ORDER_STAGES.length - 1;

          return (
            <React.Fragment key={stage.key}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.circle,
                    isCompleted && styles.circleCompleted,
                    isActive && styles.circleActive,
                    isUpcoming && styles.circleUpcoming
                  ]}
                >
                  {isCompleted ? (
                    <Check size={12} color="#FFFFFF" strokeWidth={3} />
                  ) : (
                    <Text
                      style={[
                        styles.circleNumber,
                        isActive && styles.circleNumberActive,
                        isUpcoming && styles.circleNumberUpcoming
                      ]}
                    >
                      {stage.step}
                    </Text>
                  )}
                </View>

                <Text
                  style={[
                    styles.label,
                    isCompleted && styles.labelCompleted,
                    isActive && styles.labelActive,
                    isUpcoming && styles.labelUpcoming
                  ]}
                  numberOfLines={1}
                >
                  {stage.label}
                </Text>
              </View>

              {!isLast && (
                <View style={styles.connectorWrapper}>
                  <View
                    style={[
                      styles.connectorLine,
                      isCompleted ? styles.connectorCompleted : styles.connectorUpcoming
                    ]}
                  />
                </View>
              )}
            </React.Fragment>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 10,
    marginBottom: 12
  },
  scrollContent: {
    paddingHorizontal: 14,
    alignItems: 'center',
    flexDirection: 'row'
  },
  stepItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 54
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: 4
  },
  circleCompleted: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A'
  },
  circleActive: {
    backgroundColor: '#FFC928',
    borderColor: '#D97706'
  },
  circleUpcoming: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1'
  },
  circleNumber: {
    fontFamily: typography.family.heavy,
    fontSize: 11
  },
  circleNumberActive: {
    color: '#111827'
  },
  circleNumberUpcoming: {
    color: '#94A3B8'
  },
  label: {
    fontSize: 11,
    textAlign: 'center'
  },
  labelCompleted: {
    fontFamily: typography.family.bold,
    color: '#15803D'
  },
  labelActive: {
    fontFamily: typography.family.heavy,
    color: '#111827'
  },
  labelUpcoming: {
    fontFamily: typography.family.regular,
    color: '#94A3B8'
  },
  connectorWrapper: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  connectorLine: {
    width: '100%',
    height: 2,
    borderRadius: 1
  },
  connectorCompleted: {
    backgroundColor: '#16A34A'
  },
  connectorUpcoming: {
    backgroundColor: '#E2E8F0'
  },
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12
  },
  cancelledIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  cancelledTextCol: {
    flex: 1
  },
  cancelledTitle: {
    fontFamily: typography.family.bold,
    fontSize: 13,
    color: '#DC2626'
  },
  cancelledSub: {
    fontFamily: typography.family.regular,
    fontSize: 11.5,
    color: '#7F1D1D',
    marginTop: 1
  }
});
