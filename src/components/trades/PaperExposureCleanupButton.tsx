
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cleanupPaperTradePhysicalExposures } from '@/utils/paperTradeExposureCleanup';

interface PaperExposureCleanupButtonProps {
  onCleanupComplete?: () => void;
}

const PaperExposureCleanupButton: React.FC<PaperExposureCleanupButtonProps> = ({ 
  onCleanupComplete 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCleanup = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const result = await cleanupPaperTradePhysicalExposures();
      
      if (result.success) {
        toast.success(result.message);
        if (onCleanupComplete) {
          onCleanupComplete();
        }
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error(`Clean-up failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button 
      variant="destructive" 
      size="sm" 
      onClick={handleCleanup}
      disabled={isProcessing}
      className="ml-2"
    >
      <Trash2 className="mr-2 h-4 w-4" />
      {isProcessing ? 'Cleaning up...' : 'Remove Physical Exposures from Paper Trades'}
    </Button>
  );
};

export default PaperExposureCleanupButton;
