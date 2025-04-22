
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';

interface ShortcutItemProps {
  keys: string[];
  description: string;
}

const ShortcutItem: React.FC<ShortcutItemProps> = ({ keys, description }) => {
  return (
    <div className="flex justify-between py-2 border-b border-border">
      <span>{description}</span>
      <div className="flex gap-1">
        {keys.map((key, index) => (
          <React.Fragment key={index}>
            <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded border border-border">
              {key}
            </kbd>
            {index < keys.length - 1 && <span className="self-center">+</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

interface KeyboardShortcutsHelpProps {
  trigger?: React.ReactNode;
}

const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({ 
  trigger = (
    <Button variant="outline" size="sm" className="gap-2">
      <span>⌨️</span>
      <span>Keyboard Shortcuts</span>
    </Button>
  ) 
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate the application more efficiently.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Global Shortcuts</h3>
            <div className="space-y-1">
              <ShortcutItem keys={["Ctrl", "B"]} description="Toggle sidebar" />
              <ShortcutItem keys={["Alt", "S"]} description="Enter selection mode" />
              <ShortcutItem keys={["Alt", "T"]} description="Add terminal" />
              <ShortcutItem keys={["Alt", "N"]} description="Add tank" />
              <ShortcutItem keys={["Ctrl", "←"]} description="Previous terminal" />
              <ShortcutItem keys={["Ctrl", "→"]} description="Next terminal" />
              <ShortcutItem keys={["Escape"]} description="Exit current mode" />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Selection Mode</h3>
            <div className="space-y-1">
              <ShortcutItem keys={["↑"]} description="Previous row" />
              <ShortcutItem keys={["↓"]} description="Next row" />
              <ShortcutItem keys={["→"]} description="Enter cell navigation" />
              <ShortcutItem keys={["Alt", "↑"]} description="Move row up" />
              <ShortcutItem keys={["Alt", "↓"]} description="Move row down" />
              <ShortcutItem keys={["Enter"]} description="Save row order" />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Cell Navigation</h3>
            <div className="space-y-1">
              <ShortcutItem keys={["←"]} description="Previous cell" />
              <ShortcutItem keys={["→"]} description="Next cell" />
              <ShortcutItem keys={["Enter"]} description="Edit cell (if editable)" />
              <ShortcutItem keys={["Escape"]} description="Back to selection mode" />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Editing Mode</h3>
            <div className="space-y-1">
              <ShortcutItem keys={["Enter"]} description="Save changes" />
              <ShortcutItem keys={["Shift", "Enter"]} description="New line (in comments)" />
              <ShortcutItem keys={["Escape"]} description="Cancel editing" />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcutsHelp;
