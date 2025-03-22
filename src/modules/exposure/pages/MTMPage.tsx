
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Layout } from '@/core/components';

const MTMPage = () => {
  return (
    <Layout>
      <Helmet>
        <title>Mark to Market</title>
      </Helmet>
      
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Mark to Market</h1>
        <p className="text-muted-foreground">
          View current valuations for your positions
        </p>
        
        {/* MTM content will be added here */}
        <div className="p-6 bg-card rounded-md border">
          <p className="text-center text-muted-foreground">
            Mark to Market reports will be displayed here
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default MTMPage;
