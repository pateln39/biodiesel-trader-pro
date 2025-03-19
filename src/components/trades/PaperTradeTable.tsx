
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { BuySell } from '@/types/trade';

export interface TradeLeg {
  id: string;
  legReference: string;
  buySell: BuySell;
  product: string;
  instrument?: string;
  tradingPeriod: string;
  periodStart?: Date;
  periodEnd?: Date;
  price: number;
  quantity: number;
  broker: string;
}

export interface PaperTradeTableProps {
  tradeLegs: {
    legA: TradeLeg[];
    legB: TradeLeg[];
  };
  tradingPeriods: { periodCode: string; periodType: string }[];
  paperProducts: { productCode: string; displayName: string; category: string }[];
  onAddLegA: () => void;
  onAddLegB: () => void;
  onUpdateLeg: (side: 'A' | 'B', index: number, field: keyof TradeLeg, value: any) => void;
  onRemoveLeg: (side: 'A' | 'B', index: number) => void;
  isLoading: boolean;
}

const PaperTradeTable: React.FC<PaperTradeTableProps> = ({
  tradeLegs,
  tradingPeriods,
  paperProducts,
  onAddLegA,
  onAddLegB,
  onUpdateLeg,
  onRemoveLeg,
  isLoading
}) => {
  // Get the max number of rows needed for the table
  const maxRows = Math.max(tradeLegs.legA.length, tradeLegs.legB.length);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Trade Table</h3>
        <div className="flex space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={onAddLegA}
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Leg A
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={onAddLegB}
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Leg B
          </Button>
        </div>
      </div>
      
      <div className="border rounded-md overflow-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead colSpan={5} className="text-center border-r">LEG A</TableHead>
              <TableHead colSpan={5} className="text-center">LEG B</TableHead>
              <TableHead className="w-[50px]"></TableHead> {/* Actions column */}
            </TableRow>
            <TableRow>
              <TableHead className="w-[100px]">Product</TableHead>
              <TableHead className="w-[80px]">Buy/Sell</TableHead>
              <TableHead className="w-[100px]">Quantity</TableHead>
              <TableHead className="w-[100px]">Period</TableHead>
              <TableHead className="w-[80px] border-r">Price</TableHead>
              
              <TableHead className="w-[100px]">Product</TableHead>
              <TableHead className="w-[80px]">Buy/Sell</TableHead>
              <TableHead className="w-[100px]">Quantity</TableHead>
              <TableHead className="w-[100px]">Period</TableHead>
              <TableHead className="w-[80px]">Price</TableHead>
              
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: maxRows }).map((_, rowIndex) => {
              const legA = tradeLegs.legA[rowIndex];
              const legB = tradeLegs.legB[rowIndex];
              
              return (
                <TableRow key={rowIndex}>
                  {/* LEG A */}
                  {legA ? (
                    <>
                      <TableCell>
                        <Select 
                          value={legA.product} 
                          onValueChange={(value) => onUpdateLeg('A', rowIndex, 'product', value)}
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Product" />
                          </SelectTrigger>
                          <SelectContent>
                            {paperProducts.map(product => (
                              <SelectItem key={product.productCode} value={product.productCode}>
                                {product.displayName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={legA.buySell} 
                          onValueChange={(value) => onUpdateLeg('A', rowIndex, 'buySell', value as BuySell)}
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Buy/Sell" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="buy">Buy</SelectItem>
                            <SelectItem value="sell">Sell</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          value={legA.quantity || ''} 
                          onChange={(e) => onUpdateLeg('A', rowIndex, 'quantity', Number(e.target.value))} 
                          disabled={isLoading}
                        />
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={legA.tradingPeriod} 
                          onValueChange={(value) => onUpdateLeg('A', rowIndex, 'tradingPeriod', value)}
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Period" />
                          </SelectTrigger>
                          <SelectContent>
                            {/* Monthly periods */}
                            <SelectItem value="monthly-header" disabled className="font-semibold text-primary">
                              Monthly
                            </SelectItem>
                            {tradingPeriods
                              .filter(p => p.periodType === 'MONTH')
                              .map((period) => (
                                <SelectItem key={period.periodCode} value={period.periodCode}>
                                  {period.periodCode}
                                </SelectItem>
                              ))}
                            
                            {/* Quarterly periods */}
                            <SelectItem value="quarterly-header" disabled className="font-semibold text-primary mt-2">
                              Quarterly
                            </SelectItem>
                            {tradingPeriods
                              .filter(p => p.periodType === 'QUARTER')
                              .map((period) => (
                                <SelectItem key={period.periodCode} value={period.periodCode}>
                                  {period.periodCode}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="border-r">
                        <Input 
                          type="number" 
                          value={legA.price || ''} 
                          onChange={(e) => onUpdateLeg('A', rowIndex, 'price', Number(e.target.value))} 
                          disabled={isLoading}
                        />
                      </TableCell>
                    </>
                  ) : (
                    <TableCell colSpan={5} className="border-r text-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={onAddLegA}
                        className="h-20 w-full"
                        disabled={isLoading}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Leg A
                      </Button>
                    </TableCell>
                  )}
                  
                  {/* LEG B */}
                  {legB ? (
                    <>
                      <TableCell>
                        <Select 
                          value={legB.product} 
                          onValueChange={(value) => onUpdateLeg('B', rowIndex, 'product', value)}
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Product" />
                          </SelectTrigger>
                          <SelectContent>
                            {paperProducts.map(product => (
                              <SelectItem key={product.productCode} value={product.productCode}>
                                {product.displayName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={legB.buySell} 
                          onValueChange={(value) => onUpdateLeg('B', rowIndex, 'buySell', value as BuySell)}
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Buy/Sell" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="buy">Buy</SelectItem>
                            <SelectItem value="sell">Sell</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          value={legB.quantity || ''} 
                          onChange={(e) => onUpdateLeg('B', rowIndex, 'quantity', Number(e.target.value))} 
                          disabled={isLoading}
                        />
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={legB.tradingPeriod} 
                          onValueChange={(value) => onUpdateLeg('B', rowIndex, 'tradingPeriod', value)}
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Period" />
                          </SelectTrigger>
                          <SelectContent>
                            {/* Monthly periods */}
                            <SelectItem value="monthly-header" disabled className="font-semibold text-primary">
                              Monthly
                            </SelectItem>
                            {tradingPeriods
                              .filter(p => p.periodType === 'MONTH')
                              .map((period) => (
                                <SelectItem key={period.periodCode} value={period.periodCode}>
                                  {period.periodCode}
                                </SelectItem>
                              ))}
                            
                            {/* Quarterly periods */}
                            <SelectItem value="quarterly-header" disabled className="font-semibold text-primary mt-2">
                              Quarterly
                            </SelectItem>
                            {tradingPeriods
                              .filter(p => p.periodType === 'QUARTER')
                              .map((period) => (
                                <SelectItem key={period.periodCode} value={period.periodCode}>
                                  {period.periodCode}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          value={legB.price || ''} 
                          onChange={(e) => onUpdateLeg('B', rowIndex, 'price', Number(e.target.value))} 
                          disabled={isLoading}
                        />
                      </TableCell>
                    </>
                  ) : (
                    <TableCell colSpan={5} className="text-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={onAddLegB}
                        className="h-20 w-full"
                        disabled={isLoading}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Leg B
                      </Button>
                    </TableCell>
                  )}

                  {/* Actions column */}
                  <TableCell>
                    {(legA || legB) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (legA) onRemoveLeg('A', rowIndex);
                          else if (legB) onRemoveLeg('B', rowIndex);
                        }}
                        disabled={isLoading}
                        className="h-9 w-9"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PaperTradeTable;
