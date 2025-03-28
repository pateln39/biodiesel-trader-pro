
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TableErrorStateProps {
  error: Error | string | null;
  onRetry?: () => void;
  message?: string;
}

const TableErrorState: React.FC<TableErrorStateProps> = ({ error, onRetry, message = "Failed to load data" }) => {
  return (
    <div className="p-8 flex flex-col items-center text-center space-y-4">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <div>
        <h3 className="font-medium">{message}</h3>
        <p className="text-muted-foreground text-sm">
          {error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error occurred'}
        </p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
};

export default TableErrorState;
