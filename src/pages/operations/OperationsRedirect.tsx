
import React from 'react';
import { Navigate } from 'react-router-dom';

const OperationsRedirect = () => {
  return <Navigate to="/operations/open-trades" replace />;
};

export default OperationsRedirect;

