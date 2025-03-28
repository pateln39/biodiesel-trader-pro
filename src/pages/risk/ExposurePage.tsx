import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useTrades } from '@/hooks/useTrades';
import { PhysicalTrade, PhysicalTradeLeg } from '@/types';
import { formatMonthCode } from '@/utils/dateUtils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ExposureData {
  physical: Record<string, number>;
  pricing: Record<string, number>;
}

const initializeExposureData = (): ExposureData => ({
  physical: {},
  pricing: {}
});

const ExposurePage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState(formatMonthCode(new Date()));
  const { trades, loading, error } = useTrades();
  const [exposureData, setExposureData] = useState<ExposureData>(initializeExposureData());
  
  useEffect(() => {
    if (trades && trades.length > 0) {
      const physicalTrades = trades.filter(trade => trade.tradeType === 'physical') as PhysicalTrade[];
      setExposureData(processPhysicalTrades(physicalTrades, selectedPeriod));
    } else {
      setExposureData(initializeExposureData());
    }
  }, [trades, selectedPeriod]);
  
  const periodOptions = [
    formatMonthCode(new Date()),
    formatMonthCode(new Date(new Date().setMonth(new Date().getMonth() + 1))),
    formatMonthCode(new Date(new Date().setMonth(new Date().getMonth() + 2))),
    formatMonthCode(new Date(new Date().setMonth(new Date().getMonth() + 3))),
    formatMonthCode(new Date(new Date().setMonth(new Date().getMonth() + 4))),
    formatMonthCode(new Date(new Date().setMonth(new Date().getMonth() + 5))),
    formatMonthCode(new Date(new Date().setMonth(new Date().getMonth() + 6))),
    formatMonthCode(new Date(new Date().setMonth(new Date().getMonth() + 7))),
    formatMonthCode(new Date(new Date().setMonth(new Date().getMonth() + 8))),
    formatMonthCode(new Date(new Date().setMonth(new Date().getMonth() + 9))),
    formatMonthCode(new Date(new Date().setMonth(new Date().getMonth() + 10))),
    formatMonthCode(new Date(new Date().setMonth(new Date().getMonth() + 11))),
    formatMonthCode(new Date(new Date().setMonth(new Date().getMonth() + 12))),
  ];

  const chartData = {
    labels: Object.keys(exposureData.physical),
    datasets: [
      {
        label: 'Physical Exposure',
        data: Object.values(exposureData.physical),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      },
      {
        label: 'Pricing Exposure',
        data: Object.values(exposureData.pricing),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Product Exposure',
      },
    },
  };

  const getMonthCodeForTrade = (trade: PhysicalTrade | PhysicalTradeLeg): string => {
    const date = trade.loadingPeriodStart;
    return formatMonthCode(date);
  };

  const processPhysicalTrades = (trades: PhysicalTrade[], selectedPeriod: string): ExposureData => {
    const exposureData: ExposureData = initializeExposureData();
    
    trades.forEach((trade) => {
      trade.legs.forEach((leg) => {
        const loadingMonthCode = getMonthCodeForTrade(leg);
        
        if (loadingMonthCode === selectedPeriod) {
          const physicalExposure = leg.formula?.exposures?.physical || {};
          
          Object.entries(physicalExposure).forEach(([product, amount]) => {
            if (amount !== 0) {
              exposureData.physical[product] = (exposureData.physical[product] || 0) + amount;
            }
          });
        }
        
        if (leg.formula?.monthlyDistribution) {
          Object.entries(leg.formula.monthlyDistribution).forEach(([instrument, monthlyValues]) => {
            if (monthlyValues[selectedPeriod]) {
              exposureData.pricing[instrument] = (exposureData.pricing[instrument] || 0) + monthlyValues[selectedPeriod];
            }
          });
        } else {
          const pricingMonthCode = getMonthCodeForTrade(leg);
          
          if (pricingMonthCode === selectedPeriod) {
            const pricingExposure = leg.formula?.exposures?.pricing || {};
            
            Object.entries(pricingExposure).forEach(([product, amount]) => {
              if (amount !== 0) {
                exposureData.pricing[product] = (exposureData.pricing[product] || 0) + amount;
              }
            });
          }
        }
      });
    });
    
    return exposureData;
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Exposure Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label htmlFor="period">Select Period:</Label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger id="period">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((period) => (
                  <SelectItem key={period} value={period}>
                    {period}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p>Error: {error.message}</p>
          ) : (
            <Bar options={chartOptions} data={chartData} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExposurePage;
