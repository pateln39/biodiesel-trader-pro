import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export interface PriceDataPoint {
  id: string;
  price_date: string;
  price: number;
  instrumentName?: string;
  previousPrice?: number;
  percentChange?: number;
}

interface HistoricalPriceChartProps {
  data: PriceDataPoint[];
  isLoading: boolean;
  instrumentName: string;
}

const HistoricalPriceChart: React.FC<HistoricalPriceChartProps> = ({
  data,
  isLoading,
  instrumentName
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center p-4 text-muted-foreground">
            <p>No historical price data available for the selected criteria.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="price_date"
              tickFormatter={(date) => format(new Date(date), 'MMM d, yyyy')}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tickFormatter={(price) => `$${price.toFixed(2)}`} />
            <Tooltip labelFormatter={(date) => format(new Date(date), 'MMM d, yyyy')}
              formatter={(value) => value.toFixed(2)} />
            <Legend />
            <Line type="monotone" dataKey="price" stroke="#8884d8" name={instrumentName} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default HistoricalPriceChart;
