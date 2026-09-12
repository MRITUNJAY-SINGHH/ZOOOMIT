import { colors } from './colors';

export const orderStatusMap = {
  Pending: {
    label: 'Order Placed',
    stepIndex: 0,
    color: colors.warning,
    bgColor: colors.badgePending,
    description: 'Waiting for store confirmation'
  },
  Confirmed: {
    label: 'Confirmed',
    stepIndex: 1,
    color: colors.secondary,
    bgColor: colors.badgeConfirmed,
    description: 'Store confirmed your order'
  },
  Assigned: {
    label: 'Rider Assigned',
    stepIndex: 2,
    color: colors.info,
    bgColor: colors.badgeConfirmed,
    description: 'Delivery partner assigned'
  },
  Accepted: {
    label: 'Preparing',
    stepIndex: 2,
    color: colors.info,
    bgColor: colors.badgeConfirmed,
    description: 'Order is being packed at the dark store'
  },
  'Picked Up': {
    label: 'Out for Delivery',
    stepIndex: 3,
    color: colors.primary,
    bgColor: colors.primarySubtle,
    description: 'Rider is on the way with your order'
  },
  'Out For Delivery': {
    label: 'Out for Delivery',
    stepIndex: 3,
    color: colors.primary,
    bgColor: colors.primarySubtle,
    description: 'Rider is on the way with your order'
  },
  OutForDelivery: {
    label: 'Out for Delivery',
    stepIndex: 3,
    color: colors.primary,
    bgColor: colors.primarySubtle,
    description: 'Rider is on the way with your order'
  },
  Delivered: {
    label: 'Delivered',
    stepIndex: 4,
    color: colors.success,
    bgColor: colors.badgeDelivered,
    description: 'Package handed over successfully'
  },
  Cancelled: {
    label: 'Cancelled',
    stepIndex: -1,
    color: colors.error,
    bgColor: colors.badgeCancelled,
    description: 'Order was cancelled'
  },
  Returned: {
    label: 'Returned',
    stepIndex: -1,
    color: colors.textSecondary,
    bgColor: colors.surfaceSubtle,
    description: 'Items returned'
  },
  Refunded: {
    label: 'Refunded',
    stepIndex: -1,
    color: colors.secondary,
    bgColor: colors.secondarySubtle,
    description: 'Payment refunded'
  }
};

export const getOrderStatus = (status) => {
  return orderStatusMap[status] || {
    label: status,
    stepIndex: 1,
    color: colors.textSecondary,
    bgColor: colors.surfaceSubtle,
    description: status
  };
};
