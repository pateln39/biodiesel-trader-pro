
import React from 'react';
import { cn } from '@/lib/utils';
import { PRODUCT_COLORS } from '@/hooks/useInventoryState';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProductTokenProps {
  product: string;
  value: number | string;
  className?: string;
  showTooltip?: boolean;
  colorClass?: string;
}

const ProductToken: React.FC<ProductTokenProps> = ({
  product,
  value,
  className,
  showTooltip = true,
  colorClass
}) => {
  // Get background color based on product, default to gray if product not in mapping
  // First try to use the directly provided colorClass prop (from database)
  // Then fall back to PRODUCT_COLORS (for backward compatibility)
  const tokenColorClass = colorClass || PRODUCT_COLORS[product] || 'bg-gray-500 text-white';
  
  const tokenContent = (
    <div 
      className={cn(
        "inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium", 
        tokenColorClass,
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
