
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';
import { PaperTradePositionSide, PaperTradeRow as PaperTradeRowType } from '@/types/paper';
import PaperTradePositionSideForm from './PaperTradePositionSideForm';
import FormulaBuilder from '../FormulaBuilder';
import { createEmptyFormula } from '@/utils/formulaUtils';
import { useProductRelationships } from '@/hooks/useProductRelationships';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Product } from '@/types';

interface PaperTradeRowProps {
  row: PaperTradeRowType;
  onChange: (updatedRow: PaperTradeRowType) => void;
  onRemove: () => void;
  broker: string;
  tradeReference: string;
  rowIndex: number;
  disabled?: boolean;
}

const PaperTradeRow: React.FC<PaperTradeRowProps> = ({
  row,
  onChange,
  onRemove,
  broker,
  tradeReference,
  rowIndex,
  disabled = false
}) => {
  const { productRelationships } = useProductRelationships();
  const [activeTab, setActiveTab] = useState<'sides' | 'mtm'>('sides');
  
  // Update Right Side when Left Side changes based on product relationships
  useEffect(() => {
    if (!row.leftSide || !productRelationships || !productRelationships.length) return;
    
    // Only auto-update right side if it doesn't exist yet
    if (!row.rightSide) {
      // Find relationship for the selected product
      const relationship = productRelationships.find(
        rel => rel.product === row.leftSide?.product
      );
      
      if (relationship && relationship.default_opposite) {
        // Create Right Side with opposite values
        const rightSide: PaperTradePositionSide = {
          id: crypto.randomUUID(),
          sideReference: `${tradeReference}-${rowIndex}B`,
          parentTradeId: row.id,
          buySell: row.leftSide.buySell === 'buy' ? 'sell' : 'buy',
          product: relationship.default_opposite as Product,
          instrument: `Argus ${relationship.default_opposite}`, // Default instrument
          pricingPeriodStart: row.leftSide.pricingPeriodStart,
          pricingPeriodEnd: row.leftSide.pricingPeriodEnd,
          price: 0,
          quantity: row.leftSide.quantity,
          broker: broker,
          formula: createEmptyFormula(),
          mtmFormula: createEmptyFormula()
        };
        onChange({...row, rightSide});
      }
    }
  }, [row.leftSide, productRelationships, broker]);
  
  // Update the MTM formula when either side changes
  useEffect(() => {
    if (!row.mtmFormula && (row.leftSide || row.rightSide)) {
      onChange({...row, mtmFormula: createEmptyFormula()});
    }
  }, [row.leftSide, row.rightSide]);
  
  const handleLeftSideChange = (updatedSide: PaperTradePositionSide) => {
    onChange({...row, leftSide: updatedSide});
  };
  
  const handleRightSideChange = (updatedSide: PaperTradePositionSide) => {
    onChange({...row, rightSide: updatedSide});
  };
  
  const handleMtmFormulaChange = (formula: any) => {
    onChange({...row, mtmFormula: formula});
  };
  
  const addRightSide = () => {
    if (row.leftSide) {
      const rightSide: PaperTradePositionSide = {
        id: crypto.randomUUID(),
        sideReference: `${tradeReference}-${rowIndex}B`,
        parentTradeId: row.id,
        buySell: row.leftSide.buySell === 'buy' ? 'sell' : 'buy',
        product: 'UCOME' as Product,
        instrument: 'Argus UCOME', // Default instrument
        pricingPeriodStart: row.leftSide.pricingPeriodStart,
        pricingPeriodEnd: row.leftSide.pricingPeriodEnd,
        price: 0,
        quantity: row.leftSide.quantity,
        broker: broker,
        formula: createEmptyFormula(),
        mtmFormula: createEmptyFormula()
      };
      onChange({...row, rightSide});
    }
  };
  
  const removeRightSide = () => {
    onChange({...row, rightSide: null});
  };
  
  const totalQuantity = (row.leftSide?.quantity || 0) + (row.rightSide?.quantity || 0);
  
  return (
    <Card className={`border ${disabled ? 'opacity-70' : ''}`}>
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Badge variant="success">Position {rowIndex + 1}</Badge>
            <span className="text-sm">Total Quantity: {totalQuantity} MT</span>
          </div>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={onRemove}
            className="text-destructive h-8 w-8 p-0"
            disabled={disabled}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        
        <Tabs defaultValue="sides" value={activeTab} onValueChange={(v) => setActiveTab(v as 'sides' | 'mtm')}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="sides" disabled={disabled}>Position Sides</TabsTrigger>
            <TabsTrigger value="mtm" disabled={disabled}>MTM Formula</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sides" className="space-y-4">
            {row.leftSide && (
              <PaperTradePositionSideForm
                side={row.leftSide}
                onChange={handleLeftSideChange}
                broker={broker}
                sideType="LEFT"
                disabled={disabled}
              />
            )}
            
            {row.rightSide ? (
              <PaperTradePositionSideForm
                side={row.rightSide}
                onChange={handleRightSideChange}
                onRemove={removeRightSide}
                broker={broker}
                sideType="RIGHT"
                disabled={disabled}
              />
            ) : (
              <div className="flex justify-center">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addRightSide}
                  className="flex items-center"
                  disabled={!row.leftSide || disabled}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Right Side
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="mtm">
            <div className="border rounded-md p-3 bg-gray-50">
              <Label className="mb-2 block">MTM Formula</Label>
              <FormulaBuilder
                value={row.mtmFormula || createEmptyFormula()}
                onChange={handleMtmFormulaChange}
                tradeQuantity={totalQuantity}
                buySell={row.leftSide?.buySell || 'buy'}
                selectedProduct={row.leftSide?.product || 'UCOME'}
                formulaType="mtm"
                otherFormula={row.leftSide?.formula || createEmptyFormula()}
                disabled={disabled}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PaperTradeRow;
