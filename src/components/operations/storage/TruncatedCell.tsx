
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TruncatedCellProps {
  text: string | null | undefined;
  width: number;
  className?: string;
}

export const TruncatedCell = ({ text, width, className = "" }: TruncatedCellProps) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <div 
          className={cn(
            "truncate max-w-full", 
            className
          )} 
          style={{ width: `${width}px` }}
        >
          {text || '-'}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-xs break-words">{text || '-'}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
