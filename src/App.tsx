import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

import HomePage from '@/pages/HomePage';
import DashboardPage from '@/pages/DashboardPage';
import TradesPage from '@/pages/trades/TradesPage';
import TradeEntryPage from '@/pages/trades/TradeEntryPage';
import TradeDetailPage from '@/pages/trades/TradeDetailPage';
import TradeEditPage from '@/pages/trades/TradeEditPage';
import NominationsPage from '@/pages/NominationsPage';
import InvoicesPage from '@/pages/InvoicesPage';
import PaymentsPage from '@/pages/PaymentsPage';
import ExposurePage from '@/pages/ExposurePage';
import PricesPage from '@/pages/risk/PricesPage';
import NotFoundPage from '@/pages/NotFoundPage';
import BulkImportPage from '@/pages/trades/BulkImportPage';

function App() {
  return (
    <HelmetProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/trades" element={<TradesPage />} />
          <Route path="/trades/new" element={<TradeEntryPage />} />
          <Route path="/trades/import" element={<BulkImportPage />} /> {/* New import route */}
          <Route path="/trades/:id" element={<TradeDetailPage />} />
          <Route path="/trades/:id/edit" element={<TradeEditPage />} />
          <Route path="/nominations" element={<NominationsPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/exposure" element={<ExposurePage />} />
          <Route path="/prices" element={<PricesPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </HelmetProvider>
  );
}

export default App;
