
import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';

interface PaperTradeDeleteDialogProps {
  showDeleteConfirmation: boolean;
  deleteMode: 'trade' | 'leg';
  deleteItemDetails: {
    id: string;
    reference: string;
    legNumber?: number;
    parentTradeId?: string;
  };
  isDeleting: boolean;
  deletionProgress: number;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onOpenChange: (open: boolean) => void;
}

const PaperTradeDeleteDialog: React.FC<PaperTradeDeleteDialogProps> = ({
  showDeleteConfirmation,
  deleteMode,
  deleteItemDetails,
  isDeleting,
  deletionProgress,
  onConfirmDelete,
  onCancelDelete,
  onOpenChange
}) => {
  // Log important state changes for debugging
  useEffect(() => {
    console.log(`[PAPER DELETE DIALOG] Dialog visible: ${showDeleteConfirmation}, isDeleting: ${isDeleting}`);
  }, [showDeleteConfirmation, isDeleting]);

  // Handle Cancel button click in a safe way
  const handleCancel = (e: React.MouseEvent) => {
    // Stop propagation to prevent multiple handlers firing
    e.preventDefault();
    e.stopPropagation();
    console.log("[PAPER DELETE DIALOG] Cancel button clicked directly");
    onCancelDelete();
  };

  const getDeleteTitle = () => {
    return deleteMode === 'trade' 
      ? `Delete Paper Trade ${deleteItemDetails.reference}?`
      : `Delete Leg ${deleteItemDetails.reference}${deleteItemDetails.legNumber ? `-${deleteItemDetails.legNumber}` : ''}?`;
  };
  
  const getDeleteDescription = () => {
    return deleteMode === 'trade'
      ? `This will permanently delete the paper trade ${deleteItemDetails.reference} and all its legs from the database.`
      : `This will permanently delete the leg ${deleteItemDetails.reference}${deleteItemDetails.legNumber ? `-${deleteItemDetails.legNumber}` : ''} from the database.`;
  };
  
  // Separate handler for dialog open state changes to ensure proper behavior
  const handleOpenChange = (open: boolean) => {
    console.log(`[PAPER DELETE DIALOG] Dialog open state change: ${open}, isDeleting: ${isDeleting}`);
    
    // If dialog is closing and we're not in the process of deleting, consider it a cancel
    if (!open && !isDeleting) {
      console.log("[PAPER DELETE DIALOG] Dialog dismissed - treating as cancel");
      onCancelDelete();
    }
    
    // Always inform parent of state changes
    onOpenChange(open);
  };

  return (
    <>
      {isDeleting && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-1">
            Deleting {deleteMode === 'trade' ? 'paper trade' : 'paper trade leg'}... Please wait
          </p>
          <Progress value={deletionProgress} className="h-2" />
        </div>
      )}
    
      <AlertDialog 
        open={showDeleteConfirmation} 
        onOpenChange={handleOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{getDeleteTitle()}</AlertDialogTitle>
            <AlertDialogDescription>
              {getDeleteDescription()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel} disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={onConfirmDelete} 
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>
              ) : (
                <>Delete</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PaperTradeDeleteDialog;
