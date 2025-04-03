
import React from 'react';
import { PhysicalTrade, PhysicalTradeLeg, PricingType } from '@/types';
import { formulaToDisplayString } from '@/utils/formulaUtils';

interface FormulaCellDisplayProps {
  tradeId: string;
  legId: string;
  formula?: any;
  pricingType?: PricingType;
}

const FormulaCellDisplay: React.FC<FormulaCellDisplayProps> = ({ tradeId, legId, formula, pricingType }) => {
  // For EFP trades, show a special formula representation
  if (pricingType === 'efp') {
    // This component is now receiving props directly instead of a full trade object
    // We can't access efpPremium, etc. here anymore, so we'll display a simple text
    return (
      <div className="max-w-[300px] overflow-hidden">
        <span 
          className="text-sm font-mono hover:bg-muted px-1 py-0.5 rounded" 
          title="EFP Formula"
        >
          EFP
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
