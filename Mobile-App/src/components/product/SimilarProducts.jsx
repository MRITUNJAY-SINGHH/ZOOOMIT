import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, typography } from '../../constants/theme';
import { ProductCard } from './ProductCard';

export const SimilarProducts = ({ products = [], onProductPress }) => {
  if (!products || products.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Similar Products</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {products.map((item) => (
          <ProductCard
            key={item._id}
            product={item}
            compact={true}
            onPress={onProductPress}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16
  },
  heading: {
    fontSize: 16,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    marginBottom: 12
  },
  scrollContent: {
    paddingRight: 16
  }
});
