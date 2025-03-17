
import React from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import PriceUploader from '@/components/pricing/PriceUploader';
import HistoricalPricesView from '@/components/pricing/historical/HistoricalPricesView';
import { Toaster } from '@/components/ui/toaster';

const PricesPage = () => {
  return (
    <Layout>
      <Helmet>
        <title>Pricing Management</title>
      </Helmet>
      
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Pricing Management</h1>
        <p className="text-muted-foreground">
          View price data and manage price uploads
        </p>

        <Separator />

        <Tabs defaultValue="upload" className="space-y-4">
          <TabsList>
            <TabsTrigger value="upload">Price Upload</TabsTrigger>
            <TabsTrigger value="history">Historical Prices</TabsTrigger>
            <TabsTrigger value="forward">Forward Prices</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Price Data Upload</CardTitle>
                <CardDescription>
                  Upload historical or forward price data from Excel files
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PriceUploader />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historical Prices</CardTitle>
                <CardDescription>
                  View and analyze historical price data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HistoricalPricesView />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="forward" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Forward Prices</CardTitle>
                <CardDescription>
                  View and analyze forward price data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center p-12 text-muted-foreground">
                  <p>Forward price data view coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <Toaster />
    </Layout>
  );
};

export default PricesPage;
