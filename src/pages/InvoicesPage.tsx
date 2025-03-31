
import React from 'react';
import Layout from '@/components/Layout';

const InvoicesPage = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Manage your invoices
          </p>
        </div>
        
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <p>Invoices content will be displayed here.</p>
        </div>
      </div>
    </Layout>
  );
};

export default InvoicesPage;
