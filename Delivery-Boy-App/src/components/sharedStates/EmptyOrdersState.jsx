import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FileSearch, Sparkles } from 'lucide-react-native';
import { typography } from '../../constants/theme';
import { hapticFeedback } from '../../services/haptics';

export const EmptyOrdersState = ({
  title = 'No Orders Yet',
  message = 'New delivery offers will appear here when available. Keep your app online to receive orders.',
  actionTitle,
  onAction,
  style
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Document with Magnifying Glass Graphic */}
      <View style={styles.iconBox}>
        <View style={styles.sheetTop} />
        <FileSearch size={38} color="#2563EB" strokeWidth={2} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      {actionTitle && onAction && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            hapticFeedback.light?.();
            onAction();
          }}
          style={styles.actionBtn}
        >
          <Sparkles size={15} color="#111827" style={{ marginRight: 6 }} />
          <Text style={styles.actionBtnText}>{actionTitle}</Text>
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
    paddingVertical: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginVertical: 12
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative'
  },
  sheetTop: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 14,
    height: 14,
    backgroundColor: '#BFDBFE',
    borderBottomLeftRadius: 6
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
    maxWidth: 290
  },
  actionBtn: {
    marginTop: 18,
    backgroundColor: '#FFC928',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionBtnText: {
    fontFamily: typography.family.bold,
    fontSize: 13.5,
    color: '#111827'
  }
});
