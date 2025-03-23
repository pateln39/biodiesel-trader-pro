import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { FormulaToken, Instrument, PricingFormula } from '@/modules/trade/types';
import { 
  createInstrumentToken,
  createFixedValueToken,
  createPercentageToken,
  createOperatorToken,
  createOpenBracketToken,
  createCloseBracketToken,
  formulaToString
} from '@/modules/pricing/utils/formulaUtils';
import { 
  canAddTokenType, 
  calculateExposures,
  calculatePhysicalExposure,
  calculatePricingExposure,
  createEmptyExposureResult
} from '@/modules/pricing/utils/formulaCalculation';

interface FormulaBuilderProps {
  value: PricingFormula;
  onChange: (formula: PricingFormula) => void;
  formulaType?: 'pricing' | 'mtm';
  instrumentOptions: Array<{ id: string; label: string; value: string }>;
  allowEmptyFormula?: boolean;
  tradeQuantity?: number;
  buySell?: string;
  selectedProduct?: string;
}

const FormulaBuilder: React.FC<FormulaBuilderProps> = ({ 
  value, 
  onChange, 
  formulaType = 'pricing',
  instrumentOptions,
  allowEmptyFormula = false,
  tradeQuantity = 0,
  buySell = 'buy',
  selectedProduct
}) => {
  const [formula, setFormula] = useState<PricingFormula>(value);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [exposureResult, setExposureResult] = useState<any>(createEmptyExposureResult());
  
  useEffect(() => {
    setFormula(value);
  }, [value]);
  
  useEffect(() => {
    if (formula && formula.tokens && formula.tokens.length > 0) {
      try {
        if (formulaType === 'pricing') {
          const result = calculatePricingExposure(formula.tokens, tradeQuantity, buySell as any);
          setExposureResult(result);
        } else {
          const result = calculatePhysicalExposure(formula.tokens, tradeQuantity, buySell as any);
          setExposureResult(result);
        }
      } catch (error: any) {
        console.error("Error calculating exposure:", error);
        setValidationError(error.message || 'Error calculating exposure');
        setExposureResult(createEmptyExposureResult());
      }
    } else {
      setExposureResult(createEmptyExposureResult());
    }
  }, [formula, formulaType, tradeQuantity, buySell]);
  
  const handleTokenAdd = (tokenType: TokenType, tokenValue: any = null) => {
    if (!formula) return;
    
    if (!canAddTokenType(formula.tokens, tokenType as any)) {
      setValidationError(`Cannot add ${tokenType} at this position`);
      return;
    }
    
    let newToken: FormulaToken;
    
    switch (tokenType) {
      case TokenType.Instrument:
        if (!tokenValue) return;
        newToken = createInstrumentToken(tokenValue.value, tokenValue.label);
        break;
      case TokenType.Operator:
        newToken = createOperatorToken(tokenValue);
        break;
      case TokenType.Value:
      case TokenType.FixedValue:
        newToken = createFixedValueToken(tokenValue || 0);
        break;
      case TokenType.Percentage:
        newToken = createPercentageToken(tokenValue || 0);
        break;
      case TokenType.OpenBracket:
        newToken = createOpenBracketToken();
        break;
      case TokenType.CloseBracket:
        newToken = createCloseBracketToken();
        break;
      default:
        return;
    }
    
    const newTokens = [...formula.tokens, newToken];
    setFormula({ ...formula, tokens: newTokens });
    onChange({ ...formula, tokens: newTokens });
    setValidationError(null);
  };
  
  const handleTokenRemove = (index: number) => {
    if (!formula) return;
    
    const newTokens = [...formula.tokens];
    newTokens.splice(index, 1);
    setFormula({ ...formula, tokens: newTokens });
    onChange({ ...formula, tokens: newTokens });
    setValidationError(null);
  };
  
  const handleClearFormula = () => {
    setFormula({ ...formula, tokens: [] });
    onChange({ ...formula, tokens: [] });
    setValidationError(null);
  };
  
  const renderToken = (token: FormulaToken, index: number) => {
    let displayValue = token.value;
    let badgeColor = "muted";
    
    switch (token.type) {
      case 'instrument':
        displayValue = token.value;
        badgeColor = "blue";
        break;
      case 'operator':
        badgeColor = "secondary";
        break;
      case 'fixedValue':
        badgeColor = "green";
        break;
      case 'percentage':
        badgeColor = "orange";
        break;
      case 'openBracket':
      case 'closeBracket':
        badgeColor = "slate";
        break;
    }
    
    return (
      <Badge 
        key={index} 
        variant="outline" 
        className={`mr-1.5 mb-1.5 text-sm font-medium capitalize text-muted-foreground border-${badgeColor}-500`}
      >
        {displayValue}
        <Button 
          variant="ghost" 
          size="icon" 
          className="ml-1 -mr-1 h-4 w-4 rounded-full hover:bg-muted"
          onClick={() => handleTokenRemove(index)}
        >
          <X className="h-3 w-3" />
        </Button>
      </Badge>
    );
  };
  
  const isValid = () => {
    if (allowEmptyFormula && (!formula || !formula.tokens || formula.tokens.length === 0)) {
      return true;
    }
    
    return exposureResult.isValid;
  };
  
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Formula Builder</h4>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleClearFormula}
            disabled={!formula || !formula.tokens || formula.tokens.length === 0}
          >
            Clear Formula
          </Button>
        </div>
        
        <div className="border rounded-md p-2.5 bg-muted/50">
          <div className="flex flex-wrap">
            {formula && formula.tokens && formula.tokens.length > 0 ? (
              formula.tokens.map((token, index) => renderToken(token, index))
            ) : (
              <span className="text-sm text-muted-foreground italic">
                No formula added. Start building your formula below.
              </span>
            )}
          </div>
        </div>
        
        {validationError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {validationError}
            </AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="instruments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="instruments">Instruments</TabsTrigger>
            <TabsTrigger value="operators">Operators</TabsTrigger>
            <TabsTrigger value="values">Values</TabsTrigger>
          </TabsList>
          
          <TabsContent value="instruments" className="space-y-2">
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
              {instrumentOptions && instrumentOptions.length > 0 ? (
                instrumentOptions.map(instrument => (
                  <Button
                    key={instrument.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleTokenAdd(TokenType.Instrument, instrument)}
                  >
                    {instrument.label}
                  </Button>
                ))
              ) : (
                <span className="text-sm text-muted-foreground italic">
                  No instruments available.
                </span>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="operators" className="space-y-2">
            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-2">
              {['+', '-', '*', '/'].map(operator => (
                <Button
                  key={operator}
                  variant="outline"
                  size="sm"
                  onClick={() => handleTokenAdd(TokenType.Operator, operator)}
                >
                  {operator}
                </Button>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="values" className="space-y-2">
            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTokenAdd(TokenType.Value, 1)}
              >
                1
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTokenAdd(TokenType.Value, 10)}
              >
                10
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTokenAdd(TokenType.Percentage, 100)}
              >
                100%
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTokenAdd(TokenType.OpenBracket)}
              >
                (
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTokenAdd(TokenType.CloseBracket)}
              >
                )
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex items-center justify-end space-x-2">
          {isValid() ? (
            <Badge variant="outline" className="border-green-500 text-green-500">
              <Check className="h-3 w-3 mr-1" />
              Valid Formula
            </Badge>
          ) : (
            <Badge variant="outline" className="border-red-500 text-red-500">
              <AlertCircle className="h-3 w-3 mr-1" />
              Invalid Formula
            </Badge>
          )}
          
          <span className="text-sm text-muted-foreground">
            {formula && formula.tokens && formula.tokens.length > 0 ? (
              <span className="font-mono">{formulaToString(formula.tokens)}</span>
            ) : (
              'No formula'
            )}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default FormulaBuilder;
