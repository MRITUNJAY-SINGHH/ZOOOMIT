import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { typography } from '../../constants/theme';

export const LoadingSkeleton = ({
  message = 'Loading your orders...',
  cardsCount = 2,
  style
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Yellow Circular Indicator */}
      <View style={styles.spinnerWrapper}>
        <ActivityIndicator size="large" color="#FFC928" />
      </View>

      <Text style={styles.messageText}>{message}</Text>

      {/* Skeleton Placeholder Cards */}
      <View style={styles.skeletonsContainer}>
        {Array.from({ length: cardsCount }).map((_, idx) => (
          <View key={`skel_${idx}`} style={styles.skeletonCard}>
            <View style={styles.skeletonHeaderRow}>
              <View style={styles.skeletonPillSmall} />
              <View style={styles.skeletonPillMedium} />
            </View>

            <View style={styles.skeletonDivider} />

            <View style={styles.skeletonBody}>
              <View style={styles.skeletonLineFull} />
              <View style={styles.skeletonLineHalf} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16
  },
  spinnerWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFDF5',
    borderWidth: 1.5,
    borderColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14
  },
  messageText: {
    fontFamily: typography.family.bold,
    fontSize: 15,
    color: '#111827',
    textAlign: 'center',
    marginBottom: 20
  },
  skeletonsContainer: {
    width: '100%',
    gap: 12
  },
  skeletonCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 16
  },
  skeletonHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  skeletonPillSmall: {
    width: 80,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F1F5F9'
  },
  skeletonPillMedium: {
    width: 60,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F1F5F9'
  },
  skeletonDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 12
  },
  skeletonBody: {
    gap: 8
  },
  skeletonLineFull: {
    width: '100%',
    height: 14,
    borderRadius: 7,
    backgroundColor: '#F1F5F9'
  },
  skeletonLineHalf: {
    width: '60%',
    height: 14,
    borderRadius: 7,
    backgroundColor: '#F1F5F9'
  }
});
