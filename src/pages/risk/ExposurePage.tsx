
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { RefreshCw } from 'lucide-react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useTrades } from '@/hooks/useTrades';
import { calculateTradeExposures } from '@/utils/exposureUtils';
import ExposureTable from '@/components/exposure/ExposureTable';

const ExposurePage = () => {
  const { trades, loading, refetchTrades } = useTrades();
  const [refreshing, setRefreshing] = useState(false);
  
  const exposureData = calculateTradeExposures(trades);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchTrades();
    setRefreshing(false);
  };
  
  return (
    <Layout>
      <Helmet>
        <title>Exposure Report</title>
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Exposure Report</h1>
            <p className="text-muted-foreground">
              View physical and pricing exposure across all trading activities
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing || loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Separator />
        
        <Card>
          <CardHeader>
            <CardTitle>Monthly Exposure</CardTitle>
            <CardDescription>
              Physical and pricing exposure by month and product
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-12 text-muted-foreground">
                <p>Loading exposure data...</p>
              </div>
            ) : (
              <div className="overflow-auto">
                <ExposureTable data={exposureData} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ExposurePage;
