
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormulaNode, Instrument, PricingFormula } from '@/types';
import { 
  createInstrumentNode, 
  createFixedValueNode, 
  createOperatorNode,
  createGroupNode,
  calculateExposures,
  formulaToString
} from '@/utils/formulaUtils';
import { Plus, X, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FormulaBuilderProps {
  value: PricingFormula;
  onChange: (formula: PricingFormula) => void;
  tradeQuantity: number;
}

const FormulaBuilder: React.FC<FormulaBuilderProps> = ({ 
  value, 
  onChange,
  tradeQuantity
}) => {
  const [formula, setFormula] = useState<PricingFormula>(value);
  const [formulaString, setFormulaString] = useState<string>('');
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument>('Argus UCOME');
  const [fixedValue, setFixedValue] = useState<string>('0');

  useEffect(() => {
    // Update formula string whenever the formula changes
    if (formula && formula.root) {
      setFormulaString(formulaToString(formula.root));
    }
  }, [formula]);

  useEffect(() => {
    // Update parent component when formula changes
    onChange(formula);
  }, [formula, onChange]);

  const handleAddInstrument = () => {
    const newNode = createInstrumentNode(selectedInstrument);
    updateFormula(newNode);
  };

  const handleAddFixedValue = () => {
    const value = parseFloat(fixedValue) || 0;
    const newNode = createFixedValueNode(value);
    updateFormula(newNode);
  };

  const handleAddOperator = (operator: string) => {
    const newNode = createOperatorNode(operator);
    updateFormula(newNode);
  };

  const handleAddGroup = () => {
    const newNode = createGroupNode();
    updateFormula(newNode);
  };

  const updateFormula = (newNode: FormulaNode) => {
    // For simplicity, just replace the root node
    // In a more advanced implementation, we would build a tree
    const updatedFormula: PricingFormula = {
      root: newNode,
      exposures: calculateExposures(newNode, tradeQuantity)
    };
    
    setFormula(updatedFormula);
  };

  const resetFormula = () => {
    const initialNode = createInstrumentNode('Argus UCOME');
    updateFormula(initialNode);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Pricing Formula</Label>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={resetFormula}
        >
          Reset Formula
        </Button>
      </div>
      
      <Card className="border border-muted">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            {formulaString ? (
              <div className="text-lg font-medium py-2">{formulaString}</div>
            ) : (
              <div className="text-muted-foreground">No formula defined</div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Instrument selector */}
        <div className="space-y-2">
          <Label>Add Instrument</Label>
          <div className="flex gap-2">
            <Select 
              value={selectedInstrument} 
              onValueChange={(value) => setSelectedInstrument(value as Instrument)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select instrument" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Argus UCOME">Argus UCOME</SelectItem>
                <SelectItem value="Argus RME">Argus RME</SelectItem>
                <SelectItem value="Argus FAME0">Argus FAME0</SelectItem>
                <SelectItem value="Platts LSGO">Platts LSGO</SelectItem>
                <SelectItem value="Platts diesel">Platts diesel</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" onClick={handleAddInstrument} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Fixed value input */}
        <div className="space-y-2">
          <Label>Add Fixed Value</Label>
          <div className="flex gap-2">
            <Input 
              type="number"
              value={fixedValue}
              onChange={(e) => setFixedValue(e.target.value)}
              className="flex-1"
            />
            <Button type="button" onClick={handleAddFixedValue} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Operators */}
        <div className="space-y-2">
          <Label>Operators</Label>
          <div className="flex gap-2">
            <Button type="button" onClick={() => handleAddOperator('+')} size="sm" variant="outline">+</Button>
            <Button type="button" onClick={() => handleAddOperator('-')} size="sm" variant="outline">-</Button>
            <Button type="button" onClick={() => handleAddOperator('*')} size="sm" variant="outline">×</Button>
            <Button type="button" onClick={() => handleAddOperator('/')} size="sm" variant="outline">÷</Button>
            <Button type="button" onClick={handleAddGroup} size="sm" variant="outline">( )</Button>
          </div>
        </div>
      </div>
      
      {/* Exposure preview */}
      <div className="mt-4">
        <Label className="text-base font-medium">Resulting Exposure</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(formula.exposures).map(([instrument, exposure]) => {
            if (exposure === 0) return null;
            
            const adjustedExposure = exposure * tradeQuantity;
            return (
              <Badge key={instrument} variant="outline" className="text-sm py-1 px-3">
                {instrument}: {adjustedExposure.toFixed(2)} MT
              </Badge>
            );
          })}
          
          {!Object.values(formula.exposures).some(v => v !== 0) && (
            <div className="text-muted-foreground">No exposures calculated</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormulaBuilder;
