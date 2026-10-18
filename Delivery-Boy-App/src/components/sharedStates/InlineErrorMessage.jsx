import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertCircle, X, RotateCw } from 'lucide-react-native';
import { typography } from '../../constants/theme';

export const InlineErrorMessage = ({
  message,
  onDismiss,
  onRetry,
  style
}) => {
  if (!message) return null;

  return (
    <View style={[styles.container, style]}>
      <AlertCircle size={18} color="#DC2626" strokeWidth={2.2} style={styles.icon} />
      <Text style={styles.messageText} numberOfLines={2}>
        {message}
      </Text>

      {onRetry && (
        <TouchableOpacity activeOpacity={0.7} onPress={onRetry} style={styles.retryBtn}>
          <RotateCw size={13} color="#DC2626" strokeWidth={2.4} style={{ marginRight: 3 }} />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      )}

      {onDismiss && (
        <TouchableOpacity activeOpacity={0.7} onPress={onDismiss} style={styles.closeBtn}>
          <X size={16} color="#991B1B" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 8
  },
  icon: {
    marginRight: 8
  },
  messageText: {
    flex: 1,
    fontFamily: typography.family.medium,
    fontSize: 13,
    color: '#991B1B',
    lineHeight: 18
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 6
  },
  retryText: {
    fontFamily: typography.family.bold,
    fontSize: 11.5,
    color: '#DC2626'
  },
  closeBtn: {
    padding: 4,
    marginLeft: 6
  }
});
