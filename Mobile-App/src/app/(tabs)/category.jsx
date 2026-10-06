import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Search, LayoutGrid, ChevronRight } from 'lucide-react-native';
import { typography } from '../../constants/theme';
import { StorefrontAPI } from '../../services/api';
import { haptics } from '../../services/haptics';

const idOf = (category) => typeof category === 'string' ? category : category?._id || category?.id;
const isActive = (category) => category?.status === 'Active';

// The API returns children both as flat entries and inside their parents.
// Merge by ID so every active child appears once, under its actual parent.
export function buildCategorySections(categories) {
  const entries = new Map();
  const add = (category, parentId) => {
    const id = idOf(category);
    if (!id) return;
    const old = entries.get(id);
    entries.set(id, { ...old, ...category, parentCategory: idOf(category.parentCategory) || parentId || old?.parentCategory || null });
    (category.subcategories || []).forEach((child) => add(child, id));
  };
  categories.forEach((category) => add(category));
  const all = [...entries.values()];
  const referenceOrder = ['fresh items', 'grocery & kitchen', 'snacks & drinks'];
  return all.filter((category) => !category.parentCategory && isActive(category)).map((parent) => ({
    parent,
    children: all.filter((category) => category.parentCategory === idOf(parent) && isActive(category)),
  })).sort((a, b) => {
    const position = (parent) => { const index = referenceOrder.indexOf(parent.name?.toLowerCase()); return index < 0 ? referenceOrder.length : index; };
    return position(a.parent) - position(b.parent);
  });
}

function CategoryTile({ category, onPress }) {
  const [failed, setFailed] = useState(false);
  return (
    <Pressable style={styles.tile} onPress={onPress} accessibilityRole="button" accessibilityLabel={`Shop ${category.name}`}>
      <View style={styles.art}>
        {category.image && !failed ? (
          <Image source={{ uri: category.image }} style={styles.image} contentFit="contain" onError={() => setFailed(true)} />
        ) : <LayoutGrid size={30} color="#78A5C1" />}
      </View>
      <Text style={styles.tileName}>{category.name}</Text>
    </Pressable>
  );
}

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const categoriesQuery = useQuery({
    queryKey: ['categories-with-subcategories'],
    queryFn: async () => {
      const response = await StorefrontAPI.getCategories({ includeSubcategories: 'true' });
      const categories = response.data?.data ?? response.data;
      if (!Array.isArray(categories)) throw new Error('Invalid store categories');
      return categories;
    },
    staleTime: 0,
  });
  const sections = useMemo(() => buildCategorySections(categoriesQuery.data || []), [categoriesQuery.data]);
  const openCategory = (category) => {
    haptics.selection();
    router.push({ pathname: '/category/[id]', params: { id: idOf(category) } });
  };
  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Categories</Text>
        <Pressable style={styles.search} accessibilityRole="button" accessibilityLabel="Search products" onPress={() => router.push('/(tabs)/search')}>
          <Search size={22} color="#17212B" />
        </Pressable>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: 164 + insets.bottom }]} refreshControl={<RefreshControl refreshing={categoriesQuery.isRefetching} onRefresh={categoriesQuery.refetch} tintColor="#0066FF" />}>
        {categoriesQuery.isLoading && <View style={styles.state}><ActivityIndicator color="#0066FF" /><Text style={styles.stateText}>Loading categories...</Text></View>}
        {categoriesQuery.isError && <View style={styles.state}><Text style={styles.stateTitle}>Couldn't load categories</Text><Text style={styles.stateText}>Check your connection and try again.</Text><Pressable onPress={() => categoriesQuery.refetch()} style={styles.retry}><Text style={styles.retryText}>Retry</Text></Pressable></View>}
        {!categoriesQuery.isLoading && !categoriesQuery.isError && !sections.length && <View style={styles.state}><Text style={styles.stateTitle}>No categories yet</Text><Text style={styles.stateText}>Active store categories will appear here.</Text></View>}
        {sections.map(({ parent, children }) => (
          <View key={idOf(parent)} style={styles.section}>
            <Pressable style={styles.headingRow} onPress={() => openCategory(parent)} accessibilityRole="button" accessibilityLabel={`Shop all ${parent.name}`}>
              <Text style={styles.heading}>{parent.name}</Text><ChevronRight size={17} color="#62717D" />
            </Pressable>
            <View style={styles.grid}>
              {(children.length ? children : [parent]).map((category) => <CategoryTile key={idOf(category)} category={category} onPress={() => openCategory(category)} />)}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 18, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#F1F3F5' },
  title: { fontFamily: typography.family.bold, fontSize: 23, color: '#17212B' },
  search: { padding: 9 },
  content: { paddingTop: 20, paddingHorizontal: 10 },
  section: { marginBottom: 24 },
  headingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, marginBottom: 12, minHeight: 24 },
  heading: { flex: 1, fontFamily: typography.family.bold, fontSize: 18, color: '#20262C' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' },
  tile: { width: '25%', paddingHorizontal: 4, marginBottom: 16, alignItems: 'center' },
  art: { width: '100%', aspectRatio: 0.9, borderRadius: 12, backgroundColor: '#EEF8FD', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  tileName: { fontFamily: typography.family.bold, fontSize: 13, lineHeight: 17, color: '#20262C', textAlign: 'center', paddingTop: 8, width: '100%' },
  state: { padding: 30, alignItems: 'center', gap: 12 },
  stateTitle: { fontFamily: typography.family.bold, fontSize: 17, color: '#17212B', textAlign: 'center' },
  stateText: { fontFamily: typography.family.medium, fontSize: 14, color: '#687582', textAlign: 'center' },
  retry: { backgroundColor: '#EDF5FF', borderRadius: 10, paddingHorizontal: 22, paddingVertical: 12 },
  retryText: { fontFamily: typography.family.bold, color: '#0066FF' },
});
