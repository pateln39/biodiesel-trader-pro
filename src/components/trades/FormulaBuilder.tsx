
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { FormulaToken, Instrument, PricingFormula } from '@/types';
import { 
  createInstrumentToken,
  createFixedValueToken,
  createOperatorToken,
  formulaToString
} from '@/utils/formulaUtils';

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
  const [selectedInstrument, setSelectedInstrument] = React.useState<Instrument>('Argus UCOME');
  const [fixedValue, setFixedValue] = React.useState<string>('0');

  const canAddToken = (type: FormulaToken['type']): boolean => {
    if (value.tokens.length === 0) {
      return type === 'instrument' || type === 'fixedValue';
    }
    const lastToken = value.tokens[value.tokens.length - 1];
    if (lastToken.type === 'operator') {
      return type === 'instrument' || type === 'fixedValue';
    }
    return type === 'operator';
  };

  const handleAddInstrument = () => {
    if (!canAddToken('instrument')) return;
    const newToken = createInstrumentToken(selectedInstrument);
    const newTokens = [...value.tokens, newToken];
    onChange({
      tokens: newTokens,
      exposures: value.exposures
    });
  };

  const handleAddFixedValue = () => {
    if (!canAddToken('fixedValue')) return;
    const newToken = createFixedValueToken(Number(fixedValue) || 0);
    const newTokens = [...value.tokens, newToken];
    onChange({
      tokens: newTokens,
      exposures: value.exposures
    });
  };

  const handleAddOperator = (operator: string) => {
    if (!canAddToken('operator')) return;
    const newToken = createOperatorToken(operator);
    const newTokens = [...value.tokens, newToken];
    onChange({
      tokens: newTokens,
      exposures: value.exposures
    });
  };

  const handleRemoveToken = (tokenId: string) => {
    const newTokens = value.tokens.filter(token => token.id !== tokenId);
    onChange({
      tokens: newTokens,
      exposures: value.exposures
    });
  };

  const resetFormula = () => {
    onChange({
      tokens: [],
      exposures: value.exposures
    });
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
          <div className="flex items-center gap-2 flex-wrap min-h-[2.5rem]">
            {value.tokens.length > 0 ? (
              value.tokens.map((token) => (
                <Badge 
                  key={token.id} 
                  variant="outline" 
                  className="text-sm py-1 px-3 flex items-center gap-2"
                >
                  {token.value}
                  <button 
                    onClick={() => handleRemoveToken(token.id)}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
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
            <Button 
              type="button" 
              onClick={handleAddInstrument} 
              size="sm"
              disabled={!canAddToken('instrument')}
            >
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
            <Button 
              type="button" 
              onClick={handleAddFixedValue} 
              size="sm"
              disabled={!canAddToken('fixedValue')}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Operators */}
        <div className="space-y-2">
          <Label>Operators</Label>
          <div className="flex gap-2">
            <Button 
              type="button" 
              onClick={() => handleAddOperator('+')} 
              size="sm" 
              variant="outline"
              disabled={!canAddToken('operator')}
            >
              +
            </Button>
            <Button 
              type="button" 
              onClick={() => handleAddOperator('-')} 
              size="sm" 
              variant="outline"
              disabled={!canAddToken('operator')}
            >
              -
            </Button>
            <Button 
              type="button" 
              onClick={() => handleAddOperator('*')} 
              size="sm" 
              variant="outline"
              disabled={!canAddToken('operator')}
            >
              ×
            </Button>
            <Button 
              type="button" 
              onClick={() => handleAddOperator('/')} 
              size="sm" 
              variant="outline"
              disabled={!canAddToken('operator')}
            >
              ÷
            </Button>
          </div>
        </div>
      </div>
      
      {/* Exposure preview */}
      <div className="mt-4">
        <Label className="text-base font-medium">Resulting Exposure</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(value.exposures).map(([instrument, exposure]) => {
            if (exposure === 0) return null;
            
            const adjustedExposure = exposure * tradeQuantity;
            return (
              <Badge key={instrument} variant="outline" className="text-sm py-1 px-3">
                {instrument}: {adjustedExposure.toFixed(2)} MT
              </Badge>
            );
          })}
          
          {!Object.values(value.exposures).some(v => v !== 0) && (
            <div className="text-muted-foreground">No exposures calculated</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormulaBuilder;
