import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SuperAdminRoute = ({ children }) => {
  const { isSuperAdmin, loading } = useAuth();

  if (loading) return null;

  if (!isSuperAdmin) {
    return <Navigate to="/historias" replace />;
  }

  return children;
};

export default SuperAdminRoute;
