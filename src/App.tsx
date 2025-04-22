import { BrowserRouter } from 'react-router-dom';
import './App.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';
import { Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { KeyboardShortcutsProvider } from '@/context/KeyboardShortcutsContext';
import { KeyboardShortcutGuide } from '@/components/ui/keyboard-shortcut-guide';

// Import pages
import OperationsPage from '@/pages/operations/OperationsPage';
import TradesPage from '@/pages/TradesPage';
import RiskPage from '@/pages/RiskPage';
import PricingPage from '@/pages/PricingPage';
import StoragePage from '@/pages/operations/StoragePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <KeyboardShortcutsProvider>
              <div className="app">
                <Routes>
                  <Route path="/" element={<OperationsPage />} />
                  <Route path="/operations" element={<OperationsPage />} />
                  <Route path="/operations/storage" element={<StoragePage />} />
                  <Route path="/trades" element={<TradesPage />} />
                  <Route path="/risk" element={<RiskPage />} />
                  <Route path="/pricing" element={<PricingPage />} />
                </Routes>
                <Toaster />
                <KeyboardShortcutGuide />
              </div>
            </KeyboardShortcutsProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
