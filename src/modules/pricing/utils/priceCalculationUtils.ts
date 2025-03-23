
import { PricingFormula } from '@/modules/trade/types/pricing';

/**
 * Calculate price from a formula using current market data
 */
export function calculatePriceFromFormula(formula: PricingFormula): number {
  if (!formula || !formula.tokens || formula.tokens.length === 0) {
    return 0;
  }

  try {
    // This is a simplified version - in a real application, 
    // you would use actual market data for instruments
    let result = 0;
    let lastOperator = '+';

    for (const token of formula.tokens) {
      let value = 0;

      switch (token.type) {
        case 'instrument':
          // In a real application, you would fetch the actual price for this instrument
          value = getInstrumentPrice(token.value);
          break;
        case 'fixedValue':
          value = parseFloat(token.value);
          break;
        case 'percentage':
          value = parseFloat(token.value) / 100;
          break;
        case 'operator':
          lastOperator = token.value;
          continue;
        default:
          // Ignore other token types
          continue;
      }

      // Apply the last operator
      switch (lastOperator) {
        case '+':
          result += value;
          break;
        case '-':
          result -= value;
          break;
        case '*':
          result *= value;
          break;
        case '/':
          if (value !== 0) {
            result /= value;
          }
          break;
      }
    }

    return parseFloat(result.toFixed(2));
  } catch (error) {
    console.error('Error calculating price from formula:', error);
    return 0;
  }
}

/**
 * Get a price for an instrument (mock implementation)
 */
function getInstrumentPrice(instrument: string): number {
  // In a real application, you would fetch this from an API or database
  const mockPrices: Record<string, number> = {
    'FAME0': 652.5,
    'RME': 598.75,
    'UCOME': 720.0,
    'UCOME-5': 715.25,
    'RME DC': 602.0,
    'CME': 580.5,
    'GASOIL': 520.0,
    'BRENT': 75.8,
  };

  return mockPrices[instrument] || 0;
}
