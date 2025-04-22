import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import TradesPage from "./pages/trades/TradesPage";
import TradeEntryPage from "./pages/trades/TradeEntryPage";
import TradeEditPage from "./pages/trades/TradeEditPage";
import TradeDeletePage from "./pages/trades/TradeDeletePage";
import PaperTradeEditPage from "./pages/trades/PaperTradeEditPage";
import PaperTradeDeletePage from "./pages/trades/PaperTradeDeletePage";
import OperationsRedirect from "./pages/operations/OperationsRedirect";
import OpenTradesPage from "./pages/operations/OpenTradesPage";
import MovementsPage from "./pages/operations/MovementsPage";
import StoragePage from "./pages/operations/StoragePage";
import ExposurePage from "./pages/risk/ExposurePage";
import AuditLogPage from "./pages/audit/AuditLogPage";
import ProfilePage from "./pages/profile/ProfilePage";
import PricingAdminPage from "./pages/pricing/PricingAdminPage";
import MTMPage from "./pages/risk/MTMPage";
import PNLPage from "./pages/risk/PNLPage";
import PricesPage from "./pages/risk/PricesPage";
import InventoryMTMPage from "./pages/risk/InventoryMTMPage";

const queryClient = new QueryClient();

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
            
            {/* Physical Trade Routes */}
            <Route path="/trades/edit/:id" element={<TradeEditPage />} />
            <Route path="/trades/:id" element={<TradeEditPage />} />
            <Route path="/trades/delete/:id" element={<TradeDeletePage />} />
            <Route path="/trades/delete/:id/leg/:legId" element={<TradeDeletePage />} />
            
            {/* Paper Trade Routes */}
            <Route path="/trades/paper/edit/:id" element={<PaperTradeEditPage />} />
            <Route path="/trades/paper/delete/:id" element={<PaperTradeDeletePage />} />
            <Route path="/trades/paper/delete/:id/leg/:legId" element={<PaperTradeDeletePage />} />
            
            {/* Operations Routes */}
            <Route path="/operations" element={<OperationsRedirect />} />
            <Route path="/operations/open-trades" element={<OpenTradesPage />} />
            <Route path="/operations/movements" element={<MovementsPage />} />
            <Route path="/operations/storage" element={<StoragePage />} />
            
            {/* Risk Routes */}
            <Route path="/risk/mtm" element={<MTMPage />} />
            <Route path="/risk/pnl" element={<PNLPage />} />
            <Route path="/risk/exposure" element={<ExposurePage />} />
            <Route path="/risk/prices" element={<PricesPage />} />
            <Route path="/risk/inventory-mtm" element={<InventoryMTMPage />} />
            
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
