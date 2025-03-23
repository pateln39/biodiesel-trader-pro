
import React from 'react';
import { Link } from 'react-router-dom';
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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={isDeleting || isProcessing}>
          {isDeleting && deletingId === (isMultiLeg ? legId : tradeId) ? (
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
        <DropdownMenuItem onClick={() => onEdit(tradeId)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Trade
        </DropdownMenuItem>
        <Link to={`/trades/${tradeId}`}>
          <DropdownMenuItem>View Details</DropdownMenuItem>
        </Link>
        {isMultiLeg && legId && legReference ? (
          <DropdownMenuItem 
            onClick={() => onDeleteLeg(legId, legReference, tradeId)}
            className="text-destructive focus:text-destructive"
            disabled={isDeleting || isProcessing}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Trade Leg
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem 
            onClick={() => onDeleteTrade(tradeId, tradeReference)}
            className="text-destructive focus:text-destructive"
            disabled={isDeleting || isProcessing}
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
