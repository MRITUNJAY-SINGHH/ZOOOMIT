import React from 'react';
import { StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { Bookmark } from 'lucide-react-native';
import { useWishlist } from '../../context/WishlistContext';
import { haptics } from '../../services/haptics';

export const ProductSaveButton = ({ 
  product, 
  size = 17, 
  variant = 'card', 
  style 
}) => {
  const { isSaved, toggleSave } = useWishlist();
  const saved = isSaved(product?._id);

  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const handlePress = async (e) => {
    e?.stopPropagation?.();
    haptics.impactLight();

    if (!saved) {
      // Top-to-bottom physical drop animation
      translateY.value = -22;
      translateY.value = withSequence(
        withTiming(-16, { duration: 35 }),
        withSpring(4, { damping: 9, stiffness: 280, mass: 0.85 }),
        withSpring(0, { damping: 12, stiffness: 220 })
      );

      scale.value = withSequence(
        withTiming(0.8, { duration: 40 }),
        withSpring(1.24, { damping: 8, stiffness: 300 }),
        withSpring(1, { damping: 12, stiffness: 220 })
      );
    } else {
      // Unsave subtle bounce
      scale.value = withSequence(
        withTiming(0.85, { duration: 50 }),
        withSpring(1, { damping: 10, stiffness: 200 })
      );
    }

    await toggleSave(product);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value }
    ]
  }));

  const isCircle = variant === 'circle';

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={({ pressed }) => [
        isCircle ? styles.circleBtn : styles.cardBtn,
        isCircle && saved && styles.circleBtnActive,
        pressed && styles.btnPressed,
        style
      ]}
      accessibilityRole="button"
      accessibilityLabel={saved ? 'Remove from saved' : 'Save for later'}
    >
      <Animated.View style={animatedStyle}>
        <Bookmark
          size={size}
          color={saved ? '#0066FF' : 'rgba(0, 0, 0, 0.35)'}
          fill={saved ? '#0066FF' : '#FFFFFF'}
          strokeWidth={saved ? 2.2 : 1.4}
        />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardBtn: {
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center'
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  circleBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE'
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.92 }]
  }
});

