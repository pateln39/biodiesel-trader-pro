
import React from 'react';
import { Outlet } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Sidebar } from '@/components/ui/sidebar';

export const AppLayout: React.FC = () => {
  // Set up toast provider for notifications
  const { toast } = useToast();

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <Outlet />
      </div>
      <Toaster />
    </div>
  );
};
