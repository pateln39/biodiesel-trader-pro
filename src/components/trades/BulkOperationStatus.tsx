
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BulkOperationStatusProps {
  onRefresh?: () => void;
}

const BulkOperationStatus: React.FC<BulkOperationStatusProps> = ({ onRefresh }) => {
  return (
    <Alert className="border-blue-200 bg-blue-50">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800 flex items-center justify-between">
        <span>If you've just completed a bulk upload, please refresh to see the latest trades.</span>
        {onRefresh && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            className="ml-4 h-8"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default BulkOperationStatus;
