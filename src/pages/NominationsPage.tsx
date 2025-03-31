
import React from 'react';
import Layout from '@/components/Layout';

const NominationsPage = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nominations</h1>
          <p className="text-muted-foreground">
            Manage your trade nominations
          </p>
        </div>
        
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <p>Nominations content will be displayed here.</p>
        </div>
      </div>
    </Layout>
  );
};

export default NominationsPage;
