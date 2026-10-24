import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { deliveryService } from './deliveryService';

// Fallback EAS project ID for aeterns-team/zooomit-delivery-partner
const EAS_PROJECT_ID =
  Constants?.expoConfig?.extra?.eas?.projectId ?? '6811742b-8c65-4e30-adc4-77b525a0ff57';

// In Expo Go on Android (SDK 52+), expo-notifications native module is not included.
// We safely require it so development in Expo Go doesn't crash, while full
// push notifications remain functional in custom dev builds and production APKs.
let Notifications = null;
try {
  Notifications = require('expo-notifications');
  if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        priority: Notifications.AndroidNotificationPriority?.MAX ?? 'max'
      })
    });
  }
} catch (e) {
  // Expo Go fallback: native module not available
  console.log('[NotificationService] Native notifications not available in Expo Go:', e.message);
}

// Track cached token to avoid duplicate API calls
let cachedPushToken = null;
let hasPromptedPermissionThisSession = false;

export const notificationService = {
  /**
   * Return the cached push token if registered
   */
  getCachedToken() {
    return cachedPushToken;
  },

  /**
   * Setup Android Notification Channels
   * Creates high-priority 'orders' channel with custom sound and vibration pattern
   */
  async setupNotificationChannelsAsync() {
    if (Platform.OS !== 'android' || !Notifications?.setNotificationChannelAsync) {
      return;
    }

    try {
      // Primary High-Priority Channel for Incoming Orders
      await Notifications.setNotificationChannelAsync('orders', {
        name: 'Order Alerts',
        description: 'Instant alerts for new grocery delivery assignments and order updates',
        importance: Notifications.AndroidImportance?.MAX ?? 5,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FFC928',
        enableLights: true,
        enableVibrate: true,
        sound: 'order_alert.wav', // Mapped from assets/sounds/order_alert.wav via app.json
        bypassDnd: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility?.PUBLIC ?? 1
      });

      // Secondary Channel for General Partner Updates
      await Notifications.setNotificationChannelAsync('general', {
        name: 'General Updates',
        description: 'Account, shift, and operational partner updates',
        importance: Notifications.AndroidImportance?.DEFAULT ?? 3,
        vibrationPattern: [0, 200, 200],
        lightColor: '#FFC928',
        sound: 'default'
      });
    } catch (err) {
      console.log('[NotificationService] Could not setup notification channels:', err.message);
    }
  },

  /**
   * Register for push notifications and sync token with backend
   * Only requests permission when appropriate, handles denied state gracefully
   */
  async registerForPushNotificationsAsync() {
    let token = null;

    try {
      // 1. Configure Android Channels
      await this.setupNotificationChannelsAsync();

      // 2. Physical Device Check
      if (!Device.isDevice) {
        console.log('[NotificationService] Push notifications require a physical Android/iOS device.');
        return null;
      }

      if (!Notifications?.getPermissionsAsync) {
        console.log('[NotificationService] expo-notifications native module not present.');
        return null;
      }

      // 3. Permission Checks
      const { status: existingStatus, canAskAgain } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        if (!hasPromptedPermissionThisSession && canAskAgain) {
          hasPromptedPermissionThisSession = true;
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        } else {
          console.log('[NotificationService] Permission previously denied or cannot ask again.');
        }
      }

      if (finalStatus !== 'granted') {
        console.log(
          '[NotificationService] Notification permission not granted. Riders can enable it in phone Settings > Apps > ZOOOMIT Delivery.'
        );
        return null;
      }

      // 4. Retrieve Expo Push Token with EAS Project ID
      try {
        const pushTokenData = await Notifications.getExpoPushTokenAsync({
          projectId: EAS_PROJECT_ID
        });
        token = pushTokenData?.data;
        cachedPushToken = token;

        // 5. Register Device Token with Authenticated Backend
        if (token) {
          await deliveryService.updatePushToken(token);
          console.log('[NotificationService] Expo push token registered and synced with backend.');
        }
      } catch (tokenErr) {
        console.log('[NotificationService] Failed to obtain Expo push token:', tokenErr.message);
      }
    } catch (err) {
      console.log('[NotificationService] registerForPushNotificationsAsync error:', err.message);
    }

    return token;
  },

  /**
   * Unregister / invalidate device token on logout or account switching
   */
  async unregisterDeviceTokenAsync() {
    try {
      if (cachedPushToken) {
        await deliveryService.updatePushToken(cachedPushToken, true);
      }
      cachedPushToken = null;
      console.log('[NotificationService] Device push token cleared from backend session.');
    } catch (err) {
      console.log('[NotificationService] Failed to clear push token on logout:', err.message);
    }
  },

  /**
   * Listen for incoming notifications when app is foregrounded
   */
  addNotificationReceivedListener(callback) {
    try {
      if (Notifications && typeof Notifications.addNotificationReceivedListener === 'function') {
        return Notifications.addNotificationReceivedListener(callback);
      }
    } catch (e) {}
    return { remove: () => {} };
  },

  /**
   * Listen for user tapping/interacting with notification (background or closed)
   */
  addNotificationResponseReceivedListener(callback) {
    try {
      if (Notifications && typeof Notifications.addNotificationResponseReceivedListener === 'function') {
        return Notifications.addNotificationResponseReceivedListener(callback);
      }
    } catch (e) {}
    return { remove: () => {} };
  },

  /**
   * Check if app was opened via a notification from a cold/killed state
   */
  async getLastNotificationResponseAsync() {
    try {
      if (Notifications && typeof Notifications.getLastNotificationResponseAsync === 'function') {
        return await Notifications.getLastNotificationResponseAsync();
      }
    } catch (e) {}
    return null;
  }
};
