
import React from 'react';
import { Download, Calendar } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { mockExposureReport } from '@/data/mockData';
import { Helmet } from 'react-helmet-async';

const ExposurePage = () => {
  // Group exposure data by month
  const groupedByMonth = mockExposureReport.reduce((acc, item) => {
    if (!acc[item.month]) {
      acc[item.month] = [];
    }
    acc[item.month].push(item);
    return acc;
  }, {} as Record<string, typeof mockExposureReport>);

  // Function to get color class based on value
  const getValueColorClass = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  // Function to format values with sign
  const formatValue = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toLocaleString()}`;
  };

  return (
    <Layout>
      <Helmet>
        <title>Exposure Reporting</title>
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Exposure Reporting</h1>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" /> Change Period
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedByMonth).map(([month, items]) => (
            <div key={month} className="bg-card rounded-md border shadow-sm">
              <div className="p-4 border-b">
                <h2 className="font-semibold">{month}</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-3 font-medium">Grade</th>
                      <th className="text-right p-3 font-medium">Physical (MT)</th>
                      <th className="text-right p-3 font-medium">Pricing (MT)</th>
                      <th className="text-right p-3 font-medium">Paper (MT)</th>
                      <th className="text-right p-3 font-medium">Net Exposure (MT)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="border-t hover:bg-muted/50">
                        <td className="p-3 font-medium">{item.grade}</td>
                        <td className={`p-3 text-right ${getValueColorClass(item.physical)}`}>
                          {formatValue(item.physical)}
                        </td>
                        <td className={`p-3 text-right ${getValueColorClass(item.pricing)}`}>
                          {formatValue(item.pricing)}
                        </td>
                        <td className={`p-3 text-right ${getValueColorClass(item.paper)}`}>
                          {formatValue(item.paper)}
                        </td>
                        <td className={`p-3 text-right font-medium ${getValueColorClass(item.netExposure)}`}>
                          {formatValue(item.netExposure)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-muted/30">
                      <td className="p-3 font-medium">Total</td>
                      <td className={`p-3 text-right font-medium ${getValueColorClass(items.reduce((sum, item) => sum + item.physical, 0))}`}>
                        {formatValue(items.reduce((sum, item) => sum + item.physical, 0))}
                      </td>
                      <td className={`p-3 text-right font-medium ${getValueColorClass(items.reduce((sum, item) => sum + item.pricing, 0))}`}>
                        {formatValue(items.reduce((sum, item) => sum + item.pricing, 0))}
                      </td>
                      <td className={`p-3 text-right font-medium ${getValueColorClass(items.reduce((sum, item) => sum + item.paper, 0))}`}>
                        {formatValue(items.reduce((sum, item) => sum + item.paper, 0))}
                      </td>
                      <td className={`p-3 text-right font-medium ${getValueColorClass(items.reduce((sum, item) => sum + item.netExposure, 0))}`}>
                        {formatValue(items.reduce((sum, item) => sum + item.netExposure, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default ExposurePage;
