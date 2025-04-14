
import React from 'react';
import { PRODUCT_COLORS } from '@/hooks/useInventoryState';
import ProductToken from './ProductToken';

const ProductLegend: React.FC = () => {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.keys(PRODUCT_COLORS).map(product => (
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
