
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Layout } from '@/core/components';

const AuditLogPage = () => {
  return (
    <Layout>
      <Helmet>
        <title>Audit Log</title>
      </Helmet>
      
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground">
          View system audit logs and user activities
        </p>
        
        {/* Audit log content will be added here */}
        <div className="p-6 bg-card rounded-md border">
          <p className="text-center text-muted-foreground">
            Audit log data will be displayed here
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default AuditLogPage;
