import React from 'react';
import { useAuthContext } from '@/context/useAuthContext';

export default function PermissionGuard({ permission, children, fallback = null }) {
  const { user } = useAuthContext();

  if (!user) return fallback;
  if (user.role === 'Admin') return children;

  const [module, action] = permission.split('.');
  if (user.permissions && user.permissions[module] && user.permissions[module][action]) {
    return children;
  }

  return fallback;
}
