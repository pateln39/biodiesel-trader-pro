
import React, { useState } from 'react';
import { useAddInspector } from '@/hooks/useInspectors';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddInspectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInspectorAdded: (inspectorName: string) => void;
}

const AddInspectorDialog: React.FC<AddInspectorDialogProps> = ({
  open,
  onOpenChange,
  onInspectorAdded
}) => {
  const [inspectorName, setInspectorName] = useState('');
  const addInspectorMutation = useAddInspector();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectorName.trim()) {
      toast({
        title: "Inspector name required",
        description: "Please enter a name for the inspector.",
        variant: "destructive"
      });
      return;
    }

    try {
      await addInspectorMutation.mutateAsync(inspectorName);
      onInspectorAdded(inspectorName);
      setInspectorName('');
      onOpenChange(false);
      toast({
        title: "Inspector added",
        description: `${inspectorName} has been added successfully.`
      });
    } catch (error) {
      console.error("Failed to add inspector:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Inspector</DialogTitle>
          <DialogDescription>
            Enter the name of the new inspector to add to the system.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="inspectorName" className="text-right">
                Name
              </Label>
              <Input
                id="inspectorName"
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
                className="col-span-3"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addInspectorMutation.isPending}>
              {addInspectorMutation.isPending ? "Adding..." : "Add Inspector"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddInspectorDialog;
