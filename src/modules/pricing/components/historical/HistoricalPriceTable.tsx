import React from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export interface PriceDataPoint {
  id: string;
  price_date: string;
  price: number;
  instrumentName?: string;
  previousPrice?: number;
  percentChange?: number;
}

interface HistoricalPriceTableProps {
  data: PriceDataPoint[];
  isLoading: boolean;
  instrumentName: string;
}

export const HistoricalPriceTable: React.FC<HistoricalPriceTableProps> = ({
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

  // Calculate price change percentage compared to previous day
  const processedData = [...data].sort((a, b) => 
    new Date(b.price_date).getTime() - new Date(a.price_date).getTime()
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Instrument</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedData.map((item, index) => {
                const prevPrice = index < processedData.length - 1 ? processedData[index + 1].price : null;
                const change = prevPrice !== null ? ((item.price - prevPrice) / prevPrice) * 100 : null;
                
                return (
                  <TableRow key={item.id}>
                    <TableCell>{format(new Date(item.price_date), 'PPP')}</TableCell>
                    <TableCell>{instrumentName}</TableCell>
                    <TableCell className="text-right font-mono">${item.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      {change !== null ? (
                        <Badge variant={change >= 0 ? "default" : "destructive"} className="font-mono">
                          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                        </Badge>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
