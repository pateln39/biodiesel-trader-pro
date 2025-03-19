import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';
import { PaperTradeLeg, PaperTradeRow as PaperTradeRowType } from '@/types/paper';
import PaperTradeLegForm from './PaperTradeLegForm';
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
}

const PaperTradeRow: React.FC<PaperTradeRowProps> = ({
  row,
  onChange,
  onRemove,
  broker,
  tradeReference,
  rowIndex
}) => {
  const { productRelationships } = useProductRelationships();
  const [activeTab, setActiveTab] = useState<'legs' | 'mtm'>('legs');
  
  // Update Leg B when Leg A changes based on product relationships
  useEffect(() => {
    if (!row.legA || !productRelationships || !productRelationships.length) return;
    
    // Only auto-update leg B if it doesn't exist yet
    if (!row.legB) {
      // Find relationship for the selected product
      const relationship = productRelationships.find(
        rel => rel.product === row.legA?.product
      );
      
      if (relationship && relationship.default_opposite) {
        // Create Leg B with opposite values
        const legB: PaperTradeLeg = {
          id: crypto.randomUUID(),
          legReference: `${tradeReference}-${rowIndex}B`,
          parentTradeId: row.id,
          buySell: row.legA.buySell === 'buy' ? 'sell' : 'buy',
          product: relationship.default_opposite as Product,
          instrument: `Argus ${relationship.default_opposite}`, // Default instrument
          pricingPeriodStart: row.legA.pricingPeriodStart,
          pricingPeriodEnd: row.legA.pricingPeriodEnd,
          price: 0,
          quantity: row.legA.quantity,
          broker: broker,
          formula: createEmptyFormula(),
          mtmFormula: createEmptyFormula()
        };
        onChange({...row, legB});
      }
    }
  }, [row.legA, productRelationships, broker]);
  
  // Update the MTM formula when either leg changes
  useEffect(() => {
    if (!row.mtmFormula && (row.legA || row.legB)) {
      onChange({...row, mtmFormula: createEmptyFormula()});
    }
  }, [row.legA, row.legB]);
  
  const handleLegAChange = (updatedLeg: PaperTradeLeg) => {
    onChange({...row, legA: updatedLeg});
  };
  
  const handleLegBChange = (updatedLeg: PaperTradeLeg) => {
    onChange({...row, legB: updatedLeg});
  };
  
  const handleMtmFormulaChange = (formula: any) => {
    onChange({...row, mtmFormula: formula});
  };
  
  const addLegB = () => {
    if (row.legA) {
      const legB: PaperTradeLeg = {
        id: crypto.randomUUID(),
        legReference: `${tradeReference}-${rowIndex}B`,
        parentTradeId: row.id,
        buySell: row.legA.buySell === 'buy' ? 'sell' : 'buy',
        product: 'UCOME' as Product,
        instrument: 'Argus UCOME', // Default instrument
        pricingPeriodStart: row.legA.pricingPeriodStart,
        pricingPeriodEnd: row.legA.pricingPeriodEnd,
        price: 0,
        quantity: row.legA.quantity,
        broker: broker,
        formula: createEmptyFormula(),
        mtmFormula: createEmptyFormula()
      };
      onChange({...row, legB});
    }
  };
  
  const removeLegB = () => {
    onChange({...row, legB: null});
  };
  
  const totalQuantity = (row.legA?.quantity || 0) + (row.legB?.quantity || 0);
  
  return (
    <Card className="border">
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Badge variant="success">Row {rowIndex + 1}</Badge>
            <span className="text-sm">Total Quantity: {totalQuantity} MT</span>
          </div>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={onRemove}
            className="text-destructive h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        
        <Tabs defaultValue="legs" value={activeTab} onValueChange={(v) => setActiveTab(v as 'legs' | 'mtm')}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="legs">Trade Legs</TabsTrigger>
            <TabsTrigger value="mtm">MTM Formula</TabsTrigger>
          </TabsList>
          
          <TabsContent value="legs" className="space-y-4">
            {row.legA && (
              <PaperTradeLegForm
                leg={row.legA}
                onChange={handleLegAChange}
                broker={broker}
                side="A"
              />
            )}
            
            {row.legB ? (
              <PaperTradeLegForm
                leg={row.legB}
                onChange={handleLegBChange}
                onRemove={removeLegB}
                broker={broker}
                side="B"
              />
            ) : (
              <div className="flex justify-center">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addLegB}
                  className="flex items-center"
                  disabled={!row.legA}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Leg B
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
                buySell={row.legA?.buySell || 'buy'}
                selectedProduct={row.legA?.product || 'UCOME'}
                formulaType="mtm"
                otherFormula={row.legA?.formula || createEmptyFormula()}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PaperTradeRow;
