
import React from 'react';
import { cn } from '@/lib/utils';
import { PRODUCT_COLORS } from '@/hooks/useInventoryState';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getCustomProductColors } from '@/utils/productColorUtils';

interface ProductTokenProps {
  product: string;
  value: number | string;
  className?: string;
  showTooltip?: boolean;
}

const ProductToken: React.FC<ProductTokenProps> = ({
  product,
  value,
  className,
  showTooltip = true
}) => {
  // Get background color based on product, default to gray if product not in mapping
  const colorClass = PRODUCT_COLORS[product] || 'bg-gray-500 text-white';
  
  const tokenContent = (
    <div 
      className={cn(
        "inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium", 
        colorClass,
        className
      )}
    >
      {value}
    </div>
  );
  
  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {tokenContent}
          </TooltipTrigger>
          <TooltipContent>
            <p>{product}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return tokenContent;
};

export default ProductToken;
