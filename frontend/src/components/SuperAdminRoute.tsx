import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface SuperAdminRouteProps {
  children: ReactNode;
}

const SuperAdminRoute = ({ children }: SuperAdminRouteProps) => {
  const { isSuperAdmin, loading } = useAuth();

  if (loading) return null;

  if (!isSuperAdmin) {
    return <Navigate to="/historias" replace />;
  }

  return <>{children}</>;
};

export default SuperAdminRoute;
