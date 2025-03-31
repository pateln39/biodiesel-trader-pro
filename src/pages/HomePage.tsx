
import React from 'react';
import { Navigate } from 'react-router-dom';

const HomePage = () => {
  // Simply redirect to dashboard for now
  return <Navigate to="/dashboard" replace />;
};

export default HomePage;
