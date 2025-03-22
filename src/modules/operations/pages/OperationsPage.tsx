
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Layout } from '@/core/components';

const OperationsPage = () => {
  return (
    <Layout>
      <Helmet>
        <title>Operations</title>
      </Helmet>
      
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Operations</h1>
        <p className="text-muted-foreground">
          Track and manage operations for physical trades
        </p>
        
        {/* Operations content will be added here */}
        <div className="p-6 bg-card rounded-md border">
          <p className="text-center text-muted-foreground">
            Operations dashboard will be displayed here
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default OperationsPage;
