import { Navigate, Outlet } from 'react-router';
import { useAuthContext } from '../context/useAuthContext';

export const ProtectedRoute = ({ permission, allowedRoles, hideForRoles }) => {
  const { isAuthenticated, hasPermission, user } = useAuthContext();

  if (!isAuthenticated) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (hideForRoles && user && hideForRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (permission && !hasPermission(permission)) {
    // If they don't have permission, push them back to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
