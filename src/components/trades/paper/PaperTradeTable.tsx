import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';
import { PaperTradeLeg, PaperTradeRow } from '@/types/paper';
import PaperTradeLegForm from './PaperTradeLegForm';
import { generateLegReference } from '@/utils/tradeUtils';
import { createEmptyFormula } from '@/utils/formulaUtils';
import FormulaBuilder from '../FormulaBuilder';
import { v4 as uuidv4 } from 'uuid';

interface PaperTradeTableProps {
  rows: PaperTradeRow[];
  onUpdateLegA: (rowId: string, legData: PaperTradeLeg | null) => void;
  onUpdateLegB: (rowId: string, legData: PaperTradeLeg | null) => void;
  onUpdateMtmFormula: (rowId: string, formula: any) => void;
  onRemoveRow: (rowId: string) => void;
  productRelationships: any[];
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
    
    // Auto-populate Leg B if there's a relationship
    const relationship = productRelationships.find(r => r.product === 'UCOME');
    if (relationship && relationship.default_opposite) {
      const newLegB: PaperTradeLeg = {
        id: `new-${uuidv4()}`,
        legReference: generateLegReference(tradeReference, legIndex * 2 + 1),
        parentTradeId: '',
        buySell: 'sell',
        product: relationship.default_opposite,
        instrument: `Argus ${relationship.default_opposite}`,
        pricingPeriodStart: new Date(),
        pricingPeriodEnd: new Date(),
        price: 0,
        quantity: newLeg.quantity,
        broker: selectedBroker,
        formula: createEmptyFormula()
      };
      onUpdateLegB(rowId, newLegB);
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
    
    // Auto-populate Leg A if there's a relationship
    const relationship = productRelationships.find(r => r.default_opposite === 'LSGO');
    if (relationship) {
      const newLegA: PaperTradeLeg = {
        id: `new-${uuidv4()}`,
        legReference: generateLegReference(tradeReference, legIndex * 2),
        parentTradeId: '',
        buySell: 'buy',
        product: relationship.product,
        instrument: `Argus ${relationship.product}`,
        pricingPeriodStart: new Date(),
        pricingPeriodEnd: new Date(),
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
    
    // Find the matching row
    const row = rows.find(r => r.id === rowId);
    if (!row || !row.legB) return;
    
    // If this is a quantity change, update Leg B quantity for certain relationships
    const relationship = productRelationships.find(r => r.product === updatedLeg.product);
    if (relationship && relationship.relationship_type === 'DIFF') {
      // For DIFF relationships, keep quantities in sync with opposite sign
      const updatedLegB = { ...row.legB, quantity: updatedLeg.quantity };
      onUpdateLegB(rowId, updatedLegB);
    }
  };
  
  const handleLegBChange = (rowId: string, updatedLeg: PaperTradeLeg) => {
    onUpdateLegB(rowId, updatedLeg);
    
    // Find the matching row
    const row = rows.find(r => r.id === rowId);
    if (!row || !row.legA) return;
    
    // If this is a quantity change, update Leg A quantity for certain relationships
    const relationship = productRelationships.find(r => 
      r.default_opposite === updatedLeg.product || r.paired_product === updatedLeg.product
    );
    if (relationship && relationship.relationship_type === 'DIFF') {
      // For DIFF relationships, keep quantities in sync with opposite sign
      const updatedLegA = { ...row.legA, quantity: updatedLeg.quantity };
      onUpdateLegA(rowId, updatedLegA);
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
            {/* Leg A Column */}
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
            
            {/* Leg B Column */}
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
            
            {/* MTM Column */}
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
