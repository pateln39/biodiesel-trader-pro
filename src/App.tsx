
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { queryClient } from '@/lib';
import { Layout } from '@/core/components';

// Import pages from their respective modules
import { TradesPage, TradeEntryPage, TradeEditPage } from '@/modules/trade/pages';
import { OperationsPage } from '@/modules/operations/pages';
import { MTMPage, ExposurePage, PNLPage } from '@/modules/exposure/pages';
import { AuditLogPage, PricingAdminPage, ProfilePage, NotFound } from '@/modules/admin/pages';
import PricingRoutes from '@/routes/PricingRoutes';
import Dashboard from '@/pages/Dashboard';
import SettingsPage from '@/pages/SettingsPage';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/trades" element={<TradesPage />} />
            <Route path="/trades/new" element={<TradeEntryPage />} />
            <Route path="/trades/:id" element={<TradeEditPage />} />
            <Route path="/operations" element={<OperationsPage />} />
            <Route path="/risk/mtm" element={<MTMPage />} />
            <Route path="/risk/pnl" element={<PNLPage />} />
            <Route path="/risk/exposure" element={<ExposurePage />} />
            <Route path="/risk/prices/*" element={<PricingRoutes />} />
            <Route path="/admin/pricing" element={<PricingAdminPage />} />
            <Route path="/audit" element={<AuditLogPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Layout>
        <Toaster position="top-right" />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
