
import React, { ReactNode } from 'react';
import { Card } from '@/components/ui/card';

interface DashboardLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  title,
  description,
  children,
  actions,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground mt-2">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="grid gap-6">{children}</div>
    </div>
  );
};
