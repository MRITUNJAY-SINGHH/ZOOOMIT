export const menuItems = [
  {
    'icon': 'lucide:layout-dashboard',
    'slug': 'dashboard',
    'label': 'Dashboard',
    'url': '/dashboard'
  },
  {
    'isTitle': true,
    'label': 'CATALOG'
  },
  {
    'icon': 'lucide:grid', // Using generic grid/box icon
    'slug': 'catalog-categories',
    'label': 'Categories',
    'children': [
      { 'url': '/catalog/categories', 'slug': 'catalog-categories-list', 'label': 'All Categories', 'icon': 'lucide:layout-grid' }
    ]
  },
  {
    'icon': 'lucide:shopping-bag',
    'slug': 'catalog-products',
    'label': 'Products',
    'children': [
      { 'url': '/catalog/products', 'slug': 'catalog-products-list', 'label': 'All Products', 'icon': 'lucide:package' }
    ]
  },
  {
    'isTitle': true,
    'label': 'INVENTORY'
  },
  {
    'icon': 'lucide:layout-list',
    'slug': 'inventory-overview',
    'label': 'Overview',
    'children': [
      { 'url': '/inventory/overview', 'slug': 'inventory-overview-list', 'label': 'Overview Details', 'icon': 'lucide:activity' }
    ]
  },
  {
    'icon': 'lucide:plus-circle',
    'slug': 'inventory-stock-entry',
    'label': 'Stock Entry',
    'children': [
      { 'url': '/inventory/stock-entry', 'slug': 'inventory-stock-entry-list', 'label': 'Add Stock', 'icon': 'lucide:plus-square' }
    ]
  },
  {
    'icon': 'lucide:clipboard-list',
    'slug': 'inventory-logs',
    'label': 'Inventory Logs',
    'children': [
      { 'url': '/inventory/logs', 'slug': 'inventory-logs-list', 'label': 'View Logs', 'icon': 'lucide:minus' }
    ]
  },
  {
    'icon': 'lucide:alert-triangle',
    'slug': 'inventory-low-stock',
    'label': 'Low Stock',
    'children': [
      { 'url': '/inventory/low-stock', 'slug': 'inventory-low-stock-list', 'label': 'Low Stock Alerts', 'icon': 'lucide:minus' }
    ]
  },
  {
    'icon': 'lucide:clock',
    'slug': 'inventory-upcoming-expiry',
    'label': 'Upcoming Expiry',
    'children': [
      { 'url': '/inventory/upcoming-expiry', 'slug': 'inventory-upcoming-expiry-list', 'label': 'Expiry List', 'icon': 'lucide:minus' }
    ]
  },
  {
    'isTitle': true,
    'label': 'ORDERS'
  },
  {
    'icon': 'lucide:receipt',
    'slug': 'orders-all',
    'label': 'All Orders',
    'children': [
      { 'url': '/orders/all', 'slug': 'orders-all-list', 'label': 'View All Orders', 'icon': 'lucide:list-ordered' }
    ]
  },
  {
    'icon': 'lucide:calculator',
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
    'icon': 'lucide:user-plus',
    'slug': 'suppliers',
    'label': 'Suppliers',
    'url': '/suppliers'
  },
  {
    'isTitle': true,
    'label': 'STAFF & DELIVERY'
  },
  {
    'icon': 'lucide:users-2',
    'slug': 'staff-management',
    'label': 'Staff Management',
    'children': [
      { 'url': '/staff', 'slug': 'staff-management-list', 'label': 'Manage Staff', 'icon': 'lucide:user-cog' }
    ]
  },
  {
    'icon': 'lucide:truck',
    'slug': 'delivery-boys',
    'label': 'Delivery Boys',
    'children': [
      { 'url': '/delivery-boys', 'slug': 'delivery-boys-list', 'label': 'Manage Delivery', 'icon': 'lucide:map-pin' }
    ]
  },
  {
    'icon': 'lucide:ticket',
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
    'icon': 'lucide:bar-chart-2',
    'slug': 'reports',
    'label': 'Reports',
    'children': [
      { 'url': '/reports/sales', 'slug': 'reports-sales', 'label': 'Sales Report', 'icon': 'lucide:trending-up' },
      { 'url': '/reports/inventory', 'slug': 'reports-inventory', 'label': 'Inventory Report', 'icon': 'lucide:package-check' }
    ]
  },
  {
    'icon': 'lucide:settings',
    'slug': 'settings',
    'label': 'Settings',
    'children': [
      { 'url': '/settings/general', 'slug': 'settings-general', 'label': 'General Settings', 'icon': 'lucide:sliders' }
    ]
  }
];
