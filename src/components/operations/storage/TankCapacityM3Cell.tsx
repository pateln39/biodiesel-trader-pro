
import React from 'react';
import { Tank } from '@/hooks/useTanks';
import { TankUtilization } from '@/types/storage';
import TankUtilizationBar from './TankUtilizationBar';

interface TankCapacityM3CellProps {
  tank: Tank;
  utilization: TankUtilization;
}

const TankCapacityM3Cell: React.FC<TankCapacityM3CellProps> = ({
  tank,
  utilization
}) => {
  return (
    <>
      <div className="flex justify-between items-center px-2">
        <span>Capacity:</span>
        <div className="flex items-center">
          {tank.capacity_m3.toFixed(2)} M³
        </div>
      </div>
      <TankUtilizationBar utilization={utilization} type="m3" />
    </>
  );
};

export default TankCapacityM3Cell;
