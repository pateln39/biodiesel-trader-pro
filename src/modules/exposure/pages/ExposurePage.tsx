
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Layout } from '@/core/components';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useExposureCalculation } from '../hooks/useExposureCalculation';
import { ExposureType } from '../types/exposure';

const ExposurePage = () => {
  const [activeTab, setActiveTab] = useState<string>('physical');
  const { data: exposureData, isLoading, error } = useExposureCalculation();
  
  // Get all periods
  const periods = exposureData ? Object.keys(exposureData).sort() : [];
  
  // Select the most recent period by default
  const [selectedPeriod, setSelectedPeriod] = useState<string>(
    periods.length > 0 ? periods[periods.length - 1] : ''
  );
  
  // Selected period exposures
  const selectedExposures = selectedPeriod && exposureData 
    ? exposureData[selectedPeriod] || [] 
    : [];
  
  // Filter exposures by type based on active tab
  const filteredExposures = selectedExposures.filter(exp => {
    if (activeTab === 'physical') return exp.type === ExposureType.Physical;
    if (activeTab === 'pricing') return exp.type === ExposureType.Pricing;
    if (activeTab === 'net') return exp.type === ExposureType.Net;
    return true;
  });

  return (
    <Layout>
      <Helmet>
        <title>Risk Exposure</title>
      </Helmet>
      
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Risk Exposure</h1>
        <p className="text-muted-foreground">
          Monitor and analyze your trading risk exposure
        </p>
        
        <Card>
          <CardHeader>
            <CardTitle>Exposure Analysis</CardTitle>
            <CardDescription>View your exposure by period and type</CardDescription>
            
            {/* Period selector */}
            {periods.length > 0 && (
              <div className="mt-4">
                <select 
                  className="w-full p-2 border rounded"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                >
                  {periods.map(period => (
                    <option key={period} value={period}>{period}</option>
                  ))}
                </select>
              </div>
            )}
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="text-center p-4">Loading exposure data...</div>
            ) : error ? (
              <div className="text-center text-red-500 p-4">
                Error loading exposure data
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="physical">Physical</TabsTrigger>
                  <TabsTrigger value="pricing">Pricing</TabsTrigger>
                  <TabsTrigger value="net">Net</TabsTrigger>
                </TabsList>
                
                <TabsContent value={activeTab}>
                  {filteredExposures.length > 0 ? (
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Instrument</th>
                          <th className="text-right p-2">Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredExposures.map((exp, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">{exp.instrument}</td>
                            <td className="text-right p-2">
                              {exp.quantity.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center p-4">
                      No {activeTab} exposure data available for this period
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
