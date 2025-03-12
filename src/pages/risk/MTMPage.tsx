
import React from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const MTMPage = () => {
  return (
    <Layout>
      <Helmet>
        <title>Mark-to-Market</title>
      </Helmet>
      
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Mark-to-Market</h1>
        <p className="text-muted-foreground">
          View real-time Mark-to-Market positions across all trading activities
        </p>

        <Separator />
        
        <Card>
          <CardHeader>
            <CardTitle>MTM Positions</CardTitle>
            <CardDescription>
              Current Mark-to-Market position values by instrument and trade type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-12 text-muted-foreground">
              <p>MTM reporting dashboard coming soon...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default MTMPage;
