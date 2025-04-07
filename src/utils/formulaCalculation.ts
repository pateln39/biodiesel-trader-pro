import { FormulaToken, OperatorType } from '@/types/common';

export function tokenizeFormula(formula: string): FormulaToken[] {
  const tokens: FormulaToken[] = [];
  let currentNumber = '';

  for (let i = 0; i < formula.length; i++) {
    const char = formula[i];

    if (/\d|\./.test(char)) {
      currentNumber += char;
    } else if (char === '+' || char === '-' || char === '*' || char === '/') {
      if (currentNumber !== '') {
        tokens.push({ type: 'number', value: parseFloat(currentNumber) });
        currentNumber = '';
      }
      tokens.push({ type: 'operator', value: char as OperatorType });
    } else if (char === '(' || char === ')') {
      if (currentNumber !== '') {
        tokens.push({ type: 'number', value: parseFloat(currentNumber) });
        currentNumber = '';
      }
      tokens.push({ type: 'parenthesis', value: char });
    } else if (char === ' ') {
      if (currentNumber !== '') {
        tokens.push({ type: 'number', value: parseFloat(currentNumber) });
        currentNumber = '';
      }
    } else {
      if (currentNumber !== '') {
        tokens.push({ type: 'number', value: parseFloat(currentNumber) });
        currentNumber = '';
      }
      tokens.push({ type: 'variable', value: char });
    }
  }

  if (currentNumber !== '') {
    tokens.push({ type: 'number', value: parseFloat(currentNumber) });
  }

  return tokens;
}

export function evaluateFormula(formula: FormulaToken[]): number {
  const getValueAsString = (value: string | number): string => {
    return String(value);
  };

  function processNumericToken(token: FormulaToken): number {
    if (typeof token.value === 'number') {
      return token.value;
    } else if (typeof token.value === 'string') {
      const parsedValue = parseFloat(token.value);
      if (!isNaN(parsedValue)) {
        return parsedValue;
      } else {
        console.error(`Invalid number value: ${token.value}`);
        return 0;
      }
    }
    return Number(token.value);
  }

  let result = 0;
  let currentOperator: OperatorType | null = null;

  for (const token of formula) {
    if (token.type === 'number') {
      const numberValue = processNumericToken(token);

      if (currentOperator === null) {
        result = numberValue;
      } else {
        switch (currentOperator) {
          case '+':
            result += numberValue;
            break;
          case '-':
            result -= numberValue;
            break;
          case '*':
            result *= numberValue;
            break;
          case '/':
            if (numberValue === 0) {
              console.error('Division by zero!');
              return NaN;
            }
            result /= numberValue;
            break;
          default:
            console.error(`Unknown operator: ${currentOperator}`);
            return NaN;
        }
        currentOperator = null;
      }
    } else if (token.type === 'operator') {
      currentOperator = token.value;
    }
  }

  return result;
}
