
import React, { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAvailableEfpMonths } from '@/utils/efpUtils';
import { createEfpFormula } from '@/utils/efpFormulaUtils';
import { LegFormState } from './PhysicalTradeForm';

interface EFPPricingFormProps {
  values: LegFormState;
  onChange: (field: keyof LegFormState, value: any) => void;
}

const EFPPricingForm: React.FC<EFPPricingFormProps> = ({
  values,
  onChange
}) => {
  const availableMonths = getAvailableEfpMonths();

  useEffect(() => {
    if (values.pricingType === 'efp') {
      const updatedFormula = createEfpFormula(
        values.quantity || 0,
        values.buySell,
        values.efpAgreedStatus,
        values.efpDesignatedMonth
      );
      
      onChange('formula', updatedFormula);
    }
  }, [values.pricingType, values.quantity, values.buySell, values.efpAgreedStatus, values.efpDesignatedMonth]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="efpPremium">EFP Premium</Label>
          <Input id="efpPremium" type="number" value={values.efpPremium || ""} onChange={e => onChange("efpPremium", e.target.value ? Number(e.target.value) : null)} />
        </div>
        
        <div className="flex items-center space-x-2 pt-6">
          <Switch id="efpAgreedStatus" checked={values.efpAgreedStatus} onCheckedChange={checked => onChange("efpAgreedStatus", checked)} />
          <Label htmlFor="efpAgreedStatus">EFP Agreed/Fixed</Label>
        </div>
        
        {values.efpAgreedStatus ? (
          <div>
            <Label htmlFor="efpFixedValue">Fixed Value</Label>
            <Input id="efpFixedValue" type="number" value={values.efpFixedValue || ""} onChange={e => onChange("efpFixedValue", e.target.value ? Number(e.target.value) : null)} />
          </div>
        ) : (
          <div>
            <Label htmlFor="efpDesignatedMonth">Designated Month</Label>
            <Select value={values.efpDesignatedMonth} onValueChange={value => onChange("efpDesignatedMonth", value)}>
              <SelectTrigger id="efpDesignatedMonth">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map(month => <SelectItem key={month} value={month}>{month}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
};

export default EFPPricingForm;
