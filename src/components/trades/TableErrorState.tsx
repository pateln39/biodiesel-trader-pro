
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TableErrorStateProps {
  error?: Error | null;
  onRetry: () => void;
  title?: string;
  message?: string;
}

const TableErrorState: React.FC<TableErrorStateProps> = ({ 
  error, 
  onRetry, 
  title = "Failed to load trades",
  message
}) => {
  return (
    <div className="p-8 flex flex-col items-center text-center space-y-4">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-muted-foreground text-sm">
          {message || (error instanceof Error ? error.message : 'Unknown error occurred')}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try Again
      </Button>
    </div>
  );
};

export default TableErrorState;
