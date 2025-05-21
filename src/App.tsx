
import { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import './App.css';
import { supabase } from './integrations/supabase/client';

import { migrateProductColors } from './utils/migrateProductColors';
import ProductColorsPage from './pages/reference/ProductColorsPage';
import TradesPage from './pages/trades/TradesPage';

// Run the migration when the app starts
// This is a one-time operation, but safe to run multiple times
migrateProductColors().catch(console.error);

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<TradesPage />} />
          <Route path="/trades" element={<TradesPage />} />
          <Route path="/reference/product-colors" element={<ProductColorsPage />} />
        </Routes>
      </Router>
      <Toaster />
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
