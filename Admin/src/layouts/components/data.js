export const menuItems = [
  { isTitle: true, label: 'Dashboard' },
  {
    icon: 'lucide:layout-dashboard',
    slug: 'dashboard',
    label: 'Dashboard',
    url: '/dashboard'
  },
  { isTitle: true, label: 'Catalog' },
  {
    icon: 'lucide:package',
    slug: 'catalog-products',
    label: 'Products',
    url: '/catalog/products'
  },
  {
    icon: 'lucide:layout-grid',
    slug: 'catalog-categories',
    label: 'Categories',
    url: '/catalog/categories'
  },
  {
    icon: 'lucide:upload-cloud',
    slug: 'catalog-import',
    label: 'Bulk Product Import',
    url: '/catalog/import'
  },
  { isTitle: true, label: 'Inventory' },
  {
    icon: 'lucide:box',
    slug: 'inventory',
    label: 'Inventory',
    children: [
      { url: '/inventory/stock-entry', slug: 'inventory-stock-entry', label: 'Stock Entry', icon: 'lucide:plus-square' },
      { url: '/inventory/logs', slug: 'inventory-logs', label: 'Inventory Logs', icon: 'lucide:clipboard-list' },
      { url: '/inventory/low-stock', slug: 'inventory-low-stock', label: 'Low Stock', icon: 'lucide:alert-triangle' },
      { url: '/inventory/upcoming-expiry', slug: 'inventory-upcoming-expiry', label: 'Upcoming Expiry', icon: 'lucide:clock' }
    ]
  },
  { isTitle: true, label: 'Sales' },
  {
    icon: 'lucide:shopping-cart',
    slug: 'orders',
    label: 'Orders',
    url: '/orders/all'
  },
  {
    icon: 'lucide:calculator',
    slug: 'pos',
    label: 'POS Billing',
    url: '/pos'
  },
  {
    icon: 'lucide:history',
    slug: 'billing-history',
    label: 'Billing History',
    url: '/pos/history'
  },
  {
    icon: 'lucide:corner-up-left',
    slug: 'returns',
    label: 'Returns',
    url: '/pos/returns'
  },
  { isTitle: true, label: 'CRM' },
  {
    icon: 'lucide:users',
    slug: 'customers',
    label: 'Customers',
    url: '/customers'
  },
  {
    icon: 'lucide:user-plus',
    slug: 'suppliers',
    label: 'Suppliers',
    url: '/suppliers'
  },
  { isTitle: true, label: 'Team' },
  {
    icon: 'lucide:user-cog',
    slug: 'staff',
    label: 'Staff',
    url: '/staff'
  },
  {
    icon: 'lucide:truck',
    slug: 'delivery-boys',
    label: 'Delivery Boys',
    url: '/delivery-boys'
  },
  { isTitle: true, label: 'Marketing' },
  {
    icon: 'lucide:ticket',
    slug: 'coupons',
    label: 'Coupons',
    url: '/coupons'
  },
  { isTitle: true, label: 'Finance' },
  {
    icon: 'lucide:credit-card',
    slug: 'payments',
    label: 'Payments',
    url: '/payments'
  },
  {
    icon: 'lucide:file-text',
    slug: 'invoices',
    label: 'Invoices',
    url: '/invoices'
  },
  { isTitle: true, label: 'Analytics' },
  {
    icon: 'lucide:trending-up',
    slug: 'reports-sales',
    label: 'Sales Reports',
    url: '/reports/sales'
  },
  {
    icon: 'lucide:package-check',
    slug: 'reports-inventory',
    label: 'Inventory Reports',
    url: '/reports/inventory'
  },
  {
    icon: 'lucide:file-text',
    slug: 'reports-payment',
    label: 'Payment Reports',
    url: '/reports/payment'
  },
  {
    icon: 'lucide:users-2',
    slug: 'reports-customer',
    label: 'Customer Reports',
    url: '/reports/customer'
  },
  { isTitle: true, label: 'System' },
  {
    icon: 'lucide:settings',
    slug: 'settings',
    label: 'Settings',
    url: '/settings'
  }
];

