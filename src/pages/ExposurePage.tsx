
import React from 'react';
import Layout from '@/components/Layout';

const ExposurePage = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exposure</h1>
          <p className="text-muted-foreground">
            View your risk exposure
          </p>
        </div>
        
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <p>Exposure content will be displayed here.</p>
        </div>
      </div>
    </Layout>
  );
};

export default ExposurePage;
