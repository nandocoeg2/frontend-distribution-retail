import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/authService';
import MainLayout from '../templates/MainLayout.jsx';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to='/login' replace />;
  }

  return <MainLayout>{children}</MainLayout>;
};

export default ProtectedRoute;
