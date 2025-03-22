
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Layout } from '@/core/components';

const PricesPage = () => {
  return (
    <Layout>
      <Helmet>
        <title>Market Prices</title>
      </Helmet>
      
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Market Prices</h1>
        <p className="text-muted-foreground">
          View and analyze market price data
        </p>
        
        {/* Prices content will be added here */}
        <div className="p-6 bg-card rounded-md border">
          <p className="text-center text-muted-foreground">
            Market price dashboard will be displayed here
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default PricesPage;
