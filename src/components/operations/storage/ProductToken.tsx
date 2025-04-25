
import React from 'react';
import { cn } from '@/lib/utils';
import { getProductColor } from '@/utils/productColors';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProductTokenProps {
  product: string;
  value?: number | string;
  className?: string;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const ProductToken: React.FC<ProductTokenProps> = ({
  product,
  value,
  className,
  showTooltip = true,
  size = 'md'
}) => {
  const colorClass = getProductColor(product);
  
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-0.5 text-xs',
    lg: 'px-2.5 py-1 text-sm'
  };
  
  const tokenContent = (
    <div 
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium", 
        sizeClasses[size],
        colorClass,
        className
      )}
    >
      {value !== undefined ? value : product}
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
