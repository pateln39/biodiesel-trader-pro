import React from 'react';
import { cn } from '@/lib/utils';
import { TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Movement, MovementSummary } from '@/types';
import { TankMovement } from '@/hooks/useInventoryState';
import { Tank } from '@/hooks/useTanks';
import TankMovementCell from './TankMovementCell';
import MovementQuantityIndicator from './MovementQuantityIndicator';

interface ScrollableTableBodyProps {
  sortedMovements: Movement[];
  tanks: Tank[];
  tankMovements: TankMovement[];
  getMovementRowBgClass: (buySell?: string) => string;
  getSummaryForMovement: (movementId: string) => MovementSummary;
  updateTankMovement: (movementId: string, tankId: string, quantity: number) => void;
}

/**
 * Component for the scrollable body section of the table
 */
const ScrollableTableBody: React.FC<ScrollableTableBodyProps> = ({
  sortedMovements,
  tanks,
  tankMovements,
  getMovementRowBgClass,
  getSummaryForMovement,
  updateTankMovement
}) => {
  return (
    <TableBody>
      {sortedMovements.map((movement) => {
        const bgColorClass = getMovementRowBgClass(movement.buy_sell);
        const movementSummary = getSummaryForMovement(movement.id);
        
        return (
          <TableRow 
            key={`scroll-${movement.id}`} 
            className={cn("border-b border-white/5 h-10", bgColorClass)}
          >
            {tanks.map((tank) => {
              const tankMovement = tankMovements.find(
                tm => tm.movement_id === movement.id && tm.tank_id === tank.id
              );
              
              return (
                <React.Fragment key={`${movement.id}-${tank.id}`}>
                  <TableCell className="text-center text-[10px] py-2">
                    <TankMovementCell
                      tankMovement={tankMovement}
                      movementId={movement.id}
                      tankId={tank.id}
                      tankProduct={tank.current_product}
                      updateTankMovement={updateTankMovement}
                    />
                  </TableCell>
                  <TableCell className="text-center text-[10px] py-2">
                    {tankMovement?.quantity_m3 ? (tankMovement.quantity_m3).toFixed(2) : '0.00'}
                  </TableCell>
                  <TableCell className="text-center text-[10px] py-2 bg-brand-navy border-r border-white/30">
                    {movementSummary.tankBalances[tank.id]?.balanceMT || 0}
                  </TableCell>
                </React.Fragment>
              );
            })}
            
            {/* Summary cells */}
            <TableCell className="text-center text-[10px] py-2">
              <MovementQuantityIndicator 
                totalMTMoved={movementSummary.totalMTMoved}
                assignmentQuantity={movement.assignment_quantity || 0}
              />
            </TableCell>
            <TableCell className="text-center text-[10px] py-2">
              {(movementSummary.totalMTMoved * 1.1).toFixed(2)}
            </TableCell>
            <TableCell className="text-center text-[10px] py-2 font-medium text-green-400">
              {Math.round(movementSummary.t1Balance)}
            </TableCell>
            <TableCell className="text-center text-[10px] py-2 font-medium text-blue-400">
              {Math.round(movementSummary.t2Balance)}
            </TableCell>
            <TableCell className="text-center text-[10px] py-2 font-medium">
              {Math.round(movementSummary.currentStockMT)}
            </TableCell>
            <TableCell className="text-center text-[10px] py-2 font-medium border-r border-white/30">
              {Math.round(movementSummary.currentUllage)}
            </TableCell>
            <TableCell className="text-center text-[10px] py-2 font-medium border-r border-white/30">
              {Math.round(movementSummary.totalMTMoved - (movement.assignment_quantity || 0))}
            </TableCell>
          </TableRow>
        );
      })}
    </TableBody>
  );
};

export default ScrollableTableBody;
