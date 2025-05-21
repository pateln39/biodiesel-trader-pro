import { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';

import './App.css';
import TradeEntryPage from './pages/trades/TradeEntryPage';
import TradesListPage from './pages/trades/TradesListPage';
import OpenTradesPage from './pages/operations/OpenTradesPage';
import StoragePage from './pages/operations/StoragePage';
import PricingPage from './pages/pricing/PricingPage';
import NominatePage from './pages/operations/NominatePage';
import InvoicesPage from './pages/finance/InvoicesPage';
import PaymentsPage from './pages/finance/PaymentsPage';
import CounterpartiesPage from './pages/reference/CounterpartiesPage';
import ProductsPage from './pages/reference/ProductsPage';
import SustainabilityPage from './pages/reference/SustainabilityPage';
import CreditStatusesPage from './pages/reference/CreditStatusesPage';
import CustomsStatusesPage from './pages/reference/CustomsStatusesPage';
import IncotermsPage from './pages/reference/IncotermsPage';
import PaymentTermsPage from './pages/reference/PaymentTermsPage';
import BrokersPage from './pages/reference/BrokersPage';
import PricingInstrumentsPage from './pages/reference/PricingInstrumentsPage';
import HistoricalPricesPage from './pages/reference/HistoricalPricesPage';
import ForwardPricesPage from './pages/reference/ForwardPricesPage';
import PaperTradeProductsPage from './pages/reference/PaperTradeProductsPage';
import ProductRelationshipsPage from './pages/reference/ProductRelationshipsPage';
import TradingPeriodsPage from './pages/reference/TradingPeriodsPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';
import UsersPage from './pages/admin/UsersPage';
import SettingsPage from './pages/admin/SettingsPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import { useUser } from '@supabase/auth-helpers-react';
import Auth from './components/Auth';
import Account from './components/Account';
import { supabase } from './integrations/supabase/client';

import { migrateProductColors } from './utils/migrateProductColors';

// Run the migration when the app starts
// This is a one-time operation, but safe to run multiple times
migrateProductColors().catch(console.error);

const queryClient = new QueryClient();

function App() {
  const user = useUser();

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route
            path="/"
            element={
              !user ? (
                <Auth />
              ) : (
                <DashboardPage key="dashboard" />
              )
            }
          />
          <Route path="/account" element={<Account key="account" />} />
          <Route path="/trades" element={<TradesListPage key="trades" />} />
          <Route path="/trades/new" element={<TradeEntryPage key="trades-new" />} />
          <Route path="/operations/open-trades" element={<OpenTradesPage key="open-trades" />} />
          <Route path="/operations/storage" element={<StoragePage key="storage" />} />
          <Route path="/operations/nominate" element={<NominatePage key="nominate" />} />
          <Route path="/pricing" element={<PricingPage key="pricing" />} />
          <Route path="/finance/invoices" element={<InvoicesPage key="invoices" />} />
          <Route path="/finance/payments" element={<PaymentsPage key="payments" />} />
          <Route path="/reference/counterparties" element={<CounterpartiesPage key="counterparties" />} />
          <Route path="/reference/products" element={<ProductsPage key="products" />} />
          <Route path="/reference/sustainability" element={<SustainabilityPage key="sustainability" />} />
          <Route path="/reference/credit-statuses" element={<CreditStatusesPage key="credit-statuses" />} />
          <Route path="/reference/customs-statuses" element={<CustomsStatusesPage key="customs-statuses" />} />
          <Route path="/reference/incoterms" element={<IncotermsPage key="incoterms" />} />
          <Route path="/reference/payment-terms" element={<PaymentTermsPage key="payment-terms" />} />
          <Route path="/reference/brokers" element={<BrokersPage key="brokers" />} />
          <Route path="/reference/pricing-instruments" element={<PricingInstrumentsPage key="pricing-instruments" />} />
          <Route path="/reference/historical-prices" element={<HistoricalPricesPage key="historical-prices" />} />
          <Route path="/reference/forward-prices" element={<ForwardPricesPage key="forward-prices" />} />
          <Route path="/reference/paper-trade-products" element={<PaperTradeProductsPage key="paper-trade-products" />} />
          <Route path="/reference/product-relationships" element={<ProductRelationshipsPage key="product-relationships" />} />
          <Route path="/reference/trading-periods" element={<TradingPeriodsPage key="trading-periods" />} />
          <Route path="/admin/audit-logs" element={<AuditLogsPage key="audit-logs" />} />
          <Route path="/admin/users" element={<UsersPage key="users" />} />
          <Route path="/admin/settings" element={<SettingsPage key="settings" />} />
        </Routes>
      </Router>
      <Toaster />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}

export default App;
