
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { PricingAdminPage } from '@/modules/admin/pages';
import { PricesPage } from '@/modules/exposure/pages';

const PricingRoutes = () => {
  return (
    <Routes>
      <Route index element={<PricesPage />} />
      <Route path="admin" element={<PricingAdminPage />} />
    </Routes>
  );
};

export default PricingRoutes;
