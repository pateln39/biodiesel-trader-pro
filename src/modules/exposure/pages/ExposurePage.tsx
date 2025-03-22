
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Layout } from '@/core/components';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useExposureCalculation } from '../hooks/useExposureCalculation';
import { ExposureType } from '../types/exposure';

const ExposurePage = () => {
  const [activeTab, setActiveTab] = useState<string>('physical');
  const { 
    data: exposureData, 
    isLoading, 
    error,
    refetch,
    isRefetching 
  } = useExposureCalculation();
  
  // Get all periods
  const periods = exposureData ? Object.keys(exposureData).sort() : [];
  
  // Select the most recent period by default
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  
  // Update selected period when data loads
  useEffect(() => {
    if (periods.length > 0 && !selectedPeriod) {
      setSelectedPeriod(periods[periods.length - 1]);
    }
  }, [periods, selectedPeriod]);
  
  // Selected period exposures
  const selectedExposures = selectedPeriod && exposureData 
    ? exposureData[selectedPeriod] || [] 
    : [];
  
  // Filter exposures by type based on active tab
  const filteredExposures = selectedExposures.filter(exp => {
    if (activeTab === 'physical') return exp.type === ExposureType.Physical;
    if (activeTab === 'pricing') return exp.type === ExposureType.Pricing;
    if (activeTab === 'paper') return exp.type === ExposureType.Paper;
    if (activeTab === 'net') return exp.type === ExposureType.Net;
    return true;
  });

  // Group exposures by instrument
  const groupedExposures = filteredExposures.reduce((acc, exposure) => {
    if (!acc[exposure.instrument]) {
      acc[exposure.instrument] = 0;
    }
    acc[exposure.instrument] += exposure.quantity;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Layout>
      <Helmet>
        <title>Risk Exposure</title>
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Risk Exposure</h1>
            <p className="text-muted-foreground">
              Monitor and analyze your trading risk exposure
            </p>
          </div>
          
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            disabled={isLoading || isRefetching}
          >
            {isRefetching ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh Data
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Exposure Analysis</CardTitle>
            <CardDescription>View your exposure by period and type</CardDescription>
            
            {/* Period selector */}
            {periods.length > 0 && (
              <div className="mt-4">
                <Select
                  value={selectedPeriod}
                  onValueChange={setSelectedPeriod}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.map(period => (
                      <SelectItem key={period} value={period}>{period}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2">Loading exposure data...</span>
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Failed to load exposure data: {error instanceof Error ? error.message : 'Unknown error'}
                </AlertDescription>
              </Alert>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="physical">Physical</TabsTrigger>
                  <TabsTrigger value="pricing">Pricing</TabsTrigger>
                  <TabsTrigger value="paper">Paper</TabsTrigger>
                  <TabsTrigger value="net">Net</TabsTrigger>
                </TabsList>
                
                <TabsContent value={activeTab}>
                  {Object.keys(groupedExposures).length > 0 ? (
                    <div className="border rounded-md">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-3 font-medium">Instrument</th>
                            <th className="text-right p-3 font-medium">Quantity (MT)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(groupedExposures).map(([instrument, quantity]) => (
                            <tr key={instrument} className="border-b">
                              <td className="p-3">{instrument}</td>
                              <td className={`text-right p-3 ${quantity > 0 ? 'text-green-600' : quantity < 0 ? 'text-red-600' : ''}`}>
                                {quantity.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center p-8 border rounded-md">
                      <p className="text-muted-foreground">
                        No {activeTab} exposure data available for this period
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ExposurePage;
