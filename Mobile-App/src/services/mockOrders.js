/**
 * Realistic Mock Orders for ZOOOMIT Quick-Commerce Application
 * Used for development fallback and when customer account has no order history.
 * Matches Option 2 approved design reference.
 */

export const SAMPLE_ORDERS = [
  {
    _id: 'ord_ku102345',
    orderNumber: 'KU102345',
    status: 'Delivered',
    createdAt: '2025-09-12T10:24:00.000Z',
    deliveredAt: '2025-09-12T11:28:00.000Z',
    amount: 620.00,
    subTotal: 590.00,
    deliveryFee: 25.00,
    tax: 5.00,
    discount: 0.00,
    paymentMethod: 'UPI (Google Pay)',
    paymentStatus: 'Paid',
    shippingAddress: {
      label: 'Home',
      street: 'B-42 Raj Nagar, Sector 9',
      city: 'Ghaziabad',
      state: 'UP',
      pincode: '201002'
    },
    rider: {
      name: 'Amit Kumar',
      phone: '9876543210',
      rating: 4.9
    },
    timeline: {
      confirmed: '10:24 AM',
      packed: '10:38 AM',
      outForDelivery: '11:05 AM',
      delivered: '11:28 AM'
    },
    items: [
      {
        _id: 'item_101',
        productId: 'prod_banana_01',
        productName: 'Fresh Robusta Banana',
        unit: '1 kg',
        price: 60.00,
        qty: 2,
        quantity: 2,
        total: 120.00
      },
      {
        _id: 'item_102',
        productId: 'prod_tomato_01',
        productName: 'Hybrid Farm Fresh Tomato',
        unit: '1 kg',
        price: 40.00,
        qty: 1,
        quantity: 1,
        total: 40.00
      },
      {
        _id: 'item_103',
        productId: 'prod_milk_01',
        productName: 'Amul Taaza Toned Milk',
        unit: '1 L',
        price: 70.00,
        qty: 2,
        quantity: 2,
        total: 140.00
      },
      {
        _id: 'item_104',
        productId: 'prod_atta_01',
        productName: 'Aashirvaad Shudh Chakki Atta',
        unit: '5 kg',
        price: 290.00,
        qty: 1,
        quantity: 1,
        total: 290.00
      }
    ]
  },
  {
    _id: 'ord_ku102344',
    orderNumber: 'KU102344',
    status: 'OutForDelivery',
    createdAt: '2025-09-10T18:18:00.000Z',
    amount: 440.00,
    subTotal: 410.00,
    deliveryFee: 25.00,
    tax: 5.00,
    discount: 0.00,
    paymentMethod: 'Cash on Delivery',
    paymentStatus: 'Pending',
    shippingAddress: {
      label: 'Home',
      street: 'B-42 Raj Nagar, Sector 9',
      city: 'Ghaziabad',
      state: 'UP',
      pincode: '201002'
    },
    rider: {
      name: 'Amit Kumar',
      phone: '9876543210',
      rating: 4.9
    },
    timeline: {
      confirmed: '06:18 PM',
      packed: '06:42 PM',
      outForDelivery: '-',
      delivered: '-'
    },
    items: [
      {
        _id: 'item_201',
        productId: 'prod_milk_01',
        productName: 'Amul Taaza Toned Milk',
        unit: '1 L',
        price: 70.00,
        qty: 2,
        quantity: 2,
        total: 140.00
      },
      {
        _id: 'item_202',
        productId: 'prod_salt_01',
        productName: 'Tata Salt Vacuum Evaporated',
        unit: '1 kg',
        price: 40.00,
        qty: 1,
        quantity: 1,
        total: 40.00
      },
      {
        _id: 'item_203',
        productId: 'prod_oil_01',
        productName: 'Fortune Sunlite Sunflower Oil',
        unit: '1 L',
        price: 160.00,
        qty: 1,
        quantity: 1,
        total: 160.00
      },
      {
        _id: 'item_204',
        productId: 'prod_banana_01',
        productName: 'Fresh Robusta Banana',
        unit: '1 kg',
        price: 70.00,
        qty: 1,
        quantity: 1,
        total: 70.00
      }
    ]
  },
  {
    _id: 'ord_ku102343',
    orderNumber: 'KU102343',
    status: 'Cancelled',
    createdAt: '2025-09-08T11:40:00.000Z',
    cancelledAt: '2025-09-08T11:45:00.000Z',
    amount: 310.00,
    subTotal: 310.00,
    deliveryFee: 0.00,
    tax: 0.00,
    discount: 0.00,
    paymentMethod: 'UPI (PhonePe)',
    paymentStatus: 'Refunded',
    shippingAddress: {
      label: 'Home',
      street: 'B-42 Raj Nagar, Sector 9',
      city: 'Ghaziabad',
      state: 'UP',
      pincode: '201002'
    },
    timeline: {
      confirmed: '-',
      packed: '-',
      outForDelivery: '-',
      delivered: '-'
    },
    items: [
      {
        _id: 'item_301',
        productId: 'prod_onion_01',
        productName: 'Fresh Red Onion',
        unit: '1 kg',
        price: 50.00,
        qty: 1,
        quantity: 1,
        total: 50.00
      },
      {
        _id: 'item_302',
        productId: 'prod_tomato_01',
        productName: 'Hybrid Farm Fresh Tomato',
        unit: '1 kg',
        price: 40.00,
        qty: 1,
        quantity: 1,
        total: 40.00
      },
      {
        _id: 'item_303',
        productId: 'prod_oil_01',
        productName: 'Fortune Sunlite Sunflower Oil',
        unit: '1 L',
        price: 160.00,
        qty: 1,
        quantity: 1,
        total: 160.00
      },
      {
        _id: 'item_304',
        productId: 'prod_banana_01',
        productName: 'Fresh Robusta Banana',
        unit: '1 kg',
        price: 60.00,
        qty: 1,
        quantity: 1,
        total: 60.00
      }
    ]
  },
  {
    _id: 'ord_ku102342',
    orderNumber: 'KU102342',
    status: 'Delivered',
    createdAt: '2025-09-04T14:15:00.000Z',
    deliveredAt: '2025-09-04T14:54:00.000Z',
    amount: 895.00,
    subTotal: 865.00,
    deliveryFee: 25.00,
    tax: 5.00,
    discount: 0.00,
    paymentMethod: 'Credit Card (HDFC **** 4819)',
    paymentStatus: 'Paid',
    shippingAddress: {
      label: 'Office',
      street: 'Tech Park Tower 2, Sector 62',
      city: 'Noida',
      state: 'UP',
      pincode: '201301'
    },
    rider: {
      name: 'Rajesh Verma',
      phone: '9811223344',
      rating: 4.8
    },
    timeline: {
      confirmed: '02:15 PM',
      packed: '02:26 PM',
      outForDelivery: '02:40 PM',
      delivered: '02:54 PM'
    },
    items: [
      {
        _id: 'item_401',
        productId: 'prod_rice_01',
        productName: 'India Gate Super Basmati Rice',
        unit: '5 kg',
        price: 480.00,
        qty: 1,
        quantity: 1,
        total: 480.00
      },
      {
        _id: 'item_402',
        productId: 'prod_maggi_01',
        productName: 'Maggi 2-Minute Masala Noodles',
        unit: 'Pack of 12',
        price: 168.00,
        qty: 1,
        quantity: 1,
        total: 168.00
      },
      {
        _id: 'item_403',
        productId: 'prod_silk_01',
        productName: 'Cadbury Dairy Milk Silk',
        unit: '150 g',
        price: 175.00,
        qty: 1,
        quantity: 1,
        total: 175.00
      },
      {
        _id: 'item_404',
        productId: 'prod_chilli_01',
        productName: 'Fresh Green Chilli & Lemon Combo',
        unit: '1 pack',
        price: 42.00,
        qty: 1,
        quantity: 1,
        total: 42.00
      }
    ]
  }
];
