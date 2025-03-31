
import React from 'react';
import { PhysicalTrade, PhysicalTradeLeg } from '@/types';
import { formulaToDisplayString } from '@/utils/formulaUtils';

interface FormulaCellDisplayProps {
  trade: PhysicalTrade | PhysicalTradeLeg;
}

const FormulaCellDisplay: React.FC<FormulaCellDisplayProps> = ({ trade }) => {
  // If this is an EFP trade, display special EFP formula
  if ('efpPremium' in trade && trade.efpPremium !== undefined) {
    if (trade.efpAgreedStatus && trade.efpFixedValue !== undefined) {
      // Agreed EFP with fixed value
      return (
        <div className="max-w-[300px] overflow-hidden">
          <span 
            className="text-sm font-mono hover:bg-muted px-1 py-0.5 rounded" 
            title={`${trade.efpFixedValue} + ${trade.efpPremium} (Fixed EFP)`}
          >
            {`${trade.efpFixedValue} + ${trade.efpPremium} (Fixed EFP)`}
          </span>
        </div>
      );
    } else {
      // Unagreed EFP
      return (
        <div className="max-w-[300px] overflow-hidden">
          <span 
            className="text-sm font-mono hover:bg-muted px-1 py-0.5 rounded" 
            title={`ICE GASOIL FUTURES (EFP) + ${trade.efpPremium}`}
          >
            {`ICE GASOIL FUTURES (EFP) + ${trade.efpPremium}`}
          </span>
        </div>
      );
    }
  }
  
  // Standard formula display
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
