
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';

interface EditableTotalHoursFieldProps {
  calculatedValue: number;
  label: string;
  onSave: (manualValue: number, comment: string) => void;
  isOverridden?: boolean;
}

export function EditableTotalHoursField({
  calculatedValue,
  label,
  onSave,
  isOverridden = false
}: EditableTotalHoursFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [manualValue, setManualValue] = useState<string>(calculatedValue.toString());
  const [comment, setComment] = useState('');

  const handleSave = () => {
    const numericValue = parseFloat(manualValue);
    if (isNaN(numericValue)) {
      toast.error("Please enter a valid number");
      return;
    }
    if (!comment.trim()) {
      toast.error("Please provide a comment explaining the change");
      return;
    }
    onSave(numericValue, comment);
    setIsEditing(false);
    setComment('');
    toast.success("Total hours updated successfully");
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-1">
        <Label>{label}</Label>
        {isOverridden && (
          <span className="text-xs text-orange-500">(Manually edited)</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={calculatedValue}
          className="font-medium bg-muted text-foreground"
          readOnly
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleEditClick}
          className="h-9 w-9"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>

      <Dialog 
        open={isEditing} 
        onOpenChange={(open) => {
          if (!open) {
            setManualValue(calculatedValue.toString());
            setComment('');
          }
          setIsEditing(open);
        }}
      >
        <DialogContent 
          onPointerDownOutside={(e) => e.preventDefault()}
          onClick={(e) => e.stopPropagation()}
          className="z-[100]"
        >
          <DialogHeader>
            <DialogTitle>Edit Total Hours</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current calculated value: {calculatedValue}</Label>
              <Input
                type="number"
                value={manualValue}
                onChange={(e) => setManualValue(e.target.value)}
                placeholder="Enter new value"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment" className="text-orange-500">
                * Please explain why you're modifying this value
              </Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Enter reason for change"
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
