
import React from 'react';
import { PhysicalTrade, PhysicalTradeLeg } from '@/types';
import { formulaToDisplayString } from '@/utils/formulaUtils';

interface FormulaCellDisplayProps {
  trade: PhysicalTrade | PhysicalTradeLeg;
}

const FormulaCellDisplay: React.FC<FormulaCellDisplayProps> = ({ trade }) => {
  // For EFP trades, show a special formula representation
  if ('efpPremium' in trade && trade.efpPremium !== undefined) {
    const baseText = trade.efpAgreedStatus 
      ? `${trade.efpFixedValue || 0} + ${trade.efpPremium}` 
      : `ICE GASOIL FUTURES (${trade.efpDesignatedMonth || ''}) + ${trade.efpPremium}`;
    
    return (
      <div className="max-w-[300px] overflow-hidden">
        <span 
          className="text-sm font-mono hover:bg-muted px-1 py-0.5 rounded" 
          title={baseText}
        >
          {baseText}
        </span>
      </div>
    );
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
