
import React from 'react';
import { Download, Calendar } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { mockExposureReport } from '@/data/mockData';

const ExposurePage = () => {
  // Group exposure data by month
  const groupedByMonth = mockExposureReport.reduce((acc, item) => {
    if (!acc[item.month]) {
      acc[item.month] = [];
    }
    acc[item.month].push(item);
    return acc;
  }, {} as Record<string, typeof mockExposureReport>);

  return (
    <Layout>
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
                        <td className={`p-3 text-right ${item.physical >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.physical >= 0 ? '+' : ''}{item.physical.toLocaleString()}
                        </td>
                        <td className={`p-3 text-right ${item.pricing >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.pricing >= 0 ? '+' : ''}{item.pricing.toLocaleString()}
                        </td>
                        <td className={`p-3 text-right ${item.paper >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.paper >= 0 ? '+' : ''}{item.paper.toLocaleString()}
                        </td>
                        <td className={`p-3 text-right font-medium ${item.netExposure >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.netExposure >= 0 ? '+' : ''}{item.netExposure.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-muted/30">
                      <td className="p-3 font-medium">Total</td>
                      <td className="p-3 text-right font-medium">
                        {items.reduce((sum, item) => sum + item.physical, 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-medium">
                        {items.reduce((sum, item) => sum + item.pricing, 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-medium">
                        {items.reduce((sum, item) => sum + item.paper, 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-medium">
                        {items.reduce((sum, item) => sum + item.netExposure, 0).toLocaleString()}
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
