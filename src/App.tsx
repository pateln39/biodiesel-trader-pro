
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import StoragePage from "./pages/operations/StoragePage";
import InventoryMTMPage from "./pages/risk/InventoryMTMPage";

import { KeyboardNavigationProvider } from './contexts/KeyboardNavigationContext';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <KeyboardNavigationProvider>
            <Routes>
              <Route path="/" element={<StoragePage />} />
              <Route path="/storage" element={<StoragePage />} />
              <Route path="/risk/inventory-mtm" element={<InventoryMTMPage />} />
            </Routes>
            <Toaster />
          </KeyboardNavigationProvider>
        </ThemeProvider>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
