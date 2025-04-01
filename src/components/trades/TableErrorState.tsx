
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TableErrorStateProps {
  error: Error | null;
  onRetry: () => void;
}

const TableErrorState: React.FC<TableErrorStateProps> = ({ error, onRetry }) => {
  return (
    <div className="p-8 flex flex-col items-center text-center space-y-4">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <div>
        <h3 className="font-medium">Failed to load trades</h3>
        <p className="text-muted-foreground text-sm">
          {error instanceof Error ? error.message : 'Unknown error occurred'}
        </p>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onRetry}
        className="bg-brand-navy text-white hover:bg-brand-blue"
      >
        Try Again
      </Button>
    </div>
  );
};

export default TableErrorState;
