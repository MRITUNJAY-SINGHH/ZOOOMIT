export const menuItems = [
  {
    'icon': 'lucide:layout-dashboard',
    'slug': 'dashboard',
    'label': 'Dashboard',
    'url': '/dashboard'
  },
  {
    'icon': 'lucide:grid',
    'slug': 'catalog',
    'label': 'Catalog',
    'children': [
      { 'url': '/catalog/categories', 'slug': 'catalog-categories', 'label': 'Categories', 'icon': 'lucide:layout-grid' },
      { 'url': '/catalog/products', 'slug': 'catalog-products', 'label': 'Products', 'icon': 'lucide:package' }
    ]
  },
  {
    'icon': 'lucide:box',
    'slug': 'inventory',
    'label': 'Inventory',
    'children': [
      { 'url': '/inventory/overview', 'slug': 'inventory-overview', 'label': 'Inventory Overview', 'icon': 'lucide:activity' },
      { 'url': '/inventory/stock-entry', 'slug': 'inventory-stock-entry', 'label': 'Stock Entry', 'icon': 'lucide:plus-square' },
      { 'url': '/inventory/logs', 'slug': 'inventory-logs', 'label': 'Inventory Logs', 'icon': 'lucide:clipboard-list' },
      { 'url': '/inventory/low-stock', 'slug': 'inventory-low-stock', 'label': 'Low Stock', 'icon': 'lucide:alert-triangle' },
      { 'url': '/inventory/upcoming-expiry', 'slug': 'inventory-upcoming-expiry', 'label': 'Upcoming Expiry', 'icon': 'lucide:clock' }
    ]
  },
  {
    'icon': 'lucide:shopping-cart',
    'slug': 'orders',
    'label': 'Orders',
    'children': [
      { 'url': '/orders/all', 'slug': 'orders-all', 'label': 'All Orders', 'icon': 'lucide:list-ordered' }
    ]
  },
  {
    'icon': 'lucide:calculator',
    'slug': 'pos',
    'label': 'POS Billing',
    'children': [
      { 'url': '/pos/new', 'slug': 'pos-new', 'label': 'New Billing', 'icon': 'lucide:plus-circle' },
      { 'url': '/pos/history', 'slug': 'pos-history', 'label': 'Billing History', 'icon': 'lucide:history' },
      { 'url': '/pos/returns', 'slug': 'pos-returns', 'label': 'Returns', 'icon': 'lucide:corner-up-left' }
    ]
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
    'icon': 'lucide:user-cog',
    'slug': 'staff',
    'label': 'Staff',
    'url': '/staff'
  },
  {
    'icon': 'lucide:truck',
    'slug': 'delivery',
    'label': 'Delivery',
    'url': '/delivery-boys'
  },
  {
    'icon': 'lucide:tag',
    'slug': 'promotions',
    'label': 'Promotions',
    'children': [
      { 'url': '/coupons', 'slug': 'promotions-coupons', 'label': 'Coupons', 'icon': 'lucide:ticket' }
    ]
  },
  {
    'icon': 'lucide:dollar-sign',
    'slug': 'finance',
    'label': 'Finance',
    'children': [
      { 'url': '/payments', 'slug': 'finance-payments', 'label': 'Payments', 'icon': 'lucide:credit-card' }
    ]
  },
  {
    'icon': 'lucide:bar-chart-2',
    'slug': 'reports',
    'label': 'Reports',
    'children': [
      { 'url': '/reports/sales', 'slug': 'reports-sales', 'label': 'Sales Report', 'icon': 'lucide:trending-up' },
      { 'url': '/reports/inventory', 'slug': 'reports-inventory', 'label': 'Inventory Report', 'icon': 'lucide:package-check' },
      { 'url': '/reports/payment', 'slug': 'reports-payment', 'label': 'Payment Report', 'icon': 'lucide:file-text' },
      { 'url': '/reports/customer', 'slug': 'reports-customer', 'label': 'Customer Report', 'icon': 'lucide:users-2' }
    ]
  },
  {
    'icon': 'lucide:settings',
    'slug': 'settings',
    'label': 'Settings',
    'children': [
      { 'url': '/settings/general', 'slug': 'settings-general', 'label': 'General Settings', 'icon': 'lucide:sliders' },
      { 'url': '/settings/invoice', 'slug': 'settings-invoice', 'label': 'Invoice Settings', 'icon': 'lucide:file-text' },
      { 'url': '/settings/security', 'slug': 'settings-security', 'label': 'Security Settings', 'icon': 'lucide:shield' }
    ]
  }
];
