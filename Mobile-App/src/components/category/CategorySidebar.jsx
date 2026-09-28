import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { colors, typography } from '../../constants/theme';
import { haptics } from '../../services/haptics';

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

    const imageUrl = item.image || item.iconUrl || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200';

    return (
      <Pressable
        onPress={handlePress}
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
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={150}
          />
        </View>

        <Text
          style={[styles.nameText, isSelected && styles.nameTextSelected]}
          numberOfLines={2}
        >
          {item.name}
        </Text>
      </Pressable>
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
    width: 78,
    backgroundColor: '#FAFAFA',
    borderRightWidth: 1,
    borderRightColor: colors.borderLight,
    height: '100%'
  },
  listContent: {
    paddingVertical: 8
  },
  itemContainer: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'transparent'
  },
  itemSelected: {
    backgroundColor: colors.white
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
    backgroundColor: colors.primary,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3
  },
  imageWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6
  },
  imageWrapSelected: {
    borderColor: colors.primary,
    borderWidth: 1.5
  },
  image: {
    width: '100%',
    height: '100%'
  },
  nameText: {
    fontFamily: typography.family.medium,
    fontSize: 10.5,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 13,
    paddingHorizontal: 2
  },
  nameTextSelected: {
    fontFamily: typography.family.bold,
    color: '#111827',
    fontWeight: '700'
  }
});
