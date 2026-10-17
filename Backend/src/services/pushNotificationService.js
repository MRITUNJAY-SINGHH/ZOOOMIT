/**
 * Expo Push Notification Service
 * Sends notifications to delivery partners via Expo's official push service.
 */

export const sendExpoPushNotification = async ({ pushToken, title, body, data = {}, channelId = 'orders' }) => {
  if (!pushToken || typeof pushToken !== 'string') {
    return { success: false, reason: 'No push token provided' };
  }

  // Check valid Expo push token format
  if (!pushToken.startsWith('ExponentPushToken') && !pushToken.startsWith('ExpoPushToken')) {
    return { success: false, reason: 'Invalid Expo push token format' };
  }

  try {
    const payload = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
      channelId,
      _displayInForeground: true
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    return { success: true, result };
  } catch (error) {
    console.error('[PushNotification] Error sending push notification:', error.message);
    return { success: false, error: error.message };
  }
};
