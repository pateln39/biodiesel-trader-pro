
import React from 'react';
import { Tank } from '@/hooks/useTanks';
import { TankUtilization } from '@/types/storage';
import TankHeaderCell from './TankHeaderCell';
import TankCapacityM3Cell from './TankCapacityM3Cell';
import TankSpecRow from './TankSpecRow';
import { STYLING } from '@/constants/StorageConstants';
import EditableField from './EditableField';
import EditableDropdownField from './EditableDropdownField';

interface TankHeaderSectionProps {
  tanks: Tank[];
  calculateTankUtilization: (tank: Tank) => TankUtilization;
  updateTankCapacity: (tankId: string, capacityMt: number) => void;
  updateTankSpec: (tankId: string, spec: string) => void;
  updateTankHeating: (tankId: string, isHeatingEnabled: boolean | string) => void;
  updateTankNumber: (tankId: string, tankNumber: string) => void;
  updateTankProduct: (tankId: string, product: string) => void;
  productOptions: { label: string; value: string }[];
  heatingOptions: { label: string; value: string }[];
  PRODUCT_COLORS: Record<string, string>;
}

/**
 * Component for displaying all tank header information
 */
const TankHeaderSection: React.FC<TankHeaderSectionProps> = ({
  tanks,
  calculateTankUtilization,
  updateTankCapacity,
  updateTankSpec,
  updateTankHeating,
  updateTankNumber,
  updateTankProduct,
  productOptions,
  heatingOptions,
  PRODUCT_COLORS,
}) => {
  return (
    <>
      {/* Product Headers */}
      {tanks.map((tank) => (
        <th
          key={`${tank.id}-header`}
          colSpan={3}
          className="text-center border-r border-white/30 bg-gradient-to-br from-brand-navy/90 to-brand-navy/70 text-white font-bold text-[10px]"
        >
          <EditableDropdownField
            initialValue={tank.current_product}
            options={productOptions}
            onSave={(value) => updateTankProduct(tank.id, value)}
            className={`${STYLING.HEADER_FONT_SIZE} font-bold text-center w-full ${PRODUCT_COLORS[tank.current_product]?.split(' ')[0]}`}
            truncate={false}
          />
        </th>
      ))}

      {/* Tank Numbers */}
      {tanks.map((tank) => (
        <th
          key={`${tank.id}-tank-number`}
          colSpan={3}
          className="text-center text-[10px] border-r border-white/30"
        >
          <div className="flex items-center justify-center">
            <span className="mr-1">Tank</span>
            <EditableField
              initialValue={tank.tank_number}
              onSave={(value) => updateTankNumber(tank.id, value)}
              className="text-[10px] text-center"
              truncate={false}
            />
          </div>
        </th>
      ))}

      {/* MT Capacity */}
      {tanks.map((tank) => (
        <th
          key={`${tank.id}-capacity`}
          colSpan={3}
          className="text-[10px] border-r border-white/30"
        >
          <TankHeaderCell
            tank={tank}
            utilization={calculateTankUtilization(tank)}
            updateTankCapacity={updateTankCapacity}
            headerFontSize={STYLING.HEADER_FONT_SIZE}
          />
        </th>
      ))}

      {/* M³ Capacity */}
      {tanks.map((tank) => (
        <th
          key={`${tank.id}-capacity-m3`}
          colSpan={3}
          className="text-[10px] border-r border-white/30"
        >
          <TankCapacityM3Cell
            tank={tank}
            utilization={calculateTankUtilization(tank)}
          />
        </th>
      ))}

      {/* Spec */}
      {tanks.map((tank) => (
        <th
          key={`${tank.id}-spec`}
          colSpan={3}
          className="text-[10px] border-r border-white/30"
        >
          <TankSpecRow
            tank={tank}
            updateTankSpec={updateTankSpec}
            updateTankHeating={updateTankHeating}
            heatingOptions={heatingOptions}
            isSpecRow={true}
          />
        </th>
      ))}

      {/* Heating */}
      {tanks.map((tank) => (
        <th
          key={`${tank.id}-heating`}
          colSpan={3}
          className="text-[10px] border-r border-white/30"
        >
          <TankSpecRow
            tank={tank}
            updateTankSpec={updateTankSpec}
            updateTankHeating={updateTankHeating}
            heatingOptions={heatingOptions}
            isSpecRow={false}
          />
        </th>
      ))}
    </>
  );
};

export default TankHeaderSection;
