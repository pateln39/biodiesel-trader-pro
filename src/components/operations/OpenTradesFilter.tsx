
import React from 'react';
import { Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface OpenTradesFilterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStatus: 'all' | 'in-process' | 'completed';
  onStatusChange: (status: 'all' | 'in-process' | 'completed') => void;
}

const OpenTradesFilter: React.FC<OpenTradesFilterProps> = ({
  open,
  onOpenChange,
  selectedStatus,
  onStatusChange
}) => {
  const [tempStatus, setTempStatus] = React.useState<'all' | 'in-process' | 'completed'>(selectedStatus);

  React.useEffect(() => {
    setTempStatus(selectedStatus);
  }, [selectedStatus, open]);

  const handleApply = () => {
    onStatusChange(tempStatus);
    onOpenChange(false);
  };

  const handleReset = () => {
    setTempStatus('all');
    onStatusChange('all');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filter Open Trades</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <RadioGroup 
            value={tempStatus} 
            onValueChange={(value) => setTempStatus(value as 'all' | 'in-process' | 'completed')}
          >
            <div className="flex items-center space-x-2 mb-3">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all" className="cursor-pointer">All</Label>
            </div>
            <div className="flex items-center space-x-2 mb-3">
              <RadioGroupItem value="in-process" id="in-process" />
              <Label htmlFor="in-process" className="cursor-pointer">In Process</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="completed" id="completed" />
              <Label htmlFor="completed" className="cursor-pointer">Completed</Label>
            </div>
          </RadioGroup>
        </div>
        <DialogFooter>
          <div className="flex justify-between w-full">
            <Button 
              variant="outline" 
              onClick={handleReset}
              className="flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Reset
            </Button>
            <div className="flex gap-2">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button 
                onClick={handleApply}
                className="flex items-center gap-1"
              >
                <Check className="h-4 w-4" />
                Apply
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OpenTradesFilter;
