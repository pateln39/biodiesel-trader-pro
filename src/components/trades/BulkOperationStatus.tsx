
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { useBulkOperationStore } from '@/utils/bulkOperationManager';
import { getSubscriptionStatus } from '@/utils/paperTradeSubscriptionUtils';

const BulkOperationStatus: React.FC = () => {
  const { isBulkMode, activeBulkOperations } = useBulkOperationStore();
  const subscriptionStatus = getSubscriptionStatus();
  
  // Don't show anything if subscriptions are active
  if (!subscriptionStatus.paused) {
    return null;
  }
  
  const getStatusIcon = () => {
    switch (subscriptionStatus.reason) {
      case 'bulk_operation':
        return <Clock className="h-4 w-4 animate-spin" />;
      case 'cooldown':
        return <CheckCircle className="h-4 w-4" />;
      case 'circuit_breaker':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };
  
  const getVariant = () => {
    switch (subscriptionStatus.reason) {
      case 'circuit_breaker':
        return 'destructive';
      case 'cooldown':
        return 'default';
      default:
        return 'default';
    }
  };

  const getMessage = () => {
    switch (subscriptionStatus.reason) {
      case 'bulk_operation':
        return subscriptionStatus.message;
      case 'cooldown':
        return 'Upload completed successfully! Please refresh your browser (F5 or Ctrl+R) to see the latest data.';
      case 'circuit_breaker':
        return subscriptionStatus.message;
      default:
        return subscriptionStatus.message;
    }
  };
  
  return (
    <Alert variant={getVariant()} className="mb-4">
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <div>
          <AlertDescription>
            {getMessage()}
            {isBulkMode && activeBulkOperations.size > 0 && (
              <span className="ml-2 text-xs opacity-75">
                ({activeBulkOperations.size} operation{activeBulkOperations.size !== 1 ? 's' : ''} active)
              </span>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};

export default BulkOperationStatus;
