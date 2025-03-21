
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import TradesPage from "./pages/trades/TradesPage";
import TradeEntryPage from "./pages/trades/TradeEntryPage";
import TradeEditPage from "./pages/trades/TradeEditPage";
import OperationsPage from "./pages/operations/OperationsPage";
import ExposurePage from "./pages/risk/ExposurePage";
import AuditLogPage from "./pages/audit/AuditLogPage";
import ProfilePage from "./pages/profile/ProfilePage";
import PricingAdminPage from "./pages/pricing/PricingAdminPage";
import MTMPage from "./pages/risk/MTMPage";
import PNLPage from "./pages/risk/PNLPage";
import PricesPage from "./pages/risk/PricesPage";
import MigrationManager from "./components/MigrationManager";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <MigrationManager />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            
            {/* Trade Routes */}
            <Route path="/trades" element={<TradesPage />} />
            <Route path="/trades/new" element={<TradeEntryPage />} />
            <Route path="/trades/edit/:id" element={<TradeEditPage />} />
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
