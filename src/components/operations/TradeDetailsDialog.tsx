
  // Update the function to accept either PhysicalTrade or PhysicalTradeLeg
  const getEfpFormulaDisplay = (item: PhysicalTrade | PhysicalTradeLeg) => {
    if ('pricingType' in item && item.pricingType !== 'efp') return null;
    
    if ('efpAgreedStatus' in item && item.efpAgreedStatus) {
      // For agreed EFP, return empty as requested
      return '';
    } else {
      // For unagreed EFP, show "ICE GASOIL FUTURES (EFP) + premium"
      const efpPremium = 'efpPremium' in item ? item.efpPremium || 0 : 0;
      return `ICE GASOIL FUTURES (EFP) + ${efpPremium}`;
    }
  };
