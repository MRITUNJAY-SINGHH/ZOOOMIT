import { useAuthContext } from '@/context/useAuthContext';

const PermissionGuard = ({ permission, children, fallback = null }) => {
  const { hasPermission } = useAuthContext();
  
  if (hasPermission(permission)) {
    return <>{children}</>;
  }
  
  return fallback;
};

export default PermissionGuard;
