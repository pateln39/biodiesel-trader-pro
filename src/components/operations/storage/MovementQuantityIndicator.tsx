
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface MovementQuantityIndicatorProps {
  totalMTMoved: number;
  assignmentQuantity: number;
}

const MovementQuantityIndicator: React.FC<MovementQuantityIndicatorProps> = ({
  totalMTMoved,
  assignmentQuantity
}) => {
  const roundedMTMoved = Math.round(totalMTMoved);
  const roundedAssignmentQty = Math.round(assignmentQuantity || 0);
  
  return (
    <div className="flex items-center justify-center space-x-1">
      <span>{roundedMTMoved}</span>
      {roundedMTMoved !== roundedAssignmentQty && (
        <Badge 
          variant="outline" 
          className="bg-yellow-100 text-yellow-800 border-yellow-300 px-1 py-0 text-[8px] rounded-full"
        >
          !
        </Badge>
      )}
    </div>
  );
};

export default MovementQuantityIndicator;
