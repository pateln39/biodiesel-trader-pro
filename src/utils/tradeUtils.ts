
export const formatProductDisplay = (
  product: string,
  relationshipType: string,
  rightSideProduct?: string
): string => {
  if (!product) return '';
  
  switch (relationshipType) {
    case 'FP':
      return `${product} FP`;
    case 'DIFF':
      if (rightSideProduct) {
        return `${product}/${rightSideProduct}`;
      }
      return `${product}/LSGO`;
    case 'SPREAD':
      if (rightSideProduct) {
        return `${product}/${rightSideProduct}`;
      }
      return product;
    default:
      return product;
  }
};

export const calculateDisplayPrice = (
  relationshipType: string,
  price?: number | null,
  rightSidePrice?: number | null
): string => {
  if (price === undefined || price === null) return '-';
  
  if (relationshipType === 'DIFF' || relationshipType === 'SPREAD') {
    if (rightSidePrice === undefined || rightSidePrice === null) {
      return price.toFixed(2);
    }
    const diff = price - rightSidePrice;
    return diff.toFixed(2);
  }
  
  return price.toFixed(2);
};
