
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';

interface TableRowActionsProps {
  tradeId: string;
  legId: string;
  isMultiLeg: boolean;
  legReference: string;
  tradeReference: string;
}

const TableRowActions = ({ 
  tradeId, 
  legId, 
  isMultiLeg,
  legReference,
  tradeReference 
}: TableRowActionsProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <Link to={`/trades/edit/${tradeId}`}>
          <DropdownMenuItem>
            <Edit className="mr-2 h-4 w-4" /> Edit Trade
          </DropdownMenuItem>
        </Link>
        
        <DropdownMenuSeparator />
        
        <Link to={`/trades/delete/${tradeId}`}>
          <DropdownMenuItem className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" /> Delete Trade
          </DropdownMenuItem>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TableRowActions;
