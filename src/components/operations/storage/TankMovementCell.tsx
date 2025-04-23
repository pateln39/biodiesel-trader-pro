
import React from 'react';
import EditableNumberField from './EditableNumberField';
import { TankMovement } from '@/hooks/useInventoryState';

interface TankMovementCellProps {
  tankMovement?: TankMovement;
  movementId: string;
  tankId: string;
  tankProduct: string;
  updateTankMovement: (movementId: string, tankId: string, quantity: number) => void;
}

const TankMovementCell: React.FC<TankMovementCellProps> = ({
  tankMovement,
  movementId,
  tankId,
  tankProduct,
  updateTankMovement
}) => {
  return (
    <div className="flex justify-center">
      <EditableNumberField
        initialValue={tankMovement?.quantity_mt || 0}
        onSave={(value) => updateTankMovement(movementId, tankId, value)}
        className="text-[10px] w-16"
        product={tankMovement?.product_at_time || tankProduct}
      />
    </div>
  );
};

export default TankMovementCell;
