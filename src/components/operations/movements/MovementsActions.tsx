
import React from 'react';
import { Download, Filter, Rows, Group, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MovementsActionsProps {
  isExporting: boolean;
  selectedMovementIds: string[];
  onExport: () => Promise<void>;
  onOpenFilter: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onGroupSelected: () => void;
  isGrouping: boolean;
  activeFilterCount: number;
}

const MovementsActions: React.FC<MovementsActionsProps> = ({
  isExporting,
  selectedMovementIds,
  onExport,
  onOpenFilter,
  onSelectAll,
  onClearSelection,
  onGroupSelected,
  isGrouping,
  activeFilterCount
}) => {
  return (
    <div className="flex gap-2">
      {selectedMovementIds.length > 0 ? (
        <>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onSelectAll}
            disabled={isGrouping}
          >
            <Rows className="mr-2 h-4 w-4" /> Select All
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClearSelection}
            disabled={isGrouping}
          >
            <X className="mr-2 h-4 w-4" /> Clear Selection ({selectedMovementIds.length})
          </Button>
          {selectedMovementIds.length >= 2 && (
            <Button 
              variant="default" 
              size="sm"
              onClick={onGroupSelected}
              disabled={isGrouping}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Group className="mr-2 h-4 w-4" /> Group Selected
            </Button>
          )}
        </>
      ) : (
        <>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onExport}
            disabled={isExporting}
          >
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onOpenFilter}
            className="relative"
          >
            <Filter className="mr-2 h-4 w-4" /> 
            Filter
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 text-xs flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onSelectAll}
          >
            <Rows className="mr-2 h-4 w-4" /> Select
          </Button>
        </>
      )}
    </div>
  );
};

export default MovementsActions;
