
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, RotateCcw } from "lucide-react";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export interface EditableTotalHoursFieldProps {
  calculatedValue: number;
  label?: string;
  onSave: (manualValue: number | null, comment: string) => void;
  isOverridden?: boolean;
  overrideValue?: number | null;
  comment?: string;
  onCommentToggle?: () => void;
}

export function EditableTotalHoursField({
  calculatedValue,
  label = "Total Hours",
  onSave,
  isOverridden = false,
  overrideValue = null,
  comment = '',
  onCommentToggle
}: EditableTotalHoursFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [manualValue, setManualValue] = useState<string>(overrideValue !== null ? overrideValue.toString() : calculatedValue.toString());
  const [editComment, setEditComment] = useState(comment || '');

  const handleSave = () => {
    const numericValue = parseFloat(manualValue);
    if (isNaN(numericValue)) {
      toast.error("Please enter a valid number");
      return;
    }
    if (!editComment.trim()) {
      toast.error("Please provide a comment explaining the change");
      return;
    }
    onSave(numericValue, editComment);
    setIsEditing(false);
    setEditComment('');
    toast.success("Total hours updated successfully");
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSave(null, "Reset to calculated value");
    setIsResetDialogOpen(false);
    setManualValue(calculatedValue.toString());
    toast.success("Reset to calculated value");
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-1">
        <Label>{label}</Label>
        {isOverridden && (
          <span className="text-xs text-orange-500">(Manual)</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={overrideValue !== null ? overrideValue : calculatedValue}
          className="font-medium bg-muted text-foreground"
          readOnly
        />
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEditClick}
            className="h-9 w-9"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          {isOverridden && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsResetDialogOpen(true);
              }}
              className="h-9 w-9"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Dialog 
        open={isEditing} 
        onOpenChange={(open) => {
          if (!open) {
            setManualValue(overrideValue !== null ? overrideValue.toString() : calculatedValue.toString());
            setEditComment(comment);
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
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
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

      <AlertDialog 
        open={isResetDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setManualValue(overrideValue !== null ? overrideValue.toString() : calculatedValue.toString());
          }
          setIsResetDialogOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to Calculated Value</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the manual override and return to using the automatically calculated value. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
