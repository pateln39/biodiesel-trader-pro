
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useTerminalAssignments, TerminalAssignment } from '@/hooks/useTerminalAssignments';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface StorageFormDialogProps {
  movement: Movement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditMode?: boolean;
}

export function StorageFormDialog({ movement, open, onOpenChange, isEditMode = false }: StorageFormDialogProps) {
  const { terminals } = useTerminals();
  const { 
    assignments: existingAssignments, 
    updateAssignments, 
    isLoading,
    deleteAssignment 
  } = useTerminalAssignments(movement.id);
  const [assignments, setAssignments] = React.useState<TerminalAssignment[]>([]);
  const [assignmentToDelete, setAssignmentToDelete] = React.useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  React.useEffect(() => {
    if (open && existingAssignments.length > 0) {
      setAssignments(existingAssignments);
    } else if (open) {
      setAssignments([]);
    }
  }, [open, existingAssignments]);

  // Determine the actual quantity based on where the dialog was opened from
  const actualQuantity = movement.actualQuantity || movement.assignment_quantity || 0;
  
  // Calculate total assigned and remaining quantities
  const totalAssigned = assignments.reduce((sum, a) => sum + Math.abs(a.quantity_mt || 0), 0);
  const remainingQuantity = Math.abs(actualQuantity) - totalAssigned;

  const handleAddAssignment = () => {
    setAssignments([...assignments, {
      terminal_id: '',
      quantity_mt: 0,
      assignment_date: new Date(),
      comments: ''
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
    if (totalAssigned > Math.abs(actualQuantity)) {
      toast.error('Total assigned quantity exceeds actual quantity');
      return;
    }

    const invalidAssignments = assignments.some(a => 
      !a.terminal_id || !a.quantity_mt || !a.assignment_date
    );

    if (invalidAssignments && assignments.length > 0) {
      toast.error('Please fill in all fields for each terminal assignment');
      return;
    }

    const processedAssignments = assignments.map(assignment => ({
      ...assignment,
      quantity_mt: movement.buySell === 'sell' || movement.buy_sell === 'sell'
        ? -Math.abs(assignment.quantity_mt || 0)
        : Math.abs(assignment.quantity_mt || 0)
    }));

    updateAssignments(processedAssignments);
    onOpenChange(false);
  };

  const handleClose = () => {
    if (!existingAssignments.length) {
      setAssignments([]);
    }
    onOpenChange(false);
  };

  const handleOpenDeleteDialog = (assignmentId: string) => {
    setAssignmentToDelete(assignmentId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteAssignment = async () => {
    if (!assignmentToDelete) return;
    
    try {
      await deleteAssignment(assignmentToDelete);
      toast.success('Assignment deleted successfully');
      
      // Remove the assignment from local state
      setAssignments(assignments.filter(a => a.id !== assignmentToDelete));
      
      setIsDeleteDialogOpen(false);
      setAssignmentToDelete(null);
      
      // If there are no more assignments, close the dialog
      if (assignments.length <= 1) {
        onOpenChange(false);
      }
    } catch (error) {
      toast.error('Failed to delete assignment');
      console.error('Delete assignment error:', error);
    }
  };

  if (isLoading) {
    return null;
  }

  const buySellType = movement.buySell || movement.buy_sell;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5" />
              {isEditMode ? "Edit Storage Assignment" : "Storage Assignment"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode ? `Edit assignments for movement ${movement.referenceNumber || movement.reference_number}` : 
                `Assign movement ${movement.referenceNumber || movement.reference_number} to terminals`}
              <div className="mt-2 text-sm">
                <span className="font-semibold">Actual Quantity:</span> {actualQuantity} MT
                <br />
                <span className="font-semibold">Remaining:</span> {remainingQuantity} MT
                {(buySellType === 'sell') && (
                  <>
                    <br />
                    <span className="text-xs text-muted-foreground italic">
                      For sell movements, enter negative quantities (e.g., -300)
                    </span>
                  </>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-grow overflow-y-auto pr-4">
            <div className="space-y-8 py-8">
              {assignments.map((assignment, index) => (
                <div key={index} className="space-y-4 border-b pb-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Terminal Assignment {index + 1}</h4>
                    <div className="flex gap-2">
                      {assignment.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDeleteDialog(assignment.id as string)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                      {!isEditMode && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveAssignment(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
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

              {!isEditMode && (
                <Button
                  variant="outline"
                  onClick={handleAddAssignment}
                  disabled={totalAssigned >= Math.abs(actualQuantity)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Terminal Assignment
                </Button>
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button onClick={handleSave}>
              <Factory className="mr-2 h-4 w-4" />
              {existingAssignments.length ? 'Update' : 'Save'} Assignments
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Terminal Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this terminal assignment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAssignment} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
