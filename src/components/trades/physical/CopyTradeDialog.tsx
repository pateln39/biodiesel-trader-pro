
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Layers } from 'lucide-react';

interface CopyTradeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCopyLeg: () => void;
  onCopyEntireTrade: () => void;
  tradeReference: string;
}

const CopyTradeDialog: React.FC<CopyTradeDialogProps> = ({
  isOpen,
  onClose,
  onCopyLeg,
  onCopyEntireTrade,
  tradeReference,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Copy Trade {tradeReference}</DialogTitle>
          <DialogDescription>
            Choose how you would like to copy this trade.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4">
          <Button 
            onClick={onCopyLeg}
            className="w-full justify-start gap-2 px-4" 
            variant="outline"
          >
            <Copy size={18} />
            <div className="flex flex-col items-start text-left">
              <span className="font-medium">Copy Trade Leg</span>
              <span className="text-xs text-muted-foreground">
                Copy this single leg as a spot trade
              </span>
            </div>
          </Button>
          
          <Button 
            onClick={onCopyEntireTrade}
            className="w-full justify-start gap-2 px-4" 
            variant="outline"
          >
            <Layers size={18} />
            <div className="flex flex-col items-start text-left">
              <span className="font-medium">Copy Entire Trade</span>
              <span className="text-xs text-muted-foreground">
                Copy this trade with all its legs
              </span>
            </div>
          </Button>
        </div>
        
        <DialogFooter className="sm:justify-start">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CopyTradeDialog;
