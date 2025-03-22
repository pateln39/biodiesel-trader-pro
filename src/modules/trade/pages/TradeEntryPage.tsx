
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Layout } from '@/core/components';

const TradeEntryPage = () => {
  return (
    <Layout>
      <Helmet>
        <title>Trade Entry</title>
      </Helmet>
      
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Trade Entry</h1>
        <p className="text-muted-foreground">
          Create new physical or paper trades in the system
        </p>
        
        {/* Trade entry form component will be added here */}
        <div className="p-6 bg-card rounded-md border">
          <p className="text-center text-muted-foreground">
            Trade entry form will be displayed here
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default TradeEntryPage;
