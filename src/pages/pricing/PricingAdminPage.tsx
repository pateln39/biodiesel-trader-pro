
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Layout from '@/components/Layout';
import { Helmet } from 'react-helmet';
import PriceUploader from '@/components/pricing/PriceUploader';
import PricingInstruments from '@/components/pricing/PricingInstruments';

const PricingAdminPage = () => {
  return (
    <Layout>
      <Helmet>
        <title>Pricing Administration</title>
      </Helmet>
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pricing Administration</h1>
          <p className="text-muted-foreground">
            Manage pricing instruments and upload price data
          </p>
        </div>

        <Separator />

        <Tabs defaultValue="upload" className="space-y-4">
          <TabsList>
            <TabsTrigger value="upload">Price Upload</TabsTrigger>
            <TabsTrigger value="instruments">Instruments</TabsTrigger>
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
          
          <TabsContent value="instruments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pricing Instruments</CardTitle>
                <CardDescription>
                  View and manage pricing instruments used in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PricingInstruments />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default PricingAdminPage;
