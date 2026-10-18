import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WifiOff, RotateCw, LogOut } from 'lucide-react-native';
import { typography } from '../../constants/theme';
import { hapticFeedback } from '../../services/haptics';

export const NetworkErrorState = ({
  onRetry,
  onGoOffline,
  retrying = false,
  title = 'No Internet Connection',
  message = 'Please check your internet connection and try again.',
  style
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Disconnected Wi-Fi Icon Circle */}
      <View style={styles.iconCircle}>
        <WifiOff size={34} color="#111827" strokeWidth={2.2} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      {/* Action Buttons Row */}
      <View style={styles.buttonRow}>
        {onRetry && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              hapticFeedback.light?.();
              onRetry();
            }}
            disabled={retrying}
            style={[styles.btn, styles.retryBtn]}
            accessibilityLabel="Retry Connection"
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

        {onGoOffline && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              hapticFeedback.light?.();
              onGoOffline();
            }}
            style={[styles.btn, styles.goOfflineBtn]}
            accessibilityLabel="Go Offline"
          >
            <LogOut size={16} color="#111827" strokeWidth={2.2} style={{ marginRight: 6 }} />
            <Text style={styles.goOfflineBtnText}>Go Offline</Text>
          </TouchableOpacity>
        )}
      </View>
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
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
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
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    maxWidth: 320
  },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16
  },
  retryBtn: {
    backgroundColor: '#FFC928'
  },
  retryBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#111827'
  },
  goOfflineBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB'
  },
  goOfflineBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 14,
    color: '#111827'
  }
});
