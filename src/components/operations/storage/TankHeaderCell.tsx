
import React from 'react';
import { cn } from '@/lib/utils';
import { Database } from 'lucide-react';
import { TankUtilization } from '@/types/storage';
import { Tank } from '@/hooks/useTanks';
import EditableNumberField from './EditableNumberField';
import TankUtilizationBar from './TankUtilizationBar';

interface TankHeaderCellProps {
  tank: Tank;
  utilization: TankUtilization;
  updateTankCapacity: (tankId: string, capacityMt: number) => void;
  headerFontSize: string;
}

const TankHeaderCell: React.FC<TankHeaderCellProps> = ({
  tank,
  utilization,
  updateTankCapacity,
  headerFontSize
}) => {
  return (
    <>
      <div className="flex justify-between items-center px-2">
        <span>Capacity:</span>
        <div className="flex items-center">
          <EditableNumberField
            initialValue={tank.capacity_mt}
            onSave={(value) => updateTankCapacity(tank.id, value)}
            className={`${headerFontSize} w-20`}
          /> MT
          <Database className="h-3 w-3 text-brand-lime/70 ml-2" />
        </div>
      </div>
      <TankUtilizationBar utilization={utilization} type="mt" />
    </>
  );
};

export default TankHeaderCell;
