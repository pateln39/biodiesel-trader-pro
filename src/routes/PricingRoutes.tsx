
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { HistoricalPricesView } from '@/modules/pricing/components/historical';
import { PriceDetails, PriceUploader } from '@/modules/pricing/components';

const PricingRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HistoricalPricesView />} />
      <Route path="/upload" element={<PriceUploader />} />
      <Route path="/:id" element={<PriceDetails />} />
    </Routes>
  );
};

export default PricingRoutes;
