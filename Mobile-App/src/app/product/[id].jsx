import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { typography } from '../../constants/theme';
import { api } from '../../services/api';
import { ProductImageGallery } from '../../components/product/ProductImageGallery';
import { ProductVariantSelector } from '../../components/product/ProductVariantSelector';
import { SimilarProducts } from '../../components/product/SimilarProducts';
import { ProductBottomBar } from '../../components/product/ProductBottomBar';
import { ErrorState } from '../../components/ErrorState';

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams();
  const raw = Array.isArray(id) ? id[0] : id;
  const cleanId = String(raw || '').trim();
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const { data: product, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['product-details', cleanId], enabled: Boolean(cleanId),
    queryFn: async () => {
      const res = await api.get(`/products/${encodeURIComponent(cleanId)}`);
      const data = res.data?.data ?? res.data;
      if (!data?.name) throw new Error('This product is unavailable.');
      return data;
    }
  });
  if (isLoading) return <View style={[styles.container, styles.centered]}><ActivityIndicator size="large" color="#1769FF" /><Text style={styles.muted}>Loading product...</Text></View>;
  if (isError || !product) return <View style={styles.container}><ErrorState title="Product unavailable" message={error?.message || 'This product could not be loaded.'} onRetry={refetch} /></View>;
  const variants = product.variants || [];
  const selectedVariant = variants.find(v => v._id === selectedVariantId) || variants[0] || null;
  const price = Number(selectedVariant?.sellingPrice ?? product.sellingPrice ?? 0);
  const mrp = Number(selectedVariant?.mrp ?? product.mrp ?? 0);
  const categoryId = product.category?._id || (typeof product.category === 'string' ? product.category : null);
  return <View style={styles.container}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
      <ProductImageGallery product={product} />
      <View style={styles.info}>
        <Text style={styles.name}>{product.name}</Text>
        {Boolean(product.subtitle) && <Text style={styles.muted}>{product.subtitle}</Text>}
        <Text style={styles.unit}>{selectedVariant?.name || `${product.minSaleQty || 1} ${product.sellingUnit || product.baseUnit || 'PCS'}`}</Text>
        <View style={styles.priceRow}><Text style={styles.price}>₹{price}</Text>{mrp > price && <><Text style={styles.mrp}>₹{mrp}</Text><Text style={styles.discount}>{Math.round((mrp - price) / mrp * 100)}% OFF</Text></>}</View>
        {variants.length > 0 && <ProductVariantSelector variants={variants} selectedVariantId={selectedVariant?._id} onSelectVariant={setSelectedVariantId} defaultProduct={product} />}
      </View>
      <View style={[styles.section, { padding: 20 }]}><Text style={styles.name}>Product details</Text><Text style={styles.muted}>{product.description || 'No description provided by the store.'}</Text>{Boolean(product.brand) && <Text style={styles.muted}>Brand: {product.brand}</Text>}{Boolean(product.storageInfo) && <Text style={styles.muted}>Storage: {product.storageInfo}</Text>}</View>
      {categoryId && <Pressable style={styles.category} onPress={() => router.push(`/category/${categoryId}`)}><Text style={styles.categoryText}>Explore {product.category?.name || 'this category'}</Text><ChevronRight size={18} color="#1769FF" /></Pressable>}
      {product.similarProducts?.length > 0 && <View style={styles.section}><SimilarProducts products={product.similarProducts} /></View>}
      
    </ScrollView>
    <ProductBottomBar product={product} selectedVariant={selectedVariant} />
  </View>;
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' }, centered: { alignItems: 'center', justifyContent: 'center', gap: 12 }, scroll: { paddingBottom: 120 },
  info: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#EDF0EB' }, name: { fontFamily: typography.family.bold, fontSize: 22, lineHeight: 28, color: '#222A20' }, muted: { color: '#788074', fontSize: 13, marginTop: 6 }, unit: { fontSize: 13, color: '#788074', marginTop: 10, marginBottom: 8 }, priceRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 16 }, price: { fontSize: 23, fontFamily: typography.family.bold, color: '#222A20' }, mrp: { color: '#939A8F', textDecorationLine: 'line-through', fontSize: 14 }, discount: { color: '#218755', fontFamily: typography.family.bold, fontSize: 12 },
  section: { paddingVertical: 8, backgroundColor: '#fff', borderBottomWidth: 6, borderBottomColor: '#F7F8F5' }, category: { margin: 16, padding: 16, borderRadius: 12, backgroundColor: '#EEF5FF', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, categoryText: { color: '#1769FF', fontFamily: typography.family.medium, fontSize: 13 }
});
