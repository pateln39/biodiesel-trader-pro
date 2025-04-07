
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface MovementsFilterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStatuses: string[];
  onStatusesChange: (statuses: string[]) => void;
}

const MovementsFilter: React.FC<MovementsFilterProps> = ({
  open,
  onOpenChange,
  selectedStatuses,
  onStatusesChange
}) => {
  const [tempStatuses, setTempStatuses] = React.useState<string[]>(selectedStatuses);

  React.useEffect(() => {
    setTempStatuses(selectedStatuses);
  }, [selectedStatuses, open]);

  const handleStatusToggle = (status: string) => {
    if (tempStatuses.includes(status)) {
      setTempStatuses(tempStatuses.filter(s => s !== status));
    } else {
      setTempStatuses([...tempStatuses, status]);
    }
  };

  const handleApply = () => {
    onStatusesChange(tempStatuses);
    onOpenChange(false);
  };

  const handleReset = () => {
    setTempStatuses([]);
    onStatusesChange([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filter Movements</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="scheduled" 
                checked={tempStatuses.includes('scheduled')}
                onCheckedChange={() => handleStatusToggle('scheduled')}
              />
              <Label htmlFor="scheduled" className="cursor-pointer">Scheduled</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="in-progress" 
                checked={tempStatuses.includes('in progress')}
                onCheckedChange={() => handleStatusToggle('in progress')}
              />
              <Label htmlFor="in-progress" className="cursor-pointer">In Progress</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="completed" 
                checked={tempStatuses.includes('completed')}
                onCheckedChange={() => handleStatusToggle('completed')}
              />
              <Label htmlFor="completed" className="cursor-pointer">Completed</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="cancelled" 
                checked={tempStatuses.includes('cancelled')}
                onCheckedChange={() => handleStatusToggle('cancelled')}
              />
              <Label htmlFor="cancelled" className="cursor-pointer">Cancelled</Label>
            </div>
          </div>
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

export default MovementsFilter;
