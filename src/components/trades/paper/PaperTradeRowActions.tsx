
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface PaperTradeRowActionsProps {
  tradeId: string;
  legId?: string;
  isMultiLeg: boolean;
  legReference?: string;
  tradeReference: string;
}

const PaperTradeRowActions: React.FC<PaperTradeRowActionsProps> = ({
  tradeId,
  legId,
  isMultiLeg,
  legReference,
  tradeReference,
}) => {
  const navigate = useNavigate();
  
  // Handle row delete action
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isMultiLeg && legId) {
      console.log(`[PAPER_ROW_ACTIONS] Navigating to leg deletion: ${legId}`);
      navigate(`/trades/paper/delete/${tradeId}/leg/${legId}`);
    } else {
      console.log(`[PAPER_ROW_ACTIONS] Navigating to trade deletion: ${tradeId}`);
      navigate(`/trades/paper/delete/${tradeId}`);
    }
  };
  
  // Handle edit action
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log(`[PAPER_ROW_ACTIONS] Requesting edit for paper trade: ${tradeId}`);
    navigate(`/trades/paper/edit/${tradeId}`);
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Trade
        </DropdownMenuItem>
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

export default PaperTradeRowActions;
