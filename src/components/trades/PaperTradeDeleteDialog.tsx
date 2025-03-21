
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
  // Use useEffect to manage side effects when showDeleteConfirmation changes
  useEffect(() => {
    // No cleanup needed for this effect as we're just tracking a prop
    console.log(`[PAPER DELETE DIALOG] Dialog visible: ${showDeleteConfirmation}, isDeleting: ${isDeleting}`);
  }, [showDeleteConfirmation, isDeleting]);

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

  // Handler for dialog state changes to ensure proper cancel behavior
  const handleOpenChange = (isOpen: boolean) => {
    console.log(`[PAPER DELETE DIALOG] Dialog open state change: ${isOpen}, isDeleting: ${isDeleting}`);
    if (!isOpen && !isDeleting) {
      // Only invoke cancel if we're closing and not in the process of deleting
      onCancelDelete();
    }
    // Always inform parent of open state changes
    onOpenChange(isOpen);
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
            <AlertDialogCancel onClick={onCancelDelete} disabled={isDeleting}>Cancel</AlertDialogCancel>
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
