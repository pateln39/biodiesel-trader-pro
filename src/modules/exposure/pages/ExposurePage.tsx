
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Layout } from '@/core/components';

const ExposurePage = () => {
  return (
    <Layout>
      <Helmet>
        <title>Risk Exposure</title>
      </Helmet>
      
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Risk Exposure</h1>
        <p className="text-muted-foreground">
          Monitor and analyze your trading risk exposure
        </p>
        
        {/* Exposure content will be added here */}
        <div className="p-6 bg-card rounded-md border">
          <p className="text-center text-muted-foreground">
            Risk exposure dashboard will be displayed here
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default ExposurePage;
