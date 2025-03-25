
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
