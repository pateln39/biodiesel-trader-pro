
/**
 * Generate a leg reference for a trade
 * Format: TR-XXXXXXXX-L1, TR-XXXXXXXX-L2, etc.
 */
export function generateLegReference(
  tradeReference: string,
  legIndex: number
): string {
  return `${tradeReference}-L${legIndex + 1}`;
}

/**
 * Generate a new trade reference
 * Format: TR-YYYYMMDD-XXXX where XXXX is a random 4-digit number
 */
export function generateTradeReference(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `TR-${year}${month}${day}-${random}`;
}

/**
 * Format a trade quantity with unit for display
 */
export function formatQuantity(quantity: number | undefined, unit: string | undefined): string {
  if (quantity === undefined) return '0';
  const formattedQty = Number(quantity).toLocaleString('en-US', { 
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  });
  return `${formattedQty} ${unit || 'MT'}`;
}

/**
 * Format a price for display
 */
export function formatPrice(price: number | undefined, currency: string = '€'): string {
  if (price === undefined) return '-';
  return `${currency}${Number(price).toLocaleString('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  })}`;
}
