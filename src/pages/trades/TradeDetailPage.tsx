
import React from 'react';
import { useParams } from 'react-router-dom';
import Layout from '@/components/Layout';

const TradeDetailPage = () => {
  const { id } = useParams();
  
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trade Details</h1>
          <p className="text-muted-foreground">
            Viewing trade ID: {id}
          </p>
        </div>
        
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <p>Trade details content will be displayed here.</p>
        </div>
      </div>
    </Layout>
  );
};

export default TradeDetailPage;
