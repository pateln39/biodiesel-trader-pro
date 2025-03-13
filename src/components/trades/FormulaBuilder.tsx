
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Brackets } from 'lucide-react';
import { FormulaToken, Instrument, PricingFormula, ExposureResult } from '@/types';
import { 
  createInstrumentToken,
  createFixedValueToken,
  createPercentageToken,
  createOperatorToken,
  createOpenBracketToken,
  createCloseBracketToken,
  formulaToString
} from '@/utils/formulaUtils';
import { 
  canAddTokenType, 
  calculateExposures 
} from '@/utils/formulaCalculation';

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

  // Recalculate exposures when tokens or trade quantity changes
  useEffect(() => {
    if (value.tokens.length > 0 && tradeQuantity !== 0) {
      const newExposures = calculateExposures(value.tokens, tradeQuantity, buySell);
      if (JSON.stringify(newExposures) !== JSON.stringify(value.exposures)) {
        onChange({
          ...value,
          exposures: newExposures
        });
      }
    }
  }, [value.tokens, tradeQuantity, buySell]);

  const handleAddInstrument = () => {
    if (!canAddTokenType(value.tokens, 'instrument')) return;
    const newToken = createInstrumentToken(selectedInstrument);
    const newTokens = [...value.tokens, newToken];
    onChange({
      tokens: newTokens,
      exposures: calculateExposures(newTokens, tradeQuantity, buySell)
    });
  };

  const handleAddFixedValue = () => {
    if (!canAddTokenType(value.tokens, 'fixedValue')) return;
    const newToken = createFixedValueToken(Number(fixedValue) || 0);
    const newTokens = [...value.tokens, newToken];
    onChange({
      tokens: newTokens,
      exposures: calculateExposures(newTokens, tradeQuantity, buySell)
    });
  };

  const handleAddPercentage = () => {
    if (!canAddTokenType(value.tokens, 'percentage')) return;
    const newToken = createPercentageToken(Number(percentageValue) || 0);
    const newTokens = [...value.tokens, newToken];
    onChange({
      tokens: newTokens,
      exposures: calculateExposures(newTokens, tradeQuantity, buySell)
    });
  };

  const handleAddOpenBracket = () => {
    if (!canAddTokenType(value.tokens, 'openBracket')) return;
    const newToken = createOpenBracketToken();
    const newTokens = [...value.tokens, newToken];
    onChange({
      tokens: newTokens,
      exposures: calculateExposures(newTokens, tradeQuantity, buySell)
    });
  };

  const handleAddCloseBracket = () => {
    if (!canAddTokenType(value.tokens, 'closeBracket')) return;
    const newToken = createCloseBracketToken();
    const newTokens = [...value.tokens, newToken];
    onChange({
      tokens: newTokens,
      exposures: calculateExposures(newTokens, tradeQuantity, buySell)
    });
  };

  const handleAddOperator = (operator: string) => {
    if (!canAddTokenType(value.tokens, 'operator')) return;
    const newToken = createOperatorToken(operator);
    const newTokens = [...value.tokens, newToken];
    onChange({
      tokens: newTokens,
      exposures: calculateExposures(newTokens, tradeQuantity, buySell)
    });
  };

  const handleRemoveToken = (tokenId: string) => {
    const newTokens = value.tokens.filter(token => token.id !== tokenId);
    onChange({
      tokens: newTokens,
      exposures: calculateExposures(newTokens, tradeQuantity, buySell)
    });
  };

  const resetFormula = () => {
    onChange({
      tokens: [],
      exposures: {
        physical: {
          'Argus UCOME': 0,
          'Argus RME': 0,
          'Argus FAME0': 0,
          'Platts LSGO': 0,
          'Platts diesel': 0,
        },
        pricing: {
          'Argus UCOME': 0,
          'Argus RME': 0,
          'Argus FAME0': 0,
          'Platts LSGO': 0,
          'Platts diesel': 0,
        }
      }
    });
  };

  const getTokenDisplay = (token: FormulaToken): string => {
    if (token.type === 'percentage') {
      return `${token.value}%`;
    }
    return token.value;
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
                  className={`text-sm py-1 px-3 flex items-center gap-2 ${
                    token.type === 'openBracket' || token.type === 'closeBracket' 
                      ? 'bg-gray-100' 
                      : token.type === 'operator' 
                        ? 'bg-blue-50' 
                        : token.type === 'percentage' 
                          ? 'bg-green-50' 
                          : token.type === 'instrument' 
                            ? 'bg-purple-50' 
                            : 'bg-orange-50'
                  }`}
                >
                  {getTokenDisplay(token)}
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
              disabled={!canAddTokenType(value.tokens, 'instrument')}
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
              disabled={!canAddTokenType(value.tokens, 'fixedValue')}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Percentage value input */}
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
              disabled={!canAddTokenType(value.tokens, 'percentage')}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Operators and brackets */}
      <div className="flex flex-wrap gap-2">
        <div className="space-y-2 w-full">
          <Label>Operators & Brackets</Label>
          <div className="flex gap-2">
            <Button 
              type="button" 
              onClick={() => handleAddOperator('+')} 
              size="sm" 
              variant="outline"
              disabled={!canAddTokenType(value.tokens, 'operator')}
            >
              +
            </Button>
            <Button 
              type="button" 
              onClick={() => handleAddOperator('-')} 
              size="sm" 
              variant="outline"
              disabled={!canAddTokenType(value.tokens, 'operator')}
            >
              -
            </Button>
            <Button 
              type="button" 
              onClick={() => handleAddOperator('*')} 
              size="sm" 
              variant="outline"
              disabled={!canAddTokenType(value.tokens, 'operator')}
            >
              ×
            </Button>
            <Button 
              type="button" 
              onClick={() => handleAddOperator('/')} 
              size="sm" 
              variant="outline"
              disabled={!canAddTokenType(value.tokens, 'operator')}
            >
              ÷
            </Button>
            <Button 
              type="button" 
              onClick={handleAddOpenBracket} 
              size="sm" 
              variant="outline"
              disabled={!canAddTokenType(value.tokens, 'openBracket')}
            >
              (
            </Button>
            <Button 
              type="button" 
              onClick={handleAddCloseBracket} 
              size="sm" 
              variant="outline"
              disabled={!canAddTokenType(value.tokens, 'closeBracket')}
            >
              )
            </Button>
          </div>
        </div>
      </div>
      
      {/* Exposure preview */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Physical exposure */}
        <div>
          <Label className="text-base font-medium">Physical Exposure</Label>
          <div className="mt-2 flex flex-wrap gap-2 min-h-[2.5rem]">
            {Object.entries(value.exposures.physical).map(([instrument, exposure]) => {
              if (exposure === 0) return null;
              
              const adjustedExposure = exposure; // Already calculated with tradeQuantity
              return (
                <Badge key={instrument} variant="outline" className="text-sm py-1 px-3">
                  {instrument}: {adjustedExposure.toFixed(2)} MT
                </Badge>
              );
            })}
            
            {!Object.values(value.exposures.physical).some(v => v !== 0) && (
              <div className="text-muted-foreground">No physical exposures</div>
            )}
          </div>
        </div>
        
        {/* Pricing exposure */}
        <div>
          <Label className="text-base font-medium">Pricing Exposure</Label>
          <div className="mt-2 flex flex-wrap gap-2 min-h-[2.5rem]">
            {Object.entries(value.exposures.pricing).map(([instrument, exposure]) => {
              if (exposure === 0) return null;
              
              const adjustedExposure = exposure; // Already calculated with tradeQuantity
              return (
                <Badge key={instrument} variant="outline" className="text-sm py-1 px-3">
                  {instrument}: {adjustedExposure.toFixed(2)} MT
                </Badge>
              );
            })}
            
            {!Object.values(value.exposures.pricing).some(v => v !== 0) && (
              <div className="text-muted-foreground">No pricing exposures</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormulaBuilder;
