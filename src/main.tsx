
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { Toaster } from './components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KeyboardShortcutsProvider } from './contexts/KeyboardShortcutsContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <KeyboardShortcutsProvider>
          <App />
          <Toaster />
        </KeyboardShortcutsProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
