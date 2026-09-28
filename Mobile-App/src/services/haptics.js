import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const safeCall = async (fn) => {
  if (Platform.OS === 'web') return;
  try {
    await fn();
  } catch {
    // Ignore haptic failures gracefully
  }
};

const baseHaptics = {
  // Light impacts
  light: () => safeCall(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  impactLight: () => safeCall(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),

  // Medium impacts
  medium: () => safeCall(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  impactMedium: () => safeCall(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),

  // Heavy impacts
  heavy: () => safeCall(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
  impactHeavy: () => safeCall(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),

  // Selections
  selection: () => safeCall(() => Haptics.selectionAsync()),
  select: () => safeCall(() => Haptics.selectionAsync()),

  // Notifications
  notificationSuccess: () => safeCall(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  success: () => safeCall(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),

  notificationError: () => safeCall(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  error: () => safeCall(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),

  notificationWarning: () => safeCall(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  warning: () => safeCall(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning))
};

// Safe Proxy so any accidental method name (touch, soft, etc.) doesn't throw TypeError
export const haptics = new Proxy(baseHaptics, {
  get(target, prop) {
    if (prop in target) {
      return target[prop];
    }
    // Return a safe no-op or light feedback function instead of undefined
    return () => safeCall(() => Haptics.selectionAsync());
  }
});

export default haptics;

