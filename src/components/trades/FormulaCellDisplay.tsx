
import React from 'react';
import { PhysicalTrade, PhysicalTradeLeg, PricingType } from '@/types';
import { formulaToDisplayString } from '@/utils/formulaUtils';

interface FormulaCellDisplayProps {
  trade: PhysicalTrade | PhysicalTradeLeg;
}

const FormulaCellDisplay: React.FC<FormulaCellDisplayProps> = ({ trade }) => {
  // For EFP trades, use the pre-rendered formula if available
  if ((trade as PhysicalTradeLeg).pricingType === 'efp') {
    // Use the pre-rendered formula display if available
    if ('efpFormulaDisplay' in trade && trade.efpFormulaDisplay) {
      return (
        <div className="max-w-[300px] overflow-hidden">
          <span 
            className="text-sm font-mono hover:bg-muted px-1 py-0.5 rounded" 
            title={trade.efpFormulaDisplay}
          >
            {trade.efpFormulaDisplay}
          </span>
        </div>
      );
    }
    
    // Fall back to the legacy approach if pre-rendered formula is not available
    if ('efpPremium' in trade && trade.efpPremium !== undefined) {
      let displayText = '';
      
      if (trade.efpAgreedStatus) {
        // For agreed EFP trades, show the calculated total value
        const fixedValue = trade.efpFixedValue || 0;
        const premium = trade.efpPremium || 0;
        displayText = `${fixedValue + premium}`;
      } else {
        // For unagreed EFP trades, show "ICE GASOIL FUTURES (EFP) + premium"
        const designatedMonth = trade.efpDesignatedMonth ? ` (${trade.efpDesignatedMonth})` : '';
        displayText = `ICE GASOIL FUTURES${designatedMonth} + ${trade.efpPremium}`;
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
  }
  
  // For standard trades, use the existing formula display logic
  if (!trade.formula || !trade.formula.tokens || trade.formula.tokens.length === 0) {
    return <span className="text-muted-foreground italic">No formula</span>;
  }
  
  const displayText = formulaToDisplayString(trade.formula.tokens);
  
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
