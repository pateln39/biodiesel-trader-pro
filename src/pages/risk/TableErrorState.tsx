
import React from 'react';
import { AlertCircle } from 'lucide-react';

export interface TableErrorStateProps {
  message: string;
  error?: Error;
}

const TableErrorState: React.FC<TableErrorStateProps> = ({ message, error }) => {
  return (
    <div className="w-full p-6 flex flex-col items-center justify-center text-center">
      <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
      <h3 className="text-lg font-medium text-gray-900 mb-1">Error Loading Data</h3>
      <p className="text-sm text-gray-500 mb-4">{message}</p>
      {error && (
        <div className="bg-red-50 p-3 rounded-md text-xs text-red-800 max-w-md overflow-auto text-left">
          <pre>{error.message}</pre>
        </div>
      )}
    </div>
  );
};

export default TableErrorState;
