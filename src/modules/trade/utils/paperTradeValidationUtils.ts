
import { toast } from 'sonner';
import { PaperTrade } from '@/modules/trade/types/paper';

/**
 * Validate a paper trade form
 */
export const validatePaperTradeForm = (formData: Partial<PaperTrade>): boolean => {
  // Validate broker
  if (!formData.broker) {
    toast.error('Missing broker', {
      description: 'Please select a broker for this trade.'
    });
    return false;
  }
  
  // Validate legs
  if (!formData.legs || formData.legs.length === 0) {
    toast.error('No trade legs', {
      description: 'At least one trade leg is required.'
    });
    return false;
  }
  
  // For each leg, validate required fields
  for (let i = 0; i < formData.legs.length; i++) {
    const leg = formData.legs[i];
    const legNumber = i + 1;
    
    if (!leg.product) {
      toast.error(`Missing product in leg ${legNumber}`, {
        description: 'Please select a product for each trade leg.'
      });
      return false;
    }
    
    if (!leg.buySell) {
      toast.error(`Missing buy/sell in leg ${legNumber}`, {
        description: 'Please specify buy or sell for each trade leg.'
      });
      return false;
    }
    
    if (!leg.quantity || leg.quantity <= 0) {
      toast.error(`Invalid quantity in leg ${legNumber}`, {
        description: 'Please enter a valid positive quantity for each trade leg.'
      });
      return false;
    }
    
    if (!leg.period) {
      toast.error(`Missing period in leg ${legNumber}`, {
        description: 'Please select a trading period for each leg.'
      });
      return false;
    }
  }
  
  return true;
};

/**
 * Check if legs are properly paired (for DIFF and SPREAD trades)
 */
export const validatePaperTradePairing = (formData: Partial<PaperTrade>): boolean => {
  if (!formData.legs || formData.legs.length === 0) return false;
  
  for (let i = 0; i < formData.legs.length; i++) {
    const leg = formData.legs[i];
    
    if (leg.relationshipType === 'DIFF' || leg.relationshipType === 'SPREAD') {
      if (!leg.rightSide || !leg.rightSide.product) {
        toast.error(`Incomplete pairing in leg ${i + 1}`, {
          description: `${leg.relationshipType} trades require a paired product.`
        });
        return false;
      }
    }
  }
  
  return true;
};
