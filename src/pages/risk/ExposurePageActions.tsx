
import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PaperExposureCleanupButton from '@/components/trades/PaperExposureCleanupButton';

interface ExposurePageActionsProps {
  onRefresh: () => void;
}

const ExposurePageActions: React.FC<ExposurePageActionsProps> = ({ onRefresh }) => {
  return (
    <div className="flex space-x-2">
      <Button variant="outline" size="sm" onClick={onRefresh}>
        <Download className="mr-2 h-3 w-3" /> Export
      </Button>
      <PaperExposureCleanupButton onCleanupComplete={onRefresh} />
    </div>
  );
};

export default ExposurePageActions;
