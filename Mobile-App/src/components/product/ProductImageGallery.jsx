import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  Pressable,
  Share,
  Platform
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ArrowLeft, Share2, Layers, Zap } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography } from '../../constants/theme';
import { ProductSaveButton } from './ProductSaveButton';
import { haptics } from '../../services/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ProductImageGallery = ({
  product,
  onViewSimilar
}) => {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);

  const images = (product?.galleryImages && product.galleryImages.length > 0)
    ? product.galleryImages
    : [product?.featuredImage || 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=800'];

  const handleScroll = (event) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (slide !== activeIndex && slide >= 0 && slide < images.length) {
      setActiveIndex(slide);
    }
  };

  const handleShare = async () => {
    haptics.selection();
    try {
      await Share.share({
        message: `Check out ${product?.name} on Zooom.`,
        title: product?.name
      });
    } catch (e) {
      // Ignore share cancellation
    }
  };

  const handleBack = () => {
    haptics.impactLight();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Floating Action Bar */}
      <View style={[styles.topActionBar, { top: Math.max(insets.top, 12) + 6 }]}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.circleBtn,
            pressed && { transform: [{ scale: 0.92 }] }
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} color={colors.textPrimary} strokeWidth={2.4} />
        </Pressable>

        <View style={styles.rightActionsRow}>
          <ProductSaveButton 
            product={product} 
            size={19} 
            variant="circle" 
          />
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [
              styles.circleBtn,
              pressed && { transform: [{ scale: 0.92 }] }
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Share product"
          >
            <Share2 size={18} color={colors.textPrimary} strokeWidth={2.2} />
          </Pressable>
        </View>
      </View>

      {/* Horizontal Image Carousel */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={styles.carouselScroll}
      >
        {images.map((imgUri, idx) => (
          <View key={idx} style={styles.slide}>
            <Image
              source={{ uri: imgUri }}
              style={styles.heroImage}
              contentFit="contain"
              transition={200}
            />
          </View>
        ))}
      </ScrollView>

      {/* Bottom Overlay Elements on Hero */}
      <View style={styles.bottomHeroOverlay}>
        {/* Delivery ETA Badge */}
        {Boolean(product?.deliveryTime) && <View style={styles.deliveryBadge}>
          <Zap size={13} color="#D97706" fill="#D97706" />
          <Text style={styles.deliveryBadgeText}>
            {product.deliveryTime}
          </Text>
        </View>}

        {/* Pagination Dots */}
        {images.length > 1 && (
          <View style={styles.dotsRow}>
            {images.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  idx === activeIndex ? styles.dotActive : styles.dotInactive
                ]}
              />
            ))}
          </View>
        )}

        {/* View Similar Floating Pill */}
        {Boolean(onViewSimilar) && (
          <Pressable
            onPress={() => {
              haptics.selection();
              onViewSimilar();
            }}
            style={({ pressed }) => [
              styles.viewSimilarBtn,
              pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] }
            ]}
            accessibilityRole="button"
            accessibilityLabel="View similar products"
          >
            <Layers size={14} color={colors.textPrimary} strokeWidth={2} style={{ marginRight: 5 }} />
            <Text style={styles.viewSimilarText}>View Similar</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 380,
    backgroundColor: '#F8F9FA',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight
  },
  topActionBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  carouselScroll: {
    width: SCREEN_WIDTH,
    height: '100%'
  },
  slide: {
    width: SCREEN_WIDTH,
    height: 380,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60
  },
  heroImage: {
    width: '100%',
    height: '100%'
  },
  bottomHeroOverlay: {
    position: 'absolute',
    bottom: 14,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10
  },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)'
  },
  deliveryBadgeText: {
    fontSize: 12,
    fontFamily: typography.family.bold,
    color: '#D97706',
    letterSpacing: 0.3
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 14
  },
  dotInactive: {
    backgroundColor: 'rgba(0, 0, 0, 0.22)'
  },
  viewSimilarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)'
  },
  viewSimilarText: {
    fontSize: 12,
    fontFamily: typography.family.semibold,
    color: colors.textPrimary
  }
});
