
import React from 'react';
import { Tank } from '@/hooks/useTanks';
import { LABELS } from '@/constants/StorageConstants';

interface SummaryHeaderSectionProps {
  tanks: Tank[];
}

/**
 * Component for displaying the summary sections in the table header
 */
const SummaryHeaderSection: React.FC<SummaryHeaderSectionProps> = ({ tanks }) => {
  const totalCapacityMT = Object.values(tanks).reduce((sum, tank) => sum + tank.capacity_mt, 0).toFixed(2);
  const totalCapacityM3 = Object.values(tanks).reduce((sum, tank) => sum + tank.capacity_m3, 0).toFixed(2);
  
  return (
    <>
      {/* Summary Column */}
      <th
        colSpan={1}
        className="text-center border-r border-white/30 bg-gradient-to-br from-brand-navy/90 to-brand-navy/70 text-white font-bold text-[10px]"
      >
        <div className="text-[10px] font-bold text-center w-full">
          {LABELS.SUMMARY}
        </div>
      </th>
      
      {/* Balance Columns */}
      <th
        colSpan={5}
        className="text-center border-r border-white/30 bg-gradient-to-br from-brand-navy/90 to-brand-navy/70 text-white font-bold text-[10px]"
      >
        <div className="text-[10px] font-bold text-center w-full">
          {LABELS.BALANCES}
        </div>
      </th>
      
      {/* Empty row for Tank Number */}
      <th
        colSpan={6}
        className="text-center text-[10px] border-r border-white/30"
      ></th>
      
      {/* Total Capacity in MT */}
      <th
        colSpan={6}
        className="text-[10px] border-r border-white/30"
      >
        <div className="flex items-center h-full px-2">
          <span>{LABELS.TOTAL_CAPACITY} {totalCapacityMT} MT</span>
        </div>
      </th>
      
      {/* Total Capacity in M³ */}
      <th
        colSpan={6}
        className="text-[10px] border-r border-white/30"
      >
        <div className="flex items-center h-full px-2">
          <span>{LABELS.TOTAL_CAPACITY} {totalCapacityM3} M³</span>
        </div>
      </th>
      
      {/* Empty rows for Spec and Heating */}
      <th
        colSpan={6}
        className="text-[10px] border-r border-white/30"
      ></th>
      
      <th
        colSpan={6}
        className="text-[10px] border-r border-white/30"
      ></th>
    </>
  );
};

export default SummaryHeaderSection;
