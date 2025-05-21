
import React from 'react';
import ProductToken from './ProductToken';
import { useReferenceData } from '@/hooks/useReferenceData';

const ProductLegend: React.FC = () => {
  const { productData } = useReferenceData();
  
  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {productData.map(product => (
        <ProductToken 
          key={product.name} 
          product={product.name} 
          value={product.name} 
          colorClass={product.color_class}
          showTooltip={false}
        />
      ))}
    </div>
  );
};

export default ProductLegend;
