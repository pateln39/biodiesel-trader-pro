import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';
import { PaperTradeLeg, PaperTradeRow } from '@/types/paper';
import PaperTradeLegForm from './PaperTradeLegForm';
import { generateLegReference } from '@/utils/tradeUtils';
import { createEmptyFormula } from '@/utils/formulaUtils';
import FormulaBuilder from '../FormulaBuilder';
import { v4 as uuidv4 } from 'uuid';
import { ProductRelationship } from '@/hooks/useProductRelationships';

interface PaperTradeTableProps {
  rows: PaperTradeRow[];
  onUpdateLegA: (rowId: string, legData: PaperTradeLeg | null) => void;
  onUpdateLegB: (rowId: string, legData: PaperTradeLeg | null) => void;
  onUpdateMtmFormula: (rowId: string, formula: any) => void;
  onRemoveRow: (rowId: string) => void;
  productRelationships: ProductRelationship[];
  selectedBroker: string;
  tradeReference: string;
}

export const PaperTradeTable: React.FC<PaperTradeTableProps> = ({
  rows,
  onUpdateLegA,
  onUpdateLegB,
  onUpdateMtmFormula,
  onRemoveRow,
  productRelationships,
  selectedBroker,
  tradeReference
}) => {
  const findRelationship = (product: string) => {
    return productRelationships.find(r => r.product === product);
  };

  const findRelationshipByOpposite = (product: string) => {
    return productRelationships.find(r => r.default_opposite === product);
  };

  const getOppositeBuySell = (buySell: 'buy' | 'sell') => {
    return buySell === 'buy' ? 'sell' : 'buy';
  };

  const handleAddLegA = (rowId: string, legIndex: number) => {
    const newLeg: PaperTradeLeg = {
      id: `new-${uuidv4()}`,
      legReference: generateLegReference(tradeReference, legIndex * 2),
      parentTradeId: '',
      buySell: 'buy',
      product: 'UCOME',
      instrument: 'Argus UCOME',
      pricingPeriodStart: new Date(),
      pricingPeriodEnd: new Date(),
      price: 0,
      quantity: 0,
      broker: selectedBroker,
      formula: createEmptyFormula()
    };
    onUpdateLegA(rowId, newLeg);
    
    const relationship = findRelationship('UCOME');
    if (relationship) {
      if (relationship.relationship_type === 'DIFF' && relationship.default_opposite) {
        const newLegB: PaperTradeLeg = {
          id: `new-${uuidv4()}`,
          legReference: generateLegReference(tradeReference, legIndex * 2 + 1),
          parentTradeId: '',
          buySell: getOppositeBuySell(newLeg.buySell),
          product: relationship.default_opposite,
          instrument: relationship.default_opposite.includes('LSGO') ? 'Platts LSGO' : `Argus ${relationship.default_opposite}`,
          pricingPeriodStart: new Date(newLeg.pricingPeriodStart),
          pricingPeriodEnd: new Date(newLeg.pricingPeriodEnd),
          price: 0,
          quantity: newLeg.quantity,
          broker: selectedBroker,
          formula: createEmptyFormula()
        };
        onUpdateLegB(rowId, newLegB);
      } 
      else if (relationship.relationship_type === 'SPREAD' && relationship.paired_product) {
        const newLegB: PaperTradeLeg = {
          id: `new-${uuidv4()}`,
          legReference: generateLegReference(tradeReference, legIndex * 2 + 1),
          parentTradeId: '',
          buySell: getOppositeBuySell(newLeg.buySell),
          product: relationship.paired_product,
          instrument: `Argus ${relationship.paired_product}`,
          pricingPeriodStart: new Date(newLeg.pricingPeriodStart),
          pricingPeriodEnd: new Date(newLeg.pricingPeriodEnd),
          price: 0,
          quantity: newLeg.quantity,
          broker: selectedBroker,
          formula: createEmptyFormula()
        };
        onUpdateLegB(rowId, newLegB);
      }
    }
  };
  
  const handleAddLegB = (rowId: string, legIndex: number) => {
    const newLeg: PaperTradeLeg = {
      id: `new-${uuidv4()}`,
      legReference: generateLegReference(tradeReference, legIndex * 2 + 1),
      parentTradeId: '',
      buySell: 'sell',
      product: 'LSGO',
      instrument: 'Platts LSGO',
      pricingPeriodStart: new Date(),
      pricingPeriodEnd: new Date(),
      price: 0,
      quantity: 0,
      broker: selectedBroker,
      formula: createEmptyFormula()
    };
    onUpdateLegB(rowId, newLeg);
    
    const relationship = findRelationshipByOpposite('LSGO');
    if (relationship) {
      const newLegA: PaperTradeLeg = {
        id: `new-${uuidv4()}`,
        legReference: generateLegReference(tradeReference, legIndex * 2),
        parentTradeId: '',
        buySell: getOppositeBuySell(newLeg.buySell),
        product: relationship.product,
        instrument: `Argus ${relationship.product}`,
        pricingPeriodStart: new Date(newLeg.pricingPeriodStart),
        pricingPeriodEnd: new Date(newLeg.pricingPeriodEnd),
        price: 0,
        quantity: newLeg.quantity,
        broker: selectedBroker,
        formula: createEmptyFormula()
      };
      onUpdateLegA(rowId, newLegA);
    }
  };
  
  const handleLegAChange = (rowId: string, updatedLeg: PaperTradeLeg) => {
    onUpdateLegA(rowId, updatedLeg);
    
    const row = rows.find(r => r.id === rowId);
    if (!row || !row.legB) return;
    
    const relationship = findRelationship(updatedLeg.product);
    
    if (relationship) {
      if (relationship.relationship_type === 'DIFF' || relationship.relationship_type === 'SPREAD') {
        const updatedLegB = { 
          ...row.legB, 
          quantity: updatedLeg.quantity,
          pricingPeriodStart: updatedLeg.pricingPeriodStart,
          pricingPeriodEnd: updatedLeg.pricingPeriodEnd
        };
        onUpdateLegB(rowId, updatedLegB);
      }
    }
  };
  
  const handleLegBChange = (rowId: string, updatedLeg: PaperTradeLeg) => {
    onUpdateLegB(rowId, updatedLeg);
    
    const row = rows.find(r => r.id === rowId);
    if (!row || !row.legA) return;
    
    const relationship = findRelationshipByOpposite(updatedLeg.product);
    
    if (relationship) {
      if (relationship.relationship_type === 'DIFF' || relationship.relationship_type === 'SPREAD') {
        const updatedLegA = { 
          ...row.legA, 
          quantity: updatedLeg.quantity,
          pricingPeriodStart: updatedLeg.pricingPeriodStart,
          pricingPeriodEnd: updatedLeg.pricingPeriodEnd
        };
        onUpdateLegA(rowId, updatedLegA);
      }
    }
  };
  
  return (
    <div className="space-y-6">
      {rows.map((row, index) => (
        <div key={row.id} className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <div className="font-medium">Trade Row {index + 1}</div>
            {rows.length > 1 && (
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => onRemoveRow(row.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove Row
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium">Leg A</div>
                {!row.legA && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleAddLegA(row.id, index)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Leg A
                  </Button>
                )}
              </div>
              
              {row.legA ? (
                <PaperTradeLegForm
                  leg={row.legA}
                  onChange={(updatedLeg) => handleLegAChange(row.id, updatedLeg)}
                  onRemove={() => onUpdateLegA(row.id, null)}
                  broker={selectedBroker}
                />
              ) : (
                <Card className="border border-dashed flex items-center justify-center h-[200px]">
                  <CardContent className="text-center text-muted-foreground p-6">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => handleAddLegA(row.id, index)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Leg A
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium">Leg B</div>
                {!row.legB && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleAddLegB(row.id, index)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Leg B
                  </Button>
                )}
              </div>
              
              {row.legB ? (
                <PaperTradeLegForm
                  leg={row.legB}
                  onChange={(updatedLeg) => handleLegBChange(row.id, updatedLeg)}
                  onRemove={() => onUpdateLegB(row.id, null)}
                  broker={selectedBroker}
                />
              ) : (
                <Card className="border border-dashed flex items-center justify-center h-[200px]">
                  <CardContent className="text-center text-muted-foreground p-6">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => handleAddLegB(row.id, index)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Leg B
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
            
            <div>
              <div className="font-medium mb-2">MTM Formula</div>
              <Card className="border">
                <CardContent className="p-4">
                  <FormulaBuilder
                    value={row.mtmFormula || createEmptyFormula()}
                    onChange={(formula) => onUpdateMtmFormula(row.id, formula)}
                    tradeQuantity={(row.legA?.quantity || 0) + (row.legB?.quantity || 0)}
                    buySell={(row.legA?.buySell || row.legB?.buySell) as any || 'buy'}
                    selectedProduct={(row.legA?.product || row.legB?.product) as any || 'UCOME'}
                    formulaType="mtm"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
          
          {index < rows.length - 1 && <hr className="mt-6" />}
        </div>
      ))}
    </div>
  );
};
