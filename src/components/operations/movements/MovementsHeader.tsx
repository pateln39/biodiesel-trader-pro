
import React from 'react';
import { Button } from '@/components/ui/button';

interface MovementsHeaderProps {
  onRefresh: () => void;
}

const MovementsHeader: React.FC<MovementsHeaderProps> = ({ onRefresh }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold tracking-tight">Movements</h1>
      <Button onClick={onRefresh}>
        Refresh Data
      </Button>
    </div>
  );
};

export default MovementsHeader;
