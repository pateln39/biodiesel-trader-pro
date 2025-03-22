
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Layout } from '@/core/components';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const PNLPage = () => {
  return (
    <Layout>
      <Helmet>
        <title>Profit and Loss</title>
      </Helmet>
      
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Profit and Loss</h1>
        <p className="text-muted-foreground">
          View realized and unrealized P&L across your trading portfolio
        </p>

        <Separator />
        
        <Card>
          <CardHeader>
            <CardTitle>P&L Analysis</CardTitle>
            <CardDescription>
              Detailed profit and loss analysis by trade and instrument
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-12 text-muted-foreground">
              <p>P&L reporting dashboard coming soon...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PNLPage;
