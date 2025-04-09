
import React from 'react';
import { PricingType } from '@/types';
import { formulaToDisplayString } from '@/utils/formulaUtils';

interface FormulaCellDisplayProps {
  tradeId: string;
  legId: string;
  formula?: any;
  pricingType?: PricingType;
  efpPremium?: number;
  efpDesignatedMonth?: string;
  efpAgreedStatus?: boolean;
  efpFixedValue?: number;
  efpFormulaDisplay?: string;
}

const FormulaCellDisplay: React.FC<FormulaCellDisplayProps> = ({ 
  tradeId, 
  legId, 
  formula, 
  pricingType,
  efpPremium,
  efpAgreedStatus,
  efpFixedValue,
  efpDesignatedMonth,
  efpFormulaDisplay
}) => {
  // For EFP trades, first check if we have the pre-rendered formula display
  if (pricingType === 'efp') {
    // Use the pre-rendered formula if available
    if (efpFormulaDisplay) {
      return (
        <div className="max-w-[300px] overflow-hidden">
          <span 
            className="text-sm font-mono hover:bg-muted px-1 py-0.5 rounded" 
            title={efpFormulaDisplay}
          >
            {efpFormulaDisplay}
          </span>
        </div>
      );
    }
    
    // Fall back to the dynamic calculation if needed
    let displayText = '';
    
    if (efpAgreedStatus) {
      // For agreed EFP trades, show the calculated total value
      const fixedValue = efpFixedValue || 0;
      const premium = efpPremium || 0;
      displayText = `${fixedValue + premium}`;
    } else {
      // For unagreed EFP trades, show "ICE GASOIL FUTURES (EFP) + premium"
      displayText = `ICE GASOIL FUTURES (EFP) + ${efpPremium || 0}`;
    }
    
    return (
      <div className="max-w-[300px] overflow-hidden">
        <span 
          className="text-sm font-mono hover:bg-muted px-1 py-0.5 rounded" 
          title={displayText}
        >
          {displayText}
        </span>
      </div>
    );
  }
  
  // For standard trades, use the existing formula display logic
  if (!formula || !formula.tokens || formula.tokens.length === 0) {
    return <span className="text-muted-foreground italic">No formula</span>;
  }
  
  const displayText = formulaToDisplayString(formula.tokens);
  
  return (
    <div className="max-w-[300px] overflow-hidden">
      <span 
        className="text-sm font-mono hover:bg-muted px-1 py-0.5 rounded" 
        title={displayText}
      >
        {displayText}
      </span>
    </div>
  );
};

export default FormulaCellDisplay;
