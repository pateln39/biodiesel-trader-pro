
export const formatProductDisplay = (
  product: string, 
  relationshipType: string,
  oppositeProduct?: string | null
): string => {
  if (!product) return '';
  
  if (relationshipType === 'FP') {
    return `${product} FP`;
  }
  
  if (relationshipType === 'DIFF' && oppositeProduct) {
    return `${product}/${oppositeProduct} DIFF`;
  }
  
  if (relationshipType === 'SPREAD' && oppositeProduct) {
    return `${product}/${oppositeProduct}`;
  }
  
  return product;
};
