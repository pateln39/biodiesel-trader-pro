import React, { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from "@/components/ui/scroll-area"

// Use the FormulaToken type directly from pricing to avoid ambiguity
import { FormulaToken } from '@/types/pricing';
import { formulaToDisplayString } from '@/utils/formulaUtils';

interface FormulaBuilderProps {
  instruments: string[];
  formula: {
    tokens: FormulaToken[];
  };
  onAddToken: (token: FormulaToken) => void;
  onRemoveToken: (index: number) => void;
  onUpdateFormulaString: (formulaString: string) => void;
}

const FormulaBuilder: React.FC<FormulaBuilderProps> = ({
  instruments,
  formula,
  onAddToken,
  onRemoveToken,
  onUpdateFormulaString,
}) => {
  const [numberInput, setNumberInput] = useState<string>('');
  const [operator, setOperator] = useState<string>('+');

  useEffect(() => {
    onUpdateFormulaString(formulaToDisplayString(formula.tokens));
  }, [formula.tokens, onUpdateFormulaString]);

  const handleAddNumber = () => {
    if (numberInput) {
      const numberToken: FormulaToken = {
        type: 'number',
        value: numberInput,
      };
      onAddToken(numberToken);
      setNumberInput('');
    }
  };

  const handleAddOperator = () => {
    const operatorToken: FormulaToken = {
      type: 'operator',
      value: operator,
    };
    onAddToken(operatorToken);
  };

  const handleAddPercentage = () => {
    if (numberInput) {
      const percentageToken: FormulaToken = {
        type: 'percentage',
        value: numberInput,
      };
      onAddToken(percentageToken);
      setNumberInput('');
    }
  };

  const handleAddFixedValue = () => {
    if (numberInput) {
      const fixedValueToken: FormulaToken = {
        type: 'fixedValue',
        value: numberInput,
      };
      onAddToken(fixedValueToken);
      setNumberInput('');
    }
  };

  const handleAddOpenParenthesis = () => {
    const openParenthesisToken: FormulaToken = {
      type: 'openBracket',
      value: '(',
    };
    onAddToken(openParenthesisToken);
  };

  const handleAddCloseParenthesis = () => {
    const closeParenthesisToken: FormulaToken = {
      type: 'closeBracket',
      value: ')',
    };
    onAddToken(closeParenthesisToken);
  };

  const renderToken = (token: FormulaToken) => {
    if (token.type === "instrument") {
      return (
        <Badge variant="secondary" className="mr-1">
          {token.value.toString()}
        </Badge>
      );
    } else if (token.type === "number" || token.type === "fixedValue") {
      return (
        <Badge variant="outline" className="mr-1">
          {token.value.toString()}
        </Badge>
      );
    } else if (token.type === "operator") {
      return <span className="mx-1">{token.value}</span>;
    } else if (token.type === "percentage") {
      return (
        <Badge variant="outline" className="mr-1">
          {token.value}%
        </Badge>
      );
    } else if (token.type === "openBracket" || token.type === "closeBracket") {
      return <span className="mx-1">{token.value}</span>;
    }
    return <span className="mx-1">{token.value}</span>;
  };

  const handleTokenClick = (token: FormulaToken) => {
    // Updated type checking to work with the unified FormulaToken type
    if (
      token.type === "instrument" ||
      token.type === "number" ||
      token.type === "fixedValue" ||
      token.type === "percentage" ||
      token.type === "operator" ||
      token.type === "openBracket" ||
      token.type === "closeBracket"
    ) {
      onAddToken(token);
    }
  };

  const formulaDisplay = useMemo(() => {
    return formula.tokens.map((token, index) => (
      <span key={index} className="mr-1">
        {renderToken(token)}
      </span>
    ));
  }, [formula.tokens]);

  return (
    <div className="flex flex-col space-y-4">
      <div>
        <h3 className="text-sm font-medium">Formula</h3>
        <div className="flex items-center flex-wrap mt-2">
          {formulaDisplay}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Input
          type="number"
          placeholder="Enter number"
          value={numberInput}
          onChange={(e) => setNumberInput(e.target.value)}
          className="w-24"
        />
        <Button size="sm" onClick={handleAddNumber}>
          Add Number
        </Button>
        <Button size="sm" onClick={handleAddPercentage}>
          Add %
        </Button>
        <Button size="sm" onClick={handleAddFixedValue}>
          Add Fixed Value
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <select
          value={operator}
          onChange={(e) => setOperator(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option>+</option>
          <option>-</option>
          <option>*</option>
          <option>/</option>
        </select>
        <Button size="sm" onClick={handleAddOperator}>
          Add Operator
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Button size="sm" onClick={handleAddOpenParenthesis}>
          Add (
        </Button>
        <Button size="sm" onClick={handleAddCloseParenthesis}>
          Add )
        </Button>
      </div>

      <div>
        <h3 className="text-sm font-medium">Instruments</h3>
        <ScrollArea className="h-32 w-full rounded-md border">
          <div className="flex flex-wrap p-2">
            {instruments.map((instrument) => (
              <Button
                key={instrument}
                size="sm"
                variant="outline"
                className="mr-1 mb-1"
                onClick={() =>
                  handleTokenClick({ type: 'instrument', value: instrument })
                }
              >
                {instrument}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default FormulaBuilder;
