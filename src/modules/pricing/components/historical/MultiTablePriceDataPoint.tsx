
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PricePoint } from '@/core/types/common';

interface MultiInstrumentPriceTableProps {
  instrumentPrices: Record<string, PricePoint[]>;
  title?: string;
}

export const MultiInstrumentPriceTable: React.FC<MultiInstrumentPriceTableProps> = ({
  instrumentPrices,
  title = 'Price Data'
}) => {
  const navigate = useNavigate();
  const instruments = Object.keys(instrumentPrices);

  const formatDate = (date: Date) => {
    return format(date, 'yyyy-MM-dd');
  };

  // Get all unique dates across all instruments
  const allDates = new Set<string>();
  Object.values(instrumentPrices).forEach(prices => {
    prices.forEach(price => {
      allDates.add(formatDate(price.date));
    });
  });

  // Sort dates
  const sortedDates = Array.from(allDates).sort();

  // Create a map of date -> instrument -> price for easier lookup
  const priceMap: Record<string, Record<string, number>> = {};
  sortedDates.forEach(date => {
    priceMap[date] = {};
    instruments.forEach(instrument => {
      const pricePoint = instrumentPrices[instrument]?.find(
        p => formatDate(p.date) === date
      );
      if (pricePoint) {
        priceMap[date][instrument] = pricePoint.price;
      }
    });
  });

  const handleViewDetails = (instrument: string, date: string) => {
    // Would need to implement lookup of actual price ID here for a real implementation
    navigate(`/risk/prices/${instrument}/${date}`);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              {instruments.map(instrument => (
                <TableHead key={instrument}>{instrument}</TableHead>
              ))}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedDates.map(date => (
              <TableRow key={date}>
                <TableCell>{date}</TableCell>
                {instruments.map(instrument => (
                  <TableCell key={`${date}-${instrument}`}>
                    {priceMap[date][instrument] !== undefined
                      ? priceMap[date][instrument].toFixed(2)
                      : '-'}
                  </TableCell>
                ))}
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleViewDetails(instruments[0], date)}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
