
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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export interface MultiTablePriceDataPoint {
  id: string;
  price_date: string;
  price: number;
  instrumentName: string;
  previousPrice?: number;
  percentChange?: number;
}

interface MultiInstrumentPriceTableProps {
  data: MultiTablePriceDataPoint[];
  isLoading: boolean;
}

export const MultiInstrumentPriceTable: React.FC<MultiInstrumentPriceTableProps> = ({
  data,
  isLoading,
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

  // Group data by date for better display
  const dataByDate = data.reduce((acc, item) => {
    const date = item.price_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {} as Record<string, MultiTablePriceDataPoint[]>);

  const sortedDates = Object.keys(dataByDate).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
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
              {sortedDates.flatMap(date => 
                dataByDate[date].map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{format(new Date(item.price_date), 'PPP')}</TableCell>
                    <TableCell>{item.instrumentName}</TableCell>
                    <TableCell className="text-right font-mono">${item.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      {item.percentChange !== undefined ? (
                        <Badge variant={item.percentChange >= 0 ? "default" : "destructive"} className="font-mono">
                          {item.percentChange >= 0 ? '+' : ''}{item.percentChange.toFixed(2)}%
                        </Badge>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
