
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { getMonthDates, fetchMonthlyAveragePrice, fetchSpecificForwardPrice, getPeriodType } from '@/utils/paperTradeMTMUtils';
import { mapProductToCanonical } from '@/utils/productMapping';

interface PaperPriceDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  tradeLegId: string;
  product: string;
  rightSide?: {
    product: string;
    price?: number;
  };
  period: string;
  quantity: number;
  buySell: 'buy' | 'sell';
  relationshipType: string;
  price: number;
}

const PaperPriceDetails: React.FC<PaperPriceDetailsProps> = ({
  isOpen,
  onClose,
  tradeLegId,
  product,
  rightSide,
  period,
  quantity,
  buySell,
  relationshipType,
  price
}) => {
  const [activeTab, setActiveTab] = useState('summary');
  
  const leftProduct = mapProductToCanonical(product);
  const rightProduct = rightSide?.product ? mapProductToCanonical(rightSide.product) : 
                      relationshipType === 'DIFF' ? 'Platts LSGO' : null;
  
  const dates = getMonthDates(period);
  const today = new Date();
  const periodType = dates ? getPeriodType(dates.startDate, dates.endDate, today) : null;
  
  const { data: priceData, isLoading } = useQuery({
    queryKey: ['paperPriceDetails', tradeLegId, leftProduct, rightProduct, period],
    queryFn: async () => {
      if (!leftProduct || !period) {
        return null;
      }

      // For FP trades or left side of DIFF/SPREAD trades
      let leftHistoricalPrice = null;
      let leftForwardPrice = null;
      
      // For DIFF/SPREAD trades right side
      let rightHistoricalPrice = null;
      let rightForwardPrice = null;
      
      // Get left side prices
      leftHistoricalPrice = await fetchMonthlyAveragePrice(leftProduct, period);
      leftForwardPrice = await fetchSpecificForwardPrice(leftProduct, period);
      
      // Get right side prices if applicable
      if (rightProduct && (relationshipType === 'DIFF' || relationshipType === 'SPREAD')) {
        rightHistoricalPrice = await fetchMonthlyAveragePrice(rightProduct, period);
        rightForwardPrice = await fetchSpecificForwardPrice(rightProduct, period);
      }
      
      // Calculate MTM price based on period type
      let mtmPrice = 0;
      
      if (periodType === 'past') {
        if (relationshipType === 'FP') {
          mtmPrice = leftHistoricalPrice || 0;
        } else if (rightHistoricalPrice !== null) {
          mtmPrice = (leftHistoricalPrice || 0) - (rightHistoricalPrice || 0);
        }
      } else {
        if (relationshipType === 'FP') {
          mtmPrice = leftForwardPrice || 0;
        } else if (rightForwardPrice !== null) {
          mtmPrice = (leftForwardPrice || 0) - (rightForwardPrice || 0);
        }
      }
      
      // Calculate trade price
      let tradePrice = price;
      
      // Calculate MTM value
      const directionFactor = buySell === 'buy' ? -1 : 1;
      const mtmValue = (tradePrice - mtmPrice) * quantity * directionFactor;
      
      return {
        leftProduct,
        rightProduct,
        leftHistoricalPrice,
        rightHistoricalPrice,
        leftForwardPrice,
        rightForwardPrice,
        mtmPrice,
        tradePrice,
        mtmValue,
        quantity,
        periodType
      };
    },
    enabled: isOpen && !!leftProduct && !!period
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Paper Trade Price Details
            <Badge className="ml-2">
              {relationshipType}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center">Loading price details...</div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="mtmCalculation">MTM Calculation</TabsTrigger>
              <TabsTrigger value="priceData">Price Data</TabsTrigger>
            </TabsList>

            <TabsContent value="summary">
              <Card>
                <CardHeader>
                  <CardTitle>Paper Trade MTM Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Product</div>
                      <div className="font-medium">
                        {product}
                        {rightSide && (
                          <span> - {rightSide.product}</span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Period</div>
                      <div className="font-medium">
                        {period} 
                        {periodType && (
                          <Badge className="ml-2" variant={
                            periodType === 'past' ? 'default' : 
                            periodType === 'current' ? 'secondary' : 
                            'outline'
                          }>
                            {periodType}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Quantity</div>
                      <div className="font-medium">{quantity.toLocaleString()} MT</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Buy/Sell</div>
                      <div className="font-medium">
                        <Badge variant={buySell === 'buy' ? 'default' : 'outline'}>
                          {buySell.charAt(0).toUpperCase() + buySell.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Trade Price</div>
                      <div className="font-medium">${priceData?.tradePrice.toFixed(2)}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">MTM Price</div>
                      <div className="font-medium">${priceData?.mtmPrice.toFixed(2)}</div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">MTM Value</div>
                    <div className={`text-2xl font-bold ${priceData?.mtmValue && priceData.mtmValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${priceData?.mtmValue.toFixed(2)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mtmCalculation">
              <Card>
                <CardHeader>
                  <CardTitle>MTM Calculation Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Period Type</div>
                      <div className="font-medium">{periodType} period</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground">Trade Price Calculation</div>
                      {relationshipType === 'FP' ? (
                        <div className="font-medium">
                          User-entered price: ${price.toFixed(2)}
                        </div>
                      ) : (
                        <div className="font-medium">
                          Left price (${price.toFixed(2)}) - 
                          Right price (${rightSide?.price?.toFixed(2) || '0.00'}) = 
                          ${priceData?.tradePrice.toFixed(2)}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground">MTM Price Calculation</div>
                      {relationshipType === 'FP' ? (
                        <div className="font-medium">
                          {periodType === 'past' ? (
                            <span>Historical average price of {leftProduct}: ${priceData?.leftHistoricalPrice?.toFixed(2) || 'N/A'}</span>
                          ) : (
                            <span>Forward price of {leftProduct} for {period}: ${priceData?.leftForwardPrice?.toFixed(2) || 'N/A'}</span>
                          )}
                        </div>
                      ) : (
                        <div className="font-medium">
                          {periodType === 'past' ? (
                            <span>
                              Historical avg of {leftProduct} (${priceData?.leftHistoricalPrice?.toFixed(2) || 'N/A'}) - 
                              Historical avg of {rightProduct} (${priceData?.rightHistoricalPrice?.toFixed(2) || 'N/A'}) = 
                              ${priceData?.mtmPrice?.toFixed(2) || 'N/A'}
                            </span>
                          ) : (
                            <span>
                              Forward price of {leftProduct} (${priceData?.leftForwardPrice?.toFixed(2) || 'N/A'}) - 
                              Forward price of {rightProduct} (${priceData?.rightForwardPrice?.toFixed(2) || 'N/A'}) = 
                              ${priceData?.mtmPrice?.toFixed(2) || 'N/A'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground">MTM Value Calculation</div>
                      <div className="font-medium">
                        (Trade Price ${priceData?.tradePrice?.toFixed(2) || '0.00'} - 
                        MTM Price ${priceData?.mtmPrice?.toFixed(2) || '0.00'}) × 
                        Quantity {quantity.toLocaleString()} × 
                        Direction Factor ({buySell === 'buy' ? -1 : 1}) = 
                        ${priceData?.mtmValue?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="priceData">
              <Card>
                <CardHeader>
                  <CardTitle>Price Data Used</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Historical Average</TableHead>
                        <TableHead>Forward Price</TableHead>
                        <TableHead>Used</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>{leftProduct}</TableCell>
                        <TableCell>${priceData?.leftHistoricalPrice?.toFixed(2) || 'N/A'}</TableCell>
                        <TableCell>${priceData?.leftForwardPrice?.toFixed(2) || 'N/A'}</TableCell>
                        <TableCell>
                          ${periodType === 'past' 
                            ? priceData?.leftHistoricalPrice?.toFixed(2) || 'N/A' 
                            : priceData?.leftForwardPrice?.toFixed(2) || 'N/A'}
                        </TableCell>
                      </TableRow>
                      {rightProduct && (
                        <TableRow>
                          <TableCell>{rightProduct}</TableCell>
                          <TableCell>${priceData?.rightHistoricalPrice?.toFixed(2) || 'N/A'}</TableCell>
                          <TableCell>${priceData?.rightForwardPrice?.toFixed(2) || 'N/A'}</TableCell>
                          <TableCell>
                            ${periodType === 'past' 
                              ? priceData?.rightHistoricalPrice?.toFixed(2) || 'N/A' 
                              : priceData?.rightForwardPrice?.toFixed(2) || 'N/A'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaperPriceDetails;
