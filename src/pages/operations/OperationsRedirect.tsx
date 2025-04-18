
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const OperationsRedirect = () => {
  const location = useLocation();
  
  // Handle legacy route redirect
  if (location.pathname === '/operations/inventory') {
    return <Navigate to="/operations/storage" replace />;
  }
  
  return <Navigate to="/operations/open-trades" replace />;
};

export default OperationsRedirect;
