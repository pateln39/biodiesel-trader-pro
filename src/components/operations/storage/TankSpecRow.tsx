
import React from 'react';
import { Tank } from '@/hooks/useTanks';
import { Thermometer } from 'lucide-react';
import EditableField from './EditableField';
import EditableDropdownField from './EditableDropdownField';

interface TankSpecRowProps {
  tank: Tank;
  updateTankSpec: (tankId: string, spec: string) => void;
  updateTankHeating: (tankId: string, isHeatingEnabled: boolean | string) => void;
  heatingOptions: { label: string; value: string }[];
  isSpecRow?: boolean;
}

const TankSpecRow: React.FC<TankSpecRowProps> = ({
  tank,
  updateTankSpec,
  updateTankHeating,
  heatingOptions,
  isSpecRow = true
}) => {
  if (isSpecRow) {
    return (
      <div className="flex justify-between px-2">
        <span className="text-muted-foreground">Spec:</span>
        <EditableField
          initialValue={tank.spec}
          onSave={(value) => updateTankSpec(tank.id, value)}
          className="text-[10px]"
          maxWidth={100}
        />
      </div>
    );
  } else {
    return (
      <div className="flex justify-between px-2">
        <span className="text-muted-foreground">Heating:</span>
        <div className="flex items-center">
          <Thermometer className="h-3 w-3 mr-1 text-red-400" />
          <EditableDropdownField
            initialValue={tank.is_heating_enabled ? "true" : "false"}
            options={heatingOptions}
            onSave={(value) => updateTankHeating(tank.id, value)}
            className="text-[10px]"
            truncate={false}
          />
        </div>
      </div>
    );
  }
};

export default TankSpecRow;
