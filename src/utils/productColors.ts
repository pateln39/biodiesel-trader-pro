
export const PRODUCT_COLORS: Record<string, string> = {
  'FAME0': 'bg-purple-500 text-white',
  'RME': 'bg-blue-500 text-white',
  'UCOME': 'bg-green-500 text-white',
  'UCOME-5': 'bg-emerald-500 text-white',
  'RME DC': 'bg-indigo-500 text-white',
  'LSGO': 'bg-amber-500 text-white',
  'HVO': 'bg-rose-500 text-white',
  // Add fallback color for unknown products
  'default': 'bg-gray-500 text-white'
};

export const getProductColor = (product: string): string => {
  return PRODUCT_COLORS[product] || PRODUCT_COLORS.default;
};
