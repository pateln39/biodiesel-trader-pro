
import React from 'react';
import { Route } from 'react-router-dom';
import PricingAdminPage from '@/pages/pricing/PricingAdminPage';

const PricingRoutes = () => {
  return (
    <Route path="/pricing">
      <Route path="admin" element={<PricingAdminPage />} />
    </Route>
  );
};

export default PricingRoutes;
