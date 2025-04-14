
import React from 'react';
import { PRODUCT_COLORS } from '@/hooks/useInventoryState';
import ProductToken from './ProductToken';

interface ProductLegendProps {
  inline?: boolean;
}

const ProductLegend: React.FC<ProductLegendProps> = ({ inline = false }) => {
  if (inline) {
    // Return null for inline mode as we'll handle it directly in the table
    return null;
  }
  
  return (
    <div className="flex flex-wrap gap-2 mb-2">
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
