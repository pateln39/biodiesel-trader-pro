
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { queryClient } from '@/lib/query-client';
import { Layout } from '@/core/components';
import PricingRoutes from '@/routes/PricingRoutes';

// Import directly from their respective files for now
import TradesPage from '@/modules/trade/pages/TradesPage';
import TradeEntryPage from '@/modules/trade/pages/TradeEntryPage';
import TradeEditPage from '@/modules/trade/pages/TradeEditPage';
import OperationsPage from '@/modules/operations/pages/OperationsPage';
import MTMPage from '@/modules/exposure/pages/MTMPage';
import ExposurePage from '@/modules/exposure/pages/ExposurePage';
import PNLPage from '@/modules/exposure/pages/PNLPage';
import PricesPage from '@/modules/exposure/pages/PricesPage';
import AuditLogPage from '@/modules/admin/pages/AuditLogPage';
import PricingAdminPage from '@/modules/admin/pages/PricingAdminPage';
import ProfilePage from '@/modules/admin/pages/ProfilePage';
import NotFound from '@/modules/admin/pages/NotFound';

// Create temporary Dashboard component
import Dashboard from '@/modules/trade/pages/Index';

// Create a basic Settings Page
const SettingsPage = () => (
  <Layout>
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      <p className="text-muted-foreground">
        Manage your account settings and preferences.
      </p>
    </div>
  </Layout>
);

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
