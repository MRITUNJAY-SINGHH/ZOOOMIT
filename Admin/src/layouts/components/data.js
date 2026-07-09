export const menuItems = [
  { isTitle: true, label: 'Dashboard' },
  { icon: 'lucide:layout-dashboard', slug: 'dashboard', label: 'Dashboard', url: '/dashboard' },
  { isTitle: true, label: 'Delivery', roles: ['DeliveryBoy'] },
  { icon: 'lucide:truck', slug: 'active-deliveries', label: 'Active Deliveries', url: '/delivery/active', roles: ['DeliveryBoy'] },
  { icon: 'lucide:history', slug: 'delivery-history', label: 'Delivery History', url: '/delivery/history', roles: ['DeliveryBoy'] },
  
  { isTitle: true, label: 'Catalog', permission: 'products.view' },
  { icon: 'lucide:package', slug: 'catalog-products', label: 'Products', url: '/catalog/products', permission: 'products.view' },
  { icon: 'lucide:layout-grid', slug: 'catalog-categories', label: 'Categories', url: '/catalog/categories', permission: 'products.view' },
  { icon: 'lucide:upload-cloud', slug: 'catalog-import', label: 'Bulk Product Import', url: '/catalog/import', permission: 'products.create' },
  
  { isTitle: true, label: 'Inventory', permission: 'inventory.view' },
  { icon: 'lucide:box', slug: 'inventory', label: 'Inventory', permission: 'inventory.view', children: [
      { url: '/inventory/stock-entry', slug: 'inventory-stock-entry', label: 'Stock Entry', icon: 'lucide:plus-square', permission: 'inventory.create' },
      { url: '/inventory/logs', slug: 'inventory-logs', label: 'Inventory Logs', icon: 'lucide:clipboard-list', permission: 'inventory.view' },
      { url: '/inventory/low-stock', slug: 'inventory-low-stock', label: 'Low Stock', icon: 'lucide:alert-triangle', permission: 'inventory.view' },
      { url: '/inventory/upcoming-expiry', slug: 'inventory-upcoming-expiry', label: 'Upcoming Expiry', icon: 'lucide:clock', permission: 'inventory.view' }
    ]
  },
  
  { isTitle: true, label: 'Sales', permission: 'orders.view', hideForRoles: ['DeliveryBoy'] },
  { icon: 'lucide:shopping-cart', slug: 'orders', label: 'Orders', url: '/orders/all', permission: 'orders.view', hideForRoles: ['DeliveryBoy'] },
  { icon: 'lucide:calculator', slug: 'pos', label: 'POS Billing', url: '/pos', permission: 'pos.view' },
  { icon: 'lucide:history', slug: 'billing-history', label: 'Billing History', url: '/pos/history', permission: 'pos.view' },
  { icon: 'lucide:corner-up-left', slug: 'returns', label: 'Returns', url: '/pos/returns', permission: 'pos.create' },
  
  { isTitle: true, label: 'CRM', permission: 'customers.view', hideForRoles: ['DeliveryBoy'] },
  { icon: 'lucide:users', slug: 'customers', label: 'Customers', url: '/customers', permission: 'customers.view', hideForRoles: ['DeliveryBoy'] },
  { icon: 'lucide:user-plus', slug: 'suppliers', label: 'Suppliers', url: '/suppliers', permission: 'suppliers.view' },
  
  { isTitle: true, label: 'Team', permission: 'staff.view' },
  { icon: 'lucide:user-cog', slug: 'staff', label: 'Staff', url: '/staff', permission: 'staff.view' },
  { icon: 'lucide:truck', slug: 'delivery-boys', label: 'Delivery Boys', url: '/delivery-boys', permission: 'staff.view' },
  
  { isTitle: true, label: 'Marketing', permission: 'coupons.view' },
  { icon: 'lucide:ticket', slug: 'coupons', label: 'Coupons', url: '/coupons', permission: 'coupons.view' },
  
  { isTitle: true, label: 'Finance', permission: 'payments.view' },
  { icon: 'lucide:credit-card', slug: 'payments', label: 'Payments', url: '/payments', permission: 'payments.view' },
  { icon: 'lucide:file-text', slug: 'invoices', label: 'Invoices', url: '/invoices', permission: 'payments.view' },
  
  { isTitle: true, label: 'Reports', permission: 'reports.view' },
  { icon: 'lucide:pie-chart', slug: 'reports', label: 'Reports', permission: 'reports.view', children: [
      { url: '/reports/sales', slug: 'reports-sales', label: 'Sales Report', icon: 'lucide:trending-up', permission: 'reports.view' },
      { url: '/reports/inventory', slug: 'reports-inventory', label: 'Inventory Report', icon: 'lucide:box', permission: 'reports.view' },
      { url: '/reports/payment', slug: 'reports-payment', label: 'Payment Report', icon: 'lucide:credit-card', permission: 'reports.view' },
      { url: '/reports/customer', slug: 'reports-customer', label: 'Customer Report', icon: 'lucide:users', permission: 'reports.view' }
    ]
  },
  
  { isTitle: true, label: 'System', permission: 'settings.view' },
  { icon: 'lucide:settings', slug: 'settings', label: 'Settings', url: '/settings', permission: 'settings.view' }
];
