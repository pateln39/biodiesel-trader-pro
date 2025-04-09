
import React, { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAvailableEfpMonths } from '@/utils/efpUtils';
import { generateEfpFormulaDisplay } from '@/utils/efpFormulaUtils';

interface EFPPricingFormProps {
  values: {
    efpPremium: number | null;
    efpAgreedStatus: boolean;
    efpFixedValue: number | null;
    efpDesignatedMonth: string;
  };
  onChange: <K extends keyof typeof values>(field: K, value: any) => void;
}

const EFPPricingForm: React.FC<EFPPricingFormProps> = ({
  values,
  onChange
}) => {
  const availableMonths = getAvailableEfpMonths();

  useEffect(() => {
    // Generate and update the formula display whenever EFP values change
    const formulaDisplay = generateEfpFormulaDisplay(
      values.efpAgreedStatus,
      values.efpFixedValue,
      values.efpPremium,
      values.efpDesignatedMonth
    );
    
    onChange('efpFormulaDisplay' as any, formulaDisplay);
  }, [values.efpPremium, values.efpAgreedStatus, values.efpFixedValue, values.efpDesignatedMonth]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="efpPremium">EFP Premium</Label>
          <Input 
            id="efpPremium" 
            type="number" 
            value={values.efpPremium || ""} 
            onChange={e => onChange("efpPremium", e.target.value ? Number(e.target.value) : null)} 
          />
        </div>
        
        <div className="flex items-center space-x-2 pt-6">
          <Switch 
            id="efpAgreedStatus" 
            checked={values.efpAgreedStatus} 
            onCheckedChange={checked => onChange("efpAgreedStatus", checked)} 
          />
          <Label htmlFor="efpAgreedStatus">EFP Agreed/Fixed</Label>
        </div>
        
        {values.efpAgreedStatus ? (
          <div>
            <Label htmlFor="efpFixedValue">Fixed Value</Label>
            <Input 
              id="efpFixedValue" 
              type="number" 
              value={values.efpFixedValue || ""} 
              onChange={e => onChange("efpFixedValue", e.target.value ? Number(e.target.value) : null)} 
            />
          </div>
        ) : (
          <div>
            <Label htmlFor="efpDesignatedMonth">Designated Month</Label>
            <Select 
              value={values.efpDesignatedMonth} 
              onValueChange={value => onChange("efpDesignatedMonth", value)}
            >
              <SelectTrigger id="efpDesignatedMonth">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map(month => (
                  <SelectItem key={month} value={month}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
};

export default EFPPricingForm;
