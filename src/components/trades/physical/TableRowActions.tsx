
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
import { MoreHorizontal, Edit, Trash2, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { copyPhysicalTrade } from '@/utils/physicalTradeCopyUtils';
import { toast } from 'sonner';

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
  const navigate = useNavigate();

  const handleCopy = async () => {
    toast.info('Copying trade...', {
      description: `Creating a copy of ${tradeReference}`
    });
    
    try {
      const newTradeReference = await copyPhysicalTrade(tradeId);
      toast.success('Trade copied successfully', {
        description: `New trade reference: ${newTradeReference}`
      });
      navigate('/trades', { state: { created: true, tradeReference: newTradeReference } });
    } catch (error) {
      console.error('Error copying trade:', error);
      toast.error('Failed to copy trade', {
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <Link to={`/trades/${tradeId}/edit`}>
          <DropdownMenuItem>
            <Edit className="mr-2 h-4 w-4" /> Edit Trade
          </DropdownMenuItem>
        </Link>
        
        <DropdownMenuItem onClick={handleCopy}>
          <Copy className="mr-2 h-4 w-4" /> Copy Trade
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <Link to={`/trades/${tradeId}/delete`}>
          <DropdownMenuItem className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" /> Delete Trade
          </DropdownMenuItem>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TableRowActions;
