
import React from 'react';
import { Loader2 } from 'lucide-react';

interface TableLoadingStateProps {
  message?: string;
}

const TableLoadingState: React.FC<TableLoadingStateProps> = ({ message = "Loading..." }) => {
  return (
    <div className="p-8 flex flex-col items-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
};

export default TableLoadingState;
