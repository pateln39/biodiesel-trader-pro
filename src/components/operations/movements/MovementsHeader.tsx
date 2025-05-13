
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface MovementsHeaderProps {
  onRefresh: () => void;
}

const MovementsHeader: React.FC<MovementsHeaderProps> = ({ onRefresh }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold tracking-tight">Movements</h1>
      <Button onClick={onRefresh} variant="outline" size="sm">
        <RefreshCw className="mr-2 h-4 w-4" />
        Refresh Data
      </Button>
    </div>
  );
};

export default MovementsHeader;
