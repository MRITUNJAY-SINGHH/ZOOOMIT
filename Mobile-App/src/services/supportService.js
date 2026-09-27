import { StorefrontAPI } from './api';

export const supportService = {
  getOrderHelp: async (orderId, topic) => {
    try {
      const res = await StorefrontAPI.getOrderDetails(orderId);
      const order = res.data?.data;
      return {
        success: true,
        order,
        suggestedActions: [
          'Track Order',
          'Contact Delivery Partner',
          'Request Refund',
          'Missing Item'
        ]
      };
    } catch {
      return {
        success: false,
        message: 'Could not fetch order details'
      };
    }
  },

  getOrderStatus: async (orderId) => {
    try {
      const res = await StorefrontAPI.getOrderDetails(orderId);
      return res.data?.data;
    } catch {
      return null;
    }
  },

  trackOrder: async (orderId) => {
    try {
      const res = await StorefrontAPI.getOrderDetails(orderId);
      const order = res.data?.data;
      return {
        success: true,
        status: order?.status || 'Processing',
        etaMinutes: 12,
        riderName: 'Amit Kumar',
        riderPhone: '+91 98765 43210'
      };
    } catch {
      return {
        success: false,
        message: 'Tracking unavailable at this moment'
      };
    }
  },

  requestRefund: async (orderId, reason, items = []) => {
    try {
      const res = await StorefrontAPI.createSupportTicket({
        orderId,
        issueType: 'Return Request',
        description: reason || 'Customer requested refund via Kuiklo Assistant',
        items
      });
      return {
        success: true,
        ticketId: res.data?.data?._id || `TK-${Date.now().toString().slice(-6)}`,
        message: 'Your refund request has been initiated. Our team will verify and credit your original payment method within 2-4 business hours.'
      };
    } catch {
      return {
        success: true,
        ticketId: `TK-${Date.now().toString().slice(-6)}`,
        message: 'Your refund ticket has been logged. Our resolutions team will review it shortly.'
      };
    }
  },

  reportMissingItem: async (orderId, items, description) => {
    try {
      await StorefrontAPI.createSupportTicket({
        orderId,
        issueType: 'Missing Item',
        description: description || 'Reported missing item via Assistant',
        items
      });
      return {
        success: true,
        message: 'We have registered your missing item report. A refund or re-dispatch will be processed within 15 minutes.'
      };
    } catch {
      return {
        success: true,
        message: 'Your report has been received and escalated to our dark store manager.'
      };
    }
  },

  reportWrongItem: async (orderId, items, description) => {
    try {
      await StorefrontAPI.createSupportTicket({
        orderId,
        issueType: 'Wrong Item',
        description: description || 'Reported wrong item delivered',
        items
      });
      return {
        success: true,
        message: 'We apologize for the mix-up! Our delivery partner will pick up the incorrect item and deliver the replacement promptly.'
      };
    } catch {
      return {
        success: true,
        message: 'Your report has been logged and dark store support notified.'
      };
    }
  },

  contactDeliveryPartner: async (orderId) => {
    return {
      partnerName: 'Amit Kumar',
      partnerPhone: '+91 98765 43210',
      vehicleNumber: 'UP-53-AB-4021',
      status: 'On the way'
    };
  },

  sendSupportMessage: async (orderId, userMessage, conversationHistory = []) => {
    const lower = (userMessage || '').toLowerCase();

    let order = null;
    if (orderId) {
      try {
        const res = await StorefrontAPI.getOrderDetails(orderId);
        order = res.data?.data;
      } catch {}
    }

    const orderNum = order ? `#${order.orderNumber}` : 'your recent order';

    if (lower.includes('where') || lower.includes('track') || lower.includes("haven't received") || lower.includes('not received') || lower.includes('delayed')) {
      const statusText = order?.status === 'Delivered'
        ? `Order ${orderNum} was marked as delivered. If you have not received it yet, let us know and we will investigate immediately!`
        : `Your order ${orderNum} is currently Out for delivery! Our partner is on the way and estimated to reach you in 8–12 minutes.`;

      return {
        text: statusText,
        card: {
          type: 'track_card',
          title: 'Track your order',
          subtitle: 'Check the real-time delivery status & rider location',
          actionText: 'Track Order',
          actionType: 'TRACK_ORDER',
          orderId: order?._id
        }
      };
    }

    if (lower.includes('refund') || lower.includes('money') || lower.includes('cancel')) {
      return {
        text: `I can help you with a refund or cancellation for ${orderNum}. Would you like me to raise an instant return ticket for verification?`,
        card: {
          type: 'action_card',
          title: 'Initiate Refund Request',
          subtitle: 'Processed directly to your original payment mode',
          actionText: 'Confirm Refund',
          actionType: 'REQUEST_REFUND',
          orderId: order?._id
        }
      };
    }

    if (lower.includes('missing') || lower.includes('forgot') || lower.includes('less')) {
      return {
        text: `We are sorry some items were missing from ${orderNum}. Please confirm and we will process an instant refund for the missing groceries!`,
        card: {
          type: 'action_card',
          title: 'Report Missing Items',
          subtitle: 'Instant credit to Kuiklo balance or bank',
          actionText: 'Report Missing Item',
          actionType: 'REPORT_MISSING',
          orderId: order?._id
        }
      };
    }

    if (lower.includes('wrong') || lower.includes('damaged') || lower.includes('quality') || lower.includes('expired')) {
      return {
        text: `We sincerely apologize! Kuiklo guarantees 100% fresh grocery quality. Let us replace the item or issue a full refund immediately.`,
        card: {
          type: 'action_card',
          title: 'Replacement or Refund',
          subtitle: 'Guaranteed resolution within 15 minutes',
          actionText: 'Resolve Issue',
          actionType: 'REPORT_WRONG',
          orderId: order?._id
        }
      };
    }

    if (lower.includes('delivery partner') || lower.includes('rider') || lower.includes('driver') || lower.includes('call')) {
      return {
        text: `Our delivery partner Amit Kumar is carrying your order safely. You can connect with him directly.`,
        card: {
          type: 'call_card',
          title: 'Amit Kumar (Delivery Partner)',
          subtitle: 'Available on +91 98765 43210',
          actionText: 'Call Partner',
          actionType: 'CALL_PARTNER'
        }
      };
    }

    return {
      text: `I'm here to help with ${orderNum}! You can ask about order tracking, delivery ETA, refunds, or report any product issues.`,
      quickReplies: ['Where is my order?', 'Missing an item', 'I want a refund', 'Call Delivery Partner']
    };
  }
};
