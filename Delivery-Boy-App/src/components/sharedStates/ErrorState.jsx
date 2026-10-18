import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AlertCircle, RotateCw } from 'lucide-react-native';
import { typography } from '../../constants/theme';
import { hapticFeedback } from '../../services/haptics';

export const ErrorState = ({
  title = 'Something went wrong',
  message = "We couldn't load the data. Please try again.",
  onRetry,
  retrying = false,
  style
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Alert Circle Icon */}
      <View style={styles.iconCircle}>
        <AlertCircle size={34} color="#EF4444" strokeWidth={2.2} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      {onRetry && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            hapticFeedback.light?.();
            onRetry();
          }}
          disabled={retrying}
          style={styles.retryBtn}
          accessibilityLabel="Retry"
        >
          {retrying ? (
            <ActivityIndicator size="small" color="#111827" />
          ) : (
            <>
              <RotateCw size={16} color="#111827" strokeWidth={2.4} style={{ marginRight: 6 }} />
              <Text style={styles.retryBtnText}>Retry</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginVertical: 12
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  title: {
    fontFamily: typography.family.bold,
    fontSize: 18,
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8
  },
  message: {
    fontFamily: typography.family.regular,
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 290,
    marginBottom: 20
  },
  retryBtn: {
    backgroundColor: '#FFC928',
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    minWidth: 160
  },
  retryBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#111827'
  }
});
