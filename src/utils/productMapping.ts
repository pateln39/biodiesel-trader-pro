
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
