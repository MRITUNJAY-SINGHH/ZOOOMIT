import { useAuthContext } from '@/context/useAuthContext';
import { lazy, Suspense } from 'react';
import { Spinner } from 'react-bootstrap';

const AdminDashboard = lazy(() => import('@/views/admin/dashboard/ecommerce'));
const DeliveryDashboard = lazy(() => import('@/views/delivery/dashboard'));
const StaffDashboard = lazy(() => import('@/views/admin/dashboard/staff'));

const DashboardRouter = () => {
  const { user, hasPermission } = useAuthContext();
  
  if (!user) return null;

  if (user.role === 'DeliveryBoy') {
    return (
      <Suspense fallback={<div className="d-flex justify-content-center p-5"><Spinner animation="border" /></div>}>
        <DeliveryDashboard />
      </Suspense>
    );
  }

  if (hasPermission('reports.view')) {
    return (
      <Suspense fallback={<div className="d-flex justify-content-center p-5"><Spinner animation="border" /></div>}>
        <AdminDashboard />
      </Suspense>
    );
  }

  // Fallback for Cashier, Manager etc who don't have full report access
  return (
    <Suspense fallback={<div className="d-flex justify-content-center p-5"><Spinner animation="border" /></div>}>
      <StaffDashboard />
    </Suspense>
  );
};

export default DashboardRouter;
