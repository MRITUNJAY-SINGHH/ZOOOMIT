export const FAQ_CATEGORIES = [
  {
    id: 'orders',
    title: 'Orders and assignments',
    shortTitle: 'Orders & Assignments',
    subtitle: 'New orders, accepting and cancellations',
    iconName: 'Package',
    iconColor: '#EA580C',
    bgColor: '#FFF7ED',
    borderColor: '#FFEDD5',
    description: 'Learn how orders are dispatched, accepted, rejected, and managed throughout your delivery shift.'
  },
  {
    id: 'pickup_delivery',
    title: 'Pickup and delivery',
    shortTitle: 'Pickup & Delivery',
    subtitle: 'Pickup process, delivery process',
    iconName: 'RotateCw',
    iconColor: '#16A34A',
    bgColor: '#F0FDF4',
    borderColor: '#DCFCE7',
    description: 'Guidelines for store pickup verification, grocery checklist checks, GPS navigation, and customer doorstep handover.'
  },
  {
    id: 'delivery_otp',
    title: 'Delivery OTP problems',
    shortTitle: 'Delivery OTP Problems',
    subtitle: 'Issues with OTP verification',
    iconName: 'Bell',
    iconColor: '#DC2626',
    bgColor: '#FEF2F2',
    borderColor: '#FEE2E2',
    description: 'Understanding OTP generation, handling expired codes, resending SMS, and secure doorstep verification.'
  },
  {
    id: 'earnings_cash',
    title: 'Earnings and cash collection',
    shortTitle: 'Earnings & Cash Collection',
    subtitle: 'Delivery earnings and store collection',
    iconName: 'Coins',
    iconColor: '#15803D',
    bgColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    description: 'How your per-delivery earnings are calculated by admin rates and collected in cash at the store hub counter.'
  },
  {
    id: 'app_login',
    title: 'App or login issue',
    shortTitle: 'App or Login Issues',
    subtitle: 'Login, account and technical issues',
    iconName: 'Clock',
    iconColor: '#2563EB',
    bgColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    description: 'Troubleshooting login credentials, connection drops, push notification settings, and app performance.'
  }
];

export const FAQ_ITEMS = [
  // --- Category: Orders and assignments ---
  {
    id: 'ord-1',
    categoryId: 'orders',
    question: 'How do I accept a new order?',
    answer: 'When an order is dispatched to you, an incoming assignment alert appears with sound and vibration. Review the store pickup location, customer drop address, distance, and your delivery earning. Tap the yellow "Accept Order" button within the 60-second countdown to claim the assignment.',
    keywords: ['accept', 'new order', 'claim', 'assignment', 'incoming']
  },
  {
    id: 'ord-2',
    categoryId: 'orders',
    question: 'Why did a new order disappear?',
    answer: 'If you do not accept an order before the 60-second timer expires or if you tap "Reject", the order is automatically returned to dispatch and reassigned to other nearby available delivery partners.',
    keywords: ['disappear', 'expired', 'timeout', 'missed', 'timer']
  },
  {
    id: 'ord-3',
    categoryId: 'orders',
    question: 'Can I reject an order?',
    answer: 'Yes. If you have an emergency, bike issue, or cannot fulfill the assignment, tap "Reject" and choose a reason (e.g. vehicle puncture, distance too far, or store delay). Maintain a high acceptance rate to receive priority order matching.',
    keywords: ['reject', 'decline', 'cancel', 'puncture', 'emergency']
  },
  {
    id: 'ord-4',
    categoryId: 'orders',
    question: 'What happens if another delivery partner accepts the order first?',
    answer: 'In broadcast dispatch mode, orders are presented to multiple top available partners in the area. The first partner to tap "Accept" claims the order, and it will close on other partners\' screens with an update notice.',
    keywords: ['broadcast', 'first', 'claimed', 'taken', 'speed']
  },
  {
    id: 'ord-5',
    categoryId: 'orders',
    question: 'Where can I see my active orders?',
    answer: 'Open the "Orders" tab in the bottom navigation. Active deliveries are listed under the "Active" filter. Tapping an active card opens live turn-by-turn directions, customer details, and pickup checklist steps.',
    keywords: ['active orders', 'orders tab', 'current', 'progress', 'view']
  },
  {
    id: 'ord-6',
    categoryId: 'orders',
    question: 'Why was an order reassigned?',
    answer: 'An order may be reassigned by the hub manager if you remain stationary for an extended period after acceptance, if you request cancellation due to breakdown, or if dispatch detects a critical customer ETA delay.',
    keywords: ['reassigned', 'supervisor', 'taken away', 'delayed', 'hub']
  },
  {
    id: 'ord-7',
    categoryId: 'orders',
    question: 'How can I check completed or cancelled orders?',
    answer: 'In the "Orders" tab, switch between the "Completed" and "Cancelled" filter tabs. You can view past order numbers, delivery drop timestamps, and credited partner earnings for each order.',
    keywords: ['completed', 'cancelled', 'history', 'past orders', 'records']
  },

  // --- Category: Pickup and delivery ---
  {
    id: 'pic-1',
    categoryId: 'pickup_delivery',
    question: 'How do I confirm a pickup?',
    answer: 'When you arrive at the store dispatch counter, show the 4-digit order number (#ZM...) to store staff. Verify all grocery bags are properly sealed and tagged. Check off the items in the Pickup Checklist and tap "Confirm Pickup" to transition to "On the Way".',
    keywords: ['confirm pickup', 'store', 'sealed', 'checklist', 'on the way']
  },
  {
    id: 'pic-2',
    categoryId: 'pickup_delivery',
    question: 'What should I do if an item is missing at the store?',
    answer: 'Inform the store dispatch staff immediately so they can replace or pack the item. If the product is out of stock, store staff must mark it out-of-stock on the merchant terminal before you confirm pickup. Never leave bags behind without staff verification.',
    keywords: ['missing item', 'out of stock', 'store issue', 'unpacked', 'shortage']
  },
  {
    id: 'pic-3',
    categoryId: 'pickup_delivery',
    question: 'What happens if the store is closed?',
    answer: 'If you reach the store location and find it closed during operating hours, tap "Order Help" on your active delivery card or call Dispatch immediately. The supervisor will verify the hub status and cancel the order without penalty.',
    keywords: ['store closed', 'locked', 'hub closed', 'shut', 'dispatch']
  },
  {
    id: 'pic-4',
    categoryId: 'pickup_delivery',
    question: 'How do I open navigation for a delivery?',
    answer: 'On your active order screen, tap the "Navigate" button (map pin icon). This directly launches Google Maps or your default navigation app with the exact GPS coordinates for the customer\'s delivery address.',
    keywords: ['navigation', 'google maps', 'gps', 'route', 'directions']
  },
  {
    id: 'pic-5',
    categoryId: 'pickup_delivery',
    question: 'What should I do if I cannot find the delivery address?',
    answer: 'Check the delivery address notes for flat number, wing, or society gate details. Tap the phone icon to call the customer directly. If unreachable, wait 5 minutes at the designated pin and contact dispatch for location assistance.',
    keywords: ['cannot find address', 'wrong address', 'lost', 'landmark', 'call customer']
  },
  {
    id: 'pic-6',
    categoryId: 'pickup_delivery',
    question: 'What happens if the customer is unavailable?',
    answer: 'Attempt to call the customer at least twice. If there is no response after 5 minutes at the doorstep, tap "Order Help" -> "Customer Unreachable". Dispatch will attempt to reach the customer or instruct you on returning the sealed groceries to the store hub.',
    keywords: ['customer unavailable', 'door locked', 'unreachable', 'no answer', 'return']
  },
  {
    id: 'pic-7',
    categoryId: 'pickup_delivery',
    question: 'When is a delivery considered completed?',
    answer: 'A delivery is considered successfully completed ONLY after you collect the 4-digit verification OTP from the customer at doorstep, enter it into the app, and receive the green "Verified & Delivered" confirmation from the backend.',
    keywords: ['completed', 'finish', 'done', 'delivered status', 'doorstep']
  },

  // --- Category: Delivery OTP problems ---
  {
    id: 'otp-1',
    categoryId: 'delivery_otp',
    question: 'Where does the customer get the delivery OTP?',
    answer: 'The customer receives a 4-digit verification code via SMS and WhatsApp as soon as you mark the order status as "Out for Delivery". The code is also clearly displayed in their customer ZOOOMIT mobile app on the live order tracking screen.',
    keywords: ['where is otp', 'customer otp', 'sms', 'whatsapp', 'tracking screen']
  },
  {
    id: 'otp-2',
    categoryId: 'delivery_otp',
    question: 'What should I do if the OTP is incorrect?',
    answer: 'Ask the customer to refresh their ZOOOMIT app or check their latest SMS message. Verify that the customer is looking at the OTP for this specific order number (#ZM...) rather than an older delivery.',
    keywords: ['incorrect otp', 'wrong otp', 'invalid code', 'mismatch', 'retry']
  },
  {
    id: 'otp-3',
    categoryId: 'delivery_otp',
    question: 'What if the OTP has expired?',
    answer: 'OTP codes are time-sensitive for security. Tap the "Resend OTP" button on your delivery verification screen. The backend will instantly generate a fresh verification code and SMS it to the customer\'s registered phone number.',
    keywords: ['expired otp', 'timed out', 'resend', 'new code', 'fresh otp']
  },
  {
    id: 'otp-4',
    categoryId: 'delivery_otp',
    question: 'How can the customer request a new OTP?',
    answer: 'The customer can tap "Resend OTP" inside their ZOOOMIT mobile app, or you can trigger a new code on your delivery verification screen by tapping "Regenerate OTP".',
    keywords: ['request otp', 'regenerate', 'customer request', 'new sms']
  },
  {
    id: 'otp-5',
    categoryId: 'delivery_otp',
    question: 'Why can\'t I complete delivery without OTP verification?',
    answer: 'OTP verification is a strict backend requirement that protects you and the customer against false delivery disputes, missing parcels, and fraud. The backend strictly requires the verified 4-digit OTP to mark the order "Delivered" and credit your partner earnings. Never bypass OTP verification.',
    keywords: ['why otp', 'mandatory', 'bypass', 'protection', 'credit earnings']
  },
  {
    id: 'otp-6',
    categoryId: 'delivery_otp',
    question: 'What happens after too many incorrect attempts?',
    answer: 'If an incorrect OTP is entered 3 consecutive times, verification is temporarily paused for 60 seconds. In rare emergencies where the customer cannot receive SMS, only an authorized Store Hub Supervisor can verify the delivery via dispatch portal.',
    keywords: ['attempts', 'locked', 'too many', 'supervisor override', 'emergency']
  },

  // --- Category: Earnings and cash collection ---
  {
    id: 'ear-1',
    categoryId: 'earnings_cash',
    question: 'How are my delivery earnings calculated?',
    answer: 'Earnings are calculated transparently on a per-delivery basis. Each successfully verified and completed delivery credits your account with the fixed rate configured for your fleet by the administration (e.g. ₹20 or ₹30 per order).',
    keywords: ['how calculated', 'rate per delivery', 'formula', 'earnings', 'compensation']
  },
  {
    id: 'ear-2',
    categoryId: 'earnings_cash',
    question: 'Who sets the amount earned per delivery?',
    answer: 'The per-delivery compensation rate is configured centrally by the ZOOOMIT dispatch administration. Any fleet-wide rate updates or special peak incentives are configured directly by the admin in the system.',
    keywords: ['who sets', 'admin rate', 'store rate', 'configuration', 'management']
  },
  {
    id: 'ear-3',
    categoryId: 'earnings_cash',
    question: 'When does an order count toward my earnings?',
    answer: 'An order counts toward your earnings immediately when the status becomes "Delivered" through doorstep OTP verification. Cancelled or rejected orders do not qualify for delivery compensation.',
    keywords: ['when count', 'credited', 'qualify', 'delivered', 'otp success']
  },
  {
    id: 'ear-4',
    categoryId: 'earnings_cash',
    question: 'Where can I see today\'s earnings?',
    answer: 'Open the "Earnings" tab in the bottom bar and tap "Today". You will see your total earnings for today, number of deliveries completed, and your active per-delivery rate.',
    keywords: ['today earnings', 'earnings tab', 'daily total', 'current earnings']
  },
  {
    id: 'ear-5',
    categoryId: 'earnings_cash',
    question: 'How do I see weekly and monthly earnings?',
    answer: 'In the "Earnings" tab, tap the "This Week" or "This Month" filter buttons at the top to review historical delivery counts, daily breakdown insights, and total earnings for those periods.',
    keywords: ['weekly', 'monthly', 'history', 'filter', 'breakdown']
  },
  {
    id: 'ear-6',
    categoryId: 'earnings_cash',
    question: 'How do I collect my earnings from the store?',
    answer: 'ZOOOMIT follows an authorized store cash settlement model. At the end of your shift or work day, proceed to the store hub counter. The staff will check your "Cash to Collect" balance in the system and hand over the cash amount directly to you.',
    keywords: ['collect cash', 'store counter', 'daily settlement', 'cash to collect', 'handover']
  },
  {
    id: 'ear-7',
    categoryId: 'earnings_cash',
    question: 'What if the cash collected does not match the amount shown?',
    answer: 'Store staff records the exact physical cash amount handed over. If you receive a partial payout, your remaining balance stays safely recorded under "Cash to Collect" until fully settled at your next shift.',
    keywords: ['mismatch', 'partial payment', 'balance', 'remaining', 'discrepancy']
  },
  {
    id: 'ear-8',
    categoryId: 'earnings_cash',
    question: 'Why is an earning not visible yet?',
    answer: 'Earnings update within seconds of successful OTP verification. If mobile internet connection was temporarily lost during delivery, pull down to refresh the screen once network is restored.',
    keywords: ['not visible', 'missing earning', 'refresh', 'sync', 'delay']
  },

  // --- Category: App or login issues ---
  {
    id: 'app-1',
    categoryId: 'app_login',
    question: 'How do I log in?',
    answer: 'Open the app, enter your registered delivery partner email and password provided during onboarding, and tap "Sign In". Make sure your device has an active mobile internet connection.',
    keywords: ['login', 'sign in', 'credentials', 'password', 'access']
  },
  {
    id: 'app-2',
    categoryId: 'app_login',
    question: 'What if my password is incorrect?',
    answer: 'Check that Caps Lock is disabled. If you have forgotten your password or your account is locked, contact your dispatch manager to receive a temporary reset password immediately.',
    keywords: ['forgot password', 'wrong password', 'reset', 'locked account', 'manager']
  },
  {
    id: 'app-3',
    categoryId: 'app_login',
    question: 'What should I do if the app is not loading?',
    answer: 'Force-close the app and reopen it. Check that you have mobile data enabled. If the issue persists, toggle Airplane mode on for 5 seconds and turn it off to refresh your cellular connection.',
    keywords: ['not loading', 'stuck', 'blank screen', 'airplane mode', 'restart']
  },
  {
    id: 'app-4',
    categoryId: 'app_login',
    question: 'What if the internet connection fails during delivery?',
    answer: 'Your active order details remain safely cached on your phone. Continue to the delivery address. Once your phone reconnects to cellular data, your delivery status and OTP verification will sync with the server.',
    keywords: ['no internet', 'offline', 'network fail', 'cached', 'reconnect']
  },
  {
    id: 'app-5',
    categoryId: 'app_login',
    question: 'Why am I not receiving new-order notifications?',
    answer: 'Ensure your status is toggled to "Online" on your Dashboard or Profile screen. Check your phone system settings to ensure notifications are allowed for ZOOOMIT Partner and battery optimization is set to "Unrestricted".',
    keywords: ['no notifications', 'silent', 'missing alerts', 'battery optimization', 'online status']
  },
  {
    id: 'app-6',
    categoryId: 'app_login',
    question: 'How do I contact support if the app crashes?',
    answer: 'Restart the app and tap "Help & Support" -> "Contact Support" to submit a technical issue ticket, or call the 24/7 Dispatch Helpline (+91 1800 200 4000) for immediate operational assistance.',
    keywords: ['app crash', 'bug', 'error', 'helpline', 'report bug']
  },
  {
    id: 'app-7',
    categoryId: 'app_login',
    question: 'What should I do if an order status does not update?',
    answer: 'Pull down on the order details screen to trigger an instant server refresh. If the status still does not refresh, check your mobile connection or ask store staff to verify order state on the hub terminal.',
    keywords: ['status stuck', 'refresh', 'sync', 'not updating', 'terminal']
  }
];
