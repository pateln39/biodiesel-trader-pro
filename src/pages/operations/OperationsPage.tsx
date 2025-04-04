
import React, { useState, useEffect } from 'react';
import { Filter } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useReferenceData } from '@/hooks/useReferenceData';

import OpenTradesTable from '@/components/operations/OpenTradesTable';
import MovementsTable from '@/components/operations/MovementsTable';

const OperationsPage = () => {
  const [activeTab, setActiveTab] = useState<string>('open-trades');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  
  const { 
    counterparties,
    sustainabilityOptions,
    creditStatusOptions,
    customsStatusOptions
  } = useReferenceData();

  const handleRefreshTables = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Operations</h1>
        </div>

        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full md:w-[400px] grid-cols-2">
            <TabsTrigger value="open-trades">Open Trades</TabsTrigger>
            <TabsTrigger value="movements">Movements</TabsTrigger>
          </TabsList>

          <TabsContent value="open-trades" className="space-y-4">
            <Card className="bg-gradient-to-br from-brand-navy/75 via-brand-navy/60 to-brand-lime/25 border-r-[3px] border-brand-lime/30">
              <CardHeader>
                <CardTitle>Open Trades</CardTitle>
                <CardDescription className="flex justify-between items-center">
                  <span>View and manage open trade positions</span>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" /> Filter
                  </Button>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OpenTradesTable onRefresh={handleRefreshTables} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="movements" className="space-y-4">
            <Card className="bg-gradient-to-br from-brand-navy/75 via-brand-navy/60 to-brand-lime/25 border-r-[3px] border-brand-lime/30">
              <CardHeader>
                <CardTitle>Movements</CardTitle>
                <CardDescription className="flex justify-between items-center">
                  <span>View and manage product movements</span>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" /> Filter
                  </Button>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MovementsTable key={`movements-${refreshTrigger}`} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default OperationsPage;
