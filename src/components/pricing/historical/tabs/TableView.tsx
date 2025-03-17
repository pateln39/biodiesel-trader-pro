
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

interface PriceDataPoint {
  id: string;
  price_date: string;
  price: number;
  instrument_id: string;
  instrumentName: string;
}

interface TableViewProps {
  data: Record<string, PriceDataPoint[]>;
  instrumentNames: Record<string, string>;
  isLoading: boolean;
}

export const TableView: React.FC<TableViewProps> = ({
  data,
  instrumentNames,
  isLoading
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

  const instrumentIds = Object.keys(data);
  
  if (instrumentIds.length === 0) {
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

  // Get all unique dates across all instruments
  const allDatesSet = new Set<string>();
  instrumentIds.forEach(id => {
    data[id].forEach(item => {
      allDatesSet.add(item.price_date);
    });
  });
  
  // Convert to array and sort descending
  const allDates = [...allDatesSet].sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  // Create a map for quick lookup of prices by date and instrument
  const priceMap: Record<string, Record<string, { price: number, prevPrice?: number }>> = {};
  
  allDates.forEach(date => {
    priceMap[date] = {};
  });
  
  instrumentIds.forEach(id => {
    // Sort by date descending
    const sorted = [...data[id]].sort((a, b) => 
      new Date(b.price_date).getTime() - new Date(a.price_date).getTime()
    );
    
    sorted.forEach((item, index) => {
      const prevPrice = index < sorted.length - 1 ? sorted[index + 1].price : undefined;
      priceMap[item.price_date][id] = { 
        price: item.price,
        prevPrice
      };
    });
  });

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                {instrumentIds.map(id => (
                  <React.Fragment key={id}>
                    <TableHead>{instrumentNames[id]}</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Change</TableHead>
                  </React.Fragment>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {allDates.map(date => (
                <TableRow key={date}>
                  <TableCell>{format(new Date(date), 'PPP')}</TableCell>
                  {instrumentIds.map(id => {
                    const priceData = priceMap[date][id];
                    if (!priceData) {
                      return (
                        <React.Fragment key={id}>
                          <TableCell>—</TableCell>
                          <TableCell className="text-right">—</TableCell>
                          <TableCell className="text-right">—</TableCell>
                        </React.Fragment>
                      );
                    }
                    
                    const { price, prevPrice } = priceData;
                    const change = prevPrice !== undefined 
                      ? ((price - prevPrice) / prevPrice) * 100 
                      : null;
                    
                    return (
                      <React.Fragment key={id}>
                        <TableCell>{instrumentNames[id]}</TableCell>
                        <TableCell className="text-right font-mono">${price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          {change !== null ? (
                            <Badge variant={change >= 0 ? "default" : "destructive"} className="font-mono">
                              {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                            </Badge>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                      </React.Fragment>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
