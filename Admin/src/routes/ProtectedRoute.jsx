import { Navigate, Outlet } from 'react-router';
import { useAuthContext } from '../context/useAuthContext';

export const ProtectedRoute = ({ permission }) => {
  const { isAuthenticated, hasPermission } = useAuthContext();

  if (!isAuthenticated) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  if (permission && !hasPermission(permission)) {
    // If they don't have permission, push them back to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
