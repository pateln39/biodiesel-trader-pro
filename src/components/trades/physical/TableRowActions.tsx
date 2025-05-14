
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2, Copy } from 'lucide-react';
import { copyTradeLegAsSpot, copyEntireTrade, isTermTrade } from '@/utils/tradeUtils';
import { toast } from 'sonner';
import CopyTradeDialog from './CopyTradeDialog';

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
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleCopyClick = async () => {
    try {
      // If term trade, show dialog with options
      if (isMultiLeg) {
        setShowCopyDialog(true);
      } else {
        // For spot trades, directly copy the leg as a new spot trade
        setIsLoading(true);
        const newTradeRef = await copyTradeLegAsSpot(tradeId, legId);
        setIsLoading(false);
        
        if (newTradeRef) {
          toast.success('Trade copied successfully', {
            description: `New trade reference: ${newTradeRef}`
          });
          navigate('/trades'); // Redirect to trades list
        }
      }
    } catch (error) {
      setIsLoading(false);
      toast.error('Failed to copy trade', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  const handleCopyLeg = async () => {
    try {
      setIsLoading(true);
      setShowCopyDialog(false);
      
      const newTradeRef = await copyTradeLegAsSpot(tradeId, legId);
      setIsLoading(false);
      
      if (newTradeRef) {
        toast.success('Trade leg copied as spot trade', {
          description: `New trade reference: ${newTradeRef}`
        });
        navigate('/trades'); // Redirect to trades list
      }
    } catch (error) {
      setIsLoading(false);
      toast.error('Failed to copy trade leg', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  const handleCopyEntireTrade = async () => {
    try {
      setIsLoading(true);
      setShowCopyDialog(false);
      
      const newTradeRef = await copyEntireTrade(tradeId);
      setIsLoading(false);
      
      if (newTradeRef) {
        toast.success('Entire trade copied successfully', {
          description: `New trade reference: ${newTradeRef}`
        });
        navigate('/trades'); // Redirect to trades list
      }
    } catch (error) {
      setIsLoading(false);
      toast.error('Failed to copy entire trade', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
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
          
          <DropdownMenuItem onClick={handleCopyClick}>
            <Copy className="mr-2 h-4 w-4" /> Copy Trade Template
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <Link to={`/trades/delete/${tradeId}`}>
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Delete Trade
            </DropdownMenuItem>
          </Link>
        </DropdownMenuContent>
      </DropdownMenu>

      <CopyTradeDialog
        isOpen={showCopyDialog}
        onClose={() => setShowCopyDialog(false)}
        onCopyLeg={handleCopyLeg}
        onCopyEntireTrade={handleCopyEntireTrade}
        tradeReference={tradeReference}
      />
    </>
  );
};

export default TableRowActions;
