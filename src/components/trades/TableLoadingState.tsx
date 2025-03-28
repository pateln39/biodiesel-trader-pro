
import React from 'react';
import { Loader2 } from 'lucide-react';

interface TableLoadingStateProps {
  message?: string;
}

const TableLoadingState: React.FC<TableLoadingStateProps> = ({ message = "Loading..." }) => {
  return (
    <div className="p-8 flex justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
};

export default TableLoadingState;
