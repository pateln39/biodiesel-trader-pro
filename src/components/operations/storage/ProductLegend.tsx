
import React from 'react';
import ProductToken from './ProductToken';
import { useReferenceData } from '@/hooks/useReferenceData';
import { Skeleton } from '@/components/ui/skeleton';

const ProductLegend: React.FC = () => {
  const { productOptions, productColors, isLoadingProducts } = useReferenceData();
  
  if (isLoadingProducts) {
    return (
      <div className="flex flex-wrap gap-2 mb-2">
        {Array(5).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-6 w-20" />
        ))}
      </div>
    );
  }
  
  if (!productOptions.length) {
    return <p className="text-sm text-muted-foreground mb-2">No products available</p>;
  }

  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {productOptions.map(product => (
        <ProductToken 
          key={product} 
          product={product} 
          value={product} 
          showTooltip={false}
        />
      ))}
    </div>
  );
};

export default ProductLegend;
