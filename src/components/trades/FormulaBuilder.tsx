import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Percent, Brackets } from 'lucide-react';
import { FormulaToken, Instrument, PricingFormula } from '@/types';
import { 
  createInstrumentToken,
  createFixedValueToken,
  createOperatorToken,
  createPercentageToken,
  createOpenBracketToken,
  createCloseBracketToken,
  formulaToString,
  validateFormula
} from '@/utils/formulaUtils';

interface FormulaBuilderProps {
  value: PricingFormula;
  onChange: (formula: PricingFormula) => void;
  tradeQuantity: number;
  buySell?: 'buy' | 'sell';
}

const FormulaBuilder: React.FC<FormulaBuilderProps> = ({ 
  value, 
  onChange,
  tradeQuantity,
  buySell = 'buy'
}) => {
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument>('Argus UCOME');
  const [fixedValue, setFixedValue] = useState<string>('0');
  const [percentageValue, setPercentageValue] = useState<string>('0');
  const [formulaError, setFormulaError] = useState<string | null>(null);

  const canAddToken = (type: FormulaToken['type']): boolean => {
    if (value.tokens.length === 0) {
      // First token must be an instrument, fixed value, or open bracket
      return type === 'instrument' || type === 'fixedValue' || type === 'openBracket';
    }
    
    const lastToken = value.tokens[value.tokens.length - 1];
    
    // Rules for adding tokens based on the last token
    switch (lastToken.type) {
      case 'instrument':
      case 'fixedValue':
        // After a value, you can add an operator, percentage, or close bracket
        return type === 'operator' || type === 'percentage' || 
               (type === 'closeBracket' && hasPendingOpenBracket());
      case 'operator':
        // After an operator, you can add a value or open bracket
        return type === 'instrument' || type === 'fixedValue' || type === 'openBracket';
      case 'percentage':
        // After a percentage, you can only add an operator or close bracket
        return type === 'operator' || 
               (type === 'closeBracket' && hasPendingOpenBracket());
      case 'openBracket':
        // After an open bracket, you can add a value or another open bracket
        return type === 'instrument' || type === 'fixedValue' || type === 'openBracket';
      case 'closeBracket':
        // After a close bracket, you can add an operator, percentage, or another close bracket
        return type === 'operator' || type === 'percentage' || 
               (type === 'closeBracket' && hasPendingOpenBracket());
      default:
        return false;
    }
  };

  // Check if there's an open bracket without a matching close bracket
  const hasPendingOpenBracket = (): boolean => {
    let bracketCount = 0;
    for (const token of value.tokens) {
      if (token.type === 'openBracket') bracketCount++;
      if (token.type === 'closeBracket') bracketCount--;
    }
    return bracketCount > 0;
  };

  const handleAddInstrument = () => {
    if (!canAddToken('instrument')) return;
    const newToken = createInstrumentToken(selectedInstrument);
    addToken(newToken);
  };

  const handleAddFixedValue = () => {
    if (!canAddToken('fixedValue')) return;
    const newToken = createFixedValueToken(Number(fixedValue) || 0);
    addToken(newToken);
  };

  const handleAddPercentage = () => {
    if (!canAddToken('percentage')) return;
    const newToken = createPercentageToken(Number(percentageValue) || 0);
    addToken(newToken);
  };

  const handleAddOperator = (operator: string) => {
    if (!canAddToken('operator')) return;
    const newToken = createOperatorToken(operator);
    addToken(newToken);
  };

  const handleAddOpenBracket = () => {
    if (!canAddToken('openBracket')) return;
    const newToken = createOpenBracketToken();
    addToken(newToken);
  };

  const handleAddCloseBracket = () => {
    if (!canAddToken('closeBracket')) return;
    const newToken = createCloseBracketToken();
    addToken(newToken);
  };

  const addToken = (token: FormulaToken) => {
    const newTokens = [...value.tokens, token];
    const validation = validateFormula(newTokens);
    
    if (!validation.valid) {
      setFormulaError(validation.message || 'Invalid formula');
      return;
    }
    
    setFormulaError(null);
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
    setFormulaError(null);
  };

  const resetFormula = () => {
    onChange({
      tokens: [],
      exposures: value.exposures
    });
    setFormulaError(null);
  };

  // Get the token class based on type for color coding
  const getTokenClass = (type: FormulaToken['type']): string => {
    switch (type) {
      case 'instrument':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'fixedValue':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'operator':
        return 'bg-amber-100 border-amber-300 text-amber-800';
      case 'percentage':
        return 'bg-purple-100 border-purple-300 text-purple-800';
      case 'openBracket':
      case 'closeBracket':
        return 'bg-gray-100 border-gray-300 text-gray-800';
      default:
        return 'bg-gray-100 border-gray-300';
    }
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
                  className={`text-sm py-1 px-3 flex items-center gap-2 ${getTokenClass(token.type)}`}
                >
                  {token.type === 'percentage' ? `${token.value}%` : token.value}
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
          
          {formulaError && (
            <div className="mt-2 text-sm text-destructive">
              {formulaError}
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        
        {/* Percentage input */}
        <div className="space-y-2">
          <Label>Add Percentage</Label>
          <div className="flex gap-2">
            <Input 
              type="number"
              value={percentageValue}
              onChange={(e) => setPercentageValue(e.target.value)}
              className="flex-1"
            />
            <Button 
              type="button" 
              onClick={handleAddPercentage} 
              size="sm"
              disabled={!canAddToken('percentage')}
            >
              <Percent className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Brackets */}
        <div className="space-y-2">
          <Label>Add Brackets</Label>
          <div className="flex gap-2">
            <Button 
              type="button" 
              onClick={handleAddOpenBracket} 
              size="sm" 
              variant="outline"
              disabled={!canAddToken('openBracket')}
              className="flex-1"
            >
              Open Bracket (
            </Button>
            <Button 
              type="button" 
              onClick={handleAddCloseBracket} 
              size="sm" 
              variant="outline"
              disabled={!canAddToken('closeBracket')}
              className="flex-1"
            >
              Close Bracket )
            </Button>
          </div>
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
      
      {/* Exposure preview */}
      <div className="mt-4 border rounded-md p-4 bg-gray-50">
        <Label className="text-base font-medium mb-2 block">Resulting Exposure</Label>
        
        {/* Physical Exposure */}
        <div className="mb-4">
          <div className="text-sm font-medium mb-1">Physical Exposure:</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(value.exposures).map(([instrument, exposure]) => {
              if (exposure.physical === 0) return null;
              
              const adjustedExposure = exposure.physical * (tradeQuantity || 1);
              return (
                <Badge key={`${instrument}-phy`} variant="outline" className="text-sm py-1 px-3 bg-blue-50">
                  {instrument}: {adjustedExposure.toFixed(2)} MT
                </Badge>
              );
            })}
            
            {!Object.values(value.exposures).some(v => v.physical !== 0) && (
              <div className="text-muted-foreground">No physical exposures calculated</div>
            )}
          </div>
        </div>
        
        {/* Pricing Exposure */}
        <div>
          <div className="text-sm font-medium mb-1">Pricing Exposure:</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(value.exposures).map(([instrument, exposure]) => {
              if (exposure.pricing === 0) return null;
              
              const adjustedExposure = exposure.pricing * (tradeQuantity || 1);
              return (
                <Badge key={`${instrument}-pri`} variant="outline" className="text-sm py-1 px-3 bg-green-50">
                  {instrument}: {adjustedExposure.toFixed(2)} MT
                </Badge>
              );
            })}
            
            {!Object.values(value.exposures).some(v => v.pricing !== 0) && (
              <div className="text-muted-foreground">No pricing exposures calculated</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormulaBuilder;
