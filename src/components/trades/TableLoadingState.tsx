
import React from 'react';
import { Loader2 } from 'lucide-react';

const TableLoadingState: React.FC = () => {
  return (
    <div className="p-8 flex justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
};

export default TableLoadingState;
