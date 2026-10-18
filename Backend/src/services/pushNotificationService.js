/**
 * Expo Push Notification Service
 * Sends high-priority push notifications to delivery partners via Expo's official push service.
 * Supports token cleanup on 'DeviceNotRegistered', custom sound, channel mapping, and server credentials.
 */

import User from '../models/User.js';

/**
 * Handle Expo Push response tickets and remove invalid/expired tokens automatically
 */
const handlePushReceipts = async (tokens, responseData) => {
  if (!responseData || !Array.isArray(responseData.data)) return;

  const tickets = responseData.data;
  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i];
    const token = tokens[i];

    if (ticket.status === 'error') {
      const errorCode = ticket.details?.error;
      console.warn(`[PushNotification] Ticket error for token:`, errorCode, ticket.message);

      // If device is not registered or credentials invalid, clear stale token from database without mutating availability
      if (errorCode === 'DeviceNotRegistered' || errorCode === 'InvalidCredentials') {
        try {
          await User.updateMany({ expoPushTokens: token }, { $pull: { expoPushTokens: token } });
          await User.updateMany({ expoPushToken: token }, { $unset: { expoPushToken: 1 } });
          console.log(`[PushNotification] Removed invalid/unregistered push token from database.`);
        } catch (dbErr) {
          console.error('[PushNotification] Error unsetting invalid token:', dbErr.message);
        }
      }
    }
  }
};

/**
 * Send an Expo Push Notification to a single token or array of tokens
 */
export const sendExpoPushNotification = async ({
  pushToken,
  title,
  body,
  data = {},
  channelId = 'orders',
  sound = 'order_alert.wav'
}) => {
  if (!pushToken) {
    return { success: false, reason: 'No push token provided' };
  }

  const rawTokens = Array.isArray(pushToken) ? pushToken : [pushToken];
  const validTokens = rawTokens.filter(
    (t) => typeof t === 'string' && (t.startsWith('ExponentPushToken') || t.startsWith('ExpoPushToken'))
  );

  if (validTokens.length === 0) {
    return { success: false, reason: 'No valid Expo push tokens found' };
  }

  const messages = validTokens.map((token) => ({
    to: token,
    sound: sound || 'order_alert.wav',
    title,
    body,
    data,
    priority: 'high',
    channelId,
    _displayInForeground: true
  }));

  try {
    const headers = {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json'
    };

    // Include Expo Access Token if configured on server
    if (process.env.EXPO_ACCESS_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
    }

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers,
      body: JSON.stringify(messages)
    });

    const result = await response.json();

    // Inspect tickets and handle expired/invalid tokens
    await handlePushReceipts(validTokens, result);

    return { success: true, result };
  } catch (error) {
    console.error('[PushNotification] Error sending push notification:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Notify all eligible, online delivery partners about a new grocery order offer
 */
export const notifyEligibleRidersOfNewOrder = async (order) => {
  try {
    if (!order || !order._id) return { success: false, reason: 'Invalid order object' };

    // Find all active, online riders with registered push tokens
    const onlineRiders = await User.find({
      role: 'DeliveryBoy',
      isOnline: true,
      $or: [
        { expoPushTokens: { $exists: true, $ne: [] } },
        { expoPushToken: { $exists: true, $ne: null, $ne: '' } }
      ]
    }).select('_id expoPushToken expoPushTokens');

    if (!onlineRiders || onlineRiders.length === 0) {
      return { success: true, count: 0, message: 'No online riders available at this moment' };
    }

    // Filter out riders who already declined this specific order
    const declinedIds = (order.declinedRiders || []).map((id) => id.toString());
    const eligibleRiders = onlineRiders.filter((r) => !declinedIds.includes(r._id.toString()));

    if (eligibleRiders.length === 0) {
      return { success: true, count: 0, message: 'All online riders previously declined this order' };
    }

    // Aggregate tokens across all eligible rider devices
    const allTokens = [];
    for (const r of eligibleRiders) {
      if (Array.isArray(r.expoPushTokens) && r.expoPushTokens.length > 0) {
        allTokens.push(...r.expoPushTokens);
      } else if (r.expoPushToken) {
        allTokens.push(r.expoPushToken);
      }
    }
    const tokens = [...new Set(allTokens.filter(Boolean))];

    if (tokens.length === 0) {
      return { success: true, count: 0, message: 'No registered device tokens for eligible online riders' };
    }

    const title = 'New Order Available! 🛒';
    const body = `Order #${order.orderNumber} is ready for pickup. Tap to review and accept.`;
    const payloadData = {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      type: 'NEW_ORDER'
    };

    const pushResult = await sendExpoPushNotification({
      pushToken: tokens,
      title,
      body,
      data: payloadData,
      channelId: 'orders',
      sound: 'order_alert.wav'
    });

    return { success: true, count: tokens.length, pushResult };
  } catch (err) {
    console.error('[PushNotification] Error notifying eligible riders:', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Notify a specifically assigned delivery partner across all registered devices
 */
export const notifyRiderOfAssignedOrder = async (order, riderId) => {
  try {
    const rider = await User.findById(riderId).select('expoPushToken expoPushTokens name');
    if (!rider) {
      return { success: false, reason: 'Rider not found' };
    }

    const riderTokens = (Array.isArray(rider.expoPushTokens) && rider.expoPushTokens.length > 0)
      ? rider.expoPushTokens
      : (rider.expoPushToken ? [rider.expoPushToken] : []);

    if (riderTokens.length === 0) {
      return { success: false, reason: 'Rider has no registered push token' };
    }

    return await sendExpoPushNotification({
      pushToken: riderTokens,
      title: 'New Delivery Assigned! 🛵',
      body: `Order #${order.orderNumber} is assigned to you. Open app to accept and deliver.`,
      data: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        type: 'ASSIGNED_ORDER'
      },
      channelId: 'orders',
      sound: 'order_alert.wav'
    });
  } catch (err) {
    console.error('[PushNotification] Error notifying assigned rider:', err.message);
    return { success: false, error: err.message };
  }
};
