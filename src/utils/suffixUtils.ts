
/**
 * Generates Excel-style column suffixes for leg references
 * Examples: a, b, c, ..., z, aa, ab, ac, ..., az, ba, bb, ..., zz, aaa, aab, etc.
 */
export const generateLegSuffix = (index: number): string => {
  let suffix = '';
  let num = index;
  
  do {
    suffix = String.fromCharCode(97 + (num % 26)) + suffix;
    num = Math.floor(num / 26) - 1;
  } while (num >= 0);
  
  return suffix;
};

/**
 * Test function to verify suffix generation works correctly
 */
export const testSuffixGeneration = (): void => {
  console.log('Testing suffix generation:');
  for (let i = 0; i < 30; i++) {
    console.log(`Index ${i}: ${generateLegSuffix(i)}`);
  }
  // Should output: a, b, c, ..., z, aa, ab, ac, ad
};
