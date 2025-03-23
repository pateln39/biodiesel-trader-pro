
import React from 'react';
import { DashboardCard } from '@/core/components';

const Dashboard = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <DashboardCard
          title="Trading"
          value="24"
          description="Active trades"
          href="/trades"
        />
        <DashboardCard
          title="Operations"
          value="12"
          description="Pending operations"
          href="/operations"
        />
        <DashboardCard
          title="Pricing"
          value="187"
          description="Price points"
          href="/risk/prices"
        />
        <DashboardCard
          title="Risk Exposure"
          value="€1.2M"
          description="Current exposure"
          href="/risk/exposure"
        />
        <DashboardCard
          title="MTM"
          value="€875K"
          description="Mark-to-market value"
          href="/risk/mtm"
        />
        <DashboardCard
          title="PnL"
          value="€458K"
          description="Current period"
          href="/risk/pnl"
        />
      </div>
    </div>
  );
};

export default Dashboard;
