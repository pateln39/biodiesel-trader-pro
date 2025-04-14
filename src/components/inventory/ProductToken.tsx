
import React from 'react';

export interface ProductTokenProps {
  product: string;
  value: number | string;
  showTooltip?: boolean;
  tooltipText?: string;
  className?: string;
}

export function ProductToken({
  product,
  value,
  showTooltip,
  tooltipText,
  className
}: ProductTokenProps) {
  return (
    <div className={`inline-flex items-center rounded-md bg-muted px-2.5 py-0.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:bg-muted/80 dark:hover:bg-muted/70 ${className || ''}`}>
      {product}: {value} MT
      {showTooltip && tooltipText && (
        <span className="sr-only">{tooltipText}</span>
      )}
    </div>
  );
}
