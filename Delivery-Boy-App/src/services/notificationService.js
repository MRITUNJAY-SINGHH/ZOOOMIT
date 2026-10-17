import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { deliveryService } from './deliveryService';

// In Expo Go on Android (SDK 52+), expo-notifications native module is not included.
// We safely require it so that development in Expo Go doesn't crash, while full
// push notifications remain functional in custom dev builds and production APKs.
let Notifications = null;
try {
  Notifications = require('expo-notifications');
  if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true
      })
    });
  }
} catch (e) {
  // Expo Go fallback: native module not available
  console.log('[NotificationService] Native notifications not available in Expo Go:', e.message);
}

export const notificationService = {
  /**
   * Register for push notifications and sync token with backend
   */
  async registerForPushNotificationsAsync() {
    let token = null;

    try {
      if (Platform.OS === 'android' && Notifications?.setNotificationChannelAsync) {
        await Notifications.setNotificationChannelAsync('orders', {
          name: 'Order Alerts',
          importance: Notifications.AndroidImportance?.MAX ?? 5,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FFC928',
          sound: 'default'
        }).catch(() => {});
      }

      if (Device.isDevice && Notifications?.getPermissionsAsync) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          console.log('[NotificationService] Permission not granted for push notifications.');
          return null;
        }

        try {
          const pushTokenData = await Notifications.getExpoPushTokenAsync();
          token = pushTokenData?.data;

          // Sync with backend
          if (token) {
            await deliveryService.updatePushToken(token);
          }
        } catch (e) {
          console.log('[NotificationService] Failed to retrieve Expo push token:', e.message);
        }
      } else {
        console.log('[NotificationService] Push notifications require a physical device or dev build.');
      }
    } catch (err) {
      console.log('[NotificationService] registerForPushNotifications error:', err.message);
    }

    return token;
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
