import MainLayout from '@/layouts/MainLayout'
import { lazy } from 'react'
import { Navigate } from 'react-router'

// Auth View
const SignIn = lazy(() => import('@/views/auth/basic/sign-in'))
const ResetPass = lazy(() => import('@/views/auth/basic/reset-pass'))
const NewPass = lazy(() => import('@/views/auth/basic/new-pass'))

// Admin Views
const Dashboard = lazy(() => import('@/views/admin/dashboard/ecommerce'))
const StaffList = lazy(() => import('@/views/admin/staff'))
const DeliveryBoys = lazy(() => import('@/views/admin/delivery-boys'))
const Customers = lazy(() => import('@/views/admin/customers'))
const Suppliers = lazy(() => import('@/views/admin/suppliers'))
const Categories = lazy(() => import('@/views/admin/catalog/categories'))
const Products = lazy(() => import('@/views/admin/catalog/products'))
const InventoryOverview = lazy(() => import('@/views/admin/inventory/overview'))
const StockEntry = lazy(() => import('@/views/admin/inventory/stock-entry'))
const LowStock = lazy(() => import('@/views/admin/inventory/low-stock'))
const UpcomingExpiry = lazy(() => import('@/views/admin/inventory/upcoming-expiry'))
const InventoryLogs = lazy(() => import('@/views/admin/inventory/logs'))
const OrdersAll = lazy(() => import('@/views/admin/orders/all'))
const POSBilling = lazy(() => import('@/views/admin/pos'))
const Coupons = lazy(() => import('@/views/admin/coupons'))
const Payments = lazy(() => import('@/views/admin/payments'))
const Invoices = lazy(() => import('@/views/admin/invoices'))
const CreateInvoice = lazy(() => import('@/views/admin/invoices/CreateInvoice'))
const ViewInvoice = lazy(() => import('@/views/admin/invoices/ViewInvoice'))
const SalesReport = lazy(() => import('@/views/admin/reports/sales'))
const InventoryReport = lazy(() => import('@/views/admin/reports/inventory'))
const PaymentReport = lazy(() => import('@/views/admin/reports/payment'))
const CustomerReport = lazy(() => import('@/views/admin/reports/customer'))
const Settings = lazy(() => import('@/views/admin/settings'))

import { ProtectedRoute } from './ProtectedRoute'

export const routes = [
  {
    path: '',
    element: <Navigate to="/dashboard" />,
  },
  {
    element: <ProtectedRoute />, // Require basic authentication
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: '/dashboard', Component: Dashboard },
          { path: '/staff', element: <ProtectedRoute permission="staff" />, children: [{ path: '', Component: StaffList }] },
          { path: '/delivery-boys', element: <ProtectedRoute permission="delivery" />, children: [{ path: '', Component: DeliveryBoys }] },
          { path: '/customers', element: <ProtectedRoute permission="pos" />, children: [{ path: '', Component: Customers }] },
          { path: '/suppliers', element: <ProtectedRoute permission="inventory" />, children: [{ path: '', Component: Suppliers }] },
          { path: '/catalog/categories', element: <ProtectedRoute permission="products" />, children: [{ path: '', Component: Categories }] },
          { path: '/catalog/products', element: <ProtectedRoute permission="products" />, children: [{ path: '', Component: Products }] },
          { path: '/inventory/overview', element: <ProtectedRoute permission="inventory" />, children: [{ path: '', Component: InventoryOverview }] },
          { path: '/inventory/stock-entry', element: <ProtectedRoute permission="inventory" />, children: [{ path: '', Component: StockEntry }] },
          { path: '/inventory/low-stock', element: <ProtectedRoute permission="inventory" />, children: [{ path: '', Component: LowStock }] },
          { path: '/inventory/upcoming-expiry', element: <ProtectedRoute permission="inventory" />, children: [{ path: '', Component: UpcomingExpiry }] },
          { path: '/inventory/logs', element: <ProtectedRoute permission="inventory" />, children: [{ path: '', Component: InventoryLogs }] },
          { path: '/orders/all', element: <ProtectedRoute permission="orders" />, children: [{ path: '', Component: OrdersAll }] },
          { path: '/pos', element: <ProtectedRoute permission="pos" />, children: [{ path: '', Component: POSBilling }] },
          { path: '/coupons', element: <ProtectedRoute permission="coupons" />, children: [{ path: '', Component: Coupons }] },
          { path: '/payments', element: <ProtectedRoute permission="payments" />, children: [{ path: '', Component: Payments }] },
          { path: '/invoices', element: <ProtectedRoute permission="payments" />, children: [
            { path: '', Component: Invoices },
            { path: 'create', Component: CreateInvoice },
            { path: 'edit/:id', Component: CreateInvoice },
            { path: ':id', Component: ViewInvoice },
          ] },
          { path: '/reports/sales', element: <ProtectedRoute permission="reports" />, children: [{ path: '', Component: SalesReport }] },
          { path: '/reports/inventory', element: <ProtectedRoute permission="reports" />, children: [{ path: '', Component: InventoryReport }] },
          { path: '/reports/payment', element: <ProtectedRoute permission="reports" />, children: [{ path: '', Component: PaymentReport }] },
          { path: '/reports/customer', element: <ProtectedRoute permission="reports" />, children: [{ path: '', Component: CustomerReport }] },
          { path: '/settings', Component: Settings }, // Settings might be Admin only implicitly
        ],
      }
    ]
  },
  {
    path: '/auth/sign-in',
    Component: SignIn,
  },
  {
    path: '/auth/reset-pass',
    Component: ResetPass,
  },
  {
    path: '/reset-password/:token',
    Component: NewPass,
  },
  // Catch all unmatched routes to dashboard
  {
    path: '*',
    element: <Navigate to="/dashboard" />,
  }
]
