
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from "@/components/ui/checkbox";
import { formatExposureTableProduct } from '@/utils/productMapping';

interface ProductFilterSelectionProps {
  products: string[];
  selectedProducts: string[];
  toggleProductSelection: (product: string) => void;
}

const ProductFilterSelection: React.FC<ProductFilterSelectionProps> = ({ 
  products, 
  selectedProducts, 
  toggleProductSelection 
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-md font-medium mb-3">Products</h3>
        <div className="flex flex-wrap gap-3">
          {products.map(product => (
            <div key={product} className="flex items-center space-x-2 bg-gray-50 rounded-md p-2">
              <Checkbox 
                id={`product-${product}`}
                checked={selectedProducts.length === 0 || selectedProducts.includes(product)}
                onCheckedChange={() => toggleProductSelection(product)}
              />
              <label
                htmlFor={`product-${product}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {formatExposureTableProduct(product)}
              </label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductFilterSelection;
