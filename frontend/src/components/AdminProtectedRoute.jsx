// frontend/src/components/AdminProtectedRoute.jsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

const AdminProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Verifying permissions..." />;
  }

  // If not loading, check if user is logged in and is an admin
  if (!user || !user.is_admin) {
    // Redirect non-admins to the regular dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminProtectedRoute;