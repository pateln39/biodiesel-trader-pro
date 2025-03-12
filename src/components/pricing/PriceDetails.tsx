
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PricingFormula, FormulaToken, Instrument } from '@/types';
import { calculateTradeLegPrice, PricingPeriodType } from '@/utils/priceCalculationUtils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PriceDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  tradeLegId: string;
  formula: PricingFormula;
  startDate: Date;
  endDate: Date;
  quantity: number;
}

const PriceDetails: React.FC<PriceDetailsProps> = ({
  isOpen,
  onClose,
  tradeLegId,
  formula,
  startDate,
  endDate,
  quantity
}) => {
  const [loading, setLoading] = useState(true);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [periodType, setPeriodType] = useState<PricingPeriodType>('historical');
  const [priceDetails, setPriceDetails] = useState<Record<
    Instrument, 
    { average: number; prices: { date: Date; price: number }[] }
  > | null>(null);
  const [activeInstrument, setActiveInstrument] = useState<Instrument | null>(null);

  useEffect(() => {
    const fetchPriceData = async () => {
      if (!isOpen) return;
      
      setLoading(true);
      try {
        const result = await calculateTradeLegPrice(formula, startDate, endDate);
        setCalculatedPrice(result.price);
        setPeriodType(result.periodType);
        setPriceDetails(result.priceDetails);
        
        // Set active instrument to the first instrument in the formula
        const firstInstrument = formula.tokens.find(token => token.type === 'instrument');
        if (firstInstrument) {
          setActiveInstrument(firstInstrument.value as Instrument);
        }
      } catch (error) {
        console.error('Error calculating prices:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPriceData();
  }, [isOpen, formula, startDate, endDate]);

  // Helper to format prices for the chart
  const formatChartData = (prices: { date: Date; price: number }[]) => {
    return prices.map(({ date, price }) => ({
      date: format(date, 'MMM dd'),
      price
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Price Details</DialogTitle>
          <DialogDescription>
            Pricing information for the period {format(startDate, 'MMM dd, yyyy')} to {format(endDate, 'MMM dd, yyyy')}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <p>Loading price data...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
                <CardDescription>
                  Overall pricing information for this trade leg
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium">Calculated Price:</span>
                    <div className="text-2xl font-bold">
                      ${calculatedPrice?.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Trade Value:</span>
                    <div className="text-2xl font-bold">
                      ${((calculatedPrice || 0) * quantity).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-sm font-medium">Period Type:</span>
                  <div>
                    <Badge variant={
                      periodType === 'historical' ? 'default' : 
                      periodType === 'current' ? 'secondary' : 
                      'outline'
                    }>
                      {periodType === 'historical' ? 'Historical' : 
                       periodType === 'current' ? 'Current' : 
                       'Forward'}
                    </Badge>
                  </div>
                </div>

                <div>
                  <span className="text-sm font-medium">Formula:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formula.tokens.map((token, index) => (
                      <Badge key={index} variant="outline">
                        {token.value}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {priceDetails && activeInstrument && (
              <>
                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-2">Price Data</h3>
                  <Tabs defaultValue={activeInstrument} className="w-full">
                    <TabsList className="mb-2">
                      {Object.entries(priceDetails).map(([instrument, data]) => {
                        // Only show tabs for instruments with prices
                        if (data.prices.length === 0) return null;
                        return (
                          <TabsTrigger 
                            key={instrument} 
                            value={instrument}
                            onClick={() => setActiveInstrument(instrument as Instrument)}
                          >
                            {instrument}
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>

                    {Object.entries(priceDetails).map(([instrument, data]) => {
                      if (data.prices.length === 0) return null;
                      return (
                        <TabsContent key={instrument} value={instrument} className="space-y-4">
                          <Card>
                            <CardHeader>
                              <CardTitle>{instrument} Prices</CardTitle>
                              <CardDescription>
                                Average Price: ${data.average.toFixed(2)}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={formatChartData(data.prices)}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => [`$${value}`, 'Price']} />
                                    <Legend />
                                    <Line 
                                      type="monotone" 
                                      dataKey="price" 
                                      stroke="#8884d8" 
                                      activeDot={{ r: 8 }} 
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle>Daily Prices</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Price</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {data.prices.map((priceData, index) => (
                                    <TableRow key={index}>
                                      <TableCell>{format(priceData.date, 'MMM dd, yyyy')}</TableCell>
                                      <TableCell>${priceData.price.toFixed(2)}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </CardContent>
                          </Card>
                        </TabsContent>
                      );
                    })}
                  </Tabs>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PriceDetails;
