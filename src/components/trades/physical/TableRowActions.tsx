
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Edit, Trash2 } from 'lucide-react';
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
  isDeleting: boolean;
  deletingId: string;
  isProcessing: boolean;
  onEdit: (tradeId: string) => void;
  onDeleteTrade: (tradeId: string, reference: string) => void;
  onDeleteLeg: (legId: string, legReference: string, parentId: string) => void;
}

const TableRowActions: React.FC<TableRowActionsProps> = ({
  tradeId,
  legId,
  isMultiLeg,
  legReference,
  tradeReference,
  isDeleting,
  deletingId,
  isProcessing,
  onEdit,
  onDeleteTrade,
  onDeleteLeg,
}) => {
  const navigate = useNavigate();
  
  // Determine if this row is being deleted
  const isThisRowDeleting = isDeleting && deletingId === (isMultiLeg && legId ? legId : tradeId);
  
  // Determine if the dropdown should be disabled
  const isDropdownDisabled = isDeleting || isProcessing;
  
  // Handle row delete action with proper precautions
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isDropdownDisabled) {
      console.log('[ROW_ACTIONS] Delete action ignored - operations in progress');
      return;
    }
    
    if (isMultiLeg && legId && legReference) {
      console.log(`[ROW_ACTIONS] Requesting leg deletion: ${legId}`);
      onDeleteLeg(legId, legReference, tradeId);
    } else {
      console.log(`[ROW_ACTIONS] Requesting trade deletion: ${tradeId}`);
      onDeleteTrade(tradeId, tradeReference);
    }
  };
  
  // Handle edit action with proper precautions
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isDropdownDisabled) {
      console.log('[ROW_ACTIONS] Edit action ignored - operations in progress');
      return;
    }
    
    console.log(`[ROW_ACTIONS] Requesting edit for trade: ${tradeId}`);
    navigate(`/trades/edit/${tradeId}`);
  };
  
  // Handle view details
  const handleViewDetails = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isDropdownDisabled) {
      console.log('[ROW_ACTIONS] View details ignored - operations in progress');
      return;
    }
    
    navigate(`/trades/${tradeId}`);
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={isDropdownDisabled}>
          {isThisRowDeleting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Deleting...
            </>
          ) : (
            'Actions'
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleEdit} disabled={isDropdownDisabled}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Trade
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleViewDetails} disabled={isDropdownDisabled}>
          View Details
        </DropdownMenuItem>
        {isMultiLeg && legId && legReference ? (
          <DropdownMenuItem 
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
            disabled={isDropdownDisabled}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Trade Leg
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem 
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
            disabled={isDropdownDisabled}
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
