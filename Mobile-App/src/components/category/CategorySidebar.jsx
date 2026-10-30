import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LayoutGrid } from 'lucide-react-native';
import { colors, typography } from '../../constants/theme';
import { haptics } from '../../services/haptics';

function CategorySidebarItem({ item, isSelected, onSelect }) {
  const [imgFailed, setImgFailed] = useState(false);
  const imageUrl = item.image || item.iconUrl;

  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        styles.itemContainer,
        isSelected && styles.itemSelected,
        pressed && styles.itemPressed
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={item.name}
    >
      {/* Selected Left Indicator Strip */}
      {isSelected && <View style={styles.selectedIndicator} />}

      <View style={[styles.imageWrap, isSelected && styles.imageWrapSelected]}>
        {imageUrl && !imgFailed ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="contain"
            transition={150}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <LayoutGrid size={22} color={isSelected ? '#111827' : '#9CA3AF'} />
        )}
      </View>

      <Text
        style={[styles.nameText, isSelected && styles.nameTextSelected]}
        numberOfLines={2}
      >
        {item.name}
      </Text>
    </Pressable>
  );
}

export const CategorySidebar = ({
  categories = [],
  selectedCategoryId,
  onSelectCategory,
  style
}) => {
  if (!categories || categories.length === 0) return null;

  const renderCategoryItem = ({ item }) => {
    const isSelected = selectedCategoryId === item._id || selectedCategoryId === item.slug;

    const handlePress = () => {
      haptics.selection();
      if (onSelectCategory) {
        onSelectCategory(item);
      }
    };

    return (
      <CategorySidebarItem
        item={item}
        isSelected={isSelected}
        onSelect={handlePress}
      />
    );
  };

  return (
    <View style={[styles.container, style]}>
      <FlatList
        data={categories}
        keyExtractor={(item) => item._id || item.slug || item.name}
        renderItem={renderCategoryItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 76,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#F3F4F6',
    height: '100%'
  },
  listContent: {
    paddingVertical: 8
  },
  itemContainer: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'transparent'
  },
  itemSelected: {
    backgroundColor: '#FFFDF5'
  },
  itemPressed: {
    opacity: 0.85
  },
  selectedIndicator: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3.5,
    backgroundColor: '#FEDC4A',
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3
  },
  imageWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5
  },
  imageWrapSelected: {
    borderColor: '#FEDC4A',
    borderWidth: 1.5,
    backgroundColor: '#FEFCE8'
  },
  image: {
    width: '88%',
    height: '88%'
  },
  nameText: {
    fontFamily: typography.family.medium,
    fontSize: 10.5,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: 2
  },
  nameTextSelected: {
    fontFamily: typography.family.bold,
    color: '#111827'
  }
});
