
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

// Import pages from module pages
import Index from "@/modules/trade/pages/Index";
import NotFound from "@/modules/admin/pages/NotFound";
import TradesPage from "@/modules/trade/pages/TradesPage";
import TradeEntryPage from "@/modules/trade/pages/TradeEntryPage";
import OperationsPage from "@/modules/operations/pages/OperationsPage";
import ExposurePage from "@/modules/exposure/pages/ExposurePage";
import AuditLogPage from "@/modules/admin/pages/AuditLogPage";
import ProfilePage from "@/modules/admin/pages/ProfilePage";
import PricingAdminPage from "@/modules/admin/pages/PricingAdminPage";
import MTMPage from "@/modules/exposure/pages/MTMPage";
import PNLPage from "@/modules/exposure/pages/PNLPage";
import PricesPage from "@/modules/exposure/pages/PricesPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            
            {/* Trade Routes */}
            <Route path="/trades" element={<TradesPage />} />
            <Route path="/trades/new" element={<TradeEntryPage />} />
            <Route path="/trades/edit/:id" element={<NotFound />} />
            <Route path="/trades/:id" element={<NotFound />} />
            
            {/* Operations Routes */}
            <Route path="/operations" element={<OperationsPage />} />
            <Route path="/operations/:id" element={<NotFound />} />
            
            {/* Risk Routes */}
            <Route path="/risk/mtm" element={<MTMPage />} />
            <Route path="/risk/pnl" element={<PNLPage />} />
            <Route path="/risk/exposure" element={<ExposurePage />} />
            <Route path="/risk/prices" element={<PricesPage />} />
            
            {/* Pricing Routes - Admin Section */}
            <Route path="/pricing/admin" element={<PricingAdminPage />} />
            
            {/* Audit Log Routes */}
            <Route path="/audit" element={<AuditLogPage />} />
            
            {/* Profile and Settings */}
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<NotFound />} />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
