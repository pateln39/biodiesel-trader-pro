
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { RefreshCw } from 'lucide-react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import PaginatedPaperMTMTable from '@/components/risk/PaginatedPaperMTMTable';
import PaginatedPhysicalMTMTable from '@/components/risk/PaginatedPhysicalMTMTable';
import { toast } from 'sonner';

const MTMPage = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('physical');

  const handleRefresh = async () => {
    setRefreshing(true);
    // For now, just show a toast since we're using server-side pagination
    // Later we can add functionality to trigger MTM recalculation
    toast.success('MTM data refreshed');
    setRefreshing(false);
  };

  return (
    <Layout>
      <Helmet>
        <title>Mark-to-Market</title>
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mark-to-Market</h1>
            <p className="text-muted-foreground">
              View real-time Mark-to-Market positions across all trading activities
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Separator />
        
        <Card className="bg-gradient-to-br from-brand-navy/75 via-brand-navy/60 to-brand-lime/25 border-r-[3px] border-brand-lime/30">
          <CardHeader>
            <CardTitle>MTM Positions</CardTitle>
            <CardDescription>
              Current Mark-to-Market position values by instrument and trade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="physical">Physical Trades</TabsTrigger>
                <TabsTrigger value="paper">Paper Trades</TabsTrigger>
              </TabsList>
              
              <TabsContent value="physical">
                <PaginatedPhysicalMTMTable />
              </TabsContent>
              
              <TabsContent value="paper">
                <PaginatedPaperMTMTable />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default MTMPage;
