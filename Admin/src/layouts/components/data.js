export const menuItems = [
  {
    'icon': 'lucide:layout-dashboard',
    'slug': 'dashboard',
    'label': 'Dashboard',
    'url': '/dashboard'
  },
  {
    'icon': 'lucide:package',
    'slug': 'catalog',
    'label': 'Catalog',
    'children': [
      { 'url': '/catalog/categories', 'slug': 'catalog-categories', 'label': 'Categories' },
      { 'url': '/catalog/products', 'slug': 'catalog-products', 'label': 'Products' }
    ]
  },
  {
    'icon': 'lucide:boxes',
    'slug': 'inventory',
    'label': 'Inventory',
    'children': [
      { 'url': '/inventory/overview', 'slug': 'inventory-overview', 'label': 'Inventory Overview' },
      { 'url': '/inventory/stock-entry', 'slug': 'inventory-stock-entry', 'label': 'Stock Entry' },
      { 'url': '/inventory/logs', 'slug': 'inventory-logs', 'label': 'Inventory Logs' },
      { 'url': '/inventory/low-stock', 'slug': 'inventory-low-stock', 'label': 'Low Stock' },
      { 'url': '/inventory/upcoming-expiry', 'slug': 'inventory-upcoming-expiry', 'label': 'Upcoming Expiry' }
    ]
  },
  {
    'icon': 'lucide:shopping-cart',
    'slug': 'orders',
    'label': 'Orders',
    'url': '/orders/all'
  },
  {
    'icon': 'lucide:receipt',
    'slug': 'pos',
    'label': 'POS Billing',
    'url': '/pos'
  },
  {
    'icon': 'lucide:users',
    'slug': 'customers',
    'label': 'Customers',
    'url': '/customers'
  },
  {
    'icon': 'lucide:building-2',
    'slug': 'suppliers',
    'label': 'Suppliers',
    'url': '/suppliers'
  },
  {
    'icon': 'lucide:user-cog',
    'slug': 'staff-delivery',
    'label': 'Staff & Delivery',
    'children': [
      { 'url': '/staff', 'slug': 'staff-management', 'label': 'Staff Management' },
      { 'url': '/delivery-boys', 'slug': 'delivery-boys', 'label': 'Delivery Boys' }
    ]
  },
  {
    'icon': 'lucide:ticket-percent',
    'slug': 'coupons',
    'label': 'Coupons',
    'url': '/coupons'
  },
  {
    'icon': 'lucide:credit-card',
    'slug': 'payments',
    'label': 'Payments',
    'url': '/payments'
  },
  {
    'icon': 'lucide:bar-chart-3',
    'slug': 'reports',
    'label': 'Reports',
    'url': '/reports'
  },
  {
    'icon': 'lucide:settings',
    'slug': 'settings',
    'label': 'Settings',
    'url': '/settings'
  }
];
