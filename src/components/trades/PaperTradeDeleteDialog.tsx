
import React from 'react';
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
  deleteItemDetails: {
    id: string;
    reference: string;
  };
  isDeleting: boolean;
  deletionProgress: number;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onOpenChange: (open: boolean) => void;
}

const PaperTradeDeleteDialog: React.FC<PaperTradeDeleteDialogProps> = ({
  showDeleteConfirmation,
  deleteItemDetails,
  isDeleting,
  deletionProgress,
  onConfirmDelete,
  onCancelDelete,
  onOpenChange
}) => {
  return (
    <>
      {isDeleting && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-1">
            Deleting paper trade... Please wait
          </p>
          <Progress value={deletionProgress} className="h-2" />
        </div>
      )}
    
      <AlertDialog open={showDeleteConfirmation} onOpenChange={(isOpen) => {
        if (!isOpen && !isDeleting) {
          onCancelDelete();
        }
        onOpenChange(isOpen);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the paper trade {deleteItemDetails.reference} from the database.
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
