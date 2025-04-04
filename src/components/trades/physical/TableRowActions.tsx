
import React from 'react';
import { Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface TableRowActionsProps {
  tradeId: string;
  legId?: string;
  isMultiLeg: boolean;
  legReference?: string;
  tradeReference: string;
}

const TableRowActions: React.FC<TableRowActionsProps> = ({
  tradeId,
  legId,
  isMultiLeg,
  legReference,
  tradeReference,
}) => {
  
  // Handle row delete action
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isMultiLeg && legId) {
      console.log(`[ROW_ACTIONS] Navigating to leg deletion: ${legId}`);
      navigate(`/trades/delete/${tradeId}/leg/${legId}`);
    } else {
      console.log(`[ROW_ACTIONS] Navigating to trade deletion: ${tradeId}`);
      navigate(`/trades/delete/${tradeId}`);
    }
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isMultiLeg && legId && legReference ? (
          <DropdownMenuItem 
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Trade Leg
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem 
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Trade
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TableRowActions;
