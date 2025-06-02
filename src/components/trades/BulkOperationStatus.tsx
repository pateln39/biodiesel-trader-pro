
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const BulkOperationStatus: React.FC = () => {
  return (
    <Alert className="border-blue-200 bg-blue-50">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800">
        If you've just completed a bulk upload, please refresh the page to see the latest trades.
      </AlertDescription>
    </Alert>
  );
};

export default BulkOperationStatus;
