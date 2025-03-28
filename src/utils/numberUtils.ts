
/**
 * Utility functions for number operations
 */

/**
 * Round a number to the specified number of decimal places
 * while preserving the sign
 * 
 * @param value The number to round
 * @param decimals Number of decimal places
 * @returns Rounded number with preserved sign
 */
export function roundWithSignPreservation(value: number, decimals: number = 0): number {
  const sign = Math.sign(value);
  const absValue = Math.abs(value);
  const factor = Math.pow(10, decimals);
  const rounded = Math.round(absValue * factor) / factor;
  return sign * rounded;
}

/**
 * Apply a sign to a value based on the buy/sell direction and coefficient sign
 * 
 * @param value The absolute value
 * @param isBuy Whether the trade is a buy (true) or sell (false)
 * @param coefficientSign The sign of the coefficient (positive or negative)
 * @returns Value with the correct sign applied
 */
export function applyTradeExposureSign(value: number, isBuy: boolean, coefficientSign: number): number {
  // For buy trades:
  // - Positive coefficient = negative exposure
  // - Negative coefficient = positive exposure
  // For sell trades:
  // - Positive coefficient = positive exposure
  // - Negative coefficient = negative exposure
  const sign = isBuy ? -Math.sign(coefficientSign) : Math.sign(coefficientSign);
  return sign * Math.abs(value);
}
