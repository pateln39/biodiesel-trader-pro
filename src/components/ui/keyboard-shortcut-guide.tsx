
import React from 'react';
import { useKeyboardShortcuts } from '@/context/KeyboardShortcutsContext';
import { formatShortcut, groupShortcutsByCategory } from '@/utils/keyboardShortcutUtils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Keyboard } from 'lucide-react';

export const KeyboardShortcutGuide: React.FC = () => {
  const { isShortcutGuideOpen, setShortcutGuideOpen, getShortcuts } = useKeyboardShortcuts();
  const allShortcuts = Object.values(getShortcuts());
  const groupedShortcuts = groupShortcutsByCategory(allShortcuts);
  
  return (
    <Dialog open={isShortcutGuideOpen} onOpenChange={setShortcutGuideOpen}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center">
            <Keyboard className="mr-2 h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Speed up your workflow with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="all" className="w-full mt-4">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="all">All Shortcuts</TabsTrigger>
            {Object.keys(groupedShortcuts).map(category => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="all">
            <ScrollArea className="h-[50vh]">
              <div className="space-y-6">
                {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
                  <div key={category}>
                    <h3 className="text-lg font-semibold mb-2">{category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {shortcuts.map((shortcut, index) => (
                        <div key={index} className="flex justify-between p-2 rounded bg-muted/40">
                          <span className="text-sm">{shortcut.description}</span>
                          <kbd className="px-2 py-1 bg-background border rounded text-xs">
                            {formatShortcut(shortcut)}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          
          {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
            <TabsContent key={category} value={category}>
              <ScrollArea className="h-[50vh]">
                <div className="space-y-2">
                  {shortcuts.map((shortcut, index) => (
                    <div key={index} className="flex justify-between p-2 rounded bg-muted/40">
                      <span className="text-sm">{shortcut.description}</span>
                      <kbd className="px-2 py-1 bg-background border rounded text-xs">
                        {formatShortcut(shortcut)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
        
        <DialogFooter>
          <div className="text-xs text-muted-foreground">
            Press <kbd className="px-1 bg-background border rounded">?</kbd> or <kbd className="px-1 bg-background border rounded">F1</kbd> to open this guide anytime
          </div>
          <Button variant="outline" onClick={() => setShortcutGuideOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
