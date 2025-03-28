import React, { useState, useEffect, useCallback } from 'react';
import {
  FormulaNode,
  FormulaToken,
  PricingFormula,
  Instrument,
  createEmptyFormula
} from '@/types/pricing';
import {
  generateNodeId,
  createInstrumentToken,
  createFixedValueToken,
  createOperatorToken,
  createPercentageToken,
  createOpenBracketToken,
  createCloseBracketToken,
  formulaToString,
  formulaToDisplayString
} from '@/utils/formulaUtils';
import {
  isValue,
  canAddTokenType,
  calculateExposures
} from '@/utils/formulaCalculation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Delete, Percent, NumberIcon, LetterCase, FunctionSquare } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useReferenceData } from '@/hooks/useReferenceData';

interface FormulaBuilderProps {
  value: PricingFormula;
  onChange: (value: PricingFormula) => void;
  tradeQuantity: number;
  buySell: 'buy' | 'sell';
  selectedProduct?: string;
  formulaType: 'price' | 'mtm';
  otherFormula?: PricingFormula;
  pricingPeriodStart: Date;
  pricingPeriodEnd: Date;
  loadingPeriodStart?: Date;
}

const FormulaBuilder: React.FC<FormulaBuilderProps> = ({
  value: initialFormula,
  onChange,
  tradeQuantity,
  buySell,
  selectedProduct,
  formulaType,
  otherFormula,
  pricingPeriodStart,
  pricingPeriodEnd,
  loadingPeriodStart
}) => {
  const [formula, setFormula] = useState<PricingFormula>(initialFormula);
  const [isEditingFixedValue, setIsEditingFixedValue] = useState(false);
  const [editingTokenId, setEditingTokenId] = useState<string | null>(null);
  const [tempFixedValue, setTempFixedValue] = useState('');
  const { instruments } = useReferenceData();

  useEffect(() => {
    setFormula(initialFormula);
  }, [initialFormula]);

  const updateExposures = useCallback((newFormula: PricingFormula) => {
    const exposures = calculateExposures(
      newFormula.tokens,
      tradeQuantity,
      buySell,
      selectedProduct,
      pricingPeriodStart,
      pricingPeriodEnd,
      formulaType,
      loadingPeriodStart
    );

    return {
      ...newFormula,
      exposures
    };
  }, [tradeQuantity, buySell, selectedProduct, pricingPeriodStart, pricingPeriodEnd, formulaType, loadingPeriodStart]);

  const addToken = (token: FormulaToken) => {
    const newFormula = {
      ...formula,
      tokens: [...formula.tokens, token],
    };

    const updatedFormula = updateExposures(newFormula);
    setFormula(updatedFormula);
    onChange(updatedFormula);
  };

  const removeToken = (id: string) => {
    const newTokens = formula.tokens.filter(token => token.id !== id);
    const newFormula = {
      ...formula,
      tokens: newTokens,
    };

    const updatedFormula = updateExposures(newFormula);
    setFormula(updatedFormula);
    onChange(updatedFormula);
  };

  const handleInstrumentSelect = (instrument: Instrument) => {
    const instrumentToken = createInstrumentToken(instrument);
    addToken(instrumentToken);
  };

  const handleOperatorSelect = (operator: string) => {
    const operatorToken = createOperatorToken(operator);
    addToken(operatorToken);
  };

  const handlePercentageSelect = (percentage: number) => {
    const percentageToken = createPercentageToken(percentage);
    addToken(percentageToken);
  };

  const handleOpenBracketSelect = () => {
    const openBracketToken = createOpenBracketToken();
    addToken(openBracketToken);
  };

  const handleCloseBracketSelect = () => {
    const closeBracketToken = createCloseBracketToken();
    addToken(closeBracketToken);
  };

  const handleFixedValueEdit = (id: string, value: string) => {
    setIsEditingFixedValue(true);
    setEditingTokenId(id);
    setTempFixedValue(value);
  };

  const handleFixedValueSave = () => {
    if (!editingTokenId) return;

    const newTokens = formula.tokens.map(token => {
      if (token.id === editingTokenId) {
        return {
          ...token,
          value: tempFixedValue,
        };
      }
      return token;
    });

    const newFormula = {
      ...formula,
      tokens: newTokens,
    };

    const updatedFormula = updateExposures(newFormula);
    setFormula(updatedFormula);
    onChange(updatedFormula);

    setIsEditingFixedValue(false);
    setEditingTokenId(null);
    setTempFixedValue('');
  };

  const handleFixedValueCancel = () => {
    setIsEditingFixedValue(false);
    setEditingTokenId(null);
    setTempFixedValue('');
  };

  const handleAddFixedValue = () => {
    setIsEditingFixedValue(true);
    const newId = generateNodeId();
    setEditingTokenId(newId);
    setTempFixedValue('');

    const fixedValueToken = createFixedValueToken(0);
    addToken(fixedValueToken);
  };

  const formulaDisplay = useMemo(() => {
    return formulaToDisplayString(formula.tokens);
  }, [formula.tokens]);

  return (
    <div className="space-y-4">
      <div className="border rounded-md p-2 bg-gray-100 dark:bg-gray-800">
        <div className="flex items-center space-x-2 overflow-x-auto">
          {formula.tokens.map((token) => (
            <Badge
              key={token.id}
              variant="secondary"
              className="flex items-center space-x-1 py-0.5 px-2 rounded-full text-sm font-mono"
            >
              {token.type === 'fixedValue' && editingTokenId === token.id ? (
                <>
                  <Input
                    type="number"
                    className="w-20 text-sm font-mono rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    value={tempFixedValue}
                    onChange={(e) => setTempFixedValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleFixedValueSave();
                      } else if (e.key === 'Escape') {
                        handleFixedValueCancel();
                      }
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleFixedValueSave}
                    className="h-5 w-5 p-0"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                      className="h-4 w-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleFixedValueCancel}
                    className="h-5 w-5 p-0"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="h-4 w-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </Button>
                </>
              ) : (
                <>
                  {token.value}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-5 w-5 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {token.type === 'fixedValue' && (
                        <DropdownMenuItem onClick={() => handleFixedValueEdit(token.id, token.value)}>
                          Edit Value
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => removeToken(token.id)} className="text-red-500">
                        <Delete className="h-4 w-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </Badge>
          ))}
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        {formulaDisplay || <span className="italic">No formula</span>}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-sm">Instruments</Label>
          <Select onValueChange={(value) => handleInstrumentSelect(value as Instrument)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Instrument" />
            </SelectTrigger>
            <SelectContent>
              {instruments.map((instrument) => (
                <SelectItem key={instrument} value={instrument}>
                  {instrument}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm">Operators</Label>
          <Select onValueChange={handleOperatorSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select Operator" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="+">+</SelectItem>
              <SelectItem value="-">-</SelectItem>
              <SelectItem value="*">*</SelectItem>
              <SelectItem value="/">/</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm">Actions</Label>
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddFixedValue}
              disabled={isEditingFixedValue}
            >
              <NumberIcon className="h-4 w-4 mr-2" />
              Fixed Value
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenBracketSelect}
            >
              (
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCloseBracketSelect}
            >
              )
            </Button>
          </div>
        </div>
      </div>

      <div>
        <Label className="text-sm">Quick Percentages</Label>
        <div className="flex space-x-2">
          <Button type="button" variant="outline" size="sm" onClick={() => handlePercentageSelect(5)}>
            5 <Percent className="h-4 w-4 ml-1" />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => handlePercentageSelect(10)}>
            10 <Percent className="h-4 w-4 ml-1" />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => handlePercentageSelect(20)}>
            20 <Percent className="h-4 w-4 ml-1" />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => handlePercentageSelect(50)}>
            50 <Percent className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FormulaBuilder;
