
import React from 'react';
import { Movement } from '@/types';
import { useTerminals } from '@/hooks/useTerminals';
import { CalendarIcon, Factory, Warehouse, Plus, Trash2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useTerminalAssignments, TerminalAssignment } from '@/hooks/useTerminalAssignments';

interface StorageFormDialogProps {
  movement: Movement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StorageFormDialog({ movement, open, onOpenChange }: StorageFormDialogProps) {
  const { terminals } = useTerminals();
  const { assignments: existingAssignments, updateAssignments, isLoading } = useTerminalAssignments(movement.id);
  const [assignments, setAssignments] = React.useState<TerminalAssignment[]>([]);

  // Initialize assignments with existing data when dialog opens
  React.useEffect(() => {
    if (open && existingAssignments.length > 0) {
      setAssignments(existingAssignments);
    } else if (open) {
      setAssignments([{
        terminal_id: '',
        quantity_mt: 0,
        assignment_date: new Date(),
        comments: '',
      }]);
    }
  }, [open, existingAssignments]);

  const totalAssigned = assignments.reduce((sum, a) => sum + (a.quantity_mt || 0), 0);
  const remainingQuantity = (movement.actualQuantity || 0) - totalAssigned;

  const handleAddAssignment = () => {
    setAssignments([...assignments, {
      terminal_id: '',
      quantity_mt: 0,
      assignment_date: new Date(),
      comments: '',
    }]);
  };

  const handleRemoveAssignment = (index: number) => {
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  const updateAssignment = (index: number, field: keyof TerminalAssignment, value: any) => {
    const newAssignments = [...assignments];
    newAssignments[index] = { ...newAssignments[index], [field]: value };
    setAssignments(newAssignments);
  };

  const handleSave = () => {
    if (totalAssigned > (movement.actualQuantity || 0)) {
      toast.error('Total assigned quantity exceeds actual quantity');
      return;
    }

    const invalidAssignments = assignments.some(a => 
      !a.terminal_id || !a.quantity_mt || !a.assignment_date
    );

    if (invalidAssignments) {
      toast.error('Please fill in all fields for each terminal assignment');
      return;
    }

    updateAssignments(assignments);
    onOpenChange(false);
  };

  const handleClose = () => {
    if (!existingAssignments.length) {
      setAssignments([{
        terminal_id: '',
        quantity_mt: 0,
        assignment_date: new Date(),
        comments: '',
      }]);
    }
    onOpenChange(false);
  };

  if (isLoading) {
    return null; // Or show a loading state
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            Storage Assignment
          </DialogTitle>
          <DialogDescription>
            Assign movement {movement.referenceNumber} to terminals
            <div className="mt-2 text-sm">
              <span className="font-semibold">Actual Quantity:</span> {movement.actualQuantity} MT
              <br />
              <span className="font-semibold">Remaining:</span> {remainingQuantity} MT
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-8">
          {assignments.map((assignment, index) => (
            <div key={index} className="space-y-4 border-b pb-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Terminal Assignment {index + 1}</h4>
                {index > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveAssignment(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>

              <div className="grid gap-4">
                <div>
                  <label className="text-sm">Terminal</label>
                  <Select
                    value={assignment.terminal_id}
                    onValueChange={(value) => updateAssignment(index, 'terminal_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select terminal" />
                    </SelectTrigger>
                    <SelectContent>
                      {terminals.map((terminal) => (
                        <SelectItem key={terminal.id} value={terminal.id}>
                          {terminal.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm">Quantity (MT)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={assignment.quantity_mt || ''}
                    onChange={(e) => updateAssignment(index, 'quantity_mt', parseFloat(e.target.value) || 0)}
                    placeholder="Enter quantity in MT"
                  />
                </div>

                <div>
                  <label className="text-sm">Movement Date</label>
                  <DatePicker
                    date={assignment.assignment_date}
                    setDate={(date) => updateAssignment(index, 'assignment_date', date)}
                    placeholder="Pick a date"
                  />
                </div>

                <div>
                  <label className="text-sm flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    Comments
                  </label>
                  <Textarea
                    placeholder="Add comments about this assignment..."
                    value={assignment.comments || ''}
                    onChange={(e) => updateAssignment(index, 'comments', e.target.value)}
                    className="resize-y min-h-[80px]"
                  />
                </div>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={handleAddAssignment}
            disabled={totalAssigned >= (movement.actualQuantity || 0)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Terminal Assignment
          </Button>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={totalAssigned === 0}>
            <Factory className="mr-2 h-4 w-4" />
            {existingAssignments.length ? 'Update' : 'Save'} Assignments
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
