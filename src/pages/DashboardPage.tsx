
import React from 'react';
import Layout from '@/components/Layout';

const DashboardPage = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your trading activity
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="font-semibold">Pending Trades</h3>
            <p className="text-3xl font-bold mt-2">0</p>
          </div>
          
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="font-semibold">Open Invoices</h3>
            <p className="text-3xl font-bold mt-2">0</p>
          </div>
          
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="font-semibold">Risk Exposure</h3>
            <p className="text-3xl font-bold mt-2">$0</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
