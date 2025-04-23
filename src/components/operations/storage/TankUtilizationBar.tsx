
import React from 'react';
import { TankUtilization } from '@/types/storage';

interface TankUtilizationBarProps {
  utilization: TankUtilization;
  type: 'mt' | 'm3';
}

const TankUtilizationBar: React.FC<TankUtilizationBarProps> = ({ utilization, type }) => {
  const isMetricTons = type === 'mt';
  const utilizationValue = isMetricTons ? utilization.utilizationMT : utilization.utilizationM3;
  const currentValue = isMetricTons ? utilization.currentBalance : utilization.balanceM3;
  const barColor = isMetricTons ? 'bg-brand-lime' : 'bg-brand-blue';
  
  return (
    <>
      <div className="w-full bg-gray-700 rounded-full h-2 mt-1 mx-2">
        <div 
          className={`${barColor} h-2 rounded-full`} 
          style={{ width: `${Math.min(utilizationValue, 100)}%` }}
        ></div>
      </div>
      <div className="flex justify-between px-2 mt-1">
        <span className="text-[9px] text-muted-foreground">
          {isMetricTons ? Math.round(currentValue) : currentValue.toFixed(2)} {isMetricTons ? 'MT' : 'M³'}
        </span>
        <span className="text-[9px] text-muted-foreground">
          {Math.round(utilizationValue)}%
        </span>
      </div>
    </>
  );
};

export default TankUtilizationBar;
